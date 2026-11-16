# TypeScript convention

- Keep TypeScript strict.
- Use Nuxt aliases rooted at `@/`; do not create an `@types` alias.
- Keep API boundary types explicit and use English identifiers.
- Stores own `{ data, loading, error }` state; components consume stores rather than API modules directly.
