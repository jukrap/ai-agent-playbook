# Runs

Runs capture in-progress execution state and evidence for one task.

Use runs for evidence that helps resume or verify an active piece of work. Use worklogs for durable history after a milestone, blocker, or direction change.

Recommended CLI flow:

```powershell
npx ai-agent-playbook run start <target-repo> --title "Feature slice" --dry-run
npx ai-agent-playbook run start <target-repo> --title "Feature slice"
npx ai-agent-playbook run record <target-repo> --run-id feature-slice --type evidence --status pass --message "Verification passed" --evidence .ai-agent-playbook/workflows/runs/feature-slice/evidence/verification.txt
npx ai-agent-playbook run status <target-repo> --run-id feature-slice --json
npx ai-agent-playbook run summarize <target-repo> --run-id feature-slice --dry-run
```

Structure:

```text
runs/
  <run-id>/
    brief.md
    criteria.json
    ledger.jsonl
    evidence/
    summary.md
```

Rules:

- Keep `ledger.jsonl` append-only.
- Store only portable relative evidence paths.
- Do not record absolute local paths, credentials, private URLs, or raw logs with sensitive values.
- Promote durable facts to `CURRENT.md`, maps, runbooks, decisions, or worklogs before handoff.
