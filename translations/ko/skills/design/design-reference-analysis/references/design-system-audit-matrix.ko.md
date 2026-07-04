# 디자인 시스템 감사 매트릭스

Design reference를 일회성 스타일이 아니라 유지 가능한 token, component, variant, QA criteria로 바꿔야 할 때 사용합니다.

## 매트릭스

| 영역 | 질문 | 산출물 |
| --- | --- | --- |
| 목적 | Reference가 어떤 사용자 일, 제품 유형, 정보 밀도에 최적화되어 있는가? | 로컬 디자인 의도와 non-goal. |
| 토큰 | 색, 간격, radius, shadow, typography, motion의 어떤 역할이 재사용 가능한가? | 값 복사가 아닌 token role mapping. |
| 컴포넌트 | Button, input, menu, card, table, chart, media, dialog 중 무엇이 반복되는가? | Component/variant 후보. |
| 상태 | hover, focus, selected, loading, empty, error, disabled, overflow는 어떻게 보이는가? | State checklist와 visual QA case. |
| 레이아웃 | Grid, grouping, navigation, breakpoint, scroll rhythm 중 무엇이 유용한가? | 로컬 layout 원칙과 responsive check. |
| 콘텐츠 | Label, description, proof, metadata, action의 밀도는 어떤가? | Copy density와 hierarchy guidance. |
| 접근성 | Contrast, focus, semantics, motion, touch target, reading order 위험은 어디인가? | 필요한 accessibility check. |

## 채택 규칙

- Custom CSS를 쓰기 전에 reference behavior를 local design-system primitive로 매핑합니다.
- Brand, illustration, exact composition, copy, source-specific asset은 reusable docs에 넣지 않습니다.
- Raw color 값보다 `surface`, `muted`, `danger`, `focus`, `chart-accent` 같은 역할 이름을 선호합니다.
- 운영형 또는 데이터 중심 제품이면 editorial drama보다 scanability, alignment, density, error state를 우선합니다.
- 브랜드/포트폴리오 제품이면 first-viewport signal, image treatment, content rhythm을 명확히 정의합니다.

## 증거 패키지

- Reference locator 또는 screenshot source boundary.
- Reference principle을 local token/component/state로 연결한 mapping table.
- Source-specific part에 대한 do-not-copy note.
- 구현 시 desktop/mobile viewport 각각 하나 이상의 browser 또는 screenshot check.
