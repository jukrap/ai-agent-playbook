# Safe Bootstrap and Quality Review 0.5.11

Version 0.5.11 makes project bootstrap ownership explicit and adds read-only evidence for generic UI treatment and prose-edit fidelity.

## Existing repositories

Bootstrap still stops before all writes when root `AGENTS.md` exists and no ownership mode is selected. Choose one reviewed mode:

```powershell
# Recommended when the repository already has product-specific instructions
aapb bootstrap <target> --local-only --preserve-agents

# Add and manage only a short playbook reading-order block
aapb bootstrap <target> --local-only --link-agents

# Intentionally replace the complete root policy
aapb bootstrap <target> --replace-agents --force
```

`--force` alone does not replace `AGENTS.md`. Existing root policy and `--profile` require manual integration. Use `--json` before applying when another tool may edit protected files concurrently.

Local-only bootstrap retains existing `.gitignore` bytes, UTF-8 BOM state, line endings, ordering, and final-newline choice. It adds only the missing `.ai-agent-playbook/` pattern. Protected-file symlinks, malformed managed markers, and preflight snapshot drift stop the full operation before partial installation.

The install manifest records optional root-policy ownership. Preserved policy is not managed. Linked policy owns only its marker block, so managed checks and uninstall leave surrounding user content intact. Existing manifests remain readable.

## Review tools

`qa ui-genericity-scan` locates bounded, high-confidence static candidates for repeated template-like UI treatment. Semantic rule IDs cover combinations of gradients, glow or glass, pills, nested cards, radius/shadow stacks, decorative stats, uniform hover transforms, kickers, and generic claims. Results are candidates, not defects. Rendered desktop/mobile evidence and product context remain required before editing or claiming completion.

`writing fidelity-check` compares target-relative before/after prose. It reports change scope and changes to numbers, versions, URLs, commands, paths, code, identifiers, warnings, document structure, Korean register, and repeated rhetorical structures. Equivalent number notation is normalized. The report is evidence only and does not reject an intentional rewrite by a fixed percentage.

Both checks are read-only and are also available through the default MCP surface as `qa_ui_genericity_scan` and `writing_fidelity_check`. They do not execute source text, load external rule modules, modify files, infer authorship, or offer detector-evasion behavior.

## Reference provenance

- UI review principles were independently adapted from [`kill-ai-slop`](https://github.com/yetone/kill-ai-slop) revision `96d1ca568a1db7e1ef9a381644c744440f816ee4` (Apache-2.0).
- Prose review principles were independently adapted from [`im-not-ai`](https://github.com/epoko77-ai/im-not-ai) revision `53e24e8f92cf344efcb812103f7c2b203e7efffc` (MIT).
- A separate writing-oriented harness informed only the review principles for numeric preservation, register, rhetoric, and change scope. Its fiction voice, canon, and candidate-approval workflow were not adopted.

No external scanner implementation, numeric taxonomy, website asset, distinctive wording, or composition is included. The references supplied review principles only; this repository uses its own semantic rules, code, tests, documentation, and developer-tool boundaries.

## Compatibility

- Existing bootstrap behavior remains safe by default: no mode means no write when `AGENTS.md` already exists.
- Existing install manifests remain readable; new ownership fields are optional.
- Naturalness findings now require repetition or contextual density, and equivalent JavaScript/Python findings are merged.
- Public features use semantic command and rule names. `schemaVersion` remains only where machine-readable compatibility requires it.
