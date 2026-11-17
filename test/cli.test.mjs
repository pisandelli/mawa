import assert from 'node:assert/strict';
import { test } from 'node:test';
import { codexHandoffPrompt } from '../bin/mawa.mjs';

test('builds a constrained Codex continuation prompt from the active handoff', () => {
  const prompt = codexHandoffPrompt('docs/mawa/handoffs/briefing-agent.md');
  assert.match(prompt, /briefing-agent\.md/);
  assert.match(prompt, /mawa status/);
  assert.match(prompt, /mawa context/);
  assert.match(prompt, /respeite os gates humanos/);
  assert.match(prompt, /não avance para outra etapa/);
});
