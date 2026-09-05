# 문서 지도

현재 목적에 맞는 안내부터 읽으세요. 사람용 문서 전체를 에이전트가 시작할 때 읽어야 하는 것은 아닙니다. 제품 소개는 [메인 README](../README.ko.md)에 있습니다.

## 어디서 시작하면 되나요?

| 현재 상황 | 읽는 순서 |
| --- | --- |
| 처음 사용함 | [처음 10분 사용법](quick-start.ko.md) → [명령어 가이드](commands.ko.md) |
| 0.5 설치본을 사용 중 | [설치·이전·복구](lifecycle.ko.md) → [기존 저장소 적용](existing-repository-bootstrap.ko.md) → [스킬 이전표](skill-decisions.ko.md) |
| 작업 재개나 인수인계가 필요함 | [기록 구조](structured-playbook-layout.ko.md) → [템플릿](../templates/README.ko.md) |
| 에이전트 앱에 연결하려 함 | [MCP 설정](mcp-permission-model.ko.md) → [응답 크기](record-responses.ko.md) → 사용하는 앱의 어댑터 안내 |
| 게시 전에 시험하려 함 | [로컬 시연](demo.ko.md) → [검증 보고서](verification.ko.md) → [배포 점검표](publishing-checklist.ko.md) |

## 사용법과 연동

- [명령어 가이드](commands.ko.md): 문법, 쓰기 여부, 결과, 오류, 구버전 명령의 대체 방법.
- [설치·업데이트·복구](lifecycle.ko.md): 패키지와 스킬의 설치, 갱신, 삭제, 이전, 복원.
- [기존 저장소에 적용하기](existing-repository-bootstrap.ko.md): 기존 기록 점검과 프로젝트 지침 보존.
- [프로젝트 기록 구조](structured-playbook-layout.ko.md): 현재 사실, 상세 문서, 관리 파일 구분, 작성 예시.
- [MCP 설정](mcp-permission-model.ko.md): 프로젝트에 연결하는 읽기 전용 도구 네 개.
- [에이전트의 도구 활용](agent-usage.ko.md): 스킬·MCP·문서 점검을 사용할 수 있게 하는 방법과 실제 활용 확인.
- [응답 크기와 이어 읽기](record-responses.ko.md): 긴 문서와 목록을 다루는 CLI/MCP 예시.
- [Forge 협업](forge-automation.ko.md): GitHub/Gitea 계획, 적용, 충돌, 재시도.
- [실행 환경](runtime-engines.ko.md): Node와 선택형 Python 설정.
- [UI와 문서 품질 검토](quality-review.ko.md): 검토 방법과 자동 점검의 한계.
- [Codex](../adapters/codex/README.ko.md), [Claude Code](../adapters/claude-code/README.ko.md): 앱별 설정.
- [로컬 패키지 시연](demo.ko.md): 기존 프로젝트를 보존하며 미게시 압축 파일을 시험하는 방법.

## 스킬과 참고 자료 선택

- [스킬 카탈로그](skill-catalog.ko.md): 프로필, 사용 상황, 개별 선택.
- [기능 선택 기준](capability-taxonomy.ko.md): 현재 작업에 부족한 지침 고르기.
- [스킬 이전표](skill-decisions.ko.md): 이전 94개 진입점의 이동 위치. 도구용 [JSON 대응표](../../../docs/skill-decisions.json)도 제공.
- [참고 자료 활용](reference-adoption.ko.md), [참고 자료 모음](../references/README.ko.md): 필요한 예시와 예외 사항 찾아보기.
- [템플릿](../templates/README.ko.md), [콘텐츠 분류](classification.ko.md): 복사할 것, 설치할 것, 읽기만 할 것 구분.
- [공통 환경 구성](environment-profiles.ko.md): AAPB 관리 범위와 다른 도구 설치 상태 구분.
- [외부 작업 절차 도구](superpowers-integration.ko.md): 선택형 연동과 지침 충돌 검토.

## 구조 이해·기여·배포

- [저장소 맥락](../CONTEXT.ko.md), [런타임 구조](harness-runtime.ko.md): 용어, 데이터 흐름, 기능 범위.
- [1.0 변경사항과 이전 버전](redesign.ko.md): 개편 이유와 근거의 한계.
- [검증 보고서](verification.ko.md): 실제 검사, 제한된 비교 결과, 미검증 사항.
- [정식 버전 준비](runtime-roadmap.ko.md), [배포 점검표](publishing-checklist.ko.md): 사전 릴리스에서 정식 버전으로 넘어가는 조건.
- [유지보수](maintenance.ko.md), [번역 정책](translation-policy.ko.md): 편집, 보존 기준, 필요한 검사.
- [변경 기록](../CHANGELOG.ko.md): 버전별 변경 사항.

`forge-automation.md` 같은 예전 파일명은 기존 링크를 유지하기 위해 남겨 둡니다. 내용은 현재 지원하는 협업 기능과 종료된 자동화를 구분해서 설명합니다. 과거 참고 자료의 명령은 실행 전에 현재 명령어 가이드에서 확인하세요.
