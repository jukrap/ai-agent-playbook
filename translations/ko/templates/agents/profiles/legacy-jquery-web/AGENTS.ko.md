# AGENTS.md
# Legacy jQuery Web Profile

jQuery, plugin, 직접 DOM 조작, global script 중심의 레거시 브라우저 프로젝트에 사용합니다.

## 시작 규칙

- active HTML/template, script include 순서, globals, server rendering 여부를 먼저 확인합니다.
- build tool이 없을 수 있습니다. README, 배포 흐름, 운영 파일 위치를 확인합니다.
- selector, event delegation, plugin initialization, global side effect를 추적합니다.
- 작은 변경을 선호합니다. rewrite를 기본 선택지로 두지 않습니다.

## 변경 전략

- 기존 DOM 구조와 class/id contract를 유지합니다.
- 건드릴 selector는 모두 `rg`로 검색합니다.
- duplicate event handler, initialization order, AJAX callback, modal, table, plugin lifecycle을 확인합니다.
- 프로젝트의 기존 jQuery/plugin style에 맞춥니다.
- 기존 namespace 또는 module pattern이 있다면 새 global을 피합니다.

## UI와 styling

- 프로젝트가 실제로 쓰는 방식인 inline style, class toggle, existing CSS file을 따릅니다.
- inline style preference가 project-local rule이면 존중합니다.
- table width, long text, small monitors, IE, old browser requirements를 확인합니다.

## 검증

- 자동 테스트가 없으면 실제 page를 열고 changed click/input/AJAX flow를 실행하며 console/network output을 봅니다.
- 새 syntax 사용 전 old browser support를 확인합니다.
- 변경한 selector와 연결된 화면을 최소 하나 이상 수동 확인합니다.

## Git과 worklog

- 레거시 작업은 숨은 영향 범위가 크므로 변경 이유, 확인한 화면, 남은 위험을 worklog에 남깁니다.
- local-only docs와 generated output은 staged changes에 넣지 않습니다.
