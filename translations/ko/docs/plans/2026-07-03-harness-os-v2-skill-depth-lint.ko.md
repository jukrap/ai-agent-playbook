# AI Agent Playbook v2 Skill Depth Lint

**목표:** 짧고 trigger-focused한 `SKILL.md` 모델을 버리지 않으면서 skill depth를 보이게 만듭니다.

**이유:** Local audit 결과 이 repository의 `SKILL.md`는 의도적으로 간결한 반면, 여러 external reference skill pack은 훨씬 긴 절차를 skill file 안에 직접 담는 경향이 있었습니다. Local model은 discoverability 면에서 여전히 더 낫지만, 재사용 가능한 깊이는 `references/`, workflow recipe, prompt, validator에 있어야 합니다. 일부 local reference는 아직 그 역할을 하기에는 얕습니다.

**결정:** `SKILL.md`는 짧게 유지합니다. 대신 `skills lint`에 depth metric을 추가하고 shallow reference file을 warning으로 표시해 이후 pack 확장이 trigger file을 시끄럽게 만들지 않고 reference substance를 보강하도록 합니다.

## 범위

- `skills lint --json`에 per-skill depth data를 추가합니다.
- Skill line count, reference file count, average reference line, references가 있는 skill 수, shallow reference count summary metric을 추가합니다.
- Reference file이 shallow-reference threshold보다 짧으면 warning을 냅니다.
- 현재 shallow로 잡힌 legacy stack/profile reference를 실제 stack-specific check를 담을 만큼 확장합니다.
- Command/runtime/maintenance docs와 Korean translation을 갱신합니다.
- Depth summary와 shallow-reference warning behavior에 대한 regression coverage를 추가합니다.

## 비목표

- Shallow reference로 lint를 바로 실패시키지 않습니다. 기존 skill pack을 점진적으로 개선할 수 있도록 먼저 warning으로 둡니다.
- 모든 skill에 reference를 요구하지 않습니다.
- External skill body나 긴 upstream prose를 local public docs에 복사하지 않습니다.
- Installable `SKILL.md` file을 기본적으로 길게 만들지 않습니다.

## 구현 체크리스트

- [x] Plan과 Korean translation을 추가합니다.
- [x] Lint depth summary와 per-skill depth field를 추가합니다.
- [x] Shallow reference warning을 추가합니다.
- [x] Shallow legacy stack/profile reference를 확장합니다.
- [x] Docs와 translation을 갱신합니다.
- [x] Test를 추가합니다.
- [x] Validation을 실행합니다.
- [x] 이 slice를 commit/push합니다.

## 검증

- `npm run check`
- `npm test`
- `node --test test/skills-lifecycle.test.mjs`
- `.\scripts\validate-skills.ps1`
- `.\scripts\validate-translations.ps1`
- `.\scripts\validate-public-docs.ps1`
- `.\scripts\sync-skills.ps1 -WhatIf`
- `.\install.ps1 -SkipValidation -WhatIf`
- `.\update.ps1 -SkipValidation -WhatIf`
- `git diff --cached --check`
