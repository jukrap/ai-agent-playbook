# Git 및 Worklog 체크리스트

파일 staging, commit message 작성, push, PR 생성, worklog 기록 전에 이 참고 문서를 사용합니다.

프로젝트가 `templates/agents/global/GIT.md`를 복사했다면 짧은 루트 정책과 이 상세 가이드를 맞춰 둡니다. 루트 파일은 상시 규칙용이고, 이 참고 문서는 전체 절차 체크리스트용입니다.

## Staging 전

```bash
git status --short --branch
git remote -v
git branch --show-current
```

관련 없는 dirty file, 현재 브랜치, upstream, remote, protected branch, 로컬 전용 정책을 확인합니다.

## Staging

- `git add .` 또는 `git add -A`보다 명시적 경로를 선호합니다.
- 작업과 관련된 파일만 stage합니다.
- 프로젝트가 명시적으로 추적하지 않는 한 로컬 전용 문서, 생성물, worklog, 프롬프트 초안, 참고 자산을 stage하지 않습니다.
- staging 뒤에는 파일 이름과 요약을 확인합니다.

```bash
git diff --cached --name-only
git diff --cached --stat
```

## 커밋 체크포인트

프로젝트가 명시적으로 자동 commit을 허용한 경우가 아니라면 아래 상황 후 commit 여부를 묻습니다.

- 검증된 논리 단위가 완료됨
- 많은 파일이 변경됨
- diff가 커서 리뷰 의도가 흐려짐
- 스킬, 문서, 스크립트처럼 서로 다른 관심사가 한 세션에 나타남
- 위험한 리팩터링 또는 마이그레이션 단계가 되돌리기 쉬운 지점에 도달함

논리적으로 분리되는 변경은 여러 커밋을 선호합니다. 다만 commit마다 유용한 맥락을 잃을 정도로 과하게 쪼개지는 않습니다.

## 검증

- 저장소가 정의한 script만 사용합니다.
- 존재할 때 흔한 순서는 lint, tests, build입니다.
- 실행하지 않은 명령이 통과했다고 말하지 않습니다.
- 명령이 실패하면 원인을 읽고, 관련 파일만 고친 뒤, 같은 명령을 다시 실행하고 실제 결과를 보고합니다.

## Commit message policy

목표:

- 요청된 commit strategy에 따라 current diff 또는 staged diff에서 하나 이상의 최종 commit message를 작성합니다.
- 의도와 핵심 결과가 빠르게 읽히게 합니다.
- 변경이 논리적으로 분리되면 사용자가 commit 또는 prepare commits를 요청했을 때 separate commits를 선호합니다.
- 사용자가 single commit을 요청했거나 repository convention이 task당 one commit이라면 primary logical change를 title에 두고 secondary changes를 body에 둡니다.

출력:

- 요청된 최종 commit message 또는 commit plan만 출력합니다.
- 설명, 대안, 따옴표, code fence를 넣지 않습니다.
- 필요한 구조만 사용합니다: 제목, 제목과 본문, 제목과 본문 및 검증, 제목과 본문 및 검증과 footer.

형식:

```text
type(scope): summary
```

- Conventional Commit types: `feat`, `fix`, `design`, `style`, `refactor`, `perf`, `test`, `docs`, `build`, `ci`, `chore`.
- scope는 유용하고 저장소와 일관될 때만 사용합니다.
- subject는 저장소 언어 관례를 따릅니다. 확인된 관례가 없으면 사용자 또는 팀의 작업 언어에 맞춥니다. 저장소가 다른 형식을 증명하지 않는 한 Conventional Commit type과 scope는 영어로 유지합니다.

제목 규칙:

- 한 줄로 쓰고 마침표로 끝내지 않습니다.
- 과정이 아니라 구체적 결과를 말합니다.
- subject는 사용자, 팀, 저장소의 주 언어로 씁니다.
- 브랜치명, 채팅 제목, 작업 제목을 복사하지 않습니다.
- `fix: update`, `chore: changes`, `refactor: cleanup` 같은 막연한 제목을 피합니다.
- `work`, `process`, `fix`, `change`, `improvement` 같은 일반 단어만 단독으로 쓰지 않습니다.

본문 규칙:

- 단순 변경이면 body를 생략합니다.
- 미래에 유용한 맥락이 있으면 `- ` bullet 2~6개를 사용합니다. 좁은 변경이라면 1개도 괜찮습니다.
- diff에서 확인되는 변경 내용, 중요한 이유, 영향, 주의점을 보존합니다.
- bullet은 결과 중심이고 실제 diff에 근거해야 합니다.
- 구현 절차를 장황하게 설명하지 않습니다.

