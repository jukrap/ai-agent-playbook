# Semantic Interaction Review

## Inventory

- Accessible name: visible label, `aria-label`, `aria-labelledby`, form label, table caption/header, icon button tooltip.
- Role and state: native element, ARIA role, expanded/selected/checked/pressed/current/busy/invalid/disabled state.
- Feedback: form error, toast, inline status, loading indicator, progress, live region, success/failure announcement.
- Visual constraints: contrast, reduced motion, text scaling, focus ring, hit target, 관련 있는 경우 high-contrast mode.

## Review

- ARIA보다 native element를 우선합니다. ARIA는 semantic을 보완해야지 non-interactive markup을 완전한 widget처럼 위장하면 안 됩니다.
- Icon-only control에는 action과 맞는 stable accessible name이 필요합니다.
- Form error는 field와 연결되어야 하고 submit 이후 announce되거나 발견 가능해야 합니다.
- Selected, expanded, checked, pressed, current, invalid, busy state는 interaction meaning을 바꿀 때 노출되어야 합니다.
- Color와 motion만으로 status, error, selection을 전달하면 안 됩니다.
- 큰 motion, parallax, autoplay, 반복 animated feedback은 reduced motion을 존중해야 합니다.

## Verification

- 가능하면 browser tooling으로 rendered accessible name/role/state를 확인합니다.
- Invalid form을 submit하고 field association, message persistence, recovery를 확인합니다.
- Icon button, custom control, selected row/tab, disclosure widget, loading state를 검증합니다.
- 변경이 visible UI에 영향을 주면 contrast와 text scaling을 확인합니다.
- Announcement가 유용하지만 반복 update에서 너무 시끄럽지 않은지 확인합니다.

## Stop Conditions

- Visual UI와 semantic state가 서로 다릅니다.
- Control의 accessible name이 없거나, 오래되었거나, misleading합니다.
- Form error를 시각 없이 발견할 수 없습니다.
- Motion, color, icon shape만으로 중요한 state를 표시합니다.
