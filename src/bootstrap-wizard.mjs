import { createInterface } from 'node:readline';
import { bootstrapProject, inspectBootstrapGit, normalizeBootstrapOptions, readBootstrapDefaults } from './bootstrap.mjs';
import { discoverRepositories } from './workspace.mjs';

const invalid = (message) => Object.assign(new Error(message), { code: 'aapb.bootstrap-input' });
const cancelled = (answer) => answer === null || answer === undefined || /^(?:cancel|quit|q)$/i.test(String(answer).trim());
const choice = (value, label = value) => ({ value, label });

// One reader for the whole wizard; EOF and Ctrl-C resolve a pending question as cancellation.
function terminalAsk(stdin, stdout) {
  const reader = createInterface({ input: stdin, output: stdout, terminal: true });
  let ended = false, pending = null;
  reader.on('close', () => { ended = true; if (pending) { pending(null); pending = null; } });
  reader.on('SIGINT', () => reader.close());
  reader.on('line', (line) => { if (pending) { const resolve = pending; pending = null; resolve(line); } });
  return {
    close: () => reader.close(),
    ask: async (question) => {
      if (ended) return null;
      stdout.write('\n' + question.message + '\n');
      for (const item of question.choices ?? []) stdout.write(`  ${item.value}: ${item.label}\n`);
      for (const warning of question.warnings ?? []) stdout.write(`${warning.path ? warning.path + ': ' : ''}${warning.message}\n`);
      if (question.review) stdout.write((question.reviewText ?? JSON.stringify(question.review, null, 2)) + '\n');
      stdout.write(`> ${question.defaultValue === undefined ? '' : '[' + question.defaultValue + '] '} (${question.cancelHint ?? 'q cancels'}) `);
      const line = await new Promise((resolve) => { pending = resolve; });
      return line === '' ? question.defaultValue : line;
    }
  };
}

/**
 * Returns bootstrap options directly, or null on cancellation. It never applies writes.
 * ask({id,message,choices,defaultValue,review?,repositories?}) returns a value or null.
 * Repository answers are selected IDs (an array or comma-separated string); no implicit registration.
 */
