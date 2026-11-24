import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { basename, relative, resolve } from 'node:path';
import { loadProject, MawaError, recordProjectEvent, refreshProjectStatus } from './project-core.mjs';

const sourceRoot = resolve(import.meta.dirname, '..');
const stackRoot = resolve(sourceRoot, 'templates', 'stacks');
const profileRoot = resolve(sourceRoot, 'profiles');
const BASELINE_PACKAGES = ['nuxt', '@pinia/nuxt', 'pinia', '@vueuse/nuxt', '@pisandelli/daredash', '@nuxt/eslint', 'eslint'];

function write(path, value) {
  mkdirSync(resolve(path, '..'), { recursive: true });
  const temporary = path + '.tmp';
  writeFileSync(temporary, value);
  renameSync(temporary, path);
}

function writeJson(path, value) { write(path, JSON.stringify(value, null, 2) + '\n'); }
function rel(root, path) { return relative(root, path).replaceAll('\\', '/'); }

function readJson(path, errorCode, description) {
  try { return JSON.parse(readFileSync(path, 'utf8')); }
  catch { throw new MawaError(`Invalid ${description}: ${path}`, errorCode); }
}

function requireString(value, label) {
  if (typeof value !== 'string' || !value.trim()) throw new MawaError(`Invalid stack template: ${label} must be a non-empty string.`, 'INVALID_STACK_TEMPLATE');
}

function validateTemplate(template) {
  if (template.schemaVersion !== 1) throw new MawaError('Unsupported stack template schema.', 'STACK_SCHEMA_UNSUPPORTED');
  for (const key of ['id', 'version', 'label', 'profile', 'packageManager']) requireString(template[key], key);
  if (!template.runtime || typeof template.runtime.node !== 'string') throw new MawaError('Invalid stack template: runtime.node is required.', 'INVALID_STACK_TEMPLATE');
  if (!template.uiLibrary?.instructions || !Array.isArray(template.recipes) || !Array.isArray(template.patches) || !Array.isArray(template.validations)) {
    throw new MawaError('Invalid stack template: missing instructions, recipes, patches, or validations.', 'INVALID_STACK_TEMPLATE');
  }
  return template;
}

function stackDirectory(id) {
  if (!/^[a-z0-9-]+$/.test(id)) throw new MawaError('Unknown stack template.', 'UNKNOWN_STACK_TEMPLATE');
  return resolve(stackRoot, id);
}

function isInside(parent, candidate) {
  const path = relative(parent, candidate);
  return path === '' || (!path.startsWith('..') && !path.startsWith('/') && !path.startsWith('\\'));
}

function appPath(root, value) {
  const resolved = resolve(root, value || '.');
  if (!isInside(root, resolved)) throw new MawaError('appRoot must stay inside the MAWA project root.', 'APP_ROOT_OUTSIDE_PROJECT');
  return resolved;
}

function packageDependencies(appRoot) {
  const packagePath = resolve(appRoot, 'package.json');
  if (!existsSync(packagePath)) return { packagePath, manifest: null, dependencies: {} };
  const manifest = readJson(packagePath, 'INVALID_PACKAGE_JSON', 'package.json');
  return { packagePath, manifest, dependencies: { ...(manifest.dependencies || {}), ...(manifest.devDependencies || {}) } };
}

