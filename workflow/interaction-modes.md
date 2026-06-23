# Interaction Modes

## Philosophy

MAWA minimizes **mechanical** interaction (copy/pasting the next prompt, re-confirming
trivia, the human hand-operating the workflow) — not **substantive** interaction.
Substantive clarification is valuable and encouraged where it improves the artifact. The
Project Briefing interview (Stage 01) is the clearest example: deep, critical questioning
there is a feature, not friction. Reducing interaction never means skipping the questions
that produce a complete, well-grounded briefing.

## interactive

Default mode.

MAWA must:

- ask before advancing to the next stage;
- ask before implementation;
- ask which module to implement;
- ask before Tier 2 setup/destructive actions (the fixed baseline is auto-applied and reported — `workflow/setup-policy.md`);
- avoid asking for non-blocking details;
- continue by loading the next stage protocol after approval, without asking the human to copy/paste the prompt.

## continuous

Useful for small projects and low-risk flows.

MAWA may:

- proceed when safe assumptions exist;
- document assumptions;
- continue through non-destructive stages;
- stop only for blockers.

MAWA must still not install or modify setup silently or beyond the fixed baseline.

## Human input required

Stop for human input when:

- required paths are missing;
- credentials/secrets are needed;
- setup or destructive actions are required;
- a target module must be selected;
- a design handoff must be approved;
- a legal/accounting/business rule cannot be safely inferred.
