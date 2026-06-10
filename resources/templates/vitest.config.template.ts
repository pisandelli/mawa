// MAWA Vitest config. Uses the Nuxt test environment so store/component tests get
// Nuxt auto-imports (ref, computed, acceptHMRUpdate, useAsyncData, ...) and the `@/` alias.
//
// Without this, plain `vitest` fails on MAWA stores with `ReferenceError: ref is not defined`.
//
// Requires (dev deps): @nuxt/test-utils, vitest@^3 (Nuxt 4 needs Vitest 3+), happy-dom.
// Per-file override is also possible with a top comment: `// @vitest-environment nuxt`.

import { defineVitestConfig } from '@nuxt/test-utils/config';

export default defineVitestConfig({
  test: {
    environment: 'nuxt',
  },
});
