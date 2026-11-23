#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { basename, resolve } from 'node:path';
import { parseArgs } from 'citty';
import { cancel, confirm as clackConfirm, intro, isCancel, log, outro, select, spinner, text } from '@clack/prompts';
import { abortInitialization, approveCurrentGate, auditProject, getAgentHandoff, getBriefingProgress, getContext, getNext, getStatus, initProject, isGitRepository, MawaError, rawBriefingPath, replaceRawBriefing, validateRawBriefing } from '../lib/project-core.mjs';
import { createNuxtConfigPatchProposal, createSetupPlan, doctorProject, executeSetupScaffold, listStackTemplates } from '../lib/stack-core.mjs';

function parse(argv) {
  const options = parseArgs(argv, {
    yes: { type: 'boolean' }, help: { type: 'boolean', alias: 'h' }, json: { type: 'boolean' }, stdin: { type: 'boolean' },
    'init-git': { type: 'boolean' }, 'append-agents': { type: 'boolean' }, debug: { type: 'boolean' }, 'start-codex': { type: 'boolean' },
    name: { type: 'string' }, language: { type: 'string' }, brief: { type: 'string' }, root: { type: 'string' }, comment: { type: 'string' },
    stack: { type: 'string' }, 'app-root': { type: 'string' }, 'template-language': { type: 'string' }, prefix: { type: 'string' },
  });
  return { positionals: options._, options };
}

function usage() {
  console.log(`MAWA — MAWA Advances Work Accountably\n\nCommands:\n  mawa init [directory]\n  mawa intake\n  mawa status\n  mawa next\n  mawa briefing\n  mawa context [--json]\n  mawa handoff [--start-codex]\n  mawa approve [--comment TEXT] [--start-codex]\n  mawa abort\n  mawa doctor [--stack ID] [--app-root PATH]\n  mawa setup [--stack ID] [--app-root PATH] [--template-language pug|html]\n  mawa setup patch\n  mawa setup apply\n  mawa stack list\n  mawa audit\n\nUse --json for machine-readable output.\n`);
}

function askInterface() { return createInterface({ input: stdin, output: stdout }); }
function promptValue(value) {
  if (!isCancel(value)) return value;
  cancel('Operação cancelada. Nenhum arquivo foi alterado.');
  throw new MawaError('Operation cancelled.', 'CANCELLED');
}
async function confirm(question, defaultYes = true) {
  return promptValue(await clackConfirm({ message: question, initialValue: defaultYes }));
}
async function choose(question, choices) {
  return promptValue(await select({ message: question, options: choices, initialValue: choices[0]?.value }));
}
async function answer(question, fallback) {
  return promptValue(await text({ message: question, initialValue: fallback }));
}
async function readTerminalBriefing() {
  console.log('Cole o raw briefing. Termine com uma linha contendo apenas :fim');
  const prompt = createInterface({ input: stdin, crlfDelay: Infinity });
  const lines = [];
  for await (const line of prompt) { if (line === ':fim') break; lines.push(line); }
  prompt.close();
  return lines.join('\n').trim();
}
function isInteractive(options) { return stdin.isTTY && !options.yes; }
function printError(error) {
  if (error instanceof MawaError && error.code === 'CANCELLED') return;
  if (error instanceof MawaError) {
    console.error(`\nMAWA bloqueou a operação: ${error.message}`);
    if (error.code === 'APPROVAL_BLOCKED') console.error('\nExecute “mawa next”, corrija o briefing e tente novamente.');
    return;
  }
  console.error(`\nErro inesperado: ${error.message}`);
}

