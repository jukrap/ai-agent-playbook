# API Contract Boundary

Frontend/backend API integration, DTO mapping, mock-vs-remote behavior, request payload, response adapter, 불명확한 backend contract를 구현/디버깅/review할 때 사용합니다.

## Workflow

1. 기존 API client, env mode, mock/remote switch, endpoint usage, adapter pattern을 확인합니다.
2. backend docs, DTO, mapper, logs, 실제 network response에서 request/response shape를 확인합니다.
3. backend DTO와 frontend domain type을 분리합니다.
4. wrapper response, naming conversion, nullable values, error shape는 API boundary에서 처리합니다.
5. 명시 요청 없이는 remote failure를 mock fallback으로 숨기지 않습니다.

## Reference

API integration을 바꾸거나 contract bug를 진단하기 전 `references/api-boundary-checklist.md`를 읽습니다.
