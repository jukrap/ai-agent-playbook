# Pragmatic FSD

Use this guide when applying FSD or a similar layered structure. The goal is clear responsibility boundaries, not matching folder names for their own sake.

## Apply when

- The project already uses FSD.
- `FSD.md`, `docs/plans/CONVENTIONS.md`, or existing code requires FSD boundaries.
- A screen or feature is large enough that separating pages, widgets, features, and entities reduces real complexity.

Do not apply when:

- a small single screen would only gain folders
- the existing project clearly uses another structure
- adopting FSD would force a risky legacy rewrite

## Common boundaries

- `app`: providers, router, app bootstrap.
- `pages`: route-level composition.
- `widgets`: large business blocks on a screen.
- `features`: user actions, forms, mutations, selections, and filters.
- `entities`: domain types, API, query options, and domain UI.
- `shared`: domain-independent UI, libraries, and config.

## Public APIs

- Export slice-level public API through `index.ts`.
- Avoid deep imports into internal files.
- Avoid circular imports and imports from higher layers.

## Practical rules

- Entities provide domain types instead of leaking backend DTOs.
- Features express user behavior.
- Widgets compose features and entities.
- Pages handle routing and screen composition.
- Shared code should not know business-domain words.

## Review questions

- Would this file keep the same responsibility if reused on another screen?
- Is this logic a user action, domain model, or screen composition concern?
- Does this split reduce real complexity?
- Can the same boundary be kept with less abstraction?