function configAssessment(appRoot) {
  const path = resolve(appRoot, 'nuxt.config.ts');
  if (!existsSync(path)) return { path, status: 'not-created', reason: 'nuxt.config.ts is missing.' };
  const source = readFileSync(path, 'utf8');
  if (/modules\s*:\s*[A-Za-z_$][\w$]*/.test(source) || /\{\s*modules\s*\}/.test(source)) {
    return { path, status: 'conflict', reason: 'The modules configuration is dynamic and cannot receive a safe automatic patch.' };
  }
  if (!/defineNuxtConfig\s*\(/.test(source)) return { path, status: 'conflict', reason: 'The Nuxt configuration cannot be recognized safely.' };
  return { path, status: 'review-required', reason: 'A minimal AST patch can be proposed, but never applied without review.' };
}

function uiInstructions(appRoot, template) {
  const details = template.uiLibrary.instructions;
  const local = (details.localCandidates || []).map((path) => resolve(appRoot, path)).filter(existsSync);
  return {
    precedence: details.precedence || [],
    resolvedLocalFiles: local.map((path) => relative(appRoot, path).replaceAll('\\', '/')),
    remoteSource: details.remoteSource || null,
    rules: details.rules || null,
  };
}

function recipeCommands(template) {
  return template.recipes.flatMap((file) => {
    const recipe = readJson(resolve(template.directory, file), 'INVALID_STACK_TEMPLATE', 'stack recipe');
    const commands = recipe.commands || (recipe.command ? [recipe.command] : []);
    return commands.map((command) => ({ recipe: recipe.id, ...command }));
  });
}

function commandText(command) {
  return [command.executable, ...(command.arguments || [])].join(' ');
}

function configObjectRange(source) {
  const call = /defineNuxtConfig\s*\(/.exec(source);
  if (!call) return null;
  const open = source.indexOf('{', call.index + call[0].length);
  if (open < 0) return null;
  let quote = null; let lineComment = false; let blockComment = false; let escaped = false; let depth = 0;
  for (let index = open; index < source.length; index += 1) {
    const char = source[index]; const next = source[index + 1];
    if (lineComment) { if (char === '\n') lineComment = false; continue; }
    if (blockComment) { if (char === '*' && next === '/') { blockComment = false; index += 1; } continue; }
    if (quote) { if (!escaped && char === quote) quote = null; escaped = !escaped && char === '\\'; continue; }
    if (char === '/' && next === '/') { lineComment = true; index += 1; continue; }
    if (char === '/' && next === '*') { blockComment = true; index += 1; continue; }
    if (char === '"' || char === "'" || char === '`') { quote = char; escaped = false; continue; }
    if (char === '{') depth += 1;
    if (char === '}' && --depth === 0) return { open, close: index };
  }
  return null;
}

function baselineConfigSnippet(selection, policy) {
  const modules = policy.modules.map((item) => `'${item}'`).join(', ');
  return `  modules: [${modules}],\n  typescript: { strict: true },\n  pinia: { storesDirs: ['./app/stores/**'] },\n  daredash: { prefix: '${selection.ui.prefix}', debug: ${selection.ui.debug} },`;
}

function isCompleteBaselineConfig(body, selection, policy) {
  return policy.modules.every((item) => body.includes(`'${item}'`) || body.includes(`"${item}"`))
    && /typescript\s*:\s*\{[^}]*strict\s*:\s*true/s.test(body)
    && /pinia\s*:\s*\{[^}]*storesDirs\s*:/s.test(body)
    && new RegExp(`daredash\\s*:\\s*\\{[^}]*prefix\\s*:\\s*['\"]${selection.ui.prefix}['\"][^}]*debug\\s*:\\s*${selection.ui.debug}`, 's').test(body);
}

function proposeConfigPatch(path, selection, policy) {
  if (!existsSync(path)) return { status: 'pending-scaffold', reason: 'nuxt.config.ts will be created by the scaffold recipe before this patch can be applied.', patch: null };
  const source = readFileSync(path, 'utf8');
  const range = configObjectRange(source);
  if (!range || /\.\.\.|modules\s*:\s*[A-Za-z_$][\w$]*/.test(source)) return { status: 'blocked', reason: 'The Nuxt configuration contains an unsupported dynamic expression.', patch: null };
  const body = source.slice(range.open + 1, range.close);
  if (isCompleteBaselineConfig(body, selection, policy)) return { status: 'already-compliant', reason: 'The required MAWA baseline is already present.', patch: null };
  if (/\b(modules|typescript|pinia|daredash)\s*:/.test(body)) return { status: 'blocked', reason: 'The Nuxt configuration partially defines MAWA baseline options and cannot be merged safely.', patch: null };
  const before = source.slice(0, range.close);
  const indentation = body.match(/\n(\s*)\S/)?.[1] || '  ';
  const snippet = baselineConfigSnippet(selection, policy).replaceAll('  ', indentation);
  const needsComma = body.trim().length > 0 && !body.trimEnd().endsWith(',');
  const patched = `${before}${needsComma ? ',' : ''}\n${snippet}\n${source.slice(range.close)}`;
  return { status: 'proposed', reason: 'A minimal append-only patch is available for human review.', patch: { source, patched, snippet } };
}

function patchDocument(language, selection, proposal, path) {
  const title = language === 'en' ? '# Nuxt Configuration Patch Proposal' : '# Proposta de patch da configuração Nuxt';
  const status = language === 'en' ? 'Status' : 'Status';
  const reason = language === 'en' ? 'Reason' : 'Motivo';
  if (!proposal.patch) return `${title}\n\n## ${status}\n\n${proposal.status}\n\n## ${reason}\n\n${proposal.reason}\n`;
  return `${title}\n\n## ${status}\n\n${proposal.status}\n\n## ${reason}\n\n${proposal.reason}\n\n## Target\n\n\`${path}\`\n\n## Proposed append\n\n\`\`\`ts\n${proposal.patch.snippet}\n\`\`\`\n\nThis proposal does not modify the application. Its hash is recorded operationally and it must be reviewed before a later execution command can apply it.\n`;
}

function snapshotStack(root, template) {
  const target = resolve(root, '.mawa', 'snapshots', 'stacks', `${template.id}@${template.version}`);
  const templateTarget = resolve(target, 'template');
  const profileTarget = resolve(target, 'profile.json');
  if (existsSync(target)) throw new MawaError(`A stack snapshot already exists: ${rel(root, target)}`, 'STACK_SNAPSHOT_EXISTS');
  mkdirSync(target, { recursive: true });
  cpSync(template.directory, templateTarget, { recursive: true });
  cpSync(resolve(profileRoot, template.profile.id, 'profile.json'), profileTarget);
  return { root: rel(root, target), template: rel(root, resolve(templateTarget, 'template.json')), profile: rel(root, profileTarget) };
}

function planDocument(language, selection, report, template) {
  const commands = recipeCommands(template);
  const configPolicy = readJson(resolve(template.directory, template.patches[0]), 'INVALID_STACK_TEMPLATE', 'stack patch policy');
  if (language === 'en') return `# Setup Plan

## Doctor report

- Project kind: ${report.projectKind}
- Baseline: ${report.baseline}
- Nuxt configuration: ${report.config.status} — ${report.config.reason}
- Missing packages: ${report.missingPackages.length ? report.missingPackages.join(', ') : 'none'}
- Landing route: ${report.landingPage.path} (${report.landingPage.exists ? 'present' : 'will be created'})

## Selected stack

- Stack: ${template.id}@${template.version}
- Corporate profile: ${template.profile.id}@${template.profile.version}
- Application root: ${selection.appRoot}
- Template language: ${selection.templateLanguage}
- DareDash: prefix ${selection.ui.prefix}, debug ${selection.ui.debug}
- DareDash source: ${template.uiLibrary.distribution.specifier}
- Frozen snapshot: ${selection.snapshot.root}

## UI instruction contract

Read DareDash instructions in this order: ${report.uiInstructions.precedence.join(' → ')}.
Local files found: ${report.uiInstructions.resolvedLocalFiles.length ? report.uiInstructions.resolvedLocalFiles.join(', ') : 'none'}.
Fallback source: ${report.uiInstructions.remoteSource}.

## Planned recipes

${commands.map((command) => `- ${command.recipe}: \`${commandText(command)}\`${command.when ? ' (conditional)' : ''}`).join('\n')}

## Patch policy

Target: \`${configPolicy.target}\`. Strategy: ${configPolicy.strategy}. Existing configuration is never overwritten. Required human review: ${configPolicy.requiresHumanReview}. Conflicts: ${configPolicy.conflicts.join(', ')}.

## Validation evidence

Run the declared typecheck, lint, optional test, and route \`/\` verification after recipe execution. Preserve command output as evidence.

## Human approval

This plan does not execute any command or patch. Approval freezes this stack selection and authorizes only the later audited execution stage.
`;
  return `# Plano de setup

## Diagnóstico

- Tipo de projeto: ${report.projectKind}
- Baseline: ${report.baseline}
- Configuração Nuxt: ${report.config.status} — ${report.config.reason}
- Pacotes ausentes: ${report.missingPackages.length ? report.missingPackages.join(', ') : 'nenhum'}
- Rota inicial: ${report.landingPage.path} (${report.landingPage.exists ? 'presente' : 'será criada'})

## Stack selecionada

- Stack: ${template.id}@${template.version}
- Perfil corporativo: ${template.profile.id}@${template.profile.version}
- Diretório da aplicação: ${selection.appRoot}
- Linguagem de template: ${selection.templateLanguage}
- DareDash: prefixo ${selection.ui.prefix}, debug ${selection.ui.debug}
- Fonte DareDash: ${template.uiLibrary.distribution.specifier}
- Snapshot congelado: ${selection.snapshot.root}

## Contrato de instruções de UI

Leia as instruções do DareDash nesta ordem: ${report.uiInstructions.precedence.join(' → ')}.
Arquivos locais encontrados: ${report.uiInstructions.resolvedLocalFiles.length ? report.uiInstructions.resolvedLocalFiles.join(', ') : 'nenhum'}.
Fonte de fallback: ${report.uiInstructions.remoteSource}.

## Receitas planejadas

${commands.map((command) => `- ${command.recipe}: \`${commandText(command)}\`${command.when ? ' (condicional)' : ''}`).join('\n')}

