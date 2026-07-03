# Deep Module Design Review

Use this reference when a codebase feels fragmented, a helper or module exposes too much of its internals, or a proposed refactor may only move complexity to a new place.

## Identify Shallow Boundaries

Look for modules where:

- The public interface is almost as complex as the implementation it hides.
- Callers must know ordering, internal flags, cache details, persistence details, or error choreography.
- A concept requires opening many small files before the behavior is understandable.
- Helpers exist mainly for testability but do not concentrate decisions.
- A shared utility has many unrelated callers and no clear domain owner.
- A wrapper merely renames an underlying API without reducing caller knowledge.

## Deletion Test

Before proposing a split or extraction, ask:

- If this module disappeared, would complexity become more concentrated or just move to callers?
- Would the replacement interface have fewer concepts than the implementation behind it?
- Which invariants would become easier to enforce in one place?
- Which current tests would survive unchanged because the public behavior is stable?
- What would become harder to change, and is that acceptable?

If the answer is mostly "complexity moves around", do not call it an architecture improvement.

## Design It Twice

For a serious boundary redesign, compare at least two materially different interfaces before choosing:

- Minimal interface: one to three entry points, maximum leverage per call.
- Flexible interface: more extension points, explicit policy/config objects.
- Caller-optimized interface: the most common use case is trivial and safe.
- Ports/adapters interface: external dependencies sit behind clear adapters.

Compare alternatives by:

- Depth: how much implementation complexity the interface hides.
- Locality: how much future change stays in one module.
- Coupling: which dependencies cross the boundary.
- Testability: which behavior can be verified without exposing internals.
- Migration cost: adapters, compatibility shims, and staged import moves.

## Evidence To Gather

- Import graph or package dependency direction.
- Public exports, callers, and call sites.
- Repeated parameter groups, option objects, flags, and error handling patterns.
- Domain vocabulary from docs, tests, UI labels, database names, or API names.
- Existing tests that express the desired stable behavior.

## Output

Keep the recommendation compact:

- Current friction: what makes change or understanding expensive.
- Candidate deeper interface: the smallest stable contract that could hide the complexity.
- What moves behind the boundary: parsing, validation, persistence, cache, external calls, policy, or orchestration.
- Migration slice: first safe step and compatibility plan.
- Verification: tests, import checks, graph checks, and behavior evidence.

## Stop Conditions

- No caller or import evidence was checked.
- The redesign depends on replacing the whole architecture at once.
- The new interface introduces more concepts than it removes.
- The module is only shallow because the domain question is still unknown.
- The user asked for a narrow fix and the boundary redesign is not required for safety.
