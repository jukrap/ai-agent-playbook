# Scheduler And Recovery

Run이 session, scheduled invocation, crash, unattended execution을 넘어 계속되어야 할 때 이 reference를 사용합니다.

## Tick Contract

Tick 하나는 ready task를 최대 하나 처리합니다.

1. Plan, ledger, derived state, policy, provider capability snapshot을 읽고 검증합니다.
2. Kill switch, pause label, deny flag, wall-clock budget, unresolved reconciliation이 활성화되었으면 작업을 거부합니다.
3. Single-controller lease와 monotonically increasing fencing token을 획득합니다.
4. Dependency-ready task 하나를 deterministic하게 claim합니다.
5. Bounded scope와 credential-scrubbed environment로 selected executor를 호출합니다.
6. Changed file을 review하고 controller에서 declared verification을 다시 실행합니다.
7. Remote synchronization 전에 evidence와 resulting state event를 기록합니다.
8. Effective profile이 허용할 때만 commit, push, draft pull request update를 수행합니다.
9. Task가 실패하더라도 lease를 해제하고 checkpoint를 남깁니다.

## Default Budgets

| Budget | Default |
|---|---:|
| Concurrent tasks | 1 |
| Tick duration | 30 minutes |
| Attempts per task | 3 |
| Consecutive no-progress ticks | 3 |
| Run wall time | 8 hours |
| Lease heartbeat | 30 seconds |
| Lease expiry | 2 minutes |

Budget은 목표가 아니라 상한입니다. Evidence, permission, safety boundary가 충분하지 않으면 더 일찍 중지합니다.

## Scheduling Modes

- Interactive work는 checkout 상태가 파악되고 requested operation이 허용할 때만 현재 checkout의 `aapb/` task branch를 사용합니다.
- Unattended work는 사용자의 working tree 밖에 있는 managed isolated checkout을 사용하고 task 또는 delivery group별 branch를 만듭니다.
- Local supervisor는 run budget 안에서 짧은 tick을 반복합니다. Remote state를 기다리기 위해 executor process를 계속 열어 두지 않습니다.
- Windows Task Scheduler와 systemd user service definition은 preview-first입니다. Explicit apply request 후에만 등록하거나 갱신합니다.
- GitHub Actions와 Gitea Actions는 job당 tick 하나를 실행하고 provider concurrency group을 사용하며, evidence를 쓰는 tick을 새 invocation이 대체하지 못하도록 `cancel-in-progress`를 비활성화합니다.
- Scheduled workflow는 project kill switch가 해제되고 repository automation variable이 명시적으로 활성화될 때까지 inactive 상태를 유지합니다.
- Hosted workflow는 `AAPB_AUTOMATION_PLAN`에서 commit된 approved sidecar의 repository-relative path를 읽을 수 있습니다. Cached run을 먼저 복원한 뒤 해당 값을 environment를 통해 인용된 argument `"$AAPB_AUTOMATION_PLAN"`으로 멱등적인 `automation start`에 전달하고 tick을 실행합니다. `planId`가 같으면 기본 run을 다시 쓰지 않고 재사용합니다.
- Pinned cache는 post-job phase에 runs directory와 external managed checkout을 함께 저장합니다. Worker를 다시 실행하지 않고 committed-but-not-pushed checkpoint를 재개하려면 둘 다 필요합니다. 이를 실행 중 state의 durable storage가 아니라 완료된 마지막 tick checkpoint로 취급합니다. Hard timeout, cancellation, runner loss, cache eviction이 있으면 더 이른 checkpoint부터 replay하고 모호한 external effect를 reconcile해야 할 수 있습니다.
- Hosted runner에는 configured Codex, Claude 또는 command executor가 설치·인증되어 있고 `automation doctor`로 검증되어야 합니다. Forge credential은 executor를 인증하지 않습니다. Claude 기본 unattended adapter는 edit-only tool만 노출하고 Bash를 비활성화하며 declared command는 controller verification이 별도로 실행합니다.
- Local schedule은 현재 CLI entrypoint를 내장합니다. Hosted definition은 자연어 remote deny를 포함한 effective no-remote/read-only/no-git 제한을 start와 tick command에 유지하고, local definition은 tick command에 유지합니다. Offline schedule apply와 hosted no-git schedule apply는 실행 전에 실패하거나 output을 안전하게 deliver할 수 없으므로 거부합니다.
- Gitea에서 `actions/cache`로 continuation하려면 runner cache service가 활성화·설정되어 있고 접근 가능해야 합니다. 실제 save/restore cycle을 검증하거나 review된 persistent storage/local scheduling을 선택합니다.
- Doctor의 scheduler readiness는 prerequisite signal로만 봅니다. Executable 또는 provider/repository compatibility는 등록, Actions 활성화, runner 상태, credential, remote invocation 성공을 증명하지 않습니다.

