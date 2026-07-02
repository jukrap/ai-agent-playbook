# Playbook Layout v2

`.ai-playbook` v2는 오래 유지할 프로젝트 메모리와 도구가 생성한 runtime 산출물, 통합 설정을 분리합니다.

```text
.ai-playbook/
  README.md
  START_HERE.md
  CURRENT.md
  questions.md
  manifest.json
  policy/
  memory/
  workflows/
  knowledge/
  runtime/
  integrations/
  archive/
```

## 디렉터리 역할

- `policy/`: agent 규칙, git 정책, 안전 메모, 범위별 규칙.
- `memory/`: 안정적인 context, map, decision, contract, glossary.
- `workflows/`: recipe, runbook, plan, run, worklog, handoff.
- `knowledge/`: source registry, 채택한 reference, research note.
- `runtime/`: 생성된 cache, index, graph, report, snapshot, 임시 파일.
- `integrations/`: MCP, adapter, hook, command 설정.
- `archive/`: 더 이상 쓰지 않는 로컬 메모.

## Migration

먼저 preview mode로 layout migration을 확인합니다.

```bash
ai-playbook migrate layout <target> --to v2 --json
```

작업 목록을 검토한 뒤 적용합니다.

```bash
ai-playbook migrate layout <target> --to v2 --apply
```

Migration은 v2 디렉터리를 만들고 알려진 v1 파일을 v2 위치로 복사합니다. v1 파일은 삭제하거나 이동하지 않습니다.

