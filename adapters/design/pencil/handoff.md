# Pencil Handoff

See `prompts/05a-design-handoff-prompt.md` for the standby/handoff process. Because
Pencil exposes an MCP, the agent may instruct it to write the approved output directly
to the target path below, instead of relying on a manual export.

The design stage should produce:

```text
specs/layouts/[module-name].approved-layout.md
```

The approved layout must document:

- screen/region hierarchy;
- layout invariants;
- component intent;
- interactive states;
- copy that must be preserved;
- known implementation constraints;
- adapter-specific notes.

If the selected UI adapter is DareDash, also load:

```text
adapters/ui/daredash/handoff-rules.md
```
