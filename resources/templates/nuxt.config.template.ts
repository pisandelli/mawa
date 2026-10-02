// MAWA Nuxt 4 base template.
// This file contains only global MAWA defaults + the pre-configured baseline modules
// (@nuxt/eslint, @vueuse/nuxt, @pinia/nuxt).
// UI adapters must be installed and configured manually using their setup guides.
//
// Layer imports use Nuxt's native alias `@/` (→ srcDir `app/`):
//   import { Foo } from '@/api/FooModule'
//   import { useFooStore } from '@/stores/foo'
//   import type { Foo } from '@/types/foo'
// Do NOT define a custom `@types` alias — `@types/*` collides with TypeScript's
// declaration-package resolution (error TS6137). `@/types/*` is safe and needs no config.

export default defineNuxtConfig({
  // Stage 02 replaces this value with the local date on which it creates this file.
  // Keep the resulting literal stable; do not use new Date() here.
  compatibilityDate: '{{COMPATIBILITY_DATE}}',

  modules: [
    '@nuxt/eslint',
    '@vueuse/nuxt',
    '@pinia/nuxt',
  ],

  // @nuxt/eslint generates a flat config at .nuxt/eslint.config.mjs (consumed by the
  // root eslint.config.mjs via withNuxt). See resources/templates/eslint.config.template.mjs.
  eslint: {},

  typescript: {
    strict: true,
  },

  pinia: {
    storesDirs: ['./app/stores/**'],
  },
})
