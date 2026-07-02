# Package Publish Readiness

Package와 shipped artifact readiness를 위한 primary devops skill입니다.

## Workflow

1. Package manager, registry, artifact type, release channel, version source, generated output, rollback path를 확인합니다.
2. Package metadata, included file, entrypoint, binary, platform asset, README, license, notice, changelog, publish script를 검토합니다.
3. Generic registry advice보다 repository-defined pack/publish dry-run과 provenance check를 우선합니다.
4. 실제 artifact evidence, skipped check, release risk, rollback 또는 unpublish constraint를 기록합니다.

## Reference

Package metadata, entrypoint, file inclusion, version review에는 `references/package-metadata-checks.md`를 읽습니다.

Pack/publish dry-run evidence와 artifact boundary check에는 `references/artifact-dry-run-checks.md`를 읽습니다.
