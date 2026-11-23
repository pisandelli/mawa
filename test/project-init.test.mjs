import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { test } from 'node:test';
import { abortInitialization, approveCurrentGate, auditProject, getAgentHandoff, getBriefingProgress, getContext, getNext, getStatus, initProject, replaceRawBriefing, validateCriticalBriefing, validateRawBriefing } from '../lib/project-core.mjs';
import { applyNuxtConfigPatch, createNuxtConfigPatchProposal, createSetupPlan, executeSetupScaffold } from '../lib/stack-core.mjs';

function project() {
  const root = mkdtempSync(resolve(tmpdir(), 'mawa-init-'));
  execFileSync('git', ['init', '-q'], { cwd: root });
  execFileSync('git', ['config', 'user.name', 'MAWA Test'], { cwd: root });
  execFileSync('git', ['config', 'user.email', 'mawa@example.test'], { cwd: root });
  return root;
}
function cleanup(root) { rmSync(root, { recursive: true, force: true }); }
function briefing() {
  return `# Raw Briefing

## Problema

Pequenas equipes perdem tarefas de suporte porque os pedidos chegam em canais dispersos.

## Pessoas envolvidas

Analistas de suporte, clientes internos e líderes que acompanham a fila.

## Resultado desejado

Uma fila única permite registrar, priorizar e acompanhar cada pedido sem planilhas paralelas.

## Contexto, restrições e referências

Primeiro piloto em oito semanas; integração inicial somente com e-mail corporativo.
`;
}

function criticalInterview() {
  return `# Entrevista crítica de briefing

## Matriz de cobertura

| Tema | Estado | Evidência |
| --- | --- | --- |
| Problema e métrica de sucesso | resolved | A fila única reduz pedidos perdidos e mede o tempo até primeira resposta. |
| Usuários e papéis | resolved | Analistas tratam pedidos; líderes acompanham SLA; solicitantes acompanham o retorno. |
| Escopo e não-escopo | resolved | O piloto centraliza e-mail; não inclui chatbot nem automação de resposta. |
| Regras e exceções | resolved | Todo pedido recebe prioridade; urgências exigem justificativa registrada. |
| Dados e ownership | resolved | Suporte é dono da fila; solicitantes são donos do conteúdo de seus pedidos. |
| Autorização e privacidade | resolved | Somente membros autenticados veem dados internos de sua área. |
| Integrações e dependências | deferred | A integração com e-mail corporativo depende de credenciais do time de infraestrutura. |
| UX, acessibilidade e canais | resolved | A fila web precisa operar por teclado e informar falhas de envio claramente. |
| Restrições operacionais | resolved | O piloto deve estar disponível em oito semanas com suporte no horário comercial. |
| Riscos e critérios de aceite | resolved | Adoção baixa será medida semanalmente; sucesso exige pedidos rastreáveis sem planilhas paralelas. |

## Questões e decisões

### Q-001

- Classificação: blocking
- Pergunta: Quem pode visualizar pedidos que contêm informações internas de outra área?
- Resposta: Apenas analistas autorizados e líderes da área responsável podem ver o pedido completo.
- Contraponto: Confirmamos que solicitantes de outras áreas não devem acessar anexos ou comentários internos.
- Decisão: O piloto terá visibilidade restrita por área e a política detalhada será refinada no discovery.
- Estado: resolved

## Decisão de readiness

O briefing está pronto para discovery porque o problema, o recorte do piloto e as decisões de acesso estão claros; a credencial de e-mail possui dono e foi formalmente adiada.
`;
}

