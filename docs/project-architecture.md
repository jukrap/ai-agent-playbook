# Choose and evolve a project's architecture

AAPB does not choose a source-code architecture from a framework name. React can use routes, features, FSD, or another documented structure. Different applications in one repository may need different boundaries.

A capable model can propose a structure from the available evidence, but it still needs the project's constraints: deployment units, compatibility, data ownership, team responsibilities, and expected changes. Record decisions future work must preserve. A complete folder tree or a named architecture is not required before every small change.

## Where the decisions belong

| Location | Keep here |
| --- | --- |
| Personal AGENTS.md | Communication, collaboration, and general verification preferences |
| Project AGENTS.md | Applicable project rules, confirmed commands, and links to accepted architecture |
| Existing architecture/specification/decision document | Scope, module ownership, dependency direction, public interfaces, exceptions, and reasons |
| CURRENT.md | The active outcome, relevant architecture decision link, and next step |
| Imports, package exports, tests, or existing boundary checks | Evidence that the implementation follows the decision |

Use an existing document when it serves the purpose. Do not create ARCHITECTURE.md, FSD.md, and an ADR containing the same decision. Illustrative filenames in this guide are not required files.

## Existing projects

Read the relevant instructions and current code before choosing a structure. Identify public imports, routes, build units, state owners, and tests around the change.

- For an ordinary feature or fix, work within accepted boundaries. A new template is not a reason to reorganize the repository.
- If code and the accepted design disagree, state the difference. Code shows what exists; it does not automatically cancel the intended design.
- For an authorized migration, define the affected boundary, caller transition, temporary compatibility, and verification. Migrate a useful portion before expanding the change.
- If the current structure is undocumented, record the few constraints that matter to this task. Ask only when a missing decision materially changes the objective, ownership, or compatibility.

## New projects

Before broad implementation, identify the product shape and choose a proportionate starting structure within the requested scope. For a small application, routes and a few coherent modules may be enough. Add boundaries when they solve an actual ownership, reuse, or deployment problem.

Write down:

1. What part of the project the decision covers and why it helps.
2. Which module owns the behavior, data, and public interface.
3. Which dependencies are permitted and which implementation details stay private.
4. Any known exception, its reason, and when to remove it.
5. What evidence verifies the boundary and what change would justify revisiting it.

Routine choices within an authorized implementation do not need a separate approval ceremony. Follow explicit project approval requirements when they apply. A proposal must not be presented as an already accepted requirement.

## FSD as one option

FSD is an option for frontend application boundaries, not a default for every React/Vite repository or backend. Its [official overview](https://feature-sliced.design/docs/get-started/overview) includes a small app using only app, pages, and shared and permits incremental adoption. Keep the layers that serve the selected design; do not create empty layers just to match a diagram.

If a project chooses FSD, document its scope and actual import contracts. Page-local code can remain with the page; a reuse or ownership need should justify extracting another slice. Use [feature-slice guidance](../references/architecture/feature-slice-boundary/feature-slice-layering.md) and [public API checks](../references/architecture/feature-slice-boundary/slice-public-api-checks.md) when that boundary changes. General [boundary selection](../references/architecture/boundary-review/fsd-ddd-fit-matrix.md) also covers other structures.

## A decision that can evolve

This example describes one possible project decision, not AAPB's required layout:

```markdown
# Frontend module boundaries

Status: accepted
Scope: the browser application

Routes compose screens. Each feature owns its UI, local state, and API adapter.
Features expose a small public entrypoint; callers do not import private files.
Shared code provides UI primitives and transport utilities without feature rules.

Reason: changes usually affect one feature, while the application deploys together.
Exception: the old settings screen still uses a shared store during migration.
Remove the exception when that screen moves to its feature-owned state.

Verification: run the repository's import-boundary check and affected interaction tests.
Revisit when separate deployment or repeated cross-feature state requires another boundary.
```

Use real module names and existing commands when adopting the example. Mark unmade decisions as proposed. Update the accepted document when a decision changes; retain the earlier rationale and link to its replacement where the project keeps history. Test any configured import restrictions alongside code changes.

## What bootstrap does

From the project directory:

```sh
ai-agent-playbook bootstrap --dry-run
ai-agent-playbook bootstrap
```

Bootstrap creates CURRENT.md and two record metadata files when no playbook exists. It does not generate source folders, choose FSD, install a stack profile, or create/replace root AGENTS.md. AAPB skill profiles select guidance independently of project architecture.

After inspecting the project, adapt [the project instruction template](../templates/agents/AGENTS.md) if root instructions are needed. Put an architecture decision in the project's established location only when useful. If you create `.ai-agent-playbook/decisions/architecture.md`, CURRENT.md can link to `decisions/architecture.md`; if you use `docs/architecture.md` at project root, that link is `../docs/architecture.md`. Create the document before adding its link.

Existing projects can keep their current records and architecture. See [Existing repositories](existing-repository-bootstrap.md) and [Record layout](structured-playbook-layout.md).
