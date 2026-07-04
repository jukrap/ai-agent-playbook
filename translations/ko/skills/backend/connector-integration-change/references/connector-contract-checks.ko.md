# Connector Contract Checks

Connector, node, adapter, import/export bridge, sync job, MCP integration을 추가하거나 변경할 때 사용합니다.

## Contract Surface

- Host runtime registration: manifest, package metadata, exported class/function, schema, node list, tool list, command list, adapter registry.
- External API surface: base URL, version, auth method, scope, request payload, response payload, pagination, filtering, sorting, rate limit.
- Operation behavior: create/read/update/delete, trigger, webhook, polling, batch, streaming, import, export, dry-run mode.
- Compatibility: existing workflow, saved config, generated schema, UI label, documentation, deprecation path.

## Review

- 모든 새 runtime file이 host runtime 또는 package manifest에 등록되는지 확인합니다.
- Connector name, operation name, metadata가 안정적이고 discoverable한지 확인합니다.
- Stack/vendor detail은 local project doc이나 reference에 두고 primary skill은 capability-first로 유지합니다.
- Project가 safe live verification을 이미 정의하지 않았다면 live call보다 contract example과 sandbox fixture를 우선합니다.

## Stop Conditions

- Connector가 registered/discoverable하지 않은 채 ship될 수 있습니다.
- Contract change가 migration 또는 compatibility note 없이 saved config를 깨뜨립니다.
- Required API scope 또는 permission이 불명확합니다.
- Connector가 live external state에 의존하지만 반복 가능한 verification path가 없습니다.
