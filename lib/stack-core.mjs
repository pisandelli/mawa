import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, relative, resolve } from 'node:path';
import { loadProject, MawaError } from './project-core.mjs';

const sourceRoot = resolve(import.meta.dirname, '..');
const stackRoot = resolve(sourceRoot, 'templates', 'stacks');
const profileRoot = resolve(sourceRoot, 'profiles');
const BASELINE_PACKAGES = ['nuxt', '@pinia/nuxt', 'pinia', '@vueuse/nuxt', '@pisandelli/daredash', '@nuxt/eslint', 'eslint'];

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
