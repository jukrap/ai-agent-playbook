# 레거시 계약 선택

실제 배포 환경에 해당하는 참조만 읽습니다.

| 조건 | 참조 |
| --- | --- |
| Web Forms·postback·ViewState | dotnet-webforms.md |
| Spring MVC·JSP·MyBatis | java-spring-mvc.md |
| PHP·include·session·직접 SQL | php-lamp.md |
| jQuery·selector·script 순서 | jquery-browser.md |
| Android WebView·native bridge | android-webview-hybrid.md |
| IE mode·ActiveX·장치 plugin | ie-activex-containment.md |
| 보고서·물리 인쇄·export | report-print-contract.md |
| batch·파일 전달·재실행 | file-transfer-boundary.md |

보존된 라이브러리의 파일명이 다르면 추측하지 말고 포함된 참조 색인을 확인합니다. 지원되는 이전 없이 native·장치 연동을 최신 브라우저 API로 대체하지 않습니다. fixture 결과를 실제 장치·배포 환경 결과라고 하지 않습니다. 요청·view 키, 인코딩, 이벤트 순서와 산출 필드는 실제 계약 변경이 승인될 때까지 유지합니다.
