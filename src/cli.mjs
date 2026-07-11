import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { checkAdapterReadiness, renderAdapterConfig } from './adapter-readiness.mjs';
import { analyzeOperator, auditOperator, checkDiagnostics, checkImageDiff, checkOperator, checkRules, checkTuiCapture, deltaOperator, gcOperator, mapOperator, preflightOperator, previewOperatorContext, researchOperator, searchOperator } from './operator-diagnostics.mjs';
import { lintSkills, runSkillsLifecycle } from './skills-lifecycle.mjs';
import { runMcpServer } from './mcp-server.mjs';
import { createAutomationPlan, validateAutomationPlan } from './automation/plan-manifest.mjs';
import { validateWorkflowPlan } from './automation/run-state.mjs';
import {
  applyAutomationReconcile,
  automationStartNeedsCoordination,
  automationStatus,
  linkAutomationForgeTasks,
  pauseAutomation,
  resumeAutomation,
  startAutomation,
  stopAutomation,
  superviseAutomation,
  tickAutomation
} from './automation/controller.mjs';
import { automationDoctor } from './automation/doctor.mjs';
import { scheduleAutomation } from './automation/scheduler.mjs';
import { deriveAutomationPolicy } from './automation/policy.mjs';
import { applyForgePlan, collectReadyForgeTasks, inspectForgeIssue, planForgeBootstrap, planForgeSync, reconcileForgeTask } from './forge/index.mjs';
import { createDefaultForgeTransport } from './forge/http-transport.mjs';
import {
  buildDependencyInventoryIndex,
  buildRouteApiHintsIndex,
  buildRuntimeIndex,
  buildSymbolOutlineIndex,
  buildReferenceAdoptionPlan,
  buildReferenceAdoptionQueue,
  buildReferenceAdoptionStatus,
  buildReferenceCapabilityMatrix,
  buildReferenceSourceRegistryPreview,
  buildProjectContext,
  buildDoctorReminderSignal,
  bootstrapProject,
  capabilityCatalog,
  checkContracts,
  checkEvidenceLocators,
  checkGuides,
  checkManagedManifest,
  checkCanonFacts,
  checkRuntimeSchema,
  checkWritingNaturalness,
  checkWritingNaturalnessReport,
  checkReferenceAdoptionLedger,
  checkReferenceSourceRegistry,
  catalogManagedManifest,
  contextStatus,
  createWriteGateAdvisory,
  createPlan,
  createWorklog,
  doctorProject,
  draftCanonFacts,
  initContext,
  initContracts,
  initReferenceAdoptionLedger,
  inspectReferenceProject,
  inventoryReferenceDirectory,
  listContexts,
  listContracts,
  describePlaybookLayout,
  migratePlaybookLayout,
  migratePlaybookPath,
  parseMaxChars,
  postCheckWriteGate,
  previewCapabilityHistory,
  previewHarnessConfig,
  previewRepoGraph,
  previewWorkflowRun,
  promoteCanonFacts,
  pythonEngineStatus,
  previewWriteGate,
  adoptManagedManifest,
  pruneManagedManifest,
  recordRun,
  runStatus,
  runtimeIndexStatus,
  searchRuntimeIndex,
  skillCatalog,
  snapshotContracts,
  startRun,
  startWorkflowRun,
  syncGuides,
  uninstallManagedManifest,
  updateReferenceAdoptionLedger,
  updateReferenceLedgerDecision,
  updateReferenceSourceRegistry,
  workflowCatalog,
  summarizeRun,
  summarizeWorklogs
} from './harness.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export async function runCli(argv, io = {}) {
  const stdout = io.stdout ?? process.stdout;
  const stderr = io.stderr ?? process.stderr;
  const cwd = io.cwd ?? process.cwd();
  const root = io.repoRoot ?? repoRoot;

  try {
    const parsed = parseArgs(argv);
    if (parsed.flags.version) {
      const packageJson = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
      write(stdout, `${packageJson.version}\n`);
      return 0;
    }
    if (parsed.positionals.length === 0 || parsed.flags.help) {
      write(stdout, helpText());
      return 0;
    }

    const [command, subcommand, targetArg] = parsed.positionals;
    if (command === 'mcp') {
      await runMcpServer({
        repoRoot: root,
        enableWriteTools: Boolean(parsed.flags['enable-write-tools']),
        enableForgeWriteTools: Boolean(parsed.flags['enable-forge-write-tools'])
      });
      return 0;
    }

    if (command === 'bootstrap') {
      const target = resolveTarget(cwd, subcommand);
      const result = await bootstrapProject({
        repoRoot: root,
        target,
        profile: parsed.flags.profile,
        localOnly: Boolean(parsed.flags['local-only']),
        dryRun: Boolean(parsed.flags['dry-run']),
        force: Boolean(parsed.flags.force)
      });
      printOperations(stdout, result.operations);
      if (!result.ok) {
        write(stderr, `Conflicts:\n${result.conflicts.map((item) => `- ${item}`).join('\n')}\nUse --force to overwrite.\n`);
        return 2;
      }
      return 0;
    }

    if (command === 'doctor') {
      const target = resolveTarget(cwd, subcommand);
      if (parsed.flags.reminder) {
        const result = await buildDoctorReminderSignal({ repoRoot: root, target });
        if (parsed.flags.json) {
          writeJson(stdout, result);
        } else if (result.reminders.length) {
          for (const reminder of result.reminders) {
            write(stdout, `[${reminder.level.toUpperCase()}] ${reminder.message}\n`);
          }
        } else {
          write(stdout, 'No doctor reminders.\n');
        }
        return 0;
      }
      const result = await doctorProject({ target, strict: Boolean(parsed.flags.strict) });
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else {
        for (const check of result.checks) {
          write(stdout, `[${check.level.toUpperCase()}] ${check.name}: ${check.message}\n`);
        }
      }
      return result.ok ? 0 : 1;
    }

    if (command === 'config' && subcommand === 'preview') {
      const result = await previewHarnessConfig({
        target: resolveTarget(cwd, targetArg),
        userConfigPath: resolveOptionalPath(cwd, parsed.flags['user-config'])
      });
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else {
        write(stdout, `Harness config: ${result.ok ? 'ok' : 'needs attention'}\n`);
        for (const [key, source] of Object.entries(result.sourceMap)) {
          write(stdout, `- ${key}: ${source}\n`);
        }
        for (const warning of result.warnings) {
          write(stdout, `[WARN] ${warning.message}\n`);
        }
        for (const conflict of result.conflicts) {
          write(stdout, `[CONFLICT] ${conflict.message}\n`);
        }
      }
      return result.ok ? 0 : 1;
    }

    if (command === 'guides' && subcommand === 'sync') {
      if (parsed.flags.check) {
        const result = await checkGuides({
          repoRoot: root,
          target: resolveTarget(cwd, targetArg),
          includeDiff: Boolean(parsed.flags.diff)
        });
        if (parsed.flags.json) {
          writeJson(stdout, result);
        } else {
          for (const guide of result.guides) {
            const suffix = guide.diff ? ` (first diff line ${guide.diff.firstDifferenceLine})` : '';
            write(stdout, `[${guide.status.toUpperCase()}] ${guide.path}${suffix}\n`);
          }
        }
        return result.ok ? 0 : 1;
      }
      const result = await syncGuides({
        repoRoot: root,
        target: resolveTarget(cwd, targetArg),
        dryRun: Boolean(parsed.flags['dry-run']),
        force: Boolean(parsed.flags.force)
      });
      printOperations(stdout, result.operations);
      if (!result.ok) {
        write(stderr, `Conflicts:\n${result.conflicts.map((item) => `- ${item}`).join('\n')}\nUse --force to overwrite.\n`);
        return 2;
      }
      return 0;
    }

    if (command === 'context' && subcommand === 'list') {
      const result = await listContexts({ target: resolveTarget(cwd, targetArg) });
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else {
        write(stdout, `Context files: ${result.summary.total}\n`);
        for (const context of result.contexts) {
          write(stdout, `[${context.priority}] ${context.path}\n`);
        }
      }
      return result.ok ? 0 : 1;
    }

    if (command === 'context' && subcommand === 'status') {
      const result = await contextStatus({
        target: resolveTarget(cwd, targetArg),
        filePath: parsed.flags.path
      });
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else {
        write(stdout, `Context matches: ${result.summary.applies}/${result.summary.total}\n`);
        for (const context of result.contexts) {
          write(stdout, `[${context.applies ? 'MATCH' : 'SKIP'}] ${context.path} (${context.reason})\n`);
        }
      }
      return result.ok ? 0 : 1;
    }

    if (command === 'context' && subcommand === 'init') {
      const result = await initContext({
        target: resolveTarget(cwd, targetArg),
        dryRun: Boolean(parsed.flags['dry-run'])
      });
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else {
        for (const operation of result.operations) {
          write(stdout, `[${operation.action.toUpperCase()}] ${operation.message}\n`);
        }
      }
      return result.ok ? 0 : 1;
    }

    if (command === 'context') {
      const result = await buildProjectContext({
        target: resolveTarget(cwd, subcommand),
        maxChars: parseMaxChars(parsed.flags['max-chars'])
      });
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else if (result.additionalContext) {
        write(stdout, `${result.additionalContext}\n`);
      } else {
        for (const warning of result.warnings) {
          write(stderr, `[WARN] ${warning.message}\n`);
        }
      }
      return result.ok ? 0 : 1;
    }

    if (command === 'run' && subcommand === 'start') {
      const result = await startRun({
        target: resolveTarget(cwd, targetArg),
        title: parsed.flags.title,
        dryRun: Boolean(parsed.flags['dry-run'])
      });
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else {
        write(stdout, `Run: ${result.runId}\n`);
        for (const operation of result.operations) {
          write(stdout, `[${operation.action.toUpperCase()}] ${operation.message}\n`);
        }
      }
      return result.ok ? 0 : 1;
    }

    if (command === 'run' && subcommand === 'status') {
      const result = await runStatus({
        target: resolveTarget(cwd, targetArg),
        runId: typeof parsed.flags['run-id'] === 'string' ? parsed.flags['run-id'] : undefined
      });
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else {
        write(stdout, `Run status: ${result.runId ?? 'none'} (${result.summary.events} event(s))\n`);
        for (const conflict of result.conflicts) {
          write(stdout, `[CONFLICT] ${conflict.message}\n`);
        }
      }
      return result.ok ? 0 : 1;
    }

    if (command === 'run' && subcommand === 'record') {
      const result = await recordRun({
        target: resolveTarget(cwd, targetArg),
        runId: parsed.flags['run-id'],
        type: parsed.flags.type,
        message: parsed.flags.message,
        status: parsed.flags.status === true ? undefined : parsed.flags.status,
        evidence: parsed.flags.evidence
      });
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else {
        for (const operation of result.operations) {
          write(stdout, `[${operation.action.toUpperCase()}] ${operation.message}\n`);
        }
        for (const conflict of result.conflicts) {
          write(stdout, `[CONFLICT] ${conflict.message}\n`);
        }
      }
      return result.ok ? 0 : 1;
    }

    if (command === 'run' && subcommand === 'summarize') {
      const result = await summarizeRun({
        target: resolveTarget(cwd, targetArg),
        runId: parsed.flags['run-id'],
        dryRun: Boolean(parsed.flags['dry-run']),
        force: Boolean(parsed.flags.force)
      });
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else {
        for (const operation of result.operations) {
          write(stdout, `[${operation.action.toUpperCase()}] ${operation.message}\n`);
        }
        for (const conflict of result.conflicts) {
          write(stdout, `[CONFLICT] ${conflict.message}\n`);
        }
      }
      return result.ok ? 0 : 1;
    }

    if (command === 'contracts' && subcommand === 'list') {
      const result = await listContracts({ target: resolveTarget(cwd, targetArg) });
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else {
        write(stdout, `Contracts: ${result.summary.total} (${result.summary.active} active, ${result.summary.pending} pending)\n`);
        for (const contract of result.contracts) {
          write(stdout, `[${contract.status.toUpperCase()}] ${contract.path}\n`);
        }
      }
      return result.ok ? 0 : 1;
    }

    if (command === 'contracts' && subcommand === 'check') {
      const result = await checkContracts({
        target: resolveTarget(cwd, targetArg),
        filePath: typeof parsed.flags.path === 'string' ? parsed.flags.path : undefined
      });
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else {
        write(stdout, `Contract matches: ${result.summary.matches}/${result.summary.total}\n`);
        for (const warning of result.warnings) {
          write(stdout, `[WARN] ${warning.message}\n`);
        }
      }
      return result.ok ? 0 : 1;
    }

    if (command === 'contracts' && subcommand === 'snapshot') {
      const result = await snapshotContracts({
        target: resolveTarget(cwd, targetArg),
        contractId: typeof parsed.flags.contract === 'string' ? parsed.flags.contract : undefined,
        apply: Boolean(parsed.flags.apply)
      });
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else {
        for (const operation of result.operations) {
          write(stdout, `[PLAN] ${operation.message}\n`);
        }
        for (const warning of result.warnings) {
          write(stdout, `[WARN] ${warning.message}\n`);
        }
        for (const conflict of result.conflicts) {
          write(stdout, `[CONFLICT] ${conflict.message}\n`);
        }
        if (!parsed.flags.apply) {
          write(stdout, 'Re-run with --apply to write the contract hash snapshot.\n');
        }
      }
      return result.ok ? 0 : 1;
    }

    if (command === 'contracts' && subcommand === 'init') {
      const result = await initContracts({
        target: resolveTarget(cwd, targetArg),
        dryRun: Boolean(parsed.flags['dry-run'])
      });
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else {
        for (const operation of result.operations) {
          write(stdout, `[${operation.action.toUpperCase()}] ${operation.message}\n`);
        }
      }
      return result.ok ? 0 : 1;
    }

    if (command === 'migrate' && subcommand === 'path') {
      const result = await migratePlaybookPath({
        target: resolveTarget(cwd, targetArg),
        apply: Boolean(parsed.flags.apply)
      });
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else {
        for (const operation of result.operations) {
          write(stdout, `[PLAN] ${operation.message}\n`);
        }
        for (const warning of result.warnings) {
          write(stdout, `[WARN] ${warning.message}\n`);
        }
        for (const conflict of result.conflicts) {
          write(stdout, `[CONFLICT] ${conflict.message}\n`);
        }
        if (!parsed.flags.apply && result.operations.length > 0) {
          write(stdout, 'Re-run with --apply to perform this migration.\n');
        }
      }
      return result.ok ? 0 : 1;
    }

    if (command === 'migrate' && subcommand === 'layout') {
      const result = await migratePlaybookLayout({
        target: resolveTarget(cwd, targetArg),
        to: parsed.flags.to,
        apply: Boolean(parsed.flags.apply)
      });
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else {
        for (const operation of result.operations) {
          write(stdout, `[PLAN] ${operation.message}\n`);
        }
        for (const warning of result.warnings) {
          write(stdout, `[WARN] ${warning.message}\n`);
        }
        for (const conflict of result.conflicts) {
          write(stdout, `[CONFLICT] ${conflict.message}\n`);
        }
        if (!parsed.flags.apply && result.operations.length > 0) {
          write(stdout, 'Re-run with --apply to migrate to the structured playbook layout.\n');
        }
      }
      return result.ok ? 0 : 1;
    }

    if (command === 'skills' && subcommand === 'lint') {
      const result = await lintSkills({ repoRoot: root });
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else {
        write(stdout, `Skills lint: ${result.ok ? 'ok' : 'needs attention'}\n`);
        write(stdout, `Depth: ${result.summary.depth.skillLines.average} avg skill lines, ${result.summary.depth.referenceFiles} reference file(s), ${result.summary.depth.referenceLines.average} avg reference lines, ${result.summary.depth.shallowReferences} shallow reference(s)\n`);
        for (const skill of result.skills) {
          write(stdout, `[${skill.status.toUpperCase()}] ${skill.path}\n`);
        }
        for (const warning of result.warnings) {
          write(stdout, `[WARN] ${warning.message}\n`);
        }
        for (const conflict of result.conflicts) {
          write(stdout, `[CONFLICT] ${conflict.message}\n`);
        }
      }
      return result.ok ? 0 : 1;
    }

    if (command === 'skills' && ['check', 'install', 'update', 'uninstall'].includes(subcommand)) {
      const result = await runSkillsLifecycle({
        repoRoot: root,
        command: subcommand,
        codexRoot: resolveOptionalPath(cwd, parsed.flags['codex-root']),
        agentsRoot: resolveOptionalPath(cwd, parsed.flags['agents-root']),
        dryRun: Boolean(parsed.flags['dry-run']),
        forceManaged: Boolean(parsed.flags['force-managed']),
        forceUnmanaged: Boolean(parsed.flags['force-unmanaged'])
      });
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else {
        write(stdout, `Skills ${subcommand}: ${result.ok ? 'ok' : 'needs attention'}\n`);
        for (const operation of result.operations) {
          write(stdout, `[${operation.action.toUpperCase()}] ${operation.message}\n`);
        }
        for (const warning of result.warnings) {
          write(stdout, `[WARN] ${warning.message}\n`);
        }
        for (const conflict of result.conflicts) {
          write(stdout, `[CONFLICT] ${conflict.message}\n`);
        }
      }
      return result.ok ? 0 : 1;
    }

    if (command === 'catalog' && subcommand === 'list') {
      const result = await capabilityCatalog({ repoRoot: root });
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else {
        write(stdout, `Capability categories: ${result.summary.categories}, skills: ${result.summary.skills}, workflows: ${result.summary.workflows}\n`);
        for (const category of result.categories) {
          write(stdout, `[${category.id}] ${category.skills} skill(s), ${category.workflows} workflow(s) - ${category.description}\n`);
        }
      }
      return result.ok ? 0 : 1;
    }

    if (command === 'catalog' && subcommand === 'check') {
      const result = await skillCatalog({ repoRoot: root });
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else {
        write(stdout, `Skill taxonomy: ${result.summary.skills} skill(s), ${result.summary.wrappers} wrapper(s)\n`);
        for (const warning of result.warnings) {
          write(stdout, `[WARN] ${warning.message}\n`);
        }
        for (const conflict of result.conflicts) {
          write(stdout, `[CONFLICT] ${conflict.message}\n`);
        }
      }
      return result.ok ? 0 : 1;
    }

    if (command === 'workflow' && subcommand === 'list') {
      const result = workflowCatalog();
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else {
        write(stdout, `Workflow recipes: ${result.summary.workflows}\n`);
        for (const workflow of result.workflows) {
          write(stdout, `[${workflow.category}] ${workflow.id}: ${workflow.title}\n`);
        }
      }
      return 0;
    }

    if (command === 'workflow' && subcommand === 'run-preview') {
      const result = await previewWorkflowRun({
        repoRoot: root,
        target: resolveTarget(cwd, targetArg),
        recipeId: parsed.flags.recipe
      });
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else if (result.ok) {
        write(stdout, `Workflow run preview: ${result.recipe.id} (${result.recipe.source}), ${result.summary.verification} verification item(s)\n`);
      } else {
        write(stdout, `Workflow run preview: ${result.recipe.id} has ${result.summary.conflicts} conflict(s)\n`);
      }
      return result.ok ? 0 : 1;
    }

    if (command === 'workflow' && subcommand === 'run-start') {
      const result = await startWorkflowRun({
        repoRoot: root,
        target: resolveTarget(cwd, targetArg),
        recipeId: parsed.flags.recipe,
        apply: Boolean(parsed.flags.apply)
      });
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else if (result.ok) {
        write(stdout, `Workflow run start: ${result.runId} (${result.applied ? 'applied' : 'dry-run'})\n`);
        for (const operation of result.operations) {
          write(stdout, `[${operation.action.toUpperCase()}] ${operation.message}\n`);
        }
        if (!parsed.flags.apply) {
          write(stdout, 'Re-run with --apply to create workflow run files.\n');
        }
      } else {
        write(stdout, `Workflow run start: ${result.recipe.id} has ${result.summary.conflicts} conflict(s)\n`);
        for (const conflict of result.conflicts) {
          write(stdout, `[CONFLICT] ${conflict.message}\n`);
        }
      }
      return result.ok ? 0 : 1;
    }

    if (command === 'reference' && subcommand === 'inventory') {
      const result = await inventoryReferenceDirectory({
        target: resolveTarget(cwd, targetArg),
        maxProjects: parseMaxResults(parsed.flags['max-results'], 100)
      });
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else {
        write(stdout, `Reference inventory: ${result.summary.projects}/${result.summary.totalProjects} project(s), ${result.summary.files} file(s)\n`);
        for (const project of result.projects) {
          write(stdout, `[${project.id}] ${project.candidateCapabilities.join(', ') || 'unclassified'} (${project.files} file(s))\n`);
        }
      }
      return result.ok ? 0 : 1;
    }

    if (command === 'reference' && subcommand === 'inspect') {
      const result = await inspectReferenceProject({
        target: resolveTarget(cwd, targetArg),
        project: typeof parsed.flags.project === 'string' ? parsed.flags.project : undefined,
        maxDepth: parseMaxDepth(parsed.flags['max-depth'])
      });
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else if (result.ok) {
        write(stdout, `Reference inspect: ${result.project} [${String(result.summary.priority).toUpperCase()}] ${result.summary.files} file(s)\n`);
        for (const item of result.review.readOrder) {
          write(stdout, `[READ] ${item.path} - ${item.reason}\n`);
        }
        for (const question of result.review.adoptionQuestions) {
          write(stdout, `[QUESTION] ${question}\n`);
        }
      } else {
        write(stdout, `Reference inspect: blocked (${result.summary.conflicts} conflict(s))\n`);
        for (const conflict of result.conflicts) {
          write(stdout, `[CONFLICT] ${conflict.message}\n`);
        }
      }
      return result.ok ? 0 : 1;
    }

    if (command === 'reference' && subcommand === 'adoption-queue') {
      const result = await buildReferenceAdoptionQueue({
        target: resolveTarget(cwd, targetArg),
        maxResults: parseMaxResults(parsed.flags['max-results']),
        ledgerPath: resolveOptionalPath(cwd, parsed.flags.ledger)
      });
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else {
        write(stdout, `Reference adoption queue: ${result.summary.queueItems} item(s)\n`);
        for (const item of result.queue) {
          const ledgerStatus = item.ledgerStatus ? ` ledger=${item.ledgerStatus}` : '';
          write(stdout, `[${item.priority.toUpperCase()}] ${item.project} -> ${item.recommendedCapabilities.join(', ') || 'manual-review'} (${item.score})${ledgerStatus}\n`);
        }
      }
      return result.ok ? 0 : 1;
    }

    if (command === 'reference' && subcommand === 'capability-matrix') {
      const result = await buildReferenceCapabilityMatrix({
        target: resolveTarget(cwd, targetArg),
        maxResults: parseMaxResults(parsed.flags['max-results'], 100),
        ledgerPath: resolveOptionalPath(cwd, parsed.flags.ledger),
        capability: typeof parsed.flags.capability === 'string' ? parsed.flags.capability : undefined
      });
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else {
        write(stdout, `Reference capability matrix: ${result.summary.capabilities} capability group(s), ${result.summary.queueItems} queued reference(s)\n`);
        for (const group of Object.values(result.capabilities)) {
          const priorities = `high=${group.priorities.high ?? 0} medium=${group.priorities.medium ?? 0} low=${group.priorities.low ?? 0}`;
          const ledgerStatuses = Object.entries(group.ledgerStatuses)
            .map(([status, count]) => `${status}=${count}`)
            .join(' ');
          const ledgerSuffix = ledgerStatuses ? ` ledger=${ledgerStatuses}` : '';
          write(stdout, `[${group.capability}] ${group.projects} project(s), ${priorities}${ledgerSuffix}\n`);
        }
      }
      return result.ok ? 0 : 1;
    }

    if (command === 'reference' && subcommand === 'adoption-plan') {
      const result = await buildReferenceAdoptionPlan({
        target: resolveTarget(cwd, targetArg),
        capability: typeof parsed.flags.capability === 'string' ? parsed.flags.capability : undefined,
        maxResults: parseMaxResults(parsed.flags['max-results'], 5),
        ledgerPath: resolveOptionalPath(cwd, parsed.flags.ledger)
      });
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else if (result.ok) {
        write(stdout, `Reference adoption plan: ${result.plan.capability} (${result.summary.selectedReferences} selected reference(s))\n`);
        for (const item of result.plan.references) {
          const ledgerStatus = item.ledger?.status ? ` ledger=${item.ledger.status}` : '';
          const surfaces = item.suggestedSurfaces.map((surface) => surface.surface).join(', ');
          write(stdout, `[${item.priority.toUpperCase()}] ${item.project} (${item.score})${ledgerStatus}\n`);
          write(stdout, `  surfaces: ${surfaces || 'manual-review'}\n`);
          if (item.readOrder[0]) write(stdout, `  first-read: ${item.readOrder[0].path} - ${item.readOrder[0].reason}\n`);
        }
      } else {
        write(stdout, `Reference adoption plan: blocked (${result.summary.conflicts} conflict(s))\n`);
        for (const conflict of result.conflicts) {
          write(stdout, `[CONFLICT] ${conflict.message}\n`);
        }
      }
      return result.ok ? 0 : 1;
    }

    if (command === 'reference' && subcommand === 'adoption-status') {
      const result = await buildReferenceAdoptionStatus({
        target: resolveTarget(cwd, targetArg),
        referenceDir: resolveOptionalPath(cwd, parsed.flags['reference-dir']),
        filePath: typeof parsed.flags.path === 'string' ? parsed.flags.path : undefined,
        ledgerPath: typeof parsed.flags.ledger === 'string' ? parsed.flags.ledger : undefined,
        capability: typeof parsed.flags.capability === 'string' ? parsed.flags.capability : undefined,
        maxResults: parseMaxResults(parsed.flags['max-results'])
      });
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else {
        write(stdout, `Reference adoption status: ${result.summary.queueItems} item(s), sources ${result.summary.sourceRegistered}/${result.summary.queueItems}\n`);
        for (const item of result.items) {
          const sourceState = item.sourceRegistered ? `source=${item.sourceId}` : 'source=missing';
          write(stdout, `[${item.ledgerStatus}] ${item.project} ${sourceState} priority=${item.priority}\n`);
        }
        for (const warning of result.warnings) {
          write(stdout, `[WARN] ${warning.message}\n`);
        }
        for (const conflict of result.conflicts) {
          write(stdout, `[CONFLICT] ${conflict.message}\n`);
        }
      }
      return result.ok ? 0 : 1;
    }

    if (command === 'reference' && subcommand === 'source-registry-preview') {
      const result = await buildReferenceSourceRegistryPreview({
        target: resolveTarget(cwd, targetArg),
        maxResults: parseMaxResults(parsed.flags['max-results'])
      });
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else {
        write(stdout, `Reference source registry preview: ${result.summary.sources} source candidate(s)\n`);
        for (const source of result.registry.sources) {
          write(stdout, `[${source.priority.toUpperCase()}] ${source.id} -> ${source.recommendedCapabilities.join(', ') || 'manual-review'}\n`);
        }
      }
      return result.ok ? 0 : 1;
    }

    if (command === 'reference' && subcommand === 'source-registry-check') {
      const result = await checkReferenceSourceRegistry({
        target: resolveTarget(cwd, targetArg),
        filePath: typeof parsed.flags.path === 'string' ? parsed.flags.path : undefined,
        referenceDir: typeof parsed.flags['reference-dir'] === 'string' ? parsed.flags['reference-dir'] : undefined
      });
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else {
        write(stdout, `Reference source registry: ${result.ok ? 'ok' : 'needs attention'} (${result.summary.entries} source(s))\n`);
        for (const warning of result.warnings) {
          write(stdout, `[WARN] ${warning.message}\n`);
        }
        for (const conflict of result.conflicts) {
          write(stdout, `[CONFLICT] ${conflict.message}\n`);
        }
      }
      return result.ok ? 0 : 1;
    }

    if (command === 'reference' && subcommand === 'source-registry-update') {
      const result = await updateReferenceSourceRegistry({
        target: resolveTarget(cwd, targetArg),
        referenceDir: resolveOptionalPath(cwd, parsed.flags['reference-dir']),
        filePath: typeof parsed.flags.path === 'string' ? parsed.flags.path : undefined,
        maxResults: parseMaxResults(parsed.flags['max-results']),
        apply: Boolean(parsed.flags.apply)
      });
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else {
        const state = result.ok
          ? (result.applied ? 'written' : (result.summary.added > 0 ? 'preview' : 'up to date'))
          : 'blocked';
        write(stdout, `Reference source registry update: ${state} (${result.summary.added} new source${result.summary.added === 1 ? '' : 's'})\n`);
        for (const warning of result.warnings) {
          write(stdout, `[WARN] ${warning.message}\n`);
        }
        for (const conflict of result.conflicts) {
          write(stdout, `[CONFLICT] ${conflict.message}\n`);
        }
        if (result.ok && result.summary.added > 0 && !parsed.flags.apply) {
          write(stdout, 'Re-run with --apply to append missing reference source registry entries.\n');
        }
      }
      return result.ok ? 0 : 1;
    }

    if (command === 'reference' && subcommand === 'ledger-init') {
      const result = await initReferenceAdoptionLedger({
        target: resolveTarget(cwd, targetArg),
        referenceDir: resolveOptionalPath(cwd, parsed.flags['reference-dir']),
        filePath: typeof parsed.flags.path === 'string' ? parsed.flags.path : undefined,
        maxResults: parseMaxResults(parsed.flags['max-results']),
        apply: Boolean(parsed.flags.apply)
      });
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else {
        write(stdout, `Reference ledger init: ${result.ok ? (result.applied ? 'written' : 'preview') : 'blocked'} (${result.summary.entries} entr${result.summary.entries === 1 ? 'y' : 'ies'})\n`);
        for (const warning of result.warnings) {
          write(stdout, `[WARN] ${warning.message}\n`);
        }
        for (const conflict of result.conflicts) {
          write(stdout, `[CONFLICT] ${conflict.message}\n`);
        }
        if (result.ok && !parsed.flags.apply) {
          write(stdout, 'Re-run with --apply to write the reference adoption ledger.\n');
        }
      }
      return result.ok ? 0 : 1;
    }

    if (command === 'reference' && subcommand === 'ledger-update') {
      const result = await updateReferenceAdoptionLedger({
        target: resolveTarget(cwd, targetArg),
        referenceDir: resolveOptionalPath(cwd, parsed.flags['reference-dir']),
        filePath: typeof parsed.flags.path === 'string' ? parsed.flags.path : undefined,
        maxResults: parseMaxResults(parsed.flags['max-results']),
        apply: Boolean(parsed.flags.apply)
      });
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else {
        const state = result.ok
          ? (result.applied ? 'written' : (result.summary.added > 0 ? 'preview' : 'up to date'))
          : 'blocked';
        write(stdout, `Reference ledger update: ${state} (${result.summary.added} new row${result.summary.added === 1 ? '' : 's'})\n`);
        for (const warning of result.warnings) {
          write(stdout, `[WARN] ${warning.message}\n`);
        }
        for (const conflict of result.conflicts) {
          write(stdout, `[CONFLICT] ${conflict.message}\n`);
        }
        if (result.ok && result.summary.added > 0 && !parsed.flags.apply) {
          write(stdout, 'Re-run with --apply to append missing reference adoption ledger rows.\n');
        }
      }
      return result.ok ? 0 : 1;
    }

    if (command === 'reference' && subcommand === 'ledger-decision') {
      const result = await updateReferenceLedgerDecision({
        target: resolveTarget(cwd, targetArg),
        filePath: typeof parsed.flags.path === 'string' ? parsed.flags.path : undefined,
        referenceId: typeof parsed.flags.reference === 'string' ? parsed.flags.reference : undefined,
        status: typeof parsed.flags.status === 'string' ? parsed.flags.status : undefined,
        capability: typeof parsed.flags.capability === 'string' ? parsed.flags.capability : undefined,
        pattern: typeof parsed.flags.pattern === 'string' ? parsed.flags.pattern : undefined,
        adoption: typeof parsed.flags.adoption === 'string' ? parsed.flags.adoption : undefined,
        risk: typeof parsed.flags.risk === 'string' ? parsed.flags.risk : undefined,
        decisionDate: typeof parsed.flags['decision-date'] === 'string' ? parsed.flags['decision-date'] : undefined,
        apply: Boolean(parsed.flags.apply)
      });
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else {
        const state = result.ok
          ? (result.applied ? 'written' : (result.summary.changed ? 'preview' : 'up to date'))
          : 'blocked';
        write(stdout, `Reference ledger decision: ${state}\n`);
        if (result.decision) {
          write(stdout, `${result.decision.before.status} -> ${result.decision.after.status}: ${result.decision.referenceId}\n`);
        }
        for (const warning of result.warnings) {
          write(stdout, `[WARN] ${warning.message}\n`);
        }
        for (const conflict of result.conflicts) {
          write(stdout, `[CONFLICT] ${conflict.message}\n`);
        }
        if (result.ok && result.summary.changed && !parsed.flags.apply) {
          write(stdout, 'Re-run with --apply to update the reference adoption ledger row.\n');
        }
      }
      return result.ok ? 0 : 1;
    }

    if (command === 'reference' && subcommand === 'ledger-check') {
      const result = await checkReferenceAdoptionLedger({
        target: resolveTarget(cwd, targetArg),
        filePath: typeof parsed.flags.path === 'string' ? parsed.flags.path : undefined,
        strict: Boolean(parsed.flags.strict)
      });
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else {
        write(stdout, `Reference ledger: ${result.ok ? 'ok' : 'needs attention'} (${result.summary.entries} entr${result.summary.entries === 1 ? 'y' : 'ies'})\n`);
        for (const warning of result.warnings) {
          write(stdout, `[WARN] ${warning.message}\n`);
        }
        for (const conflict of result.conflicts) {
          write(stdout, `[CONFLICT] ${conflict.message}\n`);
        }
      }
      return result.ok ? 0 : 1;
    }

    if (command === 'layout' && subcommand === 'status') {
      const result = await describePlaybookLayout({ target: resolveTarget(cwd, targetArg) });
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else {
        write(stdout, `Playbook layout: ${result.layout.kind} (${result.layout.activeRoot})\n`);
        write(stdout, `Missing: ${result.summary.missingDirectories} directory item(s), ${result.summary.missingFiles} file(s)\n`);
      }
      return result.ok ? 0 : 1;
    }

    if (command === 'runtime' && subcommand === 'capability-history') {
      const result = await previewCapabilityHistory({ target: resolveTarget(cwd, targetArg) });
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else {
        write(stdout, `Capability history: ${result.summary.entries} entr${result.summary.entries === 1 ? 'y' : 'ies'}, ${result.summary.capabilities} capability signal(s)\n`);
        for (const warning of result.warnings) {
          write(stdout, `[WARN] ${warning.message}\n`);
        }
        for (const conflict of result.conflicts) {
          write(stdout, `[CONFLICT] ${conflict.message}\n`);
        }
      }
      return result.ok ? 0 : 1;
    }

    if (command === 'runtime' && subcommand === 'python-status') {
      const result = await pythonEngineStatus({ repoRoot: root });
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else {
        write(stdout, `Python engine: ${result.ok ? 'available' : 'unavailable'} (${result.summary.engineAvailable}/${result.summary.candidates} candidate(s))\n`);
        for (const warning of result.warnings) {
          write(stdout, `[WARN] ${warning.message}\n`);
        }
      }
      return 0;
    }

    if (command === 'runtime' && subcommand === 'schema-check') {
      const result = await checkRuntimeSchema({
        target: resolveTarget(cwd, targetArg),
        filePath: typeof parsed.flags.path === 'string' ? parsed.flags.path : '',
        kind: typeof parsed.flags.kind === 'string' ? parsed.flags.kind : undefined
      });
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else {
        write(stdout, `Runtime schema: ${result.ok ? 'ok' : 'needs attention'} (${result.summary.conflicts} conflict(s))\n`);
        for (const warning of result.warnings) {
          write(stdout, `[WARN] ${warning.message}\n`);
        }
        for (const conflict of result.conflicts) {
          write(stdout, `[CONFLICT] ${conflict.message}\n`);
        }
      }
      return result.ok ? 0 : 1;
    }

    if (command === 'evidence' && subcommand === 'locator-check') {
      const result = await checkEvidenceLocators({
        target: resolveTarget(cwd, targetArg),
        filePath: typeof parsed.flags.path === 'string' ? parsed.flags.path : ''
      });
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else {
        write(stdout, `Evidence locators: ${result.summary.locators} locator(s), ${result.summary.conflicts} conflict(s)\n`);
        for (const warning of result.warnings) {
          write(stdout, `[WARN] ${warning.message}\n`);
        }
        for (const conflict of result.conflicts) {
          write(stdout, `[CONFLICT] ${conflict.message}\n`);
        }
      }
      return result.ok ? 0 : 1;
    }

    if (command === 'writing' && subcommand === 'naturalness-check') {
      const result = await checkWritingNaturalness({
        repoRoot: root,
        target: resolveTarget(cwd, targetArg),
        filePath: typeof parsed.flags.path === 'string' ? parsed.flags.path : '',
        lang: typeof parsed.flags.lang === 'string' ? parsed.flags.lang : 'auto',
        engine: typeof parsed.flags.engine === 'string' ? parsed.flags.engine : 'auto'
      });
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else {
        write(stdout, `Writing naturalness: ${result.summary.findings} finding(s), ${result.language.analyzed}\n`);
        for (const finding of result.findings) {
          const first = finding.evidence[0];
          write(stdout, `[${finding.severity.toUpperCase()}] ${finding.id}${first ? `:${first.line}` : ''} ${finding.message}\n`);
        }
        for (const conflict of result.conflicts) {
          write(stdout, `[CONFLICT] ${conflict.message}\n`);
        }
      }
      return result.ok ? 0 : 1;
    }

    if (command === 'writing' && subcommand === 'naturalness-report') {
      const result = await checkWritingNaturalnessReport({
        repoRoot: root,
        target: resolveTarget(cwd, targetArg),
        rootPath: typeof parsed.flags.root === 'string' ? parsed.flags.root : '.',
        lang: typeof parsed.flags.lang === 'string' ? parsed.flags.lang : 'auto',
        engine: typeof parsed.flags.engine === 'string' ? parsed.flags.engine : 'auto',
        maxFiles: parsed.flags['max-files']
      });
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else {
        write(stdout, `Writing naturalness report: ${result.summary.files} file(s), ${result.summary.findings} finding(s)\n`);
        for (const file of result.files) {
          write(stdout, `[${file.summary.findings > 0 ? 'CHECK' : 'OK'}] ${file.path}: ${file.summary.findings} finding(s)\n`);
        }
        for (const conflict of result.conflicts) {
          write(stdout, `[CONFLICT] ${conflict.message}\n`);
        }
      }
      return result.ok ? 0 : 1;
    }

    if (command === 'index' && subcommand === 'build') {
      const result = await buildRuntimeIndex({
        target: resolveTarget(cwd, targetArg),
        apply: Boolean(parsed.flags.apply)
      });
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else {
        write(stdout, `Runtime index: ${result.summary.files} file(s), ${result.applied ? 'written' : 'preview'}\n`);
        if (!parsed.flags.apply) {
          write(stdout, 'Re-run with --apply to write the runtime index.\n');
        }
      }
      return result.ok ? 0 : 1;
    }

    if (command === 'index' && subcommand === 'status') {
      const result = await runtimeIndexStatus({ target: resolveTarget(cwd, targetArg) });
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else {
        write(stdout, `Runtime index: ${result.exists ? 'present' : 'missing'} (${result.summary.files} file(s))\n`);
      }
      return result.ok ? 0 : 1;
    }

    if (command === 'index' && subcommand === 'search') {
      const result = await searchRuntimeIndex({
        target: resolveTarget(cwd, targetArg),
        query: parsed.flags.query,
        maxResults: parseMaxResults(parsed.flags['max-results'])
      });
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else {
        write(stdout, `Runtime search: ${result.summary.matches} match(es)\n`);
        for (const item of result.results) {
          const first = item.snippets[0];
          write(stdout, `[${item.category}] ${item.path}${first ? `:${first.line} ${first.text}` : ''}\n`);
        }
      }
      return result.ok ? 0 : 1;
    }

    if (command === 'index' && subcommand === 'symbol-outline') {
      const result = await buildSymbolOutlineIndex({
        target: resolveTarget(cwd, targetArg),
        maxEntries: parseMaxResults(parsed.flags['max-results'], 100)
      });
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else {
        write(stdout, `Symbol outline: ${result.summary.entries} symbol(s), ${result.summary.filesScanned} file(s), preview\n`);
      }
      return result.ok ? 0 : 1;
    }

    if (command === 'index' && subcommand === 'dependency-inventory') {
      const result = await buildDependencyInventoryIndex({
        target: resolveTarget(cwd, targetArg)
      });
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else {
        write(stdout, `Dependency inventory: ${result.summary.manifests} manifest(s), ${result.summary.lockfiles} lockfile(s), preview\n`);
      }
      return result.ok ? 0 : 1;
    }

    if (command === 'index' && subcommand === 'route-api-hints') {
      const result = await buildRouteApiHintsIndex({
        target: resolveTarget(cwd, targetArg),
        maxHints: parseMaxResults(parsed.flags['max-results'], 100)
      });
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else {
        write(stdout, `Route/API hints: ${result.summary.hints} hint(s), ${result.summary.filesScanned} file(s), preview\n`);
      }
      return result.ok ? 0 : 1;
    }

    if (command === 'graph' && subcommand === 'preview') {
      const maxResults = parseMaxResults(parsed.flags['max-results'], 100);
      const result = await previewRepoGraph({
        target: resolveTarget(cwd, targetArg),
        maxNodes: maxResults,
        maxEdges: maxResults * 2
      });
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else {
        write(stdout, `Repo graph: ${result.summary.nodes} node(s), ${result.summary.edges} edge(s), preview\n`);
      }
      return result.ok ? 0 : 1;
    }

    if (command === 'canon' && subcommand === 'draft') {
      const result = await draftCanonFacts({
        target: resolveTarget(cwd, targetArg),
        maxFacts: parseMaxResults(parsed.flags['max-results'])
      });
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else {
        write(stdout, `Canon draft: ${result.summary.facts} fact candidate(s)\n`);
        for (const fact of result.facts) {
          write(stdout, `[${fact.kind}] ${fact.id} <- ${fact.sourceReport}\n`);
        }
        for (const warning of result.warnings) {
          write(stdout, `[WARN] ${warning.message}\n`);
        }
      }
      return result.ok ? 0 : 1;
    }

    if (command === 'canon' && subcommand === 'check') {
      const result = await checkCanonFacts({
        target: resolveTarget(cwd, targetArg),
        filePath: typeof parsed.flags.path === 'string' ? parsed.flags.path : undefined
      });
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else {
        write(stdout, `Canon check: ${result.summary.verified} verified, ${result.summary.changed} changed, ${result.summary.missing} missing, ${result.summary.stale} stale, ${result.summary.unverified} unverified\n`);
        for (const warning of result.warnings) {
          write(stdout, `[WARN] ${warning.message}\n`);
        }
        for (const conflict of result.conflicts) {
          write(stdout, `[CONFLICT] ${conflict.message}\n`);
        }
      }
      return result.ok ? 0 : 1;
    }

    if (command === 'canon' && subcommand === 'promote') {
      const result = await promoteCanonFacts({
        target: resolveTarget(cwd, targetArg),
        sourcePath: typeof parsed.flags.source === 'string' ? parsed.flags.source : '',
        toPath: typeof parsed.flags.to === 'string' ? parsed.flags.to : '',
        apply: Boolean(parsed.flags.apply),
        reviewed: Boolean(parsed.flags.reviewed)
      });
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else {
        write(stdout, `Canon promote: ${result.summary.facts} fact(s), ${result.applied ? 'written' : 'preview'}\n`);
        write(stdout, `Destination: ${result.destination}\n`);
        for (const warning of result.warnings) {
          write(stdout, `[WARN] ${warning.message}\n`);
        }
        for (const conflict of result.conflicts) {
          write(stdout, `[CONFLICT] ${conflict.message}\n`);
        }
      }
      return result.ok ? 0 : 1;
    }

    if (command === 'write-gate' && subcommand === 'preview') {
      const result = await previewWriteGate({
        repoRoot: root,
        target: resolveTarget(cwd, targetArg),
        intent: parsed.flags.intent,
        filePath: typeof parsed.flags.path === 'string' ? parsed.flags.path : undefined,
        maxResults: parseMaxResults(parsed.flags['max-results'])
      });
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else {
        write(stdout, `Write gate: ${result.ok ? 'ok' : 'blocked'} (${result.summary.candidates} candidate(s), ${result.summary.blockers} blocker(s))\n`);
        for (const blocker of result.blockers) {
          write(stdout, `[BLOCKER] ${blocker.message}\n`);
        }
      }
      return result.ok ? 0 : 1;
    }

    if (command === 'write-gate' && subcommand === 'advisory') {
      const result = await createWriteGateAdvisory({
        repoRoot: root,
        target: resolveTarget(cwd, targetArg),
        intent: typeof parsed.flags.intent === 'string' ? parsed.flags.intent : '',
        filePath: typeof parsed.flags.path === 'string' ? parsed.flags.path : undefined,
        maxResults: parseMaxResults(parsed.flags['max-results']),
        apply: Boolean(parsed.flags.apply)
      });
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else {
        write(stdout, `Write-gate advisory: ${result.ok ? 'ok' : 'blocked'} (${result.advisory.written ? 'written' : 'preview'})\n`);
        write(stdout, `Advisory: ${result.advisory.path}\n`);
        for (const blocker of result.blockers) {
          write(stdout, `[BLOCKER] ${blocker.message}\n`);
        }
        for (const warning of result.warnings) {
          write(stdout, `[WARN] ${warning.message}\n`);
        }
      }
      return result.ok ? 0 : 1;
    }

    if (command === 'write-gate' && subcommand === 'post-check') {
      const result = await postCheckWriteGate({
        target: resolveTarget(cwd, targetArg),
        advisoryPath: typeof parsed.flags.advisory === 'string' ? parsed.flags.advisory : ''
      });
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else {
        write(stdout, `Write-gate post-check: ${result.summary.status} (${result.summary.added} added, ${result.summary.modified} modified, ${result.summary.deleted} deleted)\n`);
        for (const warning of result.warnings) {
          write(stdout, `[WARN] ${warning.message}\n`);
        }
        for (const conflict of result.conflicts) {
          write(stdout, `[CONFLICT] ${conflict.message}\n`);
        }
      }
      return result.ok ? 0 : 1;
    }

    if (command === 'managed' && subcommand === 'check') {
      const result = await checkManagedManifest({ target: resolveTarget(cwd, targetArg) });
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else {
        write(stdout, `Managed manifest: ${result.ok ? 'ok' : 'needs attention'}\n`);
        for (const file of result.files) {
          write(stdout, `[${file.status.toUpperCase()}] ${file.path}\n`);
        }
        for (const conflict of result.conflicts) {
          write(stdout, `[CONFLICT] ${conflict.message}\n`);
        }
      }
      return result.ok ? 0 : 1;
    }

    if (command === 'managed' && subcommand === 'catalog') {
      const result = await catalogManagedManifest({ target: resolveTarget(cwd, targetArg) });
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else {
        write(stdout, `Managed catalog: ${result.summary.total} file(s)\n`);
        for (const file of result.files) {
          write(stdout, `[${file.status.toUpperCase()}] ${file.kind} ${file.path}\n`);
        }
        for (const conflict of result.conflicts) {
          write(stdout, `[CONFLICT] ${conflict.message}\n`);
        }
      }
      return result.ok ? 0 : 1;
    }

    if (command === 'managed' && subcommand === 'adopt') {
      const result = await adoptManagedManifest({
        repoRoot: root,
        target: resolveTarget(cwd, targetArg),
        apply: Boolean(parsed.flags.apply)
      });
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else {
        for (const operation of result.operations) {
          write(stdout, `[PLAN] ${operation.message}\n`);
        }
        if (!parsed.flags.apply) {
          write(stdout, 'Re-run with --apply to write the managed manifest.\n');
        }
      }
      return result.ok ? 0 : 1;
    }

    if (command === 'managed' && subcommand === 'prune') {
      const result = await pruneManagedManifest({
        target: resolveTarget(cwd, targetArg),
        managedPath: parsed.flags.path,
        apply: Boolean(parsed.flags.apply)
      });
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else {
        for (const operation of result.operations) {
          write(stdout, `[PLAN] ${operation.message}\n`);
        }
        for (const warning of result.warnings) {
          write(stdout, `[WARN] ${warning.message}\n`);
        }
        for (const conflict of result.conflicts) {
          write(stdout, `[CONFLICT] ${conflict.message}\n`);
        }
        if (!parsed.flags.apply && result.operations.length > 0) {
          write(stdout, 'Re-run with --apply to remove the selected managed file.\n');
        }
      }
      return result.ok ? 0 : 1;
    }

    if (command === 'managed' && subcommand === 'uninstall') {
      const result = await uninstallManagedManifest({
        target: resolveTarget(cwd, targetArg),
        apply: Boolean(parsed.flags.apply)
      });
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else {
        for (const operation of result.operations) {
          write(stdout, `[PLAN] ${operation.message}\n`);
        }
        for (const warning of result.warnings) {
          write(stdout, `[WARN] ${warning.message}\n`);
        }
        for (const conflict of result.conflicts) {
          write(stdout, `[CONFLICT] ${conflict.message}\n`);
        }
        if (!parsed.flags.apply && result.operations.length > 0) {
          write(stdout, 'Re-run with --apply to remove unmodified managed files.\n');
        }
      }
      return result.ok ? 0 : 1;
    }

    if (command === 'operator' && subcommand === 'check') {
      const result = await checkOperator({
        repoRoot: root,
        target: resolveTarget(cwd, targetArg),
        filePath: typeof parsed.flags.path === 'string' ? parsed.flags.path : undefined,
        includeDiff: Boolean(parsed.flags.diff)
      });
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else {
        write(stdout, `Operator check: ${result.ok ? 'ok' : 'needs attention'}\n`);
        for (const check of result.checks) {
          write(stdout, `[${check.level.toUpperCase()}] ${check.name}: ${check.message}\n`);
        }
      }
      return result.ok ? 0 : 1;
    }

    if (command === 'operator' && subcommand === 'search') {
      const result = await searchOperator({
        target: resolveTarget(cwd, targetArg),
        query: parsed.flags.query,
        filePath: typeof parsed.flags.path === 'string' ? parsed.flags.path : undefined,
        maxResults: parseMaxResults(parsed.flags['max-results'])
      });
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else {
        write(stdout, `Operator search: ${result.summary.matches} match(es)\n`);
        for (const item of result.results) {
          const first = item.snippets[0];
          write(stdout, `[${item.category}] ${item.path}${first ? `:${first.line} ${first.text}` : ''}\n`);
        }
      }
      return 0;
    }

    if (command === 'operator' && subcommand === 'preflight') {
      const result = await preflightOperator({
        target: resolveTarget(cwd, targetArg),
        intent: parsed.flags.intent,
        filePath: typeof parsed.flags.path === 'string' ? parsed.flags.path : undefined,
        maxResults: parseMaxResults(parsed.flags['max-results'])
      });
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else {
        write(stdout, `Operator preflight: ${result.summary.candidates} candidate(s), ${result.summary.snapshotFiles} snapshot file(s)\n`);
        for (const item of result.candidates.slice(0, 10)) {
          const first = item.snippets[0];
          write(stdout, `[${item.category}] ${item.path}${first ? `:${first.line} ${first.text}` : ''}\n`);
        }
      }
      return result.ok ? 0 : 1;
    }

    if (command === 'operator' && subcommand === 'delta') {
      const result = await deltaOperator({
        target: resolveTarget(cwd, targetArg),
        beforeFile: typeof parsed.flags.before === 'string' ? parsed.flags.before : undefined
      });
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else {
        write(stdout, `Operator delta: ${result.summary.added} added, ${result.summary.modified} modified, ${result.summary.deleted} deleted\n`);
        for (const warning of result.warnings) {
          write(stdout, `[WARN] ${warning.message}\n`);
        }
        for (const conflict of result.conflicts) {
          write(stdout, `[CONFLICT] ${conflict.message}\n`);
        }
      }
      return result.ok ? 0 : 1;
    }

    if (command === 'operator' && subcommand === 'research') {
      const result = await researchOperator({
        target: resolveTarget(cwd, targetArg),
        query: parsed.flags.query,
        filePath: typeof parsed.flags.path === 'string' ? parsed.flags.path : undefined,
        maxResults: parseMaxResults(parsed.flags['max-results'], 50)
      });
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else {
        write(stdout, `Operator research: ${result.summary.evidence} evidence item(s), ${result.summary.gaps} gap(s)\n`);
        for (const item of result.evidence.slice(0, 10)) {
          const first = item.snippets[0];
          write(stdout, `[${item.category}] ${item.path}${first ? `:${first.line} ${first.text}` : ''}\n`);
        }
        if (result.gaps.length > 0) {
          write(stdout, 'Gaps:\n');
          for (const gap of result.gaps) {
            write(stdout, `- ${gap.message}\n`);
          }
        }
      }
      return 0;
    }

    if (command === 'operator' && subcommand === 'context') {
      const result = await previewOperatorContext({
        target: resolveTarget(cwd, targetArg),
        filePath: typeof parsed.flags.path === 'string' ? parsed.flags.path : undefined
      });
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else {
        write(stdout, `Operator context: ${result.summary.matchingContextFiles} context match(es), ${result.summary.ruleMatches} rule match(es)\n`);
        for (const item of result.contexts.filter((context) => context.applies)) {
          write(stdout, `[CONTEXT] ${item.path} (${item.reason})\n`);
        }
        for (const item of result.related) {
          write(stdout, `[${item.category}] ${item.path}\n`);
        }
      }
      return 0;
    }

    if (command === 'operator' && subcommand === 'analyze') {
      const result = await analyzeOperator({
        target: resolveTarget(cwd, targetArg),
        filePath: typeof parsed.flags.path === 'string' ? parsed.flags.path : undefined,
        deep: Boolean(parsed.flags.deep)
      });
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else {
        write(stdout, `Operator analyze: ${result.summary.sourceFiles} source file(s), ${result.summary.ruleMatches} rule match(es)\n`);
        if (result.summary.contextMatches > 0) {
          write(stdout, `Context matches: ${result.summary.contextMatches}\n`);
        }
        for (const tool of result.optionalTools) {
          if (tool.status !== 'not-detected') {
            write(stdout, `[${tool.status.toUpperCase()}] ${tool.id}: ${tool.nextStep}\n`);
          }
        }
        if (result.deep) {
          write(stdout, `Deep: ${result.deep.summary.astGrepMatches} AST match(es), ${result.deep.summary.lspSymbols} LSP symbol(s), ${result.deep.summary.functionCloneGroups} function clone group(s)\n`);
        }
      }
      return 0;
    }

    if (command === 'operator' && subcommand === 'map') {
      const result = await mapOperator({ target: resolveTarget(cwd, targetArg) });
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else {
        write(stdout, `Operator map: ${result.summary.sourceFiles} source file(s), ${result.summary.testFiles} test file(s)\n`);
        write(stdout, `Package manager: ${result.stack.packageManager.name}\n`);
        if (result.stack.frameworks.length > 0) {
          write(stdout, `Frameworks: ${result.stack.frameworks.map((framework) => framework.name).join(', ')}\n`);
        }
        if (result.summary.concerns > 0) {
          write(stdout, `Concerns: ${result.summary.concerns}\n`);
        }
      }
      return 0;
    }

    if (command === 'operator' && subcommand === 'audit') {
      const result = await auditOperator({ target: resolveTarget(cwd, targetArg) });
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else {
        write(stdout, `Operator audit: ${result.summary.findings} finding(s)\n`);
        for (const finding of result.findings) {
          write(stdout, `[${finding.level.toUpperCase()}] ${finding.message}\n`);
        }
      }
      return result.ok ? 0 : 1;
    }

    if (command === 'operator' && subcommand === 'gc') {
      const result = await gcOperator({
        repoRoot: root,
        target: resolveTarget(cwd, targetArg),
        apply: Boolean(parsed.flags.apply)
      });
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else {
        for (const operation of result.operations) {
          write(stdout, `[PLAN] ${operation.message}\n`);
        }
        for (const warning of result.warnings) {
          write(stdout, `[WARN] ${warning.message}\n`);
        }
        for (const conflict of result.conflicts) {
          write(stdout, `[CONFLICT] ${conflict.message}\n`);
        }
        if (!parsed.flags.apply && result.operations.length > 0) {
          write(stdout, 'Re-run with --apply to remove obsolete unmodified managed files.\n');
        }
      }
      return result.ok ? 0 : 1;
    }

    if (command === 'rules' && subcommand === 'check') {
      const result = await checkRules({
        target: resolveTarget(cwd, targetArg),
        filePath: typeof parsed.flags.path === 'string' ? parsed.flags.path : undefined
      });
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else {
        write(stdout, `Rule matches: ${result.summary.applies}/${result.summary.total}\n`);
        for (const rule of result.rules) {
          write(stdout, `[${rule.applies ? 'MATCH' : 'SKIP'}] ${rule.path} (${rule.reason})\n`);
        }
        for (const warning of result.warnings) {
          write(stdout, `[WARN] ${warning.message}\n`);
        }
      }
      return result.ok ? 0 : 1;
    }

    if (command === 'diagnostics' && subcommand === 'check') {
      const result = await checkDiagnostics({ target: resolveTarget(cwd, targetArg) });
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else {
        write(stdout, `Diagnostics commands: ${result.summary.commands}\n`);
        for (const commandCandidate of result.commands) {
          write(stdout, `- ${commandCandidate.command} (${commandCandidate.source})\n`);
        }
        for (const check of result.checks.filter((item) => item.level !== 'pass')) {
          write(stdout, `[${check.level.toUpperCase()}] ${check.name}: ${check.message}\n`);
        }
      }
      return result.ok ? 0 : 1;
    }

    if (command === 'qa' && subcommand === 'tui-check') {
      const result = await checkTuiCapture({
        file: resolveTarget(cwd, targetArg),
        cols: parseColumns(parsed.flags.cols)
      });
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else {
        write(stdout, `TUI width: max ${result.maxWidth}/${result.expectedColumns}\n`);
        for (const line of result.overflowLines) {
          write(stdout, `[OVERFLOW] line ${line.line}: ${line.width} columns (+${line.overflowBy})\n`);
        }
        if (result.borderMisaligned) {
          write(stdout, '[WARN] box-drawing borders do not match expected columns.\n');
        }
      }
      return result.ok ? 0 : 1;
    }

    if (command === 'qa' && subcommand === 'image-diff') {
      const actualArg = parsed.positionals[3];
      const result = await checkImageDiff({
        reference: resolveTarget(cwd, targetArg),
        actual: resolveTarget(cwd, actualArg),
        threshold: parseThreshold(parsed.flags.threshold)
      });
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else {
        write(stdout, `Image diff: ${result.summary.changedPixels}/${result.summary.totalPixels} changed pixel(s)\n`);
        for (const hotspot of result.hotspots) {
          write(stdout, `[HOTSPOT] x=${hotspot.x} y=${hotspot.y} changed=${hotspot.changedPixels}\n`);
        }
        for (const conflict of result.conflicts) {
          write(stdout, `[CONFLICT] ${conflict.message}\n`);
        }
      }
      return result.ok ? 0 : 1;
    }

    if (command === 'adapter' && subcommand === 'check') {
      const result = await checkAdapterReadiness({
        repoRoot: root,
        target: resolveTarget(cwd, targetArg),
        adapter: parsed.flags.adapter,
        maxChars: parseMaxChars(parsed.flags['max-chars']),
        settingsPath: parsed.flags.settings ? path.resolve(cwd, parsed.flags.settings) : undefined
      });
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else {
        write(stdout, `Adapter readiness: ${result.adapter} (${result.ok ? 'ok' : 'needs attention'})\n`);
        for (const check of result.checks) {
          write(stdout, `[${check.level.toUpperCase()}] ${check.name}: ${check.message}\n`);
        }
      }
      return result.ok ? 0 : 1;
    }

    if (command === 'adapter' && subcommand === 'config') {
      const result = await renderAdapterConfig({
        repoRoot: root,
        target: resolveTarget(cwd, targetArg),
        adapter: parsed.flags.adapter
      });
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else {
        write(stdout, `Adapter config: ${result.adapter}\n`);
        write(stdout, `Hook command: ${result.hookCommand}\n`);
        write(stdout, `MCP command: ${result.mcp.command} ${result.mcp.args.join(' ')}\n`);
        for (const warning of result.warnings) {
          write(stdout, `[WARN] ${warning.message}\n`);
        }
        writeJson(stdout, result.config);
      }
      return result.ok ? 0 : 1;
    }

    if (command === 'plan' && subcommand === 'validate') {
      const target = resolveTarget(cwd, targetArg);
      const planPath = resolveRequiredPath(cwd, parsed.flags.plan, '--plan');
      const result = await validateAutomationPlan(planPath);
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else {
        write(stdout, `Automation plan: ${result.ok ? 'valid' : 'invalid'}; ${result.ready ? 'ready' : 'not ready'}\n`);
        for (const warning of result.warnings) write(stdout, `[WARN] ${warning.message}\n`);
        for (const conflict of result.conflicts) write(stdout, `[CONFLICT] ${conflict.message}\n`);
        write(stdout, `Target: ${target}\n`);
      }
      return result.ok && result.ready ? 0 : 1;
    }

    if (command === 'forge' && subcommand === 'status') {
      const target = resolveTarget(cwd, targetArg);
      const config = await loadAutomationConfig(target, cwd, parsed.flags['user-config']);
      if (typeof parsed.flags.provider === 'string') config.forge.provider = parsed.flags.provider;
      if (typeof parsed.flags.remote === 'string') config.forge.remote = parsed.flags.remote;
      const doctor = await automationDoctor({
        target,
        config,
        profile: parsed.flags.profile,
        noRemote: Boolean(parsed.flags['no-remote']),
        remoteReadOnly: Boolean(parsed.flags['remote-read-only']),
        noGit: Boolean(parsed.flags['no-git']),
        offline: Boolean(parsed.flags.offline),
        instruction: typeof parsed.flags.instruction === 'string' ? parsed.flags.instruction : undefined
      });
      if (parsed.flags.json) writeJson(stdout, doctor.forge);
      else printForgeStatus(stdout, doctor.forge);
      return doctor.forge.ok ? 0 : 1;
    }

    if (command === 'forge' && subcommand === 'bootstrap') {
      const target = resolveTarget(cwd, targetArg);
      const config = await loadAutomationConfig(target, cwd, parsed.flags['user-config']);
      const forgeContext = await resolveForgeContextForPlan({ target, config, flags: parsed.flags });
      const provider = forgeContext.provider;
      const plan = planForgeBootstrap({
        provider,
        capabilities: forgeContext.capabilities,
        milestoneTitle: typeof parsed.flags.milestone === 'string' ? parsed.flags.milestone : null,
        projectTitle: typeof parsed.flags['project-title'] === 'string' ? parsed.flags['project-title'] : null
      });
      const result = parsed.flags.apply
        ? await applyForgeCliPlan({ plan, provider, target, config, flags: parsed.flags })
        : plan;
      if (parsed.flags.json) writeJson(stdout, result);
      else printForgePlan(stdout, result, Boolean(parsed.flags.apply));
      return result.ok ? 0 : 1;
    }

    if (command === 'forge' && subcommand === 'sync') {
      const target = resolveTarget(cwd, targetArg);
      const config = await loadAutomationConfig(target, cwd, parsed.flags['user-config']);
      let tasks = [];
      let planId;
      let planTitle;
      let planMilestone;
      if (typeof parsed.flags.plan === 'string') {
        const planInput = JSON.parse(await readFile(resolveRequiredPath(cwd, parsed.flags.plan, '--plan'), 'utf8'));
        const validation = validateWorkflowPlan(planInput, { requireApproved: Boolean(parsed.flags.apply) });
        if (!validation.ok || (parsed.flags.apply && !validation.ready)) {
          const conflicts = [...validation.conflicts];
          if (parsed.flags.apply && validation.ok && !validation.ready) {
            conflicts.push({
              id: 'automation.plan.incomplete',
              message: 'The approved plan must include acceptance criteria and safe verification argv before forge synchronization can be applied.',
              paths: []
            });
          }
          const rejected = {
            schemaVersion: '2',
            kind: 'forge.sync-plan-gate.v2',
            ok: false,
            applied: false,
            operations: [],
            warnings: validation.warnings,
            conflicts
          };
          if (parsed.flags.json) writeJson(stdout, rejected);
          else printForgePlan(stdout, rejected, Boolean(parsed.flags.apply));
          return 1;
        }
        const validatedPlan = validation.plan;
        planId = validatedPlan.planId;
        planTitle = validatedPlan.title;
        planMilestone = automationPlanMilestone(validatedPlan);
        tasks = validatedPlan.tasks.map((task) => ({
          id: task.id,
          title: task.title,
          status: 'planned',
          priority: task.priority,
          risk: task.risk,
          progress: 0,
          acceptanceCriteria: (task.acceptanceCriteria ?? []).map((criterion) => criterion.text)
        }));
      } else {
        const status = await automationStatus({ target, runId: typeof parsed.flags['run-id'] === 'string' ? parsed.flags['run-id'] : undefined });
        if (!status.ok) {
          if (parsed.flags.json) writeJson(stdout, status);
          else for (const conflict of status.conflicts) write(stdout, `[CONFLICT] ${conflict.message}\n`);
          return 1;
        }
        planId = status.state.planId;
        planTitle = status.state.planTitle;
        tasks = status.state.tasks.map((task) => {
          const remoteSnapshot = status.remote?.tasks?.[task.id] ?? task.source?.snapshot ?? {};
          const issueNumber = Number(remoteSnapshot.issueNumber ?? task.source?.issueNumber);
          return {
            id: task.id,
            title: task.title,
            status: task.status,
            priority: task.priority,
            risk: task.risk,
            progress: task.criteria.length > 0
              ? Math.round((task.criteria.filter((criterion) => criterion.status === 'pass').length / task.criteria.length) * 100)
              : task.status === 'completed' ? 100 : 0,
            ...(Number.isInteger(issueNumber) && issueNumber > 0 ? { issueNumber } : {}),
            ...(typeof remoteSnapshot.updatedAt === 'string' && remoteSnapshot.updatedAt ? { expectedUpdatedAt: remoteSnapshot.updatedAt } : {}),
            acceptanceCriteria: task.criteria.map((criterion) => criterion.text)
          };
        });
      }
      const forgeContext = await resolveForgeContextForPlan({ target, config, flags: parsed.flags });
      const provider = forgeContext.provider;
      const plan = planForgeSync({
        provider,
        capabilities: forgeContext.capabilities,
        language: config.forge.language,
        milestoneTitle: typeof parsed.flags.milestone === 'string' ? parsed.flags.milestone : planMilestone,
        planId,
        planTitle,
        projectTitle: planTitle,
        tasks
      });
      const result = parsed.flags.apply
        ? await applyForgeCliPlan({ plan, provider, target, config, flags: parsed.flags })
        : plan;
      if (parsed.flags.apply && result.ok && typeof parsed.flags['run-id'] === 'string') {
        const checkpoint = await linkAutomationForgeTasks({
          target,
          runId: parsed.flags['run-id'],
          provider,
          repository: forgeContext.status.repository,
          links: forgeLinksFromApplyResults(result, tasks)
        });
        result.checkpoint = checkpoint;
        if (!checkpoint.ok) {
          result.ok = false;
          result.conflicts = [...(result.conflicts ?? []), ...(checkpoint.conflicts ?? [])];
        } else if (checkpoint.warnings?.length) {
          result.warnings = [...(result.warnings ?? []), ...checkpoint.warnings];
        }
      }
      if (parsed.flags.json) writeJson(stdout, result);
      else printForgePlan(stdout, result, Boolean(parsed.flags.apply));
      return result.ok ? 0 : 1;
    }

    if (command === 'forge' && subcommand === 'reconcile') {
      const target = resolveTarget(cwd, targetArg);
      const localTask = JSON.parse(await readFile(resolveRequiredPath(cwd, parsed.flags['local-task'], '--local-task'), 'utf8'));
      const remoteIssue = JSON.parse(await readFile(resolveRequiredPath(cwd, parsed.flags['remote-issue'], '--remote-issue'), 'utf8'));
      const preview = reconcileForgeTask({ localTask, remoteIssue });
      const result = parsed.flags.apply
        ? await applyAutomationReconcile({
            target,
            runId: typeof parsed.flags['run-id'] === 'string' ? parsed.flags['run-id'] : undefined,
            taskId: localTask.id,
            remoteIssue
          })
        : preview;
      if (parsed.flags.apply) result.reconciliation = preview;
      if (parsed.flags.json) writeJson(stdout, result);
      else if (parsed.flags.apply) write(stdout, `Forge reconcile apply: ${result.reason} (${result.state?.runStatus ?? 'unknown'})\n`);
      else write(stdout, `Forge reconcile: ${result.action} (${result.state})\n`);
      return result.ok ? 0 : 1;
    }

    if (command === 'automation' && subcommand === 'doctor') {
      const target = resolveTarget(cwd, targetArg);
      const config = await loadAutomationConfig(target, cwd, parsed.flags['user-config']);
      const result = await automationDoctor({
        target,
        config,
        profile: parsed.flags.profile,
        noRemote: Boolean(parsed.flags['no-remote']),
        remoteReadOnly: Boolean(parsed.flags['remote-read-only']),
        noGit: Boolean(parsed.flags['no-git']),
        offline: Boolean(parsed.flags.offline),
        instruction: typeof parsed.flags.instruction === 'string' ? parsed.flags.instruction : undefined,
        enableGithubAgentTask: Boolean(parsed.flags['enable-github-agent-task'])
      });
      if (parsed.flags.json) writeJson(stdout, result);
      else printAutomationDoctor(stdout, result);
      return result.ok ? 0 : 1;
    }

    if (command === 'automation' && subcommand === 'start') {
      const target = resolveTarget(cwd, targetArg);
      const config = await loadAutomationConfig(target, cwd, parsed.flags['user-config']);
      if (config.automation.killSwitch) {
        const result = automationDisabledResult(target);
        printAutomationResult(result, parsed.flags, stdout);
        return 1;
      }
      const policy = commandAutomationPolicy(config, parsed.flags);
      if (!policy.automation.coordinate) {
        const result = automationProfileDeniedResult(target, policy.profile, 'start');
        printAutomationResult(result, parsed.flags, stdout);
        return 1;
      }
      const planPath = resolveRequiredPath(cwd, parsed.flags.plan, '--plan');
      const planInput = JSON.parse(await readFile(planPath, 'utf8'));
      const queue = await collectCliReadyQueue({ target, config, flags: parsed.flags, policy });
      const forgeRuntime = await inspectCliRuntimeForge({ target, config, flags: parsed.flags, policy });
      const result = await startAutomation({
        target,
        plan: planInput,
        queueTasks: queue.tasks,
        queueWarnings: [...queue.warnings, ...queue.conflicts],
        runId: typeof parsed.flags['run-id'] === 'string' ? parsed.flags['run-id'] : undefined,
        maxAttempts: config.automation.budget.maxAttempts,
        noRemote: !policy.remote.read,
        remoteReadOnly: !forgeRuntime.writes,
        offline: Boolean(parsed.flags.offline)
      });
      const startStatus = result.ok
        ? await automationStatus({ target, runId: result.runId })
        : null;
      if (
        result.ok &&
        automationStartNeedsCoordination(startStatus?.remote) &&
        forgeRuntime.writes &&
        policy.network
      ) {
        result.forge = await coordinateAutomationStart({
          target,
          config,
          flags: parsed.flags,
          planInput,
          checkpoint: startStatus?.remote?.coordination
        });
        const links = mergeForgeLinks(
          forgeLinksFromRunState(startStatus?.state, planInput),
          forgeLinksFromCoordination(result.forge, planInput)
        );
        if (result.forge.repository && ['github', 'gitea'].includes(result.forge.provider)) {
          const stages = {
            bootstrap: result.forge.bootstrapComplete,
            sync: result.forge.syncComplete,
            links: false,
            complete: false
          };
          let linked = await linkAutomationForgeTasks({
            target,
            runId: result.runId,
            provider: result.forge.provider,
            repository: result.forge.repository,
            links,
            coordination: stages
          });
          if (linked.ok) {
            const linksComplete = forgePlanLinksComplete({
              state: linked.state,
              planInput,
              provider: result.forge.provider,
              repository: result.forge.repository
            });
            const coordination = {
              ...stages,
              sync: stages.sync && linksComplete,
              links: linksComplete,
              complete: stages.bootstrap && stages.sync && linksComplete
            };
            linked = await linkAutomationForgeTasks({
              target,
              runId: result.runId,
              provider: result.forge.provider,
              repository: result.forge.repository,
              links: [],
              coordination
            });
            result.forge.coordination = coordination;
            result.forge.ok = coordination.complete && linked.ok;
          } else {
            result.forge.ok = false;
          }
          result.remote = linked;
          if (linked.ok) result.state = linked.state;
          else result.warnings.push({
            id: 'automation.start.remote-link-degraded',
            message: 'Forge issues were created, but their snapshots could not be linked into the local run ledger.',
            details: linked.conflicts
          });
        } else {
          result.forge.ok = false;
        }
        if (!result.forge.ok) {
          result.warnings.push({
            id: 'automation.start.forge-degraded',
            message: 'The local run started, but forge coordination was unavailable; the next start with the same approved plan and run ID will resume incomplete stages.',
            details: result.forge.conflicts
          });
        }
      }
      appendForgeDowngradeWarning(result, forgeRuntime, policy);
      printAutomationResult(result, parsed.flags, stdout);
      return result.ok ? 0 : 1;
    }

    if (command === 'automation' && subcommand === 'tick') {
      const target = resolveTarget(cwd, targetArg);
      const config = await loadAutomationConfig(target, cwd, parsed.flags['user-config']);
      if (config.automation.killSwitch) {
        const result = automationDisabledResult(target);
        printAutomationResult(result, parsed.flags, stdout);
        return 1;
      }
      const policy = commandAutomationPolicy(config, parsed.flags);
      if (!policy.automation.execute) {
        const result = automationProfileDeniedResult(target, policy.profile, 'tick');
        printAutomationResult(result, parsed.flags, stdout);
        return 1;
      }
      const inspectRemoteTask = createCliForgeIssueInspector({ target, config, policy });
      const forgeRuntime = await inspectCliRuntimeForge({ target, config, flags: parsed.flags, policy });
      const result = await tickAutomation({
        target,
        runId: typeof parsed.flags['run-id'] === 'string' ? parsed.flags['run-id'] : undefined,
        noRemote: !policy.remote.read,
        remoteReadOnly: !forgeRuntime.writes,
        offline: Boolean(parsed.flags.offline),
        noGit: !policy.git.branch,
        approveReview: Boolean(parsed.flags['approve-review']),
        executorProvider: config.executor.provider,
        executorCommand: config.executor.command,
        gitConfig: {
          ...config.git,
          autoCommit: config.git.autoCommit && policy.git.commit,
          autoPush: config.git.autoPush && policy.git.push
        },
        forgeConfig: config.forge,
        forgeCapabilities: forgeRuntime.capabilities,
        automationProfile: policy.profile,
        hostedExecution: isHostedAutomationEnvironment(process.env),
        inspectRemoteTask,
        unattended: Boolean(parsed.flags['no-interactive']),
        tickTimeoutMs: config.automation.budget.tickMinutes * 60_000,
        enableGithubAgentTask: Boolean(parsed.flags['enable-github-agent-task'])
      });
      appendForgeDowngradeWarning(result, forgeRuntime, policy);
      printAutomationResult(result, parsed.flags, stdout);
      return result.ok ? 0 : 1;
    }

    if (command === 'automation' && subcommand === 'supervise') {
      const target = resolveTarget(cwd, targetArg);
      const config = await loadAutomationConfig(target, cwd, parsed.flags['user-config']);
      if (config.automation.killSwitch) {
        const result = automationDisabledResult(target);
        printAutomationResult(result, parsed.flags, stdout);
        return 1;
      }
      const policy = commandAutomationPolicy(config, parsed.flags);
      if (!policy.automation.execute) {
        const result = automationProfileDeniedResult(target, policy.profile, 'supervise');
        printAutomationResult(result, parsed.flags, stdout);
        return 1;
      }
      const inspectRemoteTask = createCliForgeIssueInspector({ target, config, policy });
      const forgeRuntime = await inspectCliRuntimeForge({ target, config, flags: parsed.flags, policy });
      const result = await superviseAutomation({
        target,
        runId: typeof parsed.flags['run-id'] === 'string' ? parsed.flags['run-id'] : undefined,
        noRemote: !policy.remote.read,
        remoteReadOnly: !forgeRuntime.writes,
        offline: Boolean(parsed.flags.offline),
        noGit: !policy.git.branch,
        executorProvider: config.executor.provider,
        executorCommand: config.executor.command,
        gitConfig: {
          ...config.git,
          autoCommit: config.git.autoCommit && policy.git.commit,
          autoPush: config.git.autoPush && policy.git.push
        },
        forgeConfig: config.forge,
        forgeCapabilities: forgeRuntime.capabilities,
        automationProfile: policy.profile,
        hostedExecution: isHostedAutomationEnvironment(process.env),
        inspectRemoteTask,
        unattended: Boolean(parsed.flags['no-interactive']),
        tickTimeoutMs: config.automation.budget.tickMinutes * 60_000,
        budget: {
          maxWallMinutes: config.automation.budget.maxWallMinutes,
          maxStalled: config.automation.budget.maxStalled
        }
      });
      appendForgeDowngradeWarning(result, forgeRuntime, policy);
      printAutomationResult(result, parsed.flags, stdout);
      return result.ok ? 0 : 1;
    }

    if (command === 'automation' && ['status', 'pause', 'resume', 'stop'].includes(subcommand)) {
      const target = resolveTarget(cwd, targetArg);
      const common = {
        target,
        runId: typeof parsed.flags['run-id'] === 'string' ? parsed.flags['run-id'] : undefined,
        reason: typeof parsed.flags.reason === 'string' ? parsed.flags.reason : undefined,
        resetAttempts: Boolean(parsed.flags['reset-attempts'])
      };
      const result = subcommand === 'status'
        ? await automationStatus(common)
        : subcommand === 'pause'
          ? await pauseAutomation(common)
          : subcommand === 'resume'
            ? await resumeAutomation(common)
            : await stopAutomation(common);
      printAutomationResult(result, parsed.flags, stdout);
      return result.ok ? 0 : 1;
    }

    if (command === 'automation' && subcommand === 'schedule') {
      const target = resolveTarget(cwd, targetArg);
      const config = await loadAutomationConfig(target, cwd, parsed.flags['user-config']);
      const policy = commandAutomationPolicy(config, parsed.flags);
      if (parsed.flags.apply && (!policy.automation.execute || config.automation.killSwitch)) {
        const result = config.automation.killSwitch
          ? automationDisabledResult(target)
          : automationProfileDeniedResult(target, policy.profile, 'schedule --apply');
        printAutomationResult(result, parsed.flags, stdout);
        return 1;
      }
      const result = await scheduleAutomation({
        target,
        platform: parsed.flags.platform,
        apply: Boolean(parsed.flags.apply),
        remoteAllowed: !parsed.flags.apply || policy.remote.write,
        tickFlags: schedulerTickFlags(policy)
      });
      printAutomationResult(result, parsed.flags, stdout);
      return result.ok ? 0 : 1;
    }

    if (command === 'plan' && subcommand === 'new') {
      if (parsed.flags.automation) {
        const result = await createAutomationPlan({
          target: resolveTarget(cwd, targetArg),
          title: parsed.flags.title,
          date: parsed.flags.date,
          language: typeof parsed.flags.lang === 'string' ? parsed.flags.lang : 'auto',
          dryRun: Boolean(parsed.flags['dry-run']),
          force: Boolean(parsed.flags.force)
        });
        return printScaffoldResult(result, stdout, stderr);
      }
      const result = await createPlan({
        target: resolveTarget(cwd, targetArg),
        title: parsed.flags.title,
        date: parsed.flags.date,
        dryRun: Boolean(parsed.flags['dry-run']),
        force: Boolean(parsed.flags.force)
      });
      return printScaffoldResult(result, stdout, stderr);
    }

    if (command === 'worklog' && subcommand === 'new') {
      const result = await createWorklog({
        target: resolveTarget(cwd, targetArg),
        title: parsed.flags.title,
        date: parsed.flags.date,
        dryRun: Boolean(parsed.flags['dry-run']),
        force: Boolean(parsed.flags.force)
      });
      return printScaffoldResult(result, stdout, stderr);
    }

    if (command === 'worklog' && subcommand === 'summarize') {
      const result = await summarizeWorklogs({
        target: resolveTarget(cwd, targetArg),
        month: parsed.flags.month,
        dryRun: Boolean(parsed.flags['dry-run']),
        force: Boolean(parsed.flags.force)
      });
      return printScaffoldResult(result, stdout, stderr);
    }

    write(stderr, `Unknown command: ${argv.join(' ')}\n\n${helpText()}`);
    return 1;
  } catch (error) {
    write(stderr, `${error.message}\n`);
    return 1;
  }
}

