# Retrieval Evaluation And Safety

Retrieval quality, citation, access control, stale index, vector/search provider boundary를 검토할 때 사용합니다.

## Evaluation

- Representative question, expected source document, answerability, citation requirement, negative case를 정의합니다.
- 가능하면 recall, precision, citation correctness, stale-result rate, no-answer behavior를 측정합니다.
- Permission-filtered case와 restricted-document denial case를 포함합니다.
- Retrieval evidence와 answer-generation quality가 함께 있을 때는 둘을 분리합니다.

## Safety And Freshness

- Embedding, vector, network provider는 privacy, cost, retention, invalidation rule이 있는 opt-in으로 유지합니다.
- Source change, parser change, chunking change, embedding model change, metadata change에 따른 index rebuild trigger를 정의합니다.
- Citation이 accessible, current, relevant source를 가리키는지 확인합니다.
- Stale index, provider outage, empty result, access denied에 대한 fallback behavior를 제공합니다.

## Stop Conditions

- Retrieval이 사용자가 접근할 수 없는 document를 노출할 수 있습니다.
- Index freshness, provider retention, rebuild trigger를 모릅니다.
- Citation이 없거나 stale하거나 source chunk와 연결되지 않습니다.
- Evaluation이 happy-path question만 사용합니다.
