# API Contract Handoff Example

## 요약
- 특정 feature의 frontend call boundary와 backend contract 확인 상태를 기록합니다.

## 확인한 출처
- backend docs 또는 Swagger path
- 실제 network response
- backend DTO, command object, mapper
- 기존 frontend API client와 adapter

## 결정
- frontend domain type은 camelCase로 유지합니다.
- backend DTO의 snake_case와 response wrapper는 adapter에서 처리합니다.
- remote mode에서 mock data로 조용히 fallback하지 않습니다.

## 남은 불확실성
- 아직 확인하지 못한 status codes
- nullable field 처리
- validation error shape

## 검증
- adapter test 또는 API-call confirmation result
- failure-response 확인
- UI empty/error state 확인