export function parseArgs(argv) {
  const flags = {};
  const positionals = [];
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith('--')) {
      positionals.push(arg);
      continue;
    }
    const raw = arg.slice(2);
    const [key, inlineValue] = raw.split('=', 2);
    if (inlineValue !== undefined) {
      if (STRICT_BOOLEAN_FLAGS.has(key)) {
        if (inlineValue !== 'true' && inlineValue !== 'false') {
          throw new Error(`--${key} expects true or false when an inline value is provided.`);
        }
        flags[key] = inlineValue === 'true';
      } else {
        flags[key] = inlineValue;
      }
      continue;
    }
    const next = argv[i + 1];
    if (next && !next.startsWith('--') && needsValue(key)) {
      flags[key] = next;
      i += 1;
    } else {
      flags[key] = true;
    }
  }
  return { flags, positionals };
}

function needsValue(key) {
  return [
    'profile',
    'title',
    'date',
    'month',
    'max-chars',
    'adapter',
    'settings',
    'to',
    'source',
    'path',
    'cols',
    'query',
    'intent',
    'advisory',
    'before',
    'contract',
    'threshold',
    'max-results',
    'max-depth',
    'project',
    'capability',
    'ledger',
    'codex-root',
    'agents-root',
    'recipe',
    'user-config',
    'run-id',
    'type',
    'message',
    'status',
    'evidence',
    'kind',
    'reference-dir',
    'reference',
    'pattern',
    'adoption',
    'risk',
    'decision-date',
    'lang',
    'engine',
    'root',
    'max-files',
    'plan',
    'platform',
    'provider',
    'remote',
    'reason',
    'instruction',
    'milestone',
    'project-title',
    'local-task',
    'remote-issue'
  ].includes(key);
}

