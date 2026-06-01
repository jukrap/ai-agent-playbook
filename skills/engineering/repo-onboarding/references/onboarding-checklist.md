# Repo Onboarding Checklist

## Commands

```bash
pwd
git status --short --branch
git remote -v
rg --files -g 'AGENTS.md' -g 'README*' -g 'package.json' -g '*.sln' -g 'pom.xml' -g 'build.gradle*'
```

Use platform-appropriate equivalents when a command is unavailable.

## Facts to collect

- Current branch, upstream, remotes, dirty files.
- Package manager and lockfile.
- Runtime versions and project scripts.
- README and local docs reading order.
- Existing architecture and import boundaries.
- Test/lint/build commands actually defined by the project.
- Local-only docs or generated files that must not be staged.

## Do not assume

- React, FSD, pnpm, tests, lint, branch workflow, backend contract, or deployment flow.
- That old docs are current.
- That a file found in the repo is active at runtime.

## Output pattern

Give a short state summary:

- `Stack`: confirmed technologies.
- `Commands`: confirmed verification commands.
- `Docs`: source-of-truth files.
- `Git`: branch/remotes/dirty concerns.
- `Open questions`: only what cannot be discovered locally.
