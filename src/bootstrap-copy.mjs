import path from 'node:path';

export const say = (lang, en, ko) => lang === 'ko' ? ko : en;
export function setupChoices(lang, git) {
  const t = (en, ko) => say(lang, en, ko);
  return {
    lang: [{ value: 'en', label: 'English' }, { value: 'ko', label: '한국어' }],
    kind: [
      { value: 'single', label: t('One project', '한 프로젝트'), description: t('Keep records beside the project code in this folder.', '이 폴더의 프로젝트 코드와 함께 기록을 둡니다.') },
      { value: 'workspace', label: t('Several repositories', '여러 저장소'), description: t('Keep shared records in a parent folder containing the repositories.', '여러 저장소가 들어 있는 상위 폴더에 공통 기록을 둡니다.') }
    ],
    exclude: [
      { value: 'local', label: t('Local only (info/exclude)', '이 컴퓨터에서 제외 (info/exclude)'), description: t('Use Git info/exclude. Linked worktrees may share this rule.', 'Git info/exclude에 등록합니다. 연결된 worktree에도 적용될 수 있습니다.'), disabled: !git,
        disabledReason: !git ? t('This folder is outside a Git repository. Records outside child repositories need no child ignore rule.', '이 폴더는 Git 저장소 밖입니다. 기록이 하위 저장소 밖에 있으면 하위 저장소의 제외 규칙은 필요 없습니다.') : undefined },
      { value: 'shared', label: t('Share the ignore rule with the team', '팀과 제외 규칙 공유하기'), description: t('Add the rule to .gitignore; commit that file when you want to share it.', '.gitignore에 규칙을 추가합니다. 이 파일을 커밋하면 팀과 공유됩니다.') },
      { value: 'none', label: t('Add no ignore rule', '제외 규칙 추가 안 함'), description: t('Remove only unchanged rules owned by this setup; preserve user rules.', '이 설치가 관리하는 수정되지 않은 규칙만 제거하며 사용자 규칙은 보존합니다.') },
      { value: 'global', label: t('Apply across repositories (advanced)', '여러 저장소에 공통 적용하기 (고급)'), description: t('Use the user Git ignore file. All repositories reading that file are affected.', '사용자 Git 제외 파일에 등록합니다. 이 파일을 읽는 모든 저장소에 영향을 줍니다.') }
    ],
    records: [
      { value: 'standard', label: t('Current state, worklogs and knowledge', '현재 상태 + 작업 기록 + 업무 지식'), description: t('Add writing guides; create monthly logs and topic documents when needed.', '작성 안내를 추가합니다. 월별 작업 기록과 주제별 지식 문서는 필요할 때 만듭니다.') },
      { value: 'minimal', label: t('Start with current state only', '현재 상태부터 시작하기'), description: t('Create CURRENT.md and setup metadata. Add detailed records later.', 'CURRENT.md와 설치 정보를 만듭니다. 상세 기록은 나중에 추가할 수 있습니다.') }
    ],
    agents: [
      { value: 'preserve', label: t('Keep existing agent instructions', '기존 에이전트 지침 유지하기'), description: t('Leave AGENTS.md as it is.', 'AGENTS.md를 그대로 둡니다.') },
      { value: 'link', label: t('Add a link to the records', '지침에 기록 링크 연결하기'), description: t('Append a short link to AGENTS.md; create that file if absent.', 'AGENTS.md에 짧은 기록 링크를 덧붙입니다. 파일이 없으면 만듭니다.') }
    ]
  };
}

export function folderGuide({ lang, target, kind, name = '.ai-agent-playbook', exists = false }) {
  const t = (en, ko) => say(lang, en, ko);
  const root = path.basename(target) || target;
  const lines = [t('Setup folder: ', '설정할 폴더: ') + target, t('Record folder: ', '기록을 둘 곳: ') + path.join(target, name)];
  if (exists) return [...lines, t('Existing documents are preserved. Review only the changes you need.', '기존 문서는 보존합니다. 필요한 설정 변경만 확인하세요.')];
  return [...lines, '', ...(kind === 'workspace' ? [
    root + '/', '  ' + name + '/  ' + t('(shared records)', '(공통 기록)'), '  web/                ' + t('(repository)', '(저장소)'), '  api/                ' + t('(repository)', '(저장소)'),
    '', t('Put or clone your repositories inside this parent folder before continuing. Names such as web/api are examples.', '계속하기 전에 이 상위 폴더 안에 저장소를 두거나 clone하세요. web/api는 폴더 이름의 예시입니다.'),
    t('You can prepare them in another terminal or file manager, then choose Ready to scan again.', '다른 터미널이나 탐색기에서 폴더를 준비한 뒤 준비 완료를 선택하면 다시 찾습니다.'),
    t('An empty workspace is also possible; register repositories later with workspace add.', '저장소가 아직 없어도 빈 작업 공간을 만들고 나중에 workspace add로 등록할 수 있습니다.')
  ] : [
    root + '/', '  ' + name + '/', '  ' + t('(your project files)', '(프로젝트 파일)'), '',
    t('Run setup in the folder containing this project. If this is the wrong folder, cancel, change directory and run bootstrap again.', '이 프로젝트의 파일이 있는 폴더에서 설치하세요. 위치가 다르면 취소한 뒤 올바른 폴더로 이동해 bootstrap을 다시 실행하세요.')
  ]), t('AAPB creates the record folder after your final review. It does not move or clone repositories.', 'AAPB는 마지막 확인 후 기록 폴더를 만듭니다. 저장소 이동이나 clone은 직접 준비하세요.')];
}

