// MAWA root ESLint flat config.
// @nuxt/eslint generates a project-aware config at ./.nuxt/eslint.config.mjs after
// `nuxi prepare`. `withNuxt` extends it; add project overrides inside the call.
// Place this file at the application root (paths.app_root).
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  // Project-specific overrides go here, e.g.:
  // {
  //   rules: {
  //     'vue/multi-word-component-names': 'off',
  //   },
  // },
)
