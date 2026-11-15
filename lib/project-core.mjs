import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { basename, dirname, relative, resolve } from 'node:path';

const sourceRoot = resolve(import.meta.dirname, '..');
const packageInfo = JSON.parse(readFileSync(resolve(sourceRoot, 'package.json'), 'utf8'));
export const ENGINE_VERSION = packageInfo.version;
export const RAW_STAGE = 'raw-briefing';
const rawHeadings = {
  'pt-BR': ['# Raw Briefing', '## Problema', '## Pessoas envolvidas', '## Resultado desejado', '## Contexto, restrições e referências'],
  en: ['# Raw Briefing', '## Problem', '## People involved', '## Desired outcome', '## Context, constraints, and references'],
};

export class MawaError extends Error {
  constructor(message, code = 'MAWA_ERROR', details = []) {
    super(message); this.code = code; this.details = details;
  }
}

const now = () => new Date().toISOString();
const mpath = (root, ...parts) => resolve(root, '.mawa', ...parts);
const dpath = (root, ...parts) => resolve(root, 'docs', 'mawa', ...parts);
const rel = (root, path) => relative(root, path).replaceAll('\\', '/');
const hash = (path) => createHash('sha256').update(readFileSync(path)).digest('hex');
const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));
const write = (path, value) => {
  mkdirSync(dirname(path), { recursive: true });
  const temporary = path + '.tmp';
  writeFileSync(temporary, value);
  renameSync(temporary, path);
};
const writeJson = (path, value) => write(path, JSON.stringify(value, null, 2) + '\n');
const template = (name, language) => {
  const locale = language === 'en' ? 'en' : 'pt-BR';
  return readFileSync(resolve(sourceRoot, 'templates', 'core', `${name}.${locale}.md`), 'utf8');
};
const git = (root, args) => spawnSync('git', args, { cwd: root, encoding: 'utf8' });
const gitOk = (root, args) => git(root, args).status === 0;
const manifestPath = (root) => mpath(root, 'manifest.json');
const statePath = (root) => mpath(root, 'state.json');

function requireGit(root, initializeGit) {
  if (!gitOk(root, ['rev-parse', '--is-inside-work-tree'])) {
    if (!initializeGit) throw new MawaError('Git is required for an auditable MAWA project. Initialize Git and run mawa init again.', 'GIT_REQUIRED');
    const result = git(root, ['init']);
    if (result.status !== 0) throw new MawaError(`Could not initialize Git: ${result.stderr.trim()}`, 'GIT_INIT_FAILED');
  }
  const name = git(root, ['config', 'user.name']).stdout.trim();
  const email = git(root, ['config', 'user.email']).stdout.trim();
  if (!name || !email) throw new MawaError('Git author identity is missing. Configure user.name and user.email before using MAWA approvals.', 'GIT_IDENTITY_REQUIRED');
}

function ensureNoInitializationConflict(root) {
  if (existsSync(manifestPath(root))) throw new MawaError('MAWA is already initialized in this project. Run mawa status instead.', 'ALREADY_INITIALIZED');
  if (existsSync(mpath(root))) throw new MawaError('.mawa already exists. Move or review it before initializing MAWA.', 'OPERATIONAL_CONFLICT');
  if (existsSync(dpath(root))) throw new MawaError('docs/mawa already exists. Move or review it before initializing MAWA.', 'DOCUMENTATION_CONFLICT');
}

function appendEvent(root, type, data = {}) {
  const path = mpath(root, 'audit', 'events.jsonl');
  mkdirSync(dirname(path), { recursive: true });
  appendFileSync(path, JSON.stringify({ at: now(), type, ...data }) + '\n');
}

