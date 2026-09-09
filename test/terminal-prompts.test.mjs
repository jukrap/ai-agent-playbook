import test from 'node:test';
import assert from 'node:assert/strict';
import { PassThrough, Writable } from 'node:stream';
import { setImmediate as tick } from 'node:timers/promises';
import { stripVTControlCharacters } from 'node:util';
import { createTerminalPrompter, PROMPT_BACK, PROMPT_RESCAN } from '../src/terminal-prompts.mjs';

class FakeTTY extends Writable {
  constructor() { super(); this.isTTY = true; this.columns = 100; this.rows = 24; this.chunks = []; }
  _write(chunk, encoding, callback) { this.chunks.push(chunk.toString()); callback(); }
  get text() { return this.chunks.join(''); }
  get frame() { return this.chunks.findLast((chunk) => /^q (cancel|취소)/.test(chunk)) ?? ''; }
}
const down = '\x1b[B', up = '\x1b[A', enter = '\r', esc = '\x1b';
const choice = (value, extra = {}) => ({ value, label: `Repository ${value}`, ...extra });
const question = (extra = {}) => ({ id: 'repositories', lang: 'en', message: 'Choose repositories',
  choices: [choice('alpha'), choice('bravo'), choice('charlie')], ...extra });

function fixture(t, { raw = true, initialRaw = false, columns = 100, rows = 24, flowing = false } = {}) {
  const input = new PassThrough(), output = new FakeTTY();
  output.columns = columns; output.rows = rows;
  input.isTTY = true; input.isRaw = initialRaw;
  const modes = [];
  if (raw) input.setRawMode = (mode) => { input.isRaw = mode; modes.push(mode); return input; };
  const existingData = () => {};
  if (flowing) input.on('data', existingData);
  const beforeInput = new Map(input.eventNames().map((name) => [name, input.listeners(name)]));
  const beforeOutput = new Map(output.eventNames().map((name) => [name, output.listeners(name)]));
  const beforeSignals = process.listeners('SIGINT');
  const prompt = createTerminalPrompter({ stdin: input, stdout: output });
  const send = async (keys) => { input.write(keys); await tick(); };
  function assertClean() {
    prompt.close();
    for (const name of new Set([...input.eventNames(), ...beforeInput.keys()])) assert.deepEqual(input.listeners(name), beforeInput.get(name) ?? [], `input ${String(name)} listeners`);
    for (const name of new Set([...output.eventNames(), ...beforeOutput.keys()])) assert.deepEqual(output.listeners(name), beforeOutput.get(name) ?? [], `output ${String(name)} listeners`);
    assert.deepEqual(process.listeners('SIGINT'), beforeSignals);
    assert.equal(input.isRaw, initialRaw);
    if (modes.includes(true)) assert.ok(output.text.endsWith('\x1b[?25h'), 'cursor restored');
  }
  t.after(() => { prompt.close(); input.destroy(); output.destroy(); });
  return { input, output, prompt, modes, send, assertClean };
}

test('select has no initial focus and Enter cannot accept recommended/current/default/initial values', async (t) => {
  const f = fixture(t);
  const pending = f.prompt.ask(question({ defaultValue: 'bravo', initialValues: ['bravo'], choices: [
    choice('alpha'), choice('bravo', { recommended: true, current: true })] }));
  let settled = false; pending.then(() => { settled = true; });
  assert.doesNotMatch(f.output.frame, /^> \d/m);
  assert.match(f.output.frame, /Repository bravo \[Recommended\] \[Current\]/);
  assert.ok(f.output.frame.indexOf('q cancel') < f.output.frame.indexOf('1. Repository'));
  await f.send(enter + enter);
  assert.equal(settled, false);
  assert.match(f.output.frame, /Choose an available item/);
  await f.send(down + enter);
  assert.equal(await pending, 'alpha');
  f.assertClean();
});

test('numbers focus explicitly, support two digits, and scroll a bounded viewport', async (t) => {
  const f = fixture(t);
  const pending = f.prompt.ask(question({ choices: Array.from({ length: 24 }, (_, index) => choice(index + 1)) }));
  assert.equal(f.output.frame.match(/^\s*\d+\. Repository/gm).length, 10);
  assert.doesNotMatch(f.output.frame, /11\. Repository/);
  await f.send('12');
  assert.match(f.output.frame, /^> 12\. Repository 12/m);
  assert.ok(f.output.frame.split('\n').filter((line) => /^.? \d+\. Repository/.test(line)).length <= 10);
  await f.send(enter);
  assert.equal(await pending, 12);
  f.assertClean();
});

