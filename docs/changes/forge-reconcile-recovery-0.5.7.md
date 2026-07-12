# Forge Reconcile Recovery 0.5.7

AI Agent Playbook 0.5.7 makes reviewed presentation reconciliation recoverable after a partial supersede migration.

## CAS-safe supersede order

- An obsolete issue is closed against the reviewed `updatedAt` snapshot before its marker comment or native sub-issue relationship is changed.
- A failure blocks later operations for the same delivery group, so the next preview can re-read the authoritative remote state instead of continuing with a stale snapshot.
- Existing issues, comments, and label definitions remain preserved. Reconcile does not force-update a drifted issue.

## Interrupted-run recovery

- Managed issue inspection can recover an open issue whose parent relationship was already removed by an interrupted run.
- Recovery is limited to task IDs in the approved coordination groups and requires the exact `aapb:superseded` marker for the approved plan, group, and issue number.
- Duplicate plan, task, group, or supersede-comment markers are treated as ambiguous. An issue without the exact marker is not recovered; ambiguous, failed, or over-limit marker inspection blocks writes.

## Managed Project cleanup

- Preview reports Project items to ensure separately from obsolete Project items to remove.
- Removing an obsolete task card uses GitHub's public `deleteProjectV2Item` mutation under the existing `--allow-supersede` approval gate.
- Attached issues remove the obsolete Project card before their final hierarchy unlink; recovered unlinked issues remove it before closure, keeping every failed cleanup state discoverable by the next preview.
- The provider resolves the current repository issue node ID before matching a Project card, so another repository's same-numbered issue is never selected.
- Project item and sub-issue removals require `--allow-supersede` at the apply boundary even if a malformed plan omits approval metadata. Project item removal is idempotent and does not delete or rewrite the underlying issue.
