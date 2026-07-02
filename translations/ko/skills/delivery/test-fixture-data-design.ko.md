# Test Fixture Data Design

Reliable test data와 fixture boundary를 위한 primary delivery skill입니다.

## Workflow

1. 테스트할 behavior, fixture owner, lifecycle, scope, cleanup requirement를 확인합니다.
2. Inline sample, factory, builder, seed, mock, contract example, snapshot, golden file, isolated database 중 가장 가벼운 stable fixture를 선택합니다.
3. Fixture는 contract drift를 잡을 만큼 현실적이되 failure를 진단할 수 있을 만큼 작게 유지합니다.
4. Fixture update가 behavior change에서 명확히 실패하고 unrelated regression을 숨기지 않는지 확인합니다.

## Reference

Fixture type, scope, isolation, ownership을 고를 때는 `references/fixture-boundaries.md`를 읽습니다.

Sample data, snapshot, golden file을 장기적으로 유용하게 유지할 때는 `references/test-data-maintenance.md`를 읽습니다.

