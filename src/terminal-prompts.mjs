import { createInterface, emitKeypressEvents, cursorTo, moveCursor, clearLine } from 'node:readline';
import { PassThrough } from 'node:stream';
import { stripVTControlCharacters } from 'node:util';

export const PROMPT_BACK = Symbol('back');
export const PROMPT_RESCAN = Symbol('rescan');

// Terminal text is untrusted (in particular, repository directory names).
function safeText(value) {
  return stripVTControlCharacters(String(value ?? ''))
    .replace(/[\r\n\t\u2028\u2029]/g, ' ')
    .replace(/[\x00-\x1f\x7f-\x9f\u061c\u200e\u200f\u202a-\u202e\u2066-\u2069]/g, '');
}
const normalize = (value) => safeText(value).normalize('NFKC').trim().toLowerCase();
const segments = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
const textWidth = (text) => [...segments.segment(text)].reduce((sum, part) => sum + cellWidth(part.segment), 0);
function cellWidth(text) {
  if (/^\p{Mark}+$/u.test(text)) return 0;
  if (/\p{Extended_Pictographic}|\p{Regional_Indicator}|\u20e3/u.test(text)) return 2;
  const c = text.codePointAt(0);
  return c >= 0x1100 && (c <= 0x115f || c === 0x2329 || c === 0x232a ||
    (c >= 0x2e80 && c <= 0xa4cf) || (c >= 0xac00 && c <= 0xd7a3) ||
    (c >= 0xf900 && c <= 0xfaff) || (c >= 0xfe10 && c <= 0xfe6f) ||
    (c >= 0xff00 && c <= 0xff60) || (c >= 0xffe0 && c <= 0xffe6) ||
    (c >= 0x1b000 && c <= 0x1b2ff) || (c >= 0x20000 && c <= 0x3fffd)) ? 2 : 1;
}
function fit(text, width) {
  const units = [...segments.segment(safeText(text))].map(({ segment }) => segment);
  if (units.reduce((sum, unit) => sum + cellWidth(unit), 0) <= width) return units.join('');
  let result = '', used = 0;
  for (const unit of units) {
    const cells = cellWidth(unit);
    if (used + cells > width - 1) break;
    result += unit; used += cells;
  }
  return width > 0 ? result + '…' : '';
}

