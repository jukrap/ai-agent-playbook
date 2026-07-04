# Logs Metrics Traces

## Logs

- Structured field, correlation/request ID, 안전한 경우 tenant/account ID, route/job name, error class, dependency name을 우선합니다.
- First error와 반복되는 downstream noise를 분리합니다.
- 결론을 내리기 전에 log sampling, retention, clock skew, redaction, deployment version label을 확인합니다.
- Secret, token, personal data, full noisy log를 durable doc에 붙여넣지 않습니다.

## Metrics

- Rate, ratio, saturation signal을 비교합니다: error rate, request rate, latency percentile, queue depth, retry, CPU, memory, disk, connection pool, external dependency latency.
- Metric window를 deploy/change window와 user report에 맞춥니다.
- Denominator trap을 주의합니다. Count가 낮으면 높은 percentage가 오해를 만들 수 있고, aggregate health는 특정 segment impact를 숨길 수 있습니다.
- Alert가 symptom, cause, synthetic check 중 무엇에 반응하는지 확인합니다.

## Traces

- Trace로 slow span, failing dependency, retry, fan-out, cold start, context propagation 누락을 식별합니다.
- 같은 route/job의 successful trace와 failed trace를 비교합니다.
- Missing span은 dependency가 관련 없다는 proof가 아니라 instrumentation gap에 대한 evidence로 다룹니다.

## Verification

- Recovery는 green deploy만이 아니라 impact를 대표한 signal로 판단해야 합니다.
- Mitigation 후 log, metric, trace, queue, job, synthetic 또는 user-path smoke check를 확인합니다.
- 남은 uncertainty와 follow-up instrumentation gap을 기록합니다.
