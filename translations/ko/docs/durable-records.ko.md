# 다음 세션에도 이어 쓸 기록 남기기

현재 목표, 재사용할 지식과 의미 있는 진척의 상세 근거를 일반 파일에 남깁니다. 기록에는 Git, MCP 연결이나 모델 실행기가 필요하지 않습니다. 유용한 이력을 다시 만드는 대신 기존 프로젝트 위치와 로컬 전용 규칙을 지킵니다.

## 기록마다 역할 정하기

| 기록 | 담을 내용 | 갱신 시점 |
| --- | --- | --- |
| CURRENT.md | 현재 목표, 중요한 제약, 확인한 진척, 다음 행동과 링크 | 현재 상태나 다음 행동이 바뀔 때 |
| 주제별 지식 | 현재 규칙, 용어, 계약, 적용 저장소, 출처, 확인 날짜와 확정·가정·미확인 상태 | 오래 사용할 사실이 확인되거나 대체될 때 |
| 작업 일지 | 배경, 문제, 판단 근거, 바뀐 동작, 영향받은 저장소, 결정, 가정, 정확한 검사·결과, 미검증 범위와 남은 일 | 단계 완료, 중요한 발견·결정, 차단·중단·인계 시점 |

CURRENT.md는 쉽게 재개할 수 있을 만큼 짧게 유지합니다. 작업 일지를 커밋 제목 수준으로 줄이지 말고 결과를 설명하는 명령, 근거 위치, 수치와 한계를 보존하세요. 지식 문서는 그 사실을 확인한 작업 일지와 연결합니다. 월별 폴더는 이력을 정리하는 방식이며 월간 요약이나 매 응답 기록을 요구하지 않습니다.

## 기록 위치 준비하기

```sh
ai-agent-playbook bootstrap --records standard --exclude none --agents preserve --lang ko --dry-run --json
ai-agent-playbook bootstrap --records standard --exclude none --agents preserve --lang ko --json
```

표준 구성은 작업 일지와 지식 안내가 없으면 추가합니다. 최소 구성도 계속 사용할 수 있으며 작성 명령은 처음 필요할 때 폴더를 만듭니다. 기존 CURRENT.md, 지식, 작업 일지와 메타데이터는 보존합니다. 등록된 작업 공간에서는 작성 전에 [공통 출처 또는 구성원의 로컬 출처](workspaces.ko.md)를 선택하세요.

## 작업 일지 만들기

```sh
ai-agent-playbook worklog new --title "CSV export verification" --topic csv-export --lang ko --dry-run --json
ai-agent-playbook worklog new --title "CSV export verification" --topic csv-export --lang ko --json
```

결과에는 `path`, `content`, `metadata`, `lang`과 쓰기 여부가 포함됩니다. 선택한 플레이북을 기준으로 반환된 경로를 열고 템플릿의 안내를 실제 근거로 채웁니다. 명령은 문서의 틀을 만들며 대화 이력을 수집하거나 테스트를 실행하거나 사실을 추론하지 않습니다.

새 일지는 `worklogs/YYYY-MM/`을 사용하고 파일명에 날짜, 시간, 고유 ID와 제목을 포함합니다. 설정된 작업 일지 위치나 기존 레거시 `workflows/worklogs/`가 있으면 그 위치를 우선합니다. 배타적으로 생성하므로 동시에 작성해도 서로의 일지를 덮어쓰지 않습니다. 미리보기의 ID와 파일명은 나중의 실제 생성에 예약되지 않으므로 적용 결과가 반환한 경로를 사용하세요.

`--date YYYY-MM-DD`로 일지를 정리할 날짜를 고릅니다. 생략하면 현재 UTC 날짜를 사용합니다. `createdAt`에는 실제 생성 시각을 계속 남깁니다. `--lang en|ko`는 템플릿 언어를 선택하며, 생략하면 선택한 기록 manifest의 언어를 사용하고 없으면 영어를 사용합니다. `--repo <id>`는 등록된 작업 공간 구성원을 표시합니다. 반환된 `repos` 메타데이터를 확인하세요. 이 옵션들은 코드나 Git 대상을 바꾸지 않습니다.

## 지식 만들고 유지하기

