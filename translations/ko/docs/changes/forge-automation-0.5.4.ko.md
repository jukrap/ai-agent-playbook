# AI Agent Playbook 0.5.4 Forge 자동화

이 변경 기록은 0.5.4 forge 협업 및 재개 가능한 실행 기능의 공개 운영·유지보수 계약을 정리합니다. 실제 GitHub 또는 Gitea 원격 쓰기 스모크 테스트를 실행했다는 근거는 아닙니다.

## 사용자가 체감하는 변화

- 승인된 자동화 계획을 재개 가능한 실행으로 전환하며, append-only 원장과 파생 상태가 controller 재시작 뒤에도 유지됩니다.
- GitHub 또는 Gitea는 큐 상태, milestone, 검토, draft pull request, CI를 공유하는 협업 계층으로 동작하고, 로컬 원장은 실행 사실과 근거의 기준으로 남습니다.
- controller는 tick마다 준비된 작업 하나를 진행하고, 프로젝트 검증 명령을 직접 다시 실행한 뒤 다음 tick 전에 checkpoint를 기록합니다.
- 각 child issue 또는 delivery group은 plan namespace가 포함된 `aapb/<plan>-<id>-<slug>` 브랜치와 ownership marker가 있는 review request 하나를 재사용합니다. GitHub는 native draft flag를 사용하고 Gitea는 public pull-request API와 documented `WIP:` title convention을 사용합니다. controller는 매 tick마다 새 댓글을 남기지 않고 상태 전환, blocker, 복구, 최종 검증 때 하나의 marker comment만 갱신합니다.
- 대화형 작업은 현재 checkout에서 `aapb/` 작업 브랜치를 사용합니다. task-owned path의 기존 변경은 거부하고, 관련 없는 dirty/staged path는 fingerprint가 그대로일 때 controller commit에서 제외해 보존합니다. 최초 path 집합과 fingerprint를 재시도에서도 trust anchor로 유지하므로 worker 변경을 새로운 user baseline으로 받아들이지 않습니다. `--no-git`을 포함한 무인 작업은 committed Git baseline에서 clone한 managed checkout을 사용합니다. Dirty file, untracked secret, out-of-tree symlink를 worker base로 복사하지 않도록 non-Git unattended execution은 거부합니다.
- Remote read가 허용되면 새 run과 재사용하는 non-terminal run 모두 configured ready label이 있는 open non-pull-request issue를 멱등 추가할 수 있습니다. Closed 또는 paused issue는 제외하고 ID가 충돌하면 approved local task를 유지하며, remote command나 path를 trusted execution instruction으로 채택하지 않습니다.
- 연결된 기존 issue에는 관리 상태 label만 변경합니다. 명시적인 reconcile 승인이 있기 전에는 title, body, acceptance text, pause label, 사용자 관리 label을 보존합니다.

## 권한과 안전 모델

권한 profile은 `off`, `observe`, `coordinate`, `deliver`, `release`입니다. 기본 `deliver` profile은 issue와 project 메타데이터를 조정하고 작업 브랜치, 명시적 commit, push, draft pull request를 만들 수 있습니다. merge, release, delete, force-push, protected branch 변경은 계속 승인이 필요하며, `release` profile도 delete나 force-push를 자동화하지 않습니다.

원격 및 scheduler 변경은 먼저 미리보기를 만듭니다. 부트스트랩 계획, workflow 파일, 운영체제 schedule 등록을 쓰려면 apply flag가 필요하고 inline mutation boolean의 `false`는 truthy text가 아니라 false로 해석합니다. Hosted schedule은 effective deny를 start와 tick command에, local schedule은 tick command에 유지합니다. Offline apply와 hosted `--no-git` apply는 안전하게 execute/deliver할 수 없어 거부합니다. 현재 요청의 금지 지시는 설정된 권한을 좁힐 수 있지만 확대할 수 없습니다.

`forge sync --plan ... --apply`는 forge inspection 전에 structurally complete approved sidecar를 요구합니다. Plan-only retry는 누락된 marker-owned issue를 만들고, 기존 issue는 title과 구성한 body가 approved plan과 정확히 일치할 때만 재사용합니다. 불일치하면 `forge.issue.reconcile-required`를 반환하며 title, body, acceptance, status update에는 reviewed `updatedAt` snapshot과 CAS가 필요합니다. MCP forge preview는 target을 요구하고 gated apply tool과 같은 detected provider, effective capability, configured language를 사용합니다.

