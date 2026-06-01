# Pragmatic FSD

FSD 또는 유사 계층 구조를 적용할 때 사용합니다. 목표는 폴더 이름 맞추기가 아니라 책임 boundary를 분명히 하는 것입니다.

## 적용할 때

- 프로젝트가 이미 FSD를 사용합니다.
- `FSD.md`, `docs/plans/CONVENTIONS.md`, 기존 code가 FSD boundary를 요구합니다.
- screen 또는 feature가 충분히 커져서 pages, widgets, features, entities 분리가 실제 복잡도를 줄입니다.

적용하지 않을 때:

- 작은 단일 화면에 folder만 늘어나는 경우
- 기존 프로젝트가 다른 구조를 명확히 쓰는 경우
- FSD 적용이 위험한 legacy rewrite를 강제하는 경우

## Common boundaries

- `app`: providers, router, app bootstrap.
- `pages`: route-level composition.
- `widgets`: 화면의 큰 business blocks.
- `features`: user actions, forms, mutations, selections, filters.
- `entities`: domain types, API, query options, domain UI.
- `shared`: domain-independent UI, libraries, config.

## Public APIs

- slice-level public API는 `index.ts`로 export합니다.
- internal files로 deep import를 피합니다.
- circular import와 higher layer import를 피합니다.

## Practical rules

- entities는 backend DTO를 흘리지 않고 domain type을 제공합니다.
- features는 user behavior를 표현합니다.
- widgets는 features와 entities를 조립합니다.
- pages는 routing과 screen composition을 담당합니다.
- shared code는 business-domain words를 몰라야 합니다.

## Review questions

- 이 파일은 다른 화면에서 재사용되어도 같은 책임을 유지하는가?
- 이 logic은 user action, domain model, screen composition 중 무엇인가?
- 이 분리가 실제 complexity를 줄이는가?
- 더 적은 abstraction으로 같은 boundary를 지킬 수 있는가?
