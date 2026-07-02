# Reference Adoption Ledger

`_reference/` 같은 local reference collection을 검토할 때 이 ledger를 사용합니다. 원문을 그대로 붙이지 말고 local decision을 기록합니다.

| Status | Reference ID | Capability | Useful Pattern | Local Adoption | Risk/Noise | Decision Date |
| --- | --- | --- | --- | --- | --- | --- |
| new |  |  |  |  |  |  |

## Status Values

- `new`: 발견했지만 아직 검토하지 않음.
- `reviewed`: 분석했지만 아직 채택하지 않음.
- `adopted`: local skill, workflow, MCP surface, validator, reference로 전환함.
- `deferred`: 유용하지만 현재 batch 대상은 아님.
- `rejected`: 이 harness에 맞지 않거나 계속 들고 가기에는 noise가 큼.

## Rules

- 큰 upstream excerpt 원문을 붙이지 않습니다.
- 개인 절대 경로, credential, internal URL, branch name, PR number를 넣지 않습니다.
- pattern을 일반화한 뒤에는 upstream project name보다 capability name을 우선합니다.
- 정리된 local note나 채택된 file만 연결합니다.