function writeProjectStatus(root, manifest, state) {
  const portuguese = manifest.language.documentation !== 'en';
  const next = state.currentStage === RAW_STAGE
    ? portuguese ? 'Complete e revise `docs/mawa/intake/raw-briefing.md`, depois execute `mawa approve`.' : 'Complete and review `docs/mawa/intake/raw-briefing.md`, then run `mawa approve`.'
    : state.currentStage === 'briefing'
      ? portuguese ? 'Execute `mawa context` e inicie a entrevista crítica do briefing.' : 'Run `mawa context` and begin the critical briefing interview.'
      : portuguese ? 'Execute `mawa next` para ver as instruções da etapa atual.' : 'Run `mawa next` for the current stage instructions.';
  const labels = portuguese
    ? { title: 'Status do projeto MAWA', project: 'Projeto', stage: 'Etapa atual', next: 'Próxima ação', audit: 'Auditoria', auditText: 'Execute `mawa audit` antes de declarar uma etapa concluída.' }
    : { title: 'MAWA Project Status', project: 'Project', stage: 'Current stage', next: 'Next action', audit: 'Audit', auditText: 'Run `mawa audit` before declaring a stage complete.' };
  write(dpath(root, 'project-status.md'), `# ${labels.title}\n\n## ${labels.project}\n\n${manifest.project.name}\n\n## ${labels.stage}\n\n${state.currentStage}\n\n## ${labels.next}\n\n${next}\n\n## ${labels.audit}\n\n${labels.auditText}\n`);
}

function agentEntry(language) {
  return language === 'en'
    ? '# MAWA Project\n\nRun `mawa status` and `mawa context` before material work. Respect human gates. Read `docs/mawa/agent-contract.md`.\n'
    : '# Projeto MAWA\n\nExecute `mawa status` e `mawa context` antes de trabalho material. Respeite os gates humanos. Leia `docs/mawa/agent-contract.md`.\n';
}

function snapshotCore(root, language) {
  for (const name of ['raw-briefing', 'agent-contract', 'operating-playbook']) {
    write(mpath(root, 'snapshots', 'templates', `${name}.md`), template(name, language));
  }
  for (const name of ['manifest.schema.json', 'decision.schema.json']) {
    write(mpath(root, 'snapshots', 'schemas', name), readFileSync(resolve(sourceRoot, 'schemas', name), 'utf8'));
  }
}

function commitPaths(root, paths, message) {
  const staged = git(root, ['diff', '--cached', '--quiet', '--', ...paths]);
  if (staged.status === 1) throw new MawaError('MAWA will not commit while its target files already contain staged changes. Review or unstage them first.', 'STAGED_CONFLICT');
  if (staged.status !== 0) throw new MawaError(`Could not inspect staged changes: ${staged.stderr.trim()}`, 'GIT_PREFLIGHT_FAILED');
  const add = git(root, ['add', '--', ...paths]);
  if (add.status !== 0) throw new MawaError(`Could not stage MAWA evidence: ${add.stderr.trim()}`, 'GIT_STAGE_FAILED');
  const commit = git(root, ['commit', '--only', '-m', message, '--', ...paths]);
  if (commit.status !== 0) {
    git(root, ['restore', '--staged', '--', ...paths]);
    throw new MawaError(`Could not create the MAWA audit commit: ${(commit.stderr || commit.stdout).trim()}`, 'GIT_COMMIT_FAILED');
  }
  return git(root, ['rev-parse', 'HEAD']).stdout.trim();
}

function restore(path, previous) {
  if (previous === null) rmSync(path, { force: true });
  else write(path, previous);
}

function evidence(root, paths) {
  return paths.map((path) => ({ path: rel(root, path), sha256: hash(path) }));
}

export function isGitRepository(root) { return gitOk(resolve(root), ['rev-parse', '--is-inside-work-tree']); }

