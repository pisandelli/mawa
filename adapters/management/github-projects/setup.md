# GitHub Projects Setup

## Resource choice

At Stage 00, ask whether each resource already exists. The two choices are independent:

| Resource | `connect-existing` | `create` |
| --- | --- | --- |
| Repository | Verify the named `owner/repository`. | Create the named empty repository with the confirmed visibility. |
| Project | Verify the configured owner and Project number. | Create a Project under the configured owner and prepare it for Kanban. |

Record the chosen modes under `management.bootstrap`. `repository` must always name the
target `owner/repository`; `project.number` may be `null` only while a Project bootstrap
is pending.

## Bootstrap contract

Before a bootstrap write, show a dry-run preview and obtain explicit approval. It must
state the owner, repository name, repository visibility, Project title, Project owner, and
every intended Project field or view configuration.

A repository bootstrap creates an **empty remote repository only**. It must not run
`git init`, create a README, add a license, push a branch, or modify any local files.

A Project bootstrap creates a Project with the following baseline, unless the human opted
out in `management.bootstrap.views`:

- a `Kanban` board grouped by `Status`, with a `Backlog` option;
- a `Roadmap` view using the Project target-date field;
- no assignees, priorities, iterations, dates, Issues, labels, or milestones.

Preflight must confirm that the selected transport and credentials can create the required
Project, fields, and views before any write. If a later remote operation fails after a
resource was created, record and report the exact partial state for reconciliation; do not
delete it automatically or retry blindly. The human can then complete setup manually and
choose `connect-existing`.

After a successful bootstrap, update `.mawa-config.yaml` with the returned Project number,
set the corresponding bootstrap mode to `connect-existing`, and report the remote URLs.

## Project preparation

Create or choose one GitHub Project owned by the configured user or organization. Start
with the **Kanban** template and ensure it has a `Status` field with a `Backlog` option.
The manager may add a Roadmap view to this same Project later; it should use the teams own
phase and date conventions.

The adapter configuration names the repository and Project explicitly:

```yaml
management:
  enabled: true
  adapter: "github-projects"
  transport: "github-api"
  sync_mode: "approval-required"
  repository: "owner/repository"
  project:
    owner: "owner-or-organization"
    number: 1
  bootstrap:
    repository: "connect-existing"
    project: "connect-existing"
    repository_visibility: "private"
    views:
      kanban: true
      roadmap: true
```

## Authentication

Supply credentials through the execution environment, never through a MAWA file. The
recommended API transport reads `GITHUB_TOKEN`. The token or GitHub App installation must
be able to read and write Issues in the configured repository and manage items in the
configured Project. Organization and user Projects have different permission models, so
the preflight is mandatory.

For `transport: "gh"`, the authenticated `gh` session must satisfy the same capabilities.
The CLI is an explicit user choice, not a MAWA baseline dependency.

## Preflight checklist

Before every first write, verify all of the following and stop without writing if any fail:

- the repository resolves and Issues are enabled;
- the configured Project resolves and can accept Issue items;
- the `Status` field and `Backlog` option are present, or the user approves a documented
  fallback that leaves Status unchanged;
- configured labels already exist or the preview explicitly requests their creation;
- the adapter has credentials with the required permissions;
- no existing sync-map record points to a different repository or Project.

For resources marked `create`, replace the corresponding resolve check with a collision,
owner, permission, and transport-capability check. The bootstrap dry-run must distinguish
these checks from confirmation that an existing resource was found.

The adapter must show a dry-run preview after this check and before the first write.
