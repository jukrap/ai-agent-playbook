# 복사해서 쓸 템플릿

템플릿은 내용을 검토하고 프로젝트에 맞게 조정한 뒤 사용합니다. 사용자 계정에 설치하는 스킬과는 별개입니다. Bootstrap은 최소 기록 템플릿을 사용하며 모든 템플릿을 복사하거나 기존 지침을 교체하지 않습니다.

| 위치 | 목적 | 사용 방법 |
| --- | --- | --- |
| [agents](agents/README.ko.md) | 루트 지침과 선택형 기술 프로필 | 기존 AGENTS.md에 필요한 규칙만 반영 |
| [project-playbook/CURRENT.md](project-playbook/CURRENT.ko.md) | 현재 목표, 제약, 근거 | Bootstrap으로 만들거나 문서를 직접 조정 |
| [codex-home](codex-home/README.ko.md) | 선택형 개인 기본 설정 | 프로젝트 규칙과 구분해 검토하고 기존 선호 보존 |

## 적용 순서

실제 기술 환경, 기존 정책, 현재 기록을 먼저 확인합니다. 새 플레이북은 `aapb bootstrap "<project>" --dry-run`으로 미리 보고, 옵션을 빼서 적용합니다. CLI가 관리 정보를 올바르게 만들며 루트 지침을 보존합니다.

CURRENT.md만 직접 복사했다면 일반 사용자 문서입니다. 문서를 복사했다고 관리 소유권이 확인되는 것은 아닙니다. 이전을 허용하려고 해시를 만들어 넣지 마세요. 상세 결정, 계약, 인수인계는 필요할 때 기존 프로젝트 위치에 추가합니다.

루트 정책에는 적용할 규칙과 관련 기록의 시작 위치를 둡니다. 제품 요구사항을 모든 정책에 반복하지 말고 프로젝트 문서에 남기세요. [기록 구조](../docs/structured-playbook-layout.ko.md), [기존 저장소 적용](../docs/existing-repository-bootstrap.ko.md), [인수인계 예시](../examples/handoffs/api-contract-handoff-example.ko.md)를 참고할 수 있습니다.
