# API Boundary Checklist

## Discover

- base URL과 environment variables
- API client/interceptor behavior
- mock/remote selection
- endpoint call sites
- query/mutation layer
- DTO/domain mapping location
- backend docs, DTOs, command objects, mappers, actual network payloads

## Mapping

- backend naming은 adapter boundary에서 변환합니다.
- common response envelope은 API client 근처에서 unwrap합니다.
- UI를 위해 domain type을 안정적으로 유지합니다.
- nullable/optional fields는 확인된 contract만 기준으로 model합니다.
- unclear fields는 추측하지 말고 blocker/assumption으로 둡니다.

## Mock/remote

- Mock data는 domain types를 만족해야 합니다.
- Remote mode는 실제 remote failures를 드러내야 합니다.
- Backend가 없으면 fake success보다 disabled/notice/blocker state를 보여줍니다.

## Verification

- 가능하면 adapter/unit test.
- 가능한 경우 network payload inspection.
- Empty/error/validation/unauthorized UI states.
- PR/worklog에 확인된 contract source와 남은 uncertainty를 기록합니다.
