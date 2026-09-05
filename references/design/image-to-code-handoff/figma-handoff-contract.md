# Figma Handoff Contract

## Artifact Identity

Record:

- file or frame identity,
- design owner or source status,
- version or timestamp when available,
- target screens and states,
- linked tokens, variables, components, and variants,
- unsupported or stale frames.

Use project-approved access methods. Do not embed private Figma URLs, personal tokens, or client-only names in public docs.

## Inspection

Inspect:

- page and frame hierarchy,
- component instances and variant props,
- token variables and modes,
- text styles and local overrides,
- auto-layout behavior,
- constraints and resizing,
- interactive prototype links,
- exported assets and their source of truth,
- comments or design notes that affect implementation.

## Mapping

Map Figma concepts into the repository:

- Variables or token styles -> existing semantic tokens or a migration proposal.
- Component variants -> existing component props, slots, states, or new variant names.
- Auto-layout -> CSS layout rules, grid/flex constraints, and content-fit behavior.
- Prototype transitions -> route, state, animation, or motion contract.
- Assets -> source-controlled asset, generated asset, runtime media, or external source.

## Review Gates

- The source frame is current enough to implement.
- Shared components are extended in the right layer.
- Theme modes, density, long content, and responsive constraints are covered.
- Accessibility states are specified even if absent from the frame.
- Screenshots or visual checks can prove the implementation matches the agreed contract.