## Política de patch

Alvo: \`${configPolicy.target}\`. Estratégia: ${configPolicy.strategy}. A configuração existente nunca será sobrescrita. Revisão humana obrigatória: ${configPolicy.requiresHumanReview}. Conflitos: ${configPolicy.conflicts.join(', ')}.

## Evidências de validação

Após executar as receitas, rode o typecheck, lint, teste opcional e a verificação da rota \`/\` declarados. Preserve a saída dos comandos como evidência.

## Aprovação humana

Este plano não executa comandos ou patches. A aprovação congela a seleção da stack e autoriza apenas a futura etapa de execução auditável.
`;
}

export function listStackTemplates() {
  if (!existsSync(stackRoot)) return [];
  return readdirSync(stackRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(resolve(stackRoot, entry.name, 'template.json')))
    .map((entry) => loadStackTemplate(entry.name));
}

export function loadStackTemplate(id) {
  const directory = stackDirectory(id);
  const template = validateTemplate(readJson(resolve(directory, 'template.json'), 'INVALID_STACK_TEMPLATE', 'stack template'));
  const profile = readJson(resolve(profileRoot, template.profile, 'profile.json'), 'INVALID_PROFILE', 'corporate profile');
  return { ...template, directory, profile };
}

export function inspectNuxtDaredashApp(appRootDirectory, template = loadStackTemplate('nuxt-daredash')) {
  const appRoot = resolve(appRootDirectory);
  const packageInfo = packageDependencies(appRoot);
  const exists = existsSync(appRoot);
  const landingPage = resolve(appRoot, 'app', 'pages', 'index.vue');
  const config = configAssessment(appRoot);
  const missingPackages = BASELINE_PACKAGES.filter((name) => !packageInfo.dependencies[name]);
  const hasNuxt = Boolean(packageInfo.dependencies.nuxt);
  const projectKind = !exists || !packageInfo.manifest ? 'new' : hasNuxt ? 'existing' : 'conflict';
  const baseline = projectKind === 'new'
    ? 'missing'
    : projectKind === 'conflict' || missingPackages.length || !existsSync(landingPage)
      ? 'incomplete'
      : 'complete';
  return {
    template: { id: template.id, version: template.version, label: template.label, profile: template.profile.id },
    appRoot,
    projectKind,
    baseline,
    runtime: { currentNode: process.version, requiredNode: template.runtime.node, packageManager: template.packageManager },
    package: packageInfo.manifest ? { path: basename(packageInfo.packagePath), packageManager: packageInfo.manifest.packageManager || null } : null,
    missingPackages,
    landingPage: { path: relative(appRoot, landingPage).replaceAll('\\', '/'), exists: existsSync(landingPage) },
    config: { ...config, path: relative(appRoot, config.path).replaceAll('\\', '/') },
    uiInstructions: uiInstructions(appRoot, template),
    recipeFiles: template.recipes,
    patchFiles: template.patches,
    validationFiles: template.validations,
  };
}

