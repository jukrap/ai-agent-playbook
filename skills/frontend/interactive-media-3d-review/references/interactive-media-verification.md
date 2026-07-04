# Interactive Media Verification

## Evidence

- Capture the actual rendered surface, not only component snapshots or static source review.
- Store artifact names by surface, viewport, state, and run identifier when the project keeps visual evidence.
- Prefer deterministic scene seeds, fixed camera positions, stable fixtures, and disabled nonessential animation for regression checks.
- Keep dynamic animation evidence short and targeted: one setup frame, one interaction frame, and one post-action frame is usually enough.

## Checks

- Nonblank: the canvas, SVG, video, chart, map, or scene contains meaningful pixels or semantic output.
- Bounds: content stays inside the intended frame and does not overlap fixed controls, labels, or adjacent layout.
- Data: chart/map/media data is loaded, empty/error states are visible, and stale data is not mistaken for a rendering bug.
- Interaction: pointer, keyboard, touch, gesture, and reduced-motion behavior match the product's accessibility target.
- Recovery: failed asset load, lost context, network error, unsupported browser/device, and slow load have a usable fallback.

## Review Notes

- Treat a screenshot of a blank or misframed canvas as a failed verification, even if tests pass.
- Use visual diff carefully when antialiasing, animation, randomness, or device-pixel-ratio differences create noise.
- For 3D scenes, verify camera target, clipping plane, lighting, material fallback, model scale, and resize behavior.
- For charts and dashboards, verify axis labels, legends, tooltips, empty states, color meaning, and exported/readable values.
- For media players, verify loading, buffering, captions/subtitles, keyboard controls, mute/autoplay policy, and error states.
