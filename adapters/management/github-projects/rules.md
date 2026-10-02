# GitHub Projects Adapter Rules

## Safety and ownership

- This adapter runs only when `management.enabled = true` and
  `management.adapter = "github-projects"`.
- Always run preflight and a dry-run before an external write. `sync_mode: dry-run` never
  writes.
- A human must approve each publish preview in `approval-required` mode.
- A resource bootstrap is a separate external write. It requires its own preflight,
  dry-run preview, and explicit approval even when the human already enabled the adapter.
- The adapter owns only records listed in `specs/management/github-projects-sync.yaml`.
  Never update, relabel, or move unrelated Issues or Project items.
- Never persist a token, authentication output, or secret in the repository.

## Bootstrap rules

- Ask whether the repository and Project exist before attempting a connection. Never infer
  their absence from an authentication or lookup error.
- Create only the resource explicitly marked `create` in `management.bootstrap`; connect
  to the other resource when it already exists.
- A repository bootstrap creates an empty remote repository with the approved visibility.
  It never initializes, changes, or pushes the local Git checkout.
- A Project bootstrap must preflight support for the Kanban contract (`Status` and
  `Backlog`) and its requested views before any resource is created. The default baseline
  creates a Kanban board grouped by Status and a Roadmap view using the target-date field.
  If the selected transport cannot support the requested configuration, stop and direct
  the human to create/configure the Project manually.
- Do not create labels, milestones, Issues, or Project items during bootstrap. Those are
  managed only in an approved module-spec synchronization.
- Persist bootstrap results only after each remote operation is confirmed. On a partial or
  ambiguous result, retain the proposed configuration and record/report the exact resource
  that needs reconciliation. Never delete a partially created remote resource automatically.

## Issue contract

For an approved module spec, create an Issue whose title starts with the module name and
whose body links to the relative spec path. The body must include a stable MAWA marker:

```text
<!-- mawa:module-spec=specs/modules/[module-name].spec.md -->
```

Use only labels declared in `management.labels.managed`. Recommended initial labels are
`mawa` and `type:module`; optional `area:<domain>` labels need an explicit configuration.
Do not represent status, priority, sprint, or ownership with labels.

Milestones belong to the GitHub Issue, not the Project item. With `milestones.strategy:
manual`, do not set one. With `phase`, propose a matching milestone in the dry-run but
require the human to approve its exact target before assignment.

## Project contract

Add the Issue to the configured Project. If the Project has a `Status` field with
`Backlog`, set it only on item creation. On later synchronization, preserve the existing
Status and every human-managed field, including priority, assignee, iteration, dates and
custom fields.

The adapter must perform Issue creation/update, Project item addition, and Project field
updates as separate operations. A partially completed write is recorded as pending and
reconciled through the sync map; never repeat blindly.

## Dry-run preview

The preview must show:

- repository and Project owner/number;
- whether an Issue or Project item will be created, reused, or left unchanged;
- exact title, spec link, labels, and requested milestone;
- intended initial Status and an explicit statement that human fields will be preserved;
- any required label or milestone creation;
- warnings, unresolved fields, and the precise write operations.

## Idempotency

Resolve the existing mapping first. If there is no mapping, search for the stable MAWA
marker in the configured repository before creating an Issue. If adding existing Issue
content to a Project returns an existing item, record that item rather than creating a
duplicate. Only update the sync map after each external operation has a confirmed result.
