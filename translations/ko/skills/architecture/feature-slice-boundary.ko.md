# Feature Slice Boundary

Feature, slice, route, module boundary를 위한 primary architecture skill입니다.

## Workflow

1. FSD, vertical slice, feature-first, layered label을 적용하기 전에 code와 docs에서 project architecture를 확인합니다.
2. Allowed import, public API file, shared/common usage, state ownership, UI/API boundary, test placement를 확인합니다.
3. 요청된 변경에 migration 또는 redesign이 명시되지 않았다면 local convention을 보존합니다.
4. Coupling risk, moved ownership, compatibility shim, verification command를 기록합니다.

## Reference

Feature, layer, slice, dependency direction check에는 `references/feature-slice-layering.md`를 읽습니다.

Public API file, shared module, migration safety에는 `references/slice-public-api-checks.md`를 읽습니다.
