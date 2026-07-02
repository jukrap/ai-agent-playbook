# Container Change Safety

container image와 container runtime 변경을 위한 primary DevOps skill입니다.

## Workflow

1. 변경된 image, build context, runtime manifest, service boundary, environment, secret, volume, network, healthcheck surface를 확인합니다.
2. Build-time risk와 runtime/deployment risk를 분리하고 rollback compatibility에 영향을 주는지 확인합니다.
3. Generic container advice보다 repository-defined build, scan, deploy preview, smoke-test command를 우선합니다.
4. 가장 좁고 신뢰할 수 있는 build/check와 가능한 경우 runtime log 또는 health signal로 image나 manifest를 검증합니다.

## Reference

Dockerfile/image 변경에는 `references/container-image-change.md`를 읽습니다.

Compose, Kubernetes, service runtime, volume, network, healthcheck 변경에는 `references/compose-kubernetes-change.md`를 읽습니다.
