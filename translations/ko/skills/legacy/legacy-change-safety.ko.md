---
name: legacy-change-safety
description: Use when changing legacy code where compatibility, hidden coupling, generated files, deployment shape, or regression risk matters more than modernization.
---

# Legacy Change Safety

compatibility-first change를 위한 primary legacy skill입니다.

## Workflow

1. 코드를 바꾸기 전에 현재 동작을 확정합니다.
2. file, script, generated asset, deployment descriptor, database artifact, manual operation 사이의 hidden coupling을 확인합니다.
3. 요청을 만족하는 가장 작은 behavior-preserving change를 만듭니다.
4. old path와 new path를 검증하고 risk와 rollback note를 기록합니다.
