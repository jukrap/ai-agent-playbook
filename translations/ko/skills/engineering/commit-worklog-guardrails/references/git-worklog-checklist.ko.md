# Git and Worklog Checklist

파일 staging, commit message 작성, push, PR 생성, worklog 기록 전에 이 reference를 사용합니다.

## Staging 전

```bash
git status --short --branch
git remote -v
git branch --show-current
```

관련 없는 dirty file, 현재 branch, upstream, remotes, protected branch, local-only policy를 확인합니다.

## Staging

- `git add .`, `git add -A`보다 명시적 path staging을 선호합니다.
- 작업과 관련된 파일만 stage합니다.
- 프로젝트가 명시적으로 추적하지 않는 한 local-only docs, generated output, worklogs, prompt drafts, reference assets를 stage하지 않습니다.
- staging 후 file names와 summary를 모두 확인합니다.

```bash
git diff --cached --name-only
git diff --cached --stat
```

## Verification

- repository가 정의한 script만 사용합니다.
- 있을 때 일반적인 순서는 lint, tests, build입니다.
- 실행하지 않은 command가 통과했다고 말하지 않습니다.
- command가 실패하면 원인을 읽고, 관련 파일만 고친 뒤, 같은 command를 다시 실행하고 실제 결과를 보고합니다.

## Commit message policy

목표:

- 요청된 commit 전략에 따라 현재 diff 또는 staged diff를 기준으로 최종 commit message를 1개 또는 여러 개 작성합니다.
- 사람이 빠르게 읽고 변경 의도와 핵심 결과를 파악할 수 있게 합니다.
- 변경이 논리적으로 분리되어 있고 사용자가 commit 또는 commit 준비를 요청했다면 별도 commit을 선호합니다.
- 사용자가 single commit을 요청했거나 repository convention이 task당 1 commit을 선호한다면 가장 중심적인 논리 변경을 title에 쓰고 부수 변경은 body에 둡니다.

출력:

- 요청된 최종 commit message 또는 commit plan만 출력합니다.
- 설명, 후보 목록, 이유 설명, 따옴표, code fence를 붙이지 않습니다.
- 필요한 구조만 씁니다: title, title plus body, title plus body plus verification, title plus body plus verification plus footer.

형식:

```text
type(scope): summary
```

- Conventional Commit type은 `feat`, `fix`, `design`, `style`, `refactor`, `perf`, `test`, `docs`, `build`, `ci`, `chore`를 사용합니다.
- scope는 유용하고 repository convention과 맞을 때만 씁니다.
- subject는 repository 언어 convention을 따릅니다. 확인된 convention이 없으면 subject와 body는 사용자 또는 팀의 작업 언어에 맞춥니다. Conventional Commit type과 scope는 repository가 다른 형식을 증명하지 않는 한 영어로 유지합니다.

Title 규칙:

- 한 줄로 쓰고 끝에 마침표를 붙이지 않습니다.
- 과정이 아니라 구체적인 결과를 씁니다.
- subject는 사용자, 팀, repository의 주 사용 언어로 씁니다.
- branch명, chat title, task title을 그대로 복사하지 않습니다.
- `fix: update`, `chore: changes`, `refactor: cleanup`처럼 막연한 title을 피합니다.
- `작업`, `처리`, `수정`, `변경`, `개선` 같은 일반 단어를 단독 핵심어처럼 쓰지 않습니다.

Body 규칙:

- 단순 변경이면 body를 생략합니다.
- 변경에 나중에 참고할 만한 context가 있으면 `- ` bullet 2~6개를 씁니다. 범위가 좁은 변경은 bullet 1개도 괜찮습니다.
- diff에서 확인되는 무엇을 바꿨는지, 왜 중요한지, 영향 범위, 주의점을 보존합니다.
- bullet은 결과 중심으로 쓰고 실제 diff에 근거합니다.
- 구현 과정을 장황하게 설명하지 않습니다.

Verification 규칙:

- 실제로 실행한 확인에 대해서만 `Verification` 또는 `검증` section을 넣습니다.
- command name이나 manual scenario를 짧게 적습니다.
- 실행하지 않은 test, browser, device, build, deployment, scenario check를 언급하지 않습니다.

Issue/footer 규칙:

- issue 번호를 확실히 아는 경우에만 reference를 넣습니다.
- repository convention이 다르지 않으면 `Refs #123`, `Closes #123`를 우선합니다.
- 같은 issue를 title과 footer에 중복하지 않습니다.

금지:

- 명시적으로 요구되지 않았다면 agent, model, generated-by, co-authored-by, signed-off-by, email signature를 추가하지 않습니다.
- 변경, test, issue 번호, verification result를 지어내지 않습니다.

## Push

push 전:

```bash
git status --short --branch
git log --oneline --decorate -5
git remote -v
```

- 현재 branch와 target remote를 확인합니다.
- fork/origin/upstream 관계를 확인합니다.
- 명시적 지시 없이 protected, deployment, shared branch에 push하지 않습니다.
- local-only file이나 검증되지 않은 작업을 push하지 않습니다.

## PR body policy

- repository template이 있으면 따릅니다.
- template이 없으면 summary, related issue, changes, risk, test/verification, rollback plan, screenshots/video를 포함합니다.
- 무엇이 달라졌는지를 먼저 쓰고, 왜 바꿨는지를 그 다음에 씁니다.
- commit 순서가 아니라 review concern 기준으로 변경을 묶습니다.
- risk는 `Low`, `Medium`, `High` 중 하나로 정하고 실제 영향 기준의 reason을 붙입니다.
- 실제 수행한 확인만 적습니다.
- shared behavior, configuration, production-impacting change에는 rollback step을 적습니다.
- UI 변경일 때만 screenshots/video를 포함합니다.
- raw diff, commit log, 지어낸 issue 번호, 검증하지 않은 test result를 붙이지 않습니다.

## Worklog trigger

다음 경우 worklog를 작성합니다.

- milestone completion
- blocker 또는 반복 실패
- 큰 방향 변경
- 원인 분석이 유용한 긴 debugging
- deployment, native, printing, permission, API contract 변경

## Worklog 언어와 형태

- Worklog 언어는 target system과 팀 언어에 맞춥니다.
- 한국어 Jira project 또는 사용자가 한국어로 요청한 상황이면 한국어 section title과 한국어 문장을 사용합니다.
- English-first ticket, repository, stakeholder가 대상이면 영어 section title과 영어 문장을 사용합니다.
- Command, package name, API name, technical identifier는 원문을 유지합니다.

한국어 Jira worklog는 아래 형태를 우선합니다.

```md
### 제목

`작업 결과 중심 제목`

### 요약

-

### 배경

-

### 확인된 문제

-

### 원인

-

### 적용 내용

-

### 검증

-

### 잔여 확인 사항

-
```

작성 원칙:

- 파일명, 경로, 특정 마크다운 문서 이름을 그대로 나열하지 않습니다.
- 다른 사람이 별도 자료 없이 읽어도 이해되도록 변경 이유와 결과를 설명식으로 적습니다.
- 특정 사람이나 외부 자료명을 내세우기보다 실제로 어떤 기준과 판단으로 바꿨는지 적습니다.
- “무엇을 참고했다”보다 “무엇이 문제였고 어떻게 정리했는지”를 우선합니다.

Commit message는 다음 독자를 위한 간결한 context를 보존할 수 있습니다. 더 깊은 reasoning, blocker, decision history, confirmed cause, verification detail, remaining risk는 worklog에 둡니다.