worker는 임시 격리 HOME/config tree에서 실행하며 forge token, 사용자 Git configuration, credential helper 접근, push URL, SSH-agent variable, 대화형 Git 인증을 받지 않습니다. Codex adapter는 model auth file의 임시 복사본 또는 `OPENAI_API_KEY`만 전달하고, Claude adapter는 OAuth/keychain 상태나 Bash 대신 명시적인 Anthropic model credential, `--bare`, edit-only tool을 사용합니다. Projected credential exact value는 executor/verification evidence에서 redaction하고 staging 전 changed-file byte scan으로 차단합니다. controller는 effective local/worktree Git config를 검사하고 고정된 비개인 per-command identity와 path-only commit으로 전달합니다.

## Provider 기능 대체 동작

- GitHub는 공통 Issues, Labels, Milestones, pull request, Actions 기능을 지원합니다. Projects와 Views는 API와 현재 token에 필요한 project scope가 있을 때만 활성화합니다. project scope가 없으면 인증을 갱신하지 않고 제한을 보고하며, 지원 가능한 Issues와 Milestones 동작은 유지합니다.
- Forge status는 configured `policyWrites`와 `verifiedWrites`를 구분합니다. Authentication과 repository write permission을 검증할 때까지 effective remote write를 비활성화하며, status record에는 token material 없이 server/API version과 probe evidence를 기록합니다.
- `gh agent-task`는 명시적으로 선택하는 preview 어댑터로 격리합니다. 자동 executor 선택에는 포함하지 않습니다.
- Gitea는 server OpenAPI에 필요한 method가 있는 공통 core operation만 사용합니다. Version과 OpenAPI inspection은 무인증으로 먼저 수행하고 그 뒤에 token을 사용하는 authentication과 repository-permission 확인을 진행합니다. Draft review는 public pull-request API와 Gitea의 documented `WIP:` title convention을 사용합니다. 안정적인 Project 또는 View API가 없으면 상태 라벨과 milestone 필터가 큐와 보드 조회를 대신합니다. Discussions는 `decision` issue로 대체합니다.
- 알 수 없거나 hostname 단서만 있는 자체 호스팅 provider에는 쓰기를 허용하지 않습니다. 운영자는 버전과 기능 점검 전에 `forge.provider: "gitea"` 또는 credential-free `forge.apiBaseUrl`을 설정해야 합니다. API base hostname은 configured Git remote hostname과 같아야 하며, 프로젝트가 지정한 cross-host URL은 token-bearing request 전에 거부합니다.
- 사용할 수 있는 remote가 없거나 `--no-remote`/`--offline`으로 접근을 금지하면 controller는 forge transport를 호출하지 않고 로컬에서 계속합니다. 인증 또는 write permission이 없으면 mutation은 비활성화하지만 anonymous capability probe나 remote read는 허용될 수 있습니다.