export function doctorProject(rootDirectory, options = {}) {
  const { root, state } = loadProject(rootDirectory);
  if (state.currentStage !== 'setup') throw new MawaError('The stack doctor is available after the critical briefing is approved.', 'WRONG_STAGE');
  const template = loadStackTemplate(options.stack || 'nuxt-daredash');
  const appRoot = appPath(root, options.appRoot || '.');
  return inspectNuxtDaredashApp(appRoot, template);
}

export function createSetupPlan(rootDirectory, options = {}) {
  const { root, manifest, state } = loadProject(rootDirectory);
  if (state.currentStage !== 'setup') throw new MawaError('A setup plan can only be created at the setup stage.', 'WRONG_STAGE');
  if (state.gates.setupPlan === 'pending' || state.gates.setupPlan === 'approved') throw new MawaError('A setup plan already exists. Review or approve the existing plan instead of replacing it.', 'SETUP_PLAN_EXISTS');
  const template = loadStackTemplate(options.stack || 'nuxt-daredash');
  const appRoot = appPath(root, options.appRoot || 'web');
  const relativeAppRoot = rel(root, appRoot) || '.';
  if (relativeAppRoot === 'app') throw new MawaError('appRoot cannot be ./app because Nuxt uses app/ as its source directory.', 'INVALID_APP_ROOT');
  const templateLanguage = options.templateLanguage === 'html' ? 'html' : 'pug';
  const prefix = options.ui?.prefix || 'dd';
  if (!/^[a-z][a-z0-9-]*$/.test(prefix)) throw new MawaError('DareDash prefix must be lowercase letters, digits, and hyphens.', 'INVALID_UI_PREFIX');
  const report = inspectNuxtDaredashApp(appRoot, template);
  const selectionPath = resolve(root, '.mawa', 'setup', 'selection.json');
  const doctorPath = resolve(root, 'docs', 'mawa', 'setup', 'doctor-report.md');
  const planPath = resolve(root, 'docs', 'mawa', 'setup', 'setup-plan.md');
  const statePath = resolve(root, '.mawa', 'state.json');
  const statusPath = resolve(root, 'docs', 'mawa', 'project-status.md');
  const eventsPath = resolve(root, '.mawa', 'audit', 'events.jsonl');
  for (const path of [selectionPath, doctorPath, planPath]) {
    if (existsSync(path)) throw new MawaError(`Setup plan artifact already exists: ${rel(root, path)}`, 'SETUP_PLAN_ARTIFACT_EXISTS');
  }
  const previous = new Map([statePath, statusPath, eventsPath].map((path) => [path, existsSync(path) ? readFileSync(path, 'utf8') : null]));
  let snapshot;
  const selection = {
    schemaVersion: 1,
    createdAt: new Date().toISOString(),
    stack: { id: template.id, version: template.version },
    profile: { id: template.profile.id, version: template.profile.version },
    appRoot: relativeAppRoot,
    templateLanguage,
    ui: { library: template.uiLibrary.name, prefix, debug: options.ui?.debug === true },
    doctor: { projectKind: report.projectKind, baseline: report.baseline, configStatus: report.config.status },
    snapshot,
  };
  try {
    snapshot = snapshotStack(root, template);
    selection.snapshot = snapshot;
    writeJson(selectionPath, selection);
    write(doctorPath, `# MAWA Doctor Report\n\n\`\`\`json\n${JSON.stringify(report, null, 2)}\n\`\`\`\n`);
    write(planPath, planDocument(manifest.language.documentation, selection, report, template));
    const nextState = structuredClone(state);
    nextState.gates.setupPlan = 'pending';
    writeJson(resolve(root, '.mawa', 'state.json'), nextState);
    refreshProjectStatus(root);
    recordProjectEvent(root, 'setup-plan-created', { stack: template.id, appRoot: relativeAppRoot, templateLanguage });
    return { selection, report, plan: rel(root, planPath), doctor: rel(root, doctorPath) };
  } catch (error) {
    for (const [path, content] of previous) {
      if (content === null) rmSync(path, { force: true });
      else write(path, content);
    }
    rmSync(selectionPath, { force: true });
    rmSync(doctorPath, { force: true });
    rmSync(planPath, { force: true });
    if (snapshot?.root) rmSync(resolve(root, snapshot.root), { recursive: true, force: true });
    throw error;
  }
}

