# Interactive Media 3D Review

일반 DOM test는 통과해도 visual failure가 날 수 있는 interactive rendered surface를 위한 primary frontend skill입니다.

## Workflow

1. Renderer, host framework, asset pipeline, scene lifecycle, camera/framing, interaction model, fallback state, target device를 확인합니다.
2. Graphics, physics, chart, map, media control, animation engine을 직접 만들기 전에 repository의 기존 renderer나 검증된 domain library를 우선합니다.
3. Nonblank output, correct bounds, resize/device-pixel-ratio behavior, asset loading, cleanup/disposal, accessibility fallback, error state 같은 rendering contract를 확인합니다.
4. Screenshot 또는 pixel check, browser console/network check, interaction smoke test, performance budget, desktop/mobile viewport coverage로 rendered evidence를 검증합니다.

## Reference

Scene, canvas, asset, lifecycle, fallback, performance boundary에는 `references/rendering-scene-contract.md`를 읽습니다.

Screenshot, pixel, interaction, responsive framing, nonblank verification check에는 `references/interactive-media-verification.md`를 읽습니다.
