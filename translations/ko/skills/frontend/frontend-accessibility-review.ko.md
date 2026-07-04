# Frontend Accessibility Review

Accessibility behavior와 semantic interaction review를 위한 primary frontend skill입니다.

## Workflow

1. Interactive pattern, expected keyboard path, focus lifecycle, semantic role, label, announcement, error state를 확인합니다.
2. Markup만 따로 보지 말고 rendered UI 또는 가능한 가장 가까운 DOM output으로 테스트합니다.
3. Existing design-system accessibility primitive가 문제 원인이 아니라면 보존합니다.
4. Keyboard-only operation, focus visibility, screen-reader-relevant label/state, disabled/loading/error behavior를 검증합니다.

## Reference

Keyboard navigation, focus order, focus trap, focus restoration에는 `references/keyboard-focus-review.md`를 읽습니다.

Role, name, state, form, announcement, contrast, reduced motion에는 `references/semantic-interaction-review.md`를 읽습니다.
