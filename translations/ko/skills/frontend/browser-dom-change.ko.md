---
name: browser-dom-change
description: Use when changing browser DOM behavior, jQuery flows, event handlers, selectors, forms, legacy plugins, or script-loaded UI.
---

# 브라우저 DOM 변경

DOM 중심 및 레거시 브라우저 동작을 다루는 기본 프론트엔드 스킬입니다.

## 진행 절차

1. 선택자, 이벤트 위임, 플러그인 초기화, 폼 직렬화, AJAX 호출, 서버 렌더링 마크업을 함께 추적합니다.
2. 변경이 요구하지 않는 한 ID, 클래스, 데이터 속성, 이벤트 순서, 플러그인 수명 주기를 보존합니다.
3. 동작을 교체하기 전에 브라우저 호환성과 스크립트 로드 순서를 확인합니다.
4. 최초 로드, 반복 동작, 검증 실패, 동적 DOM 갱신을 포함해 실제 브라우저 흐름을 검증합니다.

## 참고 자료

위임 이벤트, 선택자, 플러그인 수명 주기, 폼 직렬화, 스크립트 로딩을 바꾸기 전에는 `references/dom-event-browser-compat.md`를 읽습니다.