async function initCommand(directory, options) {
  const root = resolve(directory || '.');
  let initializeGit = options['init-git'] === true;
  let name = options.name || basename(root);
  let language = options.language === 'en' ? 'en' : 'pt-BR';
  let source = options.brief ? 'import' : options.stdin ? 'terminal' : 'file';
  let appendAgents = options['append-agents'] === true;
  if (isInteractive(options)) {
    intro('MAWA — inicializar projeto');
    name = await answer('Nome do projeto', name);
    language = await choose('Idioma da documentação', [{ label: 'Português do Brasil', value: 'pt-BR' }, { label: 'English', value: 'en' }]);
    if (!isGitRepository(root)) initializeGit = await confirm('Este diretório não possui Git. Deseja inicializá-lo?', true);
    if (existsSync(resolve(root, 'AGENTS.md'))) appendAgents = await confirm('AGENTS.md já existe. Deseja adicionar um ponteiro curto para o contrato MAWA?', false);
    source = await choose('Como deseja iniciar o raw briefing?', [
      { label: 'Criar um arquivo Markdown para editar', value: 'file' },
      { label: 'Importar um arquivo Markdown existente', value: 'import' },
      { label: 'Colar texto no terminal', value: 'terminal' },
    ]);
    if (!await confirm(`Confirmar inicialização em ${root}?`, true)) return cancel('Inicialização cancelada. Nenhum arquivo foi alterado.');
  }
  let rawContent;
  if (source === 'import') {
    const sourcePath = options.brief || await answer('Caminho do arquivo de briefing', '');
    if (!sourcePath || !existsSync(resolve(sourcePath))) throw new MawaError('O arquivo de briefing informado não existe.', 'BRIEF_NOT_FOUND');
    rawContent = readFileSync(resolve(sourcePath), 'utf8');
  }
  if (source === 'terminal') rawContent = options.stdin ? readFileSync(0, 'utf8') : await readTerminalBriefing();
  const task = isInteractive(options) ? spinner() : null;
  task?.start('Criando contrato e documentação do projeto');
  const result = initProject(root, { name, language, rawContent, initializeGit, appendAgents });
  task?.stop('Projeto MAWA inicializado');
  if (isInteractive(options)) {
    log.info(`Raw Briefing: ${rawBriefingPath(root)}`);
    return rawBriefingMenu(root, options);
  }
  console.log(`\nProjeto MAWA inicializado.\n\nRaw briefing: ${rawBriefingPath(root)}\nEstado atual: ${result.state.currentStage}\n\nPróximo passo:\n1. Revise e complete o raw briefing.\n2. Execute “mawa next” para ver os critérios.\n3. Execute “mawa approve” somente quando estiver satisfeito.`);
}

async function intakeCommand(options) {
  const root = resolve(options.root || '.');
  const source = isInteractive(options) ? await choose('Como deseja atualizar o raw briefing?', [
    { label: 'Importar um arquivo Markdown existente', value: 'import' },
    { label: 'Colar texto no terminal', value: 'terminal' },
  ]) : options.brief ? 'import' : 'terminal';
  const current = existsSync(rawBriefingPath(root)) ? readFileSync(rawBriefingPath(root), 'utf8').trim() : '';
  if (current && isInteractive(options) && !await confirm('Substituir o raw briefing atual?', false)) return cancel('Atualização cancelada.');
  let content;
  if (source === 'import') {
    const sourcePath = options.brief || await answer('Caminho do arquivo de briefing', '');
    if (!sourcePath || !existsSync(resolve(sourcePath))) throw new MawaError('O arquivo de briefing informado não existe.', 'BRIEF_NOT_FOUND');
    content = readFileSync(resolve(sourcePath), 'utf8');
  } else content = options.stdin ? readFileSync(0, 'utf8') : await readTerminalBriefing();
  const path = replaceRawBriefing(root, content);
  if (isInteractive(options)) return outro(`Raw Briefing atualizado: ${path}`);
  console.log(`Raw briefing atualizado: ${path}`);
}

export function codexHandoffPrompt(handoffPath) {
  return `Continue este projeto MAWA. Leia ${handoffPath} primeiro, depois execute mawa status e mawa context. Siga o handoff integralmente, respeite os gates humanos e não avance para outra etapa. Comece pela primeira ação esperada no handoff.`;
}

