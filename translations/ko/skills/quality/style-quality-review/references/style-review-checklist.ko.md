# Style Review Checklist

## Preserve intent

- 요청받지 않았다면 redesign하지 않습니다.
- product reason 없이 operational tool에 decorative layout을 추가하지 않습니다.
- visual hierarchy, density, workflow ergonomics를 consistent하게 유지합니다.

## Check

- mobile/tablet/desktop width에서 overflow
- long text, labels, table cells, buttons, modals
- loading, empty, error, disabled, selected states
- CSS cascade and specificity
- duplicated values and inconsistent spacing
- shared primitive bypasses
- card nesting 또는 unnecessary decoration

## Style policy selection

- Design system first: shared components, tokens, variants, slots, reusable UI primitives가 있습니다.
- CSS/class first: stylesheets, CSS modules, scoped CSS, semantic class names가 project convention입니다.
- Utility class first: Tailwind-style utilities 또는 atomic class composition이 project convention입니다.
- Inline style first: component-local inline style objects를 명시적으로 선호합니다.

명시적 policy가 없으면 component가 이미 쓰는 local pattern을 유지하고 새 styling system을 도입하지 않습니다.

style policy 자체를 선택, 문서화, 조정해야 할 때 `ui-style-policy`를 사용합니다.

## Verification

- 관련 있으면 repo-defined lint/build를 실행합니다.
- visible changes에는 browser/device checks를 사용합니다.
- 실제로 확인한 viewports 또는 scenarios만 언급합니다.
