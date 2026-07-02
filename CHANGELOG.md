# Changelog

All notable changes to MAWA are recorded here, starting from the first release.
Format based on [Keep a Changelog](https://keepachangelog.com/); versioning follows
[SemVer](https://semver.org/) (pre-1.0: anything may change between betas).

## [Unreleased]

## [0.1.0-beta.3] - 2026-07-02

### Changed

- Clarified the fixed baseline setup when `template_language` is `pug`, including the
  required packages and matching `nuxt.config.ts` Vue compiler plugin setup.
- Tightened Stage 02 setup guidance and related governance notes so baseline behavior is
  consistent across the workflow docs.

## [0.1.0-beta.2] - 2026-06-23

### Changed

- Stage 01 now runs a critical briefing interview and records project risks and gaps in
  the Project Briefing artifact.
- Setup and implementation are now scoped strictly to `paths.app_root`, keeping the app
  separated from the workflow repository root.
- The fixed baseline now includes `@nuxt/eslint`, `eslint`, `@vueuse/nuxt`, and
  `@pinia/nuxt`, with matching Nuxt 4 templates and setup-policy guidance.

## [0.1.0-beta.1] - 2026-06-10

Initial public beta.