function showRawBriefingCriteria(root) {
  const errors = validateRawBriefing(root);
  if (!errors.length) {
    log.success('O Raw Briefing atende aos critérios mínimos para aprovação. Revise o conteúdo antes de confirmar.');
    return true;
  }
  log.warn('O Raw Briefing ainda não pode ser aprovado:');
  errors.forEach((error) => log.message(`• ${error}`));
  return false;
}

async function rawBriefingMenu(root, options) {
  while (true) {
    const action = await choose('Raw Briefing registrado. O que deseja fazer agora?', [
      { label: 'Aprovar e iniciar entrevista crítica', value: 'approve', hint: 'valida o briefing e abre a próxima etapa' },
      { label: 'Editar ou complementar depois', value: 'edit', hint: 'mantém o projeto pronto para continuar' },
      { label: 'Exibir critérios de aprovação', value: 'criteria', hint: 'mostra o que ainda precisa ser resolvido' },
      { label: 'Abortar inicialização deste projeto', value: 'abort', hint: 'remove apenas os artefatos iniciais do MAWA' },
    ]);
    if (action === 'edit') return outro('Edite o Raw Briefing quando quiser. Depois execute “mawa approve” para continuar.');
    if (action === 'criteria') {
      showRawBriefingCriteria(root);
      continue;
    }
    if (action === 'approve') {
      if (!showRawBriefingCriteria(root)) continue;
      if (!await confirm('Você revisou o Raw Briefing e confirma a aprovação?', false)) continue;
      const task = spinner();
      task.start('Registrando aprovação auditável');
      const result = approveCurrentGate(root, options.comment || null);
      task.stop('Aprovação registrada');
      const handoff = getAgentHandoff(root);
      log.success(`Etapa atual: ${result.currentStage}`);
      log.info(`Handoff do agente: ${handoff.path}`);
      await offerCodex(root, handoff, options);
      return briefingMenu(root, options);
    }
    if (!await confirm('Abortar a inicialização? O MAWA registrará uma reversão recuperável no Git.', false)) continue;
    const task = spinner();
    task.start('Removendo os artefatos iniciais do MAWA');
    const result = abortInitialization(root);
    task.stop('Inicialização abortada e registrada');
    return outro(`Os artefatos iniciais foram removidos. Commit de recuperação: ${result.commit}`);
  }
}

async function offerCodex(root, handoff, options) {
  const codex = spawnSync('codex', ['--version'], { cwd: root, encoding: 'utf8' });
  if (codex.status !== 0) {
    if (isInteractive(options)) log.warn('Codex CLI não foi encontrado. O handoff foi salvo e pode ser usado posteriormente.');
    return;
  }
  const requested = options['start-codex'] === true || (isInteractive(options) && await confirm('Iniciar Codex CLI com o handoff atual?', true));
  if (!requested) return;
  if (isInteractive(options)) log.step(`Abrindo Codex em ${root}. O Codex manterá suas próprias confirmações de segurança.`);
  const result = spawnSync('codex', ['-C', root, codexHandoffPrompt(handoff.path)], { cwd: root, stdio: 'inherit' });
  if (result.error || result.status !== 0) log.warn('A sessão do Codex foi encerrada sem concluir normalmente. O handoff permanece salvo no projeto.');
}

function showBriefingProgress(root) {
  const progress = getBriefingProgress(root);
  const complete = progress.coverage.filter((item) => item.complete).length;
  log.info(`Cobertura: ${complete}/${progress.coverage.length} temas completos.`);
  for (const item of progress.coverage) {
    const mark = item.complete ? '✓' : '○';
    log.message(`${mark} ${item.topic}: ${item.status}`);
  }
  if (progress.openBlockingQuestions.length) log.warn(`Questão bloqueante aberta: ${progress.openBlockingQuestions.join(', ')}.`);
  if (progress.approvalErrors.length) {
    log.warn('Ainda não é possível aprovar o briefing:');
    progress.approvalErrors.forEach((error) => log.message(`• ${error}`));
  } else log.success('Os documentos atendem aos critérios de aprovação. Revise-os antes de confirmar.');
  return progress;
}

