# Backend Change Safety

server-side 변경 중 API mapping 또는 server-rendered flow만의 문제가 아닌 변경을 다룰 때 쓰는 primary backend skill입니다.

## Workflow

1. 수정 전에 entrypoint, owner, runtime mode, data store, side effect, downstream consumer를 확인합니다.
2. 변경을 additive, compatible, behavior-changing, destructive, operational, integration-facing 중 하나로 분류합니다.
3. controller, service, repository, worker, config, module entrypoint의 기존 responsibility boundary를 유지합니다.
4. request path, async path, retry/idempotency, permission, configuration, log/metric, rollback shape를 검증합니다.
5. repository stack이 확인된 뒤에만 `references/stacks/`의 해당 stack profile을 읽습니다.

## Reference

shared runtime, persistence, integration risk가 있는 backend 변경을 구현하거나 review하기 전 `references/backend-change-checklist.md`를 읽습니다.
