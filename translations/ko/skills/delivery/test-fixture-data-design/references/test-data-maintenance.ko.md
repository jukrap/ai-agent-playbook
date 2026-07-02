# Test Data Maintenance

Fixture가 failure를 숨기거나 noisy update를 만들기 시작할 때 사용합니다.

## Maintenance Checks

- Fixture가 여전히 실제 contract, schema, user behavior를 설명하는가?
- Reader가 각 required field가 왜 존재하는지 이해할 수 있는가?
- Generated ID, date, order, randomness, locale이 deterministic한가?
- Snapshot이 review할 만큼 작고 regression을 잡을 만큼 구체적인가?
- Golden file에 update command와 review expectation이 있는가?
- Cleanup이 test가 만든 state만 제거하고 unrelated data를 건드리지 않는가?

## Update Rules

- Fixture는 그 fixture가 문서화하는 behavior 또는 contract 변경과 같은 change에서 갱신합니다.
- 큰 snapshot/golden diff는 PR 또는 worklog에 설명합니다.
- Shared fixture를 더 복잡하게 만들기보다 focused fixture를 추가하는 것을 선호합니다.
- Stale fixture는 그 signal에 의존하는 test가 없는지 확인한 뒤 삭제합니다.

