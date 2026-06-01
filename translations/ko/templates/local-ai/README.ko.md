# Local AI 보조 템플릿

이 파일들은 agent 작업을 위한 선택적 project-level 보조 문서입니다. 프로젝트 안에서는 `.local-ai`, `docs/ai`, `docs/plans`처럼 팀이 local-only note를 두는 위치에 맞게 복사합니다. 제품 또는 기술 source of truth와 충돌하면 실제 코드와 현재 프로젝트 문서를 우선합니다.

## 추천 묶음

- 모든 프로젝트: `repo-onboarding.md`, `docs-system.md`, `commit-push-worklog.md`.
- React/FSD 프로젝트: `pragmatic-fsd.md`, `ui-style-quality.md`, `api-contract-boundary.md`.
- API 연동이 많은 프로젝트: `api-contract-boundary.md`.
- SI 또는 레거시 유지보수: `si-legacy-mode.md`와 가장 가까운 legacy `AGENTS.md` profile.

`commit-push-worklog.md`는 machine-local commit, PR, worklog custom instruction을 휴대 가능한 형태로 옮긴 문서입니다. 여러 컴퓨터에서 같은 agent behavior가 필요하면 이 문서를 복사하거나 참조합니다.

## 사용 규칙

- 이 문서는 agent에게 추가 기준을 제공합니다.
- 실제 project config, run command, 하위 `AGENTS.md`, 최신 사용자 지시를 대체하지 않습니다.
- 오래된 프로젝트에서 복사한 문서는 그대로 믿지 말고 현재 codebase에 맞게 줄입니다.
