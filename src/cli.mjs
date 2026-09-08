import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readJson, safePath, projectRoot } from './fs-safety.mjs';
import { playbookStatus, playbookSearch, playbookRead, playbookValidate, bootstrapRecords, migrateRecords, rollbackRecordMigration } from './records.mjs';
import { PACKAGE_VERSION } from './version.mjs';
import { runWorkspace, resolveCodeTarget, locateLocalPlaybook, projectGitEnvironment } from './workspace.mjs';
import { createWorklog, listWorklogs, createKnowledge } from './record-authoring.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FLAGS = new Set(['json','help','version','dry-run','apply','local-only','preserve-agents','offline','no-remote','remote-read-only','force-managed','force-unmanaged','with-ast','interactive','yes']);
const VALUES = new Set(['profile','skill','agents-root','codex-root','backup-root','backup','path','query','max-results','max-chars','start-line','end-line','cursor','page-size','view','project','to','before','after','lang','engine','root','max-files','plan','provider','remote','milestone','project-title','project-mode','pattern','kind','exclude','records','agents','repo-path','repo','id','role','record-source','title','topic','month','date']);
const RETIRED = new Set(['automation','plan','worklog','workflow','reference','index','graph','canon','write-gate','rules','diagnostics','run','source','ast','lsp']);
function parse(argv) {
  const args = [], flags = {}, skills = [], repoPaths = [];
  for (let i = 0; i < argv.length; i++) {
    const item = argv[i];
    if (!item.startsWith('--')) { args.push(item); continue; }
    const key = item.slice(2);
    if (FLAGS.has(key)) { flags[key] = true; continue; }
    if (!VALUES.has(key)) throw new Error('Unknown option: ' + item);
    if (i + 1 >= argv.length || argv[i + 1].startsWith('--')) throw new Error('Missing value: ' + item);
    const value = argv[++i];
    if (key === 'skill') skills.push(value);
    else if (key === 'repo-path') repoPaths.push(value);
    else if (key in flags) throw new Error('Repeated option: ' + item);
    else flags[key] = value;
  }
  return { args, flags, skills, repoPaths };
}
function retired(command) {
  return { schemaVersion: 2, kind: 'command.retired', ok: false, writes: false, command,
    message: 'This command is retired in 1.0. Use host execution/scheduling or direct project tools. Existing records remain readable with records status/read/search.',
    recovery: 'npx ai-agent-playbook@0.5.11 ' + command,
    automaticFallback: false };
}
export async function runCli(argv, io = {}) {
  const cwd = io.cwd ?? process.cwd(), stdout = io.stdout ?? process.stdout, stderr = io.stderr ?? process.stderr;
  try {
    if (RETIRED.has(argv[0]) && !(argv[0] === 'ast' && argv[1] === 'search') && !(argv[0] === 'worklog' && ['new', 'list'].includes(argv[1])) && !argv.includes('--help')) {
      stdout.write(JSON.stringify(retired(argv.slice(0, 2).join(' ')), null, 2) + '\n');
      return 2;
    }
    const { args, flags, skills, repoPaths } = parse(argv);
    if (flags.version) { stdout.write(PACKAGE_VERSION + '\n'); return 0; }
    if (flags.help || !args.length || args[0] === 'help') { stdout.write(help()); return 0; }
    const [command, sub] = args;
    const nested = ['records','skills','migrate','forge','writing','runtime','qa','operator','managed','layout','catalog','contracts','ast','workspace','worklog','knowledge'].includes(command) || (command === 'context' && ['list','status','init'].includes(sub));
    const target = path.resolve(cwd, flags.project ?? args[nested ? 2 : 1] ?? '.');
    const repoRoot = io.repoRoot ?? REPO_ROOT;
    /** @type {{ok?: boolean, kind?: string, content?: string, truncated?: boolean, [key: string]: unknown}} */
    let result;
    if (command === 'skills') {
      const { runSkillsLifecycle } = await import('./skills-lifecycle.mjs');
      result = await runSkillsLifecycle({ repoRoot, command: sub, profile: flags.profile ?? 'core', skills,
        agentsRoot: flags['agents-root'], codexRoot: flags['codex-root'], backupRoot: flags['backup-root'], backup: flags.backup,
        dryRun: Boolean(flags['dry-run']), apply: Boolean(flags.apply), forceManaged: flags['force-managed'], forceUnmanaged: flags['force-unmanaged'] });
    } else if (command === 'mcp') {
      const { runMcpServer } = await import('./mcp-server.mjs');
      await runMcpServer({ target: path.resolve(cwd, flags.project ?? args[1] ?? '.'), withAst: Boolean(flags['with-ast']) }); return 0;
    } else if (command === 'ast' && sub === 'search') {
      if (flags.apply || flags['dry-run']) throw new Error('AST search is read-only; --apply and --dry-run do not apply.');
      const { searchAst } = await import('./ast-search.mjs');
      result = await searchAst({ target, repo: flags.repo, pattern: flags.pattern, lang: flags.lang, path: flags.path, maxFiles: flags['max-files'], maxResults: flags['max-results'], maxChars: flags['max-chars'], cursor: flags.cursor });
    } else if (command === 'bootstrap') {
      if (flags['preserve-agents'] && flags.agents && flags.agents !== 'preserve') throw new Error('--preserve-agents conflicts with --agents link.');
      const repositories = repoPaths.length ? await bootstrapMembers(target, repoPaths) : flags.kind === 'workspace' && (flags.yes || flags.json || !flags.interactive) ? [] : undefined;
      const { prepareBootstrapOptions } = await import('./bootstrap-wizard.mjs');
      const options = await prepareBootstrapOptions({ target, repoRoot, dryRun: Boolean(flags['dry-run']), localOnly: Boolean(flags['local-only']),
        kind: flags.kind, exclude: flags.exclude, lang: flags.lang, records: flags.records, agents: flags['preserve-agents'] ? 'preserve' : flags.agents, repositories },
      { stdin: io.stdin ?? process.stdin, stdout, stderr, ask: io.ask, interactive: flags.interactive, yes: flags.yes, json: flags.json });
      result = options === null ? { schemaVersion: 2, kind: 'playbook.bootstrap', ok: true, writes: false, applied: false, cancelled: true } : await bootstrapRecords(options);
    } else if (command === 'migrate' && sub === 'bootstrap-rollback') {
      const { recoverBootstrap } = await import('./bootstrap.mjs');
      result = await recoverBootstrap({ target, recordSource: flags['record-source'], transaction: flags.backup, dryRun: !flags.apply || Boolean(flags['dry-run']) });
    } else if (command === 'migrate' && sub === 'rollback') {
      result = await rollbackRecordMigration({ target, recordSource: flags['record-source'], backup: flags.backup, apply: Boolean(flags.apply && !flags['dry-run']) });
    } else if (command === 'migrate' && sub === 'layout') {
      if (flags.to && flags.to !== 'minimal') throw new Error('1.0 migrates to minimal layout only; existing structured records remain readable.');
      result = await migrateRecords({ target, recordSource: flags['record-source'], apply: Boolean(flags.apply && !flags['dry-run']) });
    } else if ((command === 'records' && sub === 'status') || (command === 'context' && ['list','status'].includes(sub)) || (command === 'layout' && sub === 'status') || (command === 'managed' && sub === 'catalog')) {
      result = await playbookStatus({ target, recordSource: flags['record-source'], view: flags.view, cursor: flags.cursor, pageSize: flags['page-size'], maxChars: flags['max-chars'] });
    } else if ((command === 'records' && sub === 'read') || (command === 'context' && !['init','list','status'].includes(sub))) {
      result = await playbookRead({ target, recordSource: flags['record-source'], path: flags.path, startLine: flags['start-line'], endLine: flags['end-line'], cursor: flags.cursor, maxChars: flags['max-chars'] });
    } else if ((command === 'records' && sub === 'search') || (command === 'operator' && sub === 'search')) {
      result = await playbookSearch({ target, recordSource: flags['record-source'], path: flags.path, repo: flags.repo, month: flags.month, kind: flags.kind, query: flags.query, view: flags.view, cursor: flags.cursor, maxResults: flags['max-results'], maxChars: flags['max-chars'] });
    } else if (command === 'doctor' || (command === 'records' && sub === 'validate') || (command === 'managed' && sub === 'check') || (command === 'operator' && ['check','audit'].includes(sub)) || (command === 'contracts' && sub === 'check')) {
      result = await playbookValidate({ target, recordSource: flags['record-source'], view: flags.view, cursor: flags.cursor, pageSize: flags['page-size'], maxChars: flags['max-chars'] });
    } else if (command === 'workspace') {
      result = await runWorkspace({ target, command: sub, id: flags.id, path: flags.path, role: flags.role, apply: Boolean(flags.apply), dryRun: Boolean(flags['dry-run']) });
    } else if (command === 'worklog' && ['new', 'list'].includes(sub)) {
      const options = { target, title: flags.title, lang: flags.lang, repo: flags.repo, topic: flags.topic, date: flags.date, month: flags.month, recordSource: flags['record-source'], dryRun: Boolean(flags['dry-run']), pageSize: flags['page-size'], maxChars: flags['max-chars'], cursor: flags.cursor };
      result = await (sub === 'new' ? createWorklog : listWorklogs)(options);
    } else if (command === 'knowledge' && sub === 'new') {
      result = await createKnowledge({ target, title: flags.title, lang: flags.lang, repo: flags.repo, topic: flags.topic, recordSource: flags['record-source'], dryRun: Boolean(flags['dry-run']) });
    } else if (command === 'writing') {
      if (sub === 'fidelity-check') {
        const { checkWritingFidelity } = await import('./runtime/writing-fidelity.mjs');
        result = await checkWritingFidelity({ target, before: flags.before, after: flags.after, lang: flags.lang });
      } else if (['naturalness-check','naturalness-report'].includes(sub)) {
        const { checkWritingNaturalness, checkWritingNaturalnessReport } = await import('./runtime/writing-naturalness.mjs');
        result = await (sub === 'naturalness-check' ? checkWritingNaturalness : checkWritingNaturalnessReport)({
          target, repoRoot, path: flags.path, root: flags.root, maxFiles: flags['max-files'], lang: flags.lang, engine: flags.engine ?? 'js'
        });
      } else result = retired(args.join(' '));
    } else if (command === 'runtime' && sub === 'python-status') {
      const { pythonEngineStatus } = await import('./runtime/python-engine.mjs');
      result = await pythonEngineStatus({ repoRoot });
    } else if (command === 'qa' && sub === 'ui-genericity-scan') {
      const { checkUiGenericity } = await import('./operator/qa-ui-genericity.mjs');
      result = await checkUiGenericity({ target, root: flags.root, maxFiles: flags['max-files'] });
    } else if (command === 'forge' && ['status','bootstrap','sync','reconcile'].includes(sub)) {
      result = await forgeCommand({ target, command: sub, flags });
    } else if (command === 'catalog' && ['list','check'].includes(sub)) {
      const { runSkillsLifecycle } = await import('./skills-lifecycle.mjs');
      result = await runSkillsLifecycle({ repoRoot, command: sub === 'list' ? 'list' : 'lint' });
    } else if (RETIRED.has(command) || ['operator','managed','layout','migrate','context','qa','adapter','guides','contracts','forge','writing','runtime'].includes(command)) {
      result = retired(args.join(' '));
    } else throw new Error('Unknown command. Run ai-agent-playbook --help.');
    if (flags.json) stdout.write(JSON.stringify(result, null, 2) + '\n');
    else if (result.kind === 'aapb.read') stdout.write(result.content + (result.truncated ? '\n[More text: repeat this path with --cursor ' + result.nextCursor + ' --json]\n' : ''));
    else stdout.write(JSON.stringify(result, null, 2) + '\n');
    return result.ok === false ? result.kind === 'command.retired' ? 2 : 1 : 0;
  } catch (error) {
    if (argv.includes('--json')) stdout.write(JSON.stringify({ schemaVersion: 2, ok: false, kind: 'error', code: error.code, message: error.message }) + '\n');
    else stderr.write(error.message + '\n');
    return 1;
  }
}
async function bootstrapMembers(target, paths) {
  const used = new Set(), members = [];
  for (const relative of paths) {
    const root = await projectRoot(await safePath(target, relative));
    let id = path.basename(root).toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 54) || 'repository';
    const base = id; let next = 2;
    while (used.has(id)) id = base + '-' + next++;
    used.add(id);
    const local = await locateLocalPlaybook(root);
    members.push({ id, path: relative.replaceAll('\\', '/'), role: 'repository', ...(local.exists ? { recordPath: local.name } : {}) });
  }
  return members;
}
async function forgeCommand({ target, command, flags }) {
  const { root, remoteUrl, warnings, blocked } = await forgeRemoteContext({ target, repo: flags.repo, remote: flags.remote ?? 'origin' });
  const forge = await import('./forge/index.mjs');
  const status = forge.inspectForgeStatus({ remoteUrl, warnings, provider: flags.provider, profile: flags.profile ?? 'coordinate', noRemote: flags['no-remote'], offline: flags.offline, remoteReadOnly: flags['remote-read-only'] });
  if (command === 'status') return status;
  if (blocked && flags.apply && !flags['dry-run']) throw new Error(blocked);
  let input = {};
  if (flags.plan) input = await readJson(await safePath(root, flags.plan), 2_000_000);
  if (['sync','reconcile'].includes(command) && !flags.plan) throw new Error('Forge coordination requires --plan <reviewed-project-relative-json>.');
  const provider = status.provider;
  const plan = Array.isArray(input.operations) ? input : command === 'bootstrap'
    ? forge.planForgeBootstrap({ provider, milestoneTitle: flags.milestone, projectTitle: flags['project-title'], projectMode: flags['project-mode'] ?? 'milestone' })
    : command === 'reconcile' ? forge.planForgePresentationReconcile({ ...input, provider })
    : forge.planForgeSync({ ...input, provider });
  if (plan.provider && plan.provider !== provider) throw new Error('Plan provider does not match the selected remote.');
  const options = { plan, provider, repository: status.repository, profile: flags.profile ?? 'coordinate',
    apply: Boolean(flags.apply && !flags['dry-run']), noRemote: flags['no-remote'], offline: flags.offline, remoteReadOnly: flags['remote-read-only'] };
  if (!options.apply || options.noRemote || options.offline || options.remoteReadOnly || plan.ok === false) return forge.applyForgePlan(options);
  if (!status.ok || !status.repository) throw new Error('A verified repository remote is required for forge apply.');
  const connection = await forge.createDefaultForgeTransport({ provider, repository: status.repository });
  return forge.applyForgePlan({ ...options, transport: connection.transport });
}
async function forgeRemoteContext({ target, repo, remote }) {
  const { findWorkspace } = await import('./workspace.mjs');
  // Use one membership snapshot for both target selection and the Git boundary.
  const context = await findWorkspace(target);
  let root = context.start;
  if (context.workspace) {
    const selected = repo === undefined ? context.activeRepo : context.workspace.config.repositories.find((member) => member.id === repo);
    if (!selected) throw new Error(repo === undefined ? 'Select one repository with --repo when starting at a workspace root.' : 'Unknown repository ID: ' + repo);
    root = await projectRoot(await safePath(context.workspace.root, selected.path));
  } else if (repo !== undefined) throw new Error('--repo requires a registered workspace.');
  const env = projectGitEnvironment();
  const git = (args) => promisify(execFile)('git', ['-C', root, ...args], { env, encoding: 'utf8', windowsHide: true, timeout: 10000 });
  const blocked = (id, message) => ({ root, remoteUrl: null, warnings: [{ id, message }], blocked: message });
  let binding = [];
  if (context.workspace) {
    try {
      const { stdout } = await git(['rev-parse', '--show-toplevel', '--absolute-git-dir']);
      const [worktree, gitDirectory, ...extra] = stdout.replace(/\r?\n$/, '').split(/\r?\n/);
      if (!worktree || !gitDirectory || extra.length || path.relative(root, await projectRoot(worktree)) !== '') {
        return blocked('forge.workspace.git-root-mismatch', 'Selected workspace member is not its own Git worktree root; ancestor remote access is disabled.');
      }
      // Pin the verified Git directory so a disappearing .git cannot restart ancestor discovery.
      binding = ['--git-dir', await projectRoot(gitDirectory), '--work-tree', root];
    } catch {
      return blocked('forge.workspace.git-root-unverified', 'Could not verify the selected workspace member as its own Git worktree root; remote access is disabled.');
    }
  }
  let remoteUrl = null;
  try { remoteUrl = (await git([...binding, 'remote', 'get-url', '--', remote])).stdout.trim(); } catch {}
  return { root, remoteUrl, warnings: [], blocked: null };
}
function help() {
  return `AI Agent Playbook ${PACKAGE_VERSION}

Commands: ai-agent-playbook (primary), aapb (short alias). Both run the same CLI.
Project paths are optional; omission uses the terminal working directory.
--project <directory> explicitly selects a target for project commands.
Skill installation uses user skill roots, not the working directory.

Project records:
  ai-agent-playbook bootstrap [project] [--interactive|--yes] [--kind single|workspace] [--exclude local|shared|global|none] [--records minimal|standard] [--agents preserve|link] [--lang en|ko] [--repo-path relative-directory] [--dry-run] [--json]
  --local-only and --preserve-agents remain compatible aliases. Bare interactive terminals open the setup guide.
  ai-agent-playbook workspace list|check [project] [--json]
  ai-agent-playbook workspace add [project] --id <id> --path <relative-directory> [--role <role>] [--apply] [--json]
  ai-agent-playbook workspace remove [project] --id <id> [--apply] [--json]
  ai-agent-playbook worklog new [project] --title <title> [--repo <id>] [--topic <topic>] [--date YYYY-MM-DD] [--lang en|ko] [--dry-run] [--json]
  ai-agent-playbook worklog list [project] [--repo <id>] [--topic <topic>] [--month YYYY-MM] [--page-size N] [--cursor token] [--json]
  ai-agent-playbook knowledge new [project] --title <title> [--topic <topic>] [--repo <id>] [--lang en|ko] [--dry-run] [--json]
  ai-agent-playbook records status [project] [--view summary|records|warnings|repositories] [--page-size N] [--cursor token] [--json]
  ai-agent-playbook records validate [project] [--view summary|issues|warnings] [--page-size N] [--cursor token] [--json]
  ai-agent-playbook records read [project] [--path CURRENT.md] [--start-line N] [--end-line N] [--max-chars N] [--cursor token] [--json]
  ai-agent-playbook records search [project] --query <literal> [--max-results N] [--max-chars N] [--cursor token] [--json]
  Search filters: --path <record-path-prefix>, --repo <id>, --month YYYY-MM, --kind worklog|knowledge|current|other.
  Record source: --record-source workspace|repo:<id> (registered member's existing local records).
  ai-agent-playbook migrate layout [project] --to minimal [--apply] [--json]
  ai-agent-playbook migrate rollback [project] --backup <playbook-relative-backup> [--apply] [--json]
  ai-agent-playbook migrate bootstrap-rollback [project] --backup <returned-transaction> [--apply] [--json]

Skills (default destination: .agents/skills):
  ai-agent-playbook skills list|lint [--json]
  ai-agent-playbook skills install|update|check|uninstall [--profile core|development|legacy] [--skill name] [--dry-run] [--json]
  ai-agent-playbook skills migrate [--profile development] [--apply] [--dry-run] [--json]
  ai-agent-playbook skills rollback --backup <transaction-directory> [--apply] [--json]
  Destination overrides: --agents-root <directory>, --codex-root <legacy-directory>, --backup-root <directory>

Optional tools:
  ai-agent-playbook mcp [--project <project>] [--with-ast]  (four record tools; --with-ast adds aapb_ast_search)
  ai-agent-playbook ast search [project] --pattern <structural-pattern> --lang javascript|typescript|tsx|jsx|css|html [--path <relative-file-or-directory>] [--max-results N] [--max-chars N] [--max-files N] [--cursor token] [--json]
  ai-agent-playbook writing naturalness-check [project] --path <file> [--lang auto|ko|en] [--engine js|auto|python] [--json]
  ai-agent-playbook writing naturalness-report [project] [--root <directory>] [--max-files N] [--lang auto|ko|en] [--engine js|auto|python] [--json]
  ai-agent-playbook writing fidelity-check [project] --before <file> --after <file> [--lang auto|ko|en] [--json]
  ai-agent-playbook runtime python-status [--json]
  ai-agent-playbook qa ui-genericity-scan [project] [--root <directory>] [--max-files N] [--json]

Reviewed forge coordination:
  ai-agent-playbook forge status [project] [--provider auto|github|gitea] [--json]
  ai-agent-playbook forge bootstrap [project] [--milestone <title>] [--project-title <title>] [--apply] [--json]
  ai-agent-playbook forge sync|reconcile [project] --plan <relative-json> [--apply] [--json]
  --offline, --no-remote, and --remote-read-only forbid remote writes.
  AST and Forge accept --repo <id>; a workspace root requires one selected repository.

All previews are write-free. Apply changes only within the user's authorization.
Execution, supervisors, schedules, automatic Git delivery and duplicate analysis are retired.
Old commands return a pinned 0.5.11 recovery hint; no old runtime is executed automatically.
`;
}