export function setupWarning(message, lang) {
  if (lang !== 'ko') return message;
  if (message.startsWith('Global impact:')) return '전역 제외 파일을 읽는 다른 저장소에도 영향을 줍니다. 기존 Git 설정을 유지하고 변경 전 파일을 백업합니다.';
  if (message.startsWith('Git local exclusions')) return 'info/exclude는 연결된 worktree와 함께 사용할 수 있습니다.';
  if (message.startsWith('Local Git exclusion was not applied')) return '이 폴더는 Git 저장소 밖이므로 로컬 제외를 적용하지 않았습니다. 기록은 사용할 수 있습니다.';
  if (message.startsWith('Only unchanged AAPB-owned')) return '기존 규칙 중 이 설치가 관리하며 수정되지 않은 항목만 제거합니다. 사용자 규칙은 계속 적용될 수 있습니다.';
  if (message.startsWith('This target has no Git')) return '이 폴더는 Git 저장소 밖입니다. 제외 규칙은 해당 파일을 읽는 저장소에서만 적용됩니다.';
  if (message.startsWith('Registered member uses')) return '이 저장소는 상위 폴더의 공통 기록을 사용합니다. 설치 설정은 그 상위 폴더에서 변경하세요.';
  if (message.startsWith('Existing workspace membership')) return '기존 저장소 목록을 보존했습니다. 등록 변경은 workspace add/remove로 진행하세요.';
  if (message.startsWith('Selected metadata was not persisted')) return '기존 설치 정보가 수정됐거나 AAPB 소유임을 확인할 수 없어 보존했습니다. 선택한 언어·기록 구성은 설치 정보에 반영되지 않았습니다.';
  if (message.startsWith('Edited or ambiguous')) return '수정됐거나 소유자를 확인할 수 없는 기존 제외 규칙을 보존합니다: ' + (message.match(/in (.+)\.$/)?.[1] ?? '');
  const tracked = message.match(/^(\d+) tracked playbook/);
  if (tracked) return `이미 Git이 추적하는 기록 파일 ${tracked[1]}개는 계속 추적됩니다. 제외 규칙으로 추적이 해제되지는 않습니다.`;
  return message;
}

export function formatBootstrapOutcome(result, lang = 'en') {
  const t = (en, ko) => say(lang, en, ko);
  if (result.cancelled) return t('Setup cancelled. No files changed.\n', '설정을 취소했습니다. 파일은 변경하지 않았습니다.\n');
  const lines = [result.applied ? t('Setup applied.', '설정을 적용했습니다.') : result.dryRun ? t('Preview complete. No files changed.', '미리보기를 마쳤습니다. 파일은 변경하지 않았습니다.') : t('Setup checked. No files changed.', '설정을 확인했습니다. 변경된 파일은 없습니다.')];
  if (result.recordDirectory) lines.push(t('Records: ', '기록 위치: ') + result.recordDirectory);
  if (result.operations?.length) lines.push(t('Files in this operation: ', '이번 작업의 파일: ') + result.operations.join(', '));
  if (result.backup) lines.push(t('Recovery backup: ', '복구용 백업: ') + result.backup);
  for (const warning of result.warnings ?? []) lines.push(t('Note: ', '참고: ') + setupWarning(warning, lang));
  if (result.dryRun) lines.push(t('To apply, run bootstrap again without --dry-run.', '적용하려면 --dry-run을 빼고 bootstrap을 다시 실행하세요.'));
  else lines.push(t('Read the current state with: ai-agent-playbook records read', '현재 상태 확인: ai-agent-playbook records read'));
  return lines.join('\n') + '\n';
}
