# Funnel Cohort Experiment Checks

Analytics instrumentation이 funnel, cohort, attribution, retention, experiment에 영향을 줄 때 사용합니다.

## Funnel And Cohort

- Entry event, conversion event, exclusion criteria, time window, identity grain, denominator를 정의합니다.
- Event ordering, duplicate event, late event, anonymous-to-known user stitching, cross-device behavior를 확인합니다.
- Cohort membership rule, refresh cadence, backfill behavior, historical comparability를 확인합니다.
- Dataset이 partial, sampled, delayed, filtered라면 caveat를 기록합니다.

## Experiments

- Assignment unit, randomization source, exposure event, variant label, holdout rule, analysis window를 정의합니다.
- Guardrail metric, metric ownership, sample ratio mismatch, bot/test traffic, peeking risk를 확인합니다.
- Rollout, rollback, feature flag state 전반에서 instrumentation이 안정적인지 확인합니다.
- Experiment result는 검토 전까지 implementation evidence와 분리합니다.

## Stop Conditions

- Denominator, identity grain, analysis window가 불명확합니다.
- Experiment assignment를 exposure 및 outcome event와 연결할 수 없습니다.
- Funnel 또는 experiment가 unreviewed/stale tracking change에 의존합니다.
- Event data의 privacy 또는 consent status를 모릅니다.