function projectBrief() {
  return `# Project Brief

## Nome do projeto

Fila de suporte interno.

## Elevator pitch

Uma fila única para equipes pequenas registrarem, priorizarem e acompanharem pedidos internos sem planilhas paralelas.

## Problema e métrica de sucesso

Pedidos chegam em canais dispersos; o sucesso do piloto será reduzir pedidos perdidos e medir o tempo até a primeira resposta.

## Usuários e papéis

Analistas tratam pedidos, líderes acompanham o SLA e solicitantes consultam o retorno das próprias demandas.

## Escopo e prioridades

O primeiro piloto centraliza pedidos recebidos por e-mail, permite priorização e acompanha o status de cada solicitação.

## Não-escopo explícito

Chatbot, automação de respostas, integrações adicionais e relatórios avançados ficam fora deste piloto.

## Regras de negócio e exceções

Todo pedido recebe prioridade; urgências precisam de justificativa e a visibilidade respeita a área responsável.

## UX, acessibilidade e canais

A aplicação web deve funcionar por teclado, comunicar falhas de envio e manter a jornada de consulta simples para solicitantes.

## Dados, ownership e integrações

Suporte é dono da fila; solicitantes são donos do conteúdo. A única integração inicial é o e-mail corporativo.

## Autenticação, autorização e privacidade

Pessoas autenticadas acessam somente sua área; analistas e líderes autorizados podem ver pedidos completos e anexos internos.

## Restrições operacionais

O piloto precisa operar em oito semanas, no horário comercial, com desempenho adequado para a fila diária e sem custo extra não aprovado.

## Hipóteses, perguntas abertas e riscos

A credencial de e-mail depende da infraestrutura; o risco de baixa adoção será acompanhado semanalmente por pedidos criados na fila.

## Critérios de aceite

Um pedido pode ser registrado, priorizado, acompanhado e consultado por pessoas autorizadas, sem depender de planilhas paralelas.

## Readiness para discovery

O briefing está pronto para detalhar regras, integrações e domínio; a credencial de e-mail foi adiada com responsável conhecido.
`;
}

test('initializes a documented, auditable project with a raw briefing', () => {
  const root = project();
  try {
    const result = initProject(root, { name: 'Support Queue', language: 'pt-BR' });
    assert.equal(result.state.currentStage, 'raw-briefing');
    assert.ok(existsSync(resolve(root, '.mawa/manifest.json')));
    assert.ok(existsSync(resolve(root, 'docs/mawa/intake/raw-briefing.md')));
    assert.ok(existsSync(resolve(root, 'docs/mawa/handoffs/raw-briefing-agent.md')));
    assert.match(readFileSync(resolve(root, 'AGENTS.md'), 'utf8'), /mawa status/);
    assert.equal(getStatus(root).nextApproval, 'raw-briefing');
    assert.match(getNext(root).instructions.join('\n'), /Não crie uma especificação ainda/);
  } finally { cleanup(root); }
});

test('aborts only an unapproved initialization through a recoverable Git commit', () => {
  const root = project();
  try {
    initProject(root);
    const result = abortInitialization(root);
    assert.ok(result.commit);
    assert.equal(existsSync(resolve(root, '.mawa')), false);
    assert.equal(existsSync(resolve(root, 'docs/mawa')), false);
    assert.equal(existsSync(resolve(root, 'AGENTS.md')), false);
    assert.match(execFileSync('git', ['log', '-1', '--format=%s'], { cwd: root, encoding: 'utf8' }), /mawa: abort initialization/);
  } finally { cleanup(root); }
});

test('refuses to abort after the raw briefing has been approved', () => {
  const root = project();
  try {
    initProject(root);
    replaceRawBriefing(root, briefing());
    approveCurrentGate(root);
    assert.throws(() => abortInitialization(root), /só pode ser abortada/i);
    assert.ok(existsSync(resolve(root, '.mawa/manifest.json')));
  } finally { cleanup(root); }
});

test('refuses to remove an AGENTS.md changed after MAWA created it', () => {
  const root = project();
  try {
    initProject(root);
    writeFileSync(resolve(root, 'AGENTS.md'), '# Instruções alteradas\n');
    assert.throws(() => abortInitialization(root), /AGENTS\.md changed/i);
    assert.ok(existsSync(resolve(root, '.mawa/manifest.json')));
  } finally { cleanup(root); }
});

