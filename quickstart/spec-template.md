# 📋 Quick Spec (MAWA Quickstart)

> **Instructions:** Implementation-level detail for a small project, in one document.
> **Sources of truth:** `governance/core-rules.md`, the selected UI adapter `rules.md`,
> and the adapter operational docs from its configured `source_url`.
> The component prefix and adapter shown below come from `.mawa-config.yaml`.

## 1. 🎯 Overview

- **Project name:** [name]
- **Main objective:** [what it does and for whom]
- **Key differentiator:** [what makes it useful]

## 2. 👤 Personas & User Stories

| Persona | Wants (action) | For (benefit) |
| :------ | :------------- | :------------ |
| [role]  | [action]       | [benefit]     |

## 3. 🗺️ Navigation

Expected routes under `app/pages/`:

- `/` …
- protected vs public routes
- layout usage (`layouts/default.vue`, dashboard shell, etc.)

## 4. 💾 Data Model

Define the main entities and relationships. If a database is required, draft the schema
direction. **If not, state explicitly that no database/ORM is used.**

## 5. 🔌 API Modules (Layer 1)

Raw, stateless data access only. List the modules and their methods.

```ts
// app/api/ExampleModule.ts
export const ExampleModule = {
  list(filters) { /* ... */ },
  create(payload) { /* ... */ },
};
```

## 6. 🧠 State Strategy (Layer 2)

For each domain store define:

- store name;
- state shape (`data`, `loading`, `error`);
- SSR hydration points;
- optimistic vs pessimistic updates;
- retry and empty-state behavior.

## 7. 🎨 UI Strategy (Layer 3)

Using the **selected UI adapter** (do not invent component APIs):

- **Prefix:** [adapter default or custom]
- **Layout primitives:** [which adapter layout components structure the app]
- **Forms:** [validation wrappers / primitives only / mixed]
- **Feedback:** [alerts / loading / toasts / modals / drawers]
- **Tables / menus / tabs / navigation:** [planned components]
- **Custom CSS policy:** [only what the adapter cannot solve, and why]

## 8. 🎛️ Tokens, Theme, Icons

- **Tokens source:** [default / custom directory / merged]
- **Theme model:** [single / light-dark / branded]
- **Icon overrides:** [adapter config keys, if any]
- **Prefix impact:** [how token references change if the prefix changes]

## 9. 🛡️ Critical Business Rules

1. [rule]
2. [rule]

## 10. ✅ Validation & Test Plan

- Unit tests for stores and pure logic.
- Component tests for critical rendering and interaction paths.
- Confirm only the adapter's public component APIs were used.
- Confirm forms use the correct wrapper vs primitive.
- Confirm prefix usage is consistent across markup and CSS variables.
- Confirm the required UX states are handled (loading, error, empty, ideal, partial).
