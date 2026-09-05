# Rendering Scene Contract

## Inventory

- Renderer: DOM, SVG, Canvas 2D, WebGL, Three.js, charting library, map library, video/audio player, game loop, or custom animation layer.
- Host: framework component, server-rendered page, embedded widget, WebView, iframe, dashboard panel, editor surface, or full-screen scene.
- Assets: models, textures, sprites, fonts, shaders, videos, tiles, spritesheets, JSON data, generated geometry, and fallback placeholders.
- Lifecycle: initialization, asset load, resize, suspend/resume, route transition, unmount, cleanup/disposal, and error recovery.
- Interaction: pointer, keyboard, touch, wheel, drag, camera controls, selection, hover, gesture, reduced-motion mode, and screen-reader fallback.

## Design

- Keep the scene contract explicit: what should be visible, interactive, measurable, and safe to degrade.
- Match the repository's existing renderer, state model, asset loader, and styling system before adding another graphics stack.
- Use a proven engine or library for established domains such as charts, maps, physics, editors, timelines, video controls, or 3D controls.
- Keep UI controls, labels, legends, and inspectable data outside opaque canvas when semantic access matters.
- Bound asset size, load order, retry behavior, and placeholder/error states before adding high-cost media.

## Stop Conditions

- The scene can render blank without a testable failure signal.
- Assets, shaders, models, or external media have unclear license, size, source, or fallback behavior.
- The camera/framing works only for one viewport or device pixel ratio.
- Interaction is pointer-only when keyboard, touch, or accessible fallback is required.
- Cleanup/disposal is undefined for route changes, repeated mounts, or long-running sessions.

## Verification

- Screenshot or pixel check that proves the primary scene is nonblank and correctly framed.
- Console/network check for failed assets, shader errors, WebGL context loss, media decode failures, or CORS issues.
- Interaction smoke test for the primary controls and any hover/focus/drag/gesture behavior.
- Resize test across supported mobile and desktop viewports.
- Performance check for initial load, animation frame stability, memory growth, and cleanup after unmount.
