# Native UI and data boundaries

Use this reference when an actual React Native or Expo application needs native-specific guidance. Do not infer Expo Router, a package manager, or web-style architecture from a dependency name.

- Confirm app configuration, router, native folders, installed SDK, and build profile. Keep route modules aligned with the actual router contract.
- Use the existing React Native styling and theme conventions. Web CSS assumptions do not automatically apply to native UI; separate WebView/DOM and native responsibilities.
- Keep permissions, native modules, deep links, notifications, and bridge contracts owned by explicit modules. Do not hide their lifecycle and platform effects in generic utilities.
- Identify API response contracts and the existing server-state tool. Account for network failure, permission denial, offline behavior, and retry.
- Confirm persistence ownership and migration before changing AsyncStorage, SQLite, SecureStore, or another storage implementation.
- Check applicable safe areas, keyboard interaction, font scale, hit targets, orientation, and scrolling on the affected platform. Use [device-state checks](../device-permission-qa/lifecycle-and-device-state-checks.md) to select relevant scenarios.
- Record which platform and build profile were actually exercised. Use [build-channel guidance](mobile-build-channel-checks.md) for dev client, EAS, native binary, or update-channel implications.

These are selected contract checks, not a mandatory new folder structure or a requirement to run every device scenario for every edit.
