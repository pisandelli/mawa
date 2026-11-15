import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { test } from 'node:test';
import { approveCurrentGate, auditProject, getContext, getNext, getStatus, initProject, replaceRawBriefing, validateRawBriefing } from '../lib/project-core.mjs';

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
