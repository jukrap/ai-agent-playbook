# Release Signing And Store Checks

Use this when a mobile app build is moving toward internal, beta, staged, or production distribution.

## Signing And Identity

- Platform targets, application id or bundle id, app group, team/account, signing mode, certificate, provisioning profile, keystore, key alias, and expiry.
- Version name, version code, build number, marketing version, release tag, changelog, and compatibility range.
- Store or distribution target: internal build, ad hoc, enterprise, TestFlight, Play internal testing, staged rollout, direct APK/AAB/IPA delivery, or managed device deployment.
- Artifact naming, checksum or provenance evidence, symbol/debug file handling, and artifact retention location.

## Store And Privacy Evidence

- Store listing, screenshots, release notes, privacy labels, privacy manifest, data safety form, age rating, export compliance, tracking declaration, and required review notes.
- Permission declarations and privacy copy should match actual runtime behavior and product intent.
- New background modes, sensitive capabilities, deep links, URL schemes, push notification modes, and associated domains need explicit evidence.
- Keep store credentials, signing keys, private account ids, and reviewer contact details out of public docs and worklogs.

## Stop Conditions

- Signing material, provisioning profile, keystore, or target account is missing, expired, unclear, or mismatched.
- Release artifact was built with debug profile, development entitlement, local override, or test endpoint enabled.
- Version/build number conflicts with the target store, previous release, tag, or CI release metadata.
- Store/privacy metadata changed but no reviewer, product owner, or policy evidence is recorded.
