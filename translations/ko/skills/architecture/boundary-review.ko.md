---
name: boundary-review
description: Use when reviewing architecture boundaries, FSD layers, DDD modules, monorepo package ownership, dependency direction, or cross-module coupling.
---

# Boundary Review

module과 layer boundary를 위한 primary architecture skill입니다.

## Workflow

1. code, docs, package layout, import에서 의도된 architecture boundary를 확인합니다.
2. dependency direction, public API, shared utility, feature ownership, data flow를 확인합니다.
3. 새 architecture를 강제하기보다 local convention을 우선합니다.
4. 사용자가 redesign을 요청하지 않았다면 broad restructuring보다 작은 boundary repair를 먼저 제안합니다.

