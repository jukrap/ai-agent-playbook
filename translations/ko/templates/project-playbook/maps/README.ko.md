# Maps

Maps는 agent가 매 세션 전체 저장소를 훑지 않고도 프로젝트를 탐색하게 돕습니다.

프로젝트에 필요한 map만 만듭니다.

- `repo-map.md`: major folders, entrypoints, ownership.
- `runtime-map.md`: app start, build, deploy, job 실행 방식.
- `route-map.md`: screens, routes, controllers, navigation surfaces.
- `api-map.md`: API clients, DTO boundaries, endpoints, mock/remote switches.
- `data-map.md`: storage, database tables, migrations, files, external data flows.
- `risk-map.md`: shared modules, generated files, compatibility constraints, high-blast-radius areas.

## Rules

- structural claim에는 scan range와 freshness를 적습니다.
- file paths, command output, code references가 있는 사실을 선호합니다.
- map은 code를 대체할 정도로 exhaustive할 필요가 아니라 work를 routing할 만큼 current해야 합니다.
