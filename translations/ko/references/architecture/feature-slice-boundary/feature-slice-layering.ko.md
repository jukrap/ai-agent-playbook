# Feature Slice Layering

Feature folder, route module, UI slice, page module, shared layer, cross-slice import를 건드릴 때 사용합니다.

## Boundary Evidence

- 실제 project convention을 확인합니다. FSD, vertical slice, feature-first, route-first, layered, module-first, mixed 중 무엇인지 봅니다.
- UI, state, data fetching, validation, API call, domain rule, test, fixture의 intended owner를 명시합니다.
- Local rule 기준으로 lower layer to higher layer, feature to feature, shared to app, app to feature, circular dependency를 확인합니다.
- Folder name을 증거로 삼지 않습니다. Import, export, test, runtime behavior, project docs를 확인합니다.

## Change Safety

- 요청된 behavior가 좁다면 broad reshuffle보다 작은 ownership repair를 우선합니다.
- Caller가 깨질 수 있으면 compatibility path 또는 re-export를 유지합니다.
- Test는 증명하는 behavior와 함께 이동하고, shared test helper가 production module에 섞이지 않게 합니다.
- Cache, optimistic update, stale UI behavior가 바뀌면 frontend state/data 변경은 `frontend/frontend-state-data-flow`로 라우팅합니다.

## Stop Conditions

- Target architecture를 observed code가 아니라 framework name에서 추정했습니다.
- 명시적 compatibility reason 없이 한 slice가 다른 slice의 private internal을 import합니다.
- Shared/common module에 ownership 없는 product-specific behavior가 들어갑니다.
- Migration이 public import, generated route, test fixture를 staged plan 없이 깨뜨립니다.
