#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { basename, resolve } from 'node:path';
import { approveCurrentGate, auditProject, getAgentHandoff, getContext, getNext, getStatus, initProject, isGitRepository, MawaError, rawBriefingPath, replaceRawBriefing } from '../lib/project-core.mjs';
import { createSetupPlan, doctorProject, listStackTemplates } from '../lib/stack-core.mjs';
import { validateLegacy } from '../lib/legacy-validator.mjs';

export const validate = validateLegacy;

function parse(argv) {
  const positionals = []; const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (!value.startsWith('--')) { positionals.push(value); continue; }
    const [key, inline] = value.slice(2).split('=', 2);
    options[key] = inline ?? (argv[index + 1]?.startsWith('--') ? true : argv[++index]);
  }
  return { positionals, options };
}

function usage() {
  console.log(`MAWA\n\nCommands:\n  mawa init [directory]\n  mawa intake\n  mawa status\n  mawa next\n  mawa context [--json]\n  mawa handoff\n  mawa approve [--comment TEXT]\n  mawa doctor [--stack ID] [--app-root PATH]\n  mawa setup [--stack ID] [--app-root PATH] [--template-language pug|html]\n  mawa stack list\n  mawa audit\n\nLegacy compatibility:\n  mawa validate [project-directory]\n`);
}

function askInterface() { return createInterface({ input: stdin, output: stdout }); }
async function confirm(question, defaultYes = true) {
  const prompt = askInterface();
  const answer = (await prompt.question(`${question} ${defaultYes ? '[S/n]' : '[s/N]'} `)).trim().toLowerCase();
  prompt.close();
  return answer ? ['s', 'sim', 'y', 'yes'].includes(answer) : defaultYes;
}
async function choose(question, choices) {
  console.log(`\n${question}`);
  choices.forEach((choice, index) => console.log(`${index + 1}. ${choice.label}`));
  const prompt = askInterface();
  const answer = (await prompt.question('Escolha uma opção: ')).trim();
  prompt.close();
  return choices[Number(answer) - 1]?.value || choices[0].value;
}
async function answer(question, fallback) {
  const prompt = askInterface();
  const result = (await prompt.question(`${question}${fallback ? ` [${fallback}]` : ''}: `)).trim();
  prompt.close();
  return result || fallback;
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
    console.log('\nMAWA — inicializar projeto\n');
    name = await answer('Nome do projeto', name);
    language = await choose('Idioma da documentação', [{ label: 'Português do Brasil', value: 'pt-BR' }, { label: 'English', value: 'en' }]);
    if (!isGitRepository(root)) initializeGit = await confirm('Este diretório não possui Git. Deseja inicializá-lo?', true);
    if (existsSync(resolve(root, 'AGENTS.md'))) appendAgents = await confirm('AGENTS.md já existe. Deseja adicionar um ponteiro curto para o contrato MAWA?', false);
    source = await choose('Como deseja iniciar o raw briefing?', [
      { label: 'Criar um arquivo Markdown para editar', value: 'file' },
      { label: 'Importar um arquivo Markdown existente', value: 'import' },
      { label: 'Colar texto no terminal', value: 'terminal' },
    ]);
    if (!await confirm(`Confirmar inicialização em ${root}?`, true)) return console.log('Inicialização cancelada. Nenhum arquivo foi alterado.');
  }
  let rawContent;
  if (source === 'import') {
    const sourcePath = options.brief || await answer('Caminho do arquivo de briefing', '');
    if (!sourcePath || !existsSync(resolve(sourcePath))) throw new MawaError('O arquivo de briefing informado não existe.', 'BRIEF_NOT_FOUND');
    rawContent = readFileSync(resolve(sourcePath), 'utf8');
  }
  if (source === 'terminal') rawContent = options.stdin ? readFileSync(0, 'utf8') : await readTerminalBriefing();
  const result = initProject(root, { name, language, rawContent, initializeGit, appendAgents });
  console.log(`\nProjeto MAWA inicializado.\n\nRaw briefing: ${rawBriefingPath(root)}\nEstado atual: ${result.state.currentStage}\n\nPróximo passo:\n1. Revise e complete o raw briefing.\n2. Execute “mawa next” para ver os critérios.\n3. Execute “mawa approve” somente quando estiver satisfeito.`);
}

