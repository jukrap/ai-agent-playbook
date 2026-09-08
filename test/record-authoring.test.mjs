import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm, symlink, readdir, stat } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createWorklog, listWorklogs, createKnowledge, parseRecordMetadata, classifyRecordPath } from '../src/record-authoring.mjs';
import { createWorkspaceConfig } from '../src/workspace.mjs';
import { inside, treeSnapshot } from '../src/fs-safety.mjs';
import { MAX_MCP_RESULT_BYTES, toolResult } from '../src/record-paging.mjs';

async function fixture(t, playbookName = '.ai-agent-playbook', initialized = true) {
  const target = await mkdtemp(path.join(os.tmpdir(), 'aapb-authoring-'));
  t.after(async () => {
    assert.equal(path.dirname(target), os.tmpdir());
    assert.match(path.basename(target), /^aapb-authoring-/);
    await rm(target, { recursive: true, force: true });
  });
  const directory = path.join(target, playbookName);
  if (initialized) await mkdir(directory);
  return { target, directory };
}

async function put(directory, relative, content) {
  const file = path.join(directory, relative);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, content);
  return file;
}

async function workspaceFixture(t) {
  const data = await fixture(t);
  const repositories = Array.from({ length: 12 }, (_, index) => ({ id: `repo-${index + 1}`, path: `repos/component-${index + 1}`, role: 'fixture member' }));
  for (const member of repositories) await mkdir(path.join(data.target, member.path, 'src/deep'), { recursive: true });
  await put(data.directory, 'workspace.json', JSON.stringify(createWorkspaceConfig(repositories)) + '\n');
  return { ...data, repositories };
}

