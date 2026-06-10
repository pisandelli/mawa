# Artifact Paths

MAWA uses fixed artifact paths to avoid ambiguity.

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
