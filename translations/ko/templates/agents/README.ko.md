# 특정 기술에 묶이지 않는 프로젝트 지침

[AGENTS.md](AGENTS.ko.md)를 출발점으로 삼아 실제 저장소에 맞게 조정하세요. 적용할 규칙과 실제 결정 문서의 링크를 남깁니다. AAPB는 FSD, 특정 패키지 관리자나 폴더 트리를 요구하지 않습니다.

이 디렉터리는 프로젝트 지침용입니다. 개인 Codex 기본 지침은 [codex-home](../codex-home/README.ko.md)에 있습니다. AAPB의 `core`, `development`, `legacy` 스킬 프로필은 재사용 지침을 고르며 프로젝트 아키텍처를 정하지 않습니다.

## 템플릿 적용 방법

1. 기존 루트·하위 디렉터리 지침과 관련 설정을 읽습니다.
2. 저장소에서 채택한 규칙과 사용자 편집을 보존합니다. 루트 지침이 없고 필요하다면 템플릿을 조정해 작성합니다. 설치 도구가 관리하는 파일로 취급하지 않습니다.
3. 이 프로젝트에서 일할 때 도움이 되는 실제 명령과 링크를 추가합니다. 예시 파일명이나 추측한 명령을 필수 조건으로 남기지 않습니다.
4. 상세 아키텍처는 기존 문서에 둡니다. 각 부분의 역할, 의존성 방향, 예외와 재검토 조건을 기록합니다.
5. 필요할 때 부트스트랩으로 프로젝트 기록을 만듭니다. 부트스트랩은 루트 지침을 보존하며 이 템플릿을 자동으로 복사하지 않습니다.

새 구조, 기존 구조와 구조 변경은 [프로젝트 아키텍처 안내](../../docs/project-architecture.ko.md)를 참고하세요. 채택한 아키텍처도 바뀔 수 있습니다. 템플릿으로 이상적인 폴더 트리를 고정하지 않습니다.

## 이전 템플릿의 이동 위치

기술별 루트 지침 파일은 제거했습니다. 유용한 분야별 계약은 선택형 참고 자료로 보존하고, 중복된 시작·Git·작업 일지 절차는 기술 중립 템플릿과 프로젝트 규칙으로 정리했습니다.

| 이 디렉터리에서 제거한 경로 | 현재 위치 |
| --- | --- |
| `global/AGENTS.md` | [기술 중립 프로젝트 지침](AGENTS.ko.md). 예전 이름도 개인 전역 파일을 뜻하지는 않았음 |
| `profiles/react-vite-fsd/AGENTS.md` | [아키텍처 선택](../../docs/project-architecture.ko.md), [기능 경계](../../references/architecture/feature-slice-boundary/feature-slice-layering.ko.md)와 아래 UI·데이터 참고 자료 |
| `profiles/react-native-expo/AGENTS.md` | [네이티브 UI와 데이터 경계](../../references/mobile/native-release-readiness/native-ui-and-data.ko.md) |
| `profiles/legacy-jquery-web/AGENTS.md` | [jQuery 계약](../../references/legacy/legacy-jquery-web/jquery-browser.ko.md) |
| `profiles/legacy-server-rendered-web/AGENTS.md` | [서버 렌더링 폼](../../references/legacy/legacy-server-rendered-web/server-rendered-legacy-flow.ko.md) |
| `profiles/legacy-android-webview-hybrid/AGENTS.md` | [WebView와 브리지 계약](../../references/legacy/legacy-android-webview-hybrid/android-webview-hybrid.ko.md) |

프론트엔드 스타일, 상태와 응답 계약의 상세 내용은 [스타일 정책](../../references/frontend/style-policy-selection/style-policy-selection.ko.md), [상태 관리 주체](../../references/frontend/frontend-state-data-flow/state-ownership.ko.md), [API 경계 검사](../../references/backend/api-contract-boundary/api-boundary-checklist.ko.md)에 있습니다. 관련된 자료만 읽으세요. 레거시 계약은 선택형 [레거시 스킬](../../skills/legacy/legacy-contracts.ko.md)에서도 제공합니다.

이미 프로젝트에 복사한 지침은 삭제하거나 교체하지 않습니다. 조정할 때 프로젝트 고유의 편집을 보존하세요. 이전 템플릿은 0.5.11 패키지와 Git 이력에 남아 있습니다. 현재 부트스트랩 사용법은 [기존 저장소 적용](../../docs/existing-repository-bootstrap.ko.md)에 있습니다.
