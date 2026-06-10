# 00 — Project Init Protocol

## Purpose

Initialize MAWA for a Nuxt 4 project and make the Raw Briefing visible as the official seed artifact.

This stage creates or updates `.mawa-config.yaml` and confirms the workflow defaults.
It does not generate product specs yet.

## Role

Act as the MAWA workflow coordinator.

## Inputs

- Human initial request, if provided in chat.
- Optional existing `inputs/raw-briefing.md`.
- Existing `.mawa-config.yaml`, if present.

## Required behavior

1. Check whether `inputs/raw-briefing.md` exists.
2. If the human provided the raw idea in chat and the file does not exist: in `ide` execution mode, offer to write it to `inputs/raw-briefing.md` yourself (writing a seed file is not a destructive setup action); in `web` mode, instruct the human to save it there.
3. Create or update `.mawa-config.yaml` according to `workflow/mawa-config.schema.md`, including the `state` block (`current_stage`, `completed_stages`, `active_module`). Use `resources/templates/mawa-config.example.yaml` as the starting point.
4. Confirm the MAWA defaults unless already configured:
   - Nuxt 4
   - pnpm
   - Pinia
   - interactive mode
   - DareDash UI adapter by default
   - Pencil design adapter by default
5. Initialize the `state` block in `.mawa-config.yaml`. While Stage 00 is running, `current_stage` may be `00-project-init`; once Stage 00 passes its Definition of Done, update `completed_stages` with `00-project-init` and set `current_stage: "01-project-briefing"`. Keep `active_module: null`.
6. Do not perform environment setup yet.
7. Do not generate the Project Briefing yet unless explicitly continuing to stage 01.

## Human interaction

In `interactive` mode, ask before advancing to Stage 01.
In `continuous` mode, continue when `inputs/raw-briefing.md` exists or the raw briefing is available in the current context.

## Output

- `.mawa-config.yaml`
- confirmation of raw briefing location
- next suggested stage: `01-project-briefing-prompt.md`

## Definition of done

Do not emit the completion message until all are true:

- [ ] `.mawa-config.yaml` exists with all required keys from the schema.
- [ ] `state` block is valid, with `active_module: null`.
- [ ] Raw Briefing location confirmed (`inputs/raw-briefing.md`).
- [ ] MAWA defaults confirmed or explicitly overridden.
- [ ] Stage completion state update is ready: `completed_stages` includes `00-project-init` and `current_stage` points to `01-project-briefing`.

## Stage completion message

End with:

> Project init is ready. The Raw Briefing seed is registered. May I proceed to Stage 01 — Project Briefing?
