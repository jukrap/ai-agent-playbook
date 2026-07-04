# Workspace Release Impact

Package boundary가 build order, test, versioning, publishing, deployment, release note에 영향을 줄 때 사용합니다.

## Impact Inventory

- 영향을 받는 workspace, app, package, internal library, generated client, schema, example, docs, CI job.
- Package manager와 tooling: npm, pnpm, yarn, bun, Turborepo, Nx, Rush, Lage, Gradle, Maven, .NET solution, custom script.
- Build graph, test graph, typecheck graph, dependency graph, release graph는 다를 수 있습니다. 변경에 맞는 graph를 확인합니다.
- Public API가 바뀌면 changelog, version bump, package publish, app deploy, compatibility note를 확인합니다.

## Verification

- Repository-defined affected command가 있으면 우선합니다.
- Blast radius에 따라 package-level build, typecheck, test, lint, integration check를 실행하거나 명시합니다.
- Release 전에 generated output과 committed artifact를 확인합니다.
- Skipped package와 안전하게 생략한 이유를 기록합니다.

## Stop Conditions

- Public package API가 downstream caller inventory 없이 바뀝니다.
- Generated type/client/schema 변경이 documented command로 재현되지 않습니다.
- Affected package selection이 workspace tooling 또는 dependency evidence가 아니라 추정입니다.
- Release 또는 deployment impact가 package boundary를 넘지만 owner 또는 rollback note가 없습니다.
