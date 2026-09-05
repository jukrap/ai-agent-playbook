import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readJson, safePath, projectRoot } from './fs-safety.mjs';
import { playbookStatus, playbookSearch, playbookRead, playbookValidate, bootstrapRecords, migrateRecords, rollbackRecordMigration } from './records.mjs';
import { PACKAGE_VERSION } from './version.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FLAGS = new Set(['json','help','version','dry-run','apply','local-only','preserve-agents','offline','no-remote','remote-read-only','force-managed','force-unmanaged']);
const VALUES = new Set(['profile','skill','agents-root','codex-root','backup-root','backup','path','query','max-results','max-chars','start-line','end-line','cursor','page-size','view','project','to','before','after','lang','engine','root','max-files','plan','provider','remote','milestone','project-title','project-mode']);
const RETIRED = new Set(['automation','plan','worklog','workflow','reference','index','graph','canon','write-gate','rules','diagnostics','run','source','ast','lsp']);
function parse(argv) {
  const args = [], flags = {}, skills = [];
  for (let i = 0; i < argv.length; i++) {
    const item = argv[i];
    if (!item.startsWith('--')) { args.push(item); continue; }
    const key = item.slice(2);
    if (FLAGS.has(key)) { flags[key] = true; continue; }
    if (!VALUES.has(key)) throw new Error('Unknown option: ' + item);
    if (i + 1 >= argv.length || argv[i + 1].startsWith('--')) throw new Error('Missing value: ' + item);
    const value = argv[++i];
    if (key === 'skill') skills.push(value);
    else if (key in flags) throw new Error('Repeated option: ' + item);
    else flags[key] = value;
  }
  return { args, flags, skills };
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
    if (RETIRED.has(argv[0]) && !argv.includes('--help')) {
      stdout.write(JSON.stringify(retired(argv.slice(0, 2).join(' ')), null, 2) + '\n');
      return 2;
    }
    const { args, flags, skills } = parse(argv);
    if (flags.version) { stdout.write(PACKAGE_VERSION + '\n'); return 0; }
    if (flags.help || !args.length || args[0] === 'help') { stdout.write(help()); return 0; }
    const [command, sub] = args;
    const nested = ['records','skills','migrate','forge','writing','runtime','qa','operator','managed','layout','catalog','contracts'].includes(command) || (command === 'context' && ['list','status','init'].includes(sub));
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
      await runMcpServer({ target: path.resolve(cwd, flags.project ?? args[1] ?? '.') }); return 0;
    } else if (command === 'bootstrap') {
      result = await bootstrapRecords({ target, repoRoot, dryRun: Boolean(flags['dry-run']), localOnly: Boolean(flags['local-only']) });
    } else if (command === 'migrate' && sub === 'rollback') {
      result = await rollbackRecordMigration({ target, backup: flags.backup, apply: Boolean(flags.apply && !flags['dry-run']) });
    } else if (command === 'migrate' && sub === 'layout') {
      if (flags.to && flags.to !== 'minimal') throw new Error('1.0 migrates to minimal layout only; existing structured records remain readable.');
      result = await migrateRecords({ target, apply: Boolean(flags.apply && !flags['dry-run']) });
    } else if ((command === 'records' && sub === 'status') || (command === 'context' && ['list','status'].includes(sub)) || (command === 'layout' && sub === 'status') || (command === 'managed' && sub === 'catalog')) {
      result = await playbookStatus({ target, view: flags.view, cursor: flags.cursor, pageSize: flags['page-size'], maxChars: flags['max-chars'] });
    } else if ((command === 'records' && sub === 'read') || (command === 'context' && !['init','list','status'].includes(sub))) {
      result = await playbookRead({ target, path: flags.path, startLine: flags['start-line'], endLine: flags['end-line'], cursor: flags.cursor, maxChars: flags['max-chars'] });
    } else if ((command === 'records' && sub === 'search') || (command === 'operator' && sub === 'search')) {
      result = await playbookSearch({ target, query: flags.query, view: flags.view, cursor: flags.cursor, maxResults: flags['max-results'], maxChars: flags['max-chars'] });
    } else if (command === 'doctor' || (command === 'records' && sub === 'validate') || (command === 'managed' && sub === 'check') || (command === 'operator' && ['check','audit'].includes(sub)) || (command === 'contracts' && sub === 'check')) {
      result = await playbookValidate({ target, view: flags.view, cursor: flags.cursor, pageSize: flags['page-size'], maxChars: flags['max-chars'] });
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
    } else throw new Error('Unknown command. Run aapb --help.');
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
async function forgeCommand({ target, command, flags }) {
  const root = await projectRoot(target);
  const forge = await import('./forge/index.mjs');
  let remoteUrl = null;
  try { remoteUrl = (await promisify(execFile)('git', ['-C', root, 'remote', 'get-url', flags.remote ?? 'origin'], { encoding: 'utf8' })).stdout.trim(); } catch {}
  const status = forge.inspectForgeStatus({ remoteUrl, provider: flags.provider, profile: flags.profile ?? 'coordinate', noRemote: flags['no-remote'], offline: flags.offline, remoteReadOnly: flags['remote-read-only'] });
  if (command === 'status') return status;
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
function help() {
  return `AI Agent Playbook ${PACKAGE_VERSION}

Project records:
  aapb bootstrap <project> [--local-only] [--preserve-agents] [--dry-run]
  aapb records status <project> [--view summary|records|warnings] [--page-size N] [--cursor token] [--json]
  aapb records validate <project> [--view summary|issues|warnings] [--page-size N] [--cursor token] [--json]
  aapb records read <project> [--path CURRENT.md] [--start-line N] [--end-line N] [--max-chars N] [--cursor token] [--json]
  aapb records search <project> --query <literal> [--max-results N] [--max-chars N] [--cursor token] [--json]
  aapb migrate layout <project> --to minimal [--apply] [--json]
  aapb migrate rollback <project> --backup <playbook-relative-backup> [--apply] [--json]

Skills (default destination: .agents/skills):
  aapb skills list|lint [--json]
  aapb skills install|update|check|uninstall [--profile core|development|legacy] [--skill name] [--dry-run] [--json]
  aapb skills migrate [--profile development] [--apply] [--dry-run] [--json]
  aapb skills rollback --backup <transaction-directory> [--apply] [--json]
  Destination overrides: --agents-root <directory>, --codex-root <legacy-directory>, --backup-root <directory>

Optional tools:
  aapb mcp [--project <project>]  (aapb_status/search/read/validate; never registered automatically)
  aapb writing naturalness-check <project> --path <file> [--lang auto|ko|en] [--engine js|auto|python] [--json]
  aapb writing naturalness-report <project> [--root <directory>] [--max-files N] [--lang auto|ko|en] [--engine js|auto|python] [--json]
  aapb writing fidelity-check <project> --before <file> --after <file> [--lang auto|ko|en] [--json]
  aapb runtime python-status [--json]
  aapb qa ui-genericity-scan <project> [--root <directory>] [--max-files N] [--json]

Reviewed forge coordination:
  aapb forge status <project> [--provider auto|github|gitea] [--json]
  aapb forge bootstrap <project> [--milestone <title>] [--project-title <title>] [--apply] [--json]
  aapb forge sync|reconcile <project> --plan <relative-json> [--apply] [--json]
  --offline, --no-remote, and --remote-read-only forbid remote writes.

All previews are write-free. Apply changes only within the user's authorization.
Execution, supervisors, schedules, automatic Git delivery and duplicate analysis are retired.
Old commands return a pinned 0.5.11 recovery hint; no old runtime is executed automatically.
`;
}
