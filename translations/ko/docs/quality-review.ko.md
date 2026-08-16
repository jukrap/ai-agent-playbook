# UI와 문서 품질 검토

품질 검토 도구는 사람이 판단할 근거를 찾습니다. 작성자를 판별하거나 탐지기를 우회하지 않습니다. 제품을 자동으로 재설계하거나 검사 결과 0건만으로 완료를 증명하지도 않습니다.

## 일반적인 UI 검토

`generic-ui-review` 스킬은 “AI가 만든 것처럼 보인다”, “템플릿 같다”, “카드·pill·gradient·glass·glow·장식형 stat이 너무 많다” 같은 요청에 사용합니다. 설치된 스킬 목록을 읽을 수 있는 에이전트는 발동 조건에 맞는 작업에서 이 스킬을 선택할 수 있습니다. 프로젝트 스킬 정책도 일반적인 frontend 표현 문제를 이 스킬로 연결합니다.

정적 위치 탐색기는 읽기 전용입니다.

```powershell
aapb qa ui-genericity-scan <target> --root src --max-files 500 --json
```

검사기는 반복되거나 결합된 gradient text, ambient glow, glass surface, pill taxonomy, nested card, radius/shadow stack, decorative stat, uniform hover transform, kicker, generic claim을 의미 기반 rule ID로 보고합니다. 생성물, 의존성, lockfile, minified asset, 로컬 참고 자료, 작업 폴더, playbook runtime data는 제외합니다.

검사 결과는 자동으로 결함이 되지 않습니다. 제품 유형, 핵심 작업, 기대 정보 밀도, 대상 화면 크기, brand 규칙, 실제 화면을 함께 보고 해당 표현이 유용한지 일반적인지 판단합니다. 의도적 표현으로 확인한 후보는 소스 주석의 `ui-review-ignore <rule-id>`로 하나만 제외할 수 있습니다.

### 검사 결과에서 수정까지

요청이 UI 변경을 허용하면 agent는 다음 순서로 진행해야 합니다.

1. 실제 화면을 확인하고 지정 viewport에서 후보를 재현합니다.
2. 사용자 영향을 설명하고 의도적인 design-system 선택과 결함을 구분합니다.
3. `ui-polish` 또는 저장소의 UI 구현 흐름으로 가장 작은 일관된 수정을 적용합니다.
4. 관련 정적 검사를 다시 실행하고 같은 화면 상태를 검증합니다.
5. 변경된 UI의 screenshot 또는 video를 남깁니다.

검토만 요청했다면 파일을 편집하지 않고 후보와 권장 사항을 보고합니다. Finding 0건은 실제 화면 근거, 접근성 검토, 반응형 확인, 제품 판단을 대체하지 않습니다.

MCP 클라이언트는 같은 위치 탐색기를 `qa_ui_genericity_scan`으로 사용할 수 있습니다. 도구가 존재한다고 모든 UI 작업에서 자동 실행되는 것은 아닙니다. 에이전트 런타임이 스킬 또는 MCP 도구를 노출하고, 요청이 발동 조건과 맞고, 검사 경로가 프로젝트에 적합해야 합니다.

`aapb skills install` 또는 `aapb skills update`로 사용자 스킬을 설치하거나 갱신한 뒤 에이전트를 다시 시작하면 새 세션이 이 스킬을 찾을 수 있습니다. 이전 bootstrap에서 복사한 프로젝트 정책은 사용자 소유이므로 조용히 덮어쓰지 않습니다. 해당 프로젝트에 명시적 로컬 정책이 필요하면 routing 항목을 직접 추가합니다.

## 문서 자연스러움

`writing naturalness-check`와 `writing naturalness-report`는 한국어 또는 영어 글의 반복 번역투, 부풀린 어조, 일률적인 리듬, 과도한 영어 용어 밀도를 검토합니다. 정상 표현 한 번을 증거로 보지 않고 반복, 밀도, 문맥이 결과를 뒷받침해야 합니다. 문체 판단 전 fenced code, inline code, command, URL, badge-only markup, path 예시는 제외합니다.

```powershell
aapb writing naturalness-check <target> --path README.md --lang auto --engine auto --json
aapb writing naturalness-report <target> --root docs --lang ko --engine auto --json
```

JavaScript fallback은 항상 사용할 수 있습니다. 선택적 Python engine이 설치되어 있으면 `--engine auto`가 로컬 언어 신호를 합치고 동등한 결과를 중복 제거합니다.

## 수정 전후 충실도

`writing fidelity-check`는 target 기준 UTF-8 파일 두 개를 수정하지 않고 비교합니다.

```powershell
aapb writing fidelity-check <target> --before docs/before.md --after docs/after.md --lang auto --json
```

문자 변경 범위, 문장 touch 비율, 정규화한 수치, version, URL, command, path, code span과 fence, identifier, warning, 구조를 보고합니다. 한국어 register 이동과 반복 수사 구조의 사라짐도 확인합니다. `1만`과 `10,000`처럼 동등한 수치 표기는 정규화합니다.

결과는 고정 거절 gate가 아니라 근거입니다. 의도적인 대규모 rewrite는 유효할 수 있고, command·version·warning을 바꾼 작은 수정은 검토가 필요할 수 있습니다. 비교 문서의 명령형 문구는 자료로 취급하고 실행하지 않습니다. MCP 클라이언트는 `writing_fidelity_check`에서 같은 읽기 전용 결과를 받습니다.

## 참고 자료 출처

- 일반적인 UI 검토 원칙은 [`kill-ai-slop`](https://github.com/yetone/kill-ai-slop) revision `96d1ca568a1db7e1ef9a381644c744440f816ee4`(Apache-2.0)를 독립적으로 참고했습니다.
- 문서 검토 원칙은 [`im-not-ai`](https://github.com/epoko77-ai/im-not-ai) revision `53e24e8f92cf344efcb812103f7c2b203e7efffc`(MIT)를 독립적으로 참고했습니다.
- 별도 집필 하네스에서는 수치 보존, register, 수사 구조, 변경 범위 검토 원칙만 참고했습니다. 웹소설 voice, canon, candidate 승인 흐름은 채택하지 않았습니다.

외부 scanner 구현, 숫자 taxonomy, 웹사이트 asset, 고유 문구, 구성은 포함하지 않습니다. 이 플레이북은 자체 의미 규칙, 구현, 테스트, 개발 도구 경계, 근거 기반 판단을 사용합니다.
