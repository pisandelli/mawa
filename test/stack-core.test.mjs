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
  assert.equal(stack.versionPolicy.nuxt, '4.6.4');
  assert.equal(stack.uiLibrary.distribution.tag, 'v0.0.54-beta');
  assert.match(stack.uiLibrary.distribution.specifier, /328e7ef5fff7536043e2235d463f291b2ba3fced/);
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

test('existing-valid fixture stays aligned with the certified version policy', () => {
  const stack = loadStackTemplate('nuxt-daredash');
  const fixturePackage = JSON.parse(readFileSync(resolve(fixture('existing-valid'), 'package.json'), 'utf8'));
  assert.equal(fixturePackage.dependencies.nuxt, stack.versionPolicy.nuxt);
  assert.equal(fixturePackage.dependencies.pinia, stack.versionPolicy.pinia);
  assert.equal(fixturePackage.dependencies['@pinia/nuxt'], stack.versionPolicy.piniaNuxt);
  assert.equal(fixturePackage.dependencies['@vueuse/nuxt'], stack.versionPolicy.vueuseNuxt);
  assert.equal(fixturePackage.dependencies['@pisandelli/daredash'], stack.uiLibrary.distribution.specifier);
  assert.equal(fixturePackage.devDependencies['@nuxt/eslint'], stack.versionPolicy.nuxtEslint);
  assert.equal(fixturePackage.devDependencies.eslint, stack.versionPolicy.eslint);
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