export function createNuxtConfigPatchProposal(rootDirectory) {
  const { root, manifest, state } = loadProject(rootDirectory);
  if (state.currentStage !== 'setup-apply' || state.gates.setupPlan !== 'approved') {
    throw new MawaError('A Nuxt patch proposal requires an approved setup plan.', 'WRONG_STAGE');
  }
  const selectionPath = resolve(root, '.mawa', 'setup', 'selection.json');
  if (!existsSync(selectionPath)) throw new MawaError('Missing frozen setup selection.', 'SETUP_SELECTION_MISSING');
  const selection = readJson(selectionPath, 'INVALID_SETUP_SELECTION', 'setup selection');
  const templatePath = resolve(root, selection.snapshot?.template || '');
  if (!isInside(root, templatePath) || !existsSync(templatePath)) throw new MawaError('Missing frozen stack template.', 'STACK_SNAPSHOT_MISSING');
  const templateDirectory = resolve(templatePath, '..');
  const policy = readJson(resolve(templateDirectory, 'patches', 'nuxt-config.json'), 'INVALID_STACK_TEMPLATE', 'stack patch policy');
  const appRoot = appPath(root, selection.appRoot);
  const target = resolve(appRoot, policy.target);
  const proposalPath = resolve(root, 'docs', 'mawa', 'setup', 'nuxt-config.patch.md');
  const evidencePath = resolve(root, '.mawa', 'setup', 'nuxt-config-proposal.json');
  if (existsSync(proposalPath) || existsSync(evidencePath)) throw new MawaError('A Nuxt configuration proposal already exists. Review it instead of replacing it.', 'PATCH_PROPOSAL_EXISTS');
  const proposal = proposeConfigPatch(target, selection, policy);
  write(proposalPath, patchDocument(manifest.language.documentation, selection, proposal, rel(root, target)));
  writeJson(evidencePath, {
    schemaVersion: 1,
    createdAt: new Date().toISOString(),
    target: rel(root, target),
    policy: policy.id,
    status: proposal.status,
    reason: proposal.reason,
    sourceSha256: proposal.patch ? createHash('sha256').update(proposal.patch.source).digest('hex') : null,
    proposedSha256: proposal.patch ? createHash('sha256').update(proposal.patch.patched).digest('hex') : null,
  });
  recordProjectEvent(root, 'nuxt-config-patch-proposed', { status: proposal.status, target: rel(root, target) });
  return { status: proposal.status, proposal: rel(root, proposalPath), evidence: rel(root, evidencePath) };
}

