# 상호작용과 반응형 프로덕션 점검

정적인 screenshot뿐 아니라 interaction state와 실제 콘텐츠까지 visual QA가 필요할 때 사용합니다.

## 상태 매트릭스

- Navigation: current, hover, focus, keyboard order, collapsed, mobile drawer, deep-link state.
- Controls: default, hover, pressed, focused, disabled, loading, destructive, validation error, success feedback.
- Data surfaces: empty, one item, many items, long label, missing value, loading, stale, filtered, sorted, paginated.
- Overlays: modal, popover, tooltip, menu, toast, command palette, drag preview, nested scroll.
- Media/canvas: loading, failed asset, low-power mode, resize, device-pixel-ratio, fallback state.

## 반응형 점검

- 이상적인 label만 쓰지 말고 실제 또는 최악의 콘텐츠를 사용합니다.
- Narrow mobile, common laptop, wide desktop, app-specific fixed layout을 확인합니다.
- Text가 adjacent control과 겹치거나 중요한 status를 가리지 않는지 확인합니다.
- Sticky header, sidebar, bottom bar, overlay가 primary action을 덮지 않는지 확인합니다.
- Touch target, hover-only affordance, drag handle, keyboard access가 touch device에서도 동작하는지 확인합니다.

## Motion과 동적 콘텐츠

- App이 reduced-motion을 지원하면 motion을 줄인 상태도 확인합니다.
- Skeleton, spinner, optimistic state가 예상 밖 layout shift를 만들지 않게 합니다.
- Animation이 끝난 뒤 capture하거나, motion 자체가 검토 대상인 이유를 기록합니다.
- Live data, timestamp, randomized chart, generated image는 변경 대상이 아니라면 noise로 봅니다.

## 증거

- 변경된 상태의 screenshot 또는 video.
- Asset, canvas, media, dynamic data가 바뀌면 console/network check.
- 확인하지 못한 상태는 이유와 residual risk를 기록합니다.
