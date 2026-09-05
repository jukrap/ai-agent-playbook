# Reference Adoption Noise Control

External harness, skill pack, example, project reference를 reusable local guidance로 채택할 때 사용합니다.

## Adoption Path

- Reference를 inventory하고 useful pattern을 capability별로 분류합니다.
- Durable practice, constraint, workflow, verification check를 추출합니다.
- Raw source를 복사하지 않고 local skill, reference, recipe, test, docs로 다시 작성합니다.
- Licensing 또는 attribution에 필요하지 않다면 provenance와 source note를 everyday prompt에서 제외합니다.

## Noise To Remove

- Personal absolute path.
- Company name, customer name, internal URL, credential, token, branch name, PR number, dated operational status.
- Decision 품질을 올리지 않으면서 prompt를 무겁게 만드는 large upstream excerpt.
- 일반화되지 않는 project-specific magic value.

## Useful Patterns To Keep

- Clear trigger routing.
- Required evidence와 stop condition.
- Dry-run first behavior.
- Credential indirection과 destructive-action confirmation.
- Validation script와 catalog check.
- Generated output과 reviewed memory의 분리.

## Stop Conditions

- Adoption이 raw reference text를 local capability guidance로 바꾸지 않고 복사합니다.
- Source-specific noise가 default prompt context가 됩니다.
- Licensing, attribution, redistribution constraint가 불명확합니다.
- Adopted content를 local test, docs, catalog check로 검증할 수 없습니다.
