# Evidence Ledger And Reconciliation

Multi-agent work는 coordinator가 output을 신뢰하고 비교하고 병합할 수 있을 때만 유용합니다. 작업 중에는 append-only evidence ledger를 사용하고, review된 conclusion만 승격합니다.

## Ledger Entry Shape

각 entry에는 다음이 포함되어야 합니다.

- `taskId`: worker contract id.
- `workerRole`: implementer, researcher, reviewer, tester, doc writer, security reviewer, release checker.
- `status`: `ready`, `blocked`, `advisory`, `conflict`, `superseded`, `accepted`.
- `claim`: 하나의 factual claim 또는 change summary.
- `locator`: project-relative file, line, symbol, runtime report, command summary, screenshot, source registry item, manual observation record.
- `scanRange`: 검색한 path, command, index, source.
- `verification`: 실제 실행한 command나 check.
- `risk`: 남은 불확실성, skipped check, privacy caveat, stale fact, reviewer concern.
- `review`: accepted, rejected, needs follow-up, promoted with destination.

## Reconciliation Checklist

- Worker claim을 source file, current docs, runtime index, project rule과 비교합니다.
- 두 worker가 같은 file, contract, data shape, command, release gate를 바꾸거나 조언했는지 확인합니다.
- Absence claim은 scan range와 freshness가 기록되지 않으면 unsafe로 취급합니다.
- Generated evidence와 trusted memory를 분리합니다.
- Raw trace, long log, private output, unreviewed generated summary는 public docs에 넣지 않습니다.
- 해결되지 않은 conflict는 blocker, follow-up issue, 명시적 accepted-risk note로 바꿉니다.

## Promotion Rules

- Reviewer가 evidence를 다시 열 수 있을 때만 stable fact를 승격합니다.
- Durable project knowledge일 때만 `memory/`로 승격합니다.
- Historical decision path나 milestone evidence는 `worklogs/`로 승격합니다.
- Future work가 지켜야 하는 boundary는 `contracts/`로 승격합니다.
- Generated, stale-prone, large, not-yet-reviewed tool output은 `runtime/`에 둡니다.

## Handoff Summary

최종 handoff에는 다음이 포함되어야 합니다.

- worker task id와 final status,
- accepted conclusion,
- rejected 또는 superseded claim,
- unresolved conflict,
- verification evidence,
- skipped check와 residual risk,
- 변경한 file 또는 의도적으로 바꾸지 않은 file,
- owner가 있는 next action 또는 stop reason.
