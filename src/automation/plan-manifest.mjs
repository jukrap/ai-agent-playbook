import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  activePlaybookMissingResult,
  requireTitle,
  resolvePlaybookLayout,
  slugifyTitle,
  todayIso
} from '../harness/core.mjs';

const PLAN_KIND = 'workflow.plan.v2';
const PLAN_SCHEMA_VERSION = '2';
const PLANS_DIR = ['workflows', 'plans'];
const RISKS = new Set(['low', 'medium', 'high']);
const APPROVAL_STATES = new Set(['draft', 'approved', 'rejected', 'superseded']);

export async function createAutomationPlan(options) {
  const {
    target,
    title,
    date = todayIso(),
    dryRun = false,
    force = false,
    language = 'auto'
  } = options;
  requireTitle(title);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Invalid --date; expected YYYY-MM-DD.');
  const missing = activePlaybookMissingResult(target);
  if (missing) return { ...missing, applied: false, files: [] };

  const slug = slugifyTitle(title);
  const root = path.join(resolvePlaybookLayout(target).root, ...PLANS_DIR);
  const markdownFile = path.join(root, `${date}-${slug}.md`);
  const manifestFile = path.join(root, `${date}-${slug}.plan.json`);
  const files = [markdownFile, manifestFile];
  const conflicts = force ? [] : files.filter((file) => existsSync(file));
  if (conflicts.length) {
    return {
      ok: false,
      applied: false,
      file: conflicts[0],
      markdownFile,
      manifestFile,
      files,
      operations: [],
      conflicts
    };
  }

  const resolvedLanguage = resolvePlanLanguage(language, title);
  const manifest = createDraftManifest({ title: title.trim(), slug, language: resolvedLanguage });
  const markdown = renderAutomationPlanMarkdown(manifest, path.basename(manifestFile), date);
  const operations = files.map((file) => `write ${file}`);
  if (!dryRun) {
    await mkdir(root, { recursive: true });
    await writeFile(markdownFile, markdown);
    await writeFile(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`);
  }

  return {
    schemaVersion: PLAN_SCHEMA_VERSION,
    kind: PLAN_KIND,
    ok: true,
    applied: !dryRun,
    markdownFile,
    manifestFile,
    files,
    operations,
    conflicts: []
  };
}

export function validateAutomationPlan(input) {
  if (typeof input === 'string') {
    return readFile(path.resolve(input), 'utf8')
      .then((text) => validateAutomationPlanObject(JSON.parse(text)))
      .catch((error) => invalidFileResult(error));
  }
  return validateAutomationPlanObject(input);
}

function validateAutomationPlanObject(manifest) {
  const conflicts = [];
  const warnings = [];
  if (!isRecord(manifest)) {
    return validationResult({ conflicts: [problem('plan.invalid-shape', 'Plan manifest must be an object.')], warnings, tasks: [] });
  }
  if (manifest.schemaVersion !== PLAN_SCHEMA_VERSION) conflicts.push(problem('plan.schema-version', 'schemaVersion must be "2".'));
  if (manifest.kind !== PLAN_KIND) conflicts.push(problem('plan.kind', `kind must be "${PLAN_KIND}".`));
  if (!isSafeId(manifest.planId)) conflicts.push(problem('plan.id.invalid', 'planId must be a portable lowercase id.'));
  if (typeof manifest.title !== 'string' || !manifest.title.trim()) conflicts.push(problem('plan.title.missing', 'title is required.'));
  if (!isRecord(manifest.approval) || !APPROVAL_STATES.has(manifest.approval.status)) {
    conflicts.push(problem('plan.approval.invalid', 'approval.status must be draft, approved, rejected, or superseded.'));
  }

  const tasks = Array.isArray(manifest.tasks) ? manifest.tasks : [];
  if (!Array.isArray(manifest.tasks) || tasks.length === 0) conflicts.push(problem('plan.tasks.missing', 'At least one task is required.'));
  const ids = new Set();
  let criteria = 0;
  let verificationCommands = 0;
  for (const task of tasks) {
    if (!isRecord(task)) {
      conflicts.push(problem('plan.task.invalid-shape', 'Every task must be an object.'));
      continue;
    }
    if (!isSafeId(task.id)) conflicts.push(problem('plan.task.invalid-id', 'Task ids must be portable lowercase ids.', [String(task.id ?? '')]));
    if (ids.has(task.id)) conflicts.push(problem('plan.task.duplicate-id', `Duplicate task id: ${task.id}.`, [task.id]));
    ids.add(task.id);
    if (typeof task.title !== 'string' || !task.title.trim()) conflicts.push(problem('plan.task.missing-title', `Task ${task.id ?? '<unknown>'} needs a title.`));
    if (!Array.isArray(task.dependsOn) || task.dependsOn.some((dependency) => !isSafeId(dependency))) {
      conflicts.push(problem('plan.task.invalid-dependencies', `Task ${task.id ?? '<unknown>'} has invalid dependencies.`));
    }
    if (!Number.isInteger(task.priority) || task.priority < 0 || task.priority > 1000) {
      conflicts.push(problem('plan.task.invalid-priority', `Task ${task.id ?? '<unknown>'} priority must be an integer from 0 to 1000.`));
    }
    if (!RISKS.has(task.risk)) conflicts.push(problem('plan.task.invalid-risk', `Task ${task.id ?? '<unknown>'} risk must be low, medium, or high.`));
    if (!isSafeId(task.deliveryGroup)) conflicts.push(problem('plan.task.invalid-delivery-group', `Task ${task.id ?? '<unknown>'} has an invalid deliveryGroup.`));
    if (typeof task.remoteEligible !== 'boolean') conflicts.push(problem('plan.task.invalid-remote-eligibility', `Task ${task.id ?? '<unknown>'} remoteEligible must be boolean.`));
    if (task.paths !== undefined && (!Array.isArray(task.paths) || task.paths.some((taskPath) => !isSafePlanPath(taskPath)))) {
      conflicts.push(problem('plan.task.path-unsafe', `Task ${task.id ?? '<unknown>'} paths must contain only safe project-relative paths.`, [task.id]));
    }

    const taskCriteria = Array.isArray(task.acceptanceCriteria) ? task.acceptanceCriteria : [];
    criteria += taskCriteria.length;
    if (taskCriteria.length === 0) warnings.push(problem('plan.task.criteria-missing', `Task ${task.id ?? '<unknown>'} has no acceptance criteria.`, [task.id]));
    for (const criterion of taskCriteria) {
      if (!isRecord(criterion) || !isSafeId(criterion.id) || typeof criterion.text !== 'string' || !criterion.text.trim()) {
        conflicts.push(problem('plan.criterion.invalid', `Task ${task.id ?? '<unknown>'} has an invalid acceptance criterion.`, [task.id]));
      }
    }

    const commands = Array.isArray(task.verificationCommands) ? task.verificationCommands : [];
    verificationCommands += commands.length;
    if (commands.length === 0) warnings.push(problem('plan.task.verification-missing', `Task ${task.id ?? '<unknown>'} has no verification command.`, [task.id]));
    for (const command of commands) {
      if (!isRecord(command) || !isSafeId(command.id) || !isSafeArgv(command.argv)) {
        conflicts.push(problem('plan.verification.unsafe-argv', `Task ${task.id ?? '<unknown>'} has an unsafe verification argv.`, [task.id]));
      }
    }
  }

  for (const task of tasks) {
    if (!isRecord(task) || !Array.isArray(task.dependsOn)) continue;
    for (const dependency of task.dependsOn) {
      if (!ids.has(dependency)) conflicts.push(problem('plan.task.unknown-dependency', `Task ${task.id} depends on unknown task ${dependency}.`, [task.id, dependency]));
    }
  }
  if (hasCycle(tasks)) conflicts.push(problem('plan.task.cycle', 'Task dependency graph contains a cycle.'));
  if (manifest.approval?.status !== 'approved') warnings.push(problem('plan.not-approved', 'Plan is not approved for automation.'));

  const complete = tasks.length > 0 && tasks.every((task) => (
    Array.isArray(task?.acceptanceCriteria) && task.acceptanceCriteria.length > 0 &&
    Array.isArray(task?.verificationCommands) && task.verificationCommands.length > 0
  ));
  return validationResult({
    conflicts,
    warnings,
    tasks,
    criteria,
    verificationCommands,
    ready: conflicts.length === 0 && manifest.approval?.status === 'approved' && complete
  });
}

function createDraftManifest({ title, slug, language }) {
  const implementationId = `${slug}-implementation`;
  const verificationId = `${slug}-verification`;
  const korean = language === 'ko';
  return {
    schemaVersion: PLAN_SCHEMA_VERSION,
    kind: PLAN_KIND,
    planId: slug,
    title,
    language,
    approval: { status: 'draft', approvedAt: null },
    tasks: [
      {
        id: implementationId,
        title: korean ? '첫 구현 단위' : 'First implementation slice',
        dependsOn: [],
        priority: 100,
        risk: 'medium',
        acceptanceCriteria: [],
        verificationCommands: [],
        paths: [],
        deliveryGroup: 'implementation',
        remoteEligible: true
      },
      {
        id: verificationId,
        title: korean ? '검증 및 정리' : 'Verification and cleanup',
        dependsOn: [implementationId],
        priority: 50,
        risk: 'low',
        acceptanceCriteria: [],
        verificationCommands: [],
        paths: [],
        deliveryGroup: 'verification',
        remoteEligible: false
      }
    ]
  };
}

function renderAutomationPlanMarkdown(manifest, sidecar, date) {
  if (manifest.language === 'ko') {
    return `# ${manifest.title}\n\n상태: 초안\n날짜: ${date}\n구조화 계획: ${sidecar} (${PLAN_KIND})\n\n## 목표\n\n승인할 결과를 설명합니다.\n\n## 작업\n\n${manifest.tasks.map((task) => `- [ ] ${task.id}: ${task.title}`).join('\n')}\n\n## 승인\n\n범위, 수용 기준, 검증 argv를 모두 작성한 뒤에만 sidecar의 \`approval.status\`를 \`approved\`로 설정합니다.\n\n## 검증\n\ncontroller는 각 argv를 shell 없이 실행하고 새 증거를 실행 원장에 기록합니다.\n`;
  }
  return `# ${manifest.title}\n\nStatus: draft\nDate: ${date}\nStructured plan: ${sidecar} (${PLAN_KIND})\n\n## Goal\n\nDescribe the approved outcome.\n\n## Tasks\n\n${manifest.tasks.map((task) => `- [ ] ${task.id}: ${task.title}`).join('\n')}\n\n## Approval\n\nSet \`approval.status\` to \`approved\` in the sidecar only after scope, acceptance criteria, and verification argv are complete.\n\n## Verification\n\nThe controller runs each argv without a shell and records fresh evidence in the execution ledger.\n`;
}

function resolvePlanLanguage(language, title) {
  const normalized = String(language ?? 'auto').trim().toLowerCase();
  if (normalized === 'ko' || normalized.startsWith('ko-')) return 'ko';
  if (normalized === 'en' || normalized.startsWith('en-')) return 'en';
  return /[\u3131-\u318e\uac00-\ud7a3]/u.test(title) ? 'ko' : 'en';
}

function hasCycle(tasks) {
  const graph = new Map();
  for (const task of tasks.filter(isRecord)) {
    if (!graph.has(task.id)) graph.set(task.id, Array.isArray(task.dependsOn) ? task.dependsOn : []);
  }
  const visiting = new Set();
  const visited = new Set();
  const visit = (id) => {
    if (visiting.has(id)) return true;
    if (visited.has(id) || !graph.has(id)) return false;
    visiting.add(id);
    if (graph.get(id).some((dependency) => visit(dependency))) return true;
    visiting.delete(id);
    visited.add(id);
    return false;
  };
  return [...graph.keys()].some((id) => visit(id));
}

function isSafeArgv(argv) {
  if (!Array.isArray(argv) || argv.length === 0) return false;
  if (typeof argv[0] !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._+/-]*$/.test(argv[0]) || argv[0].includes('..')) return false;
  return argv.every((part) => typeof part === 'string' && part.length > 0 && !/[\0\r\n]/.test(part));
}

