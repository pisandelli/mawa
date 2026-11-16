import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { test } from 'node:test';
import { doctorProject, inspectNuxtDaredashApp, listStackTemplates, loadStackTemplate } from '../lib/stack-core.mjs';

const templateRoot = resolve(import.meta.dirname, '..', 'templates', 'stacks', 'nuxt-daredash');

function fixture(name) { return resolve(templateRoot, 'fixtures', name); }

test('lists and loads the certified Nuxt + DareDash stack contract', () => {
  const stacks = listStackTemplates();
  assert.ok(stacks.some((stack) => stack.id === 'nuxt-daredash'));
  const stack = loadStackTemplate('nuxt-daredash');
  assert.equal(stack.packageManager, 'pnpm');
  assert.equal(stack.profile.id, 'corporate-default');
  assert.deepEqual(stack.uiLibrary.instructions.precedence, ['AGENTS.md', 'SKILL.md', 'llms.txt']);
});

test('doctor classifies the Nuxt stack fixtures without changing them', () => {
  for (const name of ['new-nuxt', 'existing-valid', 'nuxt-config-conflict']) {
    const expected = JSON.parse(readFileSync(resolve(fixture(name), 'expected-doctor.json'), 'utf8'));
    const report = inspectNuxtDaredashApp(fixture(name));
    assert.equal(report.projectKind, expected.projectKind, name);
    assert.equal(report.baseline, expected.baseline, name);
    assert.equal(report.config.status, expected.configuration, name);
  }
});

test('doctor only runs at the setup stage and never writes a report', () => {
  const root = mkdtempSync(resolve(tmpdir(), 'mawa-doctor-'));
  try {
    mkdirSync(resolve(root, '.mawa'), { recursive: true });
    writeFileSync(resolve(root, '.mawa/manifest.json'), JSON.stringify({
      schemaVersion: 1,
      project: { name: 'Doctor Test' },
      language: { interaction: 'pt-BR', documentation: 'pt-BR', code: 'en' },
    }));
    writeFileSync(resolve(root, '.mawa/state.json'), JSON.stringify({
      schemaVersion: 1, currentStage: 'setup', completedStages: ['init', 'raw-briefing', 'briefing'], gates: { briefing: 'approved' },
    }));
    const report = doctorProject(root);
    assert.equal(report.projectKind, 'new');
    assert.equal(report.baseline, 'missing');
    assert.equal(report.config.status, 'not-created');
  } finally { rmSync(root, { recursive: true, force: true }); }
});
