# Commit Worklog Guardrails

파일 staging, commit 작성, push, PR 생성, release notes, worklog 기록 전에 사용합니다.

## Workflow

1. branch, remote, upstream, dirty files, staged files를 확인합니다.
2. 작업과 관련된 명시적 파일만 stage합니다.
3. 프로젝트가 정의한 verification을 실행하고, 실제 실행한 명령만 보고합니다.
4. 저장소가 다른 convention을 증명하지 않으면 간결한 Conventional Commit을 사용합니다.
5. 의도한 remote/branch에만 push합니다.
6. milestone, blocker, 큰 방향 변경, 긴 debugging에는 worklog를 작성합니다.

## Reference

commit, push, PR body, worklog 작성 전 `references/git-worklog-checklist.md`를 읽습니다.
