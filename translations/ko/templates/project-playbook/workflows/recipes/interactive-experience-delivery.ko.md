# Interactive Experience Delivery

Inputs: rendered surface, renderer 또는 media stack, asset source, supported device, interaction model, accessibility target, baseline 또는 acceptance criteria.

Outputs: implementation plan, scene/rendering contract note, visual evidence, interaction evidence, performance note, fallback/error-state note.

Skills: interactive media 3D review, design system handoff, visual regression QA, frontend accessibility review, data-driven인 경우 frontend state data flow.

Tools: browser QA, screenshot 또는 pixel check, console/network inspection, `workflow run-preview`, `write_gate_preview`, 가능한 경우 project test runner.

Stop conditions: blank 또는 측정 불가능한 scene, 불명확한 asset license/source, unsupported device/browser fallback 누락, 알 수 없는 performance target, 접근 불가능한 pointer-only interaction.

Verification: nonblank screenshot 또는 pixel check, desktop/mobile framing, primary interaction smoke test, asset load/error check, resize/device-pixel-ratio check, performance와 cleanup review.
