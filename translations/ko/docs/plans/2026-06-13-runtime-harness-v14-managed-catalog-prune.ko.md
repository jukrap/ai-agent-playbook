# Runtime Harness V14 Managed Catalog and Prune

**목표:** Runtime automation 강도를 올리지 않고 managed playbook ownership 검토와 선택 삭제 UX를 개선합니다.

**구조:** Document/CLI harness를 기본 경로로 유지합니다. Managed catalog는 read-only입니다. Managed prune은 preview-first이며, `--apply`가 있을 때 명시적으로 선택한 수정되지 않은 managed file 하나만 제거합니다.

## 범위

- `managed catalog <target> [--json]`을 추가합니다.
- `managed prune <target> --path <managed-path> [--apply] [--json]`을 추가합니다.
- 기존 `managed check`, `managed adopt`, `managed uninstall`, operator diagnostics 동작은 호환되게 유지합니다.
- Hook, slash command, automatic doctor execution, continuation, blocking feedback은 추가하지 않습니다.

## 동작

`managed catalog`는 managed marker와 file inventory를 보고합니다.

- 절대 경로 없는 manifest metadata;
- 각 managed entry의 file status;
- kind/status별 summary;
- modified 또는 missing managed file conflict.

`managed prune`은 선택 제거 경로입니다.

- Preview mode는 파일을 쓰지 않습니다.
- Path input은 portable relative managed path여야 하며 Windows separator는 normalize합니다.
- Unmanaged, missing, modified, absolute, parent-traversal path는 실패합니다.
- Apply mode는 선택된 수정되지 않은 파일만 제거하고 manifest를 갱신합니다.
- `.gitignore` 정리는 manual로 남깁니다.

## Public Interface

```powershell
node .\bin\aapb.mjs managed catalog <target> --json
node .\bin\aapb.mjs managed prune <target> --path .ai-agent-playbook/guides/runtime-harness.md --json
node .\bin\aapb.mjs managed prune <target> --path .ai-agent-playbook/guides/runtime-harness.md --apply --json
```

`managed catalog --json`은 `{ schemaVersion, ok, target, manifestPath, manifest, summary, files, warnings, conflicts }`를 반환합니다.

`managed prune --json`은 `{ schemaVersion, ok, target, applied, summary, operations, warnings, conflicts }`를 반환합니다.

## 테스트

- `managed catalog`가 파일 쓰기 없이 kind/status summary를 보고하는지 확인합니다.
- `managed prune` preview가 파일을 쓰지 않는지 확인합니다.
- `managed prune --apply`가 선택한 unchanged managed file만 제거하고 manifest를 갱신하는지 확인합니다.
- Modified, missing, unmanaged, absolute, Windows-style path input을 안전하게 처리하는지 확인합니다.
- 기존 전체 테스트는 계속 통과해야 합니다.

## 후속

- 실제 프로젝트 smoke check로 catalog output이 managed cleanup 판단에 충분히 명확한지 확인합니다.
- Cleanup을 automatic hook으로 승격하지 않습니다. Cleanup은 operator-triggered이고 reviewable하게 유지합니다.
