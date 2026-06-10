# DareDash UI Rules

These rules apply when the MAWA manifesto (`.mawa-config.yaml`) sets the UI adapter to **DareDash**.

## 🚫 Blocking Anti-Patterns
* **NO internal DareDash imports:** NEVER import from `runtime/components/*`, `runtime/shared/utils/*`, `#dd/*`, `useBaseComponent`, or `useThemeEditor`.
* **NO invented component APIs:** NEVER invent props, emits, slots, or attrs not documented in DareDash operational docs.
* **NO generic `variant` props:** Use supported attrs such as `primary`, `outline`, `compact`, `warning`, etc.
* **NO mixed component naming styles:** Use **kebab-case** tags consistently in Pug.
* **NO multiple `dd-toaster` instances:** The app gets one global toaster.
* **NO form wrapper misuse:** `dd-form-*` requires `vee-validate` context. Use primitives when validation wrappers are unnecessary.

## 🧩 DareDash Usage Protocol
* **Install as Nuxt Module:** Configure `daredash` in `nuxt.config.ts`.
* **Prefix Awareness:** Ask which prefix the project uses. Default is `dd`.
* **Prefix Consistency:** If the prefix changes, update component tags, token references, and examples everywhere.
* **Public Surface Only:** Safe APIs are auto-registered components, `useToaster`, module options (`tokens`, `prefix`, `debug`), and `appConfig.daredash.icons`.
* **Template Convention:** Use the project-configured Vue template language consistently. When using Pug, use kebab-case tags (e.g. `dd-button`, `dd-alert`, `dd-stack`).
* **Forms:** Use `dd-form-*` only with `vee-validate`. Otherwise use `dd-input`, `dd-select`, `dd-textarea`, etc.
* **Feedback:** Use `dd-alert` for inline feedback and `useToaster` + `dd-toaster` for transient notifications.

## 🏗️ Layout & Composition
* **Preferred Primitives:** `dd-layout`, `dd-sidebar`, `dd-stack`, `dd-cluster`, `dd-grid`, `dd-box`, `dd-center`.
* **Attrs over Custom Wrappers:** Prefer supported attrs such as `compact`, `between`, `wide`, `intrinsic`, `fill`, `nogap`.
* **Semantic HTML:** Use `tag` where needed so layout primitives keep correct semantics.
* **Shell Contract Verification:** Before composing an app shell with `dd-layout` or `dd-sidebar`, verify the real runtime contract in DareDash operational docs. Do not assume slot or sizing behavior from naming intuition.

## 🎨 Styling & Customization
* **Default Path:** Component -> attrs -> tokens/variables -> minimal local CSS.
* **Custom CSS is Exceptional:** Only add app-level CSS after DareDash options are exhausted.
* **Prefer Token and Variable Overrides:** Adjust local visual behavior through exposed CSS variables and token files before one-off declarations.
* **Respect the Prefix in CSS Variables:** If the prefix is `dd`, variables look like `--dd-*`.

## 📏 Documentation & Examples
* **Reference Docs:** Treat the DareDash operational docs loaded from `ui.docs.source_url` as the UI source of truth. Load them whenever required and unavailable in the current session. A local committed copy is not required.
* **Convention Override:** If examples use `DdButton`, translate them into `dd-button`.
* **No Mixed Examples:** Never combine PascalCase and kebab-case component naming.
