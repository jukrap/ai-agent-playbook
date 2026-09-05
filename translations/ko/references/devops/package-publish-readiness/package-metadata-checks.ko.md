# Package Metadata Checks

Package, CLI, plugin, library, extension, marketplace bundle을 release 준비할 때 사용합니다.

## Metadata

- Package name, scope, version, description, keyword, author/maintainer, repository, homepage, bugs, funding, license field.
- Runtime entrypoint: main/module/exports, bin, types, browser, side effect, plugin manifest, native asset, platform package.
- Publication scope: public/private, registry, dist-tag 또는 release channel, package access, signing, provenance, two-factor 또는 approval gate.
- Changelog, release note, migration note, deprecation note, compatibility range.

## File Boundaries

- `files`, ignore file, package manifest, build output, generated asset, source map 같은 include/exclude rule을 확인합니다.
- Consumer에게 필요한 README, license, notice, type declaration, schema, template, runtime asset이 포함되는지 확인합니다.
- Test fixture, local config, credential, private log, raw reference material, machine-specific path는 artifact에서 제외합니다.
- Platform-specific binary 또는 optional package가 supported OS/architecture naming과 installation behavior에 맞는지 확인합니다.

## Stop Conditions

- Version source가 tag, changelog, lockfile, package metadata와 충돌하거나 불명확합니다.
- Public package metadata에 placeholder, internal URL, private name, 잘못된 repository link가 남아 있습니다.
- Runtime entrypoint가 packed artifact에 없는 file을 가리킵니다.
- Release가 stale하거나 documented command로 재현할 수 없는 generated file에 의존합니다.
