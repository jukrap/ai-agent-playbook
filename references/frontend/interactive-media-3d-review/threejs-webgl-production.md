# Three.js WebGL Production

Use this reference when the rendered surface uses Three.js, React Three Fiber, raw WebGL, shader backgrounds, particle systems, model viewers, WebGL terminals, or canvas-heavy interactive scenes.

## Scene Contract

- Define the visible promise before coding: subject, camera target, starting frame, controls, loading state, empty state, unsupported-browser state, and reduced-motion state.
- Keep the primary 3D scene unambiguous. A user should know what object, environment, chart, map, game board, or simulation is being shown without reading hidden implementation notes.
- Prefer one scene owner per mounted surface. Shared renderer pools are acceptable only when the project already has lifecycle management for resize, disposal, context loss, and route transitions.
- Keep DOM controls, labels, legends, captions, and critical values outside the opaque canvas when users need to inspect, copy, tab to, or translate them.
- Treat decorative WebGL backgrounds as enhancement. They must not block page readability, navigation, battery-saving mode, or static screenshot capture.

## Renderer And Camera

- Set explicit canvas bounds with CSS constraints such as `aspect-ratio`, `min-height`, `max-height`, or full-bleed viewport rules; do not let loading text, controls, or dynamic labels resize the scene container.
- Configure renderer pixel ratio with a cap, usually `Math.min(window.devicePixelRatio, 2)`, unless the project has a stronger performance budget.
- Verify color management and tone mapping against the local Three.js version. Check whether the codebase uses `outputColorSpace`, legacy `outputEncoding`, `ACESFilmicToneMapping`, or custom postprocessing.
- Set camera near/far planes, target, field of view, and model scale from the actual asset bounds instead of guessing by eye.
- On resize, update renderer size, camera aspect/projection matrix, composer size, and any screen-space uniforms together.

## Assets And Materials

- Record model, texture, HDRI, shader, font, and video sources with license and size. Do not add opaque remote assets without cache, fallback, and CORS behavior.
- Compress and bound assets before review: GLB/GLTF geometry, texture dimensions, texture formats, animation clips, and environment maps.
- Share geometry and material instances for repeated meshes unless per-object mutation is required.
- Prefer the simplest material that satisfies the visual goal. `MeshBasicMaterial` is valid for unlit UI markers; physically based materials need lighting, environment, and tone checks.
- Provide a visible fallback for failed model, texture, shader, or media load. A blank canvas is not an acceptable fallback.

## Animation And Interaction

- Keep animation loops scoped to visibility and lifecycle. Stop or throttle requestAnimationFrame on unmount, hidden tabs, modal closure, inactive routes, or low-power mode.
- Respect `prefers-reduced-motion` and update live if the setting changes during a session.
- Give pointer controls a keyboard or DOM equivalent when the scene is part of a task flow rather than purely decorative output.
- Bound camera controls: min/max distance, polar angle, pan limits, damping, reset, and disabled states while dialogs or menus are active.
- For games or simulations, use an established physics or rules library unless the project explicitly needs a custom engine.

## Performance Budget

- Track initial asset bytes, time to first nonblank frame, steady frame rate, draw calls, triangle count, texture memory, and CPU/GPU spikes during interaction.
- Avoid unbounded particles, shadows, postprocessing, reflective materials, or high-segment geometry in ordinary product UI.
- Add quality tiers only when they map to device capability or user preference. A low-power/static path is often more useful than another visual preset.
- Check memory after repeated mount/unmount or route changes. Leaked geometries, materials, textures, render targets, controls, and event listeners are common production failures.
- If the scene runs inside a dashboard, editor, or WebView, test it under realistic surrounding UI load, not only as an isolated full-screen demo.

## Verification

- Capture desktop and mobile screenshots that prove the canvas is nonblank, correctly framed, and not occluding controls or text.
- Run a pixel check or screenshot diff that fails on blank output for the primary scene.
- Check browser console and network output for shader compile errors, missing assets, CORS failures, WebGL warnings, and context loss.
- Interact with the primary controls: hover/select, drag/orbit, zoom, reset, keyboard path, touch gesture, and reduced-motion mode.
- Verify cleanup by navigating away and back, remounting the component, or closing/reopening the surface while watching console noise and memory growth.
