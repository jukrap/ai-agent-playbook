# Legacy Dotnet WebForms

Primary route: `backend/server-rendered-change`.

ASP.NET Web Forms, .NET Framework, code-behind pages, ViewState, postback events, Web.config, IIS, 오래된 enterprise .NET web app을 유지보수할 때 사용합니다.

## 진행 절차

1. `.aspx`, code-behind, designer file, master page, user controls, event handlers를 추적합니다.
2. ViewState, postback order, validation controls, data binding, session usage를 확인합니다.
3. Web.config, connection strings, handlers/modules, IIS assumptions, deployment transform behavior를 확인합니다.
4. 모든 reference를 업데이트하지 않으면 control IDs와 server-side event names를 보존합니다.
5. initial load, postback, validation failure, deployed-framework compatibility를 검증합니다.

## Guardrails

- 프로젝트 convention이 아니면 generated designer files를 수동 수정하지 않습니다.
- Web Forms lifecycle을 SPA assumptions로 대체하지 않습니다.
- .NET Framework 프로젝트에서 modern .NET API가 가능하다고 가정하지 않습니다.

## Reference

Stack-specific check는 `references/dotnet-webforms.md`를 읽습니다.