function wrap(text, width) {
  const lines = [];
  let line = '', used = 0;
  for (const { segment } of segments.segment(safeText(text))) {
    const cells = cellWidth(segment);
    if (used + cells > width && line) { lines.push(line); line = ''; used = 0; }
    line += cells > width ? '…' : segment; used += Math.min(cells, width);
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * Label-first terminal menus. defaultValue is intentionally never read: only
 * initialValues restore an explicit multiselection, and select starts unfocused.
 * ask resolves a value, values[], PROMPT_BACK, PROMPT_RESCAN, or null (cancel).
 * Only one ask may be pending. close is idempotent and cancels a pending ask.
 */
export function createTerminalPrompter({ stdin = process.stdin, stdout = process.stdout } = {}) {
  let closed = false, active = null, reader = null;
  const queuedLines = [];
  const wasFlowing = stdin.readableFlowing === true;
  const stop = () => close();
  stdin.on('end', stop);
  stdin.on('close', stop);
  stdin.on('error', stop);
  stdout.on?.('error', stop);
  stdout.on?.('close', stop);

  function close() {
    if (closed) return;
    closed = true;
    active?.finish(null);
    if (reader) {
      reader.removeListener('close', stop);
      reader.close();
      reader.removeAllListeners('line');
      reader = null;
    }
    queuedLines.length = 0;
    stdin.removeListener('end', stop);
    stdin.removeListener('close', stop);
    stdin.removeListener('error', stop);
    stdout.removeListener?.('error', stop);
    stdout.removeListener?.('close', stop);
    if (!wasFlowing) stdin.pause();
    else if (!stdin.destroyed && !stdin.readableEnded) stdin.resume();
  }

  function ask(question) {
    if (active) return Promise.reject(new Error('A terminal question is already pending.'));
    if (closed || stdin.destroyed || stdin.readableEnded || stdout.destroyed || stdout.writableEnded) {
      close(); return Promise.resolve(null);
    }
    const ko = question.lang === 'ko', multi = question.type === 'multiselect';
    const tr = (en, korean) => ko ? korean : en;
    const choices = question.choices.map((item) => ({ ...item, label: safeText(item.label),
      description: safeText(item.description), disabledReason: safeText(item.disabledReason) }));
    const selected = new Set(choices.flatMap((item, index) =>
      multi && !item.disabled && question.initialValues?.includes(item.value) ? [index] : []));
    let focus = -1, offset = 0, query = '', searching = false, digits = '';
    let error = safeText(question.error), raw = false, frame = [], capacity = 10;
    const disposers = [];
    const width = () => Math.max(1, (Number(stdout.columns) || 80) - 1);
    const height = () => Math.max(3, Number(stdout.rows) || 24);
    const filtered = () => choices.flatMap((item, index) => item.disabled ||
      normalize(item.label + ' ' + item.description).includes(normalize(query)) ? [index] : []);
    const pageSize = () => capacity;
    function page() {
      const indices = filtered(), size = pageSize(), position = indices.indexOf(focus);
      const lastOffset = raw ? indices.length - size : Math.floor((indices.length - 1) / size) * size;
      offset = Math.max(0, Math.min(offset, Math.max(0, lastOffset)));
      if (position >= 0 && position < offset) offset = position;
      if (position >= offset + size) offset = position - size + 1;
      return indices.slice(offset, offset + size);
    }
    const values = () => choices.flatMap((item, index) => selected.has(index) ? [item.value] : []);
    const invalid = () => { error = tr('Choose an available item by number or arrow keys.', '번호나 방향키로 선택 가능한 항목을 골라주세요.'); };
    function toggle(index) {
      if (index < 0 || !choices[index] || choices[index].disabled) {
        error = choices[index]?.disabledReason || tr('This item cannot be selected.', '이 항목은 선택할 수 없습니다.');
        return false;
      }
      if (selected.has(index)) selected.delete(index); else selected.add(index);
      return true;
    }
    function togglePage() {
      const indices = page().filter((index) => !choices[index].disabled);
      const remove = indices.every((index) => selected.has(index));
      for (const index of indices) { if (remove) selected.delete(index); else selected.add(index); }
    }
    function clearFrame() {
      if (!frame.length || stdout.destroyed || stdout.writableEnded) return;
      // Count possible reflow after a resize. Never clear the whole terminal or
      // move above the visible part of this prompt's own drawing region.
      const columns = width() + 1;
      const rows = Math.min(height() - 1, frame.reduce((sum, line) => sum + Math.max(1,
        Math.ceil([...segments.segment(line)].reduce((n, part) => n + cellWidth(part.segment), 0) / columns)), 0));
      cursorTo(stdout, 0); moveCursor(stdout, 0, -rows);
      for (let i = 0; i < rows; i++) { clearLine(stdout, 0); moveCursor(stdout, 0, 1); }
      moveCursor(stdout, 0, -rows);
      frame = [];
    }
    function render() {
      if (!active || closed) return;
      let help = tr('q cancel · Ctrl+C cancel', 'q 취소 · Ctrl+C 취소');
      if (question.allowBack) help += tr(' · Esc/b back', ' · Esc/b 이전');
      if (question.allowRescan) help += tr(' · r rescan', ' · r 재탐색');
      const keys = raw
        ? tr('↑↓ / number: focus · / search · ', '↑↓ / 번호: 이동 · / 검색 · ') +
          (multi ? tr('Space check/uncheck · a select/clear page · Enter confirm', 'Space 선택/해제 · a 이 페이지 전체 선택/해제 · Enter 확정') : tr('Enter select', 'Enter 선택'))
        : tr('Number/name · /text search · n/p page · ', '번호/이름 · /검색어 · n/p 페이지 · ') +
          (multi ? tr('1,3-5 · a select/clear page · Enter confirm · none clear', '1,3-5 · a 이 페이지 전체 선택/해제 · Enter 확정 · none 선택 해제') : tr('Enter submit', 'Enter 확정'));
      // Wrap help before allocating the viewport so Korean and narrow terminals
      // keep their controls above the list. Reserve at least one choice row.
      const helpRows = [...wrap(help, width()), ...wrap(keys, width())];
      const headerLimit = Math.max(1, height() - 5);
      const header = raw && helpRows.length > headerLimit
        ? [fit(help, width()), fit(keys, width())].slice(0, headerLimit) : helpRows;
      const focused = choices[focus];
      const detailLines = focused ? wrap(`${focused.label} — ${focused.disabled ? focused.disabledReason || tr('Unavailable', '선택 불가') : focused.description}`, width()) : [];
      const detailCount = raw ? Math.min(3, Math.max(1, height() - header.length - 4), detailLines.length) : detailLines.length;
      capacity = raw ? Math.min(10, Math.max(1, height() - header.length - 3 - detailCount)) : 10;
      const shown = page();
      const status = [multi ? tr(`Selected: ${selected.size}`, `선택: ${selected.size}개`) : '',
        tr(`Items ${shown.length ? offset + 1 : 0}-${offset + shown.length}/${filtered().length}`, `목록 ${shown.length ? offset + 1 : 0}-${offset + shown.length}/${filtered().length}`),
        query || searching ? tr(`Search: ${query}`, `검색: ${query}`) : '',
        searching ? tr('(Enter keep / Esc clear)', '(Enter 유지 / Esc 해제)') : '',
        digits ? tr(`Number: ${digits}`, `번호: ${digits}`) : ''].filter(Boolean).join(' · ');
      const rows = [...header, status];
      if (error) rows.push(error);
      for (const index of shown) {
        const item = choices[index];
        const marks = (item.recommended ? tr(' [Recommended]', ' [권장]') : '') +
          (item.current ? tr(' [Current]', ' [현재]') : '');
        const prefix = `${focus === index ? '>' : ' '} ${index + 1}. ${multi ? (item.disabled ? '[-] ' : selected.has(index) ? '[x] ' : '[ ] ') : ''}`;
        const detail = item.disabled ? tr('Unavailable: ', '선택 불가: ') + (item.disabledReason || tr('disabled', '사용 불가')) : item.description;
        const tail = marks + (detail ? ' — ' + detail : '');
        // Keep recommendation/current badges and disabled reasons visible even
        // when a directory has a very long name.
        const label = fit(item.label, Math.max(1, width() - textWidth(prefix) - textWidth(marks)));
        rows.push(prefix + label + tail);
      }
      if (!shown.length) rows.push(tr('No matching items.', '일치하는 항목이 없습니다.'));
      rows.push(...detailLines.slice(0, detailCount));
      if (raw) {
        clearFrame();
        // An extreme resize can leave room for only help and one item.
        const visibleRows = height() < 6
          ? [help, ...(height() > 3 ? [status] : []), rows[header.length + 1 + (error ? 1 : 0)]] : rows;
        frame = visibleRows.slice(0, height() - 1).map((row) => fit(row, width()));
        stdout.write(frame.join('\n') + '\n');
      } else stdout.write(rows.map((row) => fit(row, width())).join('\n') + '\n> ');
    }

    return new Promise((resolve, reject) => {
      function finish(value, failure) {
        if (active?.finish !== finish) return;
        active = null;
        // Cleanup runs even when a stream fails during drawing or raw-mode setup.
        for (const dispose of disposers.reverse()) { try { dispose(); } catch { /* disconnected TTY */ } }
        if (failure) reject(failure); else resolve(value);
      }
      active = { finish, line: onLine };
      const listen = (source, event, handler) => {
        source.on(event, handler);
        disposers.push(() => source.removeListener(event, handler));
      };
      function cancel() { close(); }
      function navigate(delta) {
        const indices = filtered(), position = indices.indexOf(focus);
        if (indices.length) focus = indices[position < 0 ? (delta < 0 ? indices.length - 1 : 0) : Math.max(0, Math.min(indices.length - 1, position + delta))];
        digits = ''; searching = false;
      }
      function numberFocus() {
        const index = Number(digits) - 1;
        focus = digits && filtered().includes(index) ? index : -1;
      }
      function onKey(text, key = {}) {
        if (active?.finish !== finish) return;
        try {
          error = '';
          if ((key.ctrl && (key.name === 'c' || key.name === 'd')) || text === 'q') { cancel(); return; }
          if (key.ctrl || (key.meta && key.name !== 'escape')) return;
          if (key.name === 'escape') {
            if (searching) { searching = false; query = ''; focus = -1; offset = 0; }
            else if (question.allowBack) { finish(PROMPT_BACK); return; }
            else if (query) { query = ''; focus = -1; offset = 0; }
          } else if (searching) {
            if (key.name === 'return' || key.name === 'enter') searching = false;
            else if (key.name === 'down' || key.name === 'up') navigate(key.name === 'down' ? 1 : -1);
            else if (key.name === 'backspace') { query = [...segments.segment(query)].slice(0, -1).map((part) => part.segment).join(''); focus = -1; offset = 0; }
            else if (text && safeText(text)) { query += safeText(text); focus = -1; offset = 0; }
          } else if (text === 'b' && question.allowBack) { finish(PROMPT_BACK); return; }
          else if (text === 'r' && question.allowRescan) { finish(PROMPT_RESCAN); return; }
          else if (text === '/') { searching = true; digits = ''; focus = -1; }
          else if (text === 'a' && multi) togglePage();
          else if (key.name === 'up' || key.name === 'down' || key.name === 'pageup' || key.name === 'pagedown') {
            navigate((key.name === 'up' || key.name === 'pageup' ? -1 : 1) * (key.name.startsWith('page') ? pageSize() : 1));
          } else if (/^[0-9]$/.test(text ?? '')) { digits = (digits + text).slice(0, String(choices.length).length + 1); numberFocus(); }
          else if (key.name === 'backspace') { digits = digits.slice(0, -1); numberFocus(); }
          else if (key.name === 'space' && multi) { toggle(focus); digits = ''; }
          else if (key.name === 'return' || key.name === 'enter') {
            if (multi) { finish(values()); return; }
            if (focus >= 0 && !choices[focus].disabled) { finish(choices[focus].value); return; }
            if (choices[focus]?.disabled) error = choices[focus].disabledReason || tr('Unavailable', '선택 불가'); else invalid();
          }
          render();
        } catch (failure) { finish(null, failure); close(); }
      }

      function alias(token) {
        const name = normalize(token);
        const matches = choices.flatMap((item, index) => {
          const valueAlias = ['string', 'number', 'boolean'].includes(typeof item.value) ? normalize(item.value) : '';
          return normalize(item.label) === name || valueAlias === name ? [index] : [];
        });
        return matches.length === 1 ? matches[0] : -1;
      }
      function parseLine(line) {
        // A whole label may itself contain spaces, commas, or hyphens.
        const exact = alias(line);
        if (!/^[\d\s,-]+$/.test(line) && exact >= 0) return [exact];
        if (/(^,|,$|,\s*,)/.test(line)) return null;
        const tokens = /^[\d\s,-]+$/.test(line) ? line.split(/[\s,]+/) : line.split(',').map((token) => token.trim());
        const indices = [];
        for (const token of tokens) {
          const range = token.match(/^(\d+)(?:-(\d+))?$/);
          if (range) {
            const first = Number(range[1]), last = Number(range[2] ?? range[1]);
            if (first < 1 || last < first || last > choices.length) return null;
            for (let i = first; i <= last; i++) indices.push(i - 1);
          } else {
            const index = alias(token);
            if (index < 0) return null;
            indices.push(index);
          }
        }
        return [...new Set(indices)];
      }
      function onLine(input) {
        if (active?.finish !== finish) { queuedLines.push(input); return; }
        try {
          const line = input.trim(), command = line.toLowerCase();
          error = '';
          if (command === 'q' || /[\x03\x04]/.test(line)) { cancel(); return; }
          if ((command === 'b' || line === '\x1b') && question.allowBack) { finish(PROMPT_BACK); return; }
          if (command === 'r' && question.allowRescan) { finish(PROMPT_RESCAN); return; }
          if (line.startsWith('/')) { query = safeText(line.slice(1)); offset = 0; focus = -1; }
          else if (command === 'n' || command === 'p') { focus = -1; offset += (command === 'n' ? 1 : -1) * pageSize(); }
          else if (command === 'a' && multi) togglePage();
          else if (multi && (command === 'none' || command === '없음')) { finish([]); return; }
          else if (multi && !line) { finish(values()); return; }
          else {
            const indices = line ? parseLine(line) : null;
            const disabled = indices?.find((index) => choices[index].disabled);
            if (indices?.length && (multi || indices.length === 1) && disabled === undefined) {
              finish(multi ? choices.flatMap((item, index) => indices.includes(index) ? [item.value] : []) : choices[indices[0]].value); return;
            }
            if (disabled !== undefined) error = choices[disabled].disabledReason || tr('Unavailable', '선택 불가');
            else error = tr('Invalid input. Enter a listed number or name.', '잘못된 입력입니다. 목록의 번호나 이름을 입력해주세요.');
          }
          render();
        } catch (failure) { finish(null, failure); close(); }
      }

      try {
        listen(process, 'SIGINT', cancel);
        if (stdin.isTTY && stdout.isTTY && typeof stdin.setRawMode === 'function' && !reader && width() >= 19 && height() >= 6) {
          const previousRaw = Boolean(stdin.isRaw);
          try { stdin.setRawMode(true); raw = true; }
          catch { try { stdin.setRawMode(previousRaw); } catch { /* use line input */ } }
          if (raw) {
            disposers.push(() => stdin.setRawMode(previousRaw));
            // Use a private decoder: emitKeypressEvents otherwise leaves internal
            // data/newListener handlers on the caller's input stream.
            const decoder = new PassThrough();
            emitKeypressEvents(decoder);
            decoder.on('keypress', onKey);
            disposers.push(() => { decoder.removeAllListeners(); decoder.destroy(); });
            const flowing = stdin.readableFlowing === true;
            listen(stdin, 'data', (chunk) => decoder.write(chunk));
            listen(stdout, 'resize', () => { try { render(); } catch (failure) { finish(null, failure); close(); } });
            disposers.push(() => { if (!stdout.destroyed && !stdout.writableEnded) { clearFrame(); stdout.write('\x1b[?25h'); } });
            stdout.write('\x1b[?25l');
            disposers.push(() => { if (!flowing) stdin.pause(); });
            stdin.resume();
          }
        }
        for (const text of [...(question.intro ?? []), question.message, question.description, question.reviewText]) {
          if (text) for (const line of String(text).split(/\r?\n/)) stdout.write(safeText(line) + '\n');
        }
        render();
        if (!raw && !reader) {
          // terminal:false is essential when setRawMode is absent or throws.
          reader = createInterface({ input: stdin, crlfDelay: Infinity, terminal: false });
          reader.on('line', (line) => { if (active) active.line(line); else queuedLines.push(line); });
          reader.on('close', stop);
        }
        if (!raw) {
          listen(stdin, 'data', (chunk) => { if (/[\x03\x04]/.test(chunk.toString())) cancel(); });
          while (active?.finish === finish && queuedLines.length) onLine(queuedLines.shift());
        }
      } catch (failure) { finish(null, failure); close(); }
    });
  }
  return { ask, close };
}
