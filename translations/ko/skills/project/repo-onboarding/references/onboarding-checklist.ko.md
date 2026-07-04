# Repo Onboarding Checklist

## Commands

```bash
pwd
git status --short --branch
git remote -v
rg --files -g 'AGENTS.md' -g 'README*' -g 'package.json' -g '*.sln' -g 'pom.xml' -g 'build.gradle*'
```

command를 사용할 수 없으면 platform-appropriate equivalent를 사용합니다.

## Facts to collect

- Current branch, upstream, remotes, dirty files.
- Package manager and lockfile.
- Runtime versions and project scripts.
- README, root agent rules, `.ai-agent-playbook/` reading order, current working vocabulary.
- 구조 또는 중복 코드 주장에 대한 map freshness, scan range, confidence limit.
- Existing architecture and import boundaries.
- Project가 실제로 정의한 test/lint/build commands.
- stage하면 안 되는 local-only docs 또는 generated files.

## Do not assume

- React, FSD, pnpm, tests, lint, branch workflow, backend contract, deployment flow.
- old docs가 current하다는 것.
- repo에서 발견한 file이 runtime에서 active하다는 것.

## Output pattern

짧은 state summary를 제공합니다.

- `Stack`: confirmed technologies.
- `Commands`: confirmed verification commands.
- `Docs`: source-of-truth files, `.ai-agent-playbook/` state, working vocabulary, map freshness, latest worklog summary.
- `Git`: branch/remotes/dirty concerns.
- `Open questions`: locally discoverable하지 않은 것만.
