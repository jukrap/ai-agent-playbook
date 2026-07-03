# 비동기 경계와 멱등성

백엔드 변경이 worker, queue, 예약 작업, webhook, event handler, retry loop, 외부 callback, 오래 실행되는 background work를 건드릴 때 이 참고 자료를 사용합니다.

## 목록화

- 진입점: queue consumer, 예약 작업, webhook route, event handler, message broker subscription, CLI batch, worker process, serverless trigger.
- 전달 모델: 최대 한 번, 최소 한 번, 정확히 한 번이라는 주장, backoff 재시도, dead-letter queue, 수동 replay, provider 재전달.
- 상태 전이: 대기, 처리 중, 성공, 실패, 재시도 가능, dead-letter 처리, 취소, 보상 처리, 이미 적용됨.
- 멱등성 key: 요청 ID, provider event ID, 비즈니스 자연 key, unique constraint, 정규화 payload hash, 명시 operation ID.
- 부수 효과: 데이터베이스 변경, outbound API 호출, email/SMS, 파일/객체 쓰기, cache invalidation, 감사 로그, 과금 동작, 알림.

## 경계 규칙

- 로컬 아키텍처가 허용한다면 메시지 파싱, 검증, 비즈니스 판단, 상태 전이, 부수 효과 실행을 분리합니다.
- 되돌릴 수 없는 부수 효과를 반복하기 전에 중복 전달을 감지할 수 있도록 이벤트 식별자를 저장합니다.
- 어떤 오류가 재시도되고 어떤 오류가 영구 실패인지, 어떤 backoff를 쓰는지, 마지막 오류를 어디에 기록하는지 명시합니다.
- 외부 provider payload는 캡처 후 변경하지 않습니다. 비즈니스 로직 전에 내부 command나 event로 정규화합니다.
- 부수 효과를 보호하는 상태 전이는 transaction 또는 compare-and-set update로 감쌉니다.
- worker 전용 가정을 HTTP controller나 요청 범위 session helper 안에 숨기지 않습니다.

## Webhook과 callback 점검

- 신뢰한 payload field를 파싱하기 전에 signature, timestamp, replay window, sender identity, expected environment를 검증합니다.
- provider contract에 명확히 허용된 경우가 아니라면 durable capture 전에 success를 반환하지 않습니다.
- replay와 audit을 위해 raw event identity와 sanitized payload metadata를 저장하되, 기본적으로 secret이나 전체 민감 payload를 로그에 남기지 않습니다.
- 순서가 뒤바뀐 전달과 알 수 없는 future event type을 안전하게 처리합니다.
- provider credential, endpoint, test fixture에는 sandbox/live mode 분리를 둡니다.

## Job과 queue 점검

- 동시 실행 제한, worker 종료 동작, visibility timeout, lease extension, poison message 처리를 확인합니다.
- batch contract가 그렇다고 말하지 않는 한 batch 안의 한 실패 항목이 나머지를 조용히 버리지 않게 합니다.
- 오래 실행되는 작업과 backfill에는 durable checkpoint를 사용합니다.
- 작업이 여러 resource를 넘나들면 cancellation과 rollback 의미를 명확히 둡니다.
- queue depth, age, retry, failure, dead-letter count, stuck processing state를 모니터링합니다.

## 검증

- 중복 전달 테스트: 같은 message나 webhook이 두 번 전달되어도 durable result는 하나이고 duplicate signal은 명확해야 합니다.
- 재시도 테스트: transient failure가 retry되어도 되돌릴 수 없는 부수 효과를 중복 실행하지 않습니다.
- 영구 실패 테스트: invalid payload나 denied permission은 예상한 failed/dead-letter state로 갑니다.
- 순서 테스트: 늦게 오거나 먼저 오거나 dependency event가 빠져도 상태를 망가뜨리지 않습니다.
- 종료 테스트: side effect 전후 worker interruption이 resume되거나 복구 경로를 명확히 보고합니다.
- 관측성 점검: log/metric/trace는 secret을 유출하지 않으면서 message ID, operation ID, retry count, final state를 식별합니다.
