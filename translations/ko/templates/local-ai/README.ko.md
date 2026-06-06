# Local AI 보조 템플릿

이 파일들은 에이전트 작업을 위한 선택적 프로젝트 수준 보조 문서입니다. 프로젝트 안에서는 `.local-ai`, `docs/ai`, `docs/plans`처럼 팀이 local-only 메모를 두는 위치에 맞게 복사합니다. 제품 또는 기술 기준 문서와 충돌하면 실제 코드와 현재 프로젝트 문서를 우선합니다.

## 추천 묶음

- 모든 프로젝트: `repo-onboarding.md`, `docs-system.md`, `commit-push-worklog.md`.
- React/FSD 프로젝트: `pragmatic-fsd.md`, `ui-style-quality.md`, `api-contract-boundary.md`.
- API 연동이 많은 프로젝트: `api-contract-boundary.md`.
- SI 또는 레거시 유지보수: `si-legacy-mode.md`와 가장 가까운 레거시 `AGENTS.md` 프로필.
- 저장소 전체 정리 또는 아키텍처 리뷰: `structural-review.md`.

`commit-push-worklog.md`는 기기별로 흩어지기 쉬운 커밋, PR, 작업 기록 지침을 휴대 가능한 형태로 옮긴 문서입니다. 여러 컴퓨터에서 같은 에이전트 동작이 필요하면 이 문서를 복사하거나 참조합니다.

짧은 루트 수준 Git 정책에는 `templates/agents/global/GIT.md`를 사용합니다. 프로젝트가 자세한 PR, 롤백, 작업 기록 기준도 필요하면 `commit-push-worklog.md`를 함께 사용합니다. 팀이 작업 기록을 오래 남길 context로 활용한다면 짧은 루트 정책이 상세 작업 기록 문서를 대체하지 않습니다.

## 사용 규칙

- 이 문서는 에이전트에게 추가 기준을 제공합니다.
- 실제 프로젝트 설정, 실행 명령, 하위 `AGENTS.md`, 최신 사용자 지시를 대체하지 않습니다.
- 오래된 프로젝트에서 복사한 문서는 그대로 믿지 말고 현재 코드베이스에 맞게 줄입니다.