export function applyNuxtConfigPatch(rootDirectory, options = {}) {
  const { root, state } = loadProject(rootDirectory);
  if (state.currentStage !== 'setup-apply' || state.gates.setupPlan !== 'approved') throw new MawaError('Applying a Nuxt patch requires an approved setup plan.', 'WRONG_STAGE');
  if (options.confirmed !== true) throw new MawaError('Applying a setup patch requires explicit human confirmation.', 'PATCH_CONFIRMATION_REQUIRED');
  const selection = readJson(resolve(root, '.mawa', 'setup', 'selection.json'), 'INVALID_SETUP_SELECTION', 'setup selection');
  const proposalEvidencePath = resolve(root, '.mawa', 'setup', 'nuxt-config-proposal.json');
  if (!existsSync(proposalEvidencePath)) throw new MawaError('Generate and review a Nuxt patch proposal before applying it.', 'PATCH_PROPOSAL_MISSING');
  const approvedProposal = readJson(proposalEvidencePath, 'INVALID_PATCH_PROPOSAL', 'Nuxt patch proposal');
  const templatePath = resolve(root, selection.snapshot?.template || '');
  const policy = readJson(resolve(templatePath, '..', 'patches', 'nuxt-config.json'), 'INVALID_STACK_TEMPLATE', 'stack patch policy');
  const target = resolve(appPath(root, selection.appRoot), policy.target);
  const evidencePath = resolve(root, '.mawa', 'setup', 'nuxt-config-application.json');
  if (existsSync(evidencePath)) throw new MawaError('The Nuxt patch application is already recorded. Do not apply it twice.', 'PATCH_ALREADY_APPLIED');
  const proposal = proposeConfigPatch(target, selection, policy);
  const sourceHash = proposal.patch ? createHash('sha256').update(proposal.patch.source).digest('hex') : null;
  const proposedHash = proposal.patch ? createHash('sha256').update(proposal.patch.patched).digest('hex') : null;
  if (proposal.status !== approvedProposal.status || sourceHash !== approvedProposal.sourceSha256 || proposedHash !== approvedProposal.proposedSha256) {
    throw new MawaError('The Nuxt configuration changed or the proposal no longer matches. Generate and review a new proposal before applying.', 'PATCH_STALE');
  }
  if (proposal.status === 'proposed') write(target, proposal.patch.patched);
  if (!['proposed', 'already-compliant'].includes(proposal.status)) throw new MawaError(`The Nuxt patch cannot be applied while its status is ${proposal.status}.`, 'PATCH_NOT_APPLICABLE');
  writeJson(evidencePath, { schemaVersion: 1, at: new Date().toISOString(), target: rel(root, target), status: proposal.status, sourceSha256: sourceHash, appliedSha256: proposal.status === 'proposed' ? createHash('sha256').update(readFileSync(target)).digest('hex') : sourceHash });
  recordProjectEvent(root, 'nuxt-config-patch-applied', { status: proposal.status, target: rel(root, target) });
  return { status: proposal.status, evidence: rel(root, evidencePath), target: rel(root, target) };
}

export function executeSetupScaffold(rootDirectory, options = {}) {
  const { root, state } = loadProject(rootDirectory);
  if (state.currentStage !== 'setup-apply' || state.gates.setupPlan !== 'approved') throw new MawaError('Scaffold execution requires an approved setup plan.', 'WRONG_STAGE');
  if (options.confirmed !== true) throw new MawaError('Each setup recipe requires explicit human confirmation.', 'RECIPE_CONFIRMATION_REQUIRED');
  const selection = readJson(resolve(root, '.mawa', 'setup', 'selection.json'), 'INVALID_SETUP_SELECTION', 'setup selection');
  if (selection.doctor?.projectKind !== 'new') throw new MawaError('The scaffold recipe only applies to a new application. Review the patch proposal for an existing project.', 'SCAFFOLD_NOT_REQUIRED');
  const templatePath = resolve(root, selection.snapshot?.template || '');
  const templateDirectory = resolve(templatePath, '..');
  const profile = readJson(resolve(root, selection.snapshot?.profile || ''), 'INVALID_PROFILE', 'frozen corporate profile');
  const recipe = readJson(resolve(templateDirectory, 'recipes', 'scaffold.json'), 'INVALID_STACK_TEMPLATE', 'scaffold recipe');
  const command = recipe.command;
  if (!profile.commandPolicy?.allowedExecutables?.includes(command.executable) || profile.commandPolicy?.forbidden?.includes(command.executable)) {
    throw new MawaError('The selected scaffold command is not allowed by the frozen corporate profile.', 'COMMAND_NOT_ALLOWED');
  }
  const appRoot = appPath(root, selection.appRoot);
  if (existsSync(appRoot) && readdirSync(appRoot).length) throw new MawaError('The application directory is not empty. MAWA will not scaffold with --force.', 'SCAFFOLD_TARGET_NOT_EMPTY');
  const argumentsList = command.arguments.map((item) => item.replaceAll('{{appRoot}}', selection.appRoot));
  const run = options.runner || ((executable, args, runOptions) => spawnSync(executable, args, runOptions));
  const result = run(command.executable, argumentsList, { cwd: root, encoding: 'utf8' });
  const evidencePath = resolve(root, '.mawa', 'setup', 'scaffold-execution.json');
  writeJson(evidencePath, { schemaVersion: 1, at: new Date().toISOString(), recipe: recipe.id, command: { executable: command.executable, arguments: argumentsList }, exitCode: result.status, stdout: result.stdout || '', stderr: result.stderr || '' });
  recordProjectEvent(root, 'setup-scaffold-executed', { recipe: recipe.id, exitCode: result.status });
  if (result.error || result.status !== 0) throw new MawaError(`The scaffold recipe failed. Review ${rel(root, evidencePath)}; MAWA did not substitute another command.`, 'SCAFFOLD_FAILED');
  const patch = createNuxtConfigPatchProposal(root);
  return { recipe: recipe.id, evidence: rel(root, evidencePath), patch };
}

