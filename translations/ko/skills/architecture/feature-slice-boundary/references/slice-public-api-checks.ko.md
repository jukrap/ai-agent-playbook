# Slice Public API Checks

Boundary가 index file, barrel export, route loader, feature API, component library, shared module로 표현될 때 사용합니다.

## Public API Review

- Caller가 무엇을 import해야 하고 무엇은 private이어야 하는지 확인합니다.
- Index/barrel export, route file, generated API file, package export, module alias, path mapping을 확인합니다.
- Public surface에 포함되는 name, type, default, side effect, CSS/asset, tree-shaking behavior를 확인합니다.
- Migration이 필요한 caller와 re-export compatibility가 필요한지 기록합니다.

## Migration Notes

- FSD 또는 feature-sliced migration에서는 최종 이상형 트리가 아니라 다음 안전한 slice를 정의합니다.
- Old import가 넓게 퍼져 있고 behavior 안정성이 필요하면 adapter file을 유지합니다.
- Dependency direction과 ownership이 개선되지 않는다면 taxonomy 충족만을 위해 파일을 옮기지 않습니다.
- 넓은 architecture decision에는 `boundary-review`를 사용하고, public API가 workspace package를 넘으면 `monorepo-package-boundary`를 사용합니다.

## Stop Conditions

- Caller inventory 없이 public import가 제거됩니다.
- Shared barrel이 unstable implementation detail을 export하기 시작합니다.
- Generator/runtime 검증 없이 generated file 또는 framework route convention을 옮깁니다.
- Boundary documentation이 실제 import behavior와 모순됩니다.
