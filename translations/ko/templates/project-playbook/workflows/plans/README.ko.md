# Plans

여기에는 진행 중인 실행 plan만 둡니다.

이 저장소에서 날짜가 붙은 plan 파일을 만들려면:

```powershell
node .\bin\aapb.mjs plan new <target-repo> --title "short-plan-title"
```

## 규칙

- plan은 다른 agent가 실행할 수 있을 만큼 결정이 충분해야 합니다.
- scope, out-of-scope, 확인할 file/area, verification, risk, commit boundary를 포함합니다.
- 완료, 대체, stale 상태가 된 plan은 `../archive/`로 옮깁니다.
- `plans/`를 map, note, prompt, old handoff를 다 넣는 임시 보관함처럼 쓰지 않습니다.
- 크거나 관심사가 섞인 작업에는 commit checkpoint를 적어 미래 agent가 모든 변경을 한 commit에 넣지 않게 합니다.

## 권장 형식

```md
# Plan Title

## Goal

## Scope

## Steps

## Verification

## 커밋 체크포인트

## Risks
```
