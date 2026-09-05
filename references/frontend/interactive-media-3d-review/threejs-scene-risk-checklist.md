# Three.js Scene Risk Checklist

Use this reference for Three.js or WebGL scenes where a blank canvas, bad framing, asset failure, or performance problem could pass ordinary tests.

## Scene Contract

- Renderer: size, pixel ratio, alpha, color management, antialiasing, tone mapping, and resize handling.
- Camera: initial target, field of view, near/far planes, mobile framing, object bounds, and reset behavior.
- Lighting/materials: visible contrast, environment map, shadow cost, transparent materials, and dark/light theme behavior.
- Assets: loader type, compression, fallbacks, progress state, cache behavior, licensing, and maximum file size.
- Loop: requestAnimationFrame ownership, pause/resume, tab visibility, cleanup, and duplicate mount prevention.
- Interaction: orbit/drag/tap/keyboard controls, pointer capture, touch gestures, and UI overlay collisions.

## Failure Modes

- Canvas is nonblank but object is outside camera frustum.
- Model loads on desktop but exceeds mobile memory or bandwidth budget.
- Component remount creates multiple render loops or leaked geometries/materials/textures.
- Resize handler uses viewport size but container is constrained by layout.
- Controls conflict with page scroll, modal overlays, or accessibility focus.
- Context loss or asset error leaves a permanent blank surface.

## Verification

- Pixel or screenshot check that confirms nonblank content and expected object bounds.
- Browser console and network check for asset, shader, CORS, and WebGL warnings.
- Desktop and mobile viewport checks for camera framing and overlay collisions.
- Interaction smoke for rotate/drag/tap/keyboard where supported.
- Performance smoke for frame time, memory growth after route changes, and cleanup on unmount.
