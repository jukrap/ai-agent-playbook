# Image To Code Contract

## Source Classification

Classify the image before implementation:

- **Authoritative mockup:** expected to match closely, with known design owner.
- **Generated direction:** useful for mood and composition, not exact source of truth.
- **Reference screenshot:** useful for principles, not copyable exact design.
- **Current product screenshot:** baseline evidence for redesign or regression work.
- **Partial crop:** needs additional assumptions and should not define hidden states.

## Extraction

Extract:

- page or component purpose,
- layout grid and major regions,
- content hierarchy and reading order,
- component inventory,
- typography roles,
- color roles,
- spacing rhythm,
- image/media treatment,
- interaction states visible or implied,
- responsive behavior that must be inferred or separately specified,
- accessibility risks.

## Contract Shape

Write an implementation-ready contract:

- **Target surface:** route, component, page, modal, email, slide, or embedded widget.
- **Visual match level:** strict, close, direction-only, or exploratory.
- **Tokens:** semantic colors, typography roles, spacing, radius, shadow, motion, and density.
- **Components:** existing primitives to reuse, variants to add, one-off composition to keep local.
- **States:** loading, empty, error, success, disabled, focus, hover, selected, overflow, and long content.
- **Responsive rules:** breakpoint behavior, stacking, fixed aspect ratios, min/max widths, and scroll behavior.
- **Assets:** source, license, export format, fallback, and alt text.
- **Verification:** screenshot matrix, accessibility checks, interaction checks, and content-fit checks.

## Uncertainty Handling

- Do not invent hidden API data, auth behavior, business rules, or navigation paths from a static image.
- Ask for or document missing source details when exact matching matters.
- Use existing repository conventions when the image is silent about component states.
- Keep generated-image artifacts as draft evidence until reviewed.
