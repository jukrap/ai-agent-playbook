# Repo Onboarding

낯선 저장소에서 작업을 시작할 때, architecture/tooling을 계획하거나 code를 수정하기 전에 사용합니다.

## Workflow

1. root files, git branch/remotes/status, README, `AGENTS.md`, package/build config, local docs를 확인합니다.
2. 실제 package manager, runtime, scripts, architecture, local-only policy, verification commands를 식별합니다.
3. 관련 entrypoints는 `rg`로 찾습니다. stack, route, test, branch policy를 습관으로 추론하지 않습니다.
4. fresh output으로 확인한 사실만 말합니다. 남은 항목은 assumption 또는 blocker로 표시합니다.

## Reference

새 프로젝트, 오래된 프로젝트, 불명확한 repo convention을 다룰 때 `references/onboarding-checklist.md`를 읽습니다.
