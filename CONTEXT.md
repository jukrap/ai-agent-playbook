# Context

This repository is a reusable harness and playbook for coding agents.

## Terms

- `skill`: An installable folder containing `SKILL.md` and optional resources.
- `template`: A file or folder copied into a project, usually root agent policies or `ai-playbook/`.
- `project playbook`: The copyable `templates/project-playbook/` source that becomes `ai-playbook/` in a target project.
- `project memory`: Current truth, maps, runbooks, decisions, plans, worklogs, and archived notes that help future agents resume work.
- `runtime harness`: The `ai-playbook` CLI surface that applies templates, checks project-memory health, and scaffolds plans/worklogs.
- `adapter`: Agent-specific installation or synchronization guidance.
- `legacy`: Existing production systems where runtime truth, compatibility, and hidden coupling matter more than architectural purity.
- `local-only docs`: Project notes intended for agent/developer coordination but not committed to product repositories.

## Design intent

Skills should be small, composable, and easy to install. Templates can be longer because humans copy and adapt them per project. The runtime harness should make the common path executable without hiding decisions: bootstrap the target project, check drift, and create predictable plan/worklog files.

The project playbook keeps current truth separate from historical worklogs so future agents can recover context without trusting stale plans.

Legacy guidance should prevent risky rewrites and force contract/runtime verification.
