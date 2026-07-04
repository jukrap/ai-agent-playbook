import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkAdapterReadiness, renderAdapterConfig } from './adapter-readiness.mjs';
import { analyzeOperator, auditOperator, checkDiagnostics, checkImageDiff, checkOperator, checkRules, checkTuiCapture, deltaOperator, gcOperator, mapOperator, preflightOperator, previewOperatorContext, researchOperator, searchOperator } from './operator-diagnostics.mjs';
import { lintSkills, runSkillsLifecycle } from './skills-lifecycle.mjs';
import { runMcpServer } from './mcp-server.mjs';
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
    if (parsed.positionals.length === 0 || parsed.flags.help) {
      write(stdout, helpText());
      return 0;
    }

    const [command, subcommand, targetArg] = parsed.positionals;
    if (command === 'mcp') {
      await runMcpServer({
        repoRoot: root,
        enableWriteTools: Boolean(parsed.flags['enable-write-tools'])
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

    if (command === 'plan' && subcommand === 'new') {
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
      flags[key] = inlineValue;
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
    'engine'
  ].includes(key);
}

function resolveTarget(cwd, value) {
  if (!value) throw new Error('Missing target path.');
  return path.resolve(cwd, value);
}

function resolveOptionalPath(cwd, value) {
  return typeof value === 'string' ? path.resolve(cwd, value) : undefined;
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
  return `ai-playbook

Usage:
  ai-playbook bootstrap <target> [--profile <name>] [--local-only] [--dry-run] [--force]
  ai-playbook mcp [--enable-write-tools]
  ai-playbook doctor <target> [--strict] [--json]
  ai-playbook doctor <target> --reminder [--json]
  ai-playbook config preview <target> [--user-config <path>] [--json]
  ai-playbook guides sync <target> [--dry-run] [--force]
  ai-playbook guides sync <target> --check [--diff] [--json]
  ai-playbook skills check [--json] [--codex-root <path>] [--agents-root <path>]
  ai-playbook skills lint [--json]
  ai-playbook skills install [--dry-run] [--json] [--force-managed] [--force-unmanaged] [--codex-root <path>] [--agents-root <path>]
  ai-playbook skills update [--dry-run] [--json] [--force-managed] [--force-unmanaged] [--codex-root <path>] [--agents-root <path>]
  ai-playbook skills uninstall [--dry-run] [--json] [--force-managed] [--codex-root <path>] [--agents-root <path>]
  ai-playbook migrate path <target> [--apply] [--json]
  ai-playbook migrate layout <target> [--to structured] [--apply] [--json]
  ai-playbook catalog list [--json]
  ai-playbook catalog check [--json]
  ai-playbook workflow list [--json]
  ai-playbook workflow run-preview <target> --recipe <recipe-id> [--json]
  ai-playbook workflow run-start <target> --recipe <recipe-id> [--apply] [--json]
  ai-playbook reference inventory <reference-dir> [--max-results N] [--json]
  ai-playbook reference inspect <reference-dir> --project <name> [--max-depth N] [--json]
  ai-playbook reference adoption-queue <reference-dir> [--max-results N] [--ledger <ledger.md>] [--json]
  ai-playbook reference capability-matrix <reference-dir> [--capability <id>] [--max-results N] [--ledger <ledger.md>] [--json]
  ai-playbook reference adoption-plan <reference-dir> --capability <id> [--max-results N] [--ledger <ledger.md>] [--json]
  ai-playbook reference adoption-status <target> --reference-dir <dir> [--path <sources.json>] [--ledger <ledger.md>] [--capability <id>] [--max-results N] [--json]
  ai-playbook reference source-registry-preview <reference-dir> [--max-results N] [--json]
  ai-playbook reference source-registry-check <target> [--path <sources.json>] [--reference-dir <dir>] [--json]
  ai-playbook reference source-registry-update <target> --reference-dir <dir> [--path <sources.json>] [--max-results N] [--apply] [--json]
  ai-playbook reference ledger-init <target> --reference-dir <dir> [--path <ledger.md>] [--max-results N] [--apply] [--json]
  ai-playbook reference ledger-update <target> --reference-dir <dir> [--path <ledger.md>] [--max-results N] [--apply] [--json]
  ai-playbook reference ledger-decision <target> --reference <id> --status reviewed|adopted|deferred|rejected [--capability <id>] [--pattern <text>] [--adoption <text>] [--risk <text>] [--decision-date YYYY-MM-DD] [--path <ledger.md>] [--apply] [--json]
  ai-playbook reference ledger-check <target> [--path <ledger.md>] [--strict] [--json]
  ai-playbook layout status <target> [--json]
  ai-playbook runtime capability-history <target> [--json]
  ai-playbook runtime python-status [--json]
  ai-playbook runtime schema-check <target> --path <json> [--kind <kind>] [--json]
  ai-playbook evidence locator-check <target> --path <json-or-md> [--json]
  ai-playbook writing naturalness-check <target> --path <file> [--lang auto|ko|en] [--engine auto|js|python] [--json]
  ai-playbook index build <target> [--apply] [--json]
  ai-playbook index status <target> [--json]
  ai-playbook index search <target> --query <text> [--max-results N] [--json]
  ai-playbook index symbol-outline <target> [--max-results N] [--json]
  ai-playbook index dependency-inventory <target> [--json]
  ai-playbook index route-api-hints <target> [--max-results N] [--json]
  ai-playbook graph preview <target> [--max-results N] [--json]
  ai-playbook canon draft <target> [--max-results N] [--json]
  ai-playbook canon check <target> [--path <canon-json>] [--json]
  ai-playbook canon promote <target> --source <runtime-report> --to <memory-json> [--apply] [--reviewed] [--json]
  ai-playbook write-gate preview <target> --intent <text> [--path <file>] [--max-results N] [--json]
  ai-playbook write-gate advisory <target> --intent <text> [--path <file>] [--max-results N] [--apply] [--json]
  ai-playbook write-gate post-check <target> --advisory <advisory-json> [--json]
  ai-playbook managed check <target> [--json]
  ai-playbook managed catalog <target> [--json]
  ai-playbook managed adopt <target> [--apply] [--json]
  ai-playbook managed prune <target> --path <managed-path> [--apply] [--json]
  ai-playbook managed uninstall <target> [--apply] [--json]
  ai-playbook context <target> [--json] [--max-chars N]
  ai-playbook context list <target> [--json]
  ai-playbook context status <target> --path <file> [--json]
  ai-playbook context init <target> [--dry-run] [--json]
  ai-playbook run start <target> --title <text> [--dry-run] [--json]
  ai-playbook run status <target> [--run-id <id>] [--json]
  ai-playbook run record <target> --run-id <id> --type note|criterion|evidence|blocker|cleanup --message <text> [--status pass|fail|blocked|info] [--evidence <path>] [--json]
  ai-playbook run summarize <target> --run-id <id> [--dry-run] [--force] [--json]
  ai-playbook contracts list <target> [--json]
  ai-playbook contracts check <target> [--path <file>] [--json]
  ai-playbook contracts snapshot <target> [--contract <id>] [--apply] [--json]
  ai-playbook contracts init <target> [--dry-run] [--json]
  ai-playbook operator check <target> [--path <file>] [--diff] [--json]
  ai-playbook operator search <target> --query <text> [--path <file>] [--max-results N] [--json]
  ai-playbook operator preflight <target> --intent <text> [--path <file>] [--max-results N] [--json]
  ai-playbook operator delta <target> --before <preflight-json> [--json]
  ai-playbook operator research <target> --query <text> [--path <file>] [--max-results N] [--json]
  ai-playbook operator context <target> --path <file> [--json]
  ai-playbook operator analyze <target> [--deep] [--path <file>] [--json]
  ai-playbook operator map <target> [--json]
  ai-playbook operator audit <target> [--json]
  ai-playbook operator gc <target> [--apply] [--json]
  ai-playbook rules check <target> [--path <file>] [--json]
  ai-playbook diagnostics check <target> [--json]
  ai-playbook qa tui-check <capture-file> [--cols N] [--json]
  ai-playbook qa image-diff <reference.png> <actual.png> [--threshold N] [--json]
  ai-playbook adapter config <target> --adapter codex|claude-code [--json]
  ai-playbook adapter check <target> --adapter codex|claude-code [--json] [--max-chars N] [--settings <path>]
  ai-playbook plan new <target> --title <text> [--date YYYY-MM-DD] [--dry-run] [--force]
  ai-playbook worklog new <target> --title <text> [--date YYYY-MM-DD] [--dry-run] [--force]
  ai-playbook worklog summarize <target> --month YYYY-MM [--dry-run] [--force]
`;
}
