# Forge coordination

Forge means a collaboration service such as GitHub or Gitea. AAPB can plan and explicitly apply coordination changes while retaining managed identifiers and reporting conflicts. It does not execute tasks, schedule work, modify source, commit, or push.

## Inspect the selected remote

```sh
aapb forge status "<project>" --json
aapb forge status "<project>" --remote origin --provider github --json
```

Status reads the local Git remote and policy. It does not contact the service or verify credentials. `policyWrites` describes configured policy; `verifiedWrites` requires authentication/permission evidence and must not be inferred from it. Use an explicit provider when automatic detection cannot identify a self-hosted service.

## Preview initial coordination assets

```sh
aapb forge bootstrap "<project>" --milestone "Example delivery" --json
```

This previews labels and the selected milestone without remote calls. Inspect `summary.planned`, the operation IDs/resources in `results`, provider, warnings, and conflicts. `--project-title` and `--project-mode` select project presentation where supported; the CLI defaults to `milestone` mode. A capability or provider target is not proof that the actual remote supports every operation.

## A small reviewed plan

For a GitHub example, save the following as `docs/coordination.json` inside the target project. This operation-plan form makes one label operation explicit; replace it with your reviewed intent before applying.

```json
{
  "provider": "github",
  "operations": [
    {
      "id": "label:docs-reviewed",
      "idempotencyKey": "example.label.docs-reviewed",
      "action": "ensure",
      "resource": "label",
      "capability": "labels",
      "payload": {
        "name": "docs-reviewed",
        "color": "1f883d",
        "description": "Documentation changes reviewed."
      }
    }
  ]
}
```

```sh
aapb forge sync "<project>" --plan docs/coordination.json --json
```

The plan provider must match the selected remote. The preview reports the operation as planned. A reviewed plan can also use the retained task/coordination input: `planId`, tasks, and a `coordination` object with a public program summary, scope, non-goals, success criteria, and grouped delivery information. Use that form when coordinating work groups, not when a single explicit provider operation is sufficient.

`forge reconcile` accepts a reviewed plan at the same project-relative path and plans presentation reconciliation. The CLI result lists operation IDs, resources, and states rather than echoing every payload. Review the input plan alongside this summary; it is not a promise of an atomic remote transaction.

## Apply and authenticate

Only after reviewing the plan, use:

```sh
aapb forge sync "<project>" --plan docs/coordination.json --apply --json
```

This can write remotely. The CLI's default Forge profile is `coordinate`; unlike a skill profile, it governs allowed remote operations. `off` and `observe` do not permit writes. `deliver` and `release` allow additional retained coordination resources such as pull requests; their names do not activate source execution or publishing. Delete and force-push remain denied. Superseding associations requires an additional approval path that the current CLI does not expose; a normal apply does not bypass it.

GitHub authentication uses `GH_TOKEN`, then `GITHUB_TOKEN`, then the selected host's GitHub CLI login. Gitea verifies the server identity and OpenAPI availability before using `GITEA_TOKEN` or `AAPB_FORGE_TOKEN`. Keep credentials in the environment or credential manager, not the plan. A preview does not acquire credentials.

`--offline`, `--no-remote`, and `--remote-read-only` prevent remote writes even with `--apply`. Existing schedules and remote records are not automatically modified or deleted.

## Duplicates, stale state, and partial failure

Managed markers and stable identifiers let repeated coordination reuse existing records. Updates to known issues retain expected remote timestamps such as `expectedUpdatedAt`; a newer remote state is a conflict to review, not a reason to overwrite it blindly.

Read per-operation results after apply. Some operations can succeed before a later failure. Keep successful identifiers, inspect current remote state, revise the reviewed plan, and retry only the intended remaining work. Local project progress is preserved. Skill/layout rollback does not undo remote writes; remote recovery is a separate reviewed provider operation.

Tests use scripted transports for reuse, stale state, permissions, retries, and partial application. They do not establish live GitHub/Gitea write success. See [Verification](verification.md). The old automatic delivery and scheduler commands are retired; [Lifecycle](lifecycle.md) documents pinned-version recovery.