const STRICT_BOOLEAN_FLAGS = new Set([
  'apply',
  'approve-review',
  'automation',
  'dry-run',
  'enable-forge-write-tools',
  'enable-github-agent-task',
  'enable-write-tools',
  'force',
  'force-managed',
  'force-unmanaged',
  'json',
  'local-only',
  'no-git',
  'no-interactive',
  'no-remote',
  'offline',
  'remote-read-only',
  'reset-attempts'
]);

function resolveTarget(cwd, value) {
  if (!value) throw new Error('Missing target path.');
  return path.resolve(cwd, value);
}

function resolveOptionalPath(cwd, value) {
  return typeof value === 'string' ? path.resolve(cwd, value) : undefined;
}

function resolveRequiredPath(cwd, value, optionName) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`Missing ${optionName}.`);
  return path.resolve(cwd, value);
}

async function loadAutomationConfig(target, cwd, userConfigPath) {
  const preview = await previewHarnessConfig({
    target,
    userConfigPath: resolveOptionalPath(cwd, userConfigPath)
  });
  if (!preview.ok) {
    throw new Error(`Harness config has conflicts: ${preview.conflicts.map((conflict) => conflict.message).join('; ')}`);
  }
  return structuredClone(preview.config);
}

function commandAutomationPolicy(config, flags) {
  const policy = deriveAutomationPolicy({
    configuredProfile: config.automation.profile,
    requestedProfile: typeof flags.profile === 'string' ? flags.profile : undefined,
    noRemote: Boolean(flags['no-remote']),
    remoteReadOnly: Boolean(flags['remote-read-only']),
    noGit: Boolean(flags['no-git']),
    offline: Boolean(flags.offline),
    instruction: typeof flags.instruction === 'string' ? flags.instruction : undefined
  });
  if (['off', 'observe', 'remote-to-local'].includes(config.forge.sync)) {
    policy.remote.write = false;
    policy.git.push = false;
    policy.reasons.push({ id: 'policy.config.forge-sync', message: `forge.sync=${config.forge.sync} disables outbound remote mutations.` });
  }
  return policy;
}

