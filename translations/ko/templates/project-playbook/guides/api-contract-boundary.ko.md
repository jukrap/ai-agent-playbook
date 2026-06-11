# API Contract Boundary

API integration, DTO mapping, mock-vs-remote behavior, request payload, response adapter, 불확실한 backend contract를 구현, 디버깅, review할 때 사용합니다.

## 진행 절차

1. 현재 API client, base URL, environment mode, mock/remote switch를 찾습니다.
2. backend docs, DTO, OpenAPI spec, log, fixture, 실제 network response에서 request/response shape를 확인합니다.
3. backend DTO와 frontend/domain model을 분리합니다.
4. naming, nullability, wrapper envelope, date, error, status handling을 API boundary에서 변환합니다.
5. 불확실한 backend field를 UI state나 component props로 흘리지 않습니다.
6. 명시적 요청 없이 remote failure를 mock fallback으로 숨기지 않습니다.

## Evidence

확인된 contract source를 기록합니다.

- source file 또는 endpoint
- sample request
- sample response
- remaining uncertainty
- verification command 또는 manual check

장기 프로젝트에서는 durable API facts를 `.ai-playbook/maps/api-map.md`에 둡니다.
