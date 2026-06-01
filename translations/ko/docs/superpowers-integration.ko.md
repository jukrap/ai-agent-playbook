# Superpowers Integration

이 playbook은 Superpowers 계열 process skill과 함께 쓰는 것을 전제로 설계합니다.

## 역할 분리

- Superpowers skill은 process를 결정합니다: brainstorming, planning, TDD, debugging, verification, branch finishing, review discipline.
- 이 playbook은 repository guardrail을 더합니다: onboarding, documentation structure, API boundary, style quality, legacy risk control, commit policy, PR body policy, worklog.

process skill이 적용되는 상황이면 먼저 사용하고, 그 다음 가장 작은 관련 playbook skill 또는 project template을 사용합니다.

## 권장 조합

- 새 저장소 또는 불명확한 codebase: Superpowers process skill과 `repo-onboarding`.
- Feature planning: project docs 구조가 필요하면 Superpowers planning/brainstorming skill과 `project-doc-system`.
- API integration: Superpowers implementation process와 `api-contract-boundary`.
- UI polishing: Superpowers review/verification process와 `style-quality-review`.
- 명시적 style policy 작업: Superpowers implementation process와 `design-system-first`, `css-class-first`, `utility-class-first`, `inline-style-first`.
- Legacy change: Superpowers debugging/planning process와 가장 가까운 `legacy-*` skill.
- Commit, push, PR, handoff: Superpowers verification/branch-finishing process와 `commit-worklog-guardrails`.

## 우선순위

1. 최신 사용자 지시.
2. 실제 repository code, configuration, local project docs.
3. 가장 가까운 project `AGENTS.md` 또는 equivalent agent instruction file.
4. Superpowers process skills.
5. 이 playbook의 reusable skills와 templates.
6. 오래된 examples, handoffs, external references.

Superpowers process rule과 project-local rule이 충돌하면 더 높은 우선순위의 project context를 따르고 충돌을 명시합니다.

## 하지 말 것

- Superpowers를 이 저장소에 vendor하지 않습니다.
- 모든 사용자에게 Superpowers가 설치되어 있다고 가정하지 않습니다.
- 사용 가능한 skill을 전부 load하지 않습니다. 명확히 적용되는 최소 skill set만 사용합니다.
- generic process skill이 확인된 repository constraint를 덮어쓰게 하지 않습니다.
- machine-local custom instruction을 public docs로 옮길 때 path, identity, private workflow assumption을 제거하지 않은 채 복사하지 않습니다.