function schedulerTickFlags(policy) {
  const flags = [];
  if (!policy.network) flags.push('--offline');
  else if (!policy.remote.read) flags.push('--no-remote');
  else if (!policy.remote.write) flags.push('--remote-read-only');
  if (!policy.git.branch || !policy.git.commit) flags.push('--no-git');
  return flags;
}

function isHostedAutomationEnvironment(env) {
  return String(env.GITHUB_ACTIONS ?? '').toLowerCase() === 'true' ||
    String(env.GITEA_ACTIONS ?? env.CI_ACTIONS ?? '').toLowerCase() === 'true';
}

async function inspectCliRuntimeForge({ target, config, flags, policy }) {
  if (!policy.remote.read || !policy.network) {
    return { writes: false, capabilities: null, status: null };
  }
  const doctor = await automationDoctor({
    target,
    config,
    profile: typeof flags.profile === 'string' ? flags.profile : undefined,
    noRemote: Boolean(flags['no-remote']),
    remoteReadOnly: !policy.remote.write || Boolean(flags['remote-read-only']),
    noGit: Boolean(flags['no-git']),
    offline: Boolean(flags.offline),
    instruction: typeof flags.instruction === 'string' ? flags.instruction : undefined,
    enableGithubAgentTask: Boolean(flags['enable-github-agent-task'])
  });
  return {
    writes: policy.remote.write && doctor.forge.mode.writes === true,
    capabilities: doctor.forge.capabilities,
    status: doctor.forge
  };
}

