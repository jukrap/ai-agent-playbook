# First 10 Minutes

This guide is for a first-time user who only wants to know what to run, what changes files, and what to expect.

AI Agent Playbook has four separate layers:

| Layer | What it means | Installed where? |
| ----- | ------------- | ---------------- |
| CLI package | The `aapb` command and bundled source files. | npm cache, global npm location, or one project `node_modules`. |
| Skills | Reusable agent guidance such as onboarding, review, UI polish, and legacy maintenance. | User-level skill folders such as `.codex/skills` and `.agents/skills`. |
| Project playbook | Local project memory under `.ai-agent-playbook/`, including current facts, working vocabulary, maps, runs, contracts, and worklogs. | One target project repository. |
| MCP tools | Optional read-only tools an AI app can call for context, search, diagnostics, AST search, function-body clone cues, and TypeScript/JavaScript analysis. | Registered in the AI app as a local stdio server command. |

Installing the npm package does not install skills, add `.ai-agent-playbook/` to a project, or register MCP settings. Those steps stay explicit.

## 1. Run the CLI without installing it globally

Use `npx` first. It runs the published package for one command and does not add a dependency to your project.

```powershell
npx ai-agent-playbook --help
```

Use a global install later only if you want the shorter command from any directory:

```powershell
npm install -g ai-agent-playbook
aapb --help
```

From that point on, `aapb ...` and `npx ai-agent-playbook ...` mean the same kind of command. The examples below use `npx` because it is the lowest-commitment path.

## How to read the examples

- Do not type angle brackets literally. Replace `<target-project>` with the project folder you want to inspect.
- Use `.` as the target when your terminal is already inside that project.
- Quote paths or text that contain spaces: `".\example app"` or `"auth flow change"`.
- Options start with `--`. For example, `--dry-run` previews a write, and `--json` prints structured output.
- Keep personal folders, customer names, credentials, and internal URLs out of shared docs, issues, and PRs. Use placeholders such as `<target-project>` when writing examples for others.

## 2. Preview skill installation

Skills are reusable guidance for the agent. They are not copied into every project.

```powershell
npx ai-agent-playbook skills install --dry-run
```

Read the output. It should mention user skill roots, not your target project. If it reports conflicts, stop and inspect them before forcing anything.

## 3. Install skills

When the preview looks right:

```powershell
npx ai-agent-playbook skills install
```

Restart Codex or start a new agent session after installing skills so the app can load the new skill metadata.

## 4. Check a target project before writing to it

`<target-project>` is the folder you want to inspect or bootstrap. It can be `.` when your terminal is already inside that project.

```powershell
npx ai-agent-playbook operator check <target-project> --json
```

This is read-only. It checks whether a project playbook exists, whether guides are fresh, which verification commands look likely, and which local rules may apply.

## 5. Preview project bootstrap

Bootstrap creates project-level files such as root `AGENTS.md` and `.ai-agent-playbook/`.

```powershell
npx ai-agent-playbook bootstrap <target-project> --dry-run
```

Use `--local-only` when the target project should keep `.ai-agent-playbook/` out of Git:

```powershell
npx ai-agent-playbook bootstrap <target-project> --local-only --dry-run
```

Only apply after the preview looks right:

```powershell
npx ai-agent-playbook bootstrap <target-project> --local-only
```

Omit `--local-only` if the project should commit `.ai-agent-playbook/`.

## 6. Before and after a risky edit

Use preflight when you want a baseline before changing files:

```powershell
npx ai-agent-playbook operator preflight <target-project> --intent "planned change" --json > preflight.json
```

Do your work, then compare the current project to that baseline:

```powershell
npx ai-agent-playbook operator delta <target-project> --before preflight.json --json
```

Delta reports what changed. It does not judge whether the implementation is correct.

## Optional: let an AI app call tools for you

If your AI app supports MCP, register this local server command:

```powershell
npx ai-agent-playbook mcp
```

This is optional for the first 10 minutes. It lets the AI call read-only tools such as operator search, deep analysis, contracts check, and image diff without asking you to remember each CLI command.

## 7. Update or remove later

Update installed skills:

```powershell
npx ai-agent-playbook skills update --dry-run
npx ai-agent-playbook skills update
```

Remove only this playbook's unmodified managed skills:

```powershell
npx ai-agent-playbook skills uninstall --dry-run
npx ai-agent-playbook skills uninstall
```

Remove a project playbook from one target repository with preview-first managed cleanup:

```powershell
npx ai-agent-playbook managed check <target-project> --json
npx ai-agent-playbook managed uninstall <target-project> --json
npx ai-agent-playbook managed uninstall <target-project> --apply --json
```

Managed uninstall preserves edited project memory and does not edit `.gitignore`.

## Quick glossary

| Term | Meaning |
| ---- | ------- |
| `npx ai-agent-playbook` | Run the published package without a global install. Good default. |
| `aapb` | Short command after `npm install -g ai-agent-playbook`. |
| `node .\bin\aapb.mjs` | Run from a source checkout of this repository. |
| `skills install` | Copy reusable skills to user-level skill folders. |
| `bootstrap` | Copy project-memory files to one target project. |
| `operator check` | Read-only project health checkpoint. |
| `mcp` | Start a local MCP server whose default tools are read-only. Write tools require explicit server and call gates. |
| `--dry-run` | Preview a write operation without changing files. |
| `--apply` | Perform a preview-first managed operation. |
| `--json` | Print machine-readable output for agents and scripts. |

## What this does not do

- It does not add slash commands.
- It does not install a Codex plugin.
- Installing or bootstrapping does not start background automation. A schedule runs only after an explicit `automation schedule --apply` and provider/OS opt-in.
- It does not register MCP settings automatically.
- It does not block commits.
- It does not remove other people's skills by default.

For the full command reference, continue with [Command guide](commands.md). For install, update, uninstall, and npm lifecycle details, see [Lifecycle guide](lifecycle.md).