export function initProject(rootDirectory, options = {}) {
  const root = resolve(rootDirectory);
  mkdirSync(root, { recursive: true });
  ensureNoInitializationConflict(root);
  requireGit(root, options.initializeGit === true);
  const language = options.language === 'en' ? 'en' : 'pt-BR';
  const projectName = options.name?.trim() || basename(root);
  if (options.rawContent !== undefined && !options.rawContent.trim()) throw new MawaError('The raw briefing cannot be empty.', 'RAW_EMPTY');
  const raw = options.rawContent === undefined ? template('raw-briefing', language) : options.rawContent.trim();
  const manifest = {
    schemaVersion: 1,
    engine: { name: 'MAWA', version: ENGINE_VERSION },
    createdAt: now(),
    project: { name: projectName, root: '.', documentationRoot: 'docs/mawa' },
    language: { interaction: language, documentation: language, code: 'en' },
    stack: null,
    workflowPreference: null,
  };
  const state = {
    schemaVersion: 1,
    currentStage: RAW_STAGE,
    completedStages: ['init'],
    gates: { init: 'approved', rawBriefing: 'pending' },
  };
  const agents = resolve(root, 'AGENTS.md');
  const previousAgents = existsSync(agents) ? readFileSync(agents, 'utf8') : null;
  let agentsAction = 'preserved';
  try {
    writeJson(manifestPath(root), manifest);
    writeJson(statePath(root), state);
    snapshotCore(root, language);
    write(dpath(root, 'intake', 'raw-briefing.md'), raw + (raw.endsWith('\n') ? '' : '\n'));
    write(dpath(root, 'README.md'), language === 'en'
      ? '# MAWA Project Documentation\n\nStart with `intake/raw-briefing.md`. Run `mawa next` for guided instructions.\n'
      : '# Documentação do projeto MAWA\n\nComece por `intake/raw-briefing.md`. Execute `mawa next` para receber instruções guiadas.\n');
    write(dpath(root, 'decision-log.md'), language === 'en'
      ? '# MAWA Decision Log\n\nStructured decisions are stored in `.mawa/decisions/`.\n'
      : '# Registro de decisões MAWA\n\nAs decisões estruturadas ficam em `.mawa/decisions/`.\n');
    write(dpath(root, 'agent-contract.md'), template('agent-contract', language));
    write(dpath(root, 'operating-playbook.md'), template('operating-playbook', language));
    if (previousAgents === null) { write(agents, agentEntry(language)); agentsAction = 'created'; }
    else if (options.appendAgents === true && !previousAgents.includes('docs/mawa/agent-contract.md')) {
      appendFileSync(agents, '\n<!-- MAWA -->\n' + agentEntry(language)); agentsAction = 'appended';
    }
    writeProjectStatus(root, manifest, state);
    appendEvent(root, 'initialized', { engineVersion: ENGINE_VERSION, language, agentsAction });
    const tracked = ['.mawa', 'docs/mawa'];
    if (agentsAction !== 'preserved') tracked.push('AGENTS.md');
    // The manifest state and Raw Briefing are expected to evolve after initialization.
    // Initialization approves the MAWA contract, not their first mutable contents.
    const initializationEvidence = evidence(root, [dpath(root, 'agent-contract.md'), dpath(root, 'operating-playbook.md')]);
    const decisionPath = mpath(root, 'decisions', 'initialization.json');
    writeJson(decisionPath, {
      schemaVersion: 1, id: 'initialization', gate: 'init', decision: 'approved', approvedAt: now(),
      fromStage: 'initializing', toStage: RAW_STAGE, evidence: initializationEvidence, commitRequired: true,
    });
    const commit = commitPaths(root, tracked, 'mawa: initialize project');
    return { manifest, state, agentsAction, commit };
  } catch (error) {
    rmSync(mpath(root), { recursive: true, force: true });
    rmSync(dpath(root), { recursive: true, force: true });
    if (previousAgents === null) rmSync(agents, { force: true });
    else if (agentsAction === 'appended') write(agents, previousAgents);
    throw error;
  }
}

export function loadProject(rootDirectory) {
  const root = resolve(rootDirectory);
  if (!existsSync(manifestPath(root)) || !existsSync(statePath(root))) throw new MawaError('This directory is not initialized. Run mawa init first.', 'NOT_INITIALIZED');
  const manifest = readJson(manifestPath(root));
  const state = readJson(statePath(root));
  if (manifest.schemaVersion !== 1 || state.schemaVersion !== 1) throw new MawaError('Unsupported MAWA manifest or state schema.', 'SCHEMA_UNSUPPORTED');
  return { root, manifest, state };
}

