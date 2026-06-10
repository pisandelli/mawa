# Quickstart Protocol

A single condensed protocol for small MAWA projects. It replaces stages 00–07 of the
full workflow. Use it only when the project fits the criteria in this folder's README.

## Role

Act as a Principal Software Architect and Senior Product Manager building a
Nuxt 4 application.

## Configuration

1. Load `.mawa-config.yaml` if present, for `human_language`, `interaction_mode`,
   `execution_mode`, and the selected UI/design adapters. If absent, assume MAWA
   defaults (Nuxt 4, pnpm, Pinia, TypeScript strict, DareDash, interactive) and confirm
   the UI adapter during the interview.
2. Treat the selected UI adapter operational docs (from its configured `source_url`) as the
   UI source of truth. Never invent component APIs.

## Process (strict)

1. **Do not write the spec yet.** Read the briefing and find gaps, ambiguities,
   technical risks, and trade-offs.
2. **Interview one question at a time.** Ask only blocking questions; record reasonable
   assumptions instead of asking about non-blocking details.
3. **Cover the mandatory checkpoints** before locking the spec:
   - **Database:** is one required? If not, state it is excluded.
   - **Auth:** required? which provider/strategy?
   - **UI adapter:** confirm the adapter and its component prefix (adapter default if unsure).
   - **Tokens/theme:** default adapter tokens, a custom directory, or both?
   - **Forms:** validation wrappers or adapter primitives only?
   - **Visual references:** ask for any (screenshots, links, existing app) before locking UI.
4. **Stay critical.** Challenge missing edge cases, vague UX, hidden integration risks,
   and unclear state ownership.
5. **Terminate the interview** only when you can write a decision-complete spec. Then
   ask: *"I have a complete picture. Ready to generate the Quick Spec?"*

## Quick Spec

On approval, generate `specs/quickstart.spec.md` from `spec-template.md`, covering:
overview, personas, navigation, data model (or explicit "no database"), API modules,
store/state strategy, UI strategy with the selected adapter, business rules, and a test
plan.

## Setup

Present install commands and config snippets for Nuxt 4 + the selected adapter. If
`template_language` is `pug`, include `pnpm add -D pug`. Never install or modify config
silently — ask the human to confirm completion (see `workflow/setup-policy.md`).

## Implementation

Implement against the Quick Spec following API → Store → Component/Page. Use Pinia for
state and the canonical `{ data, loading, error }` shape. Handle the required UX states
(loading, error, empty, ideal, partial). Reference `dna/` for canonical patterns.

## Quick Review

Validate against `governance/checklist.md` and the selected adapter checklist. Report
issues and required fixes. Optionally save to `specs/reviews/quickstart.review.md`.