```sh
ai-agent-playbook knowledge new --title "CSV export contract" --topic csv-export --lang ko --dry-run --json
ai-agent-playbook knowledge new --title "CSV export contract" --topic csv-export --lang ko --json
```

지식 문서는 `knowledge/` 아래 주제에 따른 파일명을 사용합니다. 기존 주제는 보존하며 중복 생성을 거부하므로 해당 문서를 직접 검토해 편집하세요. 현재 규칙, 범위와 출처, 확인 시점, 가정이나 미확인 사항을 기록합니다. 현재 코드는 구현의 근거이고 채택한 계약은 의도한 동작을 설명합니다. 중요한 차이를 기록하며 과거 요약으로 어느 한쪽을 자동 교체하지 않습니다.

작성 명령은 필터링용 `aapb-record` 메타데이터 주석을 남깁니다. 편집할 때 식별자와 저장소·주제 필드를 보존하세요. 모든 과거 문서에 메타데이터를 추가하지 않아도 기존 기록을 계속 읽을 수 있습니다.

## 필요한 근거만 찾기

```sh
ai-agent-playbook worklog list --topic csv-export --month 2026-09 --page-size 5 --json
ai-agent-playbook records search --query "CSV" --path knowledge --kind knowledge --json
ai-agent-playbook records search --query "CSV" --kind worklog --month 2026-09 --json
```

작업 공간 안에서는 `--repo web`로 구성원에 해당하는 기록을 필터링하거나 `--record-source repo:web`로 구성원의 기존 로컬 출처를 읽을 수 있습니다. 두 선택은 다릅니다. 이어 볼 때는 같은 출처, 필터, 검색어·보기와 반환된 커서를 사용하고 총수와 불완전한 조사 범위 경고를 확인합니다. `worklog list`는 `--max-chars`와 `--cursor`도 지원합니다. 월 필터는 월별 폴더와 `workflows/worklogs/2026-09-01-review.md` 같은 평면형 과거 날짜 파일을 함께 다루므로 기존 파일을 옮길 필요가 없습니다. 기록 검색은 무관한 `repos/<id>/` 디렉터리를 본문 읽기 전에 제외합니다. 검색의 `--kind`는 `current`, `knowledge`, `worklog`, `other`를 받습니다. 작성할 때 지정한 제목과 주제는 본문 검색식이 아닙니다.

CURRENT.md부터 읽고 관련 지식과 작업 일지 링크를 따라갑니다. 근거가 부족할 때만 검색을 넓히세요. 전역 참고 자료가 있다고 해서 전체 이력을 읽을 필요는 없습니다. 메타데이터 필터에서 찾지 못했다고 해서 표식 없는 과거 기록에도 없다고 판단하지 않습니다. 제한된 페이지와 원본 변경 시 커서 처리 방식은 [응답 크기 안내](record-responses.ko.md)에 있습니다.

## 근거를 보존하며 협업하기

공통 CURRENT.md와 채택한 지식 문서는 담당자를 하나씩 정합니다. 병렬 작업자는 독립적인 일지나 별도 DRAFT 파일을 작성하고 메인이 검토한 뒤 반영할 수 있습니다. 기록은 보통 메인 작업에서 직접 작성합니다. 호스트가 지원한다면 길고 독립적인 초안을 범위를 정한 사실과 짧은 관련 이력으로 위임할 수 있습니다.

초안을 채택하기 전에 경로, 소스 범위, 수치, 명령, URL, 결정과 미확인·미검증 상태를 원래 근거와 대조합니다. 역할 지침은 파일 권한을 강제하지 않습니다. 사용자의 모델과 추론 강도 선택을 보존하세요. [Codex 모델 사용](../adapters/codex/model-use.ko.md)은 자동 예약기나 고정 대기 설정 없이 Astra와 Sol의 `xhigh`, `max` 선택까지 다룹니다.

프로젝트 필수 검사와 변경된 계약의 검증을 실행합니다. 관련 입력과 실행 조건이 같고 프로젝트가 허용할 때만 통과한 근거를 재사용합니다. 설정, 로딩, 호출과 실제 동작 검증을 구분하세요. 비공개 원시 근거는 허용된 로컬 기록에 두고 작업 일지를 만들었다는 이유로 게시하지 않습니다.
