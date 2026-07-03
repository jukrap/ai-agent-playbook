# Style Dials And Anti-Patterns

## Style Dials

Taste decision을 명시하기 위해 세 가지 dial을 사용합니다.

- **Visual variance:** layout이 conventional pattern에서 얼마나 벗어날 수 있는지.
- **Motion intensity:** state, continuity, delight를 설명하기 위해 얼마나 많은 motion이 필요한지.
- **Visual density:** 한 viewport에 얼마나 많은 정보를 담아야 하는지.

권장 기본값:

| Surface | Visual variance | Motion intensity | Visual density |
| --- | --- | --- | --- |
| Admin, CRM, ERP, SI back office | Low to medium | Low | Medium to high |
| SaaS dashboard | Medium | Low to medium | Medium |
| Portfolio or brand page | Medium to high | Medium | Low to medium |
| Data exploration | Low to medium | Low | High |
| Game or immersive media | High | Medium to high | Context-dependent |
| Form-heavy workflow | Low | Low | Medium |

## Dial Rules

- Visual variance는 memorability, brand distinction, spatial storytelling에 이득이 있을 때만 높입니다.
- Motion은 continuity, cause/effect, progress, interaction feedback을 전달할 때만 높입니다.
- Density는 사용자가 많은 item을 비교하거나 반복 workflow를 수행하거나 navigation 없이 context가 필요할 때만 높입니다.
- Dial이 높으면 해당 dial의 verification evidence를 정의합니다. High motion은 reduced-motion behavior가 필요합니다. High density는 overflow와 responsive check가 필요합니다. High variance는 더 강한 layout/content fit check가 필요합니다.

## Anti-Patterns

- 주요 surface가 한 hue의 변주로만 구성된 one-note palette.
- 실제 product나 subject를 숨기는 decorative gradient, blob, abstract hero art.
- 반복적으로 scan하고 조작해야 하는 tool에 marketing-style hero composition을 적용하는 것.
- Page structure로 쓰인 card-inside-card layout과 floating section card.
- Content hierarchy가 아니라 viewport scaling 때문에만 커 보이는 typography.
- Concept에서는 motion을 주장하지만 build에는 없거나, reduced-motion preference를 무시하는 motion.
- 다른 product의 exact composition, mark, copy, distinctive asset treatment를 복제하는 reference mimicry.
- User flow, field name, data meaning, accessibility behavior를 조용히 바꾸는 style-only redesign.

## Review Checklist

- Direction이 product type과 audience에 맞습니다.
- Style dial이 implementation을 이끌 만큼 명확합니다.
- Visual novelty에는 달라 보이는 것 이상의 이유가 있습니다.
- Dense surface도 scanning, comparison, repeated action을 지원합니다.
- Motion에는 기능적 목적과 accessible fallback이 있습니다.
- Palette에는 neutral, semantic, interactive, status, focus color가 있습니다.
- Design은 repository의 existing primitive나 정당화된 extension으로 구현할 수 있습니다.