export function rawBriefingPath(rootDirectory) { return dpath(resolve(rootDirectory), 'intake', 'raw-briefing.md'); }

export function replaceRawBriefing(rootDirectory, content) {
  const { root, state } = loadProject(rootDirectory);
  if (state.currentStage !== RAW_STAGE) throw new MawaError('The raw briefing can only be replaced while the current stage is raw-briefing.', 'WRONG_STAGE');
  if (!content?.trim()) throw new MawaError('The raw briefing cannot be empty.', 'RAW_EMPTY');
  write(rawBriefingPath(root), content.trim() + '\n');
  appendEvent(root, 'raw-briefing-updated', { source: 'intake' });
  return rawBriefingPath(root);
}

export function validateRawBriefing(rootDirectory) {
  const { root, manifest, state } = loadProject(rootDirectory);
  const path = rawBriefingPath(root);
  const errors = [];
  if (state.currentStage !== RAW_STAGE) errors.push('Raw briefing approval is not the current gate.');
  if (!existsSync(path)) return ['Missing raw briefing: docs/mawa/intake/raw-briefing.md'];
  const content = readFileSync(path, 'utf8');
  const headings = rawHeadings[manifest.language.documentation] || rawHeadings['pt-BR'];
  for (let index = 0; index < headings.length; index += 1) {
    const heading = headings[index];
    if (!content.includes(heading)) { errors.push(`Missing required section: ${heading}`); continue; }
    if (index > 0) {
      const next = headings[index + 1];
      const section = content.slice(content.indexOf(heading) + heading.length, next ? content.indexOf(next) : undefined).trim();
      if (section.length < 8) errors.push(`Section needs more detail: ${heading}`);
      if (/^\[[^\]]+\]$/m.test(section)) errors.push(`Replace the placeholder in: ${heading}`);
    }
  }
  return errors;
}

export function approveCurrentGate(rootDirectory, comment = null) {
  const { root, manifest, state } = loadProject(rootDirectory);
  if (state.currentStage !== RAW_STAGE) throw new MawaError(`No approval handler exists yet for ${state.currentStage}.`, 'UNSUPPORTED_GATE');
  const errors = validateRawBriefing(root);
  if (errors.length) throw new MawaError('Approval blocked.\n' + errors.map((item) => `- ${item}`).join('\n'), 'APPROVAL_BLOCKED', errors);
  requireGit(root, false);
  const stateFile = statePath(root);
  const statusFile = dpath(root, 'project-status.md');
  const eventsFile = mpath(root, 'audit', 'events.jsonl');
  const before = new Map([[stateFile, readFileSync(stateFile, 'utf8')], [statusFile, readFileSync(statusFile, 'utf8')], [eventsFile, existsSync(eventsFile) ? readFileSync(eventsFile, 'utf8') : null]]);
  const nextState = structuredClone(state);
  nextState.currentStage = 'briefing';
  nextState.completedStages.push(RAW_STAGE);
  nextState.gates.rawBriefing = 'approved';
  const evidenceFiles = [rawBriefingPath(root)];
  const id = `${now().replaceAll(':', '-').replaceAll('.', '-')}-raw-briefing`;
  const decisionFile = mpath(root, 'decisions', `${id}.json`);
  writeJson(decisionFile, {
    schemaVersion: 1, id, gate: RAW_STAGE, decision: 'approved', approvedAt: now(), comment,
    fromStage: RAW_STAGE, toStage: 'briefing', evidence: evidence(root, evidenceFiles), commitRequired: true,
  });
  writeJson(stateFile, nextState);
  writeProjectStatus(root, manifest, nextState);
  appendEvent(root, 'gate-approved', { gate: RAW_STAGE, decision: rel(root, decisionFile) });
  try {
    const commit = commitPaths(root, [rel(root, rawBriefingPath(root)), '.mawa', 'docs/mawa/project-status.md'], 'mawa: approve raw-briefing');
    return { decision: rel(root, decisionFile), commit, currentStage: nextState.currentStage };
  } catch (error) {
    for (const [path, content] of before) restore(path, content);
    rmSync(decisionFile, { force: true });
    throw error;
  }
}

