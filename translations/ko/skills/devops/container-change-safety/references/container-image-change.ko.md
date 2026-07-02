# Container Image Change

## Inventory

- Image source: Dockerfile, generated image recipe, buildpack, base image, language runtime image, CI build step.
- Build context: included file, `.dockerignore`, generated asset, secret, cache mount, copied dependency manifest.
- Runtime surface: exposed port, entrypoint, command, user, filesystem permission, environment variable, healthcheck, shipped artifact.
- Supply-chain surface: base image tag/digest, package manager command, OS package, curl/install script, provenance, SBOM, vulnerability policy.

## Review

- Base image tag가 repository release risk에 맞게 충분히 pinned 되었는지 확인합니다. Release-critical image에서는 digest 또는 repository convention을 우선합니다.
- Package manager cache, install script, OS package, downloaded binary를 supply-chain surface로 취급합니다.
- Build secret이 안전하게 mount 또는 injection되고 layer, log, final artifact에 복사되지 않는지 확인합니다.
- Repository가 multi-stage build를 쓰면 build-only tooling이 runtime stage에 남지 않게 합니다.
- Entrypoint나 command를 바꾸기 전에 user permission, writable path, timezone/locale, certificate, process signal handling을 확인합니다.
- Dependency installation, bundling, runtime base를 바꿀 때 image size와 startup behavior를 비교합니다.

## Verification

- Repository-defined image build 또는 package command.
- 가능한 경우 static Dockerfile/container lint.
- Repository가 지원하는 dependency, SBOM, license, vulnerability scan.
- Expected entrypoint, env shape, healthcheck, port binding 기준 smoke run.
- Previous image tag/digest 또는 artifact source를 명시한 rollback note.

## Stop Conditions

- 변경이 image layer나 log에 secret을 노출할 수 있습니다.
- 새 image를 release path에 필요한 수준으로 재현 가능하게 rebuild할 수 없습니다.
- Runtime user, permission, entrypoint, healthcheck behavior가 불명확합니다.
- Deployment에 container diff로 다루지 않은 data migration 또는 config change가 필요합니다.
