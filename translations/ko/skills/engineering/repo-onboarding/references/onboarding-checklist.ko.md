# Repo Onboarding Checklist

## Commands

```bash
pwd
git status --short --branch
git remote -v
rg --files -g 'AGENTS.md' -g 'README*' -g 'package.json' -g '*.sln' -g 'pom.xml' -g 'build.gradle*'
```

명령이 없으면 platform에 맞는 equivalent를 사용합니다.

## 수집할 사실

- 현재 branch, upstream, remotes, dirty files.
- package manager와 lockfile.
- runtime versions와 project scripts.
- README와 local docs reading order.
- 기존 architecture와 import boundaries.
- 프로젝트가 실제로 정의한 test/lint/build commands.
- stage하면 안 되는 local-only docs 또는 generated files.

## 추측 금지

- React, FSD, pnpm, tests, lint, branch workflow, backend contract, deployment flow.
- 오래된 docs가 최신이라는 가정.
- repository에 있는 file이 runtime에서 active라는 가정.

## Output pattern

- `Stack`: 확인된 technologies.
- `Commands`: 확인된 verification commands.
- `Docs`: source-of-truth files.
- `Git`: branch/remotes/dirty concerns.
- `Open questions`: local에서 확인할 수 없는 것만.