export function getStatus(rootDirectory) {
  const { root, manifest, state } = loadProject(rootDirectory);
  return {
    project: manifest.project.name,
    currentStage: state.currentStage,
    nextApproval: state.currentStage === RAW_STAGE ? 'raw-briefing' : state.currentStage,
    audit: auditProject(root).length ? 'issues-found' : 'intact',
    statusDocument: rel(root, dpath(root, 'project-status.md')),
  };
}

export function getNext(rootDirectory) {
  const { root, manifest, state } = loadProject(rootDirectory);
  const portuguese = manifest.language.interaction !== 'en';
  if (state.currentStage === RAW_STAGE) return {
    stage: RAW_STAGE,
    artifact: rel(root, rawBriefingPath(root)),
    instructions: portuguese
      ? ['Complete ou revise o raw briefing.', 'Não crie uma especificação ainda.', 'Execute mawa approve quando o briefing representar corretamente o ponto de partida atual.']
      : ['Complete or review the raw briefing.', 'Do not create a specification yet.', 'Run mawa approve when the briefing accurately represents the current starting point.'],
  };
  if (state.currentStage === 'briefing') return {
    stage: 'briefing', artifact: 'docs/mawa/agent-contract.md',
    instructions: portuguese
      ? ['Execute mawa context.', 'Conduza a entrevista crítica antes de escrever o project brief.', 'Não avance sem aprovação humana explícita.']
      : ['Run mawa context.', 'Conduct the critical interview before writing the project brief.', 'Do not advance without an explicit human approval.'],
  };
  return { stage: state.currentStage, artifact: null, instructions: [portuguese ? 'Ainda não há instruções guiadas para esta etapa.' : 'No guided instructions exist for this stage yet.'] };
}

export function getContext(rootDirectory) {
  const { root, manifest, state } = loadProject(rootDirectory);
  return {
    stage: state.currentStage,
    language: manifest.language,
    requiredReferences: state.currentStage === RAW_STAGE
      ? ['docs/mawa/intake/raw-briefing.md', 'docs/mawa/agent-contract.md', 'docs/mawa/operating-playbook.md']
      : ['docs/mawa/intake/raw-briefing.md', 'docs/mawa/agent-contract.md', 'docs/mawa/operating-playbook.md'],
    blockedActions: state.currentStage === RAW_STAGE
      ? [manifest.language.interaction === 'en' ? 'Do not generate the project brief before raw-briefing approval.' : 'Não gere o project brief antes da aprovação do raw briefing.']
      : [],
    tokenBudget: 1200,
  };
}

export function auditProject(rootDirectory) {
  let project;
  try { project = loadProject(rootDirectory); } catch (error) { return [error.message]; }
  const { root, state } = project;
  const issues = [];
  const directory = mpath(root, 'decisions');
  if (!existsSync(directory)) issues.push('Missing .mawa/decisions directory.');
  else {
    const decisions = readdirSync(directory).filter((file) => file.endsWith('.json'));
    for (const file of decisions) {
      let decision;
      try { decision = readJson(resolve(directory, file)); } catch { issues.push(`Invalid decision: ${file}`); continue; }
      if (decision.commitRequired !== true) issues.push(`Decision does not require a commit: ${file}`);
      for (const item of decision.evidence || []) {
        const target = resolve(root, item.path);
        if (!existsSync(target)) issues.push(`Missing approved evidence: ${item.path}`);
        else if (hash(target) !== item.sha256) issues.push(`Approved evidence changed: ${item.path}`);
      }
      if (!gitOk(root, ['log', '--format=%H', '--', rel(root, resolve(directory, file))])) issues.push(`Decision is not committed: ${file}`);
    }
  }
  if (state.gates.rawBriefing === 'approved' && state.currentStage !== 'briefing') issues.push('State disagrees with raw briefing approval.');
  return issues;
}
