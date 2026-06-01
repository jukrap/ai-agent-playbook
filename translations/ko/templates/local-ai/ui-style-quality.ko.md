# UI Style Quality

디자인 의도를 유지하면서 style quality를 review할 때 사용합니다.

## 핵심 원칙

- style quality, cleanup, broken-layout fix 요청은 product redesign 허가가 아닙니다.
- 먼저 현재 화면 의도, existing components, shared primitives, tokens, CSS/inline style rules를 확인합니다.
- 기본은 repository에서 확인된 style policy입니다. 명시적이면 맞는 skill을 사용합니다: `design-system-first`, `css-class-first`, `utility-class-first`, `inline-style-first`.
- 문서화된 policy가 없으면 component가 이미 쓰는 local pattern을 유지하고 새 styling system을 도입하지 않습니다.

## Review checklist

- spacing, color, font 값이 의미 없이 반복되는가?
- class names와 inline styles가 충돌하는가?
- CSS cascade 또는 specificity가 의도보다 넓게 영향을 주는가?
- text, buttons, tables, modals, filters가 mobile에서 overflow 되는가?
- loading, empty, error, disabled, selected states가 빠졌는가?
- card 안에 card가 중첩되거나 제품 필요 이상으로 장식되는가?
- operational tool이라면 density와 반복 사용 효율을 유지하는가?

## Style policy 선택

- shared UI component, token, variant, slot이 styling을 맡아야 하면 `design-system-first`를 사용합니다.
- stylesheet, CSS module, scoped CSS, semantic class가 project convention이면 `css-class-first`를 사용합니다.
- Tailwind-style utility나 atomic class composition이 project convention이면 `utility-class-first`를 사용합니다.
- component-local inline style object를 명시적으로 선호하면 `inline-style-first`를 사용합니다.

## Responsive rules

- page/grid behavior는 viewport 기준으로 봅니다.
- card, table, filter는 자기 container width 기준도 확인합니다.
- 주요 desktop, tablet, mobile width에서 overflow와 click target을 확인합니다.
- text가 맞지 않으면 viewport 기반 font scaling보다 layout, wrapping, min-width, overflow policy를 먼저 조정합니다.

## Verification

- 가능하면 rendered screen을 browser에서 확인합니다.
- visible UI가 바뀌면 screenshot 또는 확인 scenario를 기록합니다.
- lint/build만으로 UI verification을 충분하다고 보지 않습니다.
