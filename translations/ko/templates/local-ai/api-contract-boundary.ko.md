# API Contract Boundary

Frontend/backend contract가 불명확할 때 사용합니다.

## 원칙

- endpoint, request/response field, status code, wrapper shape를 추측하지 않습니다.
- Swagger/OpenAPI는 backend DTO, command object, mapper, 실제 response와 다를 수 있습니다.
- frontend domain type과 backend DTO를 분리합니다.
- page/widget code가 endpoint path와 transport detail을 직접 알지 않게 합니다.
- mock mode는 명시적인 개발 지원으로만 쓰고 remote failure를 숨기는 용도로 쓰지 않습니다.

## 확인 순서

1. 현재 API client, base URL, environment mode, mock/remote switch를 찾습니다.
2. `rg`로 관련 endpoint call site를 찾습니다.
3. 가능한 backend docs, DTO, 실제 network response를 모읍니다.
4. request mapping과 response adaptation 위치를 정합니다.
5. domain types, API functions, query/mutation options, UI use의 책임을 분리합니다.
6. failure states, empty results, authorization/session expiry, validation errors를 확인합니다.

## Adapter rules

- backend 원본 field는 adapter 안에서 처리합니다.
- domain boundary 밖으로 불필요한 `snake_case`를 흘리지 않습니다.
- wrapper response는 API boundary에서 unwrap합니다.
- nullable value, empty string, numeric string, date string은 실제 contract 기준으로 정합니다.
- 불명확한 값은 추측하지 말고 TODO, blocker, user-confirmed assumption으로 둡니다.

## Mock과 remote

- mock data는 domain type을 만족해야 합니다.
- remote mode에서 mock data로 조용히 fallback하지 않습니다.
- backend가 없으면 fake success보다 disabled, notice, blocker state가 낫습니다.
- local demo에 mock mode가 필요하면 mode를 명시합니다.

## Verification

- 가능하면 API unit test나 adapter test를 추가/수정합니다.
- 실제 network call이 가능하면 request payload와 response shape를 확인합니다.
- 가능하면 실패 response를 최소 하나 확인합니다.
- PR 또는 worklog에 확인된 contract source와 남은 불확실성을 기록합니다.
