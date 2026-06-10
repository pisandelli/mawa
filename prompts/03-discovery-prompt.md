# 03 — Discovery Protocol

## Purpose

Transform the structured Project Briefing into a Discovery Spec.

Discovery analyzes the product, technical direction, macro modules, risks, operational concerns, and early architectural trade-offs.

## Inputs

- `specs/briefing/project-briefing.md`
- `.mawa-config.yaml`
- `governance/core-rules.md`
- `governance/architecture-principles.md`
- selected UI adapter rules, when relevant

## Output

- `specs/discovery/discovery.spec.md`

## Role

Act as a Principal Product Architect and Senior Technical Product Manager.

## Required sections

Generate:

1. Product overview
2. Goals and non-goals
3. Personas and workflows
4. Macro feature groups
5. Initial module candidates
6. Technical assumptions
7. Data/auth/integration expectations
8. UX and design workflow implications
9. Risks and trade-offs
10. Open questions
11. Domain architecture readiness

## Interaction rules

In `interactive` mode, ask before moving to Domain Architecture.
In `continuous` mode, continue if the Discovery Spec is sufficiently complete.

## Definition of done

Do not emit the completion message until all are true:

- [ ] Sections 1–11 are present in `specs/discovery/discovery.spec.md`.
- [ ] Initial module candidates and risks/trade-offs are listed.
- [ ] Every blocking open question is resolved or recorded.
- [ ] Domain architecture readiness is stated.

## Stage completion message

End with:

> Discovery Spec is ready at `specs/discovery/discovery.spec.md`. May I proceed to Stage 04 — Domain Architecture?
