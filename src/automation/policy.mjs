const PROFILE_RANK = new Map([
  ['off', 0],
  ['observe', 1],
  ['coordinate', 2],
  ['deliver', 3],
  ['release', 4]
]);

export function deriveAutomationPolicy(options = {}) {
  const configuredProfile = normalizeProfile(options.configuredProfile ?? 'deliver');
  const requestedProfile = options.requestedProfile === undefined
    ? configuredProfile
    : normalizeProfile(options.requestedProfile);
  const reasons = [];
  let authorityProfile = lowerProfile(configuredProfile, requestedProfile);
  if (PROFILE_RANK.get(requestedProfile) > PROFILE_RANK.get(configuredProfile)) {
    reasons.push(reason('policy.expansion-ignored', `Requested ${requestedProfile} authority exceeds configured ${configuredProfile} authority.`));
  }

  const base = capabilitiesFor(authorityProfile);
  const policy = {
    schemaVersion: '2',
    kind: 'automation.effective-policy.v2',
    profile: authorityProfile,
    network: true,
    automation: { ...base.automation },
    remote: { ...base.remote },
    git: { ...base.git },
    destructive: {
      merge: false,
      release: false,
      delete: false,
      forcePush: false,
      protectedBranchWrite: false
    },
    reasons
  };

  if (options.remoteReadOnly) {
    policy.profile = lowerProfile(policy.profile, 'observe');
    policy.remote.write = false;
    policy.git.push = false;
    reasons.push(reason('policy.flag.remote-read-only', 'Remote mutations and Git push are disabled by --remote-read-only.'));
  }
  if (options.noRemote) {
    disableRemote(policy);
    reasons.push(reason('policy.flag.no-remote', 'Remote forge access and Git push are disabled by --no-remote.'));
  }
  if (options.noGit) {
    policy.git = { branch: false, commit: false, push: false };
    reasons.push(reason('policy.flag.no-git', 'Git mutations are disabled by --no-git.'));
  }
  if (options.offline) {
    policy.network = false;
    disableRemote(policy);
    reasons.push(reason('policy.flag.offline', 'Network access is disabled by --offline.'));
  }
  if (explicitRemoteDeny(options.instruction)) {
    disableRemote(policy);
    reasons.push(reason('policy.instruction.remote-deny', 'The current request explicitly opts out of remote forge operations.'));
  }

  return policy;
}

function capabilitiesFor(profile) {
  const rank = PROFILE_RANK.get(profile);
  return {
    automation: {
      coordinate: rank >= 2,
      execute: rank >= 3
    },
    remote: {
      read: rank >= 1,
      write: rank >= 2
    },
    git: {
      branch: rank >= 3,
      commit: rank >= 3,
      push: rank >= 3
    }
  };
}

function disableRemote(policy) {
  policy.remote.read = false;
  policy.remote.write = false;
  policy.git.push = false;
}

function explicitRemoteDeny(input) {
  if (typeof input !== 'string' || !input.trim()) return false;
  const text = input.normalize('NFKC').toLowerCase();
  if (/(금지|중단|멈춰|하지\s*(?:마|않(?:겠|도록|습니다))|안\s*하(?:겠|도록)|올리지\s*않(?:겠|도록|습니다)|(?:업로드|푸시)하지\s*않(?:겠|도록|습니다)|비활성).{0,16}(기능|정책|문서|테스트|예시|표현|문구)/u.test(text)) return false;
  const koreanScope = '(?:github|gitea|깃허브|기테아|원격|remote|push|푸시|동기화|업로드)';
  const koreanDeny = '(?:금지(?:다|합니다)?|중단|멈춰|제외|하지\\s*(?:마|않(?:겠|도록|습니다))|안\\s*하(?:겠|도록)|올리지\\s*않(?:겠|도록|습니다)|(?:업로드|푸시)하지\\s*않(?:겠|도록|습니다)|비활성(?:화)?)';
  if (new RegExp(`${koreanScope}.{0,32}${koreanDeny}`, 'u').test(text)) return true;
  if (new RegExp(`${koreanDeny}.{0,32}${koreanScope}`, 'u').test(text)) return true;
  if (/(?:이번(?:에는|\s*작업(?:은|에서는)?)|이\s*작업(?:은|에서는)?).{0,24}(?:로컬|local)(?:에서|에)?만(?:\s*(?:진행|보관|작업|처리))?/u.test(text)) return true;
  if (/(?:로컬|local)(?:에|에서)?만\s*(?:보관|진행)(?:하|해|할|하겠|합니다)/u.test(text)) return true;
  return (
    /\bno[- ]remote\b/.test(text) ||
    /\boffline[- ]only\b/.test(text) ||
    /\bkeep\s+(?:this|it|the\s+change)\s+local\b/.test(text) ||
    /\bopt\s+out\s+of\s+(?:remote|forge|github|gitea)/.test(text) ||
    /\b(?:do\s+not|don't)\s+(?:publish|push|sync|update|use)\b.{0,40}\b(?:remote|forge|github|gitea)?/.test(text) ||
    /\b(?:remote|forge|github|gitea)\b.{0,24}\b(?:disabled|forbidden|prohibited)\b/.test(text)
  );
}

function normalizeProfile(value) {
  const profile = String(value).trim().toLowerCase();
  if (!PROFILE_RANK.has(profile)) throw new Error(`Unsupported automation profile: ${profile}.`);
  return profile;
}

function lowerProfile(left, right) {
  return PROFILE_RANK.get(left) <= PROFILE_RANK.get(right) ? left : right;
}

function reason(id, message) {
  return { id, message };
}
