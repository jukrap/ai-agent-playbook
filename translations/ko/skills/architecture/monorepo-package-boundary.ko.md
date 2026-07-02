# Monorepo Package Boundary

Workspace, package, internal library boundary를 위한 primary architecture skill입니다.

## Workflow

1. Workspace, package manager, package ownership, public export, internal/private module, build graph, affected consumer를 확인합니다.
2. Dependency direction, circular import, versioning, generated type, release impact, affected test/build selection을 확인합니다.
3. Package boundary를 folder convenience가 아니라 ownership과 runtime contract에 맞춥니다.
4. Affected package, compatibility shim, required build/test, release 또는 publish constraint를 기록합니다.

## Reference

Package ownership, import, export, dependency direction에는 `references/package-ownership-dependency-direction.md`를 읽습니다.

Build graph, versioning, generated output, affected verification에는 `references/workspace-release-impact.md`를 읽습니다.
