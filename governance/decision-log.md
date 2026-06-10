# Decision Log

Record important architectural and workflow decisions here.

## Accepted Defaults

- MAWA is Nuxt 4-first.
- Pinia is the default state layer.
- pnpm is the package manager.
- DareDash is the default UI adapter.
- Pencil is the default design adapter.
- Interaction mode defaults to `interactive`.
- Setup is manual-confirmed and not silently applied.
- Adapter operational docs are read from the adapter's canonical `source_url`, not stored locally, and loaded again when unavailable in the current session.
