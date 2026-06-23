# Artifact Paths

MAWA uses fixed artifact paths to avoid ambiguity.

## Two roots

- **MAWA root** — workflow files (`prompts/`, `governance/`, `adapters/`, `dna/`,
  `workflow/`, `resources/`) and the generated artifacts below (`inputs/`, `specs/`).
- **Application root** — `paths.app_root` from `.mawa-config.yaml`. The Nuxt application
  (code, `nuxt.config.ts`, `tsconfig.json`, `package.json`) lives here, separate from the
  workflow. Setup (02) and implementation (06/06a) operate strictly inside it.

The paths below are relative to the MAWA root.

## Input seed

```text
inputs/raw-briefing.md
```

The Raw Briefing is the seed artifact. It is not a spec.

## Generated artifacts

```text
specs/briefing/project-briefing.md
specs/discovery/discovery.spec.md
specs/domain/domain-map.md
specs/modules/[module-name].spec.md
specs/layouts/[module-name].approved-layout.md
specs/reviews/[module-name].review.md
```

## Rules

- Do not create parallel `docs/specs` paths.
- Do not store the Raw Briefing inside `specs/` unless explicitly requested.
- Do not rename `project-briefing.md` to `briefing.md`; keep the distinction explicit.