async function briefingMenu(root, options) {
  while (true) {
    const action = await choose('Entrevista crítica. O que deseja fazer agora?', [
      { label: 'Continuar entrevista com Codex', value: 'resume', hint: 'o agente faz a próxima pergunta bloqueante' },
      { label: 'Ver cobertura e critérios de aprovação', value: 'progress', hint: 'mostra pendências sem avançar' },
      { label: 'Aprovar briefing e seguir para setup', value: 'approve', hint: 'exige documentação completa e revisão humana' },
      { label: 'Editar documentos ou retomar depois', value: 'edit', hint: 'preserva a etapa atual sem aprovar' },
    ]);
    if (action === 'edit') return outro('Os documentos permanecem em docs/mawa/. Execute “mawa next” para retomar esta entrevista.');
    if (action === 'progress') {
      showBriefingProgress(root);
      continue;
    }
    if (action === 'resume') {
      const handoff = getAgentHandoff(root);
      await offerCodex(root, handoff, options);
      continue;
    }
    const progress = showBriefingProgress(root);
    if (!progress.readyForApproval) continue;
    if (!await confirm('Você revisou a entrevista e o Project Brief e confirma esta aprovação?', false)) continue;
    const task = spinner();
    task.start('Registrando aprovação auditável do briefing');
    const result = approveCurrentGate(root, options.comment || null);
    task.stop('Briefing aprovado');
    const handoff = getAgentHandoff(root);
    log.success(`Etapa atual: ${result.currentStage}`);
    log.info(`Handoff do agente: ${handoff.path}`);
    await offerCodex(root, handoff, options);
    return outro('O briefing foi aprovado. O próximo gate é o plano de setup.');
  }
}

async function briefingCommand(options) {
  const root = resolve(options.root || '.');
  if (getStatus(root).currentStage !== 'briefing') throw new MawaError('A entrevista crítica só está disponível na etapa briefing.', 'WRONG_STAGE');
  if (isInteractive(options)) {
    intro('MAWA — entrevista crítica');
    return briefingMenu(root, options);
  }
  const progress = getBriefingProgress(root);
  console.log(JSON.stringify(progress, null, 2));
}

async function approveCommand(options) {
  const root = resolve(options.root || '.');
  if (isInteractive(options) && !await confirm('Você revisou o artefato atual e confirma esta aprovação?', false)) return cancel('Aprovação cancelada. Nenhum estado foi alterado.');
  const task = isInteractive(options) ? spinner() : null;
  task?.start('Registrando aprovação auditável');
  const result = approveCurrentGate(root, options.comment || null);
  task?.stop('Aprovação registrada');
  const handoff = getAgentHandoff(root);
  if (isInteractive(options)) {
    log.success(`Etapa atual: ${result.currentStage}`);
    log.info(`Handoff do agente: ${handoff.path}`);
    await offerCodex(root, handoff, options);
    if (result.currentStage === 'briefing') return briefingMenu(root, options);
    return;
  }
  console.log(`Aprovação registrada. Etapa atual: ${result.currentStage}\nDecisão: ${result.decision}\n\nPróxima ação para o agente:\nLeia ${handoff.path} ou execute “mawa handoff” para exibir o handoff completo.`);
  if (options['start-codex'] === true) await offerCodex(root, handoff, options);
}

async function abortCommand(options) {
  const root = resolve(options.root || '.');
  if (isInteractive(options)) {
    intro('MAWA — abortar inicialização');
    if (!await confirm('Abortar a inicialização ainda não aprovada? O Git registrará uma reversão recuperável.', false)) return cancel('Aborto cancelado. Nenhum arquivo foi alterado.');
  }
  const task = isInteractive(options) ? spinner() : null;
  task?.start('Removendo os artefatos iniciais do MAWA');
  const result = abortInitialization(root);
  task?.stop('Inicialização abortada e registrada');
  if (isInteractive(options)) return outro(`Os artefatos iniciais foram removidos. Commit de recuperação: ${result.commit}`);
  console.log(`Inicialização MAWA abortada. Commit de recuperação: ${result.commit}`);
}

