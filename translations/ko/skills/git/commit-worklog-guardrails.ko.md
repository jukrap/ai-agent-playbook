# Commit Worklog Guardrails

관련 없는 변경, local-only files, verification integrity를 보호합니다.

## 진행 절차

1. branch, remote, upstream, dirty files, staged files를 확인합니다.
2. task와 관련된 explicit files만 stage합니다.
3. project-defined verification을 실행하고 실제 실행한 command만 보고합니다.
4. repository가 다른 convention을 증명하지 않으면 structured Conventional Commit message를 씁니다.
5. verified logical slice, large diff, many touched files, mixed concern set이 별도 commit으로 더 명확하면 checkpoint commit을 제안합니다.
6. 의도한 remote/branch에만 push합니다.
7. milestone, blocker, large direction change, long debugging에는 detailed worklog를 작성합니다.

## 참고 자료

commit, push, PR body, worklog 작성 전 `references/git-worklog-checklist.md`를 읽습니다.
