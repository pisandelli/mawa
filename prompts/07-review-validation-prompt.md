# 07 — Review & Validation Protocol

## Purpose

Audit the implementation against the module spec, MAWA governance, Nuxt 4 architecture, selected adapters, and checklist requirements.

## Inputs

- `.mawa-config.yaml`
- `specs/modules/[module-name].spec.md`
- implementation diff or codebase
- `governance/core-rules.md`
- `governance/checklist.md`
- selected UI adapter checklist
- selected design adapter handoff, if applicable
- relevant DNA files

## Output

- `specs/reviews/[module-name].review.md`

## Required sections

Generate:

1. Approval status
2. Critical issues
3. Major issues
4. Minor issues
5. Architecture review
6. Domain correctness review
7. UI adapter compliance
8. Nuxt 4 compliance
9. SSR/data-flow review
10. Testing gaps
11. Required fixes
12. Optional improvements
13. Implementation path used (`06` or `06a`)
14. Design handoff status (`used` or `skipped`)

## Approval statuses

- Approved
- Approved with concerns
- Rejected

## Definition of done

Do not consider the review complete until all are true:

- [ ] All 14 review sections are present in `specs/reviews/[module-name].review.md`.
- [ ] An approval status is set (Approved / Approved with concerns / Rejected).
- [ ] Required fixes are listed and actionable.
- [ ] If Rejected — or Approved with concerns that require changes — the loop-back stage is named (06/06a, or 05 if the spec is wrong) per `workflow/orchestration.md`.

## State update

If the module is `Approved`, clear `state.active_module` before moving to the next module or set it to the next selected module at Stage 05.

If the module is `Rejected` — or `Approved with concerns` requiring changes — keep `state.active_module` and set `state.current_stage` to the required loop-back stage:

- code defect → `06-implementation` or `06a-implementation-from-approved-layout`;
- wrong spec → `05-module-spec`;
- setup/config/tooling defect (e.g. missing dependency, missing `tsconfig.json`, test toolchain) → `02-environment-setup`.

List each required fix with its loop-back target so the next iteration is unambiguous.

## Final rule

Do not be lenient. Prefer long-term maintainability and domain correctness over superficial completion.
