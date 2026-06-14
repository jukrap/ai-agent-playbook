# Maintenance Workflow

Use this checklist whenever adding, renaming, removing, or substantially rewriting content in this repository.

## Source order

- Edit English source files first.
- Update Korean translations under `translations/ko` after the English source is stable.
- Do not create `SKILL.md` files under translations.
- Do not edit installed local skill copies as the source of truth.

## Adding a skill

1. Choose the smallest fitting category under `skills/`.
2. Create `skills/<category>/<skill-name>/SKILL.md`.
3. Keep `SKILL.md` focused on trigger, workflow, and when to read references.
4. Move long rules, checklists, examples, and provider-specific details into `references/*.md`.
5. Add or update `agents/openai.yaml` only if the skill UI metadata needs to be exposed.
6. Add the Korean translation at `translations/ko/skills/<category>/<skill-name>.ko.md`.
7. Translate any reference files under the matching `translations/ko/skills/**/references/` path.
8. Update `README.md` and `docs/classification.md` if the skill changes the public category map.
9. Run validation and sync installed copies.

## Adding a project template

1. Put copyable thin root agent bootstrap files under `templates/agents`.
2. Put personal Codex home defaults under `templates/codex-home`.
3. Put project-memory templates under `templates/project-playbook`.
4. Keep project-specific product facts out of reusable templates.
5. Make technology-specific guidance profile-scoped, not global or Codex-home default.
6. Add the matching Korean translation under `translations/ko/templates/**`.
7. Update template indexes when the new template changes recommended bundles.

## Updating the runtime CLI

1. Keep runtime code under `bin/`, `src/`, and `test/`.
2. Keep the CLI dependency-free unless the feature needs a dependency.
3. Add tests for every new command, overwrite rule, or path convention.
4. Update `docs/harness-runtime.md`, `README.md`, installation docs, and Korean translations.
5. Run `npm run check` and `npm test`.

## Updating commit, PR, or worklog policy

- Update both `templates/project-playbook/guides/commit-push-worklog.md` and `skills/git/commit-worklog-guardrails/references/git-worklog-checklist.md`.
- Keep project-copyable guidance in the template.
- Keep skill-triggered procedural guidance in the skill reference.
- Update Korean translations for both files in the same change.
- If the policy came from local agent settings, remove machine-specific paths and keep the portable rule.
- Commit messages use Conventional Commit type/scope. Use the user's or repository's working language for the subject and body; for Korean work, keep the type/scope in English and write the subject/body in Korean.
- Use a title-only commit only for very small changes. For multi-file, runtime, packaging, or documentation-structure changes, include a short body and a verification section with commands actually run.
- PR bodies should follow the reviewer's expected language when known, summarize real diff scope, list real verification, and avoid placeholders, agent signatures, branch names, or PR numbers inside public docs.

## Updating examples

- Keep examples generic and scrubbed.
- Remove personal names, company names, customer names, internal domains, credentials, branch names, PR numbers, and dated operational status.
- Prefer examples that show decision quality, verification, and handoff clarity.
- Do not let old examples become active rules unless the corresponding template or skill is updated.

## Required checks

```powershell
npm run check
npm test
.\scripts\validate-skills.ps1
.\scripts\validate-translations.ps1
.\scripts\sync-skills.ps1 -WhatIf
.\install.ps1 -SkipValidation -WhatIf
.\update.ps1 -SkipValidation -WhatIf
```

If validation scripts change, update `.github/workflows/validate.yml` in the same change.

When skill source files changed, sync installed copies after validation:

```powershell
.\scripts\sync-skills.ps1
```

## Review checklist

- Does the new content belong in `skills`, `templates`, `examples`, `docs`, or `adapters`?
- Did the English source stay free of project-private values?
- Does every English markdown source have a Korean translation?
- Are installable skills still only under `skills/**/SKILL.md`?
- Did README, classification, adapters, or recommended bundles need an update?
- Did any installed skill copy need to be synced?
