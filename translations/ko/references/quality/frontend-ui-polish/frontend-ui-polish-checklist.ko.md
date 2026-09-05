# Frontend UI Polish Checklist

## 제품 적합성

- Product type에 맞춥니다. Operational tool은 dense, calm, scan-friendly해야 합니다. Consumer, portfolio, marketing surface는 요청이 있을 때 더 표현적으로 만들 수 있습니다.
- 기존 navigation, information architecture, primary workflow를 알아볼 수 있게 유지합니다.
- 부가 장식보다 현재 작업 흐름을 먼저 개선합니다.

## 레이아웃과 위계

- 첫 화면이 대상 workflow에 바로 쓸모 있어야 합니다.
- Control, board, toolbar, counter, grid, card, fixed-format area에는 stable dimension을 둡니다.
- 일반 viewport width에서 text, icon, label, control, dynamic content가 겹치지 않게 합니다.
- Utilitarian interface에는 nested card, decorative wrapper, 불필요한 section chrome을 피합니다.
- 익숙한 command에는 icon을 쓰고, 짧은 label은 명확성을 높일 때만 사용합니다.

## 상태

- Component가 노출하는 loading, empty, error, disabled, selected, focus, hover, long-content state를 확인합니다.
- Destructive, irreversible, high-risk action은 routine action과 시각적으로 구분합니다.
- 프로젝트에 이미 있는 keyboard와 screen-reader affordance를 보존합니다.

## 반응형 동작

- 프로젝트가 지원하는 mobile, tablet, desktop breakpoint를 확인합니다.
- 긴 label, table cell, button, form, dialog, sidebar, navigation item을 검증합니다.
- Viewport width에 따라 text를 줄이는 방식보다 wrapping, truncation, layout change를 우선합니다.

## 스타일 시스템

- 새 styling을 추가하기 전에 shared component, token, variant, class convention, utility pattern을 재사용합니다.
- 일회성 color system, 임의 spacing scale, local component fork를 피합니다.
- 명확한 style system이 없으면 가까운 component pattern을 따르고 변경을 local하게 유지합니다.

## 검증

- 관련이 있으면 project-defined lint, type, test, build command를 실행합니다.
- 보이는 변경은 browser 또는 rendered UI로 확인합니다.
- 실제로 확인한 viewport, state, command만 보고합니다.
