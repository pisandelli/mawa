# 05a — Design Handoff Protocol (Optional)

## Purpose

Coordinate the optional design phase for one module. The actual design work happens
**inside an external design tool** (Pencil, Penpot, Figma, Google Stitch). MAWA does not
draw the layout — it sets up the handoff, hands control to the human, and waits.

This stage is **optional**. Skip it when `design.enabled = false`, or when the human
chooses to let the agent structure the UI directly. In that case go to Stage 06.

## When to use

- `design.enabled = true` in `.mawa-config.yaml`, AND
- the human wants an approved visual layout before implementation.

## Inputs

- `.mawa-config.yaml`
- `specs/modules/[module-name].spec.md`
- selected design adapter setup and handoff files (`adapters/design/[adapter]/`)
- selected UI adapter handoff rules, when relevant

## Required behavior

1. Confirm the selected design adapter and that its tooling/MCP is available
   (MAWA does not configure design tooling — see the adapter setup file).
2. Define the target output location and name explicitly:
   ```text
   specs/layouts/[module-name].approved-layout.md
   ```
3. Instruct the design tool to save the approved output to that exact path and name so
   the workflow can consume it later. If the adapter exposes an MCP/automation that can
   write files (e.g. Pencil), instruct it directly; otherwise instruct the human to
   export/save the approved layout to that path.
4. Communicate the required contents of the approved layout (see the adapter `handoff.md`):
   region hierarchy, layout invariants, component intent, interactive states, copy to
   preserve, known constraints, adapter-specific notes.
5. **Enter standby.** Hand control to the human. Do not generate implementation code.
   The human iterates inside the design tool until the layout is approved.
6. **Resume** when `specs/layouts/[module-name].approved-layout.md` exists and the human
   confirms approval. Then proceed to Stage 06a.

## Standby rule

This stage always waits for the human regardless of `interaction_mode`, because design
is an external, human-driven activity. In `continuous` mode, resume automatically once
the approved-layout artifact is present.

## Output

- `specs/layouts/[module-name].approved-layout.md` (produced by the design tool/human)
- updated `state` in `.mawa-config.yaml`

## State update

When the approved layout is available, preserve `state.active_module.name` and set:

```yaml
state:
  active_module:
    name: "[module-name]"
    design_handoff: "used"
    implementation_path: "06a"
  current_stage: "06a-implementation-from-approved-layout"
```

If the human skips design for this module, preserve `state.active_module.name` and set `design_handoff: "skipped"`, `implementation_path: "06"`, and `current_stage: "06-implementation"`.

## Definition of done

Do not emit the completion message until one of these holds:

- [ ] `specs/layouts/[module-name].approved-layout.md` exists with all required sections and the human confirmed approval; OR
- [ ] the design phase was explicitly skipped for this module (proceed to Stage 06 instead).

## Stage completion message

If the approved layout exists, end with:

> Approved layout is registered at `specs/layouts/[module-name].approved-layout.md`. May I proceed to Stage 06a — Implementation From Approved Layout?

If design was skipped, end with:

> Design handoff was skipped for this module. May I proceed to Stage 06 — Implementation?
