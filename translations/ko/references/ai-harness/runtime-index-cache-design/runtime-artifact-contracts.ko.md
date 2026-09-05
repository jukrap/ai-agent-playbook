# Runtime Artifact Contracts

Generated report, index, graph, cache file, runtime evidence artifact를 추가하거나 검토할 때 사용합니다.

## Artifact Envelope

- Schema version, kind, target, generated timestamp, mode, summary, warnings, conflicts를 포함합니다.
- 가능하면 evidence에는 portable relative path를 사용합니다.
- Review 또는 sharing 대상 artifact에서 secret, direct personal path, internal URL, token, branch name, PR number를 제거합니다.
- Preview-only report와 applied artifact를 구분합니다.

## Storage Boundaries

- Runtime output은 `runtime/` 또는 동등한 generated-output directory 아래에 둡니다.
- Durable human knowledge는 검토 뒤에만 memory, contract, decision, map, runbook, worklog로 들어갑니다.
- Temporary file은 temp directory에 두고 project policy가 되지 않게 합니다.
- Generated artifact를 production source code가 import하지 않아야 합니다.

## Contract Checks

- Malformed JSON과 missing required field를 graceful하게 validate합니다.
- Tool이 artifact를 route/validate할 수 있도록 stable kind string을 포함합니다.
- Write 발생 여부와 touch된 file을 기록합니다.
- Artifact schema는 관련 없는 payload를 읽지 않아도 agent가 inspect할 수 있을 만큼 작게 유지합니다.

## Stop Conditions

- Runtime output이 검토 없이 durable memory에 쓰입니다.
- Artifact에 schema version, kind, target, generated timestamp가 없습니다.
- Artifact가 non-portable path 또는 sensitive value를 저장합니다.
- Generated report가 future edit의 hidden source of truth가 됩니다.