function appendForgeDowngradeWarning(result, runtime, policy) {
  if (!result || !policy.remote.write || runtime.writes || !runtime.status) return;
  result.warnings ??= [];
  if (result.warnings.some((warning) => warning.id === 'automation.forge.write-degraded')) return;
  result.warnings.push({
    id: 'automation.forge.write-degraded',
    message: 'Forge or remote Git writes were disabled because current authentication and repository write permission were not verified.',
    paths: [],
    details: [...runtime.status.warnings, ...runtime.status.conflicts]
  });
}

async function resolveForgeContextForPlan({ target, config, flags }) {
  const effectiveConfig = structuredClone(config);
  if (typeof flags.provider === 'string') effectiveConfig.forge.provider = flags.provider;
  if (typeof flags.remote === 'string') effectiveConfig.forge.remote = flags.remote;
  const doctor = await automationDoctor({
    target,
    config: effectiveConfig,
    profile: 'observe',
    noRemote: Boolean(flags['no-remote']),
    remoteReadOnly: true,
    offline: Boolean(flags.offline)
  });
  return {
    provider: doctor.forge.provider,
    capabilities: doctor.forge.capabilities,
    status: doctor.forge
  };
}

async function collectCliReadyQueue({ target, config, policy }) {
  if (!policy.remote.read || !policy.network) {
    return { tasks: [], warnings: [], conflicts: [] };
  }
  const context = await prepareCliForgeReadContext({ target, config });
  if (!context.ok) {
    return { tasks: [], warnings: context.warnings, conflicts: [] };
  }
  return collectReadyForgeTasks({
    provider: context.provider,
    repository: context.repository,
    transport: context.transport,
    readyLabel: config.automation.queue.readyLabel,
    pauseLabels: ['aapb:paused', config.automation.queue.pauseLabel]
  });
}

