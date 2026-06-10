# 05 — Module Spec Protocol

## Purpose

Generate an implementation-ready specification for one module.

## Inputs

- `.mawa-config.yaml`
- `specs/domain/domain-map.md`
- selected module name
- selected UI adapter rules
- selected UI operational docs, when required, loaded from `ui.docs.source_url`
- `governance/core-rules.md`
- `governance/SKILL.md`

## Output

- `specs/modules/[module-name].spec.md`

## Required sections

Generate:

1. Module purpose
2. Scope and non-scope
3. Entities and relationships
4. Business rules
5. State transitions
6. Permissions
7. API requirements
8. Store/state strategy
9. UI requirements
10. UX states
11. Validation rules
12. Errors and edge cases
13. Audit and observability
14. Test plan
15. Implementation readiness checklist

## Definition of done

Do not emit the completion message until all are true:

- [ ] Sections 1–15 are present in `specs/modules/[module-name].spec.md`.
- [ ] Entities, business rules, APIs, state, UI, permissions, and tests are defined.
- [ ] The implementation readiness checklist (section 15) passes.
- [ ] `state.active_module.name` is set to this module.

## State update

When this stage passes the Definition of Done, set `state.active_module` to an object with at least:

```yaml
active_module:
  name: "[module-name]"
  implementation_path: null
  design_handoff: null
```

Then update `state.current_stage` to `05a-design-handoff` or `06-implementation` according to the selected path.

## Stage completion message

If `design.enabled = true` (the design phase is optional — offer both paths):

> Module Spec is ready. Do you want to run Stage 05a — Design Handoff (approve a layout in the design tool first), or skip design and go straight to Stage 06 — Implementation?

If `design.enabled = false`:

> Module Spec is ready. May I proceed to Stage 06 — Implementation?
