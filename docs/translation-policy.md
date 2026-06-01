# Translation Policy

English is the canonical source language for this repository.

## Why

- Skill descriptions and bodies are part of agent discovery and runtime context.
- Keeping installed skills in one language reduces duplicate retrieval and token use.
- Korean translations are useful for human review, onboarding, and editing intent.

## Rules

- Keep `skills/`, `templates/`, `docs/`, `examples/`, and `adapters/` in English.
- Put Korean translations under `translations/ko`.
- Do not create `SKILL.md` files under `translations/ko`.
- Do not sync translations into local skill directories.
- If English and Korean differ, the English file is the source of truth.
- When updating an English source file, update the Korean translation in the same change when practical.
- The root `README.md` may include native language names in the language selector.

## Naming

- Use `.ko.md` for translated markdown files.
- Preserve the source path under `translations/ko` where possible.
- For skill translations, use `<skill-name>.ko.md`, not `SKILL.ko.md`, to avoid confusion with installable skills.
