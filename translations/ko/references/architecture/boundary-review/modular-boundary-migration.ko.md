# 모듈 경계 마이그레이션

Boundary repair에 staged move, adapter, shim, import rule, package ownership 변경이 필요할 때 사용합니다.

## 마이그레이션 형태

1. Test, screenshot, contract, runtime evidence로 현재 behavior를 고정합니다.
2. Migration 후 caller가 사용해야 할 가장 작은 public surface를 찾습니다.
3. 내부 이동 전에 adapter 또는 facade entrypoint를 추가합니다.
4. 가능하면 behavior change 없이 파일을 먼저 이동합니다.
5. Import를 public entrypoint로 바꾸고 caller가 넓으면 temporary compatibility shim을 유지합니다.
6. Repository가 유지할 수 있는 곳에만 boundary check, lint rule, package export, docs를 추가합니다.
7. Search와 test로 old import가 사라졌다는 증거가 있을 때 shim을 제거합니다.

## 경계 증거

- Deep import에 대한 import graph 또는 `rg` search.
- Package export, alias, tsconfig path, barrel file, route registration, dependency manifest.
- Migration 후 regression test를 어느 package/feature가 소유하는지.
- 어떤 process, route, worker, deploy artifact가 module을 load하는지.

## 위험 제어

- 사용자가 명시적으로 위험을 수용하지 않았다면 move-only change와 behavior change를 분리합니다.
- Owner가 하나뿐인 code를 새 shared bucket으로 옮기지 않습니다.
- Adapter는 좁게 유지하고 compatibility를 보호하지 않게 되면 제거합니다.
- 여러 phase가 필요하면 migration status를 project docs에 기록합니다.

## 검증

- 이동된 boundary에 대한 build/typecheck/import-lint.
- Caller와 moved module의 기존 test.
- Old path와 forbidden deep import search.
- Primary entrypoint runtime smoke.
- Ownership 또는 architecture rule이 바뀌면 worklog 또는 ADR.
