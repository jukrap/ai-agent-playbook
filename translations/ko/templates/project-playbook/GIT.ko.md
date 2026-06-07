# Git, 커밋, PR 정책

이 파일은 `ai-playbook/` 안에 두는 portable project-level Git policy입니다. repository-specific branch name, remote, issue number, protected-branch rule은 프로젝트에 맞게 조정하기 전까지 template에 넣지 않습니다.

이 문서는 짧은 정책입니다. 미래 독자를 위한 자세한 commit, PR, worklog guidance가 필요하면 `guides/commit-push-worklog.md` 같은 상세 문서를 함께 사용합니다.

## Staging 전

현재 branch, remotes, upstream, dirty files, staged files를 확인합니다.

```bash
git status --short --branch
git remote -v
git branch --show-current
git diff --cached --name-only
```

- 관련 없는 사용자 변경을 되돌리지 않습니다.
- local-only docs, reference material, generated output, unrelated dirty files를 stage하지 않습니다.
- `git add .` 또는 `git add -A`보다 explicit staging을 선호합니다.
- commit 전 staged names와 staged diff를 확인합니다.

## 커밋 체크포인트

프로젝트가 명시적으로 자동 commit을 허용한 경우가 아니라면, 아래 상황 후에는 commit 여부를 묻습니다.

- 검증된 logical slice가 완료됨
- 많은 파일이 변경됨
- diff가 커서 review intent가 흐려짐
- 한 세션에 여러 concern이 섞임
- 위험한 refactor 또는 migration step이 깨끗한 rollback point에 도달함

## 커밋 메시지

repository가 다른 convention을 증명하지 않으면 Conventional Commits를 사용합니다.

commit subject와 body는 사용자, 팀, 또는 repository의 primary language로 씁니다. repository가 다른 형식을 증명하지 않으면 Conventional Commit type과 scope는 영어로 유지합니다.

Format:

```text
type(scope): summary
```

Allowed types:

- `feat`: user-facing feature
- `fix`: bug fix
- `design`: UI/UX, screen structure, visual changes
- `style`: formatting, ordering, comments, non-runtime code style
- `refactor`: behavior-preserving refactor
- `perf`: performance improvement
- `test`: test addition or change
- `docs`: documentation change
- `build`: build or dependency configuration
- `ci`: CI/CD configuration
- `chore`: maintenance

Rules:

- title은 한 줄로 쓰고 끝 마침표를 생략합니다.
- concrete result가 드러나게 씁니다.
- branch name, chat title, task title을 그대로 복사하지 않습니다.
- `fix: update`, `chore: changes`, `refactor: cleanup` 같은 vague title을 피합니다.
- 단순 변경이면 body를 생략합니다.
- 무엇이 바뀌었고 왜 중요한지, 영향 또는 주의점이 필요할 때만 짧은 `- ` bullets를 씁니다.
- 실제 실행한 command 또는 manual check에만 verification section을 포함합니다.
- issue number와 repository convention을 아는 경우에만 issue reference를 포함합니다.
- repository가 명시적으로 요구하지 않는 한 agent, model, generated-by, co-authored-by, signed-off-by, email signature line을 넣지 않습니다.

## PR 본문

repository PR template이 있으면 따릅니다. 없으면 아래 구조를 사용합니다.

```md
## Summary
- 무엇이 바뀌었고 왜 바뀌었는지 1~3개 bullet로 요약합니다.

## Related Issue
- None

## Changes
- 주요 변경을 review concern별로 묶습니다.

## Risk
- Low/Medium/High
- Reason: 실제 영향을 설명합니다.

## Test/Verification
- 실제 수행한 check만 나열합니다.

## Rollback Plan
- 가장 단순한 rollback path를 적습니다.

## Screenshots/Video
- UI 변경이 없으면 None.
```

Rules:

- 기억이 아니라 실제 diff를 기준으로 씁니다.
- repository template이 다른 convention을 증명하지 않는 한 PR prose도 사용자, 팀, repository의 primary language로 씁니다.
- UI, state, API, types, docs, configuration 같은 review concern별로 묶습니다.
- auth, routing, persistence, shared components, build config, data formats는 risk를 보수적으로 판단합니다.
- 실행하지 않은 check를 완료로 표시하지 않습니다.
- issue number, staging status, deployment status, screenshots, test result를 지어내지 않습니다.

## 푸시

push 전:

```bash
git status --short --branch
git log --oneline --decorate -5
git remote -v
```

- branch와 remote를 확인합니다.
- upstream과 protected branch policy를 확인합니다.
- 명시적 지시 없이 protected, deployment, shared branch에 push하지 않습니다.
