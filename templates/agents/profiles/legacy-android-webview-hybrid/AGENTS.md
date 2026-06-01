# AGENTS.md
# Legacy Android WebView Hybrid Profile

Use this profile for legacy hybrid apps that mix an Android native shell, WebView, local web assets, and JavaScript bridges.

## Start rules

- Inspect the native Activity/Fragment, WebView settings, asset loading path, and bridge interface first.
- Distinguish remote web loading, local asset loading, or mixed loading.
- Check Android SDK, minSdk, targetSdk, Gradle, signing, flavors, and deployment flow.
- Treat WebView JavaScript changes as native bridge and permission changes when they cross that boundary.

## Change strategy

- Do not guess bridge method names, payload shape, or callback protocol.
- Check Android permissions, file chooser, downloads, camera, scanner, printer, back button, and lifecycle effects.
- For local asset changes, check cache, versioning, and packaging location.
- Prefer small, verifiable changes inside the current architecture over native rewrites.

## UI and styling

- Follow the existing web styling method inside WebView screens.
- When native UI and web UI appear together, check status bar, safe area, keyboard, density, and viewport metadata.
- Respect inline-style preference in SI or legacy projects when it is the local rule.

## Verification

- When possible, run the app on an emulator or device and verify app launch, bridge calls, back navigation, and file/download flows.
- Check Android logs and WebView console output together.
- Run Gradle build or the project's packaging command with fresh output.

## Git and worklogs

- Record native config, bridge contracts, deployment output paths, and permission changes in worklog and PR notes.
- Keep local-only docs and build outputs out of staged changes.
