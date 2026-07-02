# Package Ownership Dependency Direction

변경이 package, app, library, plugin, generated client, shared workspace module을 넘을 때 사용합니다.

## Ownership Checks

- Package owner, intended consumer, public export, private internal, generated output, runtime responsibility를 확인합니다.
- Package manifest, workspace config, path alias, TypeScript project reference, package export, build script를 확인합니다.
- Import direction, forbidden dependency, circular import, peer dependency, dev dependency, optional/runtime dependency를 검사합니다.
- Shared package가 진짜 generic한지 또는 product-specific behavior를 얻었는지 확인합니다.

## Boundary Risks

- Source internal cross-package import는 build, type, release contract를 우회할 수 있습니다.
- Barrel export는 unstable implementation detail을 실수로 publish할 수 있습니다.
- Generated client와 schema는 producing service 또는 package version과 맞아야 합니다.
- Package boundary는 connector 또는 artifact publishing concern을 `backend/connector-integration-change`나 `devops/package-publish-readiness`로 라우팅해야 합니다.

## Stop Conditions

- Package가 public export 대신 다른 package의 private source path를 소비합니다.
- Dependency cycle이 생기거나 기존 cycle이 넓어집니다.
- Shared package에 hidden app-specific config 또는 side effect가 생깁니다.
- Downstream consumer에 대한 version, build, generated output impact가 불명확합니다.
