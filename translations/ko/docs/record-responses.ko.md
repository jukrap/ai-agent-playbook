# 응답 크기와 이어 읽기

AAPB는 보통 짧은 상태 요약이나 크기가 제한된 문서 일부를 반환합니다. 작업에 필요한 만큼 더 요청하면 됩니다. 여기서 설명하는 한도는 도구 응답에 적용되며, 에이전트 앱의 문맥 크기나 출력 토큰 설정을 바꾸지 않습니다.

## 얼마나 요청하면 좋을까요?

| 상황 | 요청 방법 |
| --- | --- |
| 현재 시작 문서만 찾고 싶음 | 상태 조회의 기본 `summary` 사용 |
| 짧은 문서를 읽으려 함 | 기본 12,000자 크기로 읽기 |
| 관련 근거를 찾으려 함 | 문구를 검색한 뒤 해당 파일 읽기 |
| 긴 문서를 다루려 함 | 줄 범위를 지정하거나 반환된 커서로 이어 읽기 |
| 기록이나 문제가 많음 | `pageSize` / `maxResults`로 항목 단위 페이지 조회 |

서버는 현재 대화에 남은 토큰을 알 수 없습니다. 호출하는 쪽에서 작업과 결과를 보고 크기를 정합니다. 더 큰 본문을 요청할 수는 있지만, 매번 최대 크기로 요청하면 불필요한 내용도 늘어납니다.

## CLI에서 문서 이어 읽기

```sh
ai-agent-playbook records read "<project>" --path CURRENT.md --max-chars 700 --json
ai-agent-playbook records read "<project>" --path CURRENT.md --cursor "<nextCursor>" --max-chars 2000 --json
```

`<nextCursor>`는 첫 결과의 실제 `nextCursor` 값으로 바꿉니다. `truncated`가 false이고 다음 커서가 없을 때까지 반복합니다. 다음 요청의 크기는 달라도 됩니다. 원문을 재구성하려면 각 결과의 `content`를 구분자 없이 순서대로 붙입니다.

처음부터 일부 줄만 읽으려면 `--start-line 10 --end-line 40`을 사용합니다. 이어 읽을 때는 같은 경로와 커서만 넘기고 줄 옵션은 빼세요. 선택한 범위는 커서가 이미 기억합니다.

## 목록과 검색 결과 이어 보기

```sh
ai-agent-playbook records status "<project>" --view records --page-size 5 --json
ai-agent-playbook records status "<project>" --view records --page-size 5 --cursor "<page.nextCursor>" --json
ai-agent-playbook records search "<project>" --query "API decision" --max-results 3 --json
ai-agent-playbook records search "<project>" --query "API decision" --max-results 3 --cursor "<page.nextCursor>" --json
```

목록의 다음 커서는 `page.nextCursor`에 있습니다. 같은 보기를 유지하고, 검색은 같은 검색어도 다시 넘깁니다. 상태는 `summary`, `records`, `warnings`, 검증은 `issues`(기본값), `summary`, `warnings`, 검색은 `results`(기본값), `warnings`를 제공합니다.

각 페이지에는 검사한 범위의 총수와 검사 완료 여부가 남습니다. 현재 페이지에 새로운 문제가 없더라도 실패한 검증이 성공으로 바뀌지는 않습니다. 반환된 페이지를 모두 읽었다고 원래 건너뛴 범위까지 검사한 것은 아닙니다.

## MCP에서 같은 요청하기

`aapb_read`에 다음 인자를 보냅니다.

```json
{"path":"CURRENT.md","maxChars":700}
```

그다음 반환된 커서를 사용합니다.

```json
{"path":"CURRENT.md","cursor":"<nextCursor>","maxChars":2000}
```

MCP 인자는 `maxChars`, `pageSize`, `maxResults`, `startLine`, `endLine`처럼 쓰고, CLI 옵션은 하이픈으로 구분합니다. 다른 공개 도구는 `aapb_status`, `aapb_search`, `aapb_validate`입니다. 이전 사전 릴리스의 `playbook_*` 이름은 더 이상 표시하지 않습니다.

## 원문 보존과 편집 후 커서

읽기는 문장과 줄바꿈을 보존합니다. UTF-8 BOM은 텍스트 출력에서 빼지만 원본 해시는 실제 파일 바이트를 기준으로 합니다. 위치와 글자 수는 JavaScript의 UTF-16 단위입니다. 일부 이모지는 두 단위를 차지하며 그 중간에서 자르지 않습니다. 검색에는 원본 경로, 줄 번호, 검색어 주변 문장이 나옵니다.

커서는 프로젝트, 작업 종류, 검색어·보기, 검사한 내용에 연결됩니다. 원본이 바뀌거나 요청이 맞지 않으면 처음부터 다시 조회하세요. 커서를 편집하거나 다른 프로젝트로 바꾸는 용도로 쓰지 않습니다. 매번 같은 파일 경계를 확인하므로 커서가 별도 권한을 주지는 않습니다.

## 본문 크기와 전송 한도

| 제한 | 값 | 뜻 |
| --- | --- | --- |
| 기본 본문 | 12,000자 | `maxChars`로 조절 |
| 최대 본문 | 100,000자 | 요청할 텍스트·목록 크기이며 토큰 수가 아님 |
| 목록 페이지 | 기본 20개, 최대 100개 | 항목을 온전히 반환. 검색은 `maxResults` 사용 |
| MCP 결과 전체 | UTF-8 기준 256 KiB | 텍스트·구조화 표현과 부가 정보 포함, JSON-RPC 봉투 제외 |
| 파일 하나 | 500,000바이트 | 읽을 수 있는 기록 파일의 크기 |
| 탐색 | 2,000개 항목 | 파일시스템을 살펴보는 범위 |
| 텍스트 검사 | 요청당 32 MB | 합산 검사 크기 |
| 검색 결과 / 검증 문제 | 각각 10,000개 | 검사 상한에 도달하면 불완전한 검사로 표시 |

결과 전체의 상한은 지나치게 큰 응답을 막는 마지막 제한입니다. MCP가 텍스트와 구조화된 결과를 함께 담을 수 있어 본문 크기와 따로 계산합니다. 매번 256 KiB 가까이 출력하라는 뜻은 아닙니다. 목록 항목 하나도 온전히 담을 수 없으면 깨진 JSON 대신 조정 방법을 알 수 있는 오류를 반환합니다. 요청 범위를 좁히거나 해당 크기를 조절하세요.

검사 정보와 경고에는 건너뛰었거나 읽지 못한 범위가 남습니다. 응답을 줄이려고 원본을 다시 쓰거나 자동 요약하거나 캐시·임시 보고서 파일을 만들지 않습니다. 검증의 `runtimeVerified`는 항상 false입니다.

이어 읽기는 AAPB 도구의 인자와 결과에 정의된 기능입니다. MCP 프로토콜의 목록 페이지 기능이 `tools/call` 결과를 자동으로 나누지는 않습니다. 검증 범위는 [런타임 구조](harness-runtime.ko.md)와 [시연 안내](demo.ko.md)에서 확인할 수 있습니다.
