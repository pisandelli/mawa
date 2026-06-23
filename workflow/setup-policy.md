# Setup Policy

MAWA never installs dependencies or modifies setup files **silently** or **beyond the
fixed baseline**. Automatic is not the same as silent — anything MAWA applies on its own,
it reports. Two tiers apply.

Environment setup happens after the Project Briefing stage so setup decisions can reflect the actual product context. MAWA records confirmed setup status in `.mawa-config.yaml`.

## Tier 1 — Fixed baseline (auto-applied, always reported)

The MAWA baseline is identical in every project, so in `ide` execution mode MAWA **may
install and configure it automatically, without asking first** (in any interaction mode).
It must then **clearly report what it did**. The baseline is:

- the Nuxt 4 scaffold, if the application does not exist yet;
- `@pinia/nuxt`, `@nuxt/eslint` + `eslint`, `@vueuse/nuxt`;
- `pug` when `core.template_language` is `pug`;
- the baseline config files: `nuxt.config.ts`, `tsconfig.json`, `eslint.config.mjs`.

After applying the baseline, MAWA must report: the commands it ran, the packages added
(marking dependency vs devDependency), and the files it created or modified. All of this
happens inside `paths.app_root`.

In `web` execution mode MAWA cannot run commands, so it provides the baseline commands and
the human applies them.

## Tier 2 — Everything else (confirm-first)

For anything outside the fixed baseline — UI adapter packages, the optional test toolchain
(`@nuxt/test-utils`, Vitest 3+, `vitest.config.ts`), design tooling/MCP, or any
choice-bearing dependency — MAWA does **not** install or modify config automatically. It
must:

- identify required dependencies;
- provide install commands and suggested configuration snippets;
- explain adapter-specific decisions;
- remind the human that design MCP/tooling is configured outside MAWA;
- ask the human to confirm when setup is complete.

MAWA may apply Tier 2 changes automatically only when the human explicitly asks it to.

## Adapter docs

Adapter operational docs are loaded from the adapter's configured `source_url` whenever a stage requires them and they are unavailable in the current session. No local committed copy is required by default.

If the environment cannot fetch the URL (e.g. `web` execution mode), the agent asks the
human to provide the current adapter docs content.
