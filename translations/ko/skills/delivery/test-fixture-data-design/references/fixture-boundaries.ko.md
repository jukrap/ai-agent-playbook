# Fixture Boundaries

Test data를 어떻게 표현할지 고를 때 사용합니다.

## Fixture Types

- Inline sample: 작은 pure function과 edge case에 적합합니다.
- Factory 또는 builder: 여러 test가 작은 variation이 있는 valid object를 필요로 할 때 적합합니다.
- Contract example: API, event, queue, integration boundary에 적합합니다.
- Seed 또는 test database: query behavior, migration compatibility, realistic join이 중요할 때 적합합니다.
- Mock 또는 fake: external dependency가 느리거나, 비싸거나, nondeterministic하거나, 사용할 수 없을 때 적합합니다.
- Snapshot 또는 golden file: diff가 읽기 쉽고 의도적인 stable structured output에 적합합니다.

## Boundaries

- Fixture ownership은 보호하는 behavior 또는 contract 가까이에 둡니다.
- 모든 test가 mutate하는 global fixture를 피합니다.
- Public contract보다 더 많이 아는 mock을 피합니다.
- Personally identifying, customer, credential, production data를 fixture에 넣지 않습니다.
- Portable relative fixture path와 deterministic sample value를 선호합니다.

