# Observability Release Loop

Use this reference when release readiness depends on runtime evidence after deploy, not just pre-merge checks.

## Signal Inventory

- Service health: uptime, readiness, startup errors, crash loops, and restart count.
- User path: request rate, error rate, latency, saturation, and key business metric.
- Async path: queue depth, queue age, retry count, dead-letter count, worker lag, and job duration.
- Data path: migration status, backfill progress, data freshness, reconciliation count, and cache invalidation.
- Client path: frontend error logs, asset load failures, WebSocket reconnects, mobile crash rate, and support signals.

## Release Loop

1. Define expected signal movement before release.
2. Confirm dashboards or queries exist for the changed surface.
3. Deploy or dry-run the artifact with version identity recorded.
4. Watch leading indicators first: startup, config, migration, queues, and error bursts.
5. Watch user-impact indicators next: latency, critical flow success, and support-visible failures.
6. Decide continue, pause, rollback, or accept risk with evidence.

## Alert And Log Rules

- Alerts should distinguish deploy regression, dependency outage, data-specific repair, and expected migration noise.
- Logs should include version, route/job, operation id, sanitized error code, and tenant/workspace only when safe.
- Metrics should avoid high-cardinality sensitive values.
- Post-deploy checks should include the runtime mode touched by the release, not only HTTP traffic.

## Evidence

- Release version or artifact digest.
- Dashboard/query links or copied command output when links are not portable.
- Time window for observation.
- Decision: continue, rollback, pause, or accepted risk.
