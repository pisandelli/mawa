# Context Loading Strategy

MAWA stages load only the context required for the current responsibility.

## 00 Project Init

Load:

- existing `.mawa-config.yaml`, if present
- `workflow/mawa-config.schema.md`
- `workflow/artifact-paths.md`
- `inputs/raw-briefing.md`, if present

Purpose:

- register the Raw Briefing seed;
- initialize workflow config;
- confirm defaults.

## 01 Project Briefing

Load:

- `inputs/raw-briefing.md`
- `.mawa-config.yaml`
- `workflow/artifact-paths.md`
- `resources/templates/project-briefing.template.md`

Output:

- `specs/briefing/project-briefing.md`

## 02 Environment Setup

Load:

- `.mawa-config.yaml`
- `specs/briefing/project-briefing.md`
- `workflow/setup-policy.md`
- selected UI adapter setup guide
- selected design adapter setup guide
- `resources/templates/nuxt.config.template.ts`
- `resources/templates/tsconfig.template.json`
- `resources/templates/vitest.config.template.ts`

## 03 Discovery

Load:

- `specs/briefing/project-briefing.md`
- `.mawa-config.yaml`
- `governance/core-rules.md`
- `governance/architecture-principles.md`
- selected UI adapter rules, if relevant

## 04 Domain Architecture

Load:

- `specs/discovery/discovery.spec.md`
- `.mawa-config.yaml`
- `governance/core-rules.md`
- `workflow/module-boundaries.md`

## 05 Module Spec

Load:

- `specs/domain/domain-map.md`
- selected module target
- `.mawa-config.yaml`
- `governance/core-rules.md`
- `governance/SKILL.md`
- selected UI adapter rules
- selected UI operational docs when required, loaded from `ui.docs.source_url`

## 05a Design Handoff (optional)

Load:

- `.mawa-config.yaml`
- `specs/modules/[module-name].spec.md`
- selected design adapter setup and handoff files
- selected UI adapter handoff rules, when relevant

Then enter standby until `specs/layouts/[module-name].approved-layout.md` exists.
Skip entirely when `design.enabled = false` or the human skips the layout for this module.

## 06 Implementation

Load:

- selected module spec
- `.mawa-config.yaml`
- `governance/core-rules.md`
- `governance/SKILL.md`
- relevant DNA files
- selected UI adapter rules and selected UI operational docs

## 06a Implementation From Approved Layout

Load everything from Stage 06 plus:

- `specs/layouts/[module-name].approved-layout.md`
- selected design adapter handoff rules
- selected UI adapter handoff rules

## 07 Review & Validation

Load:

- module spec
- implementation diff/code
- `.mawa-config.yaml`
- `governance/checklist.md`
- selected UI adapter checklist
- selected design adapter handoff, if applicable
- relevant DNA files


## Adapter operational docs rule

If a stage requires selected UI operational docs and they are not already available in the current session:

1. Load them from `ui.docs.source_url` in `.mawa-config.yaml`.
2. In `web` mode, if the agent cannot fetch the URL, ask the human to paste or upload the current docs.
3. Do not rely on a previous run's in-memory cache.
4. Do not require committing a local copy unless the project explicitly chooses that policy.
