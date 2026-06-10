# MAWA Quickstart

A condensed MAWA flow for **small projects**, where full domain decomposition would be
overkill. It collapses the eight-stage flow into a single guided pass while keeping the
same non-negotiable rules.

Use it for:

- MVPs and prototypes;
- small CRUD apps;
- experiments and spikes.

## When NOT to use

Use the full MAWA workflow (root [`AGENTS.md`](../AGENTS.md)) when the project has:

- multiple domains or bounded contexts;
- complex business rules;
- financial/accounting logic;
- multi-tenant concerns;
- advanced permissions;
- external integrations;
- long-term architecture requirements.

## Condensed flow

```text
Raw idea / quick briefing
  ↓  (interview — one question at a time)
Quick Spec        → specs/quickstart.spec.md
  ↓
Setup             → install deps + adapter (human-confirmed, never silent)
  ↓
Implementation    → API → Store → Component/Page
  ↓
Quick Review      → checklist pass (inline, or specs/reviews/quickstart.review.md)
```

## Files

- `briefing-template.md` — lightweight briefing input.
- `prompt.md` — the single condensed protocol (replaces stages 00–07).
- `spec-template.md` — the single Quick Spec template.

## What still applies (no exceptions)

Even in quickstart, the MAWA invariants from [`governance/core-rules.md`](../governance/core-rules.md) hold:

- **Stack:** Nuxt 4, pnpm, Pinia, TypeScript strict.
- **Architecture:** API → Store → Component/Page. Components never call the API directly.
- **Language:** chat in the human language; code, specs, and comments in English.
- **Setup safety:** never install dependencies or edit config files silently.
- **Adapter:** use the selected UI adapter and read its operational docs from the configured
  `source_url`. Never invent component APIs.

The UI adapter is **not hardcoded**. It comes from `.mawa-config.yaml` (default: DareDash).
If there is no config, confirm the adapter during the interview.
