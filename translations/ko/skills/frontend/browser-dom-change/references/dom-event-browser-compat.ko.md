# DOM 이벤트와 브라우저 호환성

DOM 중심 동작, 위임 이벤트, 선택자, 플러그인 수명 주기, 폼, 스크립트 로딩을 바꾸기 전에 사용합니다.

## 계약 표면

- ID, class, name, data attribute, ARIA attribute, 생성 마크업.
- 직접 이벤트, 위임 이벤트, 인라인 handler, 플러그인 hook.
- 스크립트 로드 순서, 전역 변수, document-ready timing, dynamic import.
- 폼 직렬화, 숨은 필드, checkbox/radio default, file input, 검증 표시.
- AJAX request shape, response shape, redirect, server-rendered fallback behavior.

## 호환성 점검

- 최신 API나 문법을 쓰기 전에 브라우저 지원 대상을 확인합니다.
- 프로젝트가 transpile, polyfill 또는 direct script serving을 하는지 확인합니다.
- binding 시점에 DOM이 존재하는지 확인합니다.
- 반복 초기화가 event를 두 번 binding하지 않는지 확인합니다.
- 동적 DOM 갱신이 event handler 또는 delegation을 보존하는지 확인합니다.
- 오래된 plugin이 기대한 순서로 초기화되고 제거되는지 확인합니다.

## 실패 모드

- 선택자 변경이 다른 화면을 깨뜨립니다.
- 마크업이 생기기 전에 binding이 실행됩니다.
- 위임 event selector가 너무 넓어집니다.
- 부분 페이지 갱신 후 plugin이 두 번 초기화됩니다.
- form serialization이 disabled field 또는 unchecked checkbox를 누락합니다.
- 클라이언트 검증이 서버 검증과 달라집니다.

## 검증

- 최초 페이지 로드.
- 반복 사용자 동작.
- 검증 실패.
- DOM node의 동적 추가/삭제/갱신.
- 상태 있는 폼이면 브라우저 뒤로가기/다시 로드.
- 필요하면 대상 레거시 브라우저 또는 문서화된 fallback 환경.

서버 렌더링 마크업이 계약을 소유하면 브라우저 경로뿐 아니라 서버 경로도 검증합니다.
