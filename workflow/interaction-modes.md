# Interaction Modes

## interactive

Default mode.

MAWA must:

- ask before advancing to the next stage;
- ask before implementation;
- ask which module to implement;
- ask before setup/destructive actions;
- avoid asking for non-blocking details;
- continue by loading the next stage protocol after approval, without asking the human to copy/paste the prompt.

## continuous

Useful for small projects and low-risk flows.

MAWA may:

- proceed when safe assumptions exist;
- document assumptions;
- continue through non-destructive stages;
- stop only for blockers.

MAWA must still not silently install dependencies or modify setup files unless explicitly allowed.

## Human input required

Stop for human input when:

- required paths are missing;
- credentials/secrets are needed;
- setup or destructive actions are required;
- a target module must be selected;
- a design handoff must be approved;
- a legal/accounting/business rule cannot be safely inferred.