test('arrow movement scrolls to the last choice without selecting it automatically', async (t) => {
  const f = fixture(t);
  const pending = f.prompt.ask(question({ choices: Array.from({ length: 18 }, (_, index) => choice(index)) }));
  await f.send(up);
  assert.match(f.output.frame, /^> 18\. Repository 17/m);
  await f.send(enter);
  assert.equal(await pending, 17);
  f.assertClean();
});

test('Space toggles multiple selections and Enter never adds the focused item', async (t) => {
  const f = fixture(t);
  const pending = f.prompt.ask(question({ type: 'multiselect', initialValues: ['bravo'], defaultValue: ['charlie'],
    choices: [choice('alpha', { recommended: true }), choice('bravo'), choice('charlie', { current: true })] }));
  assert.match(f.output.frame, /Selected: 1/);
  assert.match(f.output.frame, /1\. \[ \] Repository alpha \[Recommended\]/);
  assert.match(f.output.frame, /3\. \[ \] Repository charlie \[Current\]/);
  await f.send(down + ' ' + down + ' ' + down);
  assert.match(f.output.frame, /Selected: 1/);
  await f.send(enter);
  assert.deepEqual(await pending, ['alpha']);
  f.assertClean();
});

test('empty multiselect ignores defaultValue and stale or disabled initial selections', async (t) => {
  const f = fixture(t);
  const pending = f.prompt.ask(question({ type: 'multiselect', defaultValue: ['alpha'], initialValues: ['missing', 'bravo'],
    choices: [choice('alpha', { recommended: true }), choice('bravo', { disabled: true, disabledReason: 'Outside allowed scope' })] }));
  await f.send(enter);
  assert.deepEqual(await pending, []);
  f.assertClean();
});

test('search preserves selections, retains disabled items, and treats b/r/a as search text', async (t) => {
  const f = fixture(t);
  const pending = f.prompt.ask(question({ type: 'multiselect', allowBack: true, allowRescan: true, initialValues: ['alpha'],
    choices: [choice('alpha'), choice('bravo'), choice('blocked', { disabled: true, disabledReason: 'Not a Git repository' })] }));
  await f.send('/bravo' + enter);
  assert.doesNotMatch(f.output.frame, /Repository alpha/);
  assert.match(f.output.frame, /Repository bravo/);
  assert.match(f.output.frame, /Repository blocked.*Not a Git repository/);
  assert.match(f.output.frame, /Selected: 1/);
  await f.send('a');
  assert.match(f.output.frame, /Selected: 2/);
  await f.send(enter);
  assert.deepEqual(await pending, ['alpha', 'bravo']);
  f.assertClean();
});

test('a toggles only the displayed page, excluding disabled and preserving off-page choices', async (t) => {
  const f = fixture(t);
  const choices = Array.from({ length: 16 }, (_, index) => choice(index, index === 2 ? { disabled: true, disabledReason: 'Unavailable' } : {}));
  const pending = f.prompt.ask(question({ type: 'multiselect', choices, initialValues: [15] }));
  await f.send('a');
  assert.match(f.output.frame, /Selected: 10/);
  await f.send('a' + enter);
  assert.deepEqual(await pending, [15]);
  f.assertClean();
});

test('disabled selection remains pending and explains the reason', async (t) => {
  const f = fixture(t);
  const pending = f.prompt.ask(question({ choices: [choice('alpha', { disabled: true, disabledReason: 'Missing access' }), choice('bravo')] }));
  let settled = false; pending.then(() => { settled = true; });
  await f.send('1' + enter);
  assert.equal(settled, false);
  assert.match(f.output.frame, /Missing access/);
  await f.send(down + enter);
  assert.equal(await pending, 'bravo');
  f.assertClean();
});

test('Escape clears search before navigating back, and back/rescan do not close the prompter', async (t) => {
  const f = fixture(t);
  let pending = f.prompt.ask(question({ allowBack: true, allowRescan: true }));
  await f.send('/bravo');
  await f.send(esc);
  // readline disambiguates a lone Escape from the start of an arrow sequence.
  await new Promise((resolve) => setTimeout(resolve, 550));
  assert.match(f.output.frame, /Repository alpha/);
  assert.doesNotMatch(f.output.frame, /Search: bravo/);
  await f.send('b');
  assert.equal(await pending, PROMPT_BACK);
  pending = f.prompt.ask(question({ allowRescan: true }));
  await f.send('r');
  assert.equal(await pending, PROMPT_RESCAN);
  pending = f.prompt.ask(question({ allowBack: true }));
  await f.send('/bravo' + enter);
  await f.send(esc);
  assert.equal(await pending, PROMPT_BACK);
  f.assertClean();
});

