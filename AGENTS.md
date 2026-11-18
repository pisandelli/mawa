# MAWA v2 — Engine Repository Instructions

This repository builds the MAWA CLI engine. It is not a MAWA-managed application.

## Boundaries

- The engine lives in this repository.
- `mawa init` creates a separate managed project. Its human documentation belongs in
  `docs/mawa/`; its operational state belongs in `.mawa/`.
- The generated project's `AGENTS.md` is created from the v2 core contract. Do not
  treat this repository's instructions as that project's workflow contract.

## Source of truth

- `bin/mawa.mjs` is the CLI entry point.
- `lib/project-core.mjs` owns the workflow state, gates, evidence, decisions, and
  audit behavior.
- `lib/stack-core.mjs` owns certified stack inspection and setup planning.
- `schemas/`, `templates/core/`, `templates/stacks/`, and `profiles/` contain the
  versioned contracts consumed by the engine.
- `test/` is the executable behavior specification.

## Engineering rules

- Keep the core framework-agnostic. Stack behavior belongs in versioned templates.
- Never add implicit paths, free-form shell execution, or a state transition that
  bypasses artifact validation and explicit human approval.
- Preserve the distinction between human-readable documents and operational state.
- Load only the files needed for the current change. Do not introduce historical or
  unused material as active agent context.
- Update tests whenever a CLI command, template contract, workflow transition, or
  audit guarantee changes.

## Verification

Run `npm test`. Exercise the relevant CLI flow in a temporary Git repository when
changing an interactive or audit-sensitive path.
