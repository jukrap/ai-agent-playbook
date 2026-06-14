# Repo Onboarding

행동하기 전에 repository에 근거해 decision을 내립니다.

## 진행 절차

1. root files, git branch/remotes/status, README, `AGENTS.md`, package/build config, local docs를 확인합니다.
2. actual package manager, runtime, scripts, architecture, local-only policy, verification commands를 식별합니다.
3. 존재하면 `.ai-playbook/START_HERE.md`, `CURRENT.md`의 working vocabulary, relevant maps, relevant runbooks를 읽습니다.
4. 구조 또는 중복 코드 주장을 믿기 전에 map freshness와 scan range를 확인합니다.
5. 관련 entrypoints는 `rg`로 찾습니다. stack, route, test, branch policy를 습관으로 추론하지 않습니다.
6. fresh output으로 확인한 사실만 말합니다. unresolved items는 assumptions 또는 blockers로 표시합니다.

## 참고 자료

새 프로젝트, 오래 쉬었다가 다시 여는 프로젝트, 불분명한 repo convention을 다룰 때 `references/onboarding-checklist.md`를 읽습니다.