async function setupCommand(options) {
  const root = resolve(options.root || '.');
  let stack = options.stack || 'nuxt-daredash';
  let appRoot = options['app-root'] || 'web';
  let templateLanguage = options['template-language'] === 'html' ? 'html' : 'pug';
  let prefix = options.prefix || 'dd';
  let debug = options.debug === true;
  if (isInteractive(options)) {
    intro('MAWA — plano de setup');
    const stacks = listStackTemplates();
    stack = await choose('Selecione a stack', stacks.map((item) => ({ label: `${item.label} (${item.id})`, value: item.id })));
    appRoot = await answer('Diretório da aplicação, relativo ao projeto', appRoot);
    templateLanguage = await choose('Linguagem de template', [{ label: 'Pug', value: 'pug' }, { label: 'HTML', value: 'html' }]);
    prefix = await answer('Prefixo público do DareDash', prefix);
    debug = await confirm('Ativar debug do DareDash?', false);
    if (!await confirm('Gerar o diagnóstico e o plano de setup? Nenhuma dependência será instalada.', true)) return cancel('Setup cancelado. Nenhum arquivo foi alterado.');
  }
  const task = isInteractive(options) ? spinner() : null;
  task?.start('Inspecionando projeto e congelando a stack selecionada');
  const result = createSetupPlan(root, { stack, appRoot, templateLanguage, ui: { prefix, debug } });
  task?.stop('Plano de setup criado');
  if (isInteractive(options)) {
    log.info(`Diagnóstico: ${result.doctor}`);
    log.info(`Plano: ${result.plan}`);
    return outro('Revise o plano e execute mawa approve somente quando concordar com ele.');
  }
  console.log(`\nPlano de setup criado.\n\nDiagnóstico: ${result.doctor}\nPlano: ${result.plan}\n\nRevise as versões, as receitas, a origem do DareDash e a política de patch. Execute “mawa approve” somente quando aprovar o plano.`);
}

async function setupPatchCommand(options) {
  const root = resolve(options.root || '.');
  if (isInteractive(options)) {
    intro('MAWA — proposta de patch Nuxt');
    if (!await confirm('Gerar uma proposta de patch sem modificar a aplicação?', true)) return cancel('Proposta cancelada. Nenhum arquivo foi alterado.');
  }
  const task = isInteractive(options) ? spinner() : null;
  task?.start('Analisando nuxt.config.ts e registrando a proposta');
  const result = createNuxtConfigPatchProposal(root);
  task?.stop('Proposta de patch registrada');
  if (isInteractive(options)) return outro(`Status: ${result.status}\nProposta: ${result.proposal}`);
  console.log(JSON.stringify(result, null, 2));
}

async function setupApplyCommand(options) {
  const root = resolve(options.root || '.');
  if (!isInteractive(options)) throw new MawaError('Setup execution requires an interactive terminal for explicit recipe approval.', 'INTERACTIVE_REQUIRED');
  intro('MAWA — executar scaffold aprovado');
  if (!await confirm('Executar a receita scaffold-nuxt-minimal? Ela criará a aplicação no diretório aprovado.', false)) return cancel('Execução cancelada. Nenhum comando foi executado.');
  const task = spinner();
  task.start('Executando scaffold certificado e registrando evidências');
  const result = executeSetupScaffold(root, { confirmed: true });
  task.stop('Scaffold concluído');
  log.info(`Evidência: ${result.evidence}`);
  log.info(`Proposta de patch: ${result.patch.proposal}`);
  return outro('Revise a proposta de patch. Dependências e alterações de configuração continuam bloqueadas até a próxima confirmação.');
}