const metadata = (overrides = {}) => ({ kind: 'worklog', id: 'fixture-id', createdAt: '2026-09-08T12:34:56.789Z', repos: ['repo-1'], topic: 'API 0.5.11', ...overrides });
const comment = (data) => '<!-- aapb-record ' + JSON.stringify(data) + ' -->';
const wireBytes = (value) => Buffer.byteLength(JSON.stringify(toolResult(value)), 'utf8');
function sections(content) {
  return Object.fromEntries([...content.matchAll(/^## ([^\n]+)\n([\s\S]*?)(?=^## |$(?![\s\S]))/gm)].map((match) => [match[1], match[2].trim()]));
}

test('metadata parsing preserves literal values, stays bounded, and ignores body examples', () => {
  const value = metadata({ topic: 'API 0.5.11 / retry=3 / unknown / e\u0301 / 한글' });
  assert.deepEqual(parseRecordMetadata(comment(value) + '\n# Title\n'), value);
  assert.deepEqual(parseRecordMetadata('\uFEFF# Existing title\r\n\r\n' + comment(value)), value);
  assert.equal(parseRecordMetadata('# Old log\nNo metadata\n'), null);
  assert.equal(parseRecordMetadata('# Old log\n\nExample:\n' + comment(value)), null);
  assert.equal(parseRecordMetadata(' '.repeat(16_384) + comment(value)), null);
  assert.equal(parseRecordMetadata('```md\n' + comment(value) + '\n```'), null);
  assert.equal(parseRecordMetadata(null), null);
  assert.equal(parseRecordMetadata('<!-- aapb-record {broken} -->'), null);
  for (const invalid of [
    { kind: 'summary' }, { id: '' }, { id: 'x'.repeat(129) }, { createdAt: '2026-02-30T12:00:00Z' },
    { createdAt: '2026-09-08T24:00:00Z' }, { repos: ['../outside'] }, { repos: ['repo-1', 'repo-1'] },
    { repos: 'repo-1' }, { topic: 'line\nbreak' }, { topic: 'x'.repeat(501) }, { topic: null }
  ]) assert.equal(parseRecordMetadata(comment(metadata(invalid))), null);
  assert.deepEqual(parseRecordMetadata(comment({ ...value, irrelevant: 'ignored' })), value);
});

test('path classification covers legacy and current records without indexing summaries or unsafe paths', () => {
  for (const relative of ['worklogs/2026-09/2026-09-08-note.md', 'workflows/worklogs/old.MD', 'worklogs\\2026-09\\log.md']) {
    assert.equal(classifyRecordPath(relative), 'worklog');
  }
  assert.equal(classifyRecordPath('knowledge/api-contract.md'), 'knowledge');
  for (const relative of ['CURRENT.md', 'custom/log.md', 'worklogs/README.md', 'worklogs/README.ko.md',
    'worklogs/index.md', 'workflows/worklogs/summaries/2026-09.md', 'worklogs/2026-09-summary.md',
    'worklogs/summary-2026-09.md', 'knowledge/README.md', 'worklogs/file.json', '../worklogs/log.md', '/worklogs/log.md',
    'worklogs/../../escape.md', 'worklogs/log.md:stream']) assert.equal(classifyRecordPath(relative), null);
});

test('Git-independent creation preserves literals and creates editable drafts without ownership changes', async (t) => {
  const { target, directory } = await fixture(t);
  const originalMarker = '{"source":"ai-agent-playbook","files":{"manifest.json":"preserved-hash"}}\r\n';
  const manifest = '{"schemaVersion":"2","layoutKind":"minimal"}\r\n';
  await put(directory, '.ai-agent-playbook-install.json', originalMarker);
  await put(directory, 'manifest.json', manifest);
  await put(directory, 'CURRENT.md', '# User state\r\nKeep exact values.\r\n');
  const originalCurrent = await readFile(path.join(directory, 'CURRENT.md'));
  const title = 'API 0.5.11: retry=3 / 아직 미확인 $& $` $\' e\u0301';
  const topic = '원문 --> <tag> $& {{title}}';
  const beforeTime = Date.now();
  const result = await createWorklog({ target, title, topic, date: '2024-02-29' });
  assert.equal(result.writes, true);
  assert.equal(result.applied, true);
  assert.equal(result.userEditable, true);
  assert.match(result.path, /^worklogs\/2024-02\/2024-02-29-\d{2}-\d{2}-\d{2}\.\d{3}-[0-9a-f-]{36}-/);
  assert.ok(inside(directory, path.resolve(directory, result.path)));
  assert.ok(result.content.includes('# ' + title + '\n'));
  assert.ok(Date.parse(result.metadata.createdAt) >= beforeTime);
  assert.deepEqual(result.metadata.repos, []);
  assert.equal(result.metadata.topic, topic);
  assert.deepEqual(parseRecordMetadata(result.content), result.metadata);
  assert.equal((result.content.split('\n')[0].match(/-->/g) ?? []).length, 1);
  assert.doesNotMatch(result.content, /\{\{metadata\}\}/);
  assert.match(sections(result.content).Verification, /status: unrun/);
  assert.match(sections(result.content).Decision, /status: pending/);
  assert.equal(await readFile(path.join(directory, result.path), 'utf8'), result.content);
  assert.equal(await readFile(path.join(directory, '.ai-agent-playbook-install.json'), 'utf8'), originalMarker);
  assert.equal(await readFile(path.join(directory, 'manifest.json'), 'utf8'), manifest);
  assert.deepEqual(await readFile(path.join(directory, 'CURRENT.md')), originalCurrent);
  await writeFile(path.join(directory, result.path), result.content + '\nUser review: outcome remains unknown.\n');
  assert.equal((await listWorklogs({ target, month: '2024-02' })).items[0].title, title);
});

test('all English and Korean drafts preserve three fact packets without upgrading their evidence status', async (t) => {
  const { target, directory } = await fixture(t);
  const packets = [
    'API 0.5.11; maxRetries=3; command npm test; result unknown',
    'locator src/api.mjs:42; timeout 1500ms; p95 12.70; invocation not checked',
    '원문 e\u0301: version 1.2.0; loading 성공; application behavior 미확인; $&'
  ];
  for (const lang of ['en', 'ko']) {
    for (const create of [createWorklog, createKnowledge]) {
      for (const title of packets) {
        const result = await create({ target, title, topic: title, lang, dryRun: true });
        assert.ok(result.content.includes('# ' + title + '\n'));
        assert.equal(parseRecordMetadata(result.content).topic, title);
        assert.match(result.content, lang === 'en' ? /Status: draft/ : /상태: 초안/);
        assert.match(sections(result.content)[lang === 'en' ? 'Verification' : '검증'], lang === 'en' ? /unrun|unverified/ : /미실행|미검증/);
      }
    }
  }
  assert.deepEqual(await readdir(directory), []);
});

test('worklog results and knowledge rule history have distinct authoring contracts in both languages', async (t) => {
  const { target } = await fixture(t);
  for (const lang of ['en', 'ko']) {
    const worklog = sections((await createWorklog({ target, title: 'Draft result', lang, dryRun: true })).content);
    const changes = worklog[lang === 'en' ? 'Changes' : '변경 결과'];
    assert.match(changes, lang === 'en' ? /Outcome: unknown/ : /결과: 미확인/);
    assert.match(changes, lang === 'en' ? /actual changes.*resulting behavior/s : /실제 변경 사항.*변경 후 동작/s);
    assert.match(changes, lang === 'en' ? /unfinished.*evidence/s : /미완료.*근거/s);

    const knowledge = sections((await createKnowledge({ target, title: 'Draft rule', lang, dryRun: true })).content);
    const rule = knowledge[lang === 'en' ? 'Current rule' : '현재 규칙·용어'];
    assert.match(rule, lang === 'en' ? /proposed.*review/s : /제안.*검토/s);
    assert.match(rule, lang === 'en' ? /terms.*source vocabulary/s : /출처의 어휘.*용어/s);
    const scope = knowledge[lang === 'en' ? 'Applicability & exceptions' : '적용 범위·예외'];
    assert.match(scope, lang === 'en' ? /versions.*preconditions/s : /버전.*사전 조건/s);
    assert.match(scope, lang === 'en' ? /exceptions.*counterexamples/s : /예외.*반례/s);
    const evidence = knowledge[lang === 'en' ? 'Evidence and checked date' : '근거와 확인일'];
    assert.match(evidence, lang === 'en' ? /Last checked: unknown/ : /마지막 확인일: 미확인/);
    assert.match(evidence, /YYYY-MM-DD/);
    assert.match(evidence, /createdAt/);
    assert.doesNotMatch(evidence, /\b\d{4}-\d{2}-\d{2}\b/);
    const history = knowledge[lang === 'en' ? 'Change history' : '변경 이력'];
    assert.match(history, lang === 'en' ? /previous and current rule.*reason/s : /이전 규칙과 현재 규칙.*이유/s);
    assert.match(history, lang === 'en' ? /relative Markdown link.*worklog or decision/s : /작업 로그나 결정 기록.*상대 경로.*Markdown 링크/s);
    assert.match(history, lang === 'en' ? /Preserve earlier entries/ : /이전 항목을 보존/);
    for (const heading of lang === 'en' ? ['Verification', 'Unknown', 'Next action'] : ['검증', '미확인 사항', '다음 행동']) assert.ok(knowledge[heading]);
  }
});

test('unbootstrapped authoring rejects even in dry-run, and previews never change existing records', async (t) => {
  const { target, directory } = await fixture(t, '.ai-agent-playbook', false);
  const before = await treeSnapshot(target);
  for (const create of [createWorklog, createKnowledge]) {
    for (const dryRun of [false, true]) await assert.rejects(create({ target, title: 'Draft preview', dryRun }), /bootstrap explicitly/);
    assert.deepEqual(await treeSnapshot(target), before);
  }
  const listing = await listWorklogs({ target });
  assert.equal(listing.exists, false);
  assert.deepEqual(listing.items, []);
  assert.deepEqual(await treeSnapshot(target), before);
  await put(directory, 'manifest.json', '{}\n');
  const bootstrapped = await treeSnapshot(target);
  for (const create of [createWorklog, createKnowledge]) {
    const preview = await create({ target, title: 'Draft preview', dryRun: true });
    assert.equal(preview.writes, false);
    assert.equal(preview.applied, false);
    assert.equal(preview.dryRun, true);
    assert.ok(preview.content.length > 500);
    assert.deepEqual(await treeSnapshot(target), bootstrapped);
  }
  await put(directory, 'manifest.json', '{"recordPaths":{"worklogs":"custom/history"}}\n');
  const existing = await treeSnapshot(target);
  const preview = await createWorklog({ target, title: 'Preview custom path', dryRun: true });
  assert.match(preview.path, /^custom\/history\//);
  assert.deepEqual(await treeSnapshot(target), existing);
});

test('new drafts use the manifest language, explicit overrides, and English when no preference exists', async (t) => {
  const { target, directory } = await fixture(t);
  for (const preference of [{ lang: 'ko' }, { language: 'ko' }]) {
    await put(directory, 'manifest.json', JSON.stringify(preference) + '\n');
    const before = await treeSnapshot(target);
    for (const create of [createWorklog, createKnowledge]) {
      const korean = await create({ target, title: 'Language selection', dryRun: true });
      assert.equal(korean.lang, 'ko');
      assert.match(korean.content, /## 미확인 사항/);
      const english = await create({ target, title: 'Language selection', lang: 'en', dryRun: true });
      assert.equal(english.lang, 'en');
      assert.match(english.content, /## Unknown/);
    }
    assert.deepEqual(await treeSnapshot(target), before);
  }
  await put(directory, 'manifest.json', '{}\n');
  assert.equal((await createWorklog({ target, title: 'Default', dryRun: true })).lang, 'en');
  await put(directory, 'manifest.json', '{"lang":"unsupported"}\n');
  await assert.rejects(createKnowledge({ target, title: 'Invalid default', dryRun: true }), /Manifest language/);
  assert.equal((await createKnowledge({ target, title: 'Explicit override', lang: 'ko', dryRun: true })).lang, 'ko');
});

test('same-day repeated and concurrent worklogs have unique filenames and complete exclusive writes', async (t) => {
  const { target, directory } = await fixture(t);
  const options = { target, title: 'Summary of API checks', topic: 'API', date: '2026-09-08' };
  const results = [await createWorklog(options), await createWorklog(options),
    ...await Promise.all(Array.from({ length: 24 }, () => createWorklog(options)))];
  assert.equal(new Set(results.map((result) => result.path)).size, 26);
  assert.equal(new Set(results.map((result) => result.metadata.id)).size, 26);
  for (const result of results) {
    const content = await readFile(path.join(directory, result.path), 'utf8');
    assert.equal(content, result.content);
    assert.deepEqual(parseRecordMetadata(content), result.metadata);
    assert.equal(classifyRecordPath(result.path), 'worklog');
  }
  const listed = await listWorklogs({ target, pageSize: 100 });
  assert.equal(listed.items.length, 26);
  assert.equal(listed.scan.complete, true);
});

test('legacy worklogs stay in place and a safe manifest path takes precedence without hiding old logs', async (t) => {
  const { target, directory } = await fixture(t, '.ai-playbook');
  const oldBody = '# Original legacy log\r\n\r\nExact version 0.5.11.\r\n';
  await put(directory, 'workflows/worklogs/2025-01-02-old.md', oldBody);
  await put(directory, 'worklogs/2025-02-03-newer.md', '# Other historical location\n');
  await put(directory, 'workflows/worklogs/README.md', '# Index\n');
  await put(directory, 'workflows/worklogs/summaries/2025-01.md', '# Monthly summary\n');
  const legacy = await createWorklog({ target, title: 'Continue here', date: '2026-09-08' });
  assert.equal(legacy.playbook, '.ai-playbook');
  assert.match(legacy.path, /^workflows\/worklogs\/2026-09\//);
  await put(directory, 'manifest.json', '{"recordPaths":{"worklogs":"history/daily"}}\n');
  const current = await createWorklog({ target, title: 'Configured location', date: '2026-09-09' });
  assert.match(current.path, /^history\/daily\/2026-09\//);
  assert.equal(await readFile(path.join(directory, 'workflows/worklogs/2025-01-02-old.md'), 'utf8'), oldBody);
  const listing = await listWorklogs({ target, pageSize: 100 });
  assert.equal(listing.items.length, 4);
  const old = listing.items.find((item) => item.title === 'Original legacy log');
  assert.deepEqual({ month: old.month, repos: old.repos, topic: old.topic, id: old.id, legacy: old.legacy },
    { month: '2025-01', repos: [], topic: null, id: null, legacy: true });
  assert.equal((await listWorklogs({ target, month: '2025-01' })).items.length, 1);
  await put(directory, 'manifest.json', '{"recordPaths":{"worklogs":"workflows"}}\n');
  const overlapping = await listWorklogs({ target, pageSize: 100 });
  assert.equal(new Set(overlapping.items.map((item) => item.path)).size, overlapping.items.length);
});

test('knowledge uses a stable topic slug and concurrent duplicates never overwrite user content', async (t) => {
  const { target, directory } = await fixture(t);
  const options = { target, title: 'API decision', topic: 'API Contract' };
  const attempts = await Promise.allSettled(Array.from({ length: 12 }, () => createKnowledge(options)));
  const successes = attempts.filter((result) => result.status === 'fulfilled');
  assert.equal(successes.length, 1);
  assert.equal(successes[0].value.path, 'knowledge/api-contract.md');
  for (const rejected of attempts.filter((result) => result.status === 'rejected')) assert.match(rejected.reason.message, /already exists/);
  const file = path.join(directory, successes[0].value.path);
  const edited = '# User-owned revision\r\nKeep this text.\r\n';
  await writeFile(file, edited);
  const before = await treeSnapshot(target);
  for (const dryRun of [false, true]) await assert.rejects(createKnowledge({ ...options, title: 'Different title', topic: 'api contract', dryRun }), /already exists/);
  assert.equal(await readFile(file, 'utf8'), edited);
  assert.deepEqual(await treeSnapshot(target), before);
  const fallback = await createKnowledge({ target, title: 'Standalone topic' });
  assert.equal(fallback.path, 'knowledge/standalone-topic.md');
  assert.equal(fallback.metadata.topic, 'Standalone topic');
  assert.equal(fallback.metadata.kind, 'knowledge');
});

test('12-member workspace infers the current member, validates explicit IDs, and filters exact metadata', async (t) => {
  const { target, directory, repositories } = await workspaceFixture(t);
  for (const [index, member] of repositories.entries()) {
    const result = await createWorklog({ target: path.join(target, member.path, 'src/deep'), title: `Work for ${member.id}`,
      topic: index % 2 ? 'API' : 'api', date: index % 2 ? '2026-09-08' : '2026-08-31' });
    assert.deepEqual(result.metadata.repos, [member.id]);
    assert.equal(await readFile(path.join(directory, result.path), 'utf8'), result.content);
  }
  const unfiltered = await listWorklogs({ target: path.join(target, repositories[0].path), pageSize: 100 });
  assert.equal(unfiltered.items.length, 12);
  const filtered = await listWorklogs({ target, repo: 'repo-12', topic: 'API', month: '2026-09' });
  assert.equal(filtered.items.length, 1);
  assert.equal(filtered.items[0].title, 'Work for repo-12');
  assert.equal((await listWorklogs({ target, repo: 'repo-12', topic: 'api' })).items.length, 0);
  const explicit = await createKnowledge({ target: path.join(target, repositories[0].path), title: 'Cross repo note', repo: 'repo-12' });
  assert.deepEqual(explicit.metadata.repos, ['repo-12']);
  const shared = await createWorklog({ target, title: 'Workspace-wide note' });
  assert.deepEqual(shared.metadata.repos, []);
  const before = await treeSnapshot(target);
  for (const repo of ['unknown', '../repo-1', 'REPO-1', '', ['repo-1']]) {
    await assert.rejects(createWorklog({ target, title: 'Rejected', repo }), /registered/);
    await assert.rejects(createKnowledge({ target, title: 'Rejected', repo }), /registered/);
    await assert.rejects(listWorklogs({ target, repo }), /registered/);
  }
  const unrelated = path.join(target, 'unregistered');
  await mkdir(unrelated);
  await assert.rejects(createWorklog({ target: unrelated, title: 'Rejected', repo: 'repo-1' }), /registered/);
  assert.deepEqual(await treeSnapshot(target), before);
});

test('explicit repo recordSource preserves and continues that member’s legacy local records', async (t) => {
  const { target, repositories } = await workspaceFixture(t);
  const memberRoot = path.join(target, repositories[2].path), local = path.join(memberRoot, '.ai-playbook');
  await put(local, 'workflows/worklogs/2020-01-02-old.md', '# Local history\n');
  const contextTarget = path.join(target, repositories[0].path, 'src');
  assert.equal((await listWorklogs({ target: contextTarget })).items.length, 0);
  const result = await createWorklog({ target: contextTarget, recordSource: 'repo:repo-3', title: 'Local follow-up' });
  assert.deepEqual(result.metadata.repos, ['repo-3']);
  assert.equal(result.playbook, '.ai-playbook');
  assert.match(result.path, /^workflows\/worklogs\//);
  assert.equal(await readFile(path.join(local, result.path), 'utf8'), result.content);
  assert.equal((await listWorklogs({ target, recordSource: 'repo:repo-3' })).items.length, 2);
  assert.equal((await listWorklogs({ target })).items.length, 0);
  await assert.rejects(createWorklog({ target, recordSource: 'repo:unknown', title: 'Rejected' }), /Unknown|registered/);
});

test('dangerous title literals never become executable or escaping paths; invalid input does not write', async (t) => {
  const { target, directory } = await fixture(t);
  for (const title of ['../../outside', 'C:\\private\\escape.md:stream', 'CON', 'NUL', 'README', 'summary',
    '../$(touch injected); $& <tag> | * ? "', '😀', '한글'.repeat(160), 'E\u0301cole']) {
    const result = await createKnowledge({ target, title, dryRun: true });
    assert.ok(inside(directory, path.resolve(directory, result.path)));
    assert.match(result.path, /^knowledge\/[\p{L}\p{M}\p{N}-]+\.md$/u);
    assert.ok(Buffer.byteLength(path.posix.basename(result.path), 'utf8') <= 83);
    assert.ok(result.content.includes('# ' + title + '\n'));
  }
  for (const title of ['', ' ', null, 42, 'x'.repeat(501), 'bad\nheading', 'bad\rheading', 'bad\0name', '\ud800', 'bad\u2028line', 'bad\u202eorder']) {
    await assert.rejects(createWorklog({ target, title }), /title/);
  }
  for (const date of ['2026-02-29', '2026-13-01', '../outside', '2026-09-08T12:00:00Z', '2026-9-8']) {
    await assert.rejects(createWorklog({ target, title: 'Bad date', date }), /date/);
  }
  await assert.rejects(createWorklog({ target, title: 'Bad lang', lang: 'fr' }), /lang/);
  await assert.rejects(createWorklog({ target, title: 'Bad topic', topic: 'bad\nvalue' }), /topic/);
  await assert.rejects(createKnowledge({ target, title: 'Bad preview', dryRun: 'false' }), /dryRun/);
  await assert.rejects(createKnowledge({ target, title: 'No membership', repo: 'repo-1' }), /registered/);
  assert.deepEqual(await readdir(directory), []);
});

test('unsafe manifest paths, links, junctions and non-directory destinations cannot receive records', async (t) => {
  const { target, directory } = await fixture(t), outside = await fixture(t);
  await put(outside.target, 'private.md', '# Private data\n');
  const outsideBefore = await treeSnapshot(outside.target);
  for (const destination of ['../outside', '/absolute', 'C:/private', 'worklogs/file:stream', 'worklogs/CON', 'worklogs/..',
    'worklogs/trailing.', 'worklogs/trailing ', 'worklogs/*.md', '.git/history', 'worklogs/summaries', 'worklogs/']) {
    await put(directory, 'manifest.json', JSON.stringify({ recordPaths: { worklogs: destination } }));
    const before = await treeSnapshot(target);
    for (const dryRun of [true, false]) await assert.rejects(createWorklog({ target, title: 'Unsafe', dryRun }), /relative|Unsafe|escapes/);
    await assert.rejects(listWorklogs({ target }), /relative|Unsafe|escapes/);
    assert.deepEqual(await treeSnapshot(target), before);
  }
  await put(directory, 'manifest.json', '{"recordPaths":{"worklogs":"linked"}}\n');
  await symlink(outside.target, path.join(directory, 'linked'), process.platform === 'win32' ? 'junction' : 'dir');
  await assert.rejects(createWorklog({ target, title: 'No escape' }), /link|junction/);
  await assert.rejects(listWorklogs({ target }), /link|junction/);
  await put(directory, 'manifest.json', '{}\n');
  await symlink(outside.target, path.join(directory, 'knowledge'), process.platform === 'win32' ? 'junction' : 'dir');
  await assert.rejects(createKnowledge({ target, title: 'No escape' }), /link|junction/);
  await put(directory, 'worklogs', 'not a directory');
  await assert.rejects(createWorklog({ target, title: 'Not a directory' }), /not a directory/);
  assert.deepEqual(await treeSnapshot(outside.target), outsideBefore);
});

test('listing pages are deterministic, bounded, non-mutating, and invalidate stale or foreign cursors', async (t) => {
  const { target, directory } = await fixture(t), foreign = await fixture(t);
  for (const name of ['z', 'a', 'm', 'c', 'b']) {
    await put(directory, `worklogs/2026-09/2026-09-08-${name}.md`, comment(metadata({ id: name })) + `\n# ${name} 한글😀\n`);
  }
  const before = await treeSnapshot(target), collected = [];
  let cursor;
  do {
    const result = await listWorklogs({ target, pageSize: 2, cursor });
    assert.equal(result.page.totalItems, 5);
    assert.ok(wireBytes(result) <= MAX_MCP_RESULT_BYTES);
    assert.equal(result.scan.complete, true);
    assert.equal(result.writes, false);
    collected.push(...result.items.map((item) => item.path));
    cursor = result.page.nextCursor ?? undefined;
  } while (cursor);
  assert.deepEqual(collected, [...collected].sort());
  assert.equal(new Set(collected).size, 5);
  assert.deepEqual(await treeSnapshot(target), before);
  const first = await listWorklogs({ target, pageSize: 1 });
  assert.deepEqual(await listWorklogs({ target, pageSize: 1 }), first);
  await assert.rejects(listWorklogs({ target, cursor: first.page.nextCursor, topic: 'changed' }), /Cursor/);
  await assert.rejects(listWorklogs({ target: foreign.target, cursor: first.page.nextCursor }), /Cursor/);
  await assert.rejects(listWorklogs({ target, maxChars: 1 }), /complete item/);
  for (const args of [{ pageSize: 0 }, { pageSize: 101 }, { maxChars: 100001 }, { month: '2026-13' }, { cursor: '%%%bad' }]) {
    await assert.rejects(listWorklogs({ target, ...args }), /limit|month|Cursor/);
  }
  await writeFile(path.join(directory, collected[0]), '# Changed heading\n');
  await assert.rejects(listWorklogs({ target, cursor: first.page.nextCursor }), /Cursor/);
  const second = await listWorklogs({ target, pageSize: 1 });
  await put(directory, 'worklogs/new.md', '# New file\n');
  await assert.rejects(listWorklogs({ target, cursor: second.page.nextCursor }), /Cursor/);
});

test('listing handles old headings and malformed metadata without inventing repositories or topics', async (t) => {
  const { target, directory } = await fixture(t);
  await put(directory, 'worklogs/2026-09/untagged.md', '\uFEFF# Legacy heading\r\nAPI topic repo-1\r\n');
  await put(directory, 'worklogs/no-heading.md', 'No heading; topic API\n');
  await put(directory, 'worklogs/bad-metadata.md', '<!-- aapb-record {broken} -->\n# Editable old record\n');
  await put(directory, 'worklogs/not-a-worklog.md', comment(metadata({ kind: 'knowledge' })) + '\n# Other kind\n');
  const result = await listWorklogs({ target });
  assert.equal(result.items.length, 3);
  assert.ok(result.items.every((item) => item.legacy && item.repos.length === 0 && item.topic === null));
  assert.equal(result.items.find((item) => item.title === 'Legacy heading').month, '2026-09');
  assert.ok(result.items.some((item) => item.title === 'no-heading'));
  assert.equal(result.scan.complete, false);
  assert.equal(result.warnings.sample[0].code, 'invalid-metadata');
  assert.equal((await listWorklogs({ target, topic: 'API' })).items.length, 0);
});

test('listing reads bounded UTF-8 headers from large logs and never returns their body', async (t) => {
  const { target, directory } = await fixture(t);
  const head = comment(metadata()) + '\n# Large log\n';
  const content = head + 'x'.repeat(16_383 - Buffer.byteLength(head)) + '😀' + 'secret body '.repeat(100_000);
  const file = await put(directory, 'worklogs/large.md', content);
  const result = await listWorklogs({ target });
  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].title, 'Large log');
  assert.equal(result.scan.complete, true);
  assert.equal(result.scan.inspectedBytes, result.scan.limits.headerBytes);
  assert.equal(result.scan.headerOnly, true);
  assert.ok((await stat(file)).size > result.scan.inspectedBytes);
  assert.doesNotMatch(JSON.stringify(result), /secret body/);
});

test('listing exposes skipped links and invalid text within the response metadata budget', async (t) => {
  const { target, directory } = await fixture(t), outside = await fixture(t);
  await put(outside.target, 'private.md', '# Private\n');
  await put(directory, 'worklogs/visible.md', '# Visible\n');
  await put(directory, 'worklogs/binary.md', Buffer.from([0, 1, 2]));
  await put(directory, 'worklogs/invalid.md', Buffer.from([0xff]));
  for (let index = 0; index < 5; index++) {
    await symlink(outside.target, path.join(directory, `worklogs/linked-${index}`), process.platform === 'win32' ? 'junction' : 'dir');
  }
  const result = await listWorklogs({ target });
  assert.deepEqual(result.items.map((item) => item.title), ['Visible']);
  assert.equal(result.scan.complete, false);
  assert.equal(result.warnings.total, 7);
  assert.equal(result.warnings.sample.length, 3);
  assert.equal(result.warnings.hasMore, true);
  assert.ok(wireBytes(result) <= MAX_MCP_RESULT_BYTES);
});

test('oversized directories report bounded incomplete scans instead of an arbitrary subset', async (t) => {
  const { target, directory } = await fixture(t);
  const logs = path.join(directory, 'worklogs');
  await mkdir(logs, { recursive: true });
  for (let batch = 0; batch < 21; batch++) {
    await Promise.all(Array.from({ length: batch === 20 ? 1 : 100 }, (_, index) => writeFile(path.join(logs, `${batch * 100 + index}.md`), '# Log\n')));
  }
  const result = await listWorklogs({ target });
  assert.equal(result.items.length, 0);
  assert.equal(result.scan.complete, false);
  assert.equal(result.scan.visitedEntries, result.scan.limits.entries);
  assert.equal(result.scan.inspectedBytes, 0);
  assert.equal(result.warnings.sample[0].code, 'traversal-limit');
  assert.deepEqual(await listWorklogs({ target }), result);
});

test('aggregate header budget also counts unreadable text and cannot claim a complete scan', async (t) => {
  const { target, directory } = await fixture(t);
  const logs = path.join(directory, 'worklogs');
  await mkdir(logs, { recursive: true });
  for (let batch = 0; batch < 5; batch++) {
    await Promise.all(Array.from({ length: 100 }, (_, index) => writeFile(path.join(logs, `${batch * 100 + index}.md`), Buffer.alloc(16_384))));
  }
  const result = await listWorklogs({ target });
  assert.equal(result.items.length, 0);
  assert.equal(result.scan.complete, false);
  assert.equal(result.scan.inspectedBytes, result.scan.limits.textBytes);
  assert.ok(result.warnings.total > 3);
  assert.ok(wireBytes(result) <= MAX_MCP_RESULT_BYTES);
});

test('English and Korean templates are shipped at the module-relative paths', async () => {
  for (const kind of ['worklog', 'knowledge']) {
    for (const relative of [`../templates/record-artifacts/${kind}.md`, `../translations/ko/templates/record-artifacts/${kind}.ko.md`]) {
      const content = await readFile(fileURLToPath(new URL(relative, import.meta.url)), 'utf8');
      assert.equal(content.split('\n')[0], '{{metadata}}');
      assert.equal((content.match(/\{\{title\}\}/g) ?? []).length, 1);
    }
  }
});
