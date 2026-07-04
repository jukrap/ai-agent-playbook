# Notice Attribution Checks

NOTICE, attribution, copied material이 artifact에 함께 ship되어야 할 수 있을 때 사용합니다.

## Notice Surface

- Repository root와 package/artifact output의 license 및 NOTICE file.
- Vendored code, bundled asset, font, icon, generated code, template, example, dataset, binary dependency에 대한 third-party notice.
- Package metadata, app store metadata, marketplace description, documentation, downloadable bundle.

## Checks

- Required attribution이 artifact 또는 project가 기대하는 documentation 위치에 남아 있는지 확인합니다.
- Package include/exclude rule을 required license 및 notice file과 비교합니다.
- Copied snippet, generated file, bundled asset에 필요할 때 source와 license annotation이 있는지 확인합니다.
- Notice update는 그것을 요구하는 dependency, asset, package, artifact change와 같은 변경에 둡니다.

## Stop Conditions

- Required notice 또는 license file이 shipped artifact에 없습니다.
- Vendored 또는 generated file의 provenance가 불명확합니다.
- Copied snippet 또는 asset의 permission/attribution requirement가 불명확합니다.
- Policy review 없이 redistribution scope가 넓어졌습니다.
