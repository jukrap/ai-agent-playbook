# Document Ingestion And Chunking

Document, file, page, ticket, runbook, PDF, knowledge base가 searchable 또는 retrieval-backed data가 될 때 사용합니다.

## Ingestion

- Source owner, access model, sync cadence, parser, file type, extraction quality, retention을 확인합니다.
- 가능하면 portable non-secret reference로 source path 또는 identifier를 추적합니다.
- Document version, modified time, title, section, language, source provenance metadata를 보존합니다.
- Access control이 명확하지 않으면 secret, credential, private direct identifier, restricted content를 제외합니다.

## Chunking

- Chunk size, overlap, section boundary, table/code handling, dedupe, metadata inheritance를 정의합니다.
- Chunk가 관련 없는 private content를 누출하지 않으면서 citation에 필요한 충분한 context를 보존하는지 확인합니다.
- Deleted, moved, renamed, updated source document가 chunk를 어떻게 invalidate하는지 기록합니다.
- Generated chunk/index payload는 검토 전까지 runtime storage에 둡니다.

## Stop Conditions

- Source ownership, permission model, freshness rule이 불명확합니다.
- Parser output이 중요한 structure를 caveat 없이 누락합니다.
- Chunk metadata를 source까지 추적할 수 없습니다.
- Restricted content가 access control 없이 shared index에 들어갑니다.
