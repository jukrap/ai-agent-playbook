# Legacy Risk Check

Global state, shared CSS/JS, common selectors, templates, forms, API contracts, build output, deployment behavior에 영향을 줄 수 있는 legacy code 변경 전 사용합니다.

## Checklist

- 변경할 selector, global variable, function name, route, template fragment, config key, API field를 모두 검색합니다.
- 어떤 file이 runtime에서 실제로 load되는지 확인합니다.
- shared CSS/JS, includes, layout templates, plugin initialization, event delegation을 확인합니다.
- form field names, hidden inputs, CSRF/session handling, redirect flow를 확인합니다.
- generated/build output과 source files를 구분합니다.
- 파일 이동 전 deployment 또는 packaging rules를 확인합니다.

## Stop signals

- 같은 목적의 active file이 여러 개 있고 runtime winner가 불명확함.
- Backend contract 또는 DB/schema shape가 불명확함.
- Shared selector/class가 관련 없는 여러 화면에서 사용됨.
- 신뢰할 verification에 필요한 environment가 없음.

Stop signal이 confidence를 막으면 blocker와 가장 작은 안전한 next step을 보고합니다.
