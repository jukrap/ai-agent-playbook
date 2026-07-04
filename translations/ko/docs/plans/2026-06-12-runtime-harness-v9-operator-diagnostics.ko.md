# Runtime Harness V9 Operator Diagnostics

**목표:** 더 강한 runtime automation을 검토하기 전에 operator가 rule, verification command, terminal layout issue를 명시적으로 확인할 수 있는 read-only diagnostics를 추가합니다.

**구조:** 문서와 CLI 하네스를 기본 경로로 유지합니다. Local project file을 읽고 structured JSON을 반환하는 작은 CLI command를 추가합니다. 이 명령들은 hook을 설치하지 않고, project verification command를 실행하지 않고, file을 쓰지 않고, network call을 하지 않습니다.

## 범위

- `rules check <target> [--path <file>] [--json]` 추가.
- `diagnostics check <target> [--json]` 추가.
- `qa tui-check <capture-file> [--cols N] [--json]` 추가.
- 모든 check를 no-write로 유지.
- Runtime hook은 변경하지 않음.
- Source docs와 Korean translation에 command 문서화.

## Rule Matching

`rules check`는 portable rule source를 찾고 각 rule이 path에 적용되는지 보고합니다.

초기 source:

- `.ai-agent-playbook/rules/**/*.md`
- `.github/instructions/**/*.md`
- `.cursor/rules/**/*.md`
- `.claude/rules/**/*.md`
- `.github/copilot-instructions.md`
- `CONTEXT.md`

Root `AGENTS.md`는 의도적으로 제외합니다. 지원되는 agent는 보통 이 파일을 native로 읽기 때문입니다. Directory rule은 `alwaysApply: true`, `globs: ["src/**/*.ts"]`, YAML list-style `globs` 같은 단순 frontmatter를 지원합니다.

## Diagnostics Discovery

`diagnostics check`는 project metadata를 읽고, 실행하지 않은 상태로 likely local verification command를 나열합니다.

초기 command 후보:

- 흔한 `package.json` script: `check`, `test`, `test:run`, `lint`, `typecheck`, `build`
- Command rendering을 위한 package manager lockfile: `pnpm-lock.yaml`, `yarn.lock`, `package-lock.json`, Bun lockfile
- `pyproject.toml`의 Python marker
- Rust `Cargo.toml`
- Go `go.mod`

Command 후보가 없어도 failure가 아니라 warning입니다. 일부 프로젝트는 verification을 runbook이나 CI에 둘 수 있기 때문입니다.

## TUI QA

`qa tui-check`는 terminal capture를 읽고 아래를 보고합니다.

- line width
- max width
- overflow line
- CJK wide-character column
- ANSI 존재 여부
- 단순 box-drawing border width mismatch

Overflow 또는 border misalignment가 발견되면 non-zero로 종료합니다. CLI table, terminal UI, generated terminal report, CJK text layout check에 사용합니다.

## 테스트

- 공백과 비ASCII target path가 있는 rule matching.
- Root `AGENTS.md`가 rule matching에서 제외되는지 확인.
- Malformed rule frontmatter가 command 실패가 아니라 warning을 내는지 확인.
- Diagnostics command discovery가 local metadata를 읽고 command를 실행하지 않는지 확인.
- Diagnostics command가 없으면 failure가 아니라 warning인지 확인.
- TUI check가 file write 없이 CJK width와 overflow를 보고하는지 확인.

## 비목표

- Blocking hook 없음.
- Continuation 없음.
- Automatic doctor execution 없음.
- Automatic LSP server management 없음.
- 이 slice에서는 browser screenshot diff 없음.
- Settings write 없음.
- Network call 없음.

## 검증

아래를 실행합니다.

```powershell
npm run check
npm test
.\scripts\validate-skills.ps1
.\scripts\validate-translations.ps1
.\scripts\sync-skills.ps1 -WhatIf
.\install.ps1 -SkipValidation -WhatIf
.\update.ps1 -SkipValidation -WhatIf
git diff --check
```

Merge 전 public documentation에서 external harness name과 fixed local absolute path도 검색합니다.
