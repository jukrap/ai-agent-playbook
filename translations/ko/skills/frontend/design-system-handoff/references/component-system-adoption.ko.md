# Component System Adoption

## Adoption Boundary

- 새 component family를 만들기 전에 기존 primitive, variant, slot, composition pattern을 사용합니다.
- 여러 screen이 같은 behavior, accessibility, visual contract를 필요로 할 때만 shared component를 추가합니다.
- Feature-specific layout, copy, data wiring, workflow state는 generic primitive 밖에 둡니다.
- Copied reference visual은 영감으로만 사용하고 repository의 product language를 대체하지 않습니다.

## States

- Default, hover, focus, active, pressed, disabled, loading, empty, error, validation, selected, expanded, permission-limited.
- Long text, translated text, dense data, missing media, reduced motion, dark/light theme, high-contrast mode.
- Project가 지원하는 keyboard, screen reader, touch, pointer, responsive breakpoint.

## Verification

- Static style review만 믿지 말고 변경된 각 state의 component 또는 screen을 렌더링합니다.
- Text fit, overflow, focus visibility, contrast, icon meaning, density, responsive composition을 확인합니다.
- Accepted design source가 있으면 비교하되, 의도적인 product deviation은 문서화합니다.
- Token 또는 component 변경이 관련 없는 surface를 예상 밖으로 바꾸지 않는지 확인합니다.
- Visual evidence와 adoption note는 future review에 유용할 만큼 간결하게 유지합니다.
