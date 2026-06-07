# Runbooks

Runbooks contain repeatable commands and operational procedures.

Useful runbooks:

- `setup.md`: local setup, environment variables, and first run.
- `verification.md`: lint, test, build, browser, mobile, or manual QA commands.
- `git.md`: branch, commit, PR, release, and rollback workflow.
- `deploy.md`: deployment, packaging, or handoff steps.
- `debugging.md`: known logs, traces, fixtures, and reproduction loops.

## Rules

- Prefer commands copied from project config or verified shell output.
- Keep secrets out of runbooks; describe where to obtain them instead.
- Include cleanup steps for servers, ports, temporary files, and generated artifacts.
