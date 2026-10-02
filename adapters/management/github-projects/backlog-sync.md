# GitHub Projects Sync Map

The adapter writes `specs/management/github-projects-sync.yaml` only after a confirmed
GitHub operation. It is a reconciliation record, not a backlog export.

```yaml
version: 1
adapter: github-projects
repository: owner/repository
project:
  owner: owner-or-organization
  number: 1
modules:
  billing:
    spec_path: specs/modules/billing.spec.md
    spec_fingerprint: sha256:replace-with-content-fingerprint
    issue_number: 42
    issue_node_id: I_kwDO...
    project_item_id: PVTI_...
    last_sync: 2026-10-02T12:00:00Z
    pending_operations: []
```

## Reconciliation rules

1. Treat the mapping as invalid if its repository or Project differs from the active
   manifest. Stop and ask for a deliberate migration decision.
2. If an Issue exists but its Project item does not, propose only the missing add-item
   operation.
3. If the Project item exists but an Issue cannot be found, do not create a replacement;
   report the broken link.
4. If the spec fingerprint changed, show the body/label delta in dry-run. Do not reset
   status or any human field.
5. Leave `pending_operations` intact after a failed or ambiguous write so the next run can
   reconcile safely.
