# Select a legacy contract

Load only the reference matching the deployed system.

| Trigger | Reference |
| --- | --- |
| Web Forms / postback / ViewState | dotnet-webforms.md |
| Spring MVC / JSP / MyBatis | java-spring-mvc.md |
| PHP / include / session / direct SQL | php-lamp.md |
| jQuery / selectors / script order | jquery-browser.md |
| Android WebView / native bridge | android-webview-hybrid.md |
| IE mode / ActiveX / device plugin | ie-activex-containment.md |
| Reporting / physical print / export | report-print-contract.md |
| Batch / file transfer / replay | file-transfer-boundary.md |

If a filename differs in the preserved reference library, use the packaged reference index rather than guessing a path. Do not replace native/device integration with modern browser APIs without a supported migration. Do not call a fixture result a real device or deployed-runtime result. Preserve request/view keys, encoding, event order and artifact output fields until the actual contract change is authorized.
