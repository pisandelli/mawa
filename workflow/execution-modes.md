# Execution Modes

`execution_mode` (in `.mawa-config.yaml`) changes **only how the flow moves between
stages — its input/output (I/O)**. The stage order, governance, invariants, and
artifacts are identical in both modes. It is independent from `interaction_mode`
(which decides *when* to stop for the human).

## ide

The agent runs inside an editor/CLI with filesystem access.

- Reads the input artifacts for the current stage directly from disk
  (see `workflow/context-loading-strategy.md`).
- Writes generated artifacts directly to their configured paths.
- Loads the next stage protocol from `prompts/` itself and continues, per
  `interaction_mode`.
- Loads adapter operational docs from `ui.docs.source_url` when a stage requires them, and reuses them only while they remain available in the current session.

## web

The agent runs as a web/chat agent with **no assumed persistent filesystem** and
possibly no autonomous file or URL access.

Because of that, between stages the agent must:

1. **Ask for inputs before continuing.** Before a stage, list the input artifacts that
   stage requires (per `context-loading-strategy.md`). If they are not already in the
   conversation, ask the human to paste or upload them. Do not assume they are on disk.
2. **Hand back outputs explicitly.** Output each generated artifact in full, labeled
   with its configured path (e.g. `specs/discovery/discovery.spec.md`), so the human can
   save it. Do not assume the write happened.
3. **Request adapter operational docs when it cannot fetch them.** If the agent cannot retrieve
   `ui.docs.source_url`, ask the human to paste or upload the current adapter docs content.
4. **Require the stage protocol before running a stage.** If the next protocol file is not
   already present in the conversation or uploaded context, ask the human to provide or
   upload it. Do not reconstruct stage protocols from memory.

The `state` block still tracks `current_stage` / `completed_stages` / `active_module`.
In `web` mode the human keeps that block in sync when saving artifacts back.

## Summary

| Concern                | ide                          | web                                   |
| ---------------------- | ---------------------------- | ------------------------------------- |
| Read stage inputs      | from disk                    | ask human if not in conversation      |
| Write stage outputs    | to disk at configured path   | output in full, human saves           |
| Next stage protocol    | auto-loaded from `prompts/`  | ask human to provide/upload if absent |
| Adapter operational docs | loaded from `source_url` when required | fetched or requested from the human |
| Stage order / rules    | identical                    | identical                             |
