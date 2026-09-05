# Forge coordination

GitHub/Gitea integration retains reviewed coordination plans, stable managed markers, optimistic concurrency checks, idempotent reuse and partial-failure results. It does not own task execution, scheduling, source changes, commits or pushes.

forge status is local inspection. forge bootstrap, sync and reconcile are previews unless --apply is given. Sync/reconcile read a reviewed project-relative JSON plan. Existing provider operation plans and task/coordination input remain supported; the provider must match the selected repository remote.

--offline, --no-remote and --remote-read-only prevent remote writes. Authentication is resolved only for an explicitly applied remote operation. Existing safeguards for destructive operations and provider capability limits remain. Read previews do not acquire credentials or call remote transport.

Provider tests use scripted transports for duplicate reuse, stale updatedAt checks, permission failures, retry and partial application. They are not evidence of live remote publication. Old automation and schedule records remain available through record reads and pinned 0.5.11 recovery. They are not automatically changed or deleted.
