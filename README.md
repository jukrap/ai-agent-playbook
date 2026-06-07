# AI Agent Playbook

## Languages

- English (Canonical): this file
- Korean (한국어): [README.ko.md](translations/ko/README.ko.md)

Reusable agent skills, project templates, project-memory guides, and a small runtime CLI for software maintenance and delivery. The repository is agent-agnostic: Codex, Claude Code, and other coding agents can use the same source material, while adapters handle agent-specific installation.

## Why this exists

Coding agents fail most often when they guess project conventions, skip verification, blur API contracts, lose context between sessions, or rewrite legacy systems too aggressively. This playbook keeps recurring practices small, explicit, and reusable.

The repository is more than a skill collection. It provides a harness for:

- installing reusable skills
- running `ai-playbook` bootstrap and doctor commands
- copying a thin root agent bootstrap into projects
- creating `ai-playbook/` project memory
- scaffolding active plans, detailed worklogs, and monthly summaries
- keeping maps, runbooks, decisions, plans, and worklogs useful over time

## Repository layout

```text
bin/                  ai-playbook CLI entrypoint
src/                  CLI runtime implementation
skills/
  project/             Bootstrap, onboarding, and project-memory skills
  quality/             API boundary and UI quality skills
  git/                 Commit, PR, push, and worklog skills
  meta/                Skill-authoring skills
  legacy/              Legacy-system maintenance skills
templates/
  agents/              Root agent instruction templates and project profiles
  codex-home/          Optional personal Codex home AGENTS.md template
  project-playbook/    Copyable ai-playbook project-memory template
examples/              Worklog, prompt, and handoff examples
translations/          Human translations; never install these as skills
adapters/              Agent-specific install notes
docs/                  Classification, installation, and publishing notes
scripts/               Validation and local sync helpers
test/                  Node CLI tests
.github/               GitHub Actions validation workflow
```

## Documentation map

- [Repository working rules](AGENTS.md): maintenance rules for agents editing this repository.
- [Repository context](CONTEXT.md): core terms and design intent for the playbook.
- [Installation](docs/installation.md): first install, existing-clone update, custom skill paths, and Codex restart notes.
- [Runtime harness](docs/harness-runtime.md): `ai-playbook` CLI commands, overwrite policy, and target-project flow.
- [Codex adapter](adapters/codex/README.md): Codex-specific local sync behavior and Codex App on Windows workflow.
- [Templates](templates/README.md): what to copy into project repositories and what to leave as installable skills.
- [Classification](docs/classification.md): why skills, templates, examples, docs, and adapters are separated.
- [Superpowers integration](docs/superpowers-integration.md): how to use this playbook alongside external process skills.
- [Maintenance workflow](docs/maintenance.md): what to update together when adding or changing content.
- [Translation policy](docs/translation-policy.md): English source and Korean translation rules.
- [Publishing checklist](docs/publishing-checklist.md): pre-publish hygiene checks.

## Recommended use

### 1. Install reusable skills

Need setup instructions? Start with [Installation](docs/installation.md).

Default install summary:

```powershell
.\install.ps1
```

The installer validates the repository, then copies every `skills/<category>/<skill>/SKILL.md` folder to common local agent skill directories.

To update an existing clone later:

```powershell
.\update.ps1
```

### 2. Bootstrap a project harness

Use the runtime CLI when you want to apply the project harness to a target repository:

```powershell
node .\bin\ai-playbook.mjs bootstrap <target-project>
node .\bin\ai-playbook.mjs doctor <target-project>
```

Use `--dry-run` before writing files, `--local-only` when `ai-playbook/` should be ignored by Git, and `--profile <name>` after the project stack is known.

If a target project already has `ai-playbook/` and you only need newly added guide templates, sync guides without touching project memory:

```powershell
node .\bin\ai-playbook.mjs guides sync <target-project> --dry-run
node .\bin\ai-playbook.mjs guides sync <target-project>
```

### 3. Copy root project policy manually

Start with the small root-level template under `templates/agents/global`:

- `AGENTS.md`: thin root bootstrap that points agents to `ai-playbook/`.

Then merge one profile only when the project proves the stack:

- `templates/agents/profiles/react-vite-fsd/AGENTS.md`
- `templates/agents/profiles/react-native-expo/AGENTS.md`
- `templates/agents/profiles/legacy-*`

For Codex's personal home-level defaults, use `templates/codex-home/AGENTS.md`. That file is separate from project-root templates and should not contain repository-specific rules.

### 4. Add project memory manually

Copy `templates/project-playbook/` into the target project as `ai-playbook/`.

Use `ai-playbook/` for current project truth, skill policy, Git policy, maps, runbooks, decisions, active plans, detailed worklogs, summaries, and archived notes. Decide per project whether this folder is committed or local-only.

Use the CLI to create working docs without inventing paths:

```powershell
node .\bin\ai-playbook.mjs plan new <target-project> --title "Feature slice"
node .\bin\ai-playbook.mjs worklog new <target-project> --title "Feature slice"
node .\bin\ai-playbook.mjs worklog summarize <target-project> --month 2026-06
```

### 5. Use alongside process skills

External process skills can guide planning, debugging, TDD, verification, and branch finishing. Use this playbook for repository-specific guardrails, project memory, API boundaries, style policy, legacy risk control, Git policy, and worklogs. See [Superpowers integration](docs/superpowers-integration.md).

### 6. Keep source and installed skills separate

- Source of truth: this repository.
- Installed copies: local agent skill directories.
- Agent-specific notes: `adapters/`.

Do not edit installed copies as the source. Edit this repository, validate, then sync.

## Skill categories

### Project

- `project-bootstrap`: set up a thin root agent bootstrap and `ai-playbook/` project memory.
- `repo-onboarding`: inspect a repository before making project-specific assumptions.
- `project-doc-system`: organize agent docs, project memory, plans, maps, runbooks, and worklogs.

### Quality

- `api-contract-boundary`: keep frontend/backend uncertainty at the API boundary.
- `ui-style-policy`: choose and document the repository UI styling policy.
- `style-quality-review`: improve UI style quality without changing product intent.

### Git

- `commit-worklog-guardrails`: stage, commit, push, PR, and worklog safely.

### Meta

- `agent-skill-authoring`: create, review, and organize reusable agent skills.

### Legacy

- General: `legacy-general`, `legacy-feature-addition`, `legacy-risk-check`.
- Web: `legacy-jquery-web`, `legacy-server-rendered-web`, `legacy-php-lamp`, `legacy-java-spring-mvc`, `legacy-dotnet-webforms`.
- Platform constraints: `legacy-android-webview-hybrid`, `legacy-ie-activex-compat`.
- Operational integrations: `legacy-database-heavy-system`, `legacy-reporting-printing`, `legacy-batch-file-transfer`.

## Publishing checklist

- Follow [Maintenance workflow](docs/maintenance.md) for any additions made before publishing.
- Check for personal paths, names, credentials, internal URLs, and dated branch/PR references.
- Validate every `SKILL.md`.
- Validate translation safety and coverage.
- Confirm templates do not claim a stack, package manager, or workflow unless the profile explicitly says so.
- Confirm [MIT license](LICENSE) is included.
- After publishing, update install examples with the final repository URL.

## Translation policy

English files are canonical and are the only files meant for agent installation. Korean translations live under `translations/ko` for human reading and review. Do not copy translated skill docs into local skill directories.

```powershell
npm run check
npm test
.\scripts\validate-skills.ps1
.\scripts\validate-translations.ps1
```

## License

Licensed under [MIT](LICENSE).
