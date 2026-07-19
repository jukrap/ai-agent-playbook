# Forge Automation Actions

이 workflow들은 job당 resumable automation tick 하나를 실행합니다. 사용하는 provider template만 복사합니다.

- GitHub: `github-automation.yml`을 `.github/workflows/aapb-automation.yml`로 복사합니다.
- Gitea: server에서 Actions가 활성화되었는지 확인한 뒤 `gitea-automation.yml`을 `.gitea/workflows/aapb-automation.yml`로 복사합니다.

## Opt In

두 workflow 모두 repository variable `AAPB_AUTOMATION_ENABLED`가 없거나 `true`가 아니면 inactive 상태입니다. Plan, permission, executor, 첫 dry run을 review할 때까지 project configuration의 `automation.killSwitch`를 활성화합니다. 두 control이 모두 실행을 허용해야 합니다.

새 hosted runner에서는 repository variable `AAPB_AUTOMATION_PLAN`을 commit된 approved `workflow.plan.v2` sidecar의 repository-relative path로 설정합니다. Workflow는 cached state를 복원한 뒤 이 변수가 비어 있지 않을 때만 `automation start`를 호출합니다. Start는 기본적으로 `<planId>-run`을 만들고 같은 ID의 기존 run을 재사용하므로 반복 job이 ledger를 교체하지 않습니다. 같은 `planId`를 유지한 채 plan 내용만 바꿔도 기존 run은 다시 쓰지 않습니다. Remote requirement 변경에는 reconcile을 사용하고, local plan 내용 변경에는 명시적으로 검토한 새 plan/run을 사용합니다.

Plan path는 step environment를 통해 전달되고 `"$AAPB_AUTOMATION_PLAN"`이라는 인용된 argument로만 확장됩니다. Repository-variable expression을 shell source에 직접 interpolate하지 않습니다. `AAPB_AUTOMATION_PLAN`이 비어 있고 복원되거나 checkout된 run directory도 없으면 재개할 run이 없으므로 tick은 안전하게 실패합니다.

Schedule은 15분마다 tick을 요청하고 각 job의 제한 시간은 35분입니다. Provider scheduling은 지연될 수 있으므로 continuation은 정확한 wall-clock 약속이 아니라 checkpoint에서 이어집니다. Task attempt와 transition은 run ledger에 기록됩니다. Local `automation supervise`는 자체 wall 및 연속 stall loop budget을 적용하지만, 독립적으로 schedule된 hosted tick만으로 durable cross-job wall/stall counter가 생기지는 않습니다. Concurrency는 repository에서 evidence-writing job 하나만 허용하며 active tick을 cancel하지 않습니다.

## Checkpoint And Recovery

Pinned `actions/cache` step은 `.ai-agent-playbook/workflows/runs`와 `~/.cache/ai-agent-playbook/checkouts` 아래의 external managed checkout을 함께 복원하고 저장합니다. Worker를 다시 실행하지 않고 commit-created/push-pending checkpoint를 재개하려면 둘 다 필요합니다. Run attempt까지 포함한 immutable key와 restore prefix를 사용하므로 이후 job이 이전 checkpoint를 복원하면서도 새 retry checkpoint를 저장할 수 있습니다. Save는 action의 post-job phase에 수행되므로 post phase를 완료한 마지막 job, 일반적으로 완료된 마지막 tick의 상태를 나타냅니다. Tick step은 실제 exit status를 유지하므로 executor, verification, Git, deadline, forge 실패가 실패한 Actions job으로 드러나며, cache post-processing은 provider의 일반 post-action lifecycle에서 계속 실행됩니다.

이 cache는 transactional state service가 아닙니다. Hard timeout, runner termination, cancellation, cache eviction, post phase 전 infrastructure failure가 발생하면 마지막으로 저장된 checkpoint 이후 변경을 잃을 수 있습니다. 따라서 다음 job은 완료된 마지막 tick부터 replay할 수 있습니다. 실행 중 tick이 durable하다고 주장하지 말고, 이전 job이 모호하게 끝났다면 retry 전에 forge와 Git effect를 inspect/reconcile합니다. 복원할 checkpoint가 없으면 `AAPB_AUTOMATION_PLAN`으로 새 run을 만들 수 있지만 잃어버린 run의 evidence나 completion state를 재구성하지는 못합니다.

## Credentials And Permissions

- GitHub는 workflow-provided `GITHUB_TOKEN`을 `GH_TOKEN`으로 전달합니다. Workflow는 `deliver` profile에 필요한 `contents`, `issues`, `pull-requests` write access만 요청합니다. Observe 또는 coordinate-only workflow에서는 permission을 줄입니다.
- Gitea는 `AAPB_FORGE_TOKEN`이라는 repository secret을 요구하고 이를 `GITEA_TOKEN`으로 전달합니다. Selected profile에 필요한 repository content, issue, pull-request access만 부여합니다.
- 두 workflow 모두 checkout credential을 저장하지 않습니다. Workflow YAML, project configuration, repository variable, issue text, log에 token value를 넣지 않습니다.
- Project, View, Discussion, server-specific API는 계속 capability-gated입니다. Scope가 없으면 전체 local run을 실패시키지 말고 documented fallback을 선택합니다.

## Runtime

Template은 `npx`로 정확한 `ai-agent-playbook` release를 호출하고 package install script를 비활성화합니다. Release pin은 package metadata와 일치하며 start와 tick 모두에 적용됩니다. Schedule apply는 내용이 다른 기존 file을 보존하므로 이미 복사한 workflow를 업그레이드할 때 두 pin을 명시적으로 검토하고 갱신합니다. Runner가 package registry에 접근할 수 없으면 pinned CLI를 runner image 또는 repository에 설치하고 해당 line을 동등한 local `aapb automation start`와 `aapb automation tick` command로 교체합니다.

Runner에는 Node.js 18 이상과 Git이 필요합니다. 또한 설정한 executor가 설치·인증되어 있고 non-interactive로 동작해야 합니다. 선택한 Codex 또는 Claude CLI를 runner image에 설치하거나 해당 환경에서 argv를 실행할 수 있는 명시적 `command` adapter를 설정합니다. Hosted Codex는 일반적으로 `OPENAI_API_KEY`가 필요하고, hosted Claude는 `ANTHROPIC_API_KEY` 또는 `ANTHROPIC_AUTH_TOKEN`이 필요하며 `--bare`로 실행됩니다. 이 model secret은 forge permission과 별도 범위로 관리합니다. Forge token은 executor/model credential이 아닙니다. 같은 runner image에서 `aapb automation doctor .`를 실행하고 executor selection이 모호함 없이 성공하기 전에는 repository variable을 활성화하지 않습니다. Gitea runner에는 Actions-compatible checkout implementation과 configured package source에 대한 network access도 필요합니다. `actions/cache` checkpoint가 동작하려면 runner cache service도 활성화·설정되어 있고 접근 가능해야 합니다. Actions 실행 지원만으로 run state가 persistent해지지는 않습니다. Unattended continuation에 의존하기 전에 ledger와 managed checkout의 save/restore cycle을 함께 검증합니다. Cache를 사용할 수 없으면 fresh runner를 resumable하다고 간주하지 말고 review된 persistent storage 또는 local supervisor를 사용합니다.

Gitea server가 repository variable, schedule, concurrency group을 지원하지 않더라도 opt-in 또는 concurrency safety boundary를 제거하지 않습니다. Server가 required capability를 광고할 때까지 local supervisor 또는 OS scheduler를 사용합니다.

Template update를 application code처럼 review합니다. External action은 full commit SHA로 고정된 상태를 유지해야 합니다.
