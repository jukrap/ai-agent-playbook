---
name: server-rendered-change
description: Use when changing backend-rendered web flows, controllers, templates, forms, sessions, redirects, validation, or server-side view contracts.
---

# Server Rendered Change

서버 렌더링 요청/응답 흐름을 위한 기본 백엔드 스킬입니다.

## 작업 절차

1. 라우트, 컨트롤러, 미들웨어, 템플릿, 폼 바인딩, 세션, 인가, 저장 경계를 함께 추적합니다.
2. 요청이 명시하지 않는 한 요청 매개변수 이름, 모델/뷰 키, 리다이렉트 대상, 검증 동작을 보존합니다.
3. 템플릿 조각, 저장 프로시저, 매퍼 SQL, 세션 키는 계약으로 다룹니다.
4. 관련되는 경우 GET, POST, 검증 실패, 인증/세션, 배포 형태 사례를 검증합니다.

## 참고 자료

서버 렌더링 변경이 폼, 리다이렉트, 검증 메시지, 모델/뷰 키, 세션 상태, 템플릿 조각, 저장 프로시저, 이전 라우트 호환성을 건드리면 `references/request-view-session-contract.md`를 읽습니다.
