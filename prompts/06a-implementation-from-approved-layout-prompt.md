# 06a — Implementation From Approved Layout Protocol

## Purpose

Implement one approved module spec using an approved design/layout handoff.

Use this stage when `design.enabled = true` and an approved layout exists.

## Inputs

- `.mawa-config.yaml`
- `specs/modules/[module-name].spec.md`
- `specs/layouts/[module-name].approved-layout.md`
- selected design adapter handoff rules
- selected UI adapter handoff rules
- relevant DNA files
- selected UI operational docs loaded from `ui.docs.source_url`

## Output

- code changes in the Nuxt 4 project (under `paths.app_root`)
- implementation summary
- explicit TODOs for unresolved layout/spec conflicts

## Rules

- Write all application code inside `paths.app_root` from `.mawa-config.yaml`. Never
  create app files at the MAWA root.
- Preserve business rules from the module spec.
- Preserve approved layout intent.
- Prefer UI adapter components over custom CSS.
- If the layout conflicts with the spec, stop and explain the conflict.
- Do not invent component APIs.

## State update

When using an approved-layout implementation path, record:

```yaml
state:
  active_module:
    implementation_path: "06a"
    design_handoff: "used"
```

After this stage passes the Definition of Done, set `state.current_stage: "07-review-validation"`.

## Definition of done

Do not emit the completion message until all are true:

- [ ] Everything in Stage 06's definition of done.
- [ ] Approved layout intent (region order, hierarchy, copy, interaction) is preserved.
- [ ] Any layout/spec conflict was stopped on and explained, not silently resolved.

## Stage completion message

End with:

> Layout-based implementation is complete. May I proceed to Stage 07 — Review & Validation?
