# DareDash Setup

DareDash selected.

MAWA does not install DareDash or modify `nuxt.config.ts` silently. Complete the setup manually or explicitly ask MAWA to apply the changes.

## Required manual setup

1. Install DareDash (scoped npm package; currently pre-1.0 / beta):

```bash
pnpm add @pisandelli/daredash
```

2. Add DareDash to `nuxt.config.ts`.

Suggested configuration:

```ts
export default defineNuxtConfig({
  modules: [
    '@pinia/nuxt',
    [
      '@pisandelli/daredash',
      {
        prefix: 'dd',
        debug: false,
      },
    ],
  ],
})
```

3. No local docs file is required. MAWA loads the DareDash operational docs from the
   configured `ui.docs.source_url` whenever a stage requires UI-specific decisions and
   the docs are not already available in the current session:

```text
https://raw.githubusercontent.com/pisandelli/daredash/main/llms.txt
```

   Ensure the execution environment can fetch this URL. In `web` execution mode, if the
   agent cannot fetch it, it must ask the human to provide the current DareDash operational docs content.

## Human decisions required

Confirm:

- component prefix;
- debug mode;
- custom tokens path, if any;
- icon overrides in `app.config.ts`, if any;
- form strategy.

## Notes

Default to `debug: false` unless explicitly requested.

Do not assume custom tokens, icon overrides, or a non-default prefix unless `.mawa-config.yaml` explicitly defines them.
