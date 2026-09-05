# Review design, UI, prose, and code

These subjects need different evidence. A single score for how "AI-like" something looks does not explain whether it suits a product or preserves its behavior. Choose the relevant review and keep the author's or product's intent visible.

## Choose the review

| Subject | Guidance | Evidence to inspect |
| --- | --- | --- |
| Design direction | `design-brief-direction` | Purpose, users, brand references, information density, implementation constraints |
| Existing UI | `ui-polish` | Rendered screens, interaction states, accessibility, and task completion |
| Korean/English documents | `natural-writing-humanization` | Meaning, numbers, commands, URLs, terminology, tone, intentional emphasis |
| Code structure | Optional `quality/cleanup-ai-slop` references | Public behavior, unnecessary abstraction, duplication, and relevant tests |

Tool integration follows the selected design or document tool's capability instructions. Fiction's accepted voice, character register, and candidate-approval boundaries belong to the writing product; a general document skill does not authorize manuscript changes.

## Design and rendered UI

State the actual workflow and what should be preserved before changing a screen. A dense operations table and a branded event page may need very different visual treatment. Cards, gradients, typography, and asymmetry can be intentional choices.

Inspect normal, loading, empty, error, disabled, and focus states when relevant. Compare useful widths and keyboard interaction. A static source signal can help find a candidate; the rendered result and task fit determine whether a correction is useful.

```sh
ai-agent-playbook qa ui-genericity-scan "<project>" --root src --max-files 20 --json
```

This command reads selected text and does not render the app. Use the project's browser tools for visual and interaction evidence. Keep code cleanup findings separate from visual style judgments.

## Edit documents for their reader

Start with the intended audience and purpose. A beginner guide needs terms, a runnable sequence, expected results, and recovery advice. A command reference needs syntax and boundaries. Short skill instructions do not imply that either human guide should be compressed to a paragraph.

Preserve protected information and deliberate voice. For example, keep a timeout of `30` seconds, an exact command, and an URL unchanged when simplifying the surrounding sentence. In Korean, replace unexplained mixed terminology with an ordinary explanation while retaining actual field and command names. Do not mechanically remove polite language, purposeful repetition, branding, or language-specific navigation.

For a substantial rewrite, optional checks can help locate information changes:

```sh
ai-agent-playbook writing fidelity-check "<project>" --before docs/before.md --after docs/after.md --lang auto --json
ai-agent-playbook writing naturalness-check "<project>" --path docs/after.md --lang ko --engine js --json
```

Prepare actual before/after files first. Review the reported passages in context; neither tool certifies meaning preservation or authorship. Ordinary edits do not require a CLI check or a scoring table.

## Review code behavior separately

Remove a wrapper or abstraction only when it adds no useful contract. Check observable behavior such as return values, error handling, ordering, side effects, and public interfaces. Choose tests that could catch a real regression. A shorter implementation alone is not evidence of better behavior.

## Record useful evidence

Record what was preserved, what changed, how the result was inspected, and what remains untested. For a small comparison, use the same input, task constraints, model settings, and acceptance criteria. Keep fidelity, task fit, over-correction, and observed execution cost separate. Five examples do not establish a general performance gain or subscription saving. See [Verification](verification.md).
