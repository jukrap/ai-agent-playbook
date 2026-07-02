# Compose And Kubernetes Change

## Inventory

- Workload: service, deployment, stateful set, job, cron job, worker, sidecar, init container, local Compose service.
- Runtime config: image, command, args, environment, config map, secret, service account, resource request/limit, probe, restart policy.
- Connectivity: service, ingress, route, network, DNS name, port, protocol, TLS, dependency service.
- Storage: volume, claim, mount path, persistence, backup/restore expectation, ownership.

## Review

- 변경을 stateless rollout, stateful rollout, network exposure, permission change, resource change, operational behavior change로 분류합니다.
- Rolling deploy 중 old replica와 new replica가 함께 실행될 수 있는지 확인합니다.
- Env/config 변경은 default behavior, missing-value behavior, secret rotation impact를 확인합니다.
- Probe 변경은 startup, readiness, liveness, graceful shutdown을 분리해서 검증합니다.
- Volume 변경은 deploy 전에 ownership, persistence, backup, restore, rollback compatibility를 확인합니다.
- Network/ingress 변경은 internal/external exposure, TLS, auth, CORS, upstream timeout assumption을 확인합니다.

## Verification

- Repository-defined manifest validation, Helm/Kustomize/Compose config render, dry-run command.
- Template이 있으면 rendered manifest diff.
- User 또는 dependent service와 같은 network path를 통한 smoke test.
- Rollout 이후 log, event, health endpoint, readiness, error-rate check.
- Old config/image가 current storage와 dependency로도 시작할 수 있는지 rollback check.

## Stop Conditions

- Volume 또는 schema change가 rollback을 unsafe하게 만들 수 있습니다.
- Secret, service account, ingress, network policy가 review 없이 access를 넓힙니다.
- Healthcheck 변경이 broken startup을 숨기거나 느리지만 유효한 boot path를 kill할 수 있습니다.
- Resource change가 capacity evidence 없이 shared node나 queue를 고갈시킬 수 있습니다.
