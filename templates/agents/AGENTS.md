# Project instructions

## Scope and evidence

- Follow the current task and applicable project instructions. Preserve unrelated changes and existing approval requirements.
- Use code, configuration, and command output to establish current behavior. Use accepted specifications and decisions to establish intended behavior; report consequential disagreements.
- Confirm the relevant package manager, runtime, build scripts, and file ownership from this repository before choosing tools.

## Architecture and changes

- Follow the project's accepted module boundaries and public contracts. A framework name does not select an architecture.
- When no architecture is documented, inspect the current structure and dependencies. For new work, choose a proportionate structure within the authorized scope and record decisions that later work must preserve.
- Before changing a boundary, identify affected callers, data ownership, compatibility, and verification. Keep temporary exceptions and their removal conditions explicit.
- Keep architectural detail in the project's existing specification or decision document. Link it here only when that document exists; do not duplicate the whole design in root instructions.
- Use the existing record entrypoint, such as CURRENT.md, to find the active objective, evidence, and next action. Read relevant links rather than every historical record.

## Verification and delivery

- Run the project's required checks and verification appropriate to the changed behavior. Distinguish static checks, fixtures, and actual application or device execution.
- Preserve exact commands, results, and remaining limitations where the project keeps evidence. Update stale current-state notes without rewriting history as current fact.
- Follow the project's Git and publication conventions within the user's authorization. Inspect staged changes and keep local-only or sensitive material out of public artifacts.
