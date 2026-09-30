# 04 — Domain Architecture Protocol

## Purpose

Transform the Discovery Spec into a domain architecture map.

## Inputs

- `specs/discovery/discovery.spec.md`
- `.mawa-config.yaml`
- `governance/core-rules.md`
- `workflow/module-boundaries.md`

## Output

- `specs/domain/domain-map.md`
- `specs/domain/module-plan.md` from `resources/templates/module-plan.template.md`

## Role

Act as a Principal Domain Architect.

## Required sections

Generate:

1. Domain overview
2. Core domains
3. Supporting domains
4. Generic domains
5. Bounded contexts
6. Entity ownership
7. Cross-domain workflows
8. Business events
9. Integration boundaries
10. Transaction boundaries
11. Forbidden couplings
12. Module specification candidates

## Definition of done

Do not emit the completion message until all are true:

- [ ] Sections 1–12 are present in `specs/domain/domain-map.md`.
- [ ] Bounded contexts, entity ownership, and forbidden couplings are defined.
- [ ] Module specification candidates are listed for Stage 05.
- [ ] The ordered module plan exists and declares the configured flow mode.

## Stage completion message

End with:

> Domain Map and delivery plan are ready. Which planned module should Stage 05 specify first?
