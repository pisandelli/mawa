# MAWA Core Validation Checklist

Run this checklist before marking any MAWA task complete.

## Configuration

- [ ] `.mawa-config.yaml` was loaded or explicitly created.
- [ ] The selected UI adapter was identified.
- [ ] The selected design adapter was identified when design is enabled.
- [ ] Artifact paths match `workflow/artifact-paths.md` or explicit project overrides.

## Architecture

- [ ] Data flow follows API → Store → Component/Page.
- [ ] Components/pages do not call API modules directly.
- [ ] Stores own business state and loading/error states.
- [ ] SSR hydration points are documented where relevant.

## Setup Safety

- [ ] No dependencies were installed silently.
- [ ] No config files were modified silently.
- [ ] Any destructive action was explicitly approved.
- [ ] Manual setup status was recorded or requested.

## UI and UX

- [ ] Selected UI adapter rules were loaded.
- [ ] Adapter-specific docs were loaded when required.
- [ ] Loading, error, empty, ideal, and partial states were considered.
- [ ] Custom CSS was not used before adapter-native options were considered.

## Quality

- [ ] TypeScript types are strict and intentional.
- [ ] Tests are present or missing tests are documented.
- [ ] Assumptions and blockers are documented.
- [ ] Review output is saved to the configured review path when applicable.
