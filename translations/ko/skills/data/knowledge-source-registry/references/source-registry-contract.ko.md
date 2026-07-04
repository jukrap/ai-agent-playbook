# Source Registry Contract

Source registry는 어떤 knowledge source가 있고, 어떻게 search/browse할 수 있으며, 어떤 evidence가 promote 가능한지 설명합니다. Credential이나 private payload를 넣지 않고 access와 locator shape를 설명해야 합니다.

## Registry Location

Project-local source metadata에는 `.ai-agent-playbook/knowledge/sources.json`을 사용합니다. Source summary는 `knowledge/references/`, exploratory note는 `knowledge/research/`, generated report는 `runtime/`에 둡니다.

## Source Entry

각 source entry에는 다음을 포함합니다.

- `id`: 안정적인 lowercase hyphenated source id.
- `type`: file, docs, issue-tracker, chat, database, object-store, web, runtime-index, report, other.
- `title`: reader-facing source name.
- `owner`: person, team, repository, 또는 declared unknown owner.
- `status`: available, building, partial, unavailable, failed, stale, unknown.
- `privacyTier`: public, internal, confidential, restricted, unknown.
- `credentialBoundary`: none, environment variable name, local file reference, managed connector, manual-only. Secret value는 저장하지 않습니다.
- `updateCadence`: manual, on-change, scheduled, external, deprecated, unknown.
- `freshness`: last checked time, source version, commit, snapshot id, stale reason.
- `locatorTypes`: path-range, URL, primary-key, row-id, thread-id, object-id, artifact-path, query-id 같은 locator shape.
- `searchModes`: keyword, structured query, semantic, hybrid, browse-only, manual.
- `browse`: exact evidence를 다시 여는 command, URL pattern, CLI, MCP resource, manual step.
- `promotionPolicy`: fact가 reference, map, contract, decision, worklog, runtime-only evidence 중 어디로 승격될 수 있는지.
- `caveats`: access limit, partial coverage, stale index risk, legal/privacy limit, missing owner.

## Status Semantics

- `available`: search와 browse를 현재 사용할 수 있습니다.
- `building`: source를 indexing 또는 configuring 중입니다.
- `partial`: 일부 range, permission, field가 unavailable입니다.
- `unavailable`: source는 알려져 있지만 지금 접근할 수 없습니다.
- `failed`: 최근 check가 실패해 diagnosis가 필요합니다.
- `stale`: source에 접근 가능하지만 outdated임을 알고 있습니다.
- `unknown`: 현재 status를 증명하는 check가 없습니다.

## Privacy Rules

- Credential reference만 저장하고 credential value는 저장하지 않습니다.
- Public docs에는 personal absolute path를 피하고 project-relative 또는 source-relative locator를 사용합니다.
- Raw private chat transcript, ticket payload, database row, object content, 긴 external excerpt를 commit하지 않습니다.
- Generated source index는 `memory/`가 아니라 `runtime/`에 둡니다.
- Locator와 freshness evidence가 있는 reviewed fact만 promote합니다.