지원 및 연동 기준은 [README 호환성 표](../../README.ko.md#forge-자동화-호환성)에 있습니다. 기준 버전은 의도한 계약을 뜻하며 일회용 저장소 스모크 테스트를 대체하지 않습니다.

## 업그레이드와 데이터 호환성

- 새 실행은 실행 원장 schema v2를 사용합니다. schema v1은 계속 읽을 수 있으며 호환 읽기 중 덮어쓰지 않습니다.
- 기존 `run status` 명령은 공통 store를 통해 v2 디렉터리를 인식합니다. 기존 `run record`와 `run summarize`는 0.5.4에서 legacy directory용 schema-v1 writer로 유지되고 v2 원장에는 접근하지 못합니다. 전체 writer 통합은 조용한 rewrite가 아니라 단계적 compatibility migration입니다.
- Run initialization은 완성된 store를 atomic directory rename으로 publish합니다. Empty 또는 matching manifest-only interrupted initialization은 quarantine 후 복구하고 unknown partial content는 operator review를 위해 보존합니다. 같은 run ID 재사용은 approved-plan fingerprint가 같아야 하며 plan이 바뀌면 in-place reconcile이 아니라 명시적으로 review한 새 plan/run ID가 필요합니다.
- 구조화 자동화 계획은 사람이 읽는 Markdown과 `workflow.plan.v2` JSON sidecar를 함께 둡니다. sidecar에는 안정적인 task ID, 의존성, 위험도, 수용 기준, 검증 명령, delivery group, 원격 실행 가능 여부를 기록합니다.
- 설정에 `automation`, `forge`, `git`, `executor` 섹션을 추가합니다. 기존 설정 우선순위를 유지하고, 현재 요청의 금지 지시를 마지막에 적용합니다.
- `bootstrap --local-only`는 기존 의미를 유지합니다. 프로젝트 playbook 파일은 Git에서 제외됩니다. 업그레이드만으로 기존 로컬 playbook을 업로드하거나 원격 schedule을 활성화하지 않습니다.

파괴적인 데이터 마이그레이션은 필요하지 않습니다. 새 연동을 끄거나 사용할 수 없을 때는 기존 로컬 전용 동작이 대체 경로로 남습니다.

## 일시 정지, 복구, 비활성화

- Pause/stop request는 run lease와 독립적으로 기록되고 active controller가 polling합니다. Controller는 process tree를 취소하고 adapter 종료 확인 전에는 lease를 놓지 않습니다. Absolute tick deadline은 executor, verification, Git, forge request/retry, supervisor wall budget 전체에 적용됩니다.
- Linked issue는 forge inspection이 성공할 때 claim 전, long execution 중 rate-bounded poll, delivery 전에 pause/approval state와 requirement drift를 확인합니다. Pre-claim drift는 unclaimed task에 import할 수 있고 active drift는 verification이나 delivery 전에 reconcile을 위해 pause합니다. Remote를 사용할 수 없으면 이 guard가 동작하지 않으므로 local policy가 계속 실행하는 데 remote state가 필요한지 결정합니다.
- `forge reconcile`은 `--apply`가 없으면 preview-only입니다. Apply는 eligible pre-claim import 또는 reconciliation pause를 schema v2 ledger에 기록할 수 있지만 run을 approve하거나 resume하지 않습니다.
- 중단된 controller는 원장과 lease 상태에서 재개합니다. 만료된 lease는 더 높은 fencing token으로 다시 획득할 수 있고, 오래된 controller는 유효한 event를 계속 쓸 수 없습니다. UUID-scoped Lamport contender가 lease-file operation을 직렬화하며 stale recovery 중 foreign 또는 successor lock을 삭제하지 않습니다.
- 완료되지 않은 start coordination은 `remote.mode=pending`으로 남고 반복 start가 bootstrap/sync와 issue link checkpoint를 재시도합니다.
- 성공한 Git delivery는 forge sync 전에 영속화합니다. commit 또는 push 뒤 controller가 중단되면 다음 tick이 worker를 다시 실행하거나 commit을 추가하지 않고 해당 delivery checkpoint에서 sync와 완료 처리를 재시도합니다. 실패한 attempt는 재시도 전에 임시 criterion evidence를 지우므로 시도 횟수가 진행률을 부풀리지 않습니다.
- Local-only delivery checkpoint는 workspace와 존재하는 경우 branch를 `handoff.md`에 기록합니다. No-git output은 운영자가 검토하고 통합하거나 내보낼 때까지 residual risk로 남습니다.
- Approved local task mapping이 없는 ready issue는 untrusted queue data로만 기록되고 `local-execution-mapping-required`에서 멈춥니다. 실행 전에 운영자가 owned path와 verification argv를 명시적으로 approved한 새 plan/run에서 검토해야 합니다.
- 한 번의 호출에서 원격 협업을 멈추려면 해당 deny flag를 사용합니다. 계속 끄려면 `off` profile을 선택하거나 설정의 kill switch를 켭니다. 로컬 원장과 근거는 계속 조회할 수 있습니다.

롤백은 automation profile 또는 schedule을 끄고 0.5.4 패키지 변경을 되돌리는 방식입니다. 이미 만든 원격 issue, branch, pull request, comment, workflow run은 삭제하지 않으므로 외부 효과는 운영자가 명시적으로 검토해야 합니다.

## 검증 경계

저장소 검증, provider contract fake, 로컬 scheduler 미리보기는 원격 부작용 없이 구현 동작을 확인할 수 있습니다. GitHub 또는 Gitea 쓰기 경로는 필요한 권한을 가진 일회용 저장소에서 실행했을 때만 원격 검증으로 간주합니다. 그런 환경이 없으면 릴리스 근거에 원격 쓰기 스모크 테스트를 수행하지 않았다고 밝혀야 합니다.
