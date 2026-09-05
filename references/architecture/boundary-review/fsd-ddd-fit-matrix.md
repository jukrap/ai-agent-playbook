# Compare architecture boundaries

Use this reference when a project actually needs a boundary decision. These are comparison prompts, not universal rankings or a requirement to pick a named architecture. Start with [the project's constraints and accepted decisions](../../../docs/project-architecture.md).

| Approach | Useful question | Caution | Possible first change |
| --- | --- | --- | --- |
| Feature-Sliced Design | Would frontend pages, reuse, and explicit imports benefit from shared conventions? | Do not apply it to backend-only code or add layers with no useful role; small size alone does not rule it out | Define the scope and public imports for one page or feature |
| Layered architecture | Are transport, application behavior, and persistence responsibilities mixed? | Extra layers can merely rename the same pass-through logic | Separate one leaking request or persistence boundary |
| DDD modules | Which business invariants and terms must stay consistent as behavior changes? | Do not add aggregates or bounded-context names without a domain reason | Record one domain invariant and its owner |
| Modular monolith | Can one deployable application benefit from clear internal ownership? | Splitting folders alone does not enforce an interface | Define one module entrypoint and its permitted callers |
| Monorepo packages | Do parts need distinct build, test, or release ownership? | Extraction adds dependency and release coordination | Define exports and checks for one actual package boundary |
| Legacy compatibility seam | Which existing contract must stay stable while internals change? | A wrapper needs a purpose and a removal or maintenance condition | Add a bounded adapter around the changing interface |

Use imports, routes, manifests, tests, and runtime responsibilities as evidence of what exists. Compare that evidence with the intended contract; do not silently treat current code as the final design.

Record the chosen scope, reasons, allowed dependencies, exceptions, verification, and revisit condition. A small provisional structure may be enough when future requirements are unclear. Keep the decision with the project and revise it when new evidence changes the tradeoff.
