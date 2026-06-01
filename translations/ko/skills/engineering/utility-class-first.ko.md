# Utility Class First

Repository가 utility-first CSS, Tailwind-style class, atomic class composition을 UI styling의 기본 방식으로 명시적으로 선호할 때 사용합니다.

## Workflow

1. project docs, existing code, 사용자 요청에서 utility-class-first convention을 확인합니다.
2. 기존 utility class pattern, configured token, responsive prefix, variant, component wrapper를 확인합니다.
3. layout, spacing, color, typography, state styling은 기존 utility로 조합합니다.
4. 반복되는 utility 조합이 실제 duplication이나 review cost를 만들 때만 shared component로 추출합니다.
5. 이미 utility가 다루는 값에는 one-off CSS file이나 inline style object를 만들지 않습니다.
6. visible UI가 바뀌면 responsive/state behavior를 검증합니다.

## Coordination

시각 품질 확인에는 `style-quality-review`를 사용하고, repository가 utility class를 감싼 shared component를 갖고 있으면 `design-system-first`를 함께 사용합니다.