검증 규칙:

- 실제 실행한 확인에만 `Verification` section을 둡니다.
- 명령 이름 또는 수동 시나리오를 짧게 적습니다.
- 실행하지 않은 tests, browsers, devices, builds, deployments, scenario checks를 언급하지 않습니다.

이슈 및 footer 규칙:

- 이슈 번호를 아는 경우에만 이슈 참조를 포함합니다.
- 저장소가 다른 관례를 쓰지 않으면 `Refs #123` 또는 `Closes #123`를 선호합니다.
- 제목과 footer에 같은 이슈를 중복하지 않습니다.

금지:

- 명시적으로 요구되지 않는 한 agent, model, generated-by, co-authored-by, signed-off-by, email signature line을 추가하지 않습니다.
- 변경 사항, 테스트, 이슈 번호, 검증 결과를 지어내지 않습니다.

## 푸시

push 전:

```bash
git status --short --branch
git log --oneline --decorate -5
git remote -v
```

- 현재 브랜치와 대상 remote를 확인합니다.
- fork/origin/upstream 관계를 확인합니다.
- 명시적 지시 없이 protected, deployment, shared branch에 push하지 않습니다.
- 로컬 전용 파일 또는 검증되지 않은 작업을 push하지 않습니다.

## PR 본문 policy

- 저장소 template이 있으면 따릅니다.
- 없으면 summary, related issue, changes, risk, test/verification, rollback plan, screenshots/video를 포함합니다.
- PR 문장은 저장소 언어 관례를 따릅니다. 확인된 관례가 없으면 사용자 또는 팀의 작업 언어에 맞춥니다.
- 무엇이 바뀌었는지 먼저 요약하고, 그 다음 왜 바뀌었는지를 씁니다.
- commit 순서가 아니라 리뷰 관심사별로 변경을 묶습니다.
- `Low`, `Medium`, `High` risk를 고르고 실제 영향을 근거로 이유를 추가합니다.
- 실제 수행한 확인만 나열합니다.
- 공용 동작, 설정, 운영 영향 가능성이 있는 변경에는 rollback 단계를 포함합니다.
- UI 변경이 있을 때만 screenshot이나 video를 포함합니다.
- raw diff, commit log, 지어낸 이슈 번호, 검증하지 않은 테스트 결과를 붙이지 않습니다.

## Worklog 작성 시점

아래 경우 worklog를 씁니다.

- 마일스톤 완료
- blocker 또는 반복 실패
- 큰 방향 전환
- 유용한 원인 분석이 있는 긴 디버깅
- 배포, native, printing, permission, API contract 변경

## Worklog 언어와 형태

- worklog 언어는 대상 시스템과 팀 언어에 맞춥니다.
- 한국어 프로젝트 또는 사용자가 한국어로 요청한 경우 한국어 구조를 사용합니다.
- 영어를 우선하는 ticket, 저장소, 이해관계자에는 영어 section title과 영어 문장을 사용합니다.
- 명령, 패키지명, API명, 기술 식별자는 원문을 유지합니다.

작성 원칙:

- file name, path, markdown document name만 나열하지 않습니다.
- 다른 사람이 별도 자료 없이 작업을 이해할 수 있게 이유와 결과를 설명합니다.
- 사람 또는 외부 reference 이름보다 실제 기준과 판단을 우선합니다.
- 무엇을 참고했는지보다 무엇이 잘못됐고 어떻게 정리했는지를 우선합니다.
- 프로젝트가 playbook layout을 쓰면 상세 로그는 `ai-playbook/worklogs/YYYY-MM/`, 월간 요약은 `ai-playbook/worklogs/summaries/YYYY-MM.md`에 둡니다.
- 오래 남길 사실은 worklog에서 `ai-playbook/CURRENT.md`, maps, runbooks, decisions로 승격합니다.

Commit message는 미래 독자를 위한 간결한 맥락을 보존할 수 있습니다. Worklog에는 더 깊은 reasoning, blocker, 결정 이력, 확인된 원인, 검증 세부사항, 남은 리스크를 남깁니다.

프로젝트가 worklog를 미래 에이전트 또는 maintainer를 위한 오래 남길 맥락으로 사용한다면 worklog를 commit message 크기의 요약으로 줄이지 않습니다.
