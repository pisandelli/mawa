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
- A GitHub Issue and GitHub Project item only when the management adapter is enabled and
  the human explicitly approves the adapter dry-run

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

## Optional management sync

When `management.enabled = true`, load
`adapters/management/github-projects/rules.md` and
`specs/management/github-projects-sync.yaml` when it exists.

After the module spec itself passes the Definition of Done:

1. Generate a dry-run preview for the proposed Issue, labels, milestone reference (if any),
   and Project item. Include the target repository and Project explicitly.
2. Ask for explicit human approval to publish that preview. A spec approval alone is not
   authorization for an external write.
3. On approval, synchronize exactly one MAWA-owned Issue and Project item according to the
   adapter rules, then update the local sync map.
4. On rejection or deferral, retain the approved spec and continue the MAWA stage flow;
   report that publication remains pending.

## Stage completion message

If `design.enabled = true` (the design phase is optional — offer both paths):

> Module Spec is ready. Do you want to run Stage 05a — Design Handoff (approve a layout in the design tool first), or skip design and go straight to Stage 06 — Implementation?

If `design.enabled = false`:

> Module Spec is ready. May I proceed to Stage 06 — Implementation?
