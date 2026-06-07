# Context

이 저장소는 코딩 에이전트를 위한 재사용 가능한 하네스이자 playbook입니다.

## 용어

- `skill`: `SKILL.md`와 선택적 리소스를 포함하는 설치형 폴더.
- `template`: 프로젝트에 복사하는 파일 또는 폴더. 보통 루트 에이전트 정책이나 `ai-playbook/`입니다.
- `project playbook`: 대상 프로젝트에서 `ai-playbook/`가 되는 `templates/project-playbook/` 원본.
- `project memory`: 미래 에이전트가 이어서 작업할 수 있도록 돕는 현재 사실, map, runbook, decision, plan, worklog, archive.
- `adapter`: 에이전트별 설치 또는 동기화 안내.
- `legacy`: 아키텍처 순수성보다 런타임 사실, 호환성, 숨은 결합이 더 중요한 기존 운영 시스템.
- `local-only docs`: 에이전트/개발자 조율에는 쓰지만 제품 저장소에는 커밋하지 않는 프로젝트 메모.

## 설계 의도

스킬은 작고 조합 가능하며 설치하기 쉬워야 합니다. 템플릿은 사람이 프로젝트별로 복사하고 조정하므로 더 길 수 있습니다. project playbook은 현재 사실과 과거 worklog를 분리해 미래 에이전트가 낡은 plan을 그대로 믿지 않고 맥락을 회복하게 합니다.

레거시 가이드는 위험한 rewrite를 막고 contract/runtime 검증을 강제해야 합니다.
