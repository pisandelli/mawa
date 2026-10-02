# GitHub Projects Management Adapter

This optional adapter turns approved MAWA module specifications into a governed GitHub
backlog. It does not replace MAWA artifacts or take planning ownership away from the
product team.

## What it manages

- one MAWA-owned GitHub Issue per approved module specification;
- one linked item in a configured GitHub Project;
- a small, configured set of labels;
- an auditable local map between a spec, Issue, and Project item.

It begins with a Kanban Project. The same Project may have a Roadmap view, where the team
uses phase and date fields to plan work. MAWA never creates dates, priorities, assignees,
iterations, or statuses without an explicit future policy.

## Enable it

Add a `management` block to `.mawa-config.yaml` and follow [setup.md](setup.md). The
default transport is the direct GitHub API. `gh` is supported only when the human chooses
it in the manifest.

## Lifecycle

1. Stage 04 presents a local backlog preview based on the Domain Map.
2. Stage 05 creates a dry-run preview after a module spec is ready.
3. The human explicitly approves or defers publication.
4. On approval, the adapter creates or reuses the Issue, adds it to the Project, applies
   only configured labels, and updates the local sync map.

Read [rules.md](rules.md) before acting and [backlog-sync.md](backlog-sync.md) before
writing or reconciling a mapping.
