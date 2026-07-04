# Superpowers 연동

이 playbook은 Superpowers 같은 외부 작업 흐름 스킬과 함께 쓰도록 설계되어 있습니다.

## 역할 분리

- 작업 흐름 스킬은 어떻게 일할지를 결정합니다: brainstorming, planning, TDD, debugging, verification, branch finishing, review discipline.
- 이 playbook은 저장소 보호 규칙을 더합니다: runtime bootstrap, onboarding, project memory, API boundary, UI style policy, legacy risk control, commit policy, PR body policy, worklog.
- 선택적 runtime hook은 reminder나 context injection으로 이런 guardrail을 보강할 수 있지만, process skill을 대체하거나 저장소 정책을 project file 밖에 숨기지 않아야 합니다.

작업 흐름 스킬이 적용되는 경우 먼저 사용하고, 그 다음 가장 작은 관련 playbook 스킬, 프로젝트 템플릿, 런타임 명령을 사용합니다.

## 추천 조합

- 새 저장소 또는 불분명한 codebase: 프로세스 planning과 `project-bootstrap`, `repo-onboarding`, 또는 `node .\bin\ai-playbook.mjs bootstrap <target> --dry-run`.
- 기능 계획: project docs나 `.ai-playbook/` 구조가 필요하면 프로세스 planning과 `project-doc-system`.
- API integration: 구현 프로세스와 `api-contract-boundary`.
- UI 스타일 정책: 구현 또는 리뷰 프로세스와 `style-policy-selection`을 함께 사용합니다. `ui-style-policy`는 오래된 프롬프트용 호환 이름으로만 사용합니다.
- UI styling review: 리뷰 또는 검증 프로세스와 `style-quality-review`.
- UI implementation polish: 구현 또는 검증 프로세스와 `frontend-ui-polish`.
- Behavior-preserving cleanup: 리팩터링 또는 검증 프로세스와 `cleanup-ai-slop`.
- Pre-handoff review: 리뷰 프로세스와 `review-work-light`.
- 레거시 변경: 디버깅 또는 planning 프로세스와 가장 가까운 `legacy-*` 스킬.
- Commit, push, PR, handoff: 검증 또는 branch-finishing 프로세스와 `commit-worklog-guardrails`.
- 재사용 스킬 작성/수정: planning 또는 리뷰 프로세스와 `agent-skill-authoring`.
- 저장소 전체 구조 정리: 프로세스 planning과 `node .\bin\ai-playbook.mjs doctor <target>`, `templates/project-playbook/knowledge/references/guides/structural-review.md`, 또는 프로젝트가 설치한 근거 도구.

## 우선순위

1. 최신 사용자 지시.
2. 실제 저장소 코드, 설정, 로컬 프로젝트 문서.
3. 가장 가까운 프로젝트 `AGENTS.md` 또는 동등한 에이전트 지침 파일.
4. 외부 작업 흐름 스킬.
5. 이 playbook의 재사용 스킬과 템플릿.
6. 오래된 예시, 인수인계, 외부 참고 자료.

프로세스 규칙과 프로젝트 로컬 규칙이 충돌하면 더 높은 우선순위의 프로젝트 맥락을 따르고 충돌을 명시합니다.

## 하지 말 것

- 외부 작업 흐름 스킬 묶음을 이 저장소에 통째로 들여오지 않습니다.
- 모든 사용자가 특정 외부 프로세스 묶음을 설치했다고 가정하지 않습니다.
- 가능한 모든 스킬을 전부 불러오지 않습니다. 명확히 필요한 최소 스킬만 사용합니다.
- 일반 프로세스 스킬이 확인된 저장소 제약을 덮어쓰게 하지 않습니다.
- 특정 장비의 custom instruction을 public docs에 옮길 때 path, identity, private workflow assumption을 제거하지 않은 채 복사하지 않습니다.
- 다른 에이전트 런타임의 hook, slash command, plugin environment variable이 사용 가능하다고 가정하지 않습니다.
- 이 저장소의 CLI를 planning, TDD, debugging, verification 작업 흐름 스킬의 대체재로 취급하지 않습니다. CLI는 project memory를 scaffold하고 점검할 뿐입니다.
- 같은 정책을 `AGENTS.md`나 `.ai-playbook/`에 명확히 둘 수 있다면 hook 기반 동작을 필수로 만들지 않습니다.
