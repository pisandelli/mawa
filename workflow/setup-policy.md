# Setup Policy

MAWA does not silently install dependencies or modify project configuration files during environment setup.

Environment setup happens after the Project Briefing stage so setup decisions can reflect the actual product context.

During setup, MAWA must:

- identify required dependencies;
- include `pug` as a dev dependency when `core.template_language` is `pug`;
- provide a root `tsconfig.json` (from `resources/templates/tsconfig.template.json`) so type checking works;
- provide the test toolchain (`@nuxt/test-utils`, Vitest 3+, `vitest.config.ts`) when tests are planned;
- provide install commands;
- provide suggested configuration snippets;
- explain adapter-specific decisions;
- remind the human that MCP/tooling is configured outside MAWA;
- ask the human to confirm when setup is complete;
- record confirmed setup status in `.mawa-config.yaml`.

MAWA may only modify setup files automatically when the human explicitly asks it to do so.

## Adapter docs

Adapter operational docs are loaded from the adapter's configured `source_url` whenever a stage requires them and they are unavailable in the current session. No local committed copy is required by default.

If the environment cannot fetch the URL (e.g. `web` execution mode), the agent asks the
human to provide the current adapter docs content.
