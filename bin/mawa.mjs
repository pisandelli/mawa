#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const stages = [
  '00-project-init', '01-project-briefing', '02-environment-setup',
  '03-discovery', '04-domain-architecture', '05-module-spec',
  '05a-design-handoff', '06-implementation',
  '06a-implementation-from-approved-layout', '07-review-validation',
  '08-project-delivery',
];
const requiredBefore = {
  '01-project-briefing': ['inputs/raw-briefing.md'],
  '02-environment-setup': ['specs/briefing/project-briefing.md'],
  '03-discovery': ['specs/briefing/project-briefing.md'],
  '04-domain-architecture': ['specs/discovery/discovery.spec.md'],
  '05-module-spec': ['specs/domain/domain-map.md', 'specs/domain/module-plan.md'],
  '05a-design-handoff': ['specs/domain/module-plan.md'],
  '06-implementation': ['specs/domain/module-plan.md'],
  '06a-implementation-from-approved-layout': ['specs/domain/module-plan.md'],
  '07-review-validation': ['specs/domain/module-plan.md'],
  '08-project-delivery': ['specs/validation/project-delivery-checklist.md'],
};
const yamlValue = (source, key) => source.match(new RegExp(`^\\s*${key}:\\s*["']?([^\\n"'#]+)`, 'm'))?.[1].trim();
export function validate(rootDirectory) {
  const root = resolve(rootDirectory);
  const configPath = resolve(root, '.mawa-config.yaml');
  if (!existsSync(configPath)) return ['missing .mawa-config.yaml; run Stage 00 first'];
  const config = readFileSync(configPath, 'utf8');
  const errors = [];
  for (const key of ['project_name', 'human_language', 'artifact_language', 'interaction_mode', 'execution_mode']) {
    if (!yamlValue(config, key)) errors.push(`missing mawa.${key}`);
  }
  const stage = yamlValue(config, 'current_stage');
  if (!stages.includes(stage)) errors.push(`state.current_stage must be one of: ${stages.join(', ')}`);
  const interaction = yamlValue(config, 'interaction_mode');
  if (interaction && !['interactive', 'continuous'].includes(interaction)) errors.push('mawa.interaction_mode must be interactive or continuous');
  const flow = yamlValue(config, 'module_flow');
  if (flow && !['module-by-module', 'phase-by-phase'].includes(flow)) errors.push('workflow.module_flow must be module-by-module or phase-by-phase');
  for (const artifact of requiredBefore[stage] || []) {
    if (!existsSync(resolve(root, artifact))) errors.push(`missing required artifact for ${stage}: ${artifact}`);
  }
  const planPath = resolve(root, 'specs/domain/module-plan.md');
  if (existsSync(planPath) && !/^# Module Delivery Plan/m.test(readFileSync(planPath, 'utf8'))) errors.push('module plan is missing the required title');
  const deliveryPath = resolve(root, 'specs/validation/project-delivery-checklist.md');
  if (stage === '08-project-delivery' && existsSync(deliveryPath) && !/## Release decision/m.test(readFileSync(deliveryPath, 'utf8'))) errors.push('delivery checklist is missing a Release decision section');
  return errors;
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  if (process.argv[2] !== 'validate') {
    console.error('Usage: mawa validate [project-directory]');
    process.exit(2);
  }
  const root = resolve(process.cwd(), process.argv[3] || '.');
  const errors = validate(root);
  if (errors.length) {
    for (const error of errors) console.error(`error: ${error}`);
    process.exitCode = 1;
  } else {
    console.log(`info: MAWA project is valid for ${yamlValue(readFileSync(resolve(root, '.mawa-config.yaml'), 'utf8'), 'current_stage')}.`);
  }
}
