# Artifact Dry-Run Checks

실제로 ship될 내용을 검증할 때 사용합니다.

## Dry-Run Evidence

- Repository-defined package, build, publish dry-run command를 먼저 사용합니다.
- Artifact file list, size, 가능하면 checksum 또는 digest, 관련 warning을 확인합니다.
- Dry-run이 의도한 registry, channel, target platform, package manager 기준인지 확인합니다.
- Artifact를 전체 source tree가 아니라 expected runtime surface와 비교합니다.

## Artifact Review

- Generated output, type declaration, schema, template, binary, migration, static asset, manifest file을 검증합니다.
- CLI shim, plugin discovery, optional dependency, peer dependency, native/platform package의 install behavior를 확인합니다.
- Project가 지원할 때 provenance, attestation, signing, digest binding을 확인합니다.
- Unpublish, rollback, yanking, dist-tag move, marketplace rollback이 가능한지와 실행 권한을 기록합니다.

## Avoid

- 사용자가 명시적으로 요청하지 않았는데 registry에 publish하거나 login하지 않습니다.
- Passing build를 package contents가 맞다는 증거로 취급하지 않습니다.
- Test가 통과했다는 이유로 pack/publish dry-run warning을 무시하지 않습니다.
- Registry token, auth header, full machine-local path를 durable note에 복사하지 않습니다.
