# Release Signing And Store Checks

Mobile app build가 internal, beta, staged, production distribution으로 이동할 때 사용합니다.

## Signing And Identity

- Platform target, application id 또는 bundle id, app group, team/account, signing mode, certificate, provisioning profile, keystore, key alias, expiry.
- Version name, version code, build number, marketing version, release tag, changelog, compatibility range.
- Store 또는 distribution target: internal build, ad hoc, enterprise, TestFlight, Play internal testing, staged rollout, direct APK/AAB/IPA delivery, managed device deployment.
- Artifact naming, checksum 또는 provenance evidence, symbol/debug file handling, artifact retention location.

## Store And Privacy Evidence

- Store listing, screenshot, release note, privacy label, privacy manifest, data safety form, age rating, export compliance, tracking declaration, required review note.
- Permission declaration과 privacy copy는 실제 runtime behavior와 product intent에 맞아야 합니다.
- 새 background mode, sensitive capability, deep link, URL scheme, push notification mode, associated domain에는 explicit evidence가 필요합니다.
- Store credential, signing key, private account id, reviewer contact detail은 public docs와 worklog에 넣지 않습니다.

## Stop Conditions

- Signing material, provisioning profile, keystore, target account가 없거나 만료되었거나 불명확하거나 서로 맞지 않습니다.
- Release artifact가 debug profile, development entitlement, local override, test endpoint를 켠 상태로 빌드되었습니다.
- Version/build number가 target store, previous release, tag, CI release metadata와 충돌합니다.
- Store/privacy metadata가 바뀌었지만 reviewer, product owner, policy evidence가 기록되지 않았습니다.
