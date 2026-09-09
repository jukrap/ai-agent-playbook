import { bootstrapProject, inspectBootstrapGit, normalizeBootstrapOptions, readBootstrapDefaults } from './bootstrap.mjs';
import { discoverRepositories, resolveRecordContext } from './workspace.mjs';
import { createTerminalPrompter, PROMPT_BACK, PROMPT_RESCAN } from './terminal-prompts.mjs';
import { say, setupChoices, folderGuide, setupWarning } from './bootstrap-copy.mjs';
import { projectRoot } from './fs-safety.mjs';

const invalid = (message) => Object.assign(new Error(message), { code: 'aapb.bootstrap-input' });
const cancelled = (value) => value === null || value === undefined || (typeof value === 'string' && /^(?:cancel|quit|q)$/i.test(value.trim()));
const item = (value, label, description = undefined) => ({ value, label, description });

/** All prompts are read-only. Argument/JSON/--yes semantics remain independent of the terminal UI. */
export async function prepareBootstrapOptions(options, io = {}) {
  const stdin = io.stdin ?? process.stdin, stdout = io.stdout ?? process.stdout;
  const interactive = io.interactive ?? options.interactive;
  const yes = io.yes ?? options.yes ?? false, json = io.json ?? options.json ?? false;
  const injected = typeof io.ask === 'function';
  const terminalAvailable = Boolean(stdin.isTTY && stdout.isTTY && typeof stdin.on === 'function' && !stdin.destroyed && !stdin.readableEnded && typeof stdout.write === 'function');
  if (interactive && json) throw invalid('--interactive cannot ask questions with --json.');
  if (interactive && !injected && !terminalAvailable) throw invalid('--interactive requires workable TTY input/output or an injected ask callback.');
  const bare = ['kind', 'exclude', 'lang', 'records', 'agents', 'repositories'].every((key) => options[key] === undefined) && !options.localOnly;
  const asking = !yes && !json && (interactive === true || (interactive !== false && terminalAvailable && bare));
  if (!asking && !yes) return options;

  let git = await inspectBootstrapGit(options.target), saved = await readBootstrapDefaults(options.target);
  const defaults = () => ({ kind: 'single', exclude: git ? 'local' : 'none', lang: 'en', records: 'standard', agents: 'preserve', ...saved });
  const selected = { ...options, target: await projectRoot(options.target) };
  if (options.localOnly && options.exclude === undefined) selected.exclude = 'local';
  if (yes) {
    for (const [key, value] of Object.entries(defaults())) if (selected[key] === undefined) selected[key] = value;
    if (selected.kind === 'workspace' && selected.repositories === undefined) selected.repositories = [];
    return normalizeBootstrapOptions(selected);
  }

  let context = await resolveRecordContext({ target: selected.target });
  const terminal = injected ? null : createTerminalPrompter({ stdin, stdout });
  const ask = io.ask ?? terminal.ask;
  const lang = () => selected.lang ?? saved.lang ?? 'en';
  const t = (en, ko) => say(lang(), en, ko);
  const notify = () => io.onInteractive?.({ lang: lang(), target: selected.target });
  notify();
  const refresh = async () => {
    context = await resolveRecordContext({ target: selected.target });
    git = await inspectBootstrapGit(selected.target); saved = await readBootstrapDefaults(selected.target);
  };
  const steps = () => ['lang', ...(context.root !== selected.target && context.workspace ? ['scope'] : []), 'kind',
    ...(!context.exists || (selected.kind === 'workspace' && !context.workspace) ? ['prepare'] : []),
    ...(selected.kind === 'workspace' && !context.workspace ? ['repositories'] : []), 'exclude', 'records', 'agents', 'review'];
  const titles = () => ({ lang: 'Language / 언어 선택', scope: t('Choose the shared setup location', '공통 기록의 설정 위치를 확인하세요'),
    kind: t('What will share these records?', '기록을 어디에서 함께 사용할까요?'), prepare: t('Prepare the folders before continuing', '폴더를 준비한 뒤 계속하세요'),
    repositories: t('Select repositories to share the records', '공통 기록을 사용할 저장소를 선택하세요'), exclude: t('How should Git treat the record folder?', 'Git에서 기록 폴더를 어떻게 제외할까요?'),
    records: t('Which record guides do you need?', '어떤 기록 안내가 필요한가요?'), agents: t('Connect agent instructions to the records?', '에이전트 지침에 기록을 연결할까요?'),
    review: t('Review the changes before applying', '적용할 내용을 확인하세요') });
  const question = (id, extra = {}) => ({ id, lang: lang(), message: titles()[id], allowBack: id !== 'lang', ...extra });
  let position = 0, editing = false;
  try {
    while (true) {
      const route = steps(), id = route[position];
      if (!id) throw invalid('Invalid setup navigation state.');
      if (id === 'scope') {
        const answer = await ask(question(id, { intro: [t('Current folder: ', '현재 폴더: ') + selected.target, t('Shared record folder: ', '공통 기록 폴더: ') + context.directory],
          choices: [item('workspace', t('Configure the shared workspace', '상위 작업 공간 설정하기'), context.root), item('cancel', t('Cancel', '취소'))], defaultValue: 'workspace' }));
        if (cancelled(answer)) return null;
        if (answer === PROMPT_BACK) { position--; continue; }
        if (answer !== 'workspace') throw invalid('Select the shared workspace or cancel.');
        selected.target = context.root;
        await refresh(); notify();
        position = steps().indexOf('kind'); continue;
      }
      if (id === 'prepare') {
        const answer = await ask(question(id, { intro: folderGuide({ lang: lang(), target: selected.target, kind: selected.kind, name: context.name }),
          choices: [item('ready', t('Ready — continue', '준비 완료 — 계속하기')), item('cancel', t('Exit and prepare the folders', '종료하고 폴더 준비하기'))], defaultValue: 'ready' }));
        if (cancelled(answer)) return null;
        if (answer === PROMPT_BACK) { position--; continue; }
        if (answer !== 'ready') throw invalid('Choose ready after preparing the folders, or cancel.');
        await refresh();
        // External preparation may have created a valid setup while the wizard was open.
        position = steps().includes('repositories') ? steps().indexOf('repositories') : steps().indexOf(editing ? 'review' : 'exclude');
        if (steps()[position] === 'review') editing = false;
        continue;
      }
      if (id === 'repositories') {
        const discovery = await discoverRepositories(selected.target);
        const candidates = [...discovery.repositories];
        for (const repo of options.repositories ?? []) {
          const index = candidates.findIndex((entry) => entry.id === repo.id || entry.path === repo.path);
          if (index < 0) candidates.push(repo); else candidates[index] = repo;
        }
        const initial = selected.repositories ?? [];
        const answer = await ask(question(id, { type: 'multiselect', choices: candidates.map((repo) => item(repo.id, repo.path, repo.id)), repositories: candidates,
          initialValues: initial.map((repo) => repo.id), defaultValue: initial.length ? initial.map((repo) => repo.id).join(',') : undefined, allowRescan: true,
          description: t('Check the folders you need. Names and quotes do not need to be typed. Rescan after preparing more repositories.', '필요한 폴더에 체크하세요. 이름이나 따옴표를 입력할 필요 없습니다. 폴더를 추가로 준비했다면 다시 탐색하세요.'),
          intro: [t('Parent folder: ', '상위 폴더: ') + selected.target,
            ...(candidates.length ? [] : [t('No Git repositories found in the bounded search. Prepare them here, rescan, or continue with an empty workspace.', '제한된 탐색 범위에서 Git 저장소를 찾지 못했습니다. 이 폴더 아래에 준비한 뒤 다시 찾거나 빈 작업 공간으로 계속할 수 있습니다.')]),
            ...(discovery.complete ? [] : [t('Discovery is incomplete; register omitted folders later with workspace add.', '후보 탐색이 일부 범위에서 끝났습니다. 누락된 폴더는 나중에 workspace add로 등록할 수 있습니다.')]),
            ...discovery.warnings.map((warning) => warning.path + ': ' + warning.message)] }));
        if (cancelled(answer)) return null;
        if (answer === PROMPT_BACK) { position--; continue; }
        if (answer === PROMPT_RESCAN) { await refresh(); continue; }
        const ids = Array.isArray(answer) ? answer : String(answer).trim() === 'none' ? [] : String(answer).split(',').map((value) => value.trim()).filter(Boolean);
        if (!Array.isArray(answer) && !String(answer).trim()) throw invalid('Select repositories explicitly, or choose an empty workspace.');
        if (new Set(ids).size !== ids.length) throw invalid('Select each repository only once.');
        selected.repositories = ids.map((repoId) => {
          const repo = candidates.find((entry) => entry.id === repoId);
          if (!repo) throw invalid('Unknown repository selection: ' + repoId);
          return { ...repo };
        });
        if (!ids.length) {
          const empty = await ask(question('empty-workspace', { message: t('Create a workspace without registered repositories?', '등록된 저장소 없이 작업 공간을 만들까요?'),
            choices: [item('empty', t('Start empty and register later', '빈 작업 공간으로 시작하고 나중에 등록하기')), item('rescan', t('Prepare repositories and rescan', '저장소를 준비하고 다시 찾기'))], defaultValue: 'empty' }));
          if (cancelled(empty)) return null;
          if (empty === PROMPT_BACK || empty === 'rescan') { await refresh(); continue; }
          if (empty !== 'empty') throw invalid('Confirm the empty workspace or rescan.');
        }
        if (editing) { position = steps().indexOf('review'); editing = false; }
        else position++;
        continue;
      }
      if (id === 'review') {
        const normalized = normalizeBootstrapOptions(selected);
        const preview = await bootstrapProject({ ...normalized, dryRun: true });
        const review = { target: selected.target, dryRun: Boolean(selected.dryRun), ...preview.selection, repositories: selected.repositories ?? [], operations: preview.operations, preserved: preview.preserved, exclusion: preview.exclusion, warnings: preview.warnings };
        const choices = setupChoices(lang(), git);
        const reviewText = [t('Setup folder: ', '설정할 폴더: ') + selected.target,
          ...['kind', 'exclude', 'records', 'agents'].map((key) => (choices[key].find((entry) => entry.value === normalized[key])?.label ?? normalized[key])),
          t('Language: ', '문서 언어: ') + (lang() === 'ko' ? '한국어' : 'English'),
          ...(selected.kind === 'workspace' ? [t('Repositories: ', '저장소: ') + review.repositories.map((repo) => repo.path).join(', ')] : []),
          t('Files to change: ', '변경할 파일: ') + (review.operations.join(', ') || t('none', '없음')),
          ...(review.preserved.length ? [t('Preserved files: ', '보존할 파일: ') + review.preserved.join(', ')] : []),
          ...(review.dryRun ? [t('Preview only. No files will change.', '미리보기만 합니다. 파일을 변경하지 않습니다.')] : []),
          ...review.warnings.map((message) => setupWarning(message, lang()))].join('\n');
        const answer = await ask(question(id, { review, reviewText, defaultValue: 'yes', choices: [
          item('yes', selected.dryRun ? t('Finish preview', '미리보기 마치기') : t('Apply these changes', '이 내용으로 적용하기')),
          item('edit', t('Change a setting', '설정 수정하기')), item('no', t('Cancel', '취소'))] }));
        if (cancelled(answer) || answer === false || answer === 'no' || answer === 'n') return null;
        if (answer === PROMPT_BACK) { position--; continue; }
        if (answer === 'edit') {
          const fields = route.filter((key) => !['scope', 'prepare', 'review'].includes(key));
          const field = await ask(question('edit', { message: t('Choose a setting to change', '수정할 항목을 선택하세요'), choices: fields.map((key) => item(key, titles()[key])), defaultValue: 'exclude' }));
          if (cancelled(field)) return null;
          if (field === PROMPT_BACK) continue;
          if (!fields.includes(field)) throw invalid('Unknown setup field.');
          position = route.indexOf(field); editing = true; continue;
        }
        if (answer !== true && !/^(?:yes|y)$/i.test(String(answer).trim())) throw invalid('Final review requires an explicit choice.');
        notify(); return normalized;
      }

      const choices = setupChoices(lang(), git)[id];
      const recommended = { exclude: git ? 'local' : 'none', records: 'standard', agents: 'preserve' }[id];
      const prepared = choices.map((entry) => ({ ...entry, recommended: entry.value === recommended, current: entry.value === saved[id],
        ...(id === 'kind' && context.workspace && entry.value === 'single' ? { disabled: true, disabledReason: t('This is an existing workspace; bootstrap preserves its registry.', '이미 등록된 작업 공간입니다. bootstrap은 기존 저장소 목록을 보존합니다.') } : {}) }));
      const answer = await ask(question(id, { choices: prepared, defaultValue: selected[id] ?? defaults()[id],
        intro: id === 'lang' ? ['q: Cancel / 취소', t('Setup folder: ', '설정할 폴더: ') + selected.target] : id === 'kind' ? folderGuide({ lang: lang(), target: selected.target, kind: 'single', name: context.name, exists: true }) : undefined,
        description: id === 'exclude' && !git ? t('No Git repository contains this setup folder. Local exclusion is shown below with its availability reason.', '이 설정 폴더를 포함하는 Git 저장소가 없습니다. 로컬 제외 항목에 사용할 수 없는 이유를 표시했습니다.') : undefined }));
      if (cancelled(answer)) return null;
      if (answer === PROMPT_BACK) { position = Math.max(0, position - 1); continue; }
      const value = String(answer).trim(), entry = prepared.find((candidate) => candidate.value === value);
      if (!entry || entry.disabled) throw invalid('Invalid ' + id + ' selection.');
      selected[id] = value;
      if (id === 'exclude' && value !== 'local') selected.localOnly = false;
      if (id === 'lang') notify();
      if (id === 'kind') {
        if (value !== 'workspace') delete selected.repositories;
        else if (context.workspace) selected.repositories = context.workspace.config.repositories.map((repo) => ({ ...repo }));
      }
      if (editing && id !== 'kind') { position = steps().indexOf('review'); editing = false; }
      else if (editing && id === 'kind' && !steps().includes('prepare') && !steps().includes('repositories')) { position = steps().indexOf('review'); editing = false; }
      else position++;
    }
  } catch (error) {
    if (error.name === 'AbortError') return null;
    throw error;
  } finally { terminal?.close(); }
}
