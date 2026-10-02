import assert from 'node:assert/strict';
import { test } from 'node:test';
import { resolve } from 'node:path';
import { validate } from '../bin/mawa.mjs';

const root = resolve(import.meta.dirname, '..');
test('validates the reference fixture', () => {
  assert.deepEqual(validate(resolve(root, 'fixtures/valid-project')), []);
});
test('rejects a missing workflow manifest', () => {
  assert.match(validate(resolve(root, 'fixtures/invalid-missing-manifest')).join('\n'), /missing .mawa-config/);
});
test('blocks implementation with incomplete readiness', () => {
  assert.match(validate(resolve(root, 'fixtures/invalid-readiness')).join('\n'), /blocked by unchecked readiness/);
});
test('rejects setup before the matching flow gate', () => {
  assert.match(validate(resolve(root, 'fixtures/invalid-setup-context')).join('\n'), /first-approved-spec setup context requires module-by-module/);
});
