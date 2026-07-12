# Automation Attempt Reset Recovery 0.5.9

Version 0.5.9 fixes retry recovery for blocked automation tasks without rewriting existing run ledgers.

## What changed

- Runtime tasks now separate resettable retry-budget usage (`attempts`) from the monotonic claim count (`attemptSerial`).
- The reducer reconstructs `attemptSerial` by replaying existing `task.claimed` events, so pre-0.5.9 schema v2 runs need no migration or ledger rewrite.
- `automation resume --reset-attempts` still resets the retry budget and last failure, but the next tick uses the next unused serial for claim, workspace, evidence, delivery, failure, and recovery event IDs.
- Interrupted-attempt recovery also keys its event ID from the monotonic serial.

## Compatibility and safety

- Existing append-only ledgers remain authoritative and unchanged.
- Derived `state.json`, `summary.md`, and `handoff.md` can be rebuilt from the existing plan and ledger as before.
- A blocked run can resume under its original run ID after review; creating a replacement run is no longer required solely to avoid an attempt event-ID collision.

## Verification focus

- Three failed attempts exhaust the budget.
- An explicit reset returns the budget usage to zero while preserving serial 3.
- The following tick records `attempt:4` and a new failure instead of reusing or conflicting with an earlier event.
