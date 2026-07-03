---
name: mcp-server-design
description: Use when designing or changing MCP tools, resources, prompts, permission tiers, write gates, cache/index surfaces, or agent harness integrations.
---

# MCP Server Design

MCP와 통합 지점을 설계할 때 쓰는 기본 AI 하네스 스킬입니다.

## 작업 절차

1. 필요한 기능을 리소스, 프롬프트, 읽기 도구, 생성 보조 도구, 관리 파일 쓰기, 프로젝트 파일 쓰기로 나눕니다.
2. 읽기 전용 도구를 기본값으로 유지하고, 쓰기 기능에는 명시적 활성화와 `apply` 의미를 요구합니다.
3. 구조화된 결과, 짧은 요약, 대상 경로 근거, 충돌 정보를 분명하게 반환합니다.
4. 읽기 전용 도구가 파일을 쓰지 않고, 쓰기 도구가 기본 비활성 상태임을 증명하는 테스트를 추가합니다.

## 참고 자료

MCP 작업에 장기 실행 데몬, 전송 계층, 세션 저장소, 큐 처리, 터널 또는 원격 표면, 범위 제한 토큰, 승인 흐름, 서버 기반 검색/읽기 연결이 포함되면 `references/runtime-boundaries-and-permissions.md`를 읽습니다.