export async function prepareBootstrapOptions(options, io = {}) {
  const stdin = io.stdin ?? process.stdin, stdout = io.stdout ?? process.stdout;
  const interactive = io.interactive ?? options.interactive;
  const yes = io.yes ?? options.yes ?? false, json = io.json ?? options.json ?? false;
  const injected = typeof io.ask === 'function';
  const terminalAvailable = Boolean(stdin.isTTY && stdout.isTTY && typeof stdin.on === 'function' && !stdin.destroyed && !stdin.readableEnded && typeof stdout.write === 'function');
  const workable = injected || terminalAvailable;
  if (interactive && json) throw invalid('--interactive cannot ask questions with --json.');
  if (interactive && !workable) throw invalid('--interactive requires workable TTY input/output or an injected ask callback.');
  const bare = ['kind', 'exclude', 'lang', 'records', 'agents', 'repositories'].every((key) => options[key] === undefined) && !options.localOnly;
  const asking = !yes && !json && (interactive === true || (interactive !== false && terminalAvailable && bare));
  if (!asking && !yes) return options;
  const git = await inspectBootstrapGit(options.target);
  const defaults = { kind: 'single', exclude: git ? 'local' : 'none', lang: 'en', records: 'standard', agents: 'preserve', ...await readBootstrapDefaults(options.target) };
  const selected = { ...options };
  if (options.localOnly && options.exclude === undefined) selected.exclude = 'local';
  if (yes) {
    for (const [key, value] of Object.entries(defaults)) if (selected[key] === undefined) selected[key] = value;
    if (selected.kind === 'workspace' && selected.repositories === undefined) selected.repositories = [];
    return normalizeBootstrapOptions(selected);
  }
  const terminal = injected ? null : terminalAsk(stdin, stdout);
  const ask = io.ask ?? terminal.ask;
  const korean = () => (selected.lang ?? defaults.lang) === 'ko';
  const localize = (english, ko) => korean() ? ko : english;
  const warningText = (message) => {
    if (!korean()) return message;
    if (message.startsWith('Global impact:')) return '전역 영향: 이 제외 파일을 쓰는 모든 저장소에 적용됩니다. 기존 core.excludesFile과 Git 설정을 보존하며 변경 전 내용을 백업합니다.';
    if (message.startsWith('Git local exclusions')) return '로컬 제외 규칙은 공통 Git 디렉터리를 사용하므로 연결된 워크트리에도 영향을 줄 수 있습니다.';
    if (message.startsWith('Local Git exclusion was not applied')) return 'Git 워크트리가 없어 로컬 제외 규칙을 적용하지 않았습니다. 기록은 사용할 수 있으며 Git을 초기화하지 않습니다.';
    if (message.startsWith('Only unchanged AAPB-owned')) return '수정되지 않은 AAPB 소유 제외 블록만 제거합니다. 사용자 규칙이나 다른 Git 제외 규칙은 계속 적용될 수 있습니다.';
    if (message.startsWith('This target has no Git')) return '이 대상은 Git 워크트리가 아닙니다. 제외 규칙은 해당 파일을 사용하는 저장소에서만 적용됩니다.';
    if (message.startsWith('Registered member uses')) return '등록된 저장소는 기존 공용 워크스페이스 기록을 사용합니다. 설정 변경은 워크스페이스 루트에서 진행하며 중복 기록 폴더를 만들지 않습니다.';
    if (message.startsWith('Existing workspace membership')) return '기존 워크스페이스 등록 정보를 보존합니다. 저장소 구성을 바꾸려면 workspace 명령을 사용합니다.';
    if (message.startsWith('Selected metadata was not persisted')) return '선택한 메타데이터를 저장하지 않았습니다. manifest가 사용자 소유이거나 수정되었거나 소유권이 유효하지 않습니다. 기존 문서와 메타데이터를 보존하므로 저장된 언어·구성을 바꾸려면 소유권을 먼저 확인해야 합니다.';
    if (message.startsWith('Edited or ambiguous')) return '수정되었거나 소유권이 불명확한 AAPB 제외 블록을 보존합니다: ' + message.match(/in (.+)\.$/)?.[1];
    const tracked = message.match(/^(\d+) tracked playbook/);
    if (tracked) return `이미 추적 중인 기록 파일 ${tracked[1]}개는 계속 추적됩니다. 제외 규칙은 인덱스를 바꾸지 않습니다.`;
    return message;
  };
  const labels = () => ({
    single: localize('One project: records for this directory', '단일 프로젝트: 이 폴더의 기록'),
    workspace: localize('Workspace: shared records for explicitly selected repositories', '워크스페이스: 선택한 저장소가 함께 쓰는 기록'),
    local: localize('Local: Git info/exclude; affects this repository and linked worktrees', '로컬: Git info/exclude에 추가; 이 저장소와 연결된 워크트리에 적용'),
    shared: localize('Shared: project .gitignore; share the rule by committing that file yourself', '공유: 프로젝트 .gitignore에 추가; 직접 커밋하면 다른 참여자와 공유'),
    global: localize('Global: existing Git excludesFile or default user ignore; affects all repositories using it', '전역: 기존 Git excludesFile 또는 사용자 기본 ignore; 해당 파일을 쓰는 모든 저장소에 적용'),
    none: localize('None: add no ignore rule; remove only unchanged AAPB-owned rules for this target', '없음: 무시 규칙을 추가하지 않고 이 대상의 수정되지 않은 AAPB 규칙만 제거'),
    en: 'English (영어)', ko: '한국어 (Korean)',
    minimal: localize('Minimal: editable CURRENT.md and metadata', '최소: 편집 가능한 CURRENT.md와 메타데이터'),
    standard: localize('Standard: entrypoint plus worklog and knowledge guides', '표준: 시작 문서와 작업 기록·지식 기록 안내'),
    preserve: localize('Preserve existing AGENTS.md exactly', '기존 AGENTS.md를 그대로 보존'),
    link: localize('Append a short records link to AGENTS.md; preserve existing instructions', '기존 지침을 보존하고 AGENTS.md에 기록 링크 추가')
  });
  const select = async (id, message, values) => {
    const answer = await ask({ id, message, choices: values.map((value) => choice(value, labels()[value])), defaultValue: selected[id] ?? defaults[id], cancelHint: localize('q cancels', 'q 입력 시 취소') });
    if (cancelled(answer)) return false;
    const value = String(answer).trim();
    if (!values.includes(value)) throw invalid(`Invalid ${id} answer: choose ${values.join(', ')}.`);
    selected[id] = value; return true;
  };
  try {
    if (!await select('lang', localize('Choose the language for the wizard and newly created records.', '안내와 새 기록에 사용할 언어를 선택합니다.'), ['en', 'ko'])) return null;
    if (!await select('kind', localize('Set up records for one project or an explicitly registered workspace?', '단일 프로젝트 또는 저장소를 직접 선택하는 워크스페이스를 설정합니다.'), ['single', 'workspace'])) return null;
    if (selected.kind === 'workspace') {
      const discovery = await discoverRepositories(options.target);
      // Explicit caller selections may include Git-less members outside discovery's Git candidates.
      const candidates = [...discovery.repositories];
      const initialRepositories = options.repositories ?? defaults.repositories;
      for (const repo of initialRepositories ?? []) {
        const index = candidates.findIndex((entry) => entry.id === repo.id);
        if (index < 0) candidates.push(repo); else candidates[index] = repo;
      }
      const answer = await ask({ id: 'repositories', message: localize('Select repository IDs separated by commas. Only selected directories will be registered; enter none for an empty workspace.', '저장소 ID를 쉼표로 구분하여 선택합니다. 선택한 폴더만 등록합니다. 빈 워크스페이스는 none을 입력합니다.') + (discovery.complete ? '' : localize('\nCandidate discovery is incomplete. Add missing known directories later with workspace add.', '\n후보 탐색이 일부 범위에서 끝났습니다. 누락된 폴더는 나중에 workspace add로 직접 등록할 수 있습니다.')),
        choices: candidates.map((repo) => choice(repo.id, repo.path)), repositories: candidates,
        warnings: discovery.warnings, complete: discovery.complete,
        cancelHint: localize('q cancels', 'q 입력 시 취소'),
        defaultValue: initialRepositories === undefined ? undefined : initialRepositories.map((repo) => repo.id).join(',') || 'none' });
      if (cancelled(answer)) return null;
      const ids = Array.isArray(answer) ? answer : String(answer).trim() === 'none' ? [] : String(answer).split(',').map((id) => id.trim()).filter(Boolean);
      if (!Array.isArray(answer) && !String(answer).trim()) throw invalid('Select repository IDs explicitly, or enter none.');
      if (new Set(ids).size !== ids.length) throw invalid('Select each repository ID only once.');
      selected.repositories = ids.map((id) => {
        const repo = candidates.find((candidate) => candidate.id === id);
        if (!repo) throw invalid('Unknown repository selection: ' + id);
        return { ...repo };
      });
    } else delete selected.repositories;
    if (!await select('exclude', localize('Choose Git exclusions. Global affects every repository using the exclusions file.', 'Git 제외 범위를 선택합니다. 전역 규칙은 해당 제외 파일을 쓰는 모든 저장소에 영향을 줍니다.'), git ? ['local', 'shared', 'global', 'none'] : ['none', 'shared', 'global'])) return null;
    if (!await select('records', localize('Choose a minimal entrypoint or standard worklog and knowledge guides.', '최소 시작 문서 또는 작업 기록·지식 기록 안내를 포함한 표준 구성을 선택합니다.'), ['minimal', 'standard'])) return null;
    if (!await select('agents', localize('Preserve AGENTS.md, or append a short link to project records?', 'AGENTS.md를 그대로 보존하거나 프로젝트 기록 링크를 추가합니다.'), ['preserve', 'link'])) return null;
    // Review uses the same preflight engine as argument mode, including real Git/global effects.
    const normalized = normalizeBootstrapOptions(selected);
    const preview = await bootstrapProject({ ...normalized, dryRun: true });
    const review = { target: selected.target, dryRun: Boolean(selected.dryRun), ...preview.selection, repositories: selected.repositories ?? [], operations: preview.operations, preserved: preview.preserved, exclusion: preview.exclusion, warnings: preview.warnings };
    const reviewText = [
      localize('Target: ', '대상: ') + review.target,
      ...['kind', 'exclude', 'lang', 'records', 'agents'].map((key) => labels()[normalized[key]]),
      localize('Selected repositories: ', '선택한 저장소: ') + review.repositories.map((repo) => repo.id).join(', '),
      localize('Planned files: ', '변경할 파일: ') + review.operations.join(', '),
      localize('Preserved files: ', '보존할 파일: ') + review.preserved.join(', '),
      ...(review.dryRun ? [localize('Dry run: no writes will be applied.', '미리 보기: 파일을 변경하지 않습니다.')] : []),
      ...(review.exclusion.globalImpact ? [localize('Global impact: other repositories using the same ignore file are affected. Modifications are backed up; Git configuration is preserved.', '전역 영향: 같은 제외 파일을 사용하는 다른 저장소에도 적용됩니다. 변경 전 내용을 백업하며 Git 설정은 보존합니다.')] : []),
      ...review.warnings.map(warningText)
    ].join('\n');
    const answer = await ask({ id: 'review', message: localize('Review the selected setup and planned changes. Continue?', '선택한 설정과 변경 내용을 확인합니다. 진행할까요?'), choices: [choice('yes', localize('Continue', '진행')), choice('no', localize('Cancel', '취소'))], defaultValue: 'yes', cancelHint: localize('q cancels', 'q 입력 시 취소'), review, reviewText });
    if (cancelled(answer) || answer === false || /^(?:no|n)$/i.test(String(answer).trim())) return null;
    if (answer !== true && !/^(?:yes|y)$/i.test(String(answer).trim())) throw invalid('Final review requires yes or no.');
    return normalized;
  } catch (error) {
    if (error.name === 'AbortError') return null;
    throw error;
  } finally { terminal?.close(); }
}
