# Interaction Responsive Production Checks

Use this reference when visual QA must cover interaction states and real content, not only a static screenshot.

## State Matrix

- Navigation: current, hover, focus, keyboard order, collapsed, mobile drawer, and deep-link state.
- Controls: default, hover, pressed, focused, disabled, loading, destructive, validation error, and success feedback.
- Data surfaces: empty, one item, many items, long labels, missing values, loading, stale, filtered, sorted, and paginated.
- Overlays: modal, popover, tooltip, menu, toast, command palette, drag preview, and nested scroll behavior.
- Media/canvas: loading, failed asset, low-power mode, resize, device-pixel-ratio, and fallback state.

## Responsive Checks

- Use real or worst-case content, not only ideal labels.
- Check narrow mobile, common laptop, wide desktop, and any app-specific fixed layout.
- Confirm text fits without overlapping adjacent controls or hiding important status.
- Confirm sticky headers, sidebars, bottom bars, and overlays do not cover primary actions.
- Confirm touch targets, hover-only affordances, drag handles, and keyboard access still work on touch devices.

## Motion And Dynamic Content

- Disable or reduce motion when the app supports reduced-motion mode.
- Ensure skeletons, spinners, and optimistic states do not shift layout unexpectedly.
- Capture after animations settle, or explicitly record why motion is the subject of review.
- Treat live data, timestamps, randomized charts, and generated images as noise unless the change is about them.

## Evidence

- Screenshots or video for the changed states.
- Console/network check when assets, canvas, media, or dynamic data changed.
- Notes for untested states with reason and residual risk.
