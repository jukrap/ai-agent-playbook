# AI Agent Playbook

## Languages

- English (Canonical): this file
- Korean (한국어): [README.ko.md](translations/ko/README.ko.md)

Reusable agent skills, project templates, and working guides for software maintenance and delivery. The repository is agent-agnostic: Codex, Claude Code, and other coding agents can use the same source material, while adapters handle agent-specific installation.

## Why this exists

Coding agents fail most often when they guess project conventions, skip verification, blur API contracts, or rewrite legacy systems too aggressively. This playbook keeps those recurring practices small, explicit, and reusable.

It follows the same broad shape as public skill-first repositories such as [mattpocock/skills](https://github.com/mattpocock/skills): small composable skills, grouped by usage area, plus repo-level docs for setup and context. The difference is that this playbook also includes copyable project templates for SI, legacy, and mixed-stack projects.

## Repository layout

```text
skills/
  engineering/   Cross-project engineering workflow skills
  legacy/        SI and legacy-system maintenance skills
templates/
  agents/        AGENTS.md templates and project profiles
  local-ai/      Optional local-only project docs
examples/        Worklog, prompt, and handoff examples
translations/    Human translations; never install these as skills
adapters/        Agent-specific install notes
docs/            Classification and publishing notes
scripts/         Validation and local sync helpers
.github/         GitHub Actions validation workflow
```

## Documentation map

- [Repository working rules](AGENTS.md): maintenance rules for agents editing this repository.
- [Repository context](CONTEXT.md): core terms and design intent for the playbook.
- [Installation](docs/installation.md): first install, existing-clone update, custom skill paths, and Codex restart notes.
- [Codex adapter](adapters/codex/README.md): Codex-specific local sync behavior.
- [Templates](templates/README.md): what to copy into project repositories and what to leave as installable skills.
- [Classification](docs/classification.md): why skills, templates, examples, docs, and adapters are separated.
- [Superpowers integration](docs/superpowers-integration.md): how to use this playbook alongside Superpowers-style process skills.
- [Maintenance workflow](docs/maintenance.md): what to update together when adding or changing content.
- [Translation policy](docs/translation-policy.md): English source and Korean translation rules.
- [Publishing checklist](docs/publishing-checklist.md): private GitHub setup and pre-publish hygiene checks.

## Recommended use

### 1. Install reusable skills

**Need setup instructions? Start with [Installation](docs/installation.md).** It covers first install, existing-clone updates, custom skill paths, and Codex restart notes.

Default install summary:

```powershell
.\install.ps1
```

The installer validates the repository, then copies every `skills/<category>/<skill>/SKILL.md` folder to common local agent skill directories.

To update an existing clone later:

```powershell
.\update.ps1
```

### 2. Use alongside process skills

This playbook can be used with Superpowers-style process skills. Let process skills guide planning, debugging, TDD, verification, and branch finishing; use this playbook for repository-specific guardrails and reusable project rules. See [Superpowers integration](docs/superpowers-integration.md).

### 3. Copy project templates

See [Templates](templates/README.md) for the difference between installable skills and copyable project templates.

Start with one `templates/agents` profile:

- `templates/agents/global/AGENTS.md`: default for any repository.
- `templates/agents/profiles/react-vite-fsd/AGENTS.md`: React/Vite/TypeScript with pragmatic FSD.
- `templates/agents/profiles/react-native-expo/AGENTS.md`: Expo and React Native.
- `templates/agents/profiles/legacy-*`: SI and legacy profiles.

Then add only the `templates/local-ai` docs that the project needs.

### 4. Keep source and installed skills separate

- Source of truth: this repository.
- Installed copies: local agent skill directories.
- Agent-specific notes: `adapters/`.

Do not edit installed copies as the source. Edit this repository, validate, then sync.

### 5. Extend through the maintenance workflow

When adding or changing skills, templates, examples, translations, or adapter notes, follow [Maintenance workflow](docs/maintenance.md). It records which indexes, translations, validation scripts, and installed skill copies must be updated together.

## Skill categories

### Engineering

- `repo-onboarding`: inspect a repository before making project-specific assumptions.
- `project-doc-system`: organize AGENTS, project specs, plans, local docs, and worklogs.
- `commit-worklog-guardrails`: stage, commit, push, PR, and worklog safely.
- `api-contract-boundary`: keep frontend/backend uncertainty at the API boundary.
- `style-quality-review`: improve UI style quality without changing product intent.

### Legacy

- General: `legacy-general`, `legacy-feature-addition`, `legacy-risk-check`.
- Web: `legacy-jquery-web`, `legacy-server-rendered-web`, `legacy-php-lamp`, `legacy-java-spring-mvc`, `legacy-dotnet-webforms`.
- Platform constraints: `legacy-android-webview-hybrid`, `legacy-ie-activex-compat`.
- Operational integrations: `legacy-database-heavy-system`, `legacy-reporting-printing`, `legacy-batch-file-transfer`.

## Publishing checklist

- Follow [Maintenance workflow](docs/maintenance.md) for any additions made before publishing.
- Check for personal paths, company names, credentials, and dated branch/PR references.
- Validate every `SKILL.md`.
- Validate translation safety and coverage.
- Confirm `.github/workflows/validate.yml` passes after the repository is pushed.
- Confirm templates do not claim a stack, package manager, or workflow unless the profile explicitly says so.
- Keep the GitHub repository private until hygiene checks and validation pass.
- Confirm [MIT license](LICENSE) is included.
- After publishing, update [Codex adapter](adapters/codex/README.md) with the repository URL.

For a private GitHub repository under `jukrap`, see [Publishing checklist](docs/publishing-checklist.md) for first-push commands using repository-local Git config.

## Translation policy

English files are canonical and are the only files meant for agent installation. Korean translations live under `translations/ko` for human reading and review. Do not copy translated skill docs into local skill directories.

```powershell
.\scripts\validate-skills.ps1
.\scripts\validate-translations.ps1
```

## Maintainer and license

Maintained by [jukrap](https://github.com/jukrap). Licensed under [MIT](LICENSE).
