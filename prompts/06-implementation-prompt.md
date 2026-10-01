# 06 — Implementation Protocol

## Purpose

Implement one approved module spec without an approved visual layout handoff.

## Inputs

- `.mawa-config.yaml`
- `specs/modules/[module-name].spec.md`
- `governance/core-rules.md`
- `governance/SKILL.md`
- `workflow/context-loading-strategy.md`
- relevant DNA files
- selected UI adapter rules and docs

## Output

- code changes in the Nuxt 4 project (under `paths.app_root`)
- explicit TODOs for unresolved dependencies
- implementation summary

## Rules

- Re-read the module Implementation Readiness Checklist before code or dependency work. If
  any blocking item is unchecked, do not define it on demand: record the blocker and
  return to Stage 05. Only explicitly non-blocking deferrals may remain open.
- Write all application code inside `paths.app_root` from `.mawa-config.yaml`. Never
  create app files at the MAWA root.
- Do not redesign the module.
- Do not silently change setup/config files unless explicitly requested.
- Follow API → Store → Component/Page.
- Use Pinia as the default state layer.
- Follow the configured template language.
- Use selected UI adapter rules.
- If DareDash is selected, use the selected UI operational docs before generating UI; if they are not available in the current session, load them from `ui.docs.source_url` or ask the human to provide them.

## State update

When using this direct implementation path, record:

```yaml
state:
  active_module:
    implementation_path: "06"
    design_handoff: "skipped"
```

After this stage passes the Definition of Done, set `state.current_stage: "07-review-validation"`.

## Definition of done

Do not emit the completion message until all are true:

- [ ] Code follows API → Store → Component/Page; components/pages do not call the API directly.
- [ ] Stores use the `{ data, loading, error }` shape; SSR hydration documented where relevant.
- [ ] Required UX states handled (loading, error, empty, ideal, partial).
- [ ] Types are strict; only the selected adapter's public APIs were used.
- [ ] Only explicitly non-blocking deferrals remain; no unresolved architecture, security,
  persistence, authorization, migration, or dependency decision was implemented on demand.

## Stage completion message

End with:

> Implementation is complete. May I proceed to Stage 07 — Review & Validation?
