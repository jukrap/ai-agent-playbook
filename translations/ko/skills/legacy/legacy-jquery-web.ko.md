# Legacy jQuery Web

jQuery, plugin, 직접 DOM 조작, global scripts, AJAX callbacks, script-order 의존 behavior로 만든 browser pages를 유지보수할 때 사용합니다.

## Workflow

1. active HTML/template과 script include order를 찾습니다.
2. selector usage, delegated events, plugin initialization, AJAX calls, globals를 추적합니다.
3. 경쟁하는 framework style을 추가하지 말고 기존 pattern을 patch합니다.
4. CSS/inline style 선택은 page와 team preference에 맞춥니다.
5. browser에서 page load, changed controls interaction, console/network를 검증합니다.

## Watch for

- duplicate event handler registration
- plugin re-initialization bugs
- IDs/classes에 대한 hidden dependencies
- table/modal/date picker lifecycle
- old browser syntax constraints
- JavaScript 안에 embedded된 server-rendered values
