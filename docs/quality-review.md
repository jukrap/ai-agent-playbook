# UI and Writing Quality Review

The quality-review tools find evidence for human review. They do not identify authorship, bypass detectors, automatically redesign a product, or prove completion from a clean scan.

## Generic UI review

The `generic-ui-review` skill is intended for requests such as “this looks AI-made” or “the UI feels templated.” It also applies when cards, pills, gradients, glass surfaces, glows, or decorative stats overwhelm the product task. Its trigger lets a skill-aware agent select it when the installed skill catalog is available. The project skill policy also routes frontend genericity concerns to it.

The static locator is read-only:

```powershell
aapb qa ui-genericity-scan <target> --root src --max-files 500 --json
```

The scanner reports bounded candidates with semantic rule IDs. It covers repeated or combined gradient text, ambient glow, glass surfaces, pill taxonomies, nested cards, radius/shadow stacks, decorative stats, uniform hover transforms, kickers, and generic claims. Generated output, dependencies, lockfiles, minified assets, local references, work folders, and playbook runtime data are excluded.

A finding is not automatically a defect. Review the product type, primary task, expected information density, target viewports, brand rules, and rendered interface. Together they show whether a treatment is useful or generic. A reviewed source comment may suppress one intentional candidate with `ui-review-ignore <rule-id>`.

### From finding to correction

When the task authorizes UI changes, an agent should:

1. inspect the actual screen and reproduce the candidate at named viewports;
2. state the user impact and distinguish an intentional design-system choice from a defect;
3. use `ui-polish` or the repository's UI implementation workflow to make the smallest coherent correction;
4. re-run relevant static checks and verify the same rendered state;
5. retain screenshots or video for changed UI.

For a review-only request, the agent should report candidates and recommendations without editing files. A zero-finding scan never replaces rendered evidence, accessibility review, responsive checks, or product judgment.

The same locator is available to MCP clients as `qa_ui_genericity_scan`. Tool availability does not mean every UI task runs it automatically: the agent runtime must expose the skill or MCP tool, the request must match the trigger, and the scan root must be relevant to the project.

Install or refresh the user-level skill with `aapb skills install` or `aapb skills update`, then restart the agent so a new session can discover it. A project policy copied by an earlier bootstrap is user-owned and is not silently overwritten; add the routing entry manually when that project requires an explicit local policy.

## Writing naturalness

`writing naturalness-check` and `writing naturalness-report` review Korean or English prose for repeated translationese, inflated tone, uniform rhythm, and excessive English-term density. A single normal phrase is not treated as evidence; repetition, density, and context must support the finding. Fenced code, inline code, commands, URLs, badge-only markup, and path examples are excluded before prose scoring.

```powershell
aapb writing naturalness-check <target> --path README.md --lang auto --engine auto --json
aapb writing naturalness-report <target> --root docs --lang ko --engine auto --json
```

The JavaScript fallback always remains available. When the optional Python engine is installed, `--engine auto` merges its local language signals and deduplicates equivalent findings.

## Before/after fidelity

`writing fidelity-check` compares two target-relative UTF-8 files without modifying them:

```powershell
aapb writing fidelity-check <target> --before docs/before.md --after docs/after.md --lang auto --json
```

It reports character-change scope, sentence touch ratio, normalized numbers, versions, URLs, commands, paths, code spans and fences, identifiers, warnings, structure, Korean register movement, and disappearance of repeated rhetorical structures. Equivalent forms such as Korean ten-thousand notation and `10,000` are normalized.

The result is evidence, not a fixed rejection gate. A large intentional rewrite can be valid, while a small edit that changes a command, version, or warning can require review. Imperative text in the compared documents is treated as data and never executed. MCP clients receive the same read-only result through `writing_fidelity_check`.

## Reference provenance

- Generic UI review principles were independently adapted from [`kill-ai-slop`](https://github.com/yetone/kill-ai-slop) revision `96d1ca568a1db7e1ef9a381644c744440f816ee4` (Apache-2.0).
- Prose review principles were independently adapted from [`im-not-ai`](https://github.com/epoko77-ai/im-not-ai) revision `53e24e8f92cf344efcb812103f7c2b203e7efffc` (MIT).
- A separate writing-oriented harness informed only numeric preservation, register, rhetoric, and change-scope review principles. Fiction voice, canon, and candidate-approval workflows were not adopted.

No external scanner implementation, numeric taxonomy, website asset, distinctive wording, or composition is included. The playbook uses its own semantic rules, implementation, tests, developer-tool boundaries, and evidence-only decisions.
