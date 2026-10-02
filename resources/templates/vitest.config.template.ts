// MAWA Vitest config. Uses the Nuxt test environment so store/component tests get
// Nuxt auto-imports (ref, computed, acceptHMRUpdate, useAsyncData, ...) and the `@/` alias.
//
// Without this, plain `vitest` fails on MAWA stores with `ReferenceError: ref is not defined`.
//
// Install @nuxt/test-utils and the newest stable Vitest version accepted by its peer range,
// plus a supported happy-dom version. Never pin Vitest 3 from this historical template.
// Per-file override is also possible with a top comment: `// @vitest-environment nuxt`.

import { defineVitestConfig } from '@nuxt/test-utils/config';

export default defineVitestConfig({
  test: {
    environment: 'nuxt',
  },
});
