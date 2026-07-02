# Mobile Build Channel Checks

Release confidence가 build profile, channel, flavor, environment, staged distribution behavior에 의존할 때 사용합니다.

## Build Channel Review

- Native scheme/flavor, Expo/EAS profile, React Native variant, environment file, API base, feature flag, asset bundle, update channel, OTA behavior.
- Release, beta, staging, debug, local channel은 명확한 이름, 분리된 credential, 예측 가능한 runtime config를 가져야 합니다.
- App update, rollback, remote config, feature flag behavior가 선택한 release channel과 맞는지 확인합니다.
- Over-the-air update를 지원하면 native binary compatibility boundary와 rollback procedure를 기록합니다.

## Release-Build Cleanup

- Debug menu, local network bridge, test server, mock provider, dev certificate, debug overlay, verbose log, internal diagnostic, agent-control hook.
- WebView 또는 hybrid app은 release mode에서 JavaScript bridge exposure, allowed origin, navigation policy, deep link, file upload/download behavior를 확인합니다.
- Crash reporting, analytics, logging, monitoring은 sensitive value를 흘리지 않으면서 release channel에 맞게 설정되어야 합니다.
- Supported platform matrix에서 install, launch, cold start, sign-in, core path, background/foreground, update path를 검증합니다.

## Stop Conditions

- Artifact, config, log, app-visible diagnostic으로 runtime channel을 증명할 수 없습니다.
- Release build가 debug bridge, dev menu, local endpoint, broad inspection surface를 여전히 노출합니다.
- OTA 또는 staged rollout이 rollback evidence 없이 production behavior를 바꿀 수 있습니다.
- Release가 적합한 device 또는 emulator에서 확인되지 않은 device capability에 의존합니다.
