# MAWA
### AI-Native Operating Workflow for Nuxt 4 Applications

MAWA is an AI-native operating workflow for building Nuxt 4 applications through governed discovery, architecture, specification, implementation, and validation stages.

It is not framework-agnostic. Nuxt 4 is the core runtime assumption.

**Entry point:** any AI agent (Claude, Codex, Cursor, …) should read [`AGENTS.md`](AGENTS.md) first. It is the tool-neutral boot and orchestration guide. `CLAUDE.md` only points there.

MAWA remains adapter-based for:

- UI libraries;
- design tools;
- design-to-implementation handoff rules.

Default stack:

- Nuxt 4
- pnpm
- Pinia
- TypeScript strict
- DareDash UI adapter
- Pencil design adapter
- interactive mode

Pre-configured baseline modules (installed and wired into `nuxt.config.ts` in every project):

- `@nuxt/eslint` + `eslint` (flat config via `eslint.config.mjs`)
- `@vueuse/nuxt`
- `@pinia/nuxt`

---

## Status — Beta (`0.1.0-beta.1`)

MAWA is in **public beta**. The stage flow is validated end-to-end and the core is
internally consistent, but expect rough edges and breaking changes between betas.

Known limitations (read before adopting):

- **Adapters are not all real yet.** Only **DareDash** (UI) and **Pencil** (design) are
  implemented. Nuxt UI, Ant Design Vue, PrimeVue, Penpot, Figma, and Google Stitch are
  planned placeholders, not production-ready.
- **The default UI stack is itself pre-1.0.** `@pisandelli/daredash` ships as a beta
  package; its component API and `llms.txt` may change.
- **No runtime enforcement.** Stage chaining, the `state` machine, and the per-stage
  Definition-of-Done gates are followed by the agent reading `AGENTS.md` — they are not
  enforced by a runtime/hook. A weaker model may still drift.
- **The full design path is unproven.** The optional `05a` design handoff (with a live
  design-tool MCP such as Pencil) has not been exercised end-to-end; the skip path has.

What *is* validated: the boot → 00–07 flow, state resume, stage-ID resolution, the
DoD gates, the source-URL adapter docs, and a generated module that type-checks and
unit-tests clean against real Nuxt 4 + `@pisandelli/daredash`.

---

## Seed Artifact

MAWA starts from a **Raw Briefing**.

The Raw Briefing is the seed artifact that generates the rest of the project documentation.

```text
inputs/raw-briefing.md
```

The Raw Briefing may be incomplete, informal, subjective, or messy. MAWA turns it into a structured Project Briefing before Discovery begins.

---

## Core Workflow

```text
Raw Briefing
  ↓
Project Briefing
  ↓
Discovery Spec
  ↓
Domain Map
  ↓
Module Specs
  ↓
Design Handoff (optional)
  ↓
Implementation
  ↓
Review
```

Stage protocols:

```text
00-project-init.md
01-project-briefing-prompt.md
02-environment-setup-prompt.md
03-discovery-prompt.md
04-domain-architecture-prompt.md
05-module-spec-prompt.md
05a-design-handoff-prompt.md
06-implementation-prompt.md
06a-implementation-from-approved-layout-prompt.md
07-review-validation-prompt.md
```

These files are stage protocols, not manual copy/paste steps.

In normal use, MAWA may proceed from one stage to the next after human approval, depending on `interaction_mode`.

---

## Official Artifacts

```text
inputs/
  raw-briefing.md

specs/
  briefing/
    project-briefing.md
  discovery/
    discovery.spec.md
  domain/
    domain-map.md
  modules/
    [module-name].spec.md
  layouts/
    [module-name].approved-layout.md
  reviews/
    [module-name].review.md
```

---

## Repository Structure

```text
mawa/
├── README.md
├── AGENTS.md
├── CLAUDE.md
├── inputs/
├── prompts/
├── governance/
├── workflow/
├── adapters/
│   ├── ui/
│   └── design/
├── dna/
│   ├── nuxt4/
│   └── nuxt4-daredash/
├── resources/
├── quickstart/
└── specs/
```

---

## Application Location

The Nuxt application is kept separate from the workflow files. Its directory is set in
`.mawa-config.md` as `paths.app_root` (default `./web`, asked during Stage 00). All setup
and implementation happen inside it; MAWA's workflow files and `specs/` stay at the root.
Use `.` to build the app at the repo root. Avoid `./app` — it collides with Nuxt 4's
`app/` srcDir.

## Setup Policy

MAWA never installs or modifies setup silently or beyond the fixed baseline. Two tiers
(full detail in `workflow/setup-policy.md`):

- **Fixed baseline — auto-applied, always reported.** In `ide` mode MAWA installs and
  configures the baseline (Nuxt scaffold, `@pinia/nuxt`, `@nuxt/eslint` + `eslint`,
  `@vueuse/nuxt`, `pug` when configured, and their config files) without asking, then
  clearly reports the commands run, packages added, and files changed.
- **Everything else — confirm-first.** UI adapter packages, the optional test toolchain,
  design tooling, and any choice-bearing dependency: MAWA provides commands and snippets,
  the human confirms, and MAWA applies them automatically only on explicit request.

---

## UI Adapters

Default:

- DareDash

Planned placeholders (not production-ready):

- Nuxt UI
- Ant Vue
- PrimeVue

DareDash uses external operational docs loaded from the configured source URL when a stage requires UI-specific decisions. The docs are session-scoped; if they are not available in the current session, MAWA must load them again or ask the human to provide them in web mode. A committed local copy is not required.

Source URL:

```text
https://raw.githubusercontent.com/pisandelli/daredash/main/llms.txt
```

---

## Design Adapters

Default:

- Pencil

Planned placeholders (not production-ready):

- Penpot
- Figma
- Google Stitch

Design MCP/tooling is configured outside MAWA.

MAWA assumes the selected design tool is already available in the execution environment.

---

## Interaction Modes

Default:

```text
interactive
```

Interactive mode asks before advancing stages and before implementation.
It does not require the human to copy/paste the next prompt.

Continuous mode proceeds when safe assumptions exist and stops only for real blockers.

---

## Quickstart

`quickstart/` is secondary. Use it only for prototypes, small MVPs, or experiments where the full MAWA stage flow is unnecessary. The main workflow is the numbered protocol flow in `prompts/`.

---

## DNA

DNA files are canonical implementation references.

```text
dna/nuxt4/
  Base Nuxt 4 architecture examples.

dna/nuxt4-daredash/
  Nuxt 4 + DareDash UI examples.
```

---

## Philosophy

MAWA moves AI-assisted development from:

```text
Generate code from a prompt.
```

to:

```text
Execute a governed Nuxt 4 engineering workflow.
```
