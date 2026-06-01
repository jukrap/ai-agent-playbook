---
name: legacy-ie-activex-compat
description: Use when maintaining intranet systems that depend on IE mode, ActiveX, old browser APIs, document modes, device plugins, or enterprise compatibility constraints.
---

# Legacy IE ActiveX Compat

Compatibility is a runtime requirement, not a style preference.

## Workflow

1. Identify target browser, document mode, compatibility view, IE mode policy, and required plugins.
2. Trace ActiveX/object/embed calls, device integrations, security prompts, and registry/group-policy assumptions.
3. Avoid modern syntax or APIs unless transpilation/polyfill/runtime support is proven.
4. Preserve event model, encoding, window/dialog behavior, and file/device access flow.
5. Verify in the required browser mode or document the missing environment as a blocker.

## Guardrails

- Do not replace ActiveX/device flows with browser APIs unless the client environment supports them.
- Do not rely on Chromium/modern browser tests for IE-mode claims.
- Record compatibility assumptions explicitly in PR/worklog.