function createCliForgeIssueInspector({ target, config, policy }) {
  if (!policy.remote.read || !policy.network) return undefined;
  let contextPromise;
  return async ({ task, signal }) => {
    contextPromise ??= prepareCliForgeReadContext({ target, config });
    const context = await contextPromise;
    if (!context.ok) {
      return { ok: true, skipped: true, reason: 'forge-read-unavailable', issue: null, warnings: context.warnings, conflicts: [] };
    }
    const currentRepository = `${context.repository.owner}/${context.repository.name}`;
    if (
      (task.source.provider && task.source.provider !== context.provider) ||
      (task.source.repository && task.source.repository !== currentRepository)
    ) {
      return {
        ok: true,
        identityMismatch: true,
        issue: null,
        warnings: [],
        conflicts: [{
          id: 'forge.issue.repository-mismatch',
          message: 'The linked issue belongs to a different forge provider or repository than the current remote.',
          paths: []
        }]
      };
    }
    return inspectForgeIssue({
      provider: context.provider,
      repository: context.repository,
      transport: context.transport,
      issueNumber: task.source.issueNumber,
      signal,
      readyLabel: config.automation.queue.readyLabel,
      pauseLabels: ['aapb:paused', config.automation.queue.pauseLabel]
    });
  };
}

async function prepareCliForgeReadContext({ target, config }) {
  const doctor = await automationDoctor({
    target,
    config,
    profile: 'observe',
    remoteReadOnly: true,
    noRemote: false,
    offline: false
  });
  const forge = doctor.forge;
  if (!forge.repository || !['github', 'gitea'].includes(forge.provider)) {
    return {
      ok: false,
      warnings: [{
        id: 'forge.queue.unavailable',
        message: 'No identified forge repository is available for ready issue discovery.',
        paths: []
      }]
    };
  }
  try {
    const prepared = await createDefaultForgeTransport({
      provider: forge.provider,
      repository: forge.repository
    });
    return { ok: true, provider: forge.provider, repository: forge.repository, transport: prepared.transport, warnings: [] };
  } catch (error) {
    return {
      ok: false,
      warnings: [{ id: 'forge.queue.unavailable', message: `Forge issue reads were skipped: ${redactCliError(error)}`, paths: [] }]
    };
  }
}

