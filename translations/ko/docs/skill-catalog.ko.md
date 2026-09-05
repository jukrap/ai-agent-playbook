# 스킬 카탈로그

필요한 문서 형식, 제품 제약, 분야별 계약을 제공할 때 스킬을 선택합니다. 스킬은 작업 지침이며 실행 도구나 권한 부여 수단이 아닙니다. 스킬을 설치하지 않고 같은 기록 파일을 사용하는 것도 가능합니다.

## 프로필

| 프로필 | 포함하는 스킬 |
| --- | --- |
| `core` (기본값) | `project-memory`, `spec-artifacts` |
| `development` | Core + `design-brief-direction`, `ui-polish`, `natural-writing-humanization` |
| `legacy` | `legacy-contracts` 하나 |

## 사용 상황과 요청 예시

| 스킬 | 필요한 상황 | 요청 예시 |
| --- | --- | --- |
| `project-memory` | 현재 사실, 결정, 근거, 재개 지점을 정리할 때 | 테스트 결과와 다음 할 일을 CURRENT.md에 반영해 줘 |
| `spec-artifacts` | 명세, ADR, 계약, 인수인계의 구체적인 형식이 필요할 때 | 예시와 호환 조건이 있는 API 계약을 작성해 줘 |
| `design-brief-direction` | 제품 목적, 브랜드, 참고 사례, 정보 밀도를 정할 때 | 정보가 많은 운영 화면의 디자인 방향을 잡아 줘 |
| `ui-polish` | 이미 렌더링된 UI를 개선하거나 검토할 때 | 티켓 디자인을 유지하면서 키보드 이동과 간격을 다듬어 줘 |
| `natural-writing-humanization` | 사실과 문체를 보존하며 한국어·영어 글을 편집할 때 | 명령·수치·존댓말을 유지하면서 안내를 읽기 쉽게 고쳐 줘 |
| `legacy-contracts` | 오래된 기술 환경의 동작·호환 계약을 보존할 때 | 서버 렌더링 페이지 수정 전에 폼 전송과 인쇄 동작을 확인해 줘 |

선택한 SKILL.md를 읽고 필요한 경우에만 안의 참고 자료를 봅니다. 한국어 문장 예시는 자동 치환 규칙이 아닙니다. 레거시 참고 자료도 실제 기술 환경에 맞는 것을 고릅니다. 코드 정리는 선택형 참고 자료의 `quality/cleanup-ai-slop`에 별도로 보존합니다.

## 설치·확인·조합

```sh
aapb skills list --json
aapb skills install --profile development --dry-run --json
aapb skills install --skill project-memory --skill legacy-contracts --dry-run --json
```

`--skill`은 프로필에 추가되는 옵션이 아니라 프로필 대신 직접 목록을 지정하는 옵션입니다. 개발 프로필에 레거시를 더하려면 development를 설치한 다음 `--skill legacy-contracts`를 따로 설치하세요. 일반 설치는 다른 설치본을 삭제하지 않습니다. 갱신·확인·삭제 때도 해당 선택을 사용합니다. [설치 안내](lifecycle.ko.md)를 참고하세요.

기본 설치 위치는 `.agents/skills`입니다. 소스의 여섯 진입점, 선택해서 설치한 수, 앱이 검색하거나 대화에 넣은 수는 서로 다릅니다. 파일 설치 성공만으로 앱이 이름을 불러왔다고 판단하지 않습니다.

## 이전 스킬은 어디로 갔나요?

[94개 항목의 이전표](skill-decisions.ko.md)에 구버전 이름, 판정, 참고 자료 위치, 복구 경로가 있습니다. 일반 작업 절차와 호환용 이름을 중복 SKILL.md로 다시 설치하지 않습니다. 고유한 분야별 예시는 [선택형 참고 자료](../references/README.ko.md)에 남아 있습니다.

정해진 개수에 맞추기보다 현재 부족한 기능을 기준으로 선택하세요. 지침·실행 도구·앱 연동의 차이는 [기능 선택 기준](capability-taxonomy.ko.md)에서 설명합니다.
