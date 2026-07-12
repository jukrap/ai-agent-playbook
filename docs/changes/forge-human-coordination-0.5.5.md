# Forge Human Coordination 0.5.5

Version 0.5.5 separates the machine execution graph from the public collaboration surface. The local ledger keeps fine-grained tasks, attempts, verification evidence, and resume state. GitHub or Gitea presents one program roadmap plus reviewable delivery groups.

## Presentation contract

- `workflow.plan.v2` accepts a `coordination` section with a program, delivery groups, issue mode, project mode, title policy, and child-issue limit.
- Remote apply requires reviewed coordination metadata. The default is one parent plus at most six delivery-group issues; task-per-issue behavior is an explicit legacy mode.
- Korean managed titles must be written as noun phrases. Sentence-style generated endings block apply instead of being mechanically rewritten.
- Parent and group bodies contain scope, non-goals, acceptance, dependencies, validation, risk, rollback, progress, and technical details.
- Managed updates replace only the marked region and preserve user notes. GitHub reconciliation requires a verified parent/sub-issue relationship and stops when ownership cannot be confirmed.
- Milestones record the program purpose, completion definition, and current task/criterion gate instead of only a title.

## Projects, labels, and permissions

GitHub Projects is preferred for status, priority, risk, phase, progress, and localized views. Milestones track release progress. New repositories use only the explicit `status:ready` execution approval when Projects is available; the old `aapb:*` labels remain readable aliases.

Managed Projects use an `AAPB Status` field with Planned, Ready, In Progress, In Review, Blocked, and Done options, plus an area field. Reconcile writes every Project item before removing priority, risk, or area labels from issues. A failed Project or View prerequisite stops the remaining remote mutations.

When preferred Projects writes lack the `project` scope, doctor blocks the first coordination write before transport mutation and prints:

```powershell
gh auth refresh -s project
aapb forge status .
```

Authentication refresh is never automatic. `--allow-capability-fallback projects,views` selects an explicit milestone fallback for the current command.

## Reconciliation

`forge reconcile --plan` previews consolidation of legacy task issues into delivery groups. Closing and unlinking superseded issues requires both `--apply` and `--allow-supersede`. History is preserved, survivor links are recorded, and issues or labels are never deleted by this flow.

Optional `coordination.reconcile` entries let a reviewed presentation migration adopt named supporting issues and existing draft PRs. Fresh CAS snapshots prevent overwriting a changed PR or issue. GitHub Project previews include the roadmap, delivery groups, supporting issues, and reviewed PR. Missing `project` scope blocks all writes but still reports planned artifact counts and the browser-auth remediation.

Draft pull requests use the delivery-group title and report actual changes, verification evidence, risks, rollback, and remaining work. A merge approval gate holds merge only; it does not invent a requirement to merge before implementation, verification, or draft PR creation.

Large deliveries, deliveries without a positive structured or parsed test count, and UI changes without real media evidence enter review. UI evidence must be created during the task attempt, remain inside the controller workspace, and pass format validation; PNG evidence is CRC-checked and decoded. If acceptance criteria name screen sizes such as `1600x1000`, PNG evidence must cover every named size. Verification commands can declare project-relative `evidencePaths`; review approval cannot waive missing UI evidence.
