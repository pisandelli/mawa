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

## Stage completion message

End with:

> Domain Map is ready at `specs/domain/domain-map.md`. Which module should Stage 05 specify first?
