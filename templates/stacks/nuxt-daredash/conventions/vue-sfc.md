# Vue SFC convention

- Use Nuxt 4's `app/` source directory.
- Keep pages thin: pages compose components and stores; they do not call API modules.
- Use `script setup` and TypeScript for new SFCs.
- Select the template language during setup; when `pug` is selected, use it consistently.
- The selected UI library contract overrides examples that conflict with its documented public API.
