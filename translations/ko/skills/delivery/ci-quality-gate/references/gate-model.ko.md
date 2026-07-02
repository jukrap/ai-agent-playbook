# CI Quality Gate Model

## Inputs

- Change scope: file, package, service, migration, generated artifact, docs, release target.
- Gate owner: residual risk를 수락할 수 있는 사람 또는 팀.
- Required checks: merge, release, handoff, publish, deploy 전에 반드시 통과해야 하는 check.
- Optional checks: confidence를 높이지만 기본적으로 block하지 않는 check.
- Skip policy: 누가 check를 skipped로 표시할 수 있는지, 이유, 유효 기간.
- Evidence source: CI job, local command, artifact report, runtime schema, manual QA, release dry-run.

## Check Status

- `pass`: named check가 의도한 scope와 현재 revision에 대해 실행됨.
- `fail`: check가 실행됐고 blocking 문제를 찾음.
- `skipped`: 예상 check가 owner와 reason을 가진 채 의도적으로 생략됨.
- `unavailable`: outage, missing credential, missing fixture, environment gap 때문에 실행할 수 없음.
- `stale`: check가 현재 revision, artifact, config, target environment보다 오래됨.
- `not-applicable`: change scope에 적용되지 않으며 이유가 기록됨.

## Decision Rules

- Required `fail`, `unavailable`, stale check는 gate를 block합니다.
- Required `skipped` check는 skip policy가 owner, reason, expiry, compensating evidence를 명시하지 않으면 block합니다.
- Optional check failure는 자동 block은 아니지만 관련 있으면 residual risk에 기록해야 합니다.
- green aggregate status만으로 충분하지 않습니다. 확인한 command, job, artifact, revision을 이름으로 남깁니다.
- generated runtime report는 evidence candidate로 봅니다. 안정적인 fact는 review 후에만 승격합니다.

## Stop Conditions

- Required check가 unknown 또는 undocumented입니다.
- CI status를 review 대상 source revision 또는 artifact와 연결할 수 없습니다.
- claimed pass/fail에 대한 log, artifact, command output이 없습니다.
- Required check에 사용할 credential 또는 external access가 없습니다.
- Gate owner가 unknown이고 blocking check가 skipped 또는 unavailable입니다.
- 같은 flaky check 결과를 retry limit 또는 stabilization plan 없이 반복합니다.
