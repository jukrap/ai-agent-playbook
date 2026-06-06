# Superpowers 연동

이 playbook은 Superpowers 계열 작업 흐름 스킬과 함께 쓰는 것을 전제로 설계합니다.

## 역할 분리

- Superpowers 스킬은 작업 방식을 결정합니다: brainstorming, planning, TDD, debugging, verification, branch finishing, review discipline.
- 이 playbook은 저장소 보호 규칙을 더합니다: 온보딩, 문서 구조, API 경계, 스타일 품질, 레거시 위험 제어, 커밋 정책, PR 본문 정책, 작업 기록.

작업 흐름 스킬이 적용되는 상황이면 먼저 사용하고, 그 다음 가장 작은 관련 playbook 스킬 또는 프로젝트 템플릿을 사용합니다.

## 권장 조합

- 새 저장소 또는 불명확한 codebase: Superpowers 작업 흐름 스킬과 `repo-onboarding`.
- 기능 계획: 프로젝트 문서 구조가 필요하면 Superpowers planning/brainstorming 스킬과 `project-doc-system`.
- API 연동: Superpowers 구현 흐름과 `api-contract-boundary`.
- UI 다듬기: Superpowers review/verification 흐름과 `style-quality-review`.
- 명시적 스타일 정책 작업: Superpowers 구현 흐름과 `design-system-first`, `css-class-first`, `utility-class-first`, `inline-style-first`.
- 레거시 변경: Superpowers debugging/planning 흐름과 가장 가까운 `legacy-*` 스킬.
- 커밋, 푸시, PR, 인수인계: Superpowers verification/branch-finishing 흐름과 `commit-worklog-guardrails`.
- 재사용 스킬 생성 또는 수정: Superpowers planning/review 흐름과 `agent-skill-authoring`.
- 저장소 전체 구조 정리: 작업 계획과 `templates/local-ai/structural-review.md`, 또는 프로젝트가 설치한 근거 수집 도구.

## 우선순위

1. 최신 사용자 지시.
2. 실제 저장소 코드, 설정, 로컬 프로젝트 문서.
3. 가장 가까운 프로젝트 `AGENTS.md` 또는 그에 해당하는 에이전트 지침 파일.
4. Superpowers 작업 흐름 스킬.
5. 이 playbook의 재사용 스킬과 템플릿.
6. 오래된 예시, 인수인계, 외부 참고 자료.

Superpowers 작업 흐름 규칙과 프로젝트 로컬 규칙이 충돌하면 더 높은 우선순위의 프로젝트 맥락을 따르고 충돌을 명시합니다.

## 하지 말 것

- Superpowers를 이 저장소에 vendor하지 않습니다.
- 모든 사용자에게 Superpowers가 설치되어 있다고 가정하지 않습니다.
- 사용 가능한 스킬을 전부 불러오지 않습니다. 명확히 적용되는 최소 스킬 묶음만 사용합니다.
- 일반 작업 흐름 스킬이 확인된 저장소 제약을 덮어쓰게 하지 않습니다.
- 기기 로컬 사용자 지침을 공개 문서로 옮길 때 경로, 신원 정보, 비공개 작업 흐름 가정을 제거하지 않은 채 복사하지 않습니다.
- Claude Code 전용 훅, 슬래시 명령, plugin 환경 변수가 Codex에서 사용 가능하다고 가정하지 않습니다.
