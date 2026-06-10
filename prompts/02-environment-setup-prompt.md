# 02 — Environment Setup Protocol

## Purpose

Guide the human through required manual setup for the selected Nuxt 4 project configuration and adapters.

MAWA does not silently install dependencies or modify configuration files during setup.

## Inputs

- `.mawa-config.yaml`
- `specs/briefing/project-briefing.md`
- `workflow/setup-policy.md`
- selected UI adapter setup file
- selected design adapter setup file
- `resources/templates/nuxt.config.template.ts`
- `resources/templates/tsconfig.template.json`
- `resources/templates/vitest.config.template.ts`

## Required behavior

1. Read `.mawa-config.yaml`.
2. Read the selected UI adapter setup guide.
3. Read the selected design adapter setup guide, if design workflow is enabled.
4. Present required manual setup steps.
5. If `core.template_language` is `pug`, include `pnpm add -D pug` in the install
   commands (Vite/Nuxt compiles Pug SFC blocks once `pug` is present).
6. Present install commands and suggested configuration snippets.
7. Provide a root `tsconfig.json` from `resources/templates/tsconfig.template.json` (extends `./.nuxt/tsconfig.json`). Without it, `nuxi typecheck` fails with "Cannot find matching tsconfig.json".
8. If tests are planned, include the test toolchain: `pnpm add -D @nuxt/test-utils vitest@^3 happy-dom` and a `vitest.config.ts` from `resources/templates/vitest.config.template.ts` (Nuxt test environment). Note: Nuxt 4 requires Vitest 3+; plain Vitest fails on MAWA stores with `ReferenceError: ref is not defined`.
9. Remind the human that design MCP/tooling must already be configured externally. If the design MCP is unavailable, the human may set `design.enabled: false` (skip design globally) or skip per module at Stage 05a.
10. Verify that selected UI operational docs can be loaded from `ui.docs.source_url` when needed. If they are not available in the current session, load them from the URL or, in `web` mode when fetching is unavailable, ask the human to provide the current content. Do not commit a local copy by default.
11. Ask the human to confirm setup completion.
12. Update or instruct the human to update `.mawa-config.yaml` setup status.

## Strict setup policy

Do not install packages, save local docs copies, or modify `nuxt.config.ts` unless the human explicitly asks you to do so.

## Definition of done

Do not emit the completion message until all are true:

- [ ] Required dependencies, install commands, and config snippets were presented.
- [ ] `pnpm add -D pug` included when `template_language` is `pug`.
- [ ] Root `tsconfig.json` provided (from template) so `nuxi typecheck` can run.
- [ ] Test toolchain (`@nuxt/test-utils`, Vitest 3+, `vitest.config.ts`) provided when tests are planned.
- [ ] Selected UI operational docs loaded from `ui.docs.source_url` or requested from the human when required.
- [ ] Design MCP/tooling reminder given when design is enabled.
- [ ] `ui.setup_status` / `design.setup_status` recorded; human confirmed completion (interactive mode).

## Stage completion message

End with:

> Environment setup is confirmed. May I proceed to Stage 03 — Discovery?
