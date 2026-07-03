# Reference Depth Adoption

Use this recipe when a local reference collection should be audited before strengthening skills, references, workflows, MCP surfaces, or validators.

## Inputs

- Local reference directory chosen by the project.
- Target capability or broad audit scope.
- Current skill catalog and project playbook layout.
- Local-only audit workspace that is ignored or otherwise excluded from commits.

## Outputs

- Local-only project audit notes and adoption ledger.
- Distilled public changes only across skill references and workflow recipes and docs and validators and MCP read surfaces.
- Verification summary proving local-only audit material was not committed.

## Skills

- `skill-pack-governance`
- `agent-skill-authoring`
- `knowledge-source-registry`
- Capability skills touched by the adoption such as backend change safety and security review and design reference analysis and boundary review and deployment release check.

## Tools

- ai-playbook reference inventory <reference-dir> --json
- ai-playbook reference adoption-queue <reference-dir> --json
- ai-playbook reference capability-matrix <reference-dir> --json
- ai-playbook reference adoption-plan <reference-dir> --capability <capability> --json
- ai-playbook reference ledger-check <target> --path <ledger> --json when a ledger exists

## Procedure

1. Confirm the reference source and audit workspace are ignored or otherwise local-only.
2. Generate or update local audit notes for every reference project.
3. Record status as `reviewed`, `adopted`, `deferred`, or `rejected` in the local ledger.
4. Distill reusable practices into local capability language.
5. Add only the distilled result to committed files.
6. Keep `SKILL.md` trigger-focused and put detailed procedure in `references/`.
7. Update Korean translations with the English source change.
8. Verify no raw reference excerpts, local paths, secrets, or local audit files are staged.

## Stop Conditions

- The reference license or attribution requirements are unclear.
- The useful pattern cannot be separated from source-specific implementation details.
- The adoption would copy long upstream prose into default prompt context.
- The audit finds personal paths or internal URLs or credentials or token-like values that cannot be safely summarized.

## Verification

- git status --short shows no local reference source or audit workspace files staged.
- Public docs and skills contain distilled capability guidance instead of source project names or raw excerpts.
- npm run check
- npm test
- .\scripts\validate-skills.ps1
- .\scripts\validate-translations.ps1
- .\scripts\validate-public-docs.ps1
- git diff --check
