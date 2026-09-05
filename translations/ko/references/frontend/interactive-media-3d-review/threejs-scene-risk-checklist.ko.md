# Three.js 장면 위험 체크리스트

Blank canvas, 잘못된 framing, asset failure, performance 문제가 일반 테스트를 통과할 수 있는 Three.js/WebGL 장면에서 사용합니다.

## 장면 계약

- Renderer: size, pixel ratio, alpha, color management, antialiasing, tone mapping, resize handling.
- Camera: initial target, field of view, near/far plane, mobile framing, object bounds, reset behavior.
- Lighting/materials: visible contrast, environment map, shadow cost, transparent material, dark/light theme behavior.
- Assets: loader type, compression, fallback, progress state, cache behavior, license, maximum file size.
- Loop: requestAnimationFrame ownership, pause/resume, tab visibility, cleanup, duplicate mount prevention.
- Interaction: orbit/drag/tap/keyboard controls, pointer capture, touch gesture, UI overlay collision.

## 실패 모드

- Canvas는 비어 있지 않지만 object가 camera frustum 밖에 있습니다.
- Model이 desktop에서는 load되지만 mobile memory나 bandwidth budget을 넘습니다.
- Component remount가 render loop, geometry, material, texture leak을 만듭니다.
- Resize handler는 viewport 기준인데 실제 canvas container는 layout으로 제한됩니다.
- Controls가 page scroll, modal overlay, accessibility focus와 충돌합니다.
- Context loss나 asset error 후 permanent blank surface가 됩니다.

## 검증

- Nonblank content와 expected object bounds를 확인하는 pixel 또는 screenshot check.
- Asset, shader, CORS, WebGL warning에 대한 browser console/network check.
- Desktop/mobile viewport에서 camera framing과 overlay collision 확인.
- 지원하는 경우 rotate/drag/tap/keyboard interaction smoke.
- Frame time, route change 후 memory growth, unmount cleanup performance smoke.
