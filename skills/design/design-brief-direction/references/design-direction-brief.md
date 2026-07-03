# Design Direction Brief

## Inputs

- Product surface: landing page, dashboard, admin tool, workflow app, portfolio, ecommerce, data product, mobile view, kiosk, game, or embedded widget.
- Audience and job: who uses it, how often, what they need to decide or do, and what trust level the interface must project.
- Existing assets: brand guide, logo, screenshots, Figma frames, design system, component library, marketing copy, product screenshots, and current production UI.
- Constraints: stack, component library, theming, accessibility bar, performance budget, device matrix, content length, localization, and delivery deadline.
- Reference material: only use it as evidence for patterns and decisions. Do not copy source prose, private paths, upstream branding, or exact visuals into public docs.

## Product Fit

Classify the surface before style selection:

- Operational product: prioritize scan density, stable navigation, restrained hierarchy, predictable controls, and low novelty.
- Consumer product: prioritize fast comprehension, strong identity, clear conversion path, and responsive media.
- Portfolio or brand page: prioritize first-viewport identity, proof of work, subject visibility, and editorial pacing.
- Data or analytics product: prioritize metric definitions, chart legibility, comparison, drill paths, and caveats.
- Interactive or media-heavy product: prioritize primary scene framing, performance, asset loading, fallback behavior, and reduced-motion paths.

## Direction Decision

Write one paragraph that explains:

- the intended visual language,
- why it fits the product and audience,
- what must remain stable from the existing product,
- what can change,
- which existing repository patterns should be reused,
- which visible anti-patterns are out of scope.

Avoid a menu of styles unless the user explicitly asks for variants. A design direction should be opinionated enough that implementation can choose concrete tokens and component states without re-litigating the product mood.

## Output Contract

Return a compact brief with these sections:

- **Intent:** user job, business or project goal, and primary surface.
- **Audience:** expertise level, frequency of use, trust expectations, device context.
- **Direction:** visual language, density, motion, and brand posture.
- **Constraints:** stack, design-system boundary, accessibility, content, device, performance, and asset limitations.
- **Keep:** existing navigation labels, legal text, product terminology, brand marks, URLs, data contracts, or component behavior that must not change silently.
- **Change:** hierarchy, layout, spacing, states, copy tone, token mapping, media, or interaction areas that need improvement.
- **Route:** next skill or workflow: brand identity system, design reference analysis, image-to-code handoff, frontend UI polish, frontend quality review, or interactive experience delivery.

## Stop Conditions

- The product purpose is unknown and the design would be pure decoration.
- Required brand or legal assets are missing.
- The requested visual direction conflicts with accessibility, privacy, or product clarity.
- A redesign would change navigation, legal copy, field names, checkout/auth flows, or data meaning without explicit approval.
