# 08 — Project Delivery Protocol

## Purpose

Decide whether the integrated application is ready for release after every planned module
has passed Stage 07. This does not replace module review.

## Inputs

- `.mawa-config.yaml`
- `specs/domain/module-plan.md`
- all module reviews
- `resources/templates/project-delivery-checklist.template.md`

## Required behavior

Create `specs/validation/project-delivery-checklist.md` from the template. Record evidence
for integration, regression, authorization/security, accessibility, SSR/performance,
migrations/rollback, deployment configuration, observability, accepted risks, owner and
explicit release decision. Exceptions require justification, owner, expiry and approval.

## Definition of done

- [ ] Every planned module has an Approved review.
- [ ] The checklist has all template sections and evidence links.
- [ ] Risks and exceptions have an explicit owner and approval.
- [ ] A human release decision is recorded.
