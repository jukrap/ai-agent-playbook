import path from 'node:path';
import {
  checkGuides,
  doctorProject,
  SCHEMA_VERSION
} from '../harness.mjs';
import {
  assertDirectory,
  operatorCheckForDiagnostics,
  operatorCheckForDoctor,
  operatorCheckForGuides,
  operatorCheckForRules,
  summarizeChecks
} from './shared.mjs';
import { checkDiagnostics } from './diagnostics.mjs';
import { checkRules } from './rules.mjs';

export async function checkOperator(options) {
  const {
    repoRoot,
    target,
    filePath,
    includeDiff = false
  } = options;
  await assertDirectory(target, 'Target repository does not exist');

  const resolvedTarget = path.resolve(target);
  const [doctor, guides, diagnostics, rules] = await Promise.all([
    doctorProject({ target: resolvedTarget }),
    checkGuides({ repoRoot, target: resolvedTarget, includeDiff }),
    checkDiagnostics({ target: resolvedTarget }),
    checkRules({ target: resolvedTarget, filePath })
  ]);

  const checks = [
    operatorCheckForDoctor(doctor),
    operatorCheckForGuides(guides),
    operatorCheckForDiagnostics(diagnostics),
    operatorCheckForRules(rules)
  ];
  const summary = summarizeChecks(checks);

  return {
    schemaVersion: SCHEMA_VERSION,
    ok: summary.fail === 0,
    target: resolvedTarget,
    ...(rules.path === undefined ? {} : { path: rules.path }),
    summary: {
      sections: checks.length,
      ...summary
    },
    checks,
    sections: {
      doctor,
      guides,
      diagnostics,
      rules
    }
  };
}
