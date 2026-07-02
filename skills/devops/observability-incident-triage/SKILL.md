---
name: observability-incident-triage
description: Use when triaging incidents, production errors, alerts, latency, error rates, queue backlogs, job failures, logs, metrics, traces, or post-incident runbooks.
---

# Observability Incident Triage

Use this as the primary DevOps skill for active incidents and production signal review.

## Workflow

1. Capture the symptom, start time, impacted users/services, severity, recent changes, and available logs/metrics/traces.
2. Prefer containment and rollback when user impact is active; do not delay mitigation for perfect root cause.
3. Correlate signals across deploys, dependencies, queues, jobs, resources, and error boundaries before changing code.
4. Verify recovery with the same signal that showed the incident, then record follow-up actions and durable runbook updates.

## Reference

Read `references/incident-evidence.md` for active incident intake, containment, and handoff.

Read `references/logs-metrics-traces.md` when interpreting observability evidence.
