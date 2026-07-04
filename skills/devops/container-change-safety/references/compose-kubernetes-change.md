# Compose And Kubernetes Change

## Inventory

- Workload: service, deployment, stateful set, job, cron job, worker, sidecar, init container, or local Compose service.
- Runtime config: image, command, args, environment, config map, secret, service account, resource request/limit, probe, and restart policy.
- Connectivity: service, ingress, route, network, DNS name, port, protocol, TLS, and dependency service.
- Storage: volume, claim, mount path, persistence, backup/restore expectation, and ownership.

## Review

- Classify the change as stateless rollout, stateful rollout, network exposure, permission change, resource change, or operational behavior change.
- Check whether old and new replicas can run together during rolling deploys.
- For env/config changes, confirm default behavior, missing-value behavior, and secret rotation impact.
- For probe changes, verify startup, readiness, liveness, and graceful shutdown separately.
- For volume changes, check ownership, persistence, backup, restore, and rollback compatibility before deploy.
- For network/ingress changes, verify internal/external exposure, TLS, auth, CORS, and upstream timeout assumptions.

## Verification

- Repository-defined manifest validation, Helm/Kustomize/Compose config render, or dry-run command.
- Diff rendered manifests when templates are involved.
- Smoke test through the same network path users or dependent services use.
- Logs, events, health endpoint, readiness, and error-rate checks after rollout.
- Rollback check that old config/image can still start with current storage and dependencies.

## Stop Conditions

- A volume or schema change could make rollback unsafe.
- A secret, service account, ingress, or network policy broadens access without review.
- Healthcheck changes can mask broken startup or kill slow-but-valid boot paths.
- Resource changes could starve shared nodes or queues without capacity evidence.
