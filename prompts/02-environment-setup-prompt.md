# 02 — Environment Setup Protocol

## Purpose

Set up the selected Nuxt 4 project configuration and adapters only after the deferred
module-plan gate has made the work technically meaningful.

Setup is two-tier (`workflow/setup-policy.md`): the **fixed baseline** is auto-applied and
reported; **everything else** is presented for the human to confirm. MAWA never installs
or modifies setup silently or beyond the baseline.

## Application location

All dependency installs, config files (`nuxt.config.ts`, `tsconfig.json`, `package.json`,
`vitest.config.ts`), and the Nuxt scaffold target `paths.app_root` from
`.mawa-config.yaml` — not the MAWA root. If the application does not exist yet, the
scaffold/install commands target that directory (e.g. `pnpm create nuxt@latest <app_root>`,
then run installs inside it). MAWA workflow files and `specs/` stay at the MAWA root,
separate from the application.

## Inputs

- `.mawa-config.yaml`
- `specs/briefing/project-briefing.md`
- `workflow/setup-policy.md`
- selected UI adapter setup file
- selected design adapter setup file
- `resources/templates/nuxt.config.template.ts`
- `resources/templates/tsconfig.template.json`
- `resources/templates/vitest.config.template.ts`
- `resources/templates/eslint.config.template.mjs`

## Required behavior

1. Read `.mawa-config.yaml`.
2. Verify `state.setup_context`: `first-approved-spec` is valid only for
   `module-by-module`; `all-specs` is valid only after every planned spec is approved in
   `phase-by-phase`. If neither is true, stop and return to the appropriate spec stage.
3. Read the selected UI adapter setup guide.
4. Read the selected design adapter setup guide, if design workflow is enabled.

### Tier 1 — Apply the fixed baseline (auto, then report)

5. In `ide` execution mode, install and configure the fixed baseline automatically inside
   `paths.app_root`, without asking first. In `web` mode, provide the commands for the
   human to run. The baseline is:
   - the Nuxt 4 scaffold, if the application does not exist yet (`pnpm create nuxt@latest <app_root>`);
   - `pnpm add @vueuse/nuxt` (dependency);
   - `pnpm add -D eslint @nuxt/eslint` (devDependencies);
     - when `core.template_language` is `pug`:
     - `pnpm add pug` (dependency);
     - `pnpm add -D @types/pug @vue/language-plugin-pug` (devDependencies);
     - update `nuxt.config.ts` so `typescript.tsConfig.vueCompilerOptions.plugins` adds
       `@vue/language-plugin-pug` without removing Nuxt's existing defaults;
   - `nuxt.config.ts` from `resources/templates/nuxt.config.template.ts`, replacing
     `{{COMPATIBILITY_DATE}}` with the local creation date (`YYYY-MM-DD`). Never leave the
     placeholder in the generated file, never use a dynamic `new Date()` expression, and
     preserve an existing `compatibilityDate` unless its change is explicitly approved;
     modules are wired: `['@nuxt/eslint', '@vueuse/nuxt', '@pinia/nuxt']`;
   - root `tsconfig.json` from `resources/templates/tsconfig.template.json` (Nuxt 4 project
     references — NOT the Nuxt 3 `extends` pattern; without it `nuxi typecheck` cannot
     resolve auto-imported globals, e.g. `Cannot find name 'ref'`);
   - root `eslint.config.mjs` from `resources/templates/eslint.config.template.mjs`.
6. **Report what was applied:** list the commands run, packages added (dependency vs
   devDependency), and files created or modified. Automatic is not silent.
7. Add the temporary welcome page from `resources/templates/welcome.page.template.vue`.
   For a single-view application, use `app/app.vue`. For a routed application, use
   `app/pages/index.vue` and omit `app/app.vue` or make it render `<NuxtPage />` (with
   `<NuxtLayout>` only when distinct layouts are specified). The welcome page is replaced
   by the first approved module implementation.
8. Start the generated app long enough to make a local request to `/` and verify HTTP 200.
   A startup failure or 404 blocks setup completion; report the command and actionable
   diagnostic. Do not leave a development server running after the smoke check.

### Tier 2 — Present for confirmation (do not auto-apply)

9. Present any remaining UI-adapter-specific install commands and configuration snippets,
   and explain adapter-specific decisions.
10. If tests are planned, inspect the selected `@nuxt/test-utils` peer range and present a compatible current Vitest, DOM environment, `vue-tsc`, and TypeScript matrix. Use the Nuxt test template; plain Vitest without the Nuxt environment fails on MAWA stores with `ReferenceError: ref is not defined`. Run both `nuxi typecheck` and tests before calling the matrix supported.
11. Remind the human that design MCP/tooling must already be configured externally. If the design MCP is unavailable, the human may set `design.enabled: false` (skip design globally) or skip per module at Stage 05a.
12. Verify that selected UI operational docs can be loaded from `ui.docs.source_url` when needed. If they are not available in the current session, load them from the URL or, in `web` mode when fetching is unavailable, ask the human to provide the current content. Do not commit a local copy by default.
13. Apply Tier 2 items automatically only if the human explicitly asks; otherwise ask the human to confirm completion.
14. Update or instruct the human to update `.mawa-config.yaml` setup status. Clear
    `state.setup_context`, then route to 05a/06 for the active module in
    `module-by-module`, or to the first applicable layout/implementation phase in
    `phase-by-phase`.

## Setup policy

The fixed baseline (Tier 1) may be installed and configured automatically in `ide` mode
but must be reported. Everything else (Tier 2) is confirm-first: provide commands and
snippets, do not auto-apply unless explicitly asked. Never act silently. Full policy:
`workflow/setup-policy.md`.

## Definition of done

Do not emit the completion message until all are true:

- [ ] Everything targeted `paths.app_root`, not the MAWA root.
- [ ] Fixed baseline applied (`ide`) or commands provided (`web`): Nuxt scaffold, `@pinia/nuxt` + `@nuxt/eslint` + `eslint` + `@vueuse/nuxt`, Pug runtime + language tooling when configured, and `nuxt.config.ts` / `tsconfig.json` / `eslint.config.mjs`.
- [ ] New `nuxt.config.ts` has a literal, valid `compatibilityDate`; no template placeholder remains.
- [ ] Baseline application was reported (commands run, packages added, files changed).
- [ ] Temporary welcome page follows the selected routing strategy and `/` returned HTTP 200.
- [ ] Tier 2 items (UI adapter, test toolchain, design tooling) presented, not auto-applied unless explicitly requested.
- [ ] Selected UI operational docs loaded from `ui.docs.source_url` or requested from the human when required.
- [ ] Design MCP/tooling reminder given when design is enabled.
- [ ] `ui.setup_status` / `design.setup_status` recorded; human confirmed completion (interactive mode).
- [ ] `state.setup_context` was valid for the selected flow and was cleared with an
  unambiguous next stage after setup.

## Stage completion message

End with:

> Environment setup is confirmed. May I proceed to the next approved design or implementation stage?