test('back/rescan keys are inactive unless enabled', async (t) => {
  const f = fixture(t);
  const pending = f.prompt.ask(question());
  let settled = false; pending.then(() => { settled = true; });
  await f.send('br');
  assert.equal(settled, false);
  await f.send('2' + enter);
  assert.equal(await pending, 'bravo');
  f.assertClean();
});

for (const [name, abort] of [
  ['q', (f) => f.send('q')], ['q during search', (f) => f.send('/q')],
  ['Ctrl+C', (f) => f.send('\x03')], ['Ctrl+D', (f) => f.send('\x04')],
  ['EOF', (f) => f.input.end()], ['input close', (f) => f.input.destroy()],
  ['input error', (f) => f.input.emit('error', new Error('disconnected'))],
  ['output error', (f) => f.output.emit('error', new Error('disconnected'))],
  ['SIGINT', () => process.emit('SIGINT')], ['close()', (f) => f.prompt.close()]
]) test(`${name} cancels and releases terminal resources`, async (t) => {
  const f = fixture(t);
  const pending = f.prompt.ask(question());
  await abort(f);
  assert.equal(await pending, null);
  assert.equal(await f.prompt.ask(question()), null);
  f.assertClean();
});

test('raw mode and existing input/signal listeners are preserved across questions', async (t) => {
  const f = fixture(t, { initialRaw: true, flowing: true });
  for (let i = 0; i < 3; i++) {
    const pending = f.prompt.ask(question());
    await f.send('1' + enter);
    assert.equal(await pending, 'alpha');
    assert.equal(f.input.isRaw, true);
    assert.equal(f.input.listenerCount('keypress'), 0);
    assert.equal(f.input.listenerCount('data'), 1);
  }
  assert.deepEqual(f.modes, [true, true, true, true, true, true]);
  f.assertClean();
});

test('concurrent asks reject without disrupting the pending question', async (t) => {
  const f = fixture(t);
  const pending = f.prompt.ask(question());
  await assert.rejects(f.prompt.ask(question()), /already pending/);
  await f.send('1' + enter);
  assert.equal(await pending, 'alpha');
  f.assertClean();
});

test('a completed raw question restores input before close(), and never reads defaultValue', async (t) => {
  const f = fixture(t);
  const q = question();
  Object.defineProperty(q, 'defaultValue', { get() { throw new Error('defaultValue must not be read'); } });
  const pending = f.prompt.ask(q);
  await f.send('1' + enter);
  assert.equal(await pending, 'alpha');
  assert.equal(f.input.isRaw, false);
  assert.equal(f.input.isPaused(), true);
  assert.equal(f.input.listenerCount('data'), 0);
  assert.ok(f.output.text.endsWith('\x1b[?25h'));
  f.assertClean();
});

test('empty search, Unicode search backspace, and numeric multiselect remain explicit', async (t) => {
  const f = fixture(t);
  const pending = f.prompt.ask(question({ type: 'multiselect', choices: [choice('alpha', { label: '한글 저장소' }), choice('bravo')] }));
  await f.send('/한글z');
  assert.match(f.output.frame, /No matching items/);
  await f.send('\x7f' + enter);
  assert.match(f.output.frame, /한글 저장소/);
  await f.send('1 ' + enter);
  assert.deepEqual(await pending, ['alpha']);
  f.assertClean();
});

test('a tiny terminal uses line input, and shrinking raw mode keeps a choice visible', async (t) => {
  const tiny = fixture(t, { columns: 16, rows: 4 });
  const linePending = tiny.prompt.ask(question());
  assert.deepEqual(tiny.modes, []);
  await tiny.send('2\n');
  assert.equal(await linePending, 'bravo');
  tiny.assertClean();
  const f = fixture(t);
  const pending = f.prompt.ask(question());
  f.output.rows = 3; f.output.emit('resize');
  assert.match(f.output.frame, /q cancel/);
  assert.match(f.output.frame, /1\. Repository alpha/);
  assert.equal(f.output.frame.split('\n').length, 3);
  await f.send('1' + enter);
  assert.equal(await pending, 'alpha');
  f.assertClean();
});

