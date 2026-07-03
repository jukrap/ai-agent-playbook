# Style Dials And Anti-Patterns

## Style Dials

Use three dials to make taste decisions explicit:

- **Visual variance:** how far the layout may move from conventional patterns.
- **Motion intensity:** how much motion is needed to clarify state, continuity, or delight.
- **Visual density:** how much information should appear in one viewport.

Recommended defaults:

| Surface | Visual variance | Motion intensity | Visual density |
| --- | --- | --- | --- |
| Admin, CRM, ERP, SI back office | Low to medium | Low | Medium to high |
| SaaS dashboard | Medium | Low to medium | Medium |
| Portfolio or brand page | Medium to high | Medium | Low to medium |
| Data exploration | Low to medium | Low | High |
| Game or immersive media | High | Medium to high | Context-dependent |
| Form-heavy workflow | Low | Low | Medium |

## Dial Rules

- Raise visual variance only when the product benefits from memorability, brand distinction, or spatial storytelling.
- Raise motion only when it communicates continuity, cause/effect, progress, or interaction feedback.
- Raise density only when users compare many items, repeat workflows, or need context without navigation.
- If a dial is high, define the verification evidence for that dial. High motion needs reduced-motion behavior. High density needs overflow and responsive checks. High variance needs stronger layout and content fit checks.

## Anti-Patterns

- A one-note palette where every major surface is a variation of one hue.
- Decorative gradients, blobs, or abstract hero art that hide the actual product or subject.
- Marketing-style hero composition for tools that users need to scan and operate repeatedly.
- Card-inside-card layouts and floating section cards used as page structure.
- Typography that feels large only because it is scaled to the viewport rather than matched to content hierarchy.
- Motion that is claimed in the concept but absent in the built product, or motion that ignores reduced-motion preferences.
- Reference mimicry where the result copies another product's exact composition, marks, copy, or distinctive asset treatment.
- Style-only redesigns that silently change user flows, field names, data meaning, or accessibility behavior.

## Review Checklist

- The direction fits the product type and audience.
- The style dials are explicit enough to guide implementation.
- Visual novelty has a reason beyond looking different.
- Dense surfaces still support scanning, comparison, and repeated action.
- Motion has a functional purpose and an accessible fallback.
- The palette includes neutral, semantic, interactive, status, and focus colors.
- The design can be implemented with the repository's existing primitives or a justified extension.
