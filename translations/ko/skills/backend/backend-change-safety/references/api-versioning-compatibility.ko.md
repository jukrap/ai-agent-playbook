# API 버전과 호환성

Backend 변경이 client, generated SDK, webhook, event, import/export, 저장된 payload에 영향을 줄 수 있을 때 사용합니다.

## 계약 목록

- 진입점: HTTP route, RPC method, webhook, event topic, job payload, import/export format, SDK method, form post.
- 소비자: browser UI, mobile app, partner integration, internal service, scheduled job, generated client, dashboard, report.
- 계약 형태: method, path, header, auth, query/body field, enum, default, pagination, sorting, error envelope, rate limit.
- 호환성 증거: OpenAPI/schema, generated type, fixture, snapshot, client code, log, docs, example, migration note.

## 변경 분류

| 분류 | 규칙 |
| --- | --- |
| 추가형 | optional field, unknown enum을 견디는 새 enum, 새 endpoint, 기본 비활성 동작. |
| 호환형 | required field, status code, default, auth, pagination 의미가 그대로 유지되는 변경. |
| 동작 변경 | shape는 같지만 의미, 정렬, 필터, 검증, retry, side effect가 달라지는 변경. |
| breaking | field 제거/rename, 더 엄격한 required value, envelope 변경, auth 변경, id type 변경, enum 비호환. |
| versioned | path/header/media type/topic/schema version을 나누고 old behavior와 migration을 명시한 변경. |

## 검토 규칙

- Server test만으로 호환성을 판단하지 말고 실제 consumer나 generated contract를 하나 이상 확인합니다.
- Error code, validation field path, pagination cursor, webhook retry, idempotency key도 계약으로 봅니다.
- Required field 변경은 expand-and-contract를 우선합니다.
- Generated SDK가 있으면 generation command, package version, typed export, downstream test를 확인합니다.
- Event와 webhook은 versioned payload, additive field, adapter로 old consumer를 보호합니다.

## 검증

- old/new payload contract test 또는 snapshot test.
- UI, SDK, job, webhook, partner-facing path의 consumer test.
- Schema diff 또는 generated type diff.
- 공식 계약이 없으면 recorded fixture 기반 backward compatibility smoke.
- Behavior-changing/breaking 변경은 release note 또는 migration note를 남깁니다.
