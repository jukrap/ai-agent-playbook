# Commit, Push, PR, Worklog Guardrails

Agent가 commit, push, pull request, worklog를 다룰 때 사용합니다. 목표는 scope를 명확히 하고, local-only files를 보호하며, 검증되지 않은 완료 주장을 막는 것입니다.

## 작업 또는 staging 전

```bash
git status --short --branch
git remote -v
git branch --show-current
```

확인할 것:

- 현재 branch가 작업에 맞는지.
- upstream과 remotes가 무엇인지.
- push 가능한 remote와 보호해야 할 remote가 무엇인지.
- dirty files에 사용자 변경과 agent 변경이 섞였는지.
- local-only docs나 generated output이 이미 staged 되었는지.

## Staging

- `git add .`, `git add -A`를 기본값으로 쓰지 않습니다.
- 작업과 관련된 파일만 stage합니다.
- staging 후 반드시 확인합니다.

```bash
git diff --cached --name-only
git diff --cached --stat
```

일반적인 local-only 후보:

- `docs/**`
- `design-docs/**`
- `_reference/**`
- `.local-ai/**`
- 내부용 root-level `*.md`
- temporary prompts, handoffs, worklogs, analysis logs
- build output, coverage, visualizer output

프로젝트가 `README.md`를 공개 문서로 취급하면 예외가 될 수 있습니다.

## Verification

프로젝트가 정의한 명령을 우선합니다. 명령을 모르면 config를 먼저 읽습니다.

있을 때 일반적인 순서:

```bash
pnpm lint
pnpm test:run
pnpm build
```

검증 실패 시:

- 실패 원인을 읽고 관련 파일만 고칩니다.
- 같은 검증을 다시 실행합니다.
- 실패를 숨기지 않습니다.
- 실행하지 않은 검증을 commit message, PR, final reply에 쓰지 않습니다.

## Commit messages

목표:

- 요청된 commit 전략에 따라 현재 diff 또는 staged diff를 기준으로 최종 commit message를 1개 또는 여러 개 작성합니다.
- 사람이 빠르게 읽고 변경 의도와 핵심 결과를 파악할 수 있게 합니다.
- 변경이 논리적으로 분리되어 있고 사용자가 commit 또는 commit 준비를 요청했다면 별도 commit을 선호합니다.
- 사용자가 single commit을 요청했거나 repository convention이 task당 1 commit을 선호한다면 가장 중심적인 논리 변경을 title에 쓰고 부수 변경은 body에서 짧게 설명합니다.

출력 계약:

- 요청된 최종 commit message 또는 commit plan만 출력합니다.
- 설명, 후보 목록, 이유 설명, 따옴표, code fence를 붙이지 않습니다.
- 필요한 수준으로만 구조를 씁니다: title, title plus body, title plus body plus verification, title plus body plus verification plus footer.

기본 형식:

```text
type(scope): structured summary
```

repository convention을 먼저 따릅니다. 확인된 convention이 없으면 subject와 body는 사용자 또는 팀의 작업 언어에 맞춥니다. Conventional Commit type과 scope는 repository가 다른 형식을 증명하지 않는 한 영어로 유지합니다.

허용 type:

- `feat`: user-facing feature
- `fix`: bug fix
- `design`: UI/UX, 화면 구조, 시각적 변경
- `style`: formatting, 정렬, 주석처럼 runtime 영향이 없는 변경
- `refactor`: 동작 유지 refactor
- `perf`: 성능 개선
- `test`: test 추가/수정
- `docs`: 문서 변경
- `build`: build/package 설정
- `ci`: CI/CD 설정
- `chore`: 기타 maintenance

Title 규칙:

- title은 한 줄로 간결하게 작성합니다.
- title 끝에 마침표를 붙이지 않습니다.
- 실제 변경의 핵심 결과가 바로 드러나게 씁니다.
- subject는 사용자, 팀, repository의 주 사용 언어로 씁니다.
- branch명, chat title, 작업 제목을 그대로 복사하지 않습니다.
- `fix: update`, `chore: changes`, `refactor: cleanup`처럼 막연한 title을 피합니다.
- `작업`, `처리`, `수정`, `변경`, `개선` 같은 단어를 단독 핵심어처럼 쓰지 않습니다.
- UI, API, PR, HMR, MSW, SDK, JDK, WebView 같은 약어는 필요할 때만 대문자로 유지합니다.

Body 규칙:

- 변경이 단순하면 body를 생략합니다.
- 변경에 나중에 참고할 만한 context가 있으면 `- ` bullet 2~6개를 씁니다. 범위가 좁은 변경은 bullet 1개도 괜찮습니다.
- diff에서 확인되는 무엇을 바꿨는지, 왜 중요한지, 영향 범위, 주의점을 보존합니다.
- bullet은 결과 중심으로 씁니다.
- 구현 과정을 장황하게 설명하지 않습니다.
- diff에 없는 내용을 추측해서 쓰지 않습니다.

Verification 규칙:

- 실제로 확인한 경우에만 `검증` 또는 `Verification` section을 추가합니다.
- command나 manual check 결과를 짧게 씁니다.
- 실행하지 않은 browser, device, test, lint, build, deployment 검증을 쓴 척하지 않습니다.

Issue 규칙:

- issue 번호를 확실히 아는 경우에만 reference를 넣습니다.
- repository convention이 다르지 않으면 footer의 `Refs #123`, `Closes #123` 형식을 우선합니다.
- 같은 issue를 title과 footer에 중복해서 쓰지 않습니다.

