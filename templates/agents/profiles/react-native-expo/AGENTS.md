# AGENTS.md
# React Native / Expo Pragmatic Profile

Use this profile for Expo Router, React Native, and TypeScript projects. If the repository uses bare React Native, another router, or another package manager, trust the repository config first.

## Start rules

- Inspect `package.json`, app config, Expo SDK version, lockfile, README, and native folder state first.
- Do not apply web-only React rules directly to native screens.
- Check device permissions, platform differences, build profiles, and native module blast radius.
- Never revert user-made changes.

## Structure

- In Expo Router projects, keep `app/` routes focused on composition.
- If structures such as `src/widgets`, `src/features`, `src/entities`, or `src/shared` already exist, follow their boundaries.
- Do not treat native modules, bridges, permissions, storage, deep links, or notifications as lightweight shared utilities.
- If WebView or DOM components are involved, separate native and web responsibilities.

## UI and styling

- Use React Native style objects and component-local styles naturally.
- Prefer the project's existing theme or constants for repeated tokens, spacing, color, and typography.
- Do not import web CSS assumptions into native UI.
- Check safe area, keyboard behavior, font scale, hit targets, orientation, and scroll containers on iOS/Android.

## Data and API

- Confirm API contracts from actual backend docs, DTOs, and responses.
- Consider network failure, permission failure, offline behavior, and retry UX.
- Follow the existing server-state tool if the project has one.
- Confirm actual persistence tools before changing AsyncStorage, SQLite, SecureStore, or similar storage.

## Verification

- Prefer project-defined lint, test, typecheck, and build commands.
- For visible changes, run on the actual target platform when possible.
- Document dev client, EAS, build profile, permission, or native dependency implications.

## Git and worklogs

- Record blast radius in worklog or PR body for native config, permissions, build profile, or storage schema changes.
- Keep local-only docs and generated outputs out of staged changes.
