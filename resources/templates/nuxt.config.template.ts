// MAWA Nuxt 4 base template.
// This file contains only global MAWA defaults.
// UI adapters must be installed and configured manually using their setup guides.
//
// Layer imports use Nuxt's native alias `@/` (→ srcDir `app/`):
//   import { Foo } from '@/api/FooModule'
//   import { useFooStore } from '@/stores/foo'
//   import type { Foo } from '@/types/foo'
// Do NOT define a custom `@types` alias — `@types/*` collides with TypeScript's
// declaration-package resolution (error TS6137). `@/types/*` is safe and needs no config.

export default defineNuxtConfig({
  modules: [
    '@pinia/nuxt',
  ],

  typescript: {
    strict: true,
  },

  pinia: {
    storesDirs: ['./app/stores/**'],
  },
})
