# Forge Automation Runbook

Resumable automation run을 시작, monitor, pause, recover, stop할 때 이 runbook을 사용합니다. GitHub 또는 Gitea는 coordination layer이며, local append-only ledger가 execution evidence의 source of truth입니다.

## Safety Defaults

- Example configuration은 `deliver` profile을 사용하지만 `automation.killSwitch`가 활성화된 상태로 시작합니다.
- Approved plan task와 `status:ready` label이 있는 기존 issue만 queue에 들어갈 수 있습니다. `aapb:ready`는 0.5.4 repository용 read-only compatibility alias입니다.
- Merge, release, delete, force-push, protected-branch write에는 항상 explicit approval이 필요합니다.
- Unattended work는 managed isolated checkout과 `aapb/` branch를 사용합니다. 사용자의 checkout을 switch하거나 clean하지 않습니다.
- `--no-remote`는 forge API와 remote Git delivery를 비활성화하지만 local execution은 유지합니다.
- `--offline`은 모든 network operation을 비활성화하고, harness가 process-level network isolation을 강제할 수 없으므로 `automation tick`/`supervise`를 executor 시작 전에 fail-closed합니다. Agent network를 사용할 수 있는 local execution에는 `--no-remote`를 사용합니다.
- Forge credential은 platform secret store 또는 승인된 controller credential source에만 두고 configuration, plan, issue, ledger, evidence, log에는 넣지 않습니다. Model credential은 selected executor adapter에만 전달합니다.

## Configure

`integrations/forge.example.json`의 section을 `.ai-agent-playbook/config.json`에 merge합니다. Preflight, plan review, scheduler review가 완료될 때까지 `automation.killSwitch`를 활성화합니다.

JSON file에 token value를 추가하지 않습니다. 제공되는 workflow template은 다음 credential source를 사용합니다.

- GitHub: workflow가 제공하는 `GITHUB_TOKEN`을 controller에 `GH_TOKEN`으로 전달합니다.
- Gitea: `AAPB_FORGE_TOKEN`이라는 repository secret을 controller에 `GITEA_TOKEN`으로 전달합니다.

Custom port 또는 subpath의 self-hosted Gitea에는 `forge.provider`를 `gitea`로 설정하거나 `/api/v1`으로 끝나는 credential-free `forge.apiBaseUrl`을 구성합니다. Hostname은 configured Git remote hostname과 같아야 하며 cross-host API base는 credential 선택 전에 거부합니다. Controller는 `GITEA_TOKEN`을 authentication과 repository-permission 확인에 사용하기 전에 token 없이 version과 OpenAPI를 probe합니다.

Selected profile을 지원하는 가장 좁은 repository scope를 사용합니다. Project 또는 Discussion access가 없으면 capability를 축소해야 하며 token을 넓혀서는 안 됩니다.

## Preflight

먼저 read-only check를 실행합니다.

```text
aapb forge status . --json
aapb automation doctor . --json
aapb plan validate . --plan <plan-file> --json
```

Selected remote와 provider, server/API version, token material이 없는 authentication status, repository permission, probe evidence, effective capability, `policyWrites`와 `verifiedWrites`, deny override, unattended checkout isolation, executor selection, verification command, scheduler prerequisite, remaining budget을 확인합니다.

Executor readiness는 credential-aware입니다. Codex는 disposable `CODEX_HOME`으로 복사한 `auth.json` 또는 `OPENAI_API_KEY`를 사용할 수 있습니다. Claude unattended execution은 `ANTHROPIC_API_KEY` 또는 `ANTHROPIC_AUTH_TOKEN`이 필요하고 `--bare`, edit-only tool, Bash disabled 상태로 실행됩니다. Subscription/keychain-only Claude login은 worker가 의도적으로 상속하지 않습니다. Command executor는 사용자 HOME/config tree를 받지 않습니다. Projected model credential exact value는 evidence에서 redaction하고 delivery 전 changed file에서 scan합니다.

Doctor는 effective policy가 Git을 요구할 때만 Git `2.39.0` 미만을 conflict로 봅니다. GitHub read path가 탐지되고 설치된 `gh`가 `2.80.0` 미만이면 conflict이며, 설치된 Gitea `tea`가 `0.14.2` 미만이면 documented REST를 사용할 수 있으므로 warning입니다. `projectMode`가 `preferred`인데 GitHub Projects scope가 없으면 첫 coordination write 전에 중단하고 `gh auth refresh -s project`, `aapb forge status .` 순서로 안내합니다. Harness가 browser 인증 갱신을 자동 실행하지 않습니다. Projects를 사용하지 않기로 결정했다면 `--allow-capability-fallback projects,views` 또는 영구 milestone fallback 설정을 사용합니다.

