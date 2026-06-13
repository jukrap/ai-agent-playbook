# Runs

Runs는 하나의 작업에 대한 진행 중 실행 상태와 증거를 기록합니다.

진행 중 작업을 이어받거나 검증하는 데 필요한 증거는 runs에 둡니다. Milestone, blocker, 방향 전환 뒤 오래 남길 이력은 worklogs에 둡니다.

권장 CLI 흐름:

```powershell
npx ai-agent-playbook run start <target-repo> --title "Feature slice" --dry-run
npx ai-agent-playbook run start <target-repo> --title "Feature slice"
npx ai-agent-playbook run record <target-repo> --run-id feature-slice --type evidence --status pass --message "Verification passed" --evidence .ai-playbook/runs/feature-slice/evidence/verification.txt
npx ai-agent-playbook run status <target-repo> --run-id feature-slice --json
npx ai-agent-playbook run summarize <target-repo> --run-id feature-slice --dry-run
```

구조:

```text
runs/
  <run-id>/
    brief.md
    criteria.json
    ledger.jsonl
    evidence/
    summary.md
```

규칙:

- `ledger.jsonl`은 append-only로 유지합니다.
- Evidence path는 portable relative path만 기록합니다.
- 로컬 절대경로, credential, private URL, 민감값이 있는 raw log를 기록하지 않습니다.
- Handoff 전에 오래 남길 사실은 `CURRENT.md`, maps, runbooks, decisions, worklogs로 승격합니다.
