# Plans

여기에는 active execution plan만 둡니다.

## Rules

- plan은 다른 agent가 실행할 수 있을 만큼 decision-complete해야 합니다.
- scope, out-of-scope, 확인할 files/areas, verification, risks, commit boundaries를 포함합니다.
- 완료, 대체, stale 상태가 된 plan은 `../archive/`로 옮깁니다.
- `plans/`를 map, note, prompt, old handoff를 다 넣는 catch-all로 쓰지 않습니다.

## Suggested shape

```md
# Plan Title

## Goal

## Scope

## Steps

## Verification

## 커밋 체크포인트

## Risks
```
