# API Contract Handoff Example

## Summary
- Record the confirmed state of a feature's frontend call boundary and backend contract.

## Confirmed Sources
- backend docs or Swagger path
- actual network response
- backend DTO, command object, or mapper
- existing frontend API client and adapter

## Decisions
- Keep frontend domain types in camelCase.
- Handle backend DTO snake_case and response wrappers in adapters.
- Do not silently fall back to mock data in remote mode.

## Remaining Uncertainty
- status codes not yet confirmed
- nullable field handling
- validation error shape

## Verification
- adapter test or API-call confirmation result
- failure-response confirmation
- UI empty/error state confirmation