export async function runCli(argv = process.argv.slice(2)) {
  const { positionals, options } = parse(argv);
  const command = positionals[0];
  if (!command || command === 'help' || options.help) return usage();
  if (command === 'init') return initCommand(positionals[1], options);
  if (command === 'intake') return intakeCommand(options);
  const root = resolve(options.root || '.');
  if (command === 'status') {
    const status = getStatus(root);
    if (options.json) return console.log(JSON.stringify(status, null, 2));
    console.log(`\nMAWA status — ${status.project}\n\nEtapa atual: ${status.currentStage}\nAuditoria: ${status.audit}\nPróxima aprovação: ${status.nextApproval}\n\nExecute “mawa next” para ver o próximo passo.`);
    return;
  }
  if (command === 'next') {
    if (isInteractive(options) && getStatus(root).currentStage === 'briefing') return briefingCommand(options);
    const next = getNext(root);
    console.log(`\nMAWA — próximo passo\n\nEtapa: ${next.stage}\n${next.artifact ? `Artefato: ${next.artifact}\n` : ''}\n${next.instructions.map((item, index) => `${index + 1}. ${item}`).join('\n')}`);
    return;
  }
  if (command === 'briefing') return briefingCommand(options);
  if (command === 'context') return console.log(JSON.stringify(getContext(root), null, 2));
  if (command === 'handoff') {
    const handoff = getAgentHandoff(root);
    if (options.json) return console.log(JSON.stringify(handoff, null, 2));
    console.log(`\nMAWA — handoff para o agente\n\nArquivo: ${handoff.path}\n\n${handoff.content}`);
    if (options['start-codex'] === true) await offerCodex(root, handoff, options);
    return;
  }
  if (command === 'approve') return approveCommand(options);
  if (command === 'abort') return abortCommand(options);
  if (command === 'setup' && positionals[1] === 'patch') return setupPatchCommand(options);
  if (command === 'setup' && positionals[1] === 'apply') return setupApplyCommand(options);
  if (command === 'setup') return setupCommand(options);
  if (command === 'stack' && positionals[1] === 'list') {
    const stacks = listStackTemplates();
    if (options.json) return console.log(JSON.stringify(stacks.map(({ directory, profile, ...stack }) => ({ ...stack, profile: profile.id })), null, 2));
    console.log(`\nStacks disponíveis:\n${stacks.map((stack) => `- ${stack.id} (${stack.version}): ${stack.label}`).join('\n')}`);
    return;
  }
  if (command === 'doctor') {
    const report = doctorProject(root, { stack: options.stack, appRoot: options['app-root'] });
    if (options.json) return console.log(JSON.stringify(report, null, 2));
    console.log(`\nMAWA doctor — ${report.template.label}\n\nApp root: ${report.appRoot}\nTipo de projeto: ${report.projectKind}\nBaseline: ${report.baseline}\nConfiguração Nuxt: ${report.config.status}\nPágina /: ${report.landingPage.exists ? 'encontrada' : 'ausente'}\nPacotes ausentes: ${report.missingPackages.length ? report.missingPackages.join(', ') : 'nenhum'}\nInstruções DareDash locais: ${report.uiInstructions.resolvedLocalFiles.length ? report.uiInstructions.resolvedLocalFiles.join(', ') : 'não encontradas; use a fonte oficial registrada'}\n\nEste diagnóstico não alterou arquivos. Execute “mawa setup” para criar um plano de setup revisável.`);
    return;
  }
  if (command === 'audit') {
    const issues = auditProject(root);
    if (issues.length) { issues.forEach((issue) => console.error(`error: ${issue}`)); process.exitCode = 1; }
    else console.log('MAWA audit passed.');
    return;
  }
  throw new MawaError('Comando desconhecido. Execute mawa help.', 'UNKNOWN_COMMAND');
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  runCli().catch((error) => { printError(error); process.exitCode = 1; });
}
