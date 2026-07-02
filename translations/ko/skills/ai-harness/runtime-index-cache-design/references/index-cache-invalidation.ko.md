# Index Cache Invalidation

Index, graph, cache, generated report가 stale해질 수 있을 때 사용합니다.

## Freshness Signals

- Source file hash, modified timestamp, manifest hash, lockfile hash, config version, tool version, target path.
- Generated timestamp와 scan range.
- Preview-only와 applied status.
- Generated output directory, vendor folder, local-only archive 같은 known exclusion.

## Invalidation Rules

- Source file, manifest, lockfile, config file, scan parameter가 바뀌면 rebuild합니다.
- Source evidence가 missing, changed, current contract보다 오래되었으면 stale로 표시합니다.
- High-risk analysis에서 stale data로 조용히 fallback하지 않습니다.
- Optional embedding/vector index는 provider, privacy, cost, invalidation rule이 명시되지 않는 한 기본 비활성으로 둡니다.

## Promotion Rules

- Full cache payload가 아니라 concise reviewed fact를 승격합니다.
- 유용하면 promoted fact를 source report로 다시 연결합니다.
- Source file이나 contract가 바뀌면 promoted fact를 다시 확인합니다.
- Cached inference를 proof처럼 다루지 말고 confidence와 freshness를 기록합니다.

## Stop Conditions

- Cache에 invalidation trigger가 없습니다.
- Stale generated report를 warning 없이 current evidence로 사용합니다.
- Optional network 또는 embedding provider가 default로 켜져 있습니다.
- Runtime cache payload를 public docs나 trusted memory에 wholesale copy합니다.