test('blocks raw briefing approval while template placeholders remain', () => {
  const root = project();
  try {
    initProject(root);
    assert.match(validateRawBriefing(root).join('\n'), /placeholder|detail/i);
    assert.throws(() => approveCurrentGate(root), /Approval blocked/);
  } finally { cleanup(root); }
});

test('approves a reviewed raw briefing, writes evidence, and advances only to briefing', () => {
  const root = project();
  try {
    initProject(root);
    replaceRawBriefing(root, briefing());
    const result = approveCurrentGate(root, 'Reviewed by a human.');
    assert.equal(result.currentStage, 'briefing');
    assert.equal(getStatus(root).currentStage, 'briefing');
    assert.equal(auditProject(root).length, 0);
    assert.match(getContext(root).requiredReferences.join('\n'), /agent-contract/);
    assert.ok(existsSync(resolve(root, 'docs/mawa/interviews/critical-briefing.md')));
    assert.ok(existsSync(resolve(root, 'docs/mawa/analysis/project-brief.md')));
    const handoff = getAgentHandoff(root);
    assert.equal(handoff.path, 'docs/mawa/handoffs/briefing-agent.md');
    assert.match(handoff.content, /uma pergunta bloqueante por vez/);
    assert.match(handoff.content, /Não inicie discovery/);
    assert.match(getContext(root).agentHandoff, /briefing-agent/);
    const progress = getBriefingProgress(root);
    assert.equal(progress.coverage.filter((item) => item.complete).length, 0);
    assert.deepEqual(progress.openBlockingQuestions, ['Q-001']);
    assert.equal(progress.readyForApproval, false);
  } finally { cleanup(root); }
});

test('blocks the critical briefing while its interview is unresolved or incomplete', () => {
  const root = project();
  try {
    initProject(root);
    replaceRawBriefing(root, briefing());
    approveCurrentGate(root);
    const errors = validateCriticalBriefing(root).join('\n');
    assert.match(errors, /Coverage is unresolved|placeholders|resolved or explicitly deferred/i);
    assert.throws(() => approveCurrentGate(root), /Approval blocked/);
    assert.equal(getStatus(root).currentStage, 'briefing');
  } finally { cleanup(root); }
});

test('approves a complete critical interview and project brief before setup', () => {
  const root = project();
  try {
    initProject(root);
    replaceRawBriefing(root, briefing());
    approveCurrentGate(root);
    writeFileSync(resolve(root, 'docs/mawa/interviews/critical-briefing.md'), criticalInterview());
    writeFileSync(resolve(root, 'docs/mawa/analysis/project-brief.md'), projectBrief());
    const progress = getBriefingProgress(root);
    assert.equal(progress.coverage.filter((item) => item.complete).length, 10);
    assert.deepEqual(progress.openBlockingQuestions, []);
    assert.equal(progress.readyForApproval, true);
    const result = approveCurrentGate(root, 'The critical interview was reviewed by a human.');
    assert.equal(result.currentStage, 'setup');
    assert.equal(getStatus(root).nextApproval, null);
    assert.equal(auditProject(root).length, 0);
    assert.match(getNext(root).instructions.join('\n'), /setup/i);
  } finally { cleanup(root); }
});

test('audit detects a project brief changed after the briefing approval', () => {
  const root = project();
  try {
    initProject(root);
    replaceRawBriefing(root, briefing());
    approveCurrentGate(root);
    writeFileSync(resolve(root, 'docs/mawa/interviews/critical-briefing.md'), criticalInterview());
    writeFileSync(resolve(root, 'docs/mawa/analysis/project-brief.md'), projectBrief());
    approveCurrentGate(root);
    writeFileSync(resolve(root, 'docs/mawa/analysis/project-brief.md'), '# Changed\n');
    assert.match(auditProject(root).join('\n'), /Approved evidence changed: docs\/mawa\/analysis\/project-brief.md/);
  } finally { cleanup(root); }
});

