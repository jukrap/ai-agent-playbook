# Responsive Overflow Checks

## Inventory

- Viewport: smallest supported mobile, common mobile, 지원하는 경우 tablet, laptop, desktop, 관련 있는 경우 wide desktop.
- Container: shell, sidebar, toolbar, card, table, form, modal, dropdown, chart, media frame, fixed-position region.
- Content stressor: long label, translated text, long number, empty data, many item, validation message, narrow column.
- Layout mechanism: grid, flex, absolute/fixed positioning, sticky region, container query, viewport unit.

## Review

- 지원 viewport에서 text가 overlap, clip되거나 control을 container 밖으로 밀어내면 안 됩니다.
- Button, tab, pill, toolbar control에는 longest expected text에 대한 stable dimension 또는 wrapping rule이 필요합니다.
- Table과 dense dashboard에는 explicit overflow, column priority, responsive alternate layout이 필요합니다.
- Sticky/fixed element가 content, focus target, toast, modal, browser UI를 덮으면 안 됩니다.
- 일반 UI에는 viewport-width font scaling을 피하고 design token과 container constraint를 사용합니다.
- Sparse state와 dense state를 모두 테스트합니다. Empty layout은 overflow bug를 숨길 수 있습니다.

## Verification

- Fixed size만이 아니라 breakpoint boundary를 지나며 resize합니다.
- Long text, validation error, long number, translated label을 확인합니다.
- Scroll container, sticky header, modal, dropdown, sidebar가 계속 reachable한지 확인합니다.
- Loading/empty/error state가 critical control을 예상치 못하게 resize하지 않는지 확인합니다.
- Overlap이 미묘하면 browser screenshot 또는 computed layout inspection을 사용합니다.

## Stop Conditions

- Supported viewport에서 중요한 text 또는 control이 overlap됩니다.
- Action이 clipped, covered, offscreen 상태라 user가 도달할 수 없습니다.
- Fixed 또는 sticky UI가 focus, validation, primary content를 숨깁니다.
- Layout이 overflow를 피하기 위해 하나의 sample dataset에 의존합니다.
