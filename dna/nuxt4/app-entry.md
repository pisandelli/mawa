# Nuxt 4 Application Entry

Choose the entry from the approved navigation, not from the scaffold example.

- A genuine single-view application may render directly in `app/app.vue` and omit `app/pages/`.
- A routed application creates `app/pages/index.vue` for `/` and one file per route.
  `app/app.vue` may be omitted, or must render `<NuxtPage />`.
- When the specification has distinct shells, use `<NuxtLayout><NuxtPage /></NuxtLayout>`
  in `app/app.vue` and place those shells in `app/layouts/`.
- Never overwrite a customized existing `app/app.vue` without showing the diff and receiving approval.
