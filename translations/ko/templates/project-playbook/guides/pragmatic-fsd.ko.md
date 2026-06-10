# Pragmatic FSD

프로젝트가 이미 Feature-Sliced Design 또는 유사한 layered frontend architecture를 사용할 때만 이 guide를 사용합니다.

## Apply when

- existing code가 FSD boundaries를 따릅니다.
- project docs가 FSD를 명시적으로 요구합니다.
- 변경이 slices, entities, features, widgets, shared layers를 건드립니다.

## Do not apply when

- 프로젝트가 작고 layered convention이 없습니다.
- codebase가 다른 architecture를 씁니다.
- FSD 도입이 task와 관련 없는 broad restructure가 됩니다.

## Rules

- existing layer names와 import direction을 따릅니다.
- 프로젝트가 이미 그 convention을 쓸 때만 local index files를 통한 public APIs를 명확히 합니다.
- internal files로 deep import를 피합니다.
- 명확한 product responsibility가 없는 one-off code를 위해 새 slice를 만들지 않습니다.
- textbook purity보다 local consistency를 우선합니다.

Durable architecture decision은 `ai-playbook/decisions/` 또는 프로젝트 architecture docs에 기록합니다.
