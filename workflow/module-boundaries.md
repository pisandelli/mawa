# Module Boundaries

Module boundaries are defined after Discovery, during Stage 04 — Domain Architecture.

Modules must be specified from `specs/domain/domain-map.md`, not directly from the Raw Briefing.

## Required order

```text
Raw Briefing
  ↓
Project Briefing
  ↓
Discovery Spec
  ↓
Domain Map
  ↓
Module Spec
```

A Module Spec must define:

- ownership;
- entities;
- rules;
- APIs;
- state;
- UI expectations;
- permissions;
- tests.