test('raw rendering clears only its own lines, sanitizes names, and fits Korean on narrow screens', async (t) => {
  const f = fixture(t, { columns: 34, rows: 14 });
  f.output.write('Existing terminal history\n');
  const pending = f.prompt.ask(question({ lang: 'ko', message: '저장소 선택', intro: ['설명'], error: '이전 오류', reviewText: '검토 내용', choices: [
    choice('alpha', { label: '한글저장소가아주길어요👨‍👩‍👧‍👦e\u0301', recommended: true }),
    choice('bravo', { label: '\x1b[2J\x1b]0;forged-title\x07이름\r\n\t안전\x1b[31m\u202eevil' })] }));
  assert.ok(f.output.text.startsWith('Existing terminal history\n'));
  assert.doesNotMatch(f.output.text, /\x1b\[2J|\x1b\]0;|\x1b\[31m|\u202e|forged-title/);
  assert.match(f.output.frame, /이름\s+안전evil/);
  assert.ok(f.output.frame.split('\n').length <= f.output.rows);
  assert.ok(f.output.frame.split('\n').every((line) => [...line.replace(/👨‍👩‍👧‍👦/g, 'xx').replace(/\p{Mark}/gu, '')]
    .reduce((sum, char) => sum + (/[가-힣]/.test(char) ? 2 : 1), 0) < 34));
  await f.send(down);
  assert.doesNotMatch(f.output.text, /\x1b\[[0123]?J/);
  assert.match(f.output.text, /\x1b\[2K/);
  f.output.columns = 26; f.output.rows = 10; f.output.emit('resize');
  assert.ok(f.output.frame.split('\n').length <= 10);
  await f.send(enter);
  assert.equal(await pending, 'alpha');
  f.assertClean();
});

test('line fallback retries blank/invalid input and never returns defaultValue', async (t) => {
  const f = fixture(t, { raw: false });
  const pending = f.prompt.ask(question({ defaultValue: 'bravo', choices: [choice('alpha'), choice('bravo', { recommended: true })] }));
  let settled = false; pending.then(() => { settled = true; });
  await f.send('\nnot-listed\n99\n');
  assert.equal(settled, false);
  assert.match(f.output.text, /Invalid input/);
  assert.doesNotMatch(f.output.text, /\x1b/);
  await f.send('2\n');
  assert.equal(await pending, 'bravo');
  f.assertClean();
});

test('normal Korean option labels remain whole and focused explanations wrap', async (t) => {
  const f = fixture(t, { columns: 80 });
  const label = '현재 상태 + 작업 기록 + 업무 지식';
  const description = '작성 안내를 추가합니다. 월별 작업 기록과 주제별 지식 문서는 필요할 때 만듭니다.';
  const pending = f.prompt.ask(question({ lang: 'ko', choices: [choice('standard', { label, description, recommended: true })] }));
  assert.match(f.output.frame, new RegExp(label.replaceAll('+', '\\+') + ' \\[권장\\]'));
  await f.send(down);
  assert.ok(f.output.frame.replaceAll('\n', '').includes(description));
  await f.send(enter);
  assert.equal(await pending, 'standard');
  f.assertClean();
});

test('raw-mode setup failure safely falls back to readline', async (t) => {
  const f = fixture(t, { raw: false });
  const modes = [];
  f.input.setRawMode = (mode) => { modes.push(mode); if (mode) throw new Error('ENOTTY'); };
  const pending = f.prompt.ask(question());
  await f.send('Repository bravo\n');
  assert.equal(await pending, 'bravo');
  assert.deepEqual(modes, [true, false]);
  assert.doesNotMatch(f.output.text, /\x1b/);
  f.assertClean();
});

test('line multiselect accepts numbers/ranges without partial changes on invalid input', async (t) => {
  const f = fixture(t, { raw: false });
  const pending = f.prompt.ask(question({ type: 'multiselect', initialValues: ['a'], choices: ['a', 'b', 'c', 'd', 'e'].map((value) =>
    choice(value, value === 'b' ? { disabled: true, disabledReason: 'Outside scope' } : {})) }));
  let settled = false; pending.then(() => { settled = true; });
  await f.send('1-3\n5-3\n1,99\n1,,3\n');
  assert.equal(settled, false);
  assert.match(f.output.text, /Outside scope/);
  assert.match(f.output.frame, /Selected: 1/);
  await f.send('1, 3-5, 3\n');
  assert.deepEqual(await pending, ['a', 'c', 'd', 'e']);
  f.assertClean();
});

test('line fallback supports exact labels and value aliases without requiring repository names', async (t) => {
  const f = fixture(t, { raw: false });
  const pending = f.prompt.ask(question({ type: 'multiselect' }));
  await f.send('Repository charlie, ALPHA\n');
  assert.deepEqual(await pending, ['alpha', 'charlie']);
  f.assertClean();
});

test('line fallback retains queued explicit answers between questions', async (t) => {
  const f = fixture(t, { raw: false });
  const first = f.prompt.ask(question());
  await f.send('1\n2\n');
  assert.equal(await first, 'alpha');
  assert.equal(await f.prompt.ask(question()), 'bravo');
  f.assertClean();
});

test('line fallback rejects ambiguous aliases, with numbers still usable', async (t) => {
  const f = fixture(t, { raw: false });
  const pending = f.prompt.ask(question({ choices: [choice('alpha', { label: 'Same' }), choice('bravo', { label: 'same' })] }));
  let settled = false; pending.then(() => { settled = true; });
  await f.send('same\n');
  assert.equal(settled, false);
  await f.send('2\n');
  assert.equal(await pending, 'bravo');
  f.assertClean();
});

test('line fallback supports search and page toggles without discarding hidden selections', async (t) => {
  const f = fixture(t, { raw: false });
  const choices = Array.from({ length: 15 }, (_, index) => choice(index, { label: `Member ${index}` }));
  const pending = f.prompt.ask(question({ type: 'multiselect', initialValues: [0], choices }));
  await f.send('/Member 14\na\n\n');
  assert.deepEqual(await pending, [0, 14]);
  f.assertClean();
});

test('line fallback pages expose the next ten items without overlap', async (t) => {
  const f = fixture(t, { raw: false });
  const choices = Array.from({ length: 15 }, (_, index) => choice(index));
  const pending = f.prompt.ask(question({ type: 'multiselect', choices }));
  await f.send('n\n');
  assert.match(f.output.frame, /Items 11-15\/15/);
  assert.doesNotMatch(f.output.frame, /10\. \[ \]/);
  await f.send('a\n\n');
  assert.deepEqual(await pending, [10, 11, 12, 13, 14]);
  f.assertClean();
});

test('stream write exceptions still restore raw mode and listeners', async (t) => {
  const f = fixture(t);
  const write = f.output.write.bind(f.output);
  f.output.write = (chunk, ...args) => {
    if (String(chunk).includes('Choose repositories')) throw new Error('write failed');
    return write(chunk, ...args);
  };
  await assert.rejects(f.prompt.ask(question()), /write failed/);
  assert.equal(f.input.isRaw, false);
  f.assertClean();
});

for (const [line, initialValues, expected] of [['\n', undefined, []], ['\n', ['alpha'], ['alpha']], ['none\n', ['alpha'], []]]) {
  test(`line multiselect confirms only explicit state (${JSON.stringify(line)}, ${JSON.stringify(initialValues)})`, async (t) => {
    const f = fixture(t, { raw: false });
    const pending = f.prompt.ask(question({ type: 'multiselect', initialValues, defaultValue: ['bravo'] }));
    await f.send(line);
    assert.deepEqual(await pending, expected);
    f.assertClean();
  });
}

for (const [line, expected] of [['q\n', null], ['\x03', null], ['b\n', PROMPT_BACK], ['\x1b\n', PROMPT_BACK], ['r\n', PROMPT_RESCAN]]) {
  test(`line fallback control ${JSON.stringify(line)}`, async (t) => {
    const f = fixture(t, { raw: false });
    const pending = f.prompt.ask(question({ allowBack: true, allowRescan: true }));
    await f.send(line);
    assert.equal(await pending, expected);
    f.assertClean();
  });
}

test('line EOF cancels after invalid input, and already-ended input does not open a menu', async (t) => {
  const f = fixture(t, { raw: false });
  const pending = f.prompt.ask(question());
  await f.send('wrong\n');
  f.input.end();
  assert.equal(await pending, null);
  const shown = f.output.text;
  assert.equal(await f.prompt.ask(question()), null);
  assert.equal(f.output.text, shown);
  f.assertClean();
  assert.equal(stripVTControlCharacters(shown), shown);
});
