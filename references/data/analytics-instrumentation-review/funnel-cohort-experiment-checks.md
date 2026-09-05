# Funnel Cohort Experiment Checks

Use this when analytics instrumentation affects funnels, cohorts, attribution, retention, or experiments.

## Funnel And Cohort

- Define entry event, conversion event, exclusion criteria, time window, identity grain, and denominator.
- Check event ordering, duplicate events, late events, anonymous-to-known user stitching, and cross-device behavior.
- Confirm cohort membership rules, refresh cadence, backfill behavior, and historical comparability.
- Record caveats when the dataset is partial, sampled, delayed, or filtered.

## Experiments

- Define assignment unit, randomization source, exposure event, variant labels, holdout rules, and analysis window.
- Check guardrail metrics, metric ownership, sample ratio mismatch, bot/test traffic, and peeking risk.
- Confirm instrumentation remains stable across rollout, rollback, and feature flag states.
- Keep experiment results separate from implementation evidence until reviewed.

## Stop Conditions

- Denominator, identity grain, or analysis window is unclear.
- Experiment assignment cannot be tied to exposure and outcome events.
- Funnel or experiment relies on unreviewed or stale tracking changes.
- Privacy or consent status is unknown for the event data.
