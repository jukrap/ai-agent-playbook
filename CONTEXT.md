# Context

This repository is a reusable playbook for coding agents.

## Terms

- `skill`: An installable folder containing `SKILL.md` and optional resources.
- `template`: A file copied into a project, usually `AGENTS.md` or local AI docs.
- `adapter`: Agent-specific installation or synchronization guidance.
- `legacy`: Existing production systems where runtime truth, compatibility, and hidden coupling matter more than architectural purity.
- `SI project`: Contract or enterprise delivery work where older stacks, client constraints, manual operations, and team-specific style preferences are normal.
- `local-only docs`: Project notes intended for agent/developer coordination but not committed to product repositories.

## Design intent

Skills should be small, composable, and easy to install. Templates can be longer because humans copy and adapt them per project. Legacy guidance should prevent risky rewrites and force contract/runtime verification.
