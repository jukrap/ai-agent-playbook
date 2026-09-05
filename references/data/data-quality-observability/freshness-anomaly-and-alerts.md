# Freshness Anomaly And Alerts

Use this when reviewing freshness checks, anomaly detection, quality monitors, and data incident alerts.

## Freshness

- Define expected arrival time, allowed delay, timezone, source clock, batch/stream mode, and consumer SLA.
- Track last successful load, latest source event time, latest transformed event time, and latest consumer-visible time.
- Separate upstream delay from transformation failure and dashboard cache delay.
- Mark backfills and replays so they do not look like normal freshness.

## Alerting

- Define severity, owner, routing, quiet hours, escalation, and runbook link.
- Use historical baseline, business calendar, deployment window, and known seasonal patterns before calling an anomaly.
- Include enough evidence to triage without exposing credentials or sensitive rows.
- Record data incident outcomes in a worklog or handoff when consumer impact exists.

## Stop Conditions

- Alert lacks owner, threshold, runbook, or consumer impact.
- Freshness source is ambiguous or derived from a stale cache.
- Anomaly detection has no baseline or known exclusion handling.
- Incident evidence would leak private data into public docs.
