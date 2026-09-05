# Stabilization And Quarantine

Use this when deciding whether to fix, retry, quarantine, or delete a flaky test.

## Stabilization

- Replace sleeps with state-based waits, deterministic clocks, controlled queues, or explicit readiness checks.
- Isolate shared state with unique data, transaction cleanup, temp directories, fresh browser contexts, or reset hooks.
- Make assertions target durable user-visible state or contract output rather than incidental timing.
- Keep the fix near the failing test unless production behavior is actually wrong.

## Quarantine

Quarantine is acceptable only when the failure blocks delivery and cannot be stabilized immediately.

Record:

- owner and follow-up date;
- failure signature and reproduction command;
- reason quarantine is safer than deletion;
- replacement signal that still protects the release;
- conditions for re-enabling the test.

## Avoid

- Blanket retries without investigation.
- Deleting coverage without documenting the lost signal.
- Expanding timeouts before checking whether the wait condition is wrong.

