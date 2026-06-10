# Pencil Design Rules

These rules apply when `pencil` is the selected MAWA design adapter.

MAWA assumes external MCP/tooling is already configured.

Do not create or modify design artifacts unless the design stage is active and the human has confirmed access.

# Pencil Adapter Rules — VS Code

Use these rules only when the chosen visual engine is Pencil.

## Assumed Environment

- Pencil installed as a VS Code extension.
- A `.pen` file open in the editor.
- Pencil MCP connected to the Codex/assistant used in VS Code.
- The layout must be saved as a versionable file in the repo, for example:

```txt
/designs/[SPEC_SLUG].pen
```

## Mental Model

Pencil uses `.pen` files as design-as-code. Treat the file as a versionable, reviewable, and diffable Git artifact.

## Expected MCP Tools

When available, use:

- `get_editor_state` to understand the active file, selection, and schema.
- `batch_get` to read the hierarchy and existing components.
- `batch_design` to create, update, move, copy, and replace nodes.
- `snapshot_layout` to validate structure, bounds, and overlaps.
- `get_screenshot` to validate visually.
- `get_variables` and `set_variables` for tokens/variables when the file supports it.

If any tool is missing from your installation, adapt using the equivalent tool listed by the MCP.

## Node Structure

Prioritize `frame` for semantic groups and containers. Use texts, shapes, and icons only inside named frames.

Expected example:

```txt
Screen/Feature/Desktop
  Shell/App
    Sidebar/Primary
    MainArea
      Topbar/Main
        Topbar/Left
        Topbar/Right
      PageHeader
      Content/Main
```

## Do Not Create Loose Shapes

Every `text`, `rectangle`, `ellipse`, `icon_font` or SVG must be a child of a semantic frame.

## Icons in Pencil

- Prefer `icon_font` or the native icon mechanism when available.
- Do not edit internal SVG paths.
- Do not convert `stroke` to `fill`.
- If an icon deforms, replace it with `IconPlaceholder/<name>` and register a TODO.

## Reusable Components

First create the reusable visual patterns for the screen:

- Button/Primary
- Button/Ghost
- Field/Text
- Card/Base
- Table/Header
- Table/Row
- Sidebar/Item
- Topbar/Main

Then compose the page using these patterns.

## Variables and Tokens

- Read existing variables with `get_variables` when possible.
- If they do not exist, use the UI Framework tokens as explicit values.
- Do not create a parallel palette unnecessarily.
- Name variables using the token origin when possible, e.g., `[ui-framework].color.primary.600`.

## Checkpoints

Before each major step, describe the next change. After the step:

1. run `snapshot_layout`;
2. run `get_screenshot` when applicable;
3. fix overlaps or bad hierarchy before continuing.

## Acceptance Criteria

- The layer tree is semantically organized.
- Copyable elements are grouped as reusable parents.
- UI Framework tokens were used.
- Icons were not deformed.
- Critical states from the spec exist.
- The `.pen` file was saved in the agreed path.