## Git Delivery

- Dirty 또는 untracked user file을 unattended execution base로 사용하지 않습니다. No-git execution을 포함해 committed baseline에서 만든 isolated managed Git checkout으로 user directory를 보존합니다. Non-Git unattended execution과 non-isolated mode의 dirty state는 거부합니다.
- Interactive mode에서는 최초의 관련 없는 dirty path 집합과 fingerprint를 변경할 수 없는 retry checkpoint로 유지합니다. Worker가 만들거나 바꾼 path를 기존 user work로 다시 분류하지 않습니다.
- Clean base를 managed checkout으로 fetch한 뒤 `aapb/<plan-or-run>-<task-or-delivery>-<slug>`를 만들거나 재사용합니다.
- 같은 task 또는 delivery group에는 plan namespace branch와 ownership marker가 있는 draft/WIP pull request 하나를 재사용합니다.
- Review된 path만 명시적으로 stage합니다. Unrelated file을 흡수하는 broad staging을 사용하지 않습니다.
- Checkout credential을 저장하지 않습니다. Controller는 delivery operation에만 credential을 얻고 완료 후 제거합니다.
- Force-push하지 않습니다. History가 diverge하면 recovery instruction과 함께 pause합니다.

## Recovery Cases

- **Expired lease:** live controller heartbeat가 없음을 확인하고 더 높은 fencing token을 획득한 뒤 append-only ledger를 replay하고 마지막 complete checkpoint부터 재개합니다.
- **Executor crash:** failed attempt를 기록하고 managed checkout의 partial file을 확인하며 아무것도 자동으로 폐기하지 않습니다. Controller가 remaining diff를 제한할 수 있을 때만 retry합니다.
- **Verification failure:** output과 log를 evidence로 보존하고 budget이 남아 있으면 task를 retryable state로 돌린 뒤, 소진되면 block합니다.
- **Remote unavailable:** local checkpoint를 남기고 remote sync pending으로 표시합니다. Remote state가 approval 또는 requirement에 필요하지 않은 경우에만 계속합니다.
- **Remote requirements changed:** eligible pre-claim drift는 unclaimed task에 import할 수 있습니다. Executor 작업 후 탐지한 drift는 `needs-reconcile`로 pause하고 verify, push, completion comment를 수행하지 않습니다.
- **Rate limit or quota:** provider retry time을 따르고 checkpoint한 뒤 이후 tick이 계속하게 합니다. Busy-wait하지 않습니다.
- **Diverged branch or changed base:** pause하고 reviewed update strategy를 요구합니다. Published history를 자동으로 다시 쓰지 않습니다.
- **Missing credential:** completed local evidence를 유지하고 task failure 대신 delivery handoff를 만듭니다.

## Completion Evidence

Controller가 모든 acceptance criterion, 정확한 verification command와 exit result, reviewed path, skipped check, residual risk, 필요한 review approval을 기록한 경우에만 task가 `completed`에 도달합니다. Run handoff에는 pending remote sync, 존재하는 경우 branch 또는 draft pull request identity, 다음 safe action도 명시합니다.