function redactCliError(error) {
  return String(error?.message ?? error)
    .replace(/\b(Bearer|Basic)\s+[^\s,;]+/gi, '$1 [REDACTED]')
    .replace(/\b(token|secret|password|api[_-]?key)\s*[:=]\s*([^\s,;]+)/gi, '$1=[REDACTED]')
    .replace(/(https?:\/\/)[^/@\s]+@/gi, '$1[REDACTED]@');
}

function automationDisabledResult(target) {
  return {
    schemaVersion: '2',
    kind: 'automation.controller.v2',
    ok: false,
    target,
    state: null,
    warnings: [],
    conflicts: [{ id: 'automation.kill-switch.enabled', message: 'Automation is disabled by automation.killSwitch.', paths: [] }]
  };
}

function automationProfileDeniedResult(target, profile, command) {
  return {
    schemaVersion: '2',
    kind: 'automation.controller.v2',
    ok: false,
    target,
    state: null,
    warnings: [],
    conflicts: [{
      id: 'automation.profile.denied',
      message: `automation ${command} is not allowed by the ${profile} profile.`,
      paths: []
    }]
  };
}

async function applyForgeCliPlan(options) {
  const { plan, target, config, flags } = options;
  const doctor = await automationDoctor({
    target,
    config: {
      ...config,
      forge: {
        ...config.forge,
        provider: options.provider,
        remote: typeof flags.remote === 'string' ? flags.remote : config.forge.remote
      }
    },
    profile: typeof flags.profile === 'string' ? flags.profile : undefined,
    noRemote: Boolean(flags['no-remote']),
    remoteReadOnly: Boolean(flags['remote-read-only']),
    offline: Boolean(flags.offline),
    instruction: typeof flags.instruction === 'string' ? flags.instruction : undefined
  });
  const forge = doctor.forge;
  if (!forge.ok || !forge.mode.writes || !forge.repository) {
    return {
      schemaVersion: '1',
      kind: 'forge.apply-result',
      ok: false,
      provider: forge.provider,
      mode: { apply: false, writes: false },
      summary: { planned: plan.operations?.length ?? 0, applied: 0, reused: 0, fallback: 0, failed: 0 },
      results: [],
      warnings: forge.warnings,
      conflicts: forge.conflicts.length
        ? forge.conflicts
        : [{ id: 'forge.apply.policy-denied', message: 'Effective policy or repository detection does not allow forge writes.', paths: [] }]
    };
  }
  const prepared = await createDefaultForgeTransport({
    provider: forge.provider,
    repository: forge.repository
  });
  return applyForgePlan({
    plan,
    provider: forge.provider,
    repository: forge.repository,
    transport: prepared.transport,
    profile: doctor.policy.profile,
    apply: true
  });
}

export function forgeCoordinationStages(checkpoint = {}, autoBootstrap = true) {
  return {
    bootstrap: autoBootstrap === true && checkpoint?.bootstrap !== true,
    sync: checkpoint?.sync !== true || checkpoint?.links !== true
  };
}

async function coordinateAutomationStart(options) {
  const stages = forgeCoordinationStages(options.checkpoint, options.config.forge.autoBootstrap);
  const doctor = await automationDoctor({ target: options.target, config: options.config });
  const provider = doctor.forge.provider;
  if (!doctor.forge.ok || !doctor.forge.mode.writes || !doctor.forge.repository || !['github', 'gitea'].includes(provider)) {
    return {
      ok: false,
      provider,
      bootstrap: null,
      sync: null,
      bootstrapComplete: !stages.bootstrap,
      syncComplete: !stages.sync,
      warnings: doctor.forge.warnings,
      conflicts: doctor.forge.conflicts.length
        ? doctor.forge.conflicts
        : [{ id: 'forge.coordination.unavailable', message: 'Forge coordination is unavailable for this run.', paths: [] }]
    };
  }
  const common = {
    target: options.target,
    config: options.config,
    flags: options.flags,
    provider
  };
  const milestoneTitle = automationPlanMilestone(options.planInput);
  let bootstrap = null;
  if (stages.bootstrap) {
    try {
      bootstrap = await applyForgeCliPlan({
        ...common,
        plan: planForgeBootstrap({
          provider,
          capabilities: doctor.forge.capabilities,
          milestoneTitle,
          projectTitle: options.planInput.title
        })
      });
    } catch (error) {
      bootstrap = forgeStartStageFailure('bootstrap', error, provider);
    }
  }
  const bootstrapComplete = !stages.bootstrap || bootstrap?.ok === true;
  let sync = null;
  if (stages.sync) {
    try {
      sync = await applyForgeCliPlan({
        ...common,
        plan: planForgeSync({
          provider,
          capabilities: doctor.forge.capabilities,
          language: options.config.forge.language,
          milestoneTitle,
          planId: options.planInput.planId,
          planTitle: options.planInput.title,
          projectTitle: options.planInput.title,
          tasks: options.planInput.tasks.map((task) => ({
            id: task.id,
            title: task.title,
            status: 'planned',
            priority: task.priority,
            risk: task.risk,
            progress: 0,
            acceptanceCriteria: task.acceptanceCriteria.map((criterion) => criterion.text)
          }))
        })
      });
    } catch (error) {
      sync = forgeStartStageFailure('sync', error, provider);
    }
  }
  const syncComplete = !stages.sync || sync?.ok === true;
  return {
    ok: bootstrapComplete && syncComplete,
    provider,
    repository: doctor.forge.repository,
    bootstrap,
    sync,
    bootstrapComplete,
    syncComplete,
    warnings: [...(bootstrap?.warnings ?? []), ...(sync?.warnings ?? [])],
    conflicts: [...(bootstrap?.conflicts ?? []), ...(sync?.conflicts ?? [])]
  };
}

function forgeStartStageFailure(stage, error, provider) {
  return {
    schemaVersion: '1',
    kind: 'forge.apply-result',
    ok: false,
    provider,
    mode: { apply: true, writes: false },
    summary: { planned: 0, applied: 0, reused: 0, fallback: 0, failed: 1 },
    results: [],
    warnings: [],
    conflicts: [{
      id: `automation.start.forge-${stage}-failed`,
      message: `Forge ${stage} failed before its checkpoint: ${redactCliError(error)}`,
      paths: []
    }]
  };
}

function automationPlanMilestone(planInput) {
  if (typeof planInput?.milestoneTitle === 'string' && planInput.milestoneTitle.trim()) {
    return planInput.milestoneTitle.trim().slice(0, 200);
  }
  return String(planInput?.title ?? '').match(/\b(?:v|release\s+)?(\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?)\b/i)?.[1] ?? null;
}

function forgeLinksFromCoordination(coordination, planInput) {
  const tasks = new Map((planInput.tasks ?? []).map((task) => [task.id, task]));
  return (coordination.sync?.results ?? []).flatMap((result) => {
    const match = /^task:([a-z0-9][a-z0-9._-]{0,99}):issue$/.exec(result.operationId ?? '');
    const task = match ? tasks.get(match[1]) : null;
    const resource = result.resource;
    const issueNumber = Number(resource?.number ?? resource?.index);
    if (!task || !Number.isInteger(issueNumber) || issueNumber < 1 || !['created', 'updated', 'reused'].includes(result.status)) return [];
    return [{
      taskId: task.id,
      issueNumber,
      title: resource?.title ?? task.title,
      body: resource?.body ?? '',
      labels: resource?.labels ?? ['aapb:ready'],
      acceptanceCriteria: (task.acceptanceCriteria ?? []).map((criterion) => criterion.text),
      updatedAt: resource?.updated_at ?? resource?.updatedAt ?? null
    }];
  });
}

function forgeLinksFromRunState(state, planInput) {
  const expected = new Set((planInput.tasks ?? []).map((task) => task.id));
  return (state?.tasks ?? []).flatMap((task) => {
    const source = task.source;
    if (!expected.has(task.id) || source?.kind !== 'forge-issue' || !Number.isInteger(source.issueNumber)) return [];
    return [{
      taskId: task.id,
      issueNumber: source.issueNumber,
      title: source.snapshot?.title ?? task.title,
      body: source.snapshot?.body ?? '',
      labels: source.labels ?? ['aapb:ready'],
      acceptanceCriteria: source.snapshot?.acceptanceCriteria ?? task.criteria.map((criterion) => criterion.text),
      updatedAt: source.snapshot?.updatedAt ?? null
    }];
  });
}

function mergeForgeLinks(...collections) {
  const links = new Map();
  for (const collection of collections) {
    for (const link of collection ?? []) links.set(link.taskId, link);
  }
  return [...links.values()].sort((left, right) => left.taskId.localeCompare(right.taskId));
}

function forgePlanLinksComplete({ state, planInput, provider, repository }) {
  const repositorySlug = `${repository.owner}/${repository.name}`;
  return (planInput.tasks ?? []).every((planned) => {
    const task = state?.tasks?.find((candidate) => candidate.id === planned.id);
    return task?.source?.kind === 'forge-issue' &&
      task.source.provider === provider &&
      task.source.repository === repositorySlug &&
      Number.isInteger(task.source.issueNumber) &&
      task.source.issueNumber > 0;
  });
}

