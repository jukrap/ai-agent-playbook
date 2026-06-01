# API Boundary Checklist

## Discover

- base URL and environment variables
- API client/interceptor behavior
- mock/remote selection
- endpoint call sites
- query/mutation layer
- DTO/domain mapping location
- backend docs, DTOs, command objects, mappers, actual network payloads

## Mapping

- Convert backend naming at the adapter boundary.
- Unwrap common response envelopes near the API client.
- Keep domain types stable for UI.
- Model nullable/optional fields from confirmed contract only.
- Leave unclear fields as blocker/assumption rather than guessing.

## Mock/remote

- Mock data should satisfy domain types.
- Remote mode should expose real remote failures.
- If backend is unavailable, show disabled/notice/blocker state instead of fake success.

## Verification

- Adapter/unit test when available.
- Network payload inspection when possible.
- Empty/error/validation/unauthorized UI states.
- PR/worklog note for confirmed contract source and remaining uncertainty.
