# AGENTS.md
# React/Vite Pragmatic FSD Profile

Use this profile for React, Vite, TypeScript, pnpm, and pragmatic FSD or a similar layered frontend. If the repository uses different tools, trust the repository config over this profile.

## Start rules

- Inspect `package.json`, lockfile, README, local docs, branch, and dirty worktree first.
- Do not assume React, Vite, pnpm, FSD, or test commands without local evidence.
- Inspect `src` structure and import boundaries before editing.
- Never revert user-made changes.

## Document priority

1. Latest user instruction.
2. Actual code, config, and package scripts.
3. `PROJECT_SPEC.md`, `PLANS.md`, `FSD.md`.
4. `docs/plans/**` and the latest worklog.
5. `design-docs/**` and `_reference/**`.
6. This profile.

## Architecture

- FSD is not mandatory. Apply it only when the project already uses it or the docs require it.
- The usual layer order is `app -> pages -> widgets -> features -> entities -> shared`.
- Keep pages focused on routing and composition.
- Use widgets for large business blocks on a screen.
- Use features for user actions, forms, mutations, selections, and filters.
- Use entities for domain types, API adapters, query options, and domain UI.
- Keep shared code independent of project domain concepts.
- Prefer slice public APIs through `index.ts`.

## UI and styling

- Follow the repository's explicit style policy when one exists: `design-system-first`, `css-class-first`, `utility-class-first`, or `inline-style-first`.
- If no policy is documented, keep the component's existing local pattern instead of introducing a new styling system.
- In strong design-system projects, prefer shared UI variants, tokens, and component props before custom styling.
- Search for existing shared wrappers before creating buttons, inputs, selects, modals, toasts, or pagination.
- Check text overflow, mobile width, loading, empty, error, and disabled states.
- In style-quality reviews, preserve visual intent and focus on CSS/inline structure, duplication, cascade risk, and responsive breakage.

## State, query, and API

- Use local state when local state is enough.
- Use the project's existing server-state tool for server data.
- Use global stores only for state shared across multiple screens/features that cannot be handled by URL or server state.
- Keep pages/widgets away from endpoint paths and transport details.
- Separate backend DTOs from frontend domain types. Normalize naming and wrapped responses in adapters.
- Do not treat Swagger, backend DTOs, command objects, mappers, or sample responses as interchangeable without checking.

## Verification

Use project scripts first. In common React/Vite projects, run the following only when they exist:

```bash
pnpm lint
pnpm test:run
pnpm build
```

For UI work, verify important desktop and mobile widths in a browser when possible. Check overflow and interaction states for visible changes.

## Git and worklogs

- Use explicit staging and check for local-only docs before committing.
- Use `type(scope): Korean summary` when that is the team's commit convention.
- Write worklogs for milestone completion, blockers, major direction changes, or long debugging.