Dirty user checkout은 configured mode가 `isolated-checkout`일 때만 unattended work에 안전합니다. Controller는 `--no-git`을 포함해 committed baseline에서 만든 분리된 managed Git checkout을 사용하며, user checkout을 clean하거나 switch하거나 dirty/untracked file을 base로 사용하면 안 됩니다. Non-Git unattended execution은 거부하므로 interactive로 실행하거나 먼저 committed Git baseline을 만듭니다. Interactive mode는 task-owned path의 기존 변경을 거부하고 관련 없는 dirty/staged path를 fingerprint해 그대로인 경우에만 controller-owned path만 commit합니다. 최초 path 집합과 fingerprint는 재시도에서도 고정하며, 차이가 생기면 새로운 baseline으로 받아들이지 않고 operator reconciliation을 요구합니다. Doctor의 scheduler mode status는 executable availability 또는 provider/repository compatibility만 확인하므로 schedule 등록, Actions 활성화, runner 상태, credential, 실제 remote access는 별도로 검증합니다.

Provider가 없거나 불확실하면 run을 local로 유지하거나 write를 허용하기 전에 provider를 명시적으로 설정합니다. 추측한 self-hosted API를 사용하지 않습니다.

## Preview Remote Bootstrap

Bootstrap은 idempotent하고 preview-first입니다.

```text
aapb forge bootstrap . --json
aapb forge bootstrap . --apply --json
```

적용 전에 planned label, milestone, project field, view, fallback을 모두 review합니다. Operation은 누락된 managed asset을 만들 수 있지만 기존 asset을 rename, overwrite, delete하면 안 됩니다.

Structured plan은 세밀한 execution task를 local에 유지하고 roadmap issue 하나와 review 가능한 delivery-group issue를 발행합니다. 기본 child group 상한은 여섯 개입니다. 한국어 public title은 명시적인 명사형이어야 하며 preview는 `한다`, `된다`, `이다` 같은 문장형 종결을 차단합니다. 상태·우선순위·위험도·단계·진행률과 View는 Projects가, release 진척은 milestone이 담당하고 label은 최소한의 검색·실행 승인 용도로 제한합니다.

UI 검증 명령에는 화면 이미지나 영상을 만드는 프로젝트 상대 경로 `evidencePaths`를 추가합니다. 증거는 controller 작업공간 안에 실제로 존재하고 미디어 형식 표식이 유효해야 합니다. 수용 기준에 적은 PNG 크기는 반드시 모두 충족해야 하며 review 승인만으로 UI 증거 누락을 건너뛸 수 없습니다.

Sidecar에서 `forge sync`를 apply하려면 structurally complete approved plan이 필요합니다. Plan-only retry는 누락된 marker-owned child issue를 만들고, 기존 issue는 title과 구성한 body가 approved plan과 정확히 일치할 때만 재사용합니다. 불일치하면 `forge.issue.reconcile-required`를 반환하며 update에는 명시적으로 검토한 `updatedAt` snapshot과 CAS 통과가 필요합니다.

GitHub에서는 capability와 scope가 있을 때만 Projects, Views, sub-issue, Discussions를 사용합니다. Gitea에서는 public pull-request API와 documented `WIP:` title convention으로 draft review를 표현하고, project view를 label과 milestone filter로 대체하며, native parent link 대신 managed metadata로 묶은 독립 child issue를 사용하고 Discussions는 decision issue로 fallback합니다.

## Approved Run 시작

`automation start`는 local schema v2 run을 쓰며 `--apply` preview gate가 없습니다. Task order, criterion, budget, planned artifact, forge preview를 검토한 뒤 project configuration의 `automation.killSwitch`를 해제하고 start mode 하나를 선택합니다.

Forge 또는 remote Git effect가 없는 local-only run을 만듭니다.

```text
aapb automation start . --plan <plan-file> --no-remote --json
```

또는 effective profile이 허용하는 coordination과 delivery를 포함해 approved run을 시작합니다.

```text
aapb automation start . --plan <plan-file> --json
```

새 run에는 start command 하나만 선택합니다. Local-only run에 나중에 remote coordination이 필요하면 중복 run을 시작하지 말고 해당 run의 `forge sync`를 preview하고 apply합니다.

