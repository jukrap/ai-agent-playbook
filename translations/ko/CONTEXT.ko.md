# Context

이 저장소는 코딩 에이전트를 위한 재사용 playbook입니다.

## 용어

- `skill`: `SKILL.md`와 선택적 리소스를 포함하는 설치형 폴더.
- `template`: 프로젝트에 복사하는 파일. 보통 `AGENTS.md` 또는 local AI 문서입니다.
- `adapter`: 에이전트별 설치 또는 동기화 안내.
- `legacy`: 실제 runtime, 호환성, 숨은 결합이 아키텍처 순수성보다 중요한 기존 운영 시스템.
- `SI project`: 오래된 스택, 고객사 제약, 수동 운영, 팀별 스타일 선호가 자연스러운 계약/기업 납품 프로젝트.
- `local-only docs`: 제품 저장소에 커밋하지 않고 agent/developer 협업을 위해 쓰는 프로젝트 메모.

## 설계 의도

Skill은 작고 조합 가능하며 설치하기 쉬워야 합니다. 템플릿은 프로젝트마다 사람이 복사하고 조정하므로 조금 길어도 됩니다. 레거시 가이드는 위험한 rewrite를 막고 contract/runtime 검증을 강제해야 합니다.