export function executeSetupDependencies(rootDirectory, options = {}) {
  const { root, state } = loadProject(rootDirectory);
  if (state.currentStage !== 'setup-apply' || state.gates.setupPlan !== 'approved') throw new MawaError('Dependency installation requires an approved setup plan.', 'WRONG_STAGE');
  if (options.confirmed !== true) throw new MawaError('Each setup recipe requires explicit human confirmation.', 'RECIPE_CONFIRMATION_REQUIRED');
  const selection = readJson(resolve(root, '.mawa', 'setup', 'selection.json'), 'INVALID_SETUP_SELECTION', 'setup selection');
  if (!existsSync(resolve(root, '.mawa', 'setup', 'nuxt-config-application.json'))) throw new MawaError('Apply the reviewed Nuxt configuration patch before installing dependencies.', 'PATCH_NOT_APPLIED');
  const evidencePath = resolve(root, '.mawa', 'setup', 'dependencies-execution.json');
  if (existsSync(evidencePath)) throw new MawaError('The dependency recipe is already recorded. Do not execute it twice.', 'DEPENDENCIES_ALREADY_INSTALLED');
  const templatePath = resolve(root, selection.snapshot?.template || '');
  const templateDirectory = resolve(templatePath, '..');
  const profile = readJson(resolve(root, selection.snapshot?.profile || ''), 'INVALID_PROFILE', 'frozen corporate profile');
  const recipe = readJson(resolve(templateDirectory, 'recipes', 'dependencies.json'), 'INVALID_STACK_TEMPLATE', 'dependency recipe');
  const appRoot = appPath(root, selection.appRoot);
  if (!existsSync(resolve(appRoot, 'package.json'))) throw new MawaError('The application package.json is missing. Run the approved scaffold or resolve the project conflict first.', 'PACKAGE_JSON_MISSING');
  const commands = (recipe.commands || []).filter((command) => !command.when || command.when.templateLanguage === selection.templateLanguage);
  const run = options.runner || ((executable, args, runOptions) => spawnSync(executable, args, runOptions));
  const results = [];
  for (const command of commands) {
    if (!profile.commandPolicy?.allowedExecutables?.includes(command.executable) || profile.commandPolicy?.forbidden?.includes(command.executable)) throw new MawaError('A dependency command is not allowed by the frozen corporate profile.', 'COMMAND_NOT_ALLOWED');
    const result = run(command.executable, command.arguments, { cwd: appRoot, encoding: 'utf8' });
    results.push({ executable: command.executable, arguments: command.arguments, exitCode: result.status, stdout: result.stdout || '', stderr: result.stderr || '' });
    if (result.error || result.status !== 0) {
      writeJson(evidencePath, { schemaVersion: 1, at: new Date().toISOString(), recipe: recipe.id, results });
      recordProjectEvent(root, 'setup-dependencies-executed', { recipe: recipe.id, exitCode: result.status });
      throw new MawaError(`The dependency recipe failed. Review ${rel(root, evidencePath)}; MAWA did not substitute versions or sources.`, 'DEPENDENCIES_FAILED');
    }
  }
  writeJson(evidencePath, { schemaVersion: 1, at: new Date().toISOString(), recipe: recipe.id, results });
  recordProjectEvent(root, 'setup-dependencies-executed', { recipe: recipe.id, exitCode: 0 });
  return { recipe: recipe.id, commands: results.length, evidence: rel(root, evidencePath) };
}