async function intakeCommand(options) {
  const root = resolve(options.root || '.');
  const source = isInteractive(options) ? await choose('Como deseja atualizar o raw briefing?', [
    { label: 'Importar um arquivo Markdown existente', value: 'import' },
    { label: 'Colar texto no terminal', value: 'terminal' },
  ]) : options.brief ? 'import' : 'terminal';
  const current = existsSync(rawBriefingPath(root)) ? readFileSync(rawBriefingPath(root), 'utf8').trim() : '';
  if (current && isInteractive(options) && !await confirm('Substituir o raw briefing atual?', false)) return console.log('Atualização cancelada.');
  let content;
  if (source === 'import') {
    const sourcePath = options.brief || await answer('Caminho do arquivo de briefing', '');
    if (!sourcePath || !existsSync(resolve(sourcePath))) throw new MawaError('O arquivo de briefing informado não existe.', 'BRIEF_NOT_FOUND');
    content = readFileSync(resolve(sourcePath), 'utf8');
  } else content = options.stdin ? readFileSync(0, 'utf8') : await readTerminalBriefing();
  console.log(`Raw briefing atualizado: ${replaceRawBriefing(root, content)}`);
}

async function approveCommand(options) {
  const root = resolve(options.root || '.');
  if (isInteractive(options) && !await confirm('Você revisou o artefato atual e confirma esta aprovação?', false)) return console.log('Aprovação cancelada. Nenhum estado foi alterado.');
  const result = approveCurrentGate(root, options.comment || null);
  const handoff = getAgentHandoff(root);
  console.log(`Aprovação registrada. Etapa atual: ${result.currentStage}\nDecisão: ${result.decision}\n\nPróxima ação para o agente:\nLeia ${handoff.path} ou execute “mawa handoff” para exibir o handoff completo.`);
}

async function setupCommand(options) {
  const root = resolve(options.root || '.');
  let stack = options.stack || 'nuxt-daredash';
  let appRoot = options['app-root'] || 'web';
  let templateLanguage = options['template-language'] === 'html' ? 'html' : 'pug';
  let prefix = options.prefix || 'dd';
  let debug = options.debug === true;
  if (isInteractive(options)) {
    const stacks = listStackTemplates();
    stack = await choose('Selecione a stack', stacks.map((item) => ({ label: `${item.label} (${item.id})`, value: item.id })));
    appRoot = await answer('Diretório da aplicação, relativo ao projeto', appRoot);
    templateLanguage = await choose('Linguagem de template', [{ label: 'Pug', value: 'pug' }, { label: 'HTML', value: 'html' }]);
    prefix = await answer('Prefixo público do DareDash', prefix);
    debug = await confirm('Ativar debug do DareDash?', false);
    if (!await confirm('Gerar o diagnóstico e o plano de setup? Nenhuma dependência será instalada.', true)) return console.log('Setup cancelado. Nenhum arquivo foi alterado.');
  }
  const result = createSetupPlan(root, { stack, appRoot, templateLanguage, ui: { prefix, debug } });
  console.log(`\nPlano de setup criado.\n\nDiagnóstico: ${result.doctor}\nPlano: ${result.plan}\n\nRevise as versões, as receitas, a origem do DareDash e a política de patch. Execute “mawa approve” somente quando aprovar o plano.`);
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
    const next = getNext(root);
    console.log(`\nMAWA — próximo passo\n\nEtapa: ${next.stage}\n${next.artifact ? `Artefato: ${next.artifact}\n` : ''}\n${next.instructions.map((item, index) => `${index + 1}. ${item}`).join('\n')}`);
    return;
  }
  if (command === 'context') return console.log(JSON.stringify(getContext(root), null, 2));
  if (command === 'handoff') {
    const handoff = getAgentHandoff(root);
    if (options.json) return console.log(JSON.stringify(handoff, null, 2));
    console.log(`\nMAWA — handoff para o agente\n\nArquivo: ${handoff.path}\n\n${handoff.content}`);
    return;
  }
  if (command === 'approve') return approveCommand(options);
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
  if (command === 'validate') {
    const errors = validateLegacy(resolve(process.cwd(), positionals[1] || '.'));
    if (errors.length) { errors.forEach((issue) => console.error(`error: ${issue}`)); process.exitCode = 1; }
    else console.log('Legacy MAWA fixture is valid.');
    return;
  }
  throw new MawaError('Comando desconhecido. Execute mawa help.', 'UNKNOWN_COMMAND');
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  runCli().catch((error) => { printError(error); process.exitCode = 1; });
}
