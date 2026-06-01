# Repo Onboarding

Agent가 새 프로젝트나 오래된 프로젝트에 들어갈 때 사용합니다.

## 첫 확인

1. 현재 디렉터리와 repository 여부를 확인합니다.
2. branch, remotes, dirty worktree를 확인합니다.
3. root files와 주요 folders를 봅니다.
4. README, root `AGENTS.md`, 하위 `AGENTS.md`, package/build config를 읽습니다.
5. local docs가 있으면 `PROJECT_SPEC.md`, `PLANS.md`, `FSD.md`, `docs/plans/README.md` 순서로 필요한 부분만 읽습니다.
6. package manager, runtime, scripts, test, lint, build 명령을 실제 config에서 확인합니다.
7. 요청과 관련된 entrypoints, routes, modules, APIs, style files를 `rg`로 찾습니다.

## 기록할 사실

- 기술 stack과 package manager.
- 실행 및 검증 명령.
- source-of-truth docs.
- local-only file policy.
- branch, remote, push policy.
- 주요 architecture boundaries.
- dirty files와 현재 작업의 관계.

## 금지

- `npm test`, `pnpm build`, FSD, React, API path를 추측하지 않습니다.
- 사용자 변경을 되돌리지 않습니다.
- 실제 code 확인 없이 docs만 믿지 않습니다.
- fresh command output 없이 완료를 주장하지 않습니다.

## 좋은 시작 문장

```text
먼저 저장소 구조, 문서, scripts, 현재 git 상태를 확인해서 이 프로젝트의 실제 작업 규칙을 잡겠습니다.
```
