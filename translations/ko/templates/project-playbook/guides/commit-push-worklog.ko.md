# 커밋, 푸시, PR, Worklog 가드레일

에이전트가 commit, push, pull request, worklog를 다룰 때 사용합니다.

목표는 범위를 명확히 하고, 로컬 전용 파일을 보호하며, 상세한 worklog를 보존하고, 검증되지 않은 완료 주장을 막는 것입니다.

## Staging 전 확인

```bash
git status --short --branch
git remote -v
git branch --show-current
git diff --cached --name-only
```

확인할 것:

- 현재 브랜치와 작업의 일치 여부
- upstream과 remote
- 관련 없는 dirty file
- staged file
- 로컬 전용 정책
- 최신 검증 출력

## Staging

- `git add .` 또는 `git add -A`보다 명시적 경로를 선호합니다.
- 논리 단위에 관련된 파일만 stage합니다.
- 프로젝트가 명시적으로 추적하지 않는 한 로컬 전용 문서, 참고 자료, 생성물, 프롬프트 초안, 관련 없는 dirty file을 stage하지 않습니다.
- commit 전 staged file 이름과 staged diff를 확인합니다.

## 커밋 체크포인트

프로젝트가 명시적으로 자동 commit을 허용한 경우가 아니라면, 아래 상황 후에는 commit 여부를 묻습니다.

- 논리 단위가 완료되고 검증됨
- diff가 많은 파일을 건드림
- 순 변경량이 커서 리뷰 의도가 흐려짐
- 스킬, 문서, 스크립트처럼 서로 다른 관심사가 한 작업 세션에 나타남
- 위험한 리팩터링 또는 마이그레이션 단계가 되돌리기 쉬운 지점에 도달함

논리적으로 분리되는 변경은 여러 커밋을 선호합니다. 다만 각 commit이 유용한 맥락을 잃을 정도로 과하게 쪼개지는 않습니다.

## 커밋 메시지

저장소가 다른 관례를 증명하지 않으면 Conventional Commits를 사용합니다.

subject와 body는 사용자, 팀, 저장소의 주 언어로 씁니다. 저장소가 다른 형식을 증명하지 않는 한 Conventional Commit type과 scope는 영어로 유지합니다.

Allowed types:

- `feat`
- `fix`
- `design`
- `style`
- `refactor`
- `perf`
- `test`
- `docs`
- `build`
- `ci`
- `chore`

규칙:

- 제목은 한 줄이고 구체적으로 씁니다.
- 브랜치명, 채팅 제목, 작업 제목을 복사하지 않습니다.
- 이유, 범위, 리스크, 검증을 설명하는 데 도움이 될 때만 본문을 씁니다.
- 실제 실행한 명령 또는 수동 확인만 검증에 포함합니다.
- 이슈 번호와 저장소 관례를 아는 경우에만 이슈 참조를 포함합니다.
- 저장소가 명시적으로 요구하지 않는 한 에이전트, 모델, generated-by, co-authored-by, signed-off-by, email signature line을 추가하지 않습니다.

## PR 본문

저장소 PR 템플릿이 있으면 따릅니다. 없으면 아래를 포함합니다.

- Summary
- Related issue
- Changes
- Risk
- Test/verification
- Rollback plan
- Screenshots/video when UI changed

규칙:

- 실제 diff 기준으로 씁니다.
- 문장은 사용자, 팀, 저장소의 주 언어로 씁니다.
- commit 순서가 아니라 리뷰 관심사별로 변경을 묶습니다.
- 인증, 라우팅, 영속성, 공용 컴포넌트, 빌드 설정, 데이터 형식은 리스크를 보수적으로 판단합니다.
- 실제 수행한 확인만 나열합니다.
- 이슈 번호, 배포 상태, 스크린샷, 테스트 결과를 지어내지 않습니다.

## 푸시

push 전:

```bash
git status --short --branch
git log --oneline --decorate -5
git remote -v
```

- 현재 브랜치, 대상 remote, upstream, protected branch 정책을 확인합니다.
- 명시적 지시 없이 protected, deployment, shared branch에 push하지 않습니다.
- 로컬 전용 파일이나 검증되지 않은 작업을 push하지 않습니다.

## Worklog

Commit message는 간결한 맥락을 보존합니다. Worklog는 더 깊은 reasoning을 보존합니다.

Worklog를 쓰는 경우:

- 마일스톤 완료
- blocker 또는 반복 실패
- 큰 방향 전환
- 유용한 원인 분석이 있는 긴 디버깅
- 배포, native, printing, permission, API contract, data shape 변경

Worklog 원칙:

- worklog 언어는 대상 시스템과 팀 언어에 맞춥니다.
- 명령, 패키지명, API명, 기술 식별자는 원문을 유지합니다.
- 문제, 결정 경로, 근거, 검증, 남은 리스크를 설명합니다.
- 파일 목록만 나열하지 않습니다.
- 프로젝트가 오래 남길 맥락으로 worklog를 사용한다면 commit message 크기의 요약으로 줄이지 않습니다.
- 현재 사실은 `ai-playbook/CURRENT.md`, `maps/`, `runbooks/`, `decisions/`로 승격합니다.