금지:

- agent, model, generated-by, co-authored-by, signed-off-by, email signature를 임의로 넣지 않습니다.
- 검증하지 않은 test나 diff 밖의 변경을 쓰지 않습니다.

예시:

```text
docs(contributing): lf 정책 및 훅 검증 절차 추가
```

```text
fix(auth): 로그아웃 후 재로그인 불가 문제 수정

- 로그인 요청을 토큰 갱신 대상에서 제외해 불필요한 비인가 처리를 줄였습니다.
- 로그아웃 시 서버 세션 정리 API를 먼저 호출하도록 순서를 조정했습니다.
```

```text
refactor(table): data-table 책임 분리 및 인터랙션 훅 추출

검증
- pnpm lint
- pnpm test:run
```

## Push

push 전:

```bash
git status --short --branch
git log --oneline --decorate -5
git remote -v
```

- 현재 branch를 확인합니다.
- fork/origin/upstream 관계를 확인합니다.
- `upstream`이 source repository라면 push 의도가 맞는지 확인합니다.
- protected, deployment, shared branch는 명시적 사용자 지시 없이 push하지 않습니다.

## PR body

목표:

- 실제 diff를 기준으로 PR body를 작성합니다.
- reviewer가 목적, 범위, risk, verification, rollback을 빠르게 파악할 수 있게 합니다.

출력 계약:

- 저장소에 PR template이 있으면 그 구조를 따릅니다.
- template이 없으면 아래 기본 구조를 사용합니다.
- placeholder를 남기지 않습니다.
- 해당 사항이 없으면 `None` 또는 `해당 없음`으로 짧게 정리합니다.
- raw diff나 commit log를 붙이지 않습니다.

Summary 규칙:

- 무엇이 달라졌는지를 먼저 쓰고, 왜 바꿨는지가 드러나게 합니다.
- 1~3개 bullet 또는 1~3문장으로 씁니다.
- review context를 바꾸는 배경이 아니라면 장황한 설명은 피합니다.

Change 규칙:

- UI, state, API, type, configuration, documentation처럼 review concern 기준으로 묶습니다.
- reviewer가 특히 확인해야 할 부분은 `Changes` 또는 `Risk`에 드러냅니다.
- 사소한 구현 detail을 나열하지 않습니다.

Risk 규칙:

- `Low`, `Medium`, `High` 또는 프로젝트 언어 convention에 맞춘 `낮음`, `중간`, `높음` 중 하나를 씁니다.
- 실제 영향 기준으로 reason 한 줄을 붙입니다.
- auth, routing, persistence, shared component, build config, data format 변경은 보수적으로 판단합니다.
- 근거 없는 "문제 없음", "완벽히 해결" 같은 표현을 쓰지 않습니다.

Verification 규칙:

- 실제 수행한 항목만 씁니다.
- staging, browser, device, lint, type-check, scenario validation은 실제로 했을 때만 check합니다.
- command name과 manual scenario name을 구체적으로 씁니다.

Rollback 규칙:

- shared behavior, configuration, production operation에 영향을 줄 수 있으면 가장 단순한 rollback path를 씁니다.
- 특별한 rollback 처리가 필요 없을 때만 `None` 또는 `해당 없음`을 씁니다.

Media 규칙:

- UI 변경이 있을 때만 screenshot/video를 넣습니다.
- UI 변경이 없으면 `None` 또는 `해당 없음`으로 둡니다.

금지:

- agent, model, generated-by, auto-generated, co-authored signature를 넣지 않습니다.
- issue 번호, test, risk analysis, deployment status를 지어내지 않습니다.
- 의미 없는 문장으로 template을 형식적으로만 채우지 않습니다.

기본 구조:

```md
## Summary
- Summarize what changed and why in one to three bullets.

## Related Issue
- None

## Changes
- Group major changes by review concern.

## Risk
- Low/Medium/High
- Reason: describe the actual impact.

## Test/Verification
- List only checks actually performed.

## Rollback Plan
- State the simplest rollback path.

## Screenshots/Video
- None when there is no UI change.
```

## Worklogs

Commit message는 간결한 context를 보존할 수 있지만, 더 깊은 reasoning은 worklog가 담당합니다. 다음 경우 worklog를 작성합니다.

- milestone completion
- blocker 또는 반복 실패
- major direction change
- 원인이나 판단을 보존해야 하는 긴 debugging
- deployment, backend contract, printing, native, permission 변경처럼 영향 범위가 넓은 작업

언어:

- Worklog 언어는 target system과 팀 언어에 맞춥니다.
- 사용자가 한국어로 말했거나 한국어 Jira project에 올릴 내용이면 한국어 section title과 한국어 문장을 사용합니다.
- Ticket, repository, stakeholder context가 English-first라면 영어 section title과 영어 문장을 사용합니다.
- Command, package name, API name, technical identifier는 원문을 유지합니다.

권장 영어 구조:

```md
## Title

`Short result-focused title`

## Summary
- State the result in one to three bullets.

## Background
- Explain why the work was needed.

## Observed Problem
- Describe symptoms and reproduction conditions.

## Cause
- Include only causes actually confirmed.

## Changes
- Describe what changed, result-first.

## Verification
- List commands and screens/scenarios checked.

## Remaining Work
- Note remaining risks or follow-up work.
```

권장 한국어/Jira 구조:

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

좋은 worklog는 파일 목록보다 reasoning을 보존합니다. 다음 agent가 빠르게 context를 회복할 수 있어야 합니다.