function forgeLinksFromApplyResults(result, tasks) {
  const taskMap = new Map((tasks ?? []).map((task) => [task.id, task]));
  return (result.results ?? []).flatMap((item) => {
    const match = /^task:([a-z0-9][a-z0-9._-]{0,99}):issue$/.exec(item.operationId ?? '');
    const task = match ? taskMap.get(match[1]) : null;
    const resource = item.resource;
    const issueNumber = Number(resource?.number ?? resource?.index);
    if (!task || !Number.isInteger(issueNumber) || issueNumber < 1 || !['created', 'updated', 'reused'].includes(item.status)) return [];
    return [{
      taskId: task.id,
      issueNumber,
      title: resource?.title ?? task.title,
      body: resource?.body ?? '',
      labels: resource?.labels ?? [],
      acceptanceCriteria: task.acceptanceCriteria ?? [],
      updatedAt: resource?.updated_at ?? resource?.updatedAt ?? null
    }];
  });
}

function printAutomationResult(result, flags, stdout) {
  if (flags.json) {
    writeJson(stdout, result);
    return;
  }
  const state = result.state?.runStatus ?? result.platform ?? result.reason ?? (result.ok ? 'ok' : 'failed');
  write(stdout, `${result.kind ?? 'automation'}: ${state}\n`);
  if (result.state?.progress) {
    write(stdout, `Tasks: ${result.state.progress.tasks.completed}/${result.state.progress.tasks.total}; criteria: ${result.state.progress.criteria.passed}/${result.state.progress.criteria.total}\n`);
  }
  for (const warning of result.warnings ?? []) write(stdout, `[WARN] ${warning.message}\n`);
  for (const conflict of result.conflicts ?? []) write(stdout, `[CONFLICT] ${conflict.message}\n`);
}

function printForgeStatus(stdout, result) {
  write(stdout, `Forge: ${result.provider} (${result.mode.remote})\n`);
  write(stdout, `Repository: ${result.repository?.slug ?? 'none'}\n`);
  const serverVersion = result.server?.version ?? result.server?.apiVersion ?? 'unknown';
  write(stdout, `Server: ${result.server?.product ?? 'none'} ${serverVersion} (${result.server?.status ?? 'not-checked'})\n`);
  write(stdout, `Auth: ${result.auth?.status ?? 'not-checked'}${result.auth?.principal ? ` as ${result.auth.principal}` : ''}\n`);
  write(stdout, `Repository permission: read=${String(result.permissions?.repositoryRead ?? 'unknown')}, write=${String(result.permissions?.repositoryWrite ?? 'unknown')}\n`);
  write(stdout, `Writes: policy=${Boolean(result.mode?.policyWrites)}, verified=${Boolean(result.mode?.verifiedWrites)}\n`);
  write(stdout, `Capabilities: ${Object.entries(result.capabilities ?? {}).map(([id, state]) => `${id}=${state}`).join(', ') || 'none'}\n`);
  write(stdout, `Probe: ${result.probe?.status ?? 'not-run'} (${result.probe?.evidence?.length ?? 0} evidence item(s))\n`);
  for (const warning of result.warnings) write(stdout, `[WARN] ${warning.message}\n`);
  for (const conflict of result.conflicts) write(stdout, `[CONFLICT] ${conflict.message}\n`);
}

function printForgePlan(stdout, result, apply) {
  write(stdout, `Forge ${apply ? 'apply' : 'plan'}: ${result.ok ? 'ok' : 'failed'}\n`);
  for (const operation of result.operations ?? []) write(stdout, `[PLAN] ${operation.action} ${operation.resource}\n`);
  for (const warning of result.warnings ?? []) write(stdout, `[WARN] ${warning.message}\n`);
  for (const conflict of result.conflicts ?? []) write(stdout, `[CONFLICT] ${conflict.message}\n`);
}

function printAutomationDoctor(stdout, result) {
  write(stdout, `Automation doctor: ${result.ok ? 'ready' : 'needs attention'}\n`);
  write(stdout, `Forge: ${result.forge.provider} (${result.forge.mode.remote})\n`);
  write(stdout, `Executor: ${result.executor.selection.provider ?? result.executor.selection.reason}\n`);
  for (const warning of result.warnings) write(stdout, `[WARN] ${warning.message}\n`);
  for (const conflict of result.conflicts) write(stdout, `[CONFLICT] ${conflict.message}\n`);
}

function printOperations(stdout, operations) {
  for (const operation of operations) {
    write(stdout, `${operation}\n`);
  }
}

function printScaffoldResult(result, stdout, stderr) {
  if (!result.ok) {
    if (result.conflicts?.length) {
      write(stderr, `Conflicts:\n${result.conflicts.map((item) => `- ${item}`).join('\n')}\n`);
      return 2;
    }
    write(stderr, `Refusing to overwrite existing file: ${result.file}\nUse --force to overwrite.\n`);
    return 2;
  }
  printOperations(stdout, result.operations);
  return 0;
}

function write(stream, text) {
  stream.write(text);
}

function writeJson(stream, value) {
  write(stream, `${JSON.stringify(value, null, 2)}\n`);
}

function parseColumns(value) {
  if (value === undefined || value === false) return 80;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error('Invalid --cols; expected a positive integer.');
  }
  return parsed;
}

function parseThreshold(value) {
  if (value === undefined || value === false) return 0;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) {
    throw new Error('Invalid --threshold; expected a number from 0 to 1.');
  }
  return parsed;
}

function parseMaxResults(value, defaultValue = 20) {
  if (value === undefined || value === false) return defaultValue;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 100) {
    throw new Error('Invalid --max-results; expected an integer from 1 to 100.');
  }
  return parsed;
}

function parseMaxDepth(value, defaultValue = 6) {
  if (value === undefined || value === false) return defaultValue;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 100) {
    throw new Error('Invalid --max-depth; expected an integer from 1 to 100.');
  }
  return parsed;
}

function helpText() {
  return `aapb

Usage:
  aapb --version
  aapb bootstrap <target> [--profile <name>] [--local-only] [--dry-run] [--force]
  aapb mcp [--enable-write-tools] [--enable-forge-write-tools]
  aapb doctor <target> [--strict] [--json]
  aapb doctor <target> --reminder [--json]
  aapb config preview <target> [--user-config <path>] [--json]
  aapb plan new <target> --automation --title <text> [--date YYYY-MM-DD] [--lang auto|ko|en] [--dry-run] [--force]
  aapb plan validate <target> --plan <workflow.plan.v2.json> [--json]
  aapb forge status <target> [--provider auto|github|gitea] [--remote <name>] [--profile <name>] [--instruction <text>] [--no-remote] [--remote-read-only] [--offline] [--json]
  aapb forge bootstrap <target> [--provider auto|github|gitea] [--milestone <title>] [--project-title <title>] [--profile <name>] [--instruction <text>] [--no-remote] [--remote-read-only] [--offline] [--apply] [--json]
  aapb forge sync <target> [--plan <path> | --run-id <id>] [--profile <name>] [--instruction <text>] [--no-remote] [--remote-read-only] [--offline] [--apply] [--json]
  aapb forge reconcile <target> --local-task <json> --remote-issue <json> [--run-id <id>] [--apply] [--json]
  aapb automation doctor <target> [--profile <name>] [--instruction <text>] [--no-remote] [--remote-read-only] [--no-git] [--offline] [--enable-github-agent-task] [--json]
  aapb automation start <target> --plan <path> [--run-id <id>] [--profile <name>] [--instruction <text>] [--no-remote] [--remote-read-only] [--offline] [--json]
  aapb automation tick <target> [--run-id <id>] [--profile <name>] [--instruction <text>] [--no-remote] [--remote-read-only] [--no-git] [--offline] [--no-interactive] [--approve-review] [--enable-github-agent-task] [--json]
  aapb automation supervise <target> [--run-id <id>] [--profile <name>] [--instruction <text>] [--no-remote] [--remote-read-only] [--no-git] [--offline] [--no-interactive] [--json]
  aapb automation status <target> [--run-id <id>] [--json]
  aapb automation pause|resume|stop <target> [--run-id <id>] [--reason <text>] [--reset-attempts] [--json]
  aapb automation schedule <target> --platform github-actions|gitea-actions|windows-task|systemd-user [--profile <name>] [--instruction <text>] [--no-remote] [--remote-read-only] [--no-git] [--offline] [--apply] [--json]
  aapb guides sync <target> [--dry-run] [--force]
  aapb guides sync <target> --check [--diff] [--json]
  aapb skills check [--json] [--codex-root <path>] [--agents-root <path>]
  aapb skills lint [--json]
  aapb skills install [--dry-run] [--json] [--force-managed] [--force-unmanaged] [--codex-root <path>] [--agents-root <path>]
  aapb skills update [--dry-run] [--json] [--force-managed] [--force-unmanaged] [--codex-root <path>] [--agents-root <path>]
  aapb skills uninstall [--dry-run] [--json] [--force-managed] [--codex-root <path>] [--agents-root <path>]
  aapb migrate path <target> [--apply] [--json]
  aapb migrate layout <target> [--to structured] [--apply] [--json]
  aapb catalog list [--json]
  aapb catalog check [--json]
  aapb workflow list [--json]
  aapb workflow run-preview <target> --recipe <recipe-id> [--json]
  aapb workflow run-start <target> --recipe <recipe-id> [--apply] [--json]
  aapb reference inventory <reference-dir> [--max-results N] [--json]
  aapb reference inspect <reference-dir> --project <name> [--max-depth N] [--json]
  aapb reference adoption-queue <reference-dir> [--max-results N] [--ledger <ledger.md>] [--json]
  aapb reference capability-matrix <reference-dir> [--capability <id>] [--max-results N] [--ledger <ledger.md>] [--json]
  aapb reference adoption-plan <reference-dir> --capability <id> [--max-results N] [--ledger <ledger.md>] [--json]
  aapb reference adoption-status <target> --reference-dir <dir> [--path <sources.json>] [--ledger <ledger.md>] [--capability <id>] [--max-results N] [--json]
  aapb reference source-registry-preview <reference-dir> [--max-results N] [--json]
  aapb reference source-registry-check <target> [--path <sources.json>] [--reference-dir <dir>] [--json]
  aapb reference source-registry-update <target> --reference-dir <dir> [--path <sources.json>] [--max-results N] [--apply] [--json]
  aapb reference ledger-init <target> --reference-dir <dir> [--path <ledger.md>] [--max-results N] [--apply] [--json]
  aapb reference ledger-update <target> --reference-dir <dir> [--path <ledger.md>] [--max-results N] [--apply] [--json]
  aapb reference ledger-decision <target> --reference <id> --status reviewed|adopted|deferred|rejected [--capability <id>] [--pattern <text>] [--adoption <text>] [--risk <text>] [--decision-date YYYY-MM-DD] [--path <ledger.md>] [--apply] [--json]
  aapb reference ledger-check <target> [--path <ledger.md>] [--strict] [--json]
  aapb layout status <target> [--json]
  aapb runtime capability-history <target> [--json]
  aapb runtime python-status [--json]
  aapb runtime schema-check <target> --path <json> [--kind <kind>] [--json]
  aapb evidence locator-check <target> --path <json-or-md> [--json]
  aapb writing naturalness-check <target> --path <file> [--lang auto|ko|en] [--engine auto|js|python] [--json]
  aapb writing naturalness-report <target> [--root <dir>] [--max-files N] [--lang auto|ko|en] [--engine auto|js|python] [--json]
  aapb index build <target> [--apply] [--json]
  aapb index status <target> [--json]
  aapb index search <target> --query <text> [--max-results N] [--json]
  aapb index symbol-outline <target> [--max-results N] [--json]
  aapb index dependency-inventory <target> [--json]
  aapb index route-api-hints <target> [--max-results N] [--json]
  aapb graph preview <target> [--max-results N] [--json]
  aapb canon draft <target> [--max-results N] [--json]
  aapb canon check <target> [--path <canon-json>] [--json]
  aapb canon promote <target> --source <runtime-report> --to <memory-json> [--apply] [--reviewed] [--json]
  aapb write-gate preview <target> --intent <text> [--path <file>] [--max-results N] [--json]
  aapb write-gate advisory <target> --intent <text> [--path <file>] [--max-results N] [--apply] [--json]
  aapb write-gate post-check <target> --advisory <advisory-json> [--json]
  aapb managed check <target> [--json]
  aapb managed catalog <target> [--json]
  aapb managed adopt <target> [--apply] [--json]
  aapb managed prune <target> --path <managed-path> [--apply] [--json]
  aapb managed uninstall <target> [--apply] [--json]
  aapb context <target> [--json] [--max-chars N]
  aapb context list <target> [--json]
  aapb context status <target> --path <file> [--json]
  aapb context init <target> [--dry-run] [--json]
  aapb run start <target> --title <text> [--dry-run] [--json]
  aapb run status <target> [--run-id <id>] [--json]
  aapb run record <target> --run-id <id> --type note|criterion|evidence|blocker|cleanup --message <text> [--status pass|fail|blocked|info] [--evidence <path>] [--json]
  aapb run summarize <target> --run-id <id> [--dry-run] [--force] [--json]
  aapb contracts list <target> [--json]
  aapb contracts check <target> [--path <file>] [--json]
  aapb contracts snapshot <target> [--contract <id>] [--apply] [--json]
  aapb contracts init <target> [--dry-run] [--json]
  aapb operator check <target> [--path <file>] [--diff] [--json]
  aapb operator search <target> --query <text> [--path <file>] [--max-results N] [--json]
  aapb operator preflight <target> --intent <text> [--path <file>] [--max-results N] [--json]
  aapb operator delta <target> --before <preflight-json> [--json]
  aapb operator research <target> --query <text> [--path <file>] [--max-results N] [--json]
  aapb operator context <target> --path <file> [--json]
  aapb operator analyze <target> [--deep] [--path <file>] [--json]
  aapb operator map <target> [--json]
  aapb operator audit <target> [--json]
  aapb operator gc <target> [--apply] [--json]
  aapb rules check <target> [--path <file>] [--json]
  aapb diagnostics check <target> [--json]
  aapb qa tui-check <capture-file> [--cols N] [--json]
  aapb qa image-diff <reference.png> <actual.png> [--threshold N] [--json]
  aapb adapter config <target> --adapter codex|claude-code [--json]
  aapb adapter check <target> --adapter codex|claude-code [--json] [--max-chars N] [--settings <path>]
  aapb plan new <target> --title <text> [--date YYYY-MM-DD] [--dry-run] [--force]
  aapb worklog new <target> --title <text> [--date YYYY-MM-DD] [--dry-run] [--force]
  aapb worklog summarize <target> --month YYYY-MM [--dry-run] [--force]
`;
}