Remote read가 허용되면 새 run 생성 또는 non-terminal run 재사용 때 eligible existing issue를 찾습니다. Configured ready label이 있는 open non-pull-request issue를 대상으로 하고 closed 또는 paused issue는 제외하며, 새 queue task는 run lease 아래 멱등 추가합니다. 이 task는 같은 ID의 approved local task를 덮어쓰지 않습니다. 모든 remote text와 criterion은 untrusted data로 취급하고 issue의 verification command나 path를 채택하지 않습니다. Approved local task mapping이 없는 issue는 reviewed path와 verification argv를 명시적으로 승인한 새 plan/run으로 제공할 때까지 `local-execution-mapping-required`에서 멈춥니다. `--no-remote`와 `--offline`은 탐색을 건너뜁니다.

Task iteration 하나를 interactive하게 실행합니다.

```text
aapb automation tick . --no-interactive --json
```

Host가 계속 사용 가능하고 기본 8시간 wall budget이 허용될 때만 supervisor를 사용합니다.

```text
aapb automation supervise . --no-interactive --json
```

Executor가 아니라 controller가 declared verification을 다시 실행하고 task를 review 또는 completion으로 진행할지 결정합니다.

## Schedule

등록 전에 scheduler operation을 preview합니다.

```text
aapb automation schedule . --platform <scheduler-platform> --json
aapb automation schedule . --platform <scheduler-platform> --apply --json
```

Local scheduling에는 `windows-task` 또는 `systemd-user`를 사용하고 hosted scheduling에는 `github-actions` 또는 `gitea-actions`를 사용합니다. Generated definition은 적용 전에 review합니다. Copy 가능한 hosted workflow는 `integrations/actions/`에도 있습니다.

두 hosted template 모두 repository variable `AAPB_AUTOMATION_ENABLED`가 없거나 `true`가 아니면 inactive 상태입니다. Project kill switch가 해제되고 token permission이 review된 뒤에만 활성화합니다. 각 job은 tick 하나를 실행하고 repository concurrency group을 사용하며 in-progress tick을 cancel하지 않습니다.

Fresh runner에서는 `AAPB_AUTOMATION_PLAN`을 commit된 approved sidecar의 repository-relative path로 설정합니다. Workflow는 cached run을 복원하고 plan path를 인용된 environment expansion `"$AAPB_AUTOMATION_PLAN"`으로 멱등적인 `automation start`에 전달한 뒤 tick을 실행합니다. Variable과 restored/checked-out run이 모두 없으면 임의의 작업을 만들지 않고 tick이 실패합니다. Pinned cache는 run ledger와 external managed checkout을 함께 저장하지만 완료된 마지막 tick checkpoint일 뿐입니다. Hard timeout 또는 runner/cache loss가 있으면 이전 saved state부터 replay하고 reconcile해야 할 수 있습니다. Runner에는 configured Codex, Claude 또는 command executor가 설치·인증되어 있고 `automation doctor`로 검증되어야 하며 forge token은 executor credential이 아닙니다. Gitea runner에는 정상 동작하는 cache service가 필요하므로 unattended 사용 전에 두 path의 save/restore cycle을 검증합니다.

Local schedule은 globally discoverable `aapb`를 가정하지 않고 현재 CLI entrypoint를 내장합니다. Hosted definition은 자연어 remote deny를 포함한 effective `--no-remote`, `--remote-read-only`, `--no-git` 제한을 start와 tick command에 유지하고, local definition은 tick command에 유지합니다. Offline tick은 executor 시작 전에 의도적으로 실패하므로 `--offline --apply` schedule을 거부하고, output을 안전하게 deliver할 수 없으므로 hosted `--no-git --apply`도 거부합니다.

## Monitor And Control

```text
aapb automation status . --json
aapb automation pause . --run-id <run-id> --reason <reason>
aapb automation resume . --run-id <run-id>
aapb automation stop . --run-id <run-id> --reason <reason>
```

Temporary policy, quota, requirement, verification 문제에는 pause를 사용합니다. Pause/stop request는 다른 controller가 lease를 소유한 동안에도 durable하게 남고 active tick이 polling하여 process tree를 종료한 뒤 adapter shutdown을 확인하고 lease를 놓습니다. 새로운 start decision 없이 계속하면 안 되는 경우에만 stop을 사용합니다.

