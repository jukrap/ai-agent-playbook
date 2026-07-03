# Interactive Media Verification

## Evidence

- Component snapshot이나 static source review만 보지 말고 실제 rendered surface를 capture합니다.
- Project가 visual evidence를 보관한다면 surface, viewport, state, run identifier 기준으로 artifact name을 유지합니다.
- Regression check에는 deterministic scene seed, fixed camera position, stable fixture, nonessential animation 비활성화를 우선합니다.
- Dynamic animation evidence는 짧고 명확하게 유지합니다. 보통 setup frame, interaction frame, post-action frame 하나씩이면 충분합니다.

## Checks

- Nonblank: canvas, SVG, video, chart, map, scene이 의미 있는 pixel 또는 semantic output을 포함합니다.
- Bounds: content가 intended frame 안에 있고 fixed control, label, adjacent layout과 겹치지 않습니다.
- Data: chart/map/media data가 로드되고 empty/error state가 보이며 stale data를 rendering bug로 착각하지 않습니다.
- Interaction: pointer, keyboard, touch, gesture, reduced-motion behavior가 product의 accessibility target과 맞습니다.
- Recovery: failed asset load, lost context, network error, unsupported browser/device, slow load에 usable fallback이 있습니다.

## Review Notes

- Test가 통과해도 blank 또는 misframed canvas screenshot은 failed verification으로 봅니다.
- Antialiasing, animation, randomness, device-pixel-ratio 차이가 noise를 만들면 visual diff를 신중히 사용합니다.
- 3D scene에서는 camera target, clipping plane, lighting, material fallback, model scale, resize behavior를 검증합니다.
- Chart와 dashboard에서는 axis label, legend, tooltip, empty state, color meaning, exported/readable value를 검증합니다.
- Media player에서는 loading, buffering, caption/subtitle, keyboard control, mute/autoplay policy, error state를 검증합니다.
