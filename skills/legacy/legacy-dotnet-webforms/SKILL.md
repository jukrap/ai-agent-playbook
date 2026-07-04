---
name: legacy-dotnet-webforms
description: Use when maintaining ASP.NET Web Forms, .NET Framework, code-behind pages, ViewState, postback events, Web.config, IIS, or old enterprise .NET web apps.
---

# Legacy Dotnet WebForms

Primary route: `backend/server-rendered-change`.

For service, configuration, persistence, worker, or integration changes, pair this wrapper with `backend/backend-change-safety` and the .NET stack profile.

Respect the page lifecycle and server control contracts.

## Workflow

1. Trace `.aspx`, code-behind, designer file, master page, user controls, and event handlers.
2. Check ViewState, postback order, validation controls, data binding, and session usage.
3. Inspect Web.config, connection strings, handlers/modules, IIS assumptions, and deployment transform behavior.
4. Preserve control IDs and server-side event names unless every reference is updated.
5. Verify initial load, postback, validation failure, and deployed-framework compatibility.

## Guardrails

- Do not edit generated designer files manually unless that is the project convention.
- Do not replace Web Forms lifecycle with SPA assumptions.
- Do not assume modern .NET APIs are available in .NET Framework projects.

## Reference

Read `references/dotnet-webforms.md` for stack-specific checks.

Read the backend stack profile selection reference from the source repository when deciding whether this legacy wrapper is enough or a backend stack profile is also needed.
