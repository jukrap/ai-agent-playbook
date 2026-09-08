import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { PassThrough } from 'node:stream';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { prepareBootstrapOptions } from '../src/bootstrap-wizard.mjs';
import { bootstrapProject } from '../src/bootstrap.mjs';
import { treeSnapshot } from '../src/fs-safety.mjs';

const exec = promisify(execFile), repoRoot = fileURLToPath(new URL('../', import.meta.url));
async function fixture(t, withGit = false) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'aapb-bootstrap-wizard-'));
  const target = path.join(root, 'project'), home = path.join(root, 'home'); await mkdir(target); await mkdir(home); await mkdir(path.join(home, 'templates'));
  const environment = { HOME: home, USERPROFILE: home, XDG_CONFIG_HOME: path.join(home, '.config'), GIT_CONFIG_GLOBAL: path.join(home, '.gitconfig'), GIT_CONFIG_SYSTEM: path.join(home, 'system'), GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_COUNT: '0', GIT_TEMPLATE_DIR: path.join(home, 'templates'), GIT_CONFIG_PARAMETERS: undefined, GIT_DIR: undefined, GIT_WORK_TREE: undefined, GIT_INDEX_FILE: undefined, GIT_COMMON_DIR: undefined };
  const original = Object.fromEntries(Object.keys(environment).map((key) => [key, process.env[key]]));
  for (const [key, value] of Object.entries(environment)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
  t.after(async () => {
    for (const [key, value] of Object.entries(original)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
    assert.equal(path.dirname(root), os.tmpdir()); assert.ok(path.basename(root).startsWith('aapb-bootstrap-wizard-'));
    await rm(root, { recursive: true, force: true });
  });
  const git = async (dir, ...args) => exec('git', ['-C', dir, ...args], { encoding: 'utf8', windowsHide: true, timeout: 10000 });
  if (withGit) await git(target, 'init', '--quiet');
  return { root, target, home, options: { target, repoRoot }, git };
}
const silent = () => ({ isTTY: false, write() { throw new Error('Unexpected terminal output'); } });

test('non-TTY and JSON never ask; noninteractive options remain available for parent defaults', async (t) => {
  const f = await fixture(t);
  for (const io of [
    { stdin: { isTTY: false }, stdout: silent() },
    { stdin: { isTTY: false }, stdout: silent(), ask: () => { throw new Error('Non-TTY must not ask implicitly'); } },
    { json: true, ask: () => { throw new Error('Must not ask'); } },
    { interactive: false, ask: () => { throw new Error('Must not ask'); } }
  ]) assert.deepEqual(await prepareBootstrapOptions(f.options, io), f.options);
  await assert.rejects(prepareBootstrapOptions(f.options, { interactive: true, stdin: { isTTY: false }, stdout: silent() }), /workable TTY/);
  await assert.rejects(prepareBootstrapOptions(f.options, { interactive: true, json: true, ask: () => null }), /--json/);
});

test('--yes selects safe standard defaults, honors explicit undefined options and creates no writes', async (t) => {
  const f = await fixture(t);
  const before = await treeSnapshot(f.root);
  const selected = await prepareBootstrapOptions({ ...f.options, kind: undefined, exclude: undefined, records: undefined, lang: undefined, agents: undefined }, { yes: true, ask: () => { throw new Error('Must not ask'); } });
  assert.equal(selected.kind, 'single'); assert.equal(selected.records, 'standard'); assert.equal(selected.exclude, 'none'); assert.equal(selected.agents, 'preserve');
  const workspace = await prepareBootstrapOptions({ ...f.options, kind: 'workspace' }, { yes: true });
  assert.deepEqual(workspace.repositories, []);
  assert.deepEqual(await treeSnapshot(f.root), before);
  await f.git(f.target, 'init', '--quiet');
  assert.equal((await prepareBootstrapOptions(f.options, { yes: true })).exclude, 'local');
  assert.equal((await prepareBootstrapOptions({ ...f.options, exclude: 'none', records: 'minimal', lang: 'ko' }, { yes: true })).records, 'minimal');
});

test('injected wizard asks language first, explains exclusion differences and returns options directly', async (t) => {
  const f = await fixture(t, true), questions = [], before = await treeSnapshot(f.root);
  const answer = { lang: 'ko', kind: 'single', exclude: 'shared', records: 'standard', agents: 'link', review: 'yes' };
  const selected = await prepareBootstrapOptions(f.options, { interactive: true, ask: (question) => { questions.push(question); return answer[question.id]; } });
  assert.deepEqual(questions.map((q) => q.id), ['lang', 'kind', 'exclude', 'records', 'agents', 'review']);
  for (const question of questions.slice(1)) assert.match(question.message, /[가-힣]/);
  const exclude = questions.find((q) => q.id === 'exclude');
  assert.match(exclude.choices.find((c) => c.value === 'global').label, /모든 저장소/);
  assert.match(exclude.choices.find((c) => c.value === 'shared').label, /\.gitignore/);
  assert.equal(selected.lang, 'ko'); assert.equal(selected.exclude, 'shared'); assert.equal(selected.records, 'standard');
  assert.ok(questions.at(-1).review.operations.includes('AGENTS.md'));
  assert.deepEqual(await treeSnapshot(f.root), before);
  await bootstrapProject(selected);
  const manifest = JSON.parse(await readFile(path.join(f.target, '.ai-agent-playbook/manifest.json'), 'utf8'));
  assert.equal(manifest.lang, 'ko');
});

test('cancellation at each question and final review leaves files and Git home identical', async (t) => {
  const f = await fixture(t, true), before = await treeSnapshot(f.root);
  const answer = { lang: 'en', kind: 'single', exclude: 'global', records: 'standard', agents: 'link', review: 'yes' };
  for (const stop of Object.keys(answer)) {
    const output = await prepareBootstrapOptions(f.options, { interactive: true, ask: (question) => question.id === stop ? null : answer[question.id] });
    assert.equal(output, null);
    assert.deepEqual(await treeSnapshot(f.root), before);
  }
  assert.equal(await prepareBootstrapOptions(f.options, { interactive: true, ask: (question) => question.id === 'review' ? 'no' : answer[question.id] }), null);
  assert.deepEqual(await treeSnapshot(f.root), before);
});

test('workspace wizard registers a chosen subset and never silently selects all discovered repositories', async (t) => {
  const f = await fixture(t), questions = [];
  for (const id of ['alpha', 'beta', 'gamma']) {
    const target = path.join(f.target, id); await mkdir(target); await f.git(target, 'init', '--quiet');
  }
  const before = await treeSnapshot(f.root);
  const selected = await prepareBootstrapOptions(f.options, { interactive: true, ask: (question) => {
    questions.push(question);
    return { lang: 'en', kind: 'workspace', repositories: 'alpha,gamma', exclude: 'none', records: 'standard', agents: 'preserve', review: true }[question.id];
  } });
  assert.deepEqual(selected.repositories.map((repo) => repo.id), ['alpha', 'gamma']);
  assert.equal(questions.find((q) => q.id === 'repositories').defaultValue, undefined);
  assert.deepEqual(await treeSnapshot(f.root), before);
  const options = { ...f.options, kind: 'workspace', repositories: [{ id: 'custom', path: 'alpha', role: 'custom' }] };
  const cancelled = await prepareBootstrapOptions(options, { interactive: true, ask: (q) => q.id === 'lang' ? 'en' : q.id === 'kind' ? 'workspace' : null });
  assert.equal(cancelled, null);
});

test('wizard uses existing manifest language/layout, explicit flags remain prompt defaults', async (t) => {
  const f = await fixture(t, true);
  await bootstrapProject({ ...f.options, lang: 'ko', records: 'standard', exclude: 'shared' });
  const questions = [];
  const options = await prepareBootstrapOptions(f.options, { interactive: true, ask: (question) => { questions.push(question); return question.defaultValue; } });
  assert.equal(options.lang, 'ko'); assert.equal(options.records, 'standard'); assert.equal(options.exclude, 'shared');
  assert.match(questions[0].message, /[가-힣]/);
  assert.equal((await prepareBootstrapOptions({ ...f.options, lang: 'en', records: 'minimal' }, { yes: true })).lang, 'en');
});

test('existing workspace selection becomes the wizard default without resetting registered roles', async (t) => {
  const f = await fixture(t), member = path.join(f.target, 'member'); await mkdir(member);
  await f.git(member, 'init', '--quiet');
  const repositories = [{ id: 'member', path: 'member', role: 'API' }];
  await bootstrapProject({ ...f.options, kind: 'workspace', repositories, lang: 'ko' });
  const selected = await prepareBootstrapOptions(f.options, { interactive: true, ask: (question) => question.defaultValue });
  assert.equal(selected.kind, 'workspace'); assert.deepEqual(selected.repositories, repositories); assert.equal(selected.lang, 'ko');
});

test('wizard dry-run selection uses the same engine and retains dryRun at final review', async (t) => {
  const f = await fixture(t), before = await treeSnapshot(f.root);
  let review;
  const selected = await prepareBootstrapOptions({ ...f.options, dryRun: true }, { interactive: true, ask: (q) => { if (q.id === 'review') review = q.review; return q.defaultValue; } });
  assert.equal(review.dryRun, true); assert.equal(selected.dryRun, true);
  assert.equal((await bootstrapProject(selected)).writes, false);
  assert.deepEqual(await treeSnapshot(f.root), before);
});

test('bare TTY uses the built-in readline path and EOF cancels without writes', async (t) => {
  const f = await fixture(t), input = new PassThrough(), output = new PassThrough();
  input.isTTY = true; output.isTTY = true;
  let shown = '', scheduled = false;
  output.on('data', (bytes) => {
    shown += bytes.toString();
    if (!scheduled && shown.includes('Choose the language')) { scheduled = true; setImmediate(() => input.end()); }
  });
  const before = await treeSnapshot(f.root);
  const selected = await prepareBootstrapOptions(f.options, { stdin: input, stdout: output });
  assert.equal(selected, null);
  assert.match(shown, /Choose the language/);
  assert.deepEqual(await treeSnapshot(f.root), before);
  input.destroy(); output.destroy();
});

test('invalid injected selections fail read-only and --interactive rejects ended input', async (t) => {
  const f = await fixture(t), before = await treeSnapshot(f.root);
  await assert.rejects(prepareBootstrapOptions(f.options, { interactive: true, ask: () => 'not-a-language' }), /Invalid lang/);
  const input = new PassThrough(), output = new PassThrough(); input.isTTY = true; output.isTTY = true; input.destroy();
  await assert.rejects(prepareBootstrapOptions(f.options, { interactive: true, stdin: input, stdout: output }), /workable TTY/);
  assert.deepEqual(await treeSnapshot(f.root), before); output.destroy();
});
