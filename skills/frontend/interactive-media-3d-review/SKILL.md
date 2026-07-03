---
name: interactive-media-3d-review
description: Use when implementing or reviewing Three.js, WebGL, canvas, SVG, chart, map, animation, video, or media-heavy interactive UI surfaces.
---

# Interactive Media 3D Review

Use this as the primary frontend skill for interactive rendered surfaces that can fail visually even when ordinary DOM tests pass.

## Workflow

1. Identify the renderer, host framework, asset pipeline, scene lifecycle, camera/framing, interaction model, fallback state, and target devices.
2. Prefer the repository's existing renderer or a proven domain library before hand-rolling graphics, physics, charts, maps, media controls, or animation engines.
3. Check the rendering contract: nonblank output, correct bounds, resize/device-pixel-ratio behavior, asset loading, cleanup/disposal, accessibility fallback, and error state.
4. Verify with rendered evidence: screenshot or pixel check, browser console/network check, interaction smoke test, performance budget, and desktop/mobile viewport coverage.

## Reference

Read `references/rendering-scene-contract.md` for scene, canvas, asset, lifecycle, fallback, and performance boundaries.

Read `references/interactive-media-verification.md` for screenshot, pixel, interaction, responsive framing, and nonblank verification checks.
