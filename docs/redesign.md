# What changed in 1.0

AAPB 1.0 focuses on durable project records, useful artifact formats, and selected specialist guidance. The package remains `ai-agent-playbook`. Its primary installed command is now `ai-agent-playbook`, with `aapb` as a short alias.

## Why the package changed

As coding models and their host applications became more capable, AAPB's role needed to change too. Repeating general planning, exploration, review, and execution instructions could add work even when the host already supplied those abilities. The goal was to keep what a model cannot infer reliably: project decisions, evidence, product constraints, requested formats, and specialist exceptions.

Newer models also follow instructions more closely. Ambiguous or conflicting process rules can therefore matter more, rather than becoming harmless background text. The [official Astra guidance](https://developers.openai.com/api/docs/guides/latest-model?model=gpt-6-astra) recommends auditing skills and making instruction priorities clear. This motivates reviewing guidance; it does not prescribe a universal skill count.

Useful skills remain valuable. [SkillsBench](https://arxiv.org/abs/2602.12670) found benefits for curated task-specific skills in its tested configurations. Its results do not determine the best global catalog for every user or establish an AAPB performance gain. The intended improvement is a clearer division of responsibility and less duplicated mandatory work, not an unmeasured speed or cost guarantee.

## What stays, changes, or retires

| Area | 1.0 behavior |
| --- | --- |
| Project continuity | Start from CURRENT.md and link detail as needed; old records remain readable |
| Specialist guidance | Core, development, and optional legacy skills, with relevant references |
| Human documentation | Beginner guides, detailed commands, examples, and language-specific presentation |
| Installation | One default skill root, explicit selection, ownership checks, and recoverable migration |
| MCP | Four optional, project-bound read-only record tools |
| Writing and UI checks | Optional advisory commands, chosen when useful |
| GitHub/Gitea | Reviewed coordination plans with explicit application and conflict reporting |
| Execution, schedules, and broad analysis | Use host/project tools, or explicitly retain the previous runtime |

The old catalog had 94 entrypoints; 1.0 has six installable skills, of which the development profile selects five. Substantive domain references remain available. These counts describe packaging decisions, not proof that six skills are optimal or that more skills are inherently harmful. See [Skill catalog](skill-catalog.md) and [the reference mapping](skill-decisions.md).

## Choose the amount of guidance you need

There are two separate choices: how much guidance to make available, and which runtime features to use.

| Need | Current choice |
| --- | --- |
| A small record/artifact baseline | `--profile core` |
| Records plus design, UI, and prose guidance | `--profile development` |
| A particular legacy contract | `--profile legacy` or individual `--skill` selections |
| More domain detail for one task | Select relevant references without loading the whole library |
| The previous broad catalog and executor/scheduler | Use the pinned 0.5.11 package |

A future extended skill profile could fit the same 1.0 runtime if its entries add demonstrated value. Reintroducing the old runtime under a single "heavy" switch would also reintroduce its separate contracts, dependencies, and maintenance burden. No light/heavy runtime switch is implemented, and the current profile decision is not a comparison proving one universal optimum.

## Continue using 0.5.11

If you rely on earlier skills or runtime features, keep using the exact previous release instead of moving immediately:

```sh
npx ai-agent-playbook@0.5.11 --help
npx ai-agent-playbook@0.5.11 skills install --dry-run
```

To keep that version globally:

```sh
npm install -g ai-agent-playbook@0.5.11
aapb --version
```

The 0.5.11 package exposes the global `aapb` command, not the new full-name executable. Do not substitute the 1.0 `ai-agent-playbook` command when following 0.5.11 instructions. A global change replaces the runtime used by existing callers; use pinned `npx` or an isolated prefix if both versions are needed.

Preview old skill installation before applying it: do not overwrite a 1.0 installation or user edits merely to restore a large catalog. Keep the previous package, skills, records, and recovery data. Existing schedules and remote records are not automatically changed. [Lifecycle](lifecycle.md) covers installation and guarded recovery.

## Move when the new workflow fits

Inspect existing records first, then preview selected skill migration. Record reading does not require converting an old layout. Root instructions, historical decisions, and user edits should stay intact. Test the package on a representative project before replacing an operational runtime.

Verification distinguishes code tests, package installation, MCP transport, host discovery, and actual task behavior. The initial small quality comparison did not prove that the lighter setup improves every task. Model capabilities and project needs can change; preserve the ability to add useful guidance without restoring every old mandatory procedure.
