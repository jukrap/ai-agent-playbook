# Fact Gate Checks

Fact gate는 기본 차단기가 아니라 decision aid입니다. 다음 행동이 자신감이 아니라 repository evidence에 기반하도록 action 전에 concrete fact를 강제합니다.

## Required Envelope

Fact gate note에는 다음을 포함합니다.

- `intent`: 최신 user instruction 또는 requested action.
- `actionType`: edit existing, create new, delete, move, migration, config, docs/memory, MCP/tooling, publish/deploy, investigation-only.
- `targetPaths`: project-relative path 또는 target unknown 선언.
- `scanRange`: 확인한 file, directory, command, catalog, index.
- `foundFacts`: source path, command name, locator가 있는 concrete fact.
- `missingFacts`: 아직 unknown인 fact.
- `stopConditions`: action을 멈추거나 좁히는 조건.
- `nextTools`: 권장 read-only tool, preview, validation command.

## Checks By Action Type

### Edit Existing Files

- Importer, caller, route, export, public class/function, package boundary.
- Related test, fixture, generated type, migration, schema file, contract.
- Nearby naming, formatting, error handling, logging, validation pattern.
- File이 건드리는 runtime 또는 deployment surface.

### Create New Files

- Concept에 맞는 existing owner directory 또는 domain cluster.
- Naming pattern, lifecycle owner, import path, export path, deletion path.
- New surface보다 기존 owner의 작은 edit가 더 맞는지 여부.
- 새 file을 참조해야 하는 test, docs, template location.

### Data, Schema, Or Contract Changes

- Current schema/source-of-truth, consumer, migration ordering, seed/backfill need, rollback path.
- Schema inspection, query example, fixture, contract snapshot 같은 read-before-write evidence.
- Generated runtime output을 durable memory로 착각하고 있지 않은지.

### Docs Or Memory Changes

- Existing durable fact, current worklog, runtime evidence, source freshness.
- Public-doc hygiene: personal path, credential, internal URL, branch name, PR number, raw transcript, noisy reference excerpt 없음.
- Translation, archive, owner, maintenance expectation.

### MCP, Tool, Or Harness Changes

- Permission tier, read/write behavior, target path validation, dry-run output, audit trail, read-only default를 증명하는 test.
- Schema contract, prompt/tool name, docs, translation, command reference.

## Evidence Standards

- Absence claim에는 scan range가 필요합니다.
- Structural claim에는 command, path, catalog evidence가 필요합니다.
- User intent는 오래된 plan이 아니라 최신 instruction을 인용하거나 다시 적습니다.
- 확인할 수 없는 fact는 confidence를 만들지 말고 `unknown`으로 기록합니다.
- Generated evidence는 검토와 승격 전까지 `runtime/`에 둡니다.
