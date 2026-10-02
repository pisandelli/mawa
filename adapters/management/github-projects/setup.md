# GitHub Projects Setup

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

The adapter must show a dry-run preview after this check and before the first write.
