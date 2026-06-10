# MAWA — Agent Operating Instructions

This file is the canonical entry point for **any** AI agent (Claude, Codex, Cursor, or
otherwise) operating in a MAWA project. It is intentionally tool-neutral. Read this
first, then follow the referenced files.

MAWA is an AI-native operating workflow for building Nuxt 4 applications through
governed discovery, architecture, specification, implementation, and validation stages.

---

## 1. Boot sequence

On any session in a MAWA project, before doing product work:

1. Load `.mawa-config.yaml` from the project root.
   - If it is missing, run `prompts/00-project-init.md` to create it, or ask the human
     for its path.
2. Read the `state` block in `.mawa-config.yaml` to determine the next pending
   stage (`current_stage`), completed stages (`completed_stages`), and module work
   in progress (`active_module`).
3. Read `workflow/orchestration.md` for stage order and branching.
4. Load only the context required for the current stage, per
   `workflow/context-loading-strategy.md`. Do not preload everything.
5. Execute the stage protocol in `prompts/` that matches `state.current_stage`.
   If the protocol file is not available in the current execution environment, ask
   the human to provide or upload it before proceeding.

If the human resumes mid-project ("continue"), trust `state.current_stage` first; only
fall back to inferring the stage from which artifacts exist in `specs/` if the state
block is absent or stale.

---

## 2. Stage flow

```text
00 Project Init
  → 01 Project Briefing
  → 02 Environment Setup
  → 03 Discovery
  → 04 Domain Architecture
  → 05 Module Spec
  → (optional) 05a Design Handoff   ← standby on the design tool until layout approved
  → 06 Implementation  OR  06a Implementation From Approved Layout
  → 07 Review & Validation
```

The design phase (`05a`) is **optional**. See `workflow/orchestration.md` for the
branching, the skip path, the review loop-back, and the multi-module loop.

---

## 3. Advancing between stages

- Stage protocols in `prompts/` are **protocols, not copy/paste steps**. During a
  continuous run, load the next protocol yourself. Never ask the human to paste the
  next prompt.
- **Definition of done gate.** Every stage protocol ends with a `## Definition of done`
  checklist. Do not emit the stage completion message, update `state`, or advance until
  every item is satisfied. If an item cannot be met, stop and report what is missing
  instead of advancing — this holds in both interaction modes and is what keeps a
  continuous run from drifting.
- Respect `mawa.interaction_mode`:
  - `interactive`: ask before crossing a stage boundary, before implementation, and
    before any setup/destructive action. Do not ask for non-blocking details — record a
    documented assumption and proceed.
  - `continuous`: proceed through non-destructive stages when assumptions are safe;
    stop only for real blockers (`workflow/interaction-modes.md`).
- Treat `state.current_stage` as the **next pending stage to run**. After a stage
  passes its Definition of Done:
  - append the completed stage id to `state.completed_stages` if not already present;
  - set `state.current_stage` to the next stage id according to `workflow/orchestration.md`;
  - set or clear `state.active_module` according to module-stage rules;
  - do not start the next stage in `interactive` mode until the human approves.
- Respect `mawa.execution_mode` for stage I/O (`workflow/execution-modes.md`):
  in `ide` mode read/write artifacts on disk and auto-load the next protocol; in `web`
  mode ask the human for required inputs before each stage and hand generated artifacts
  back in full to be saved. Stage order and rules are identical in both.

---

## 3.1 Stage IDs and protocol files

Use this table when resolving `state.current_stage` to a protocol file.

| Stage ID | Protocol file |
|---|---|
| `00-project-init` | `prompts/00-project-init.md` |
| `01-project-briefing` | `prompts/01-project-briefing-prompt.md` |
| `02-environment-setup` | `prompts/02-environment-setup-prompt.md` |
| `03-discovery` | `prompts/03-discovery-prompt.md` |
| `04-domain-architecture` | `prompts/04-domain-architecture-prompt.md` |
| `05-module-spec` | `prompts/05-module-spec-prompt.md` |
| `05a-design-handoff` | `prompts/05a-design-handoff-prompt.md` |
| `06-implementation` | `prompts/06-implementation-prompt.md` |
| `06a-implementation-from-approved-layout` | `prompts/06a-implementation-from-approved-layout-prompt.md` |
| `07-review-validation` | `prompts/07-review-validation-prompt.md` |

`state.current_stage` must always be one of these Stage IDs.

## 3.2 Adapter operational docs

When a stage requires selected UI operational docs:

- use `ui.docs.source_url` from `.mawa-config.yaml`;
- fetch/load the docs if they are not already available in the current session;
- in `web` mode, if the agent cannot fetch the URL, ask the human to paste or upload the current docs;
- do not rely on a previous run's in-memory cache.

---

## 4. Non-negotiable invariants

These hold in every stage, in every interaction mode (`governance/core-rules.md`):

- **Language:** chat with the human in `human_language`; write code, filenames,
  comments, specs, and technical docs in English; preserve target locale only for
  user-facing UI copy.
- **Setup safety:** never silently install dependencies or modify config files.
  Provide commands and snippets, ask the human to confirm, record status. Modify setup
  files only when explicitly asked.
- **Architecture:** `API → Store → Component/Page`. Components never call API modules
  directly. Stores own business state and `{ data, loading, error }`.
- **Specs before code:** no module code before its module spec is approved.
- **Adapters:** use the selected UI/design adapter docs as the source of truth. Never
  invent component APIs.

---

## 5. Canonical files

- `workflow/orchestration.md` — stage order, branching, loops.
- `workflow/mawa-config.schema.md` — config manifest schema, including `state`.
- `workflow/context-loading-strategy.md` — what to load per stage.
- `workflow/interaction-modes.md` — when to stop for the human.
- `workflow/execution-modes.md` — `ide` vs `web` stage I/O.
- `governance/core-rules.md` — the invariants above, in full.
- `governance/checklist.md` — run before marking any task complete.
- `prompts/*.md` — the stage protocols.
- `adapters/ui/<name>/`, `adapters/design/<name>/` — adapter-specific rules, setup,
  checklist, and handoff.
- `dna/` — canonical Nuxt 4 / Nuxt 4 + adapter implementation references.

This file is agent-agnostic on purpose. Tool-specific entry files (e.g. `CLAUDE.md`)
must only point here, not duplicate or override these instructions.
