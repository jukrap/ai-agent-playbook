# Permission Device Matrix

Feature가 mobile permission, sensor, file, notification, biometric, camera, media, location, microphone, contact, background capability에 의존할 때 사용합니다.

## Permission Contract

- Declaration location: Android manifest, Info.plist, Expo config, native module manifest, privacy manifest, generated native project.
- Runtime request point, user-facing reason, fallback UI, denial path, repeated denial behavior, settings deep link, feature degradation.
- Permission scope, accessed data, retention, upload path, background use, telemetry 또는 analytics side effect.
- Platform difference, minimum OS version, restricted mode, store policy note.

## Device Evidence

- Platform, OS version, device model 또는 emulator profile, app version/build, install source, locale, orientation, network state를 기록합니다.
- Real-device evidence와 simulator/emulator evidence를 구분합니다.
- Sensitive capability에는 grant, deny, revoke-in-settings, reinstall, app update, first-run behavior를 캡처합니다.
- Private device/account data가 포함된 screenshot, log, manual note는 local project evidence에 둡니다.

## Stop Conditions

- 새 sensitive permission이 runtime request path, fallback behavior, product reason 없이 선언되었습니다.
- Permission prompt copy, manifest usage string, privacy metadata가 feature와 맞지 않습니다.
- 검증이 clean build뿐이고 permission grant/deny evidence가 없습니다.
- Feature가 적합한 device 또는 emulator에서 확인되지 않은 hardware capability에 의존합니다.
