import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { test } from 'node:test';
import { approveCurrentGate, auditProject, getContext, getNext, getStatus, initProject, replaceRawBriefing, validateCriticalBriefing, validateRawBriefing } from '../lib/project-core.mjs';

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
- Challenge: Confirmamos que solicitantes de outras áreas não devem acessar anexos ou comentários internos.
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
    assert.match(readFileSync(resolve(root, 'AGENTS.md'), 'utf8'), /mawa status/);
    assert.equal(getStatus(root).nextApproval, 'raw-briefing');
    assert.match(getNext(root).instructions.join('\n'), /Não crie uma especificação ainda/);
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
