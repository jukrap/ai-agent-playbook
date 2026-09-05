# Destructive Action Review

Destructive action은 rollback이 비싸거나 불가능할 수 있어 더 강한 evidence가 필요합니다. Delete, recursive move, overwrite, rewrite, schema/data change, publish/deploy action, write-tool escalation은 다르게 증명되기 전까지 high-risk로 봅니다.

## Before Proceeding

다음 fact가 필요합니다.

- destructive 또는 applied action에 대한 explicit user instruction,
- resolved target list와 target root,
- 각 target이 scope에 들어가는 이유,
- 도구가 지원하는 경우 dry-run 또는 preview output,
- backup, restore, rollback, recreation path,
- known generated 또는 managed-file status,
- related test 또는 validation command,
- expected post-check evidence.

## Path And Scope Safety

- Note와 public docs에는 project-relative target path를 씁니다.
- Recursive delete 또는 move 전에 resolved absolute path가 intended workspace 또는 명시된 target root 안에 있는지 확인합니다.
- 한 shell에서 생성한 file list를 다른 shell의 delete/move command로 넘기지 않습니다.
- Feature, migration, release work에 unrelated cleanup을 섞지 않습니다.
- Promotion path가 명시되지 않았다면 managed runtime output과 trusted memory를 분리합니다.

## Write-Tier Escalation

- Read-only analysis가 기본값입니다.
- Scaffold write에는 previewed target path와 non-destructive output이 필요합니다.
- Managed playbook write에는 manifest, dry-run result, audit trail이 필요합니다.
- Project write에는 explicit opt-in이 필요하며 MCP에서 default로 노출하지 않습니다.
- Live deploy, publish, migration, credential action에는 project-defined runbook 또는 explicit user direction이 필요합니다.

## Stop Conditions

다음 상황에서는 action 전에 멈춥니다.

- Instruction이 모호하거나 destructive step을 허가하지 않습니다.
- Target path가 unbounded, review되지 않은 computed path, intended root 밖입니다.
- Dry-run output이 stated intent와 충돌합니다.
- Rollback이 선언되지 않은 backup 또는 external system에 의존합니다.
- Generated evidence가 검토 없이 trusted memory로 승격됩니다.
- Action이 credential, personal path, private URL, branch name, PR number, raw private log를 노출합니다.
