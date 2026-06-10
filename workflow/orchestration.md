# Workflow Orchestration

MAWA stage order:

```text
00 Project Init
  ↓
01 Project Briefing
  ↓
02 Environment Setup
  ↓
03 Discovery
  ↓
04 Domain Architecture
  ↓
05 Module Spec
  ↓
05a Design Handoff   (optional — only if design.enabled = true and a layout is wanted)
  ↓
06 or 06a Implementation
  ↓
07 Review & Validation
```

`state.current_stage` means the **next pending stage to run**.

After every completed stage, update `state` in `.mawa-config.yaml` so the run can be resumed:

- append the completed Stage ID to `state.completed_stages` if missing;
- set `state.current_stage` to the next Stage ID;
- set `state.active_module` during module-specific stages and clear it after the module review is approved.


## Stage IDs and protocol files

| Stage ID | Protocol file | Primary output |
|---|---|---|
| `00-project-init` | `prompts/00-project-init.md` | `.mawa-config.yaml` |
| `01-project-briefing` | `prompts/01-project-briefing-prompt.md` | `specs/briefing/project-briefing.md` |
| `02-environment-setup` | `prompts/02-environment-setup-prompt.md` | setup confirmation in `.mawa-config.yaml` |
| `03-discovery` | `prompts/03-discovery-prompt.md` | `specs/discovery/discovery.spec.md` |
| `04-domain-architecture` | `prompts/04-domain-architecture-prompt.md` | `specs/domain/domain-map.md` |
| `05-module-spec` | `prompts/05-module-spec-prompt.md` | `specs/modules/[module-name].spec.md` |
| `05a-design-handoff` | `prompts/05a-design-handoff-prompt.md` | `specs/layouts/[module-name].approved-layout.md` |
| `06-implementation` | `prompts/06-implementation-prompt.md` | code implementation |
| `06a-implementation-from-approved-layout` | `prompts/06a-implementation-from-approved-layout-prompt.md` | code implementation from approved layout |
| `07-review-validation` | `prompts/07-review-validation-prompt.md` | `specs/reviews/[module-name].review.md` |

## Seed flow

```text
inputs/raw-briefing.md
  ↓
specs/briefing/project-briefing.md
  ↓
specs/discovery/discovery.spec.md
```

The Raw Briefing is always the seed. Discovery must not run directly from an unstructured Raw Briefing unless the human explicitly bypasses Project Briefing.

## Design phase (optional)

The design phase is **not mandatory**. Two paths exist after Stage 05 — Module Spec:

**Path A — with approved layout** (`design.enabled = true` and the human wants a layout):

```text
05 Module Spec
  ↓
05a Design Handoff
    · the agent instructs the selected design tool to save the approved output to
      specs/layouts/[module-name].approved-layout.md
    · the workflow enters STANDBY: the human works inside the design tool
      (Pencil, Penpot, Figma, etc.) until the layout is approved
    · the workflow resumes when the approved-layout file exists / the human confirms
  ↓
06a Implementation From Approved Layout
```

**Path B — skip design** (`design.enabled = false`, or the human chooses to skip):

```text
05 Module Spec
  ↓
06 Implementation
    · the agent structures the UI directly from the module spec and the selected
      UI operational docs and DNA references
```

Even when `design.enabled = true`, the human may skip Stage 05a for a given module and
go straight to Stage 06. Record the choice in `state.active_module` handling and the review (`implementation_path: 06` or `implementation_path: 06a`).

## Loops

MAWA is not strictly single-pass:

- **Multi-module loop.** After Stage 07 for a module, if more modules remain in
  `specs/domain/domain-map.md`, clear or replace `state.active_module` and return to Stage 05 for the next module. Repeat
  05 → (05a) → 06/06a → 07 per module until the domain map is covered.
- **Review rejection loop.** If Stage 07 returns `Rejected` or `Approved with concerns`
  requiring changes, return to the stage that owns the fix: the implementation stage
  (06 or 06a) for a code defect, Stage 05 if the spec itself is wrong, or Stage 02 if it
  is a setup/config/tooling defect (e.g. missing dependency, `tsconfig.json`, or test
  toolchain). Then re-run Stage 07. Do not advance to the next module while the current
  one is `Rejected`.

## Interaction mode

Interactive mode asks before advancing stage boundaries.
Continuous mode advances when safe assumptions exist and stops only for blockers.

The design phase (05a) always stops for the human regardless of interaction mode: it is
an external, human-driven activity. Continuous mode still resumes automatically once the
approved-layout artifact is present.

Neither mode silently installs dependencies or modifies setup files unless explicitly allowed by the human.
