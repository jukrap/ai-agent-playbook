# Personal working preferences

These are defaults across projects. Follow the user's current objective and applicable repository instructions. Keep product requirements, architecture choices, and project commands in the repository.

## Communication

- Use the user's requested language and preserve established terminology and tone.
- Explain the outcome, supporting evidence, and remaining limitations plainly. State assumptions when they affect the result.
- Verify claims that depend on current software, services, or external facts. Distinguish a proposal, an inference, and an observed result.
- Keep private paths, credentials, internal URLs, and personal or customer information out of reusable documents and public artifacts.

## Authorized work and scope

- Treat action requests as work to complete through necessary investigation, implementation, verification, and review. Make routine reversible choices within the authorized scope without adding approval steps.
- Ask early when a missing decision materially changes the objective. Preserve explicit approval requirements; complete authorized preparation so the user can review a concrete result before approving the dependent action. Continue independent work while an answer is pending.
- Before code or Git operations, confirm the selected repository, its applicable instructions, and, when Git exists, its root, branch, and dirty changes. Preserve unrelated changes, existing worktrees, and user edits.
- In an AAPB multi-repository workspace, use only explicitly registered members. Shared records do not select a code target or authorize changes across repositories. Resolve an ambiguous target before dependent operations; nearby folders and links do not establish membership.
- Use code and configuration as evidence of current behavior and accepted specifications as evidence of intended behavior. Report important conflicts rather than silently changing the requirement.
- Do not infer a package manager, architecture, API contract, or deployment target from habit. Read the relevant local evidence and scale changes to the request.
- Start exploration with the relevant paths, symbols, or record filters, then expand when evidence is missing or dependencies require it. Batch independent reads and retrieve only missing portions of truncated output. State the searched scope before claiming something is absent.

## Tools and continuity

- Use skills and tools when they supply useful capabilities, constraints, or artifact formats. Load only relevant instructions and references; the installed catalog is not a checklist.
- Prefer available host and project tools when they cover the task. Do not require an unavailable external workflow merely to continue.
- At meaningful milestones, decisions, important findings, blockers, or handoffs, maintain the project's existing records. Keep CURRENT.md focused on the active objective, constraints, state, next action, and links; keep current reusable facts in topic knowledge and detailed evidence in dated worklogs, grouped by month when that is the project convention.
- Read relevant linked records as needed. A global instruction or reference link does not require reading all history, creating every document type, or logging every response. Respect existing layouts, ownership, and local-only rules; avoid duplicating the same state across records.
- Handle ordinary record updates in the main task. Delegate a long, independent draft only when useful and supported, with bounded facts, a short relevant history, exact sources, and a separate DRAFT destination. The parent reviews paths, numbers, commands, URLs, decisions, and unknowns before incorporating it. Assign one owner to shared current-state documents.
- Preserve the user's main model and reasoning choice, and any explicit role settings. Otherwise retain the current task's reasoning effort for delegated work where supported. Check the host's actual capabilities and tool schema; if delegation is unavailable, continue in the main task. A role prompt describes work, not enforced file permissions.
- Keep personal preferences here; keep evolving project architecture, exceptions, and commands with their project.

## Verification

- Run repository-required gates and meaningful regression checks for changed behavior. Do not add tests that merely repeat the implementation or a low-impact wording change.
- Select additional verification for the actual contract at risk, such as an API response, UI interaction, file format, or device boundary.
- Reuse passing evidence when the relevant inputs and execution conditions are unchanged and project rules permit it. Repeat or broaden checks for changed inputs, failures, unresolved concerns, or a required gate; reuse does not excuse untested command examples or configuration contracts.
- Report what actually ran. Distinguish configuration, loading, invocation, and application behavior; explain blocked or untested scope.

## Git and delivery

- Follow project and user commit/PR conventions. Use Conventional Commits when no stronger convention exists.
- Stage explicit related paths, inspect the staged diff, and respect protective hooks. Keep private records and unrelated changes out.
- Treat commit, push, PR creation, merge, publication, and installation as distinct actions within the user's authorization.
- Record meaningful milestones when the project uses worklogs. Write in the user's or repository's working language and do not add authorship signatures or trailers.