Linked issue는 forge inspection이 성공할 때 tick이 claim 전, long executor 작업 중 rate-bounded interval, delivery 전에 remote state를 inspect합니다. Configured pause label, ready label 제거, issue close는 task 또는 run을 pause합니다. Claim 전 requirement drift는 아직 claim되지 않은 task에 import할 수 있습니다. Active drift는 verification, push, completion comment 전에 `paused:needs-reconcile`을 만들어야 합니다. Remote를 사용할 수 없으면 guard가 이러한 변경을 확인할 수 없으므로 local policy가 approval 또는 requirement에 remote state를 요구하지 않을 때만 계속합니다.

## Reconcile And Recover

Legacy task별 issue 화면을 통합하려면 reviewed plan으로 survivor, close, unlink, marker-comment operation을 먼저 preview합니다.

```text
aapb forge reconcile . --plan <plan-file> --json
aapb forge reconcile . --plan <plan-file> --apply --allow-supersede --json
```

기존 지원 이슈나 draft PR의 검토된 마이그레이션은 `coordination.reconcile.supportingIssues` 또는 `coordination.reconcile.pullRequests`에 정확한 번호와 충분한 공개 내용을 선언합니다. Preview에서 예상 제목, 본문 완성도, 산출물 수, 최신 CAS snapshot을 확인해야 합니다. 검토 이후 원격 제목, draft 상태, head/base, `updatedAt`이 바뀌었다면 apply하지 않습니다.

우선 사용하는 GitHub Projects가 인증 때문에 막히면 사용자가 직접 `gh auth refresh -s project`를 실행한 뒤 `aapb forge status .`로 다시 확인합니다. 하네스는 scope를 자동 확대하지 않습니다. Milestone fallback을 명시적으로 선택한 경우에만 `--allow-capability-fallback projects,views`를 사용합니다.

두 번째 명령은 두 flag를 모두 요구하며 issue history를 보존하고 issue나 label을 삭제하지 않습니다. Apply 전에 preview를 검토합니다.

Reviewed local-task와 remote-issue JSON snapshot을 export 또는 저장한 뒤 changed remote requirement를 수용하기 전에 비교합니다.

```text
aapb forge reconcile . --local-task <local-task.json> --remote-issue <remote-issue.json> --json
```

`--apply`가 없으면 `forge reconcile`은 read-only입니다. Preview를 review한 뒤 eligible pre-claim import 또는 즉시 필요한 reconciliation pause를 schema v2 ledger에 기록할 수 있습니다.

```text
aapb forge reconcile . --local-task <local-task.json> --remote-issue <remote-issue.json> --run-id <run-id> --apply --json
```

Apply는 run을 조용히 approve하거나 resume하지 않습니다. Tick이 이미 run을 pause했다면 ledger와 comparison을 확인한 뒤 명시적으로 `automation resume`할지 결정하고, reconcile output 자체를 approval로 사용하지 않습니다.

Recovery rule:

- Expired lease: live heartbeat가 없음을 확인하고 더 높은 fencing token을 획득한 뒤 ledger를 replay하고 마지막 complete checkpoint부터 재개합니다.
- Executor crash: partial file과 failed-attempt evidence를 보존합니다. Remaining diff가 제한된 뒤에만 retry합니다.
- Verification failure: result를 보존하고 budget 안에서 retry한 뒤, completion을 주장하지 말고 block합니다.
- Attempt budget 소진: `automation resume --reset-attempts`를 사용하기 전에 failure evidence를 확인합니다. Budget 사용량만 reset하고 기존 append-only run에서 다음 단조 증가 attempt serial로 계속합니다.
- Remote outage 또는 missing credential: remote state가 approval prerequisite가 아니면 local checkpoint를 남기고 delivery를 pending으로 둡니다.
- Rate limit: provider retry time을 따르고 이후 tick이 계속하게 합니다. Busy-wait하지 않습니다.
- Diverged branch: pause하고 reviewed update strategy를 요청합니다. Force-push하지 않습니다.

Recovery 후에는 meaningful transition만 synchronize합니다.

```text
aapb forge sync . --run-id <run-id> --json
aapb forge sync . --run-id <run-id> --apply --json
```

## Completion Check

Completion을 보고하기 전에 다음을 확인합니다.

- completed-task와 passed-criterion percentage가 recorded evidence에서 파생됩니다.
- Declared verification command를 controller가 모두 다시 실행했습니다.
- Skipped check와 residual risk가 handoff에 있습니다.
- Evidence 또는 remote comment에 secret-shaped value가 없습니다.
- 사용자의 checkout과 unrelated change가 그대로 보존됩니다.
- Pending remote synchronization이 명시되어 있습니다.
- 별도 승인이 없으면 draft pull request가 merge되지 않은 상태입니다.
