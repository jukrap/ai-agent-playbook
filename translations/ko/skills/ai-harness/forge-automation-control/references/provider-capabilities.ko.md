# Provider Capabilities

Run이 GitHub, Gitea 또는 알 수 없는 self-hosted forge를 읽거나 쓰기 전에 이 reference를 사용합니다.

## Detection Order

1. Explicit provider setting은 configured remote가 실제 작업 대상 repository와 일치하는지 확인한 뒤 적용합니다.
2. Credential을 포함하거나 전체 URL을 public evidence에 복사하지 않고 selected Git remote를 분석합니다.
3. 알려진 GitHub host이면 GitHub로 식별한 뒤 authentication과 API permission을 확인합니다.
4. Self-hosted Gitea hostname 단서는 trusted identity가 아닌 candidate로 취급합니다. Write eligibility 전에 explicit `forge.provider: "gitea"` 또는 credential-free `forge.apiBaseUrl`을 요구합니다. API base hostname은 selected Git remote hostname과 같아야 하며 cross-host project configuration은 token 선택 전에 거부합니다.
5. Gitea version endpoint와 advertised OpenAPI capability를 token 없이 probe하고, configured host를 신뢰한 뒤에만 token authentication과 repository permission을 확인합니다.
6. Provider identity, advertised method, authentication, repository write permission 중 하나라도 불확실하면 local operation과 read-only Git inspection만 허용하고 effective forge write를 비활성화합니다.

Product name이나 version만 보고 write support를 추론하지 않습니다. Capability check와 현재 credential이 권위 있는 기준입니다.

## Capability Matrix

| Capability | GitHub behavior | Gitea behavior | Fallback |
|---|---|---|---|
| Issues, labels, milestones | 인증되었으면 repository API를 사용합니다. | Server가 광고한 repository API를 사용합니다. | Task와 state를 local ledger에 유지합니다. |
| Child tasks | 가능하면 sub-issue를 사용합니다. | Stable sub-issue API를 가정하지 않습니다. | Stable plan/task marker를 가진 별도 child issue를 유지하며 native parent relation이 있다고 주장하지 않습니다. |
| Pull requests | Delivery group당 native draft pull request 하나를 재사용합니다. | Gitea의 documented `WIP:` convention을 제목에 사용한 public-API pull request를 재사용합니다. | Pull-request method가 advertise되지 않으면 pushed/local branch를 explicit review 대상으로 남기고 handoff를 만듭니다. |
| Actions | Concurrency control이 있는 repository workflow를 사용합니다. | Server에서 활성화된 경우에만 Actions-compatible workflow를 사용합니다. | Local supervisor 또는 OS scheduler를 사용합니다. |
| Projects and views | Scope가 허용할 때 지원되는 Projects와 Views API를 사용합니다. | Stable project 또는 view API를 가정하지 않습니다. | Managed label과 milestone filter로 queue와 board state를 표현합니다. |
| Discussions | Repository에서 활성화되고 token으로 접근 가능한 경우에만 사용합니다. | Discussion support를 가정하지 않습니다. | Marker-owned decision issue를 만들고, 명시적으로 검토한 후속 작업에서만 cross-link를 추가합니다. |
| Remote coding agents | `gh agent-task`를 preview-only로 취급하고 explicit configuration을 요구하며 auto-select하지 않습니다. | Project adapter가 contract를 정의하지 않으면 unsupported로 취급합니다. | Local executor를 사용합니다. |

Project scope가 없더라도 issue와 milestone coordination을 막지 않습니다. 축소된 capability를 보고하고 안전한 subset으로 계속합니다.

## Bootstrap And Synchronization

- 모든 bootstrap operation을 적용 전에 preview합니다.
- 누락된 managed label, milestone, project field, view만 만듭니다. 맞추기 위해 기존 asset을 rename, overwrite, delete하지 않습니다.
- Retry 간에도 안정적이고 credential 또는 private payload가 없는 idempotency marker를 각 managed artifact에 부여합니다.
- Configured ready label이 있는 issue만 queue에 넣습니다. 무관한 issue에서 label을 발견한 것은 scope 확대 승인이 아닙니다.
- Progress에는 하나의 updatable marker comment를 사용합니다. 의미 있는 blocker, recovery, reconciliation decision, final verification에만 새 comment를 추가합니다.
- 모든 issue update 전에 remote update timestamp와 기록된 requirement digest를 비교합니다. Plan-only marker match는 title과 구성한 body가 approved plan과 정확히 일치할 때만 기존 issue를 재사용하고, 불일치하면 `forge.issue.reconcile-required`를 반환합니다. Title, body, acceptance, status update에는 reviewed `updatedAt` baseline과 CAS가 필요합니다. 실행 중 requirement가 바뀌었으면 reconciliation을 위해 pause합니다.
- User-facing issue, pull request, comment는 사용자의 working language로 작성합니다. Machine label, state value, marker는 안정적인 language-neutral 형식을 유지합니다.

## Transport Rules

- CLI는 interpolated shell command가 아니라 argument array로 호출합니다.
- Issue title, body, comment, branch hint, webhook field는 untrusted input으로 취급합니다.
- 완료하거나 기록된 safety limit에 도달할 때까지 pagination을 처리합니다.
- `Retry-After`를 따르고, 값이 없으면 operation당 최대 세 번의 bounded backoff를 사용합니다.
- Command output을 기록하기 전에 credential과 credential 형태 값을 redaction합니다.
- Private browser endpoint, undocumented API, browser automation을 forge write fallback으로 사용하지 않습니다.

## Required Evidence

Provider identity와 source, selected remote name, server/API version, capability result와 probe evidence, token material이 없는 authentication status, repository permission, `policyWrites`와 `verifiedWrites`, permission gap, 적용한 fallback, remote artifact identifier, 마지막으로 동기화한 requirement digest를 기록합니다.
