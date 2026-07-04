---
name: webview-bridge
description: Use when changing mobile WebView bridges, native-to-web messaging, deep links, embedded auth, file upload, downloads, or hybrid app navigation.
---

# WebView 브리지

하이브리드 앱 경계를 다루는 기본 모바일 스킬입니다.

## 진행 절차

1. 네이티브 컨테이너, WebView 설정, 브리지 메시지, 경로/딥링크 처리, 인증/세션, 플랫폼 권한을 함께 추적합니다.
2. 계약이 의도적으로 바뀌지 않는 한 메시지 이름, 페이로드 형태, 출처 검사, 내비게이션 동작을 보존합니다.
3. 프로젝트가 양쪽을 지원하면 Android와 iOS 차이를 확인합니다.
4. 관련되는 경우 설치/실행, 브리지 호출, 뒤로가기, 다시 로드, 오프라인/오류, 권한 사례를 검증합니다.

## 참고 자료

네이티브-웹 메시징, 딥링크, 내장 인증, 파일 흐름, 하이브리드 내비게이션을 바꾸기 전에는 `references/webview-message-bridge-contract.md`를 읽습니다.
