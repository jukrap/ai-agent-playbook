# FSD와 DDD 적합성 매트릭스

Frontend, backend, full-stack, monorepo code에서 어떤 boundary model을 고를지 판단할 때 사용합니다.

## 적합성 매트릭스

| 접근 | 잘 맞는 경우 | 약한 경우 | 첫 안전 조치 |
| --- | --- | --- | --- |
| Feature-Sliced Design | pages, widgets, features, entities, shared UI/lib가 보이고 feature 간 결합이 반복되는 UI 중심 app. | Backend-only service, 작은 app, 안정된 feature boundary가 없는 app. | 한 feature 또는 shared layer의 public import를 정의합니다. |
| Layered architecture | Controller, service, repository, adapter, infrastructure가 이미 있고 의존 방향만 새는 경우. | Domain behavior가 불명확해 layer 이름이 인위적인 경우. | Request/session concern을 낮은 layer에서 제거합니다. |
| DDD modules | Business invariant, aggregate, policy, bounded context가 변경 위험의 중심인 경우. | 강한 domain language가 없는 CRUD/reporting/integration glue. | Aggregate 또는 policy boundary 하나를 이름 붙이고 invariant를 보호합니다. |
| Modular monolith | 하나의 deployable app 내부에 ownership, dependency rule, optional extraction이 필요한 경우. | Package split이 미관용이고 tooling이 enforce하지 못하는 경우. | Module entrypoint를 만들고 deep import를 금지합니다. |
| Monorepo packages | 독립 build/test/release ownership이 중요한 경우. | Shared code가 dumping ground가 될 가능성이 큰 경우. | Package export와 dependency direction check를 추가합니다. |
| Legacy seam | Compatibility와 hidden coupling이 위험의 중심인 경우. | Rewrite가 이미 계획되어 있고 별도 scope로 안전하게 가능한 경우. | Behavior change 전에 adapter/shim을 추가합니다. |

## 결정 규칙

- Import, entrypoint, package manifest, route, test, runtime ownership의 증거에서 시작합니다.
- 다음 regression을 막는 가장 작은 boundary model을 고릅니다.
- 조직에서 FSD를 쓴다는 이유만으로 backend code에 FSD를 강요하지 않습니다.
- Business language가 안정되지 않았으면 DDD 이름을 붙이지 않습니다.
- Folder naming만으로는 부족하며 documented public API를 우선합니다.

## 산출물

- 선택한 boundary model과 선택하지 않은 모델의 이유.
- 결정이 적용되는 directory 또는 module.
- 허용 import, 금지 import, 예외 경로.
- Boundary drift를 감지할 command 또는 search.
