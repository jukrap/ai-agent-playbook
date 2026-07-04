# .NET Web Forms Stack Checks

## Inspect Together

- `.aspx`, code-behind, designer files, master pages, user controls, validation controls, data sources, and server control IDs.
- Page lifecycle: Init, Load, postback checks, validation, event handlers, data binding, PreRender, ViewState, and control recreation.
- Web.config, app settings, connection strings, handlers/modules, session state, authentication mode, IIS pipeline, and deployment transforms.
- Client scripts emitted by server controls, UpdatePanel/AJAX behavior, hidden fields, and generated IDs used by CSS or JavaScript.

## Change Risks

- Renaming or moving controls can desynchronize designer files, event hookups, CSS selectors, JavaScript, or ViewState.
- Data binding order can overwrite user input, duplicate rows, or skip validation depending on `IsPostBack`.
- ViewState and session assumptions can hide bugs until a real postback, expired session, or load-balanced deployment.
- IIS and framework version differences can change handler behavior, request validation, encoding, or authentication.

## Verification

- Exercise initial load, postback success, validation failure, event handler path, auth/session failure, and refresh/back-button behavior.
- Verify generated client IDs, hidden fields, ViewState size, validation summaries, data-bound values, and JavaScript hooks.
- Check Web.config or transform changes with deployment-shaped settings rather than only local debug defaults.
- Verify data changes, exports, file uploads, reports, or print output when the page owns side effects.
- Pair with `backend/server-rendered-change`, `database/data-integrity-constraints`, or `security/auth-access-control` when those boundaries are involved.