function isSafePlanPath(value) {
  if (typeof value !== 'string' || !value.trim() || /[\u0000-\u001f\u007f]/u.test(value)) return false;
  const raw = value.trim();
  const normalized = raw.replace(/\\/g, '/');
  if (path.isAbsolute(raw) || path.posix.isAbsolute(normalized) || /^[A-Za-z]:[\\/]/.test(raw) || raw.startsWith('\\\\')) return false;
  return normalized.split('/').every((part) => part && part !== '.' && part !== '..');
}

function isSafeId(value) {
  return typeof value === 'string' && /^[a-z0-9][a-z0-9._-]{0,99}$/.test(value) && !value.includes('..');
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function problem(id, message, paths = []) {
  return { id, message, paths };
}

function validationResult(options) {
  const { conflicts, warnings, tasks, criteria = 0, verificationCommands = 0, ready = false } = options;
  return {
    schemaVersion: PLAN_SCHEMA_VERSION,
    kind: 'workflow.plan-validation.v2',
    ok: conflicts.length === 0,
    ready,
    summary: {
      tasks: tasks.length,
      criteria,
      verificationCommands,
      warnings: warnings.length,
      conflicts: conflicts.length
    },
    warnings,
    conflicts
  };
}

function invalidFileResult(error) {
  return validationResult({
    conflicts: [problem('plan.file.invalid', `Could not read plan manifest: ${error.message}`)],
    warnings: [],
    tasks: []
  });
}

export const AUTOMATION_PLAN_KIND = PLAN_KIND;
