# Runtime Harness V27-V30: MCP 도구와 Deep Analysis

## 요약

V27-V30은 기존 CLI 옆에 MCP 도구 표면을 추가합니다. CLI는 사람이 직접 실행하는 운영자용 명령으로 유지하고, MCP는 AI 앱이 playbook 진단, 검색, contract, context, QA 도구를 자연어 작업 중 직접 호출할 수 있는 표면으로 둡니다.

첫 MCP 계층은 read-only입니다. Hook 설치, 설정 파일 쓰기, rename, rewrite, project test 실행, network 호출, blocking, continuation은 포함하지 않습니다.

Deep analysis는 명시적으로 요청할 때만 AST-grep과 TypeScript/JavaScript 언어 신호를 더합니다. 기본 `operator analyze`는 `--deep`이 없으면 가볍게 유지합니다.

## 목표

- `aapb mcp` 로컬 stdio MCP 서버를 추가합니다.
- Context, operator diagnostics, rules, contracts, managed state, QA용 read-only playbook 도구를 노출합니다.
- 공통 AST/언어 분석 로직을 쓰는 `operator analyze --deep`을 추가합니다.
- AST 검색과 TypeScript/JavaScript diagnostics, symbols, references, definitions용 개별 MCP 도구를 제공합니다.
- 기본 동작은 계속 명시 실행, local-only, no-write로 유지합니다.
- CLI, MCP, skills, adapters, `.ai-agent-playbook/`의 역할을 문서화합니다.

## 범위 밖

- Slash command 패키지는 만들지 않습니다.
- Codex plugin 패키징은 하지 않습니다.
- 원격 MCP 서버나 호스팅 서비스는 만들지 않습니다.
- AST rewrite/apply는 넣지 않습니다.
- LSP rename은 넣지 않습니다.
- Automatic doctor execution은 넣지 않습니다.
- Blocking hook, continuation, approval cache, LLM judge는 넣지 않습니다.

## 공개 인터페이스

### CLI

```powershell
npx ai-agent-playbook mcp
npx ai-agent-playbook operator analyze <target> --deep --path src/example.ts --json
```

`aapb mcp`는 로컬 stdio MCP 서버를 시작합니다. 사람이 터미널 출력을 보려고 직접 쓰는 명령이 아니라, MCP를 지원하는 AI 앱이 실행하는 명령입니다.

`operator analyze --deep`은 기존 analyze schema를 유지하면서 아래 `deep` 섹션을 추가합니다.

- `astGrep`
- `lsp.status`
- `lsp.diagnostics`
- `lsp.symbols`

### MCP 도구

첫 read-only MCP 도구 목록은 아래와 같습니다.

- `playbook_context`
- `operator_check`
- `operator_search`
- `operator_research`
- `operator_preflight`
- `operator_delta`
- `operator_map`
- `operator_audit`
- `rules_check`
- `context_status`
- `context_list`
- `contracts_check`
- `contracts_list`
- `managed_check`
- `managed_catalog`
- `diagnostics_check`
- `qa_image_diff`
- `operator_analyze_deep`
- `ast_grep_search`
- `lsp_status`
- `lsp_diagnostics`
- `lsp_symbols`
- `lsp_references`
- `lsp_definition`

모든 도구는 read-only annotation으로 등록합니다. Handler는 가능한 기존 CLI 결과 생성 함수를 재사용하고, 구조화된 JSON과 짧은 text 요약을 함께 반환합니다.

## Deep Analysis 형태

AST 검색은 로컬 source file만 읽고 relative path, line, column, language, snippet을 반환합니다. Rewrite와 apply는 의도적으로 제외합니다.

TypeScript/JavaScript 언어 분석은 TypeScript compiler API를 read-only local engine으로 사용합니다. Status, diagnostics, symbols, references, definitions를 보고합니다. Project file이나 config가 없으면 차단이 아니라 warning signal로 반환합니다.

다른 언어는 `operator map`에서 감지될 수 있지만, 전용 LSP 지원은 TypeScript/JavaScript부터 시작합니다.

## Adapter Config

`adapter config <target> --adapter codex --json`은 MCP 설정 예시를 포함합니다.

```json
{
  "mcpServers": {
    "aapb": {
      "command": "npx",
      "args": ["ai-agent-playbook", "mcp"]
    }
  }
}
```

Global install 사용자는 `aapb mcp`를 사용할 수 있습니다. 이 설정 렌더링은 settings file을 쓰지 않습니다.

## 테스트 계획

- MCP tools/list가 예상 read-only 도구 이름을 노출합니다.
- MCP tool call이 `schemaVersion`, `ok`, summary 형태의 structured content를 반환합니다.
- MCP list와 call은 파일을 쓰지 않습니다.
- `operator analyze --deep --json`이 light analyze path를 깨지 않고 `deep` 섹션을 추가합니다.
- AST 검색이 TypeScript fixture에서 동작하고 relative path를 보고합니다.
- TypeScript diagnostics, symbols, references, definitions가 Windows path, 공백 path, 비ASCII path에서 동작합니다.
- 언어 도구가 없으면 명령을 막지 않고 warning을 반환합니다.
- Adapter config가 placeholder나 개인 경로 없이 MCP 설정 예시를 포함합니다.
- 문서와 한국어 번역을 함께 갱신합니다.

## 검증

최종 검증 항목:

```powershell
npm run check
npm test
npm pack --dry-run --json
.\scripts\validate-skills.ps1
.\scripts\validate-translations.ps1
.\scripts\sync-skills.ps1 -WhatIf
.\install.ps1 -SkipValidation -WhatIf
.\update.ps1 -SkipValidation -WhatIf
git diff --check
```

공개 문서 denylist와 로컬 절대 경로 검색도 실행하고, 실제 대상 프로젝트에서 MCP 설정 렌더링과 deep analysis smoke test를 확인합니다.
