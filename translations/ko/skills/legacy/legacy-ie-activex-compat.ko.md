# Legacy IE ActiveX Compat

IE mode, ActiveX, old browser APIs, document modes, device plugins, enterprise compatibility constraints에 의존하는 intranet system을 유지보수할 때 사용합니다.

## Workflow

1. target browser, document mode, compatibility view, IE mode policy, required plugins를 식별합니다.
2. ActiveX/object/embed calls, device integrations, security prompts, registry/group-policy assumptions를 추적합니다.
3. transpilation/polyfill/runtime support가 증명되지 않으면 modern syntax 또는 API를 피합니다.
4. event model, encoding, window/dialog behavior, file/device access flow를 보존합니다.
5. 필요한 browser mode에서 검증하거나, 환경 부재를 blocker로 문서화합니다.

## Guardrails

- client environment가 지원하지 않으면 ActiveX/device flows를 browser APIs로 대체하지 않습니다.
- IE-mode claims에 Chromium/modern browser test만 의존하지 않습니다.
- compatibility assumptions를 PR/worklog에 명시합니다.
