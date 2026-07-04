# UI 스타일 품질

제품 의도를 바꾸지 않고 UI 스타일링, 반응형 동작, CSS 구조, inline style, layout overflow, visual regression을 리뷰하거나 개선할 때 사용합니다.

## 의도 보존

- 요청받지 않았다면 재설계하지 않습니다.
- 밀도, 위계, 작업 흐름의 사용성, 로컬 시각 언어를 유지합니다.
- 운영 도구에서는 장식적 구성보다 훑어보기와 반복 사용 편의성을 우선합니다.

## 스타일 정책

프로젝트 근거에서 스타일링 방식을 고릅니다.

- Design system first: 공유 컴포넌트, 토큰, variant, slot, UI primitive가 있음.
- CSS/class first: stylesheet, CSS module, scoped CSS, semantic class가 관례.
- Utility first: Tailwind-style utility 또는 atomic class가 관례.
- Inline style first: 컴포넌트 로컬 inline style object를 명시적으로 선호.

명시적 정책이 없으면 로컬 컴포넌트 패턴을 따르고 병렬 스타일링 체계를 새로 도입하지 않습니다.

## 점검

- mobile, tablet, desktop overflow
- 긴 label, table cell, button, modal, navigation item
- loading, empty, error, disabled, selected, focus state
- CSS cascade와 specificity risk
- 중복 값과 일관되지 않은 spacing
- 공유 primitive 우회
- 불필요한 card, card nesting, 장식적 구조

눈에 보이는 동작이 바뀌는 작업은 browser, simulator, screenshot, rendered artifact로 검증합니다.
