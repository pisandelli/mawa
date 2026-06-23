---
name: mawa-nuxt4-architect
description: Operational playbook for MAWA Nuxt 4 workflows.
---

# MAWA Operational Playbook

MAWA is an AI-native operating workflow for Nuxt 4 applications.

Use this file to understand how to operate the workflow. Use selected adapters for UI and design-specific behavior.

## 1. Read Configuration First

Before any stage after initialization, load `.mawa-config.yaml` from the target project.

It defines:

- human language;
- interaction mode;
- execution mode;
- selected UI adapter;
- selected design adapter;
- project paths;
- setup status;
- adapter docs source URL (e.g. the DareDash operational docs).

If `.mawa-config.yaml` is missing, run `00-project-init.md` or ask for the config path.

## 2. Stage Protocols

Prompt files are stage protocols. They can be loaded automatically by the agent during a continuous run, or manually by the human when resuming at a specific stage.

Do not ask the human to copy/paste the next prompt during a continuous run.

## 3. Interaction Modes

Default mode is `interactive`.

- Ask before advancing stages.
- Ask before implementation.
- Ask before destructive or Tier 2 setup actions; the fixed baseline is auto-applied in `ide` mode and reported (`workflow/setup-policy.md`).
- Do not ask for non-blocking details; proceed with documented assumptions when safe.

`continuous` mode may proceed through non-destructive stages when assumptions are safe, but still must not install or modify setup silently or beyond the fixed baseline.

## 4. Nuxt 4 Architecture

Use:

```text
API → Store → Component/Page
```

- API modules execute raw calls.
- Stores own state and business orchestration.
- Components/pages orchestrate UI and consume stores.
- Route-level SSR data should hydrate through store actions.

## 5. UI Adapters

The selected UI adapter provides:

- component rules;
- setup instructions;
- checklist;
- operational docs source URL.

For DareDash, the UI source of truth is the operational docs loaded from the configured `ui.docs.source_url`. If the docs are not available in the current session, load them again. If the environment cannot fetch them (for example in `web` execution mode), ask the human to provide the current content. A local committed copy is not required by default.

## 6. Design Adapters

Design adapters assume external tooling/MCPs are already configured.

MAWA must not install or configure MCP servers. It may remind the human that the selected design tool must be available before the design stage.

## 7. Reporting

Every stage output should include:

- generated/changed artifacts;
- assumptions;
- blockers;
- next recommended stage;
- whether human confirmation is required.
