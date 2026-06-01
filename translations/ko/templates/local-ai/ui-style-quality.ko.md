# UI Style Quality

디자인 의도를 유지하면서 style quality를 review할 때 사용합니다.

## 핵심 원칙

- style quality, cleanup, broken-layout fix 요청은 product redesign 허가가 아닙니다.
- 먼저 현재 화면 의도, existing components, shared primitives, tokens, CSS/inline style rules를 확인합니다.
- 기본은 hybrid style policy입니다. shared layout과 token은 CSS가 적합할 수 있고, component-local 또는 dynamic style은 inline이 적합할 수 있습니다.
- SI 또는 선임 선호 프로젝트에서는 inline style을 preferred local convention으로 명시적으로 허용합니다.

## Review checklist

- spacing, color, font 값이 의미 없이 반복되는가?
- class names와 inline styles가 충돌하는가?
- CSS cascade 또는 specificity가 의도보다 넓게 영향을 주는가?
- text, buttons, tables, modals, filters가 mobile에서 overflow 되는가?
- loading, empty, error, disabled, selected states가 빠졌는가?
- card 안에 card가 중첩되거나 제품 필요 이상으로 장식되는가?
- operational tool이라면 density와 반복 사용 효율을 유지하는가?

## Style 선택

- inline styles 선호:
  - 한 component 안에서만 쓰는 dynamic styles
  - props/state에 강하게 연결된 값
  - senior/team convention이 inline style을 선호하는 SI 프로젝트
- CSS/classes 선호:
  - global layout, reset, theme tokens
  - 여러 component가 공유하는 variants/states
  - media queries, container queries, pseudo selectors
- shared UI 선호:
  - buttons, inputs, selects, modals, toasts, pagination, toolbars

## Responsive rules

- page/grid behavior는 viewport 기준으로 봅니다.
- card, table, filter는 자기 container width 기준도 확인합니다.
- 주요 desktop, tablet, mobile width에서 overflow와 click target을 확인합니다.
- text가 맞지 않으면 viewport 기반 font scaling보다 layout, wrapping, min-width, overflow policy를 먼저 조정합니다.

## Verification

- 가능하면 rendered screen을 browser에서 확인합니다.
- visible UI가 바뀌면 screenshot 또는 확인 scenario를 기록합니다.
- lint/build만으로 UI verification을 충분하다고 보지 않습니다.
