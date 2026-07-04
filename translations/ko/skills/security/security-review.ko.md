---
name: security-review
description: Use when reviewing secrets, authentication, authorization, input validation, dependency risk, sensitive data flow, or threat-model changes.
---

# Security Review

개발 중 보안 위험을 검토할 때 쓰는 기본 보안 스킬입니다.

## 작업 흐름

1. 범위, 보호 자산, 행위자, 신뢰 경계, 민감 데이터를 정의합니다.
2. 인증, 인가, 입력 검증, 출력 인코딩, 비밀값, 로그, 전송 경로, 의존성 노출을 확인합니다.
3. 일반적인 경고보다 구체적인 공격 경로와 회귀 테스트를 우선합니다.
4. 위험 수준, 완화책, 남은 위험, 검증 증거를 기록합니다.

## 참고 자료

위험 분류, 데이터 흐름 검토, 증거, 완화 기록이 필요하면 `references/security-review-protocol.md`를 읽습니다.

민감 데이터, tenant boundary, export, log, cache, analytics, AI/tool context의 정보 노출 가능성을 다룰 때는 `references/threat-model-data-exposure.md`를 읽습니다.

Credential, API key, token, env var, OAuth app, CI secret, provider config를 건드릴 때는 `references/secrets-credential-boundary.md`를 읽습니다.

AI 에이전트, MCP/도구, 프롬프트 주입, 신뢰할 수 없는 콘텐츠, 메모리, 로컬 설정, 외부 통신이 얽힌 시스템은 `references/agent-tool-threats.md`를 읽습니다.
