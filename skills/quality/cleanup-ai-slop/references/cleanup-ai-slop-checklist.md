# Cleanup AI Slop Checklist

## Cleanup targets

- Repeated helper functions that do the same thing with different names.
- Exact normalized function-body clone cues after checking callers, side effects, and tests.
- Overly defensive branches that cannot happen under the real contract.
- Generic names such as `data`, `result`, `item`, or `handleThing` when local meaning is knowable.
- Comments that restate code, explain obvious assignments, or preserve outdated assumptions.
- Large functions that mix parsing, validation, I/O, rendering, and formatting without a real reason.
- Inline constants that should share a local named value.
- Blanket try/catch blocks that hide useful errors.
- Mocked, placeholder, or sample-like logic left inside production paths.
- Unused imports, variables, files, fixtures, or copied fragments.

## Boundaries

- Do not change behavior just because a cleaner design is available.
- Do not rename exported APIs, route names, public types, database fields, or persisted keys unless the request includes migration work.
- Do not replace a local pattern with a new abstraction unless it removes real duplication or risk.
- Do not treat an exact clone cue as proof that the functions are interchangeable.
- Do not combine cleanup with unrelated feature work.
- Keep formatting-only edits separate when the repository does not already format touched files.

## Behavior lock

Use at least one:

- existing passing tests that cover the touched behavior;
- a new focused regression test;
- a before/after CLI output sample;
- a browser or UI state check;
- a small fixture that demonstrates unchanged parsing, rendering, or data mapping.

## Review before finishing

- Check `git diff` for accidental behavior changes.
- Check public contracts and snapshots if touched.
- Remove new helper names that hide more than they explain.
- Record verification commands or manual evidence actually used.
