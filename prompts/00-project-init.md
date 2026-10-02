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
   - local-only product management by default (`management.enabled: false`)
5. Offer the optional GitHub Projects management adapter without making it part of the
   baseline. If the human enables it, ask first whether the repository and GitHub Project
   already exist. Collect the owner and repository name, Project owner, and chosen
   transport (`github-api` by default; `gh` only on request). Do not ask for or write a
   token.

   For each missing resource, offer an explicit bootstrap option. Record the choice in
   `management.bootstrap`:

   - `connect-existing` — record the existing repository or Project number;
   - `create` — propose creating the missing resource, but do not write yet.

   When a repository is to be created, ask for its visibility and suggest `private`. When
   a Project is to be created, use the configured Project owner and project name. Show a
   bootstrap dry-run that names every resource to be created, its owner, visibility, and
   expected Kanban and Roadmap configuration. Ask for a second, explicit approval before
   creating anything. On confirmed success, persist the returned repository identifier and
   Project number in the manifest. Preflight must verify that the selected transport can
   create the required Project fields and views. If a remote call still fails after a
   resource was created, report the exact partial state for reconciliation; never hide it
   or retry blindly.

   Refer to `adapters/management/github-projects/setup.md` for the preflight and bootstrap
   contract.
6. Confirm the application directory and record it as `paths.app_root`. Ask the human:
   > In which directory should the Nuxt application be created? (default `./web`; use `.` to build at the repo root)

   This keeps the application separate from the MAWA workflow files. Do not use `./app`
   (it collides with Nuxt's `app/` srcDir). All later setup and implementation happen
   inside `paths.app_root`.
7. Initialize the `state` block in `.mawa-config.yaml`. While Stage 00 is running, `current_stage` may be `00-project-init`; once Stage 00 passes its Definition of Done, update `completed_stages` with `00-project-init` and set `current_stage: "01-project-briefing"`. Keep `active_module: null`.
8. Do not perform environment setup yet.
9. Do not generate the Project Briefing yet unless explicitly continuing to stage 01.

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
- [ ] `paths.app_root` is set (application directory confirmed with the human).
- [ ] Raw Briefing location confirmed (`inputs/raw-briefing.md`).
- [ ] MAWA defaults confirmed or explicitly overridden.
- [ ] Optional management integration is disabled or its repository, Project, and
  transport configuration are explicit; existing resources were verified or missing
  resources have an explicit bootstrap choice; no credential was recorded in the manifest.
- [ ] Stage completion state update is ready: `completed_stages` includes `00-project-init` and `current_stage` points to `01-project-briefing`.

## Stage completion message

End with:

> Project init is ready. The Raw Briefing seed is registered. May I proceed to Stage 01 — Project Briefing?
