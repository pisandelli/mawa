# MAWA Core Rules

These rules govern MAWA projects. MAWA is Nuxt 4-first and adapter-based for UI and design tooling.

## 0. Language & Communication

- Chat with the human in the configured human language.
- Generate code, filenames, comments, specs, and technical documentation in English unless the project explicitly says otherwise.
- Preserve the target locale for user-facing UI copy.

## 1. Fixed Core Stack

- Framework: Nuxt 4.
- Package manager: pnpm.
- TypeScript: strict.
- Default state layer: Pinia.
- Architecture: API → Store → Component/Page.
- SSR-first behavior is preferred for route-level data.

## 2. 3-Layer Architecture

1. API Layer
   - Raw network/server execution only.
   - Stateless.
   - No UI logic.

2. Store Layer
   - Owns business state and orchestration.
   - Prefer `{ data, loading, error }` state shape where applicable.
   - Owns SSR hydration actions.

3. Component/Page Layer
   - UI composition and user interaction only.
   - Never calls API modules directly.
   - Consumes stores and composables.

## 3. Blocking Anti-Patterns

- No code without a complete, approved spec unless the task is explicitly setup/bootstrap.
- No direct API calls from components or pages outside store orchestration.
- No hidden dependencies.
- No invented UI APIs. Use the selected UI adapter docs.
- No CSS-first implementation. Exhaust selected UI adapter components, attrs, tokens, and documented patterns first.
- No God Components. Split responsibilities.
- No tutorial-style comments. Use concise JSDoc for why/what when useful.
- No destructive setup actions without explicit human approval.

## 4. Security and Authorization

Authorization must be enforced at the lowest practical layer.

If the selected database supports Row Level Security, RLS must be considered and documented. If RLS is not used, the spec must explain the alternative enforcement layer.

## 5. UX States

Every data-driven experience must visibly handle:

- loading;
- error;
- empty;
- ideal;
- partial or stale data when relevant.

## 6. Setup Boundary

MAWA does not silently install dependencies or modify project configuration files during environment setup. Setup instructions may include commands and suggested snippets, but the human must confirm completion unless they explicitly ask MAWA to apply changes.

## 7. Verification

Before a task is complete:

- validate against `governance/checklist.md`;
- validate against selected adapter checklists;
- run or request typecheck/tests when available;
- document assumptions, blockers, and skipped checks;
- update governance if a recurring mistake is found.
