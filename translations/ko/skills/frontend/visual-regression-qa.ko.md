# Visual Regression QA

Rendered UI regression check와 visual verification을 위한 primary frontend skill입니다.

## Workflow

1. Changed surface, stable viewport, dynamic state, baseline artifact, acceptable visual tolerance를 확인합니다.
2. Visual behavior가 바뀌었으면 static code review에만 의존하지 말고 rendered UI를 capture하거나 inspect합니다.
3. Intentional design change, regression, data-dependent variation, animation, environment noise를 분리합니다.
4. Desktop/mobile width, text fit, overflow, clipping, loading/empty/error state, 변경된 image/canvas/media rendering을 검증합니다.

## Reference

Screenshot, diff, baseline, artifact review에는 `references/visual-snapshot-checks.md`를 읽습니다.

Breakpoint, text fit, clipping, dynamic content check에는 `references/responsive-overflow-checks.md`를 읽습니다.
