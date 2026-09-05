# Connector Contract Checks

Use this when adding or changing a connector, node, adapter, import/export bridge, sync job, or MCP integration.

## Contract Surface

- Host runtime registration: manifest, package metadata, exported class/function, schema, node list, tool list, command list, or adapter registry.
- External API surface: base URL, version, auth method, scopes, request payload, response payload, pagination, filtering, sorting, and rate limits.
- Operation behavior: create/read/update/delete, trigger, webhook, polling, batch, streaming, import, export, and dry-run mode.
- Compatibility: existing workflows, saved configs, generated schemas, UI labels, documentation, and deprecation path.

## Review

- Confirm every new runtime file is registered in the host runtime or package manifest.
- Check that connector names, operation names, and metadata are stable and discoverable.
- Keep stack/vendor details in local project docs or references; the primary skill stays capability-first.
- Prefer contract examples and sandbox fixtures over live calls unless the project already defines safe live verification.

## Stop Conditions

- A connector can ship without being registered or discoverable.
- A contract change breaks saved configurations without migration or compatibility notes.
- Required API scopes or permissions are unclear.
- The connector depends on live external state but has no repeatable verification path.