export function executeSetupValidations(rootDirectory, options = {}) {
  const { root, state } = loadProject(rootDirectory);
  if (state.currentStage !== 'setup-apply' || state.gates.setupPlan !== 'approved') throw new MawaError('Setup validation requires an approved setup plan.', 'WRONG_STAGE');
  if (options.confirmed !== true) throw new MawaError('Setup validation requires explicit human confirmation.', 'VALIDATION_CONFIRMATION_REQUIRED');
  const selection = readJson(resolve(root, '.mawa', 'setup', 'selection.json'), 'INVALID_SETUP_SELECTION', 'setup selection');
  if (!existsSync(resolve(root, '.mawa', 'setup', 'dependencies-execution.json'))) throw new MawaError('Install the approved dependencies before running validations.', 'DEPENDENCIES_NOT_INSTALLED');
  const evidencePath = resolve(root, '.mawa', 'setup', 'validation-execution.json');
  if (existsSync(evidencePath)) throw new MawaError('Setup validation is already recorded. Do not execute it twice.', 'VALIDATION_ALREADY_RECORDED');
  const templatePath = resolve(root, selection.snapshot?.template || '');
  const templateDirectory = resolve(templatePath, '..');
  const profile = readJson(resolve(root, selection.snapshot?.profile || ''), 'INVALID_PROFILE', 'frozen corporate profile');
  const validation = readJson(resolve(templateDirectory, 'validations', 'baseline.json'), 'INVALID_STACK_TEMPLATE', 'baseline validation');
  const appRoot = appPath(root, selection.appRoot);
  const landing = resolve(appRoot, validation.route.requires);
  if (!existsSync(landing)) write(landing, selection.templateLanguage === 'pug' ? '<template lang="pug">\nmain\n  h1 MAWA setup ready\n</template>\n' : '<template>\n  <main><h1>MAWA setup ready</h1></main>\n</template>\n');
  const packageInfo = packageDependencies(appRoot).manifest || {};
  const commands = (validation.commands || []).filter((command) => !command.optional || packageInfo.scripts?.test);
  const run = options.runner || ((executable, args, runOptions) => spawnSync(executable, args, runOptions));
  const results = [];
  for (const command of commands) {
    if (!profile.commandPolicy?.allowedExecutables?.includes(command.executable)) throw new MawaError('A validation command is not allowed by the frozen corporate profile.', 'COMMAND_NOT_ALLOWED');
    const result = run(command.executable, command.arguments, { cwd: appRoot, encoding: 'utf8' });
    results.push({ id: command.id, executable: command.executable, arguments: command.arguments, exitCode: result.status, stdout: result.stdout || '', stderr: result.stderr || '' });
    if (result.error || result.status !== 0) {
      writeJson(evidencePath, { schemaVersion: 1, at: new Date().toISOString(), results, route: { path: validation.route.path, status: 'structural-ready', landing: rel(root, landing) } });
      recordProjectEvent(root, 'setup-validations-executed', { exitCode: result.status });
      throw new MawaError(`A setup validation failed. Review ${rel(root, evidencePath)}.`, 'VALIDATION_FAILED');
    }
  }
  writeJson(evidencePath, { schemaVersion: 1, at: new Date().toISOString(), results, route: { path: validation.route.path, status: 'structural-ready', landing: rel(root, landing) } });
  recordProjectEvent(root, 'setup-validations-executed', { exitCode: 0 });
  return { commands: results.length, landing: rel(root, landing), evidence: rel(root, evidencePath) };
}

export async function verifySetupRoute(rootDirectory, options = {}) {
  const { root, state } = loadProject(rootDirectory);
  if (state.currentStage !== 'setup-apply' || !existsSync(resolve(root, '.mawa', 'setup', 'validation-execution.json'))) throw new MawaError('Run setup validations before verifying the route.', 'VALIDATION_REQUIRED');
  if (options.confirmed !== true) throw new MawaError('Route verification requires explicit human confirmation.', 'ROUTE_CONFIRMATION_REQUIRED');
  const selection = readJson(resolve(root, '.mawa', 'setup', 'selection.json'), 'INVALID_SETUP_SELECTION', 'setup selection');
  const appRoot = appPath(root, selection.appRoot);
  const evidencePath = resolve(root, '.mawa', 'setup', 'route-verification.json');
  if (existsSync(evidencePath)) throw new MawaError('Route verification is already recorded. Do not execute it twice.', 'ROUTE_ALREADY_VERIFIED');
  const port = options.port || 39000 + Math.floor(Math.random() * 1000);
  const start = options.serverFactory || ((value) => spawn('pnpm', ['exec', 'nuxi', 'dev', '--port', String(value)], { cwd: appRoot, stdio: 'ignore' }));
  const request = options.request || (async (url) => (await fetch(url, { signal: AbortSignal.timeout(3000) })).status);
  const server = start(port);
  let status = null; let failure = null;
  try {
    for (let attempt = 0; attempt < 30; attempt += 1) {
      try { status = await request(`http://127.0.0.1:${port}/`); if (status === 200) break; } catch { /* server is still starting */ }
      await new Promise((resolveDelay) => setTimeout(resolveDelay, 1000));
    }
    if (status !== 200) throw new MawaError('The Nuxt route did not return HTTP 200 before the timeout.', 'ROUTE_VERIFICATION_FAILED');
  } catch (error) { failure = error.message; }
  finally { server.kill?.('SIGTERM'); }
  writeJson(evidencePath, { schemaVersion: 1, at: new Date().toISOString(), path: '/', port, status, failure });
  recordProjectEvent(root, 'setup-route-verified', { status, failure });
  if (failure) throw new MawaError(`${failure} Review ${rel(root, evidencePath)}.`, 'ROUTE_VERIFICATION_FAILED');
  return { status, evidence: rel(root, evidencePath) };
}
