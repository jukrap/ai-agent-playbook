# Regression Baseline Policy

Capability history는 실행 결과가 비교 가능할 때만 유용합니다. Baseline은 무엇이 바뀌었고, 무엇이 안정적으로 유지되었으며, 어떤 evidence가 너무 noisy한지 설명해야 합니다.

## Comparable Baselines

다음 field가 호환될 때만 entry를 비교합니다.

- capability id와 check id,
- OS family와 중요한 shell behavior,
- runtime version range,
- dependency install mode,
- feature flag와 permission tier,
- fixture 또는 target project shape,
- network 또는 external-service availability,
- command argument 또는 MCP prompt input.

이 field가 의미 있게 다르면 regression이라고 부르지 말고 새 baseline을 기록합니다.

## Rolling History

- 최근 witness entry를 append-only로 유지합니다.
- 최신 comparable entry에서 current capability status를 요약합니다.
- Release-critical check에는 stable baseline pointer를 둡니다.
- Non-release exploratory check는 advisory로 남길 수 있습니다.
- 오래된 baseline을 retired할 때 reason을 기록합니다.

## Regression Signals

다음은 regression candidate로 봅니다.

- `pass`가 `fail`, `degraded`, `skipped`, `unknown`으로 바뀝니다.
- Duration, cost, token usage가 선언된 threshold를 넘습니다.
- Coverage가 최소 fixture 또는 workflow count 아래로 떨어집니다.
- Write tool이 default로 노출됩니다.
- Read-only check가 file을 씁니다.
- Generated runtime artifact가 promotion review 없이 durable memory로 이동합니다.

## Noise Handling

- Flaky check는 policy가 pass@k 또는 pass^k를 허용할 때만 다시 실행합니다.
- Repeat attempt를 쓸 때 모든 failed attempt를 보고합니다.
- Partial capability loss는 `degraded`, evidence 부족은 `unknown`을 우선합니다.
- 나중의 pass로 failure를 지우지 않습니다. 둘 다 append하고 recovery를 요약합니다.

## Stop Conditions

다음 상황에서는 capability report를 발행하기 전에 멈춥니다.

- Check가 실행되지 않았는데 report가 pass를 암시합니다.
- Baseline이 non-comparable인데 report가 regression이라고 말합니다.
- 결과가 선언되지 않은 external service 또는 credential에 의존합니다.
- Artifact path가 개인 정보나 비공개 데이터를 노출합니다.
- Status가 command, schema, reviewed evidence가 아니라 narrative claim에 기반합니다.