test('creates, freezes, and approves a setup plan before setup execution', () => {
  const root = project();
  try {
    initProject(root);
    replaceRawBriefing(root, briefing());
    approveCurrentGate(root);
    writeFileSync(resolve(root, 'docs/mawa/interviews/critical-briefing.md'), criticalInterview());
    writeFileSync(resolve(root, 'docs/mawa/analysis/project-brief.md'), projectBrief());
    approveCurrentGate(root);
    const result = createSetupPlan(root, { templateLanguage: 'pug', ui: { prefix: 'dd', debug: false } });
    assert.equal(result.selection.templateLanguage, 'pug');
    assert.equal(result.selection.appRoot, 'web');
    assert.ok(existsSync(resolve(root, result.plan)));
    assert.ok(existsSync(resolve(root, result.doctor)));
    assert.ok(existsSync(resolve(root, '.mawa/snapshots/stacks/nuxt-daredash@0.1.0/template/template.json')));
    assert.equal(getStatus(root).nextApproval, 'setup-plan');
    assert.match(getNext(root).instructions.join('\n'), /setup-plan/);
    const approval = approveCurrentGate(root, 'The setup plan was reviewed by a human.');
    assert.equal(approval.currentStage, 'setup-apply');
    assert.ok(existsSync(resolve(root, 'docs/mawa/handoffs/setup-agent.md')));
    assert.ok(existsSync(resolve(root, 'docs/mawa/handoffs/setup-apply-agent.md')));
    assert.equal(auditProject(root).length, 0);
    const manifest = JSON.parse(readFileSync(resolve(root, '.mawa/manifest.json'), 'utf8'));
    assert.equal(manifest.stack.id, 'nuxt-daredash');
    assert.equal(manifest.stack.templateLanguage, 'pug');
  } finally { cleanup(root); }
});

test('blocks a setup plan whose Nuxt configuration cannot be safely patched', () => {
  const root = project();
  try {
    initProject(root);
    replaceRawBriefing(root, briefing());
    approveCurrentGate(root);
    writeFileSync(resolve(root, 'docs/mawa/interviews/critical-briefing.md'), criticalInterview());
    writeFileSync(resolve(root, 'docs/mawa/analysis/project-brief.md'), projectBrief());
    approveCurrentGate(root);
    writeFileSync(resolve(root, 'nuxt.config.ts'), 'const modules = getModulesFromEnvironment()\nexport default defineNuxtConfig({ modules })\n');
    createSetupPlan(root, { appRoot: '.' });
    assert.throws(() => approveCurrentGate(root), /configuration conflict/);
    assert.equal(getStatus(root).currentStage, 'setup');
  } finally { cleanup(root); }
});

test('records a minimal Nuxt configuration patch proposal without changing the app', () => {
  const root = project();
  try {
    initProject(root);
    replaceRawBriefing(root, briefing());
    approveCurrentGate(root);
    writeFileSync(resolve(root, 'docs/mawa/interviews/critical-briefing.md'), criticalInterview());
    writeFileSync(resolve(root, 'docs/mawa/analysis/project-brief.md'), projectBrief());
    approveCurrentGate(root);
    mkdirSync(resolve(root, 'web'), { recursive: true });
    writeFileSync(resolve(root, 'web/package.json'), JSON.stringify({ dependencies: { nuxt: '4.6.4' } }));
    const config = "export default defineNuxtConfig({\n  compatibilityDate: '2026-01-01',\n})\n";
    writeFileSync(resolve(root, 'web/nuxt.config.ts'), config);
    createSetupPlan(root, { appRoot: 'web' });
    approveCurrentGate(root);
    const result = createNuxtConfigPatchProposal(root);
    assert.equal(result.status, 'proposed');
    assert.equal(readFileSync(resolve(root, 'web/nuxt.config.ts'), 'utf8'), config);
    assert.match(readFileSync(resolve(root, result.proposal), 'utf8'), /@pinia\/nuxt/);
    const evidence = JSON.parse(readFileSync(resolve(root, result.evidence), 'utf8'));
    assert.ok(evidence.sourceSha256);
    assert.ok(evidence.proposedSha256);
    const applied = applyNuxtConfigPatch(root, { confirmed: true });
    assert.equal(applied.status, 'proposed');
    assert.match(readFileSync(resolve(root, 'web/nuxt.config.ts'), 'utf8'), /daredash: \{ prefix: 'dd', debug: false \}/);
    assert.ok(existsSync(resolve(root, applied.evidence)));
  } finally { cleanup(root); }
});

