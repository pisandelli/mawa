# MAWA

**MAWA Advances Work Accountably.**

MAWA is an auditable CLI for guiding AI-assisted software delivery through explicit
human gates. It keeps human-readable project documentation in `docs/mawa/` and
operational state, evidence, decisions, and snapshots in `.mawa/`.

This repository contains the v2 engine. It is deliberately independent of earlier
MAWA implementations.

## Current scope

The current beta supports:

- guided project initialization and Raw Briefing capture;
- Raw Briefing validation and approval;
- a critical-interview ledger and Project Brief templates;
- auditable Git decisions and evidence hashes;
- agent handoffs with an optional local Codex CLI launch;
- certified-stack inspection and setup planning for Nuxt + DareDash;
- a recoverable abort before the first workflow approval.

The CLI blocks transitions for stages that are not implemented yet. It does not claim
to execute setup recipes, generate layouts, or implement application modules.

## Use it locally

```bash
pnpm install
pnpm run mawa -- init .
```

Run the command from the target project's Git repository. The interactive flow asks
how to provide the Raw Briefing, validates it before approval, and records each
approved decision in Git.

Useful commands:

```bash
mawa status
mawa next
mawa handoff
mawa approve
mawa doctor
mawa setup
mawa audit
```

## Repository layout

```text
bin/                CLI entry point
lib/                state machine, audit, stack inspection
schemas/            validated data contracts
templates/core/     generated project documentation contracts
templates/stacks/   certified, versioned stack contracts
profiles/           corporate command and runtime policies
test/               executable behavior specification
```

## Development

```bash
npm test
```

The test suite creates temporary Git repositories to verify approvals, evidence,
rollback behavior, and stack planning.

## Distribution status

MAWA is not published yet. The package remains private while the CLI contract and
the remaining workflow stages are built and tested.
