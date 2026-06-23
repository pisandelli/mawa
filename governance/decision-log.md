# Decision Log

Record important architectural and workflow decisions here.

## Accepted Defaults

- MAWA is Nuxt 4-first.
- Pinia is the default state layer.
- pnpm is the package manager.
- DareDash is the default UI adapter.
- Pencil is the default design adapter.
- Interaction mode defaults to `interactive`.
- Setup is two-tier: the fixed baseline is auto-applied and reported (`ide` mode); everything else is confirm-first. Never silent, never beyond the baseline without confirmation.
- Adapter operational docs are read from the adapter's canonical `source_url`, not stored locally, and loaded again when unavailable in the current session.
- Every project ships a pre-configured baseline of `@nuxt/eslint` + `eslint`, `@vueuse/nuxt`, and `@pinia/nuxt`, wired into `nuxt.config.ts`. In `ide` mode MAWA installs and configures this baseline automatically during Stage 02 and reports exactly what it did; `web` mode provides the commands for the human to run.