test('runs only the confirmed scaffold recipe and records evidence before proposing a patch', () => {
  const root = project();
  try {
    initProject(root);
    replaceRawBriefing(root, briefing());
    approveCurrentGate(root);
    writeFileSync(resolve(root, 'docs/mawa/interviews/critical-briefing.md'), criticalInterview());
    writeFileSync(resolve(root, 'docs/mawa/analysis/project-brief.md'), projectBrief());
    approveCurrentGate(root);
    createSetupPlan(root, { appRoot: 'web' });
    approveCurrentGate(root);
    const result = executeSetupScaffold(root, {
      confirmed: true,
      runner: () => {
        mkdirSync(resolve(root, 'web'), { recursive: true });
        writeFileSync(resolve(root, 'web/package.json'), JSON.stringify({ dependencies: { nuxt: '4.6.4' } }));
        writeFileSync(resolve(root, 'web/nuxt.config.ts'), 'export default defineNuxtConfig({})\n');
        return { status: 0, stdout: 'scaffolded', stderr: '' };
      },
    });
    assert.equal(result.recipe, 'scaffold-nuxt-minimal');
    assert.equal(result.patch.status, 'proposed');
    assert.match(readFileSync(resolve(root, result.evidence), 'utf8'), /scaffolded/);
    assert.ok(existsSync(resolve(root, result.patch.proposal)));
  } finally { cleanup(root); }
});

test('preserves an existing AGENTS.md unless explicit append is requested', () => {
  const root = project();
  try {
    writeFileSync(resolve(root, 'AGENTS.md'), '# Existing instructions\n');
    const result = initProject(root);
    assert.equal(result.agentsAction, 'preserved');
    assert.equal(readFileSync(resolve(root, 'AGENTS.md'), 'utf8'), '# Existing instructions\n');
  } finally { cleanup(root); }
});

test('audit detects approved evidence modified after approval', () => {
  const root = project();
  try {
    initProject(root);
    replaceRawBriefing(root, briefing());
    approveCurrentGate(root);
    writeFileSync(resolve(root, 'docs/mawa/intake/raw-briefing.md'), '# Changed\n');
    assert.match(auditProject(root).join('\n'), /Approved evidence changed/);
  } finally { cleanup(root); }
});

test('audit detects an approval decision that has not been committed', () => {
  const root = project();
  try {
    initProject(root);
    writeFileSync(resolve(root, '.mawa/decisions/uncommitted.json'), JSON.stringify({ schemaVersion: 1, id: 'uncommitted', commitRequired: true, evidence: [] }));
    assert.match(auditProject(root).join('\n'), /Decision is not committed: uncommitted.json/);
  } finally { cleanup(root); }
});

test('keeps the gate unchanged when approval cannot safely commit', () => {
  const root = project();
  try {
    initProject(root);
    replaceRawBriefing(root, briefing());
    execFileSync('git', ['add', 'docs/mawa/intake/raw-briefing.md'], { cwd: root });
    assert.throws(() => approveCurrentGate(root), /already contain staged changes/);
    assert.equal(getStatus(root).currentStage, 'raw-briefing');
    assert.equal(existsSync(resolve(root, '.mawa/decisions')).toString(), 'true');
    assert.deepEqual(auditProject(root), []);
  } finally { cleanup(root); }
});
