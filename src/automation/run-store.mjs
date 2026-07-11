import { existsSync } from 'node:fs';
import { createHash, randomUUID } from 'node:crypto';
import { mkdir, open, readFile, readdir, rename, rm, rmdir, stat, utimes } from 'node:fs/promises';
import path from 'node:path';
import {
  WORKFLOW_PLAN_SCHEMA_VERSION,
  createInitialRunState,
  readCompatibleRunInput,
  reduceRunEvent,
  reduceRunEvents,
  validateWorkflowPlan
} from './run-state.mjs';

const STORE_FILES = Object.freeze({
  manifest: 'manifest.json',
  tasks: 'tasks.json',
  ledger: 'ledger.jsonl',
  state: 'state.json',
  remote: 'remote.json',
  lease: 'lease.json',
  summary: 'summary.md',
  handoff: 'handoff.md',
  evidence: 'evidence'
});

const LEASE_LOCK_DIRECTORY = '.lease-locks';
const LEASE_LOCK_TICKET_FILE = 'ticket.json';
const LEASE_LOCK_CONTENDER_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const DEFAULT_LEASE_HEARTBEAT_MS = 30_000;
export const DEFAULT_LEASE_TTL_MS = 120_000;

export function createRunStore(runRoot, options = {}) {
  const root = path.resolve(runRoot);
  const clock = typeof options.clock === 'function' ? options.clock : () => new Date();
  const heartbeatMs = positiveInteger(options.heartbeatMs, DEFAULT_LEASE_HEARTBEAT_MS, 'heartbeatMs');
  const leaseTtlMs = positiveInteger(options.leaseTtlMs, DEFAULT_LEASE_TTL_MS, 'leaseTtlMs');
  const beforeAuthoritativeWrite = typeof options.beforeAuthoritativeWrite === 'function'
    ? options.beforeAuthoritativeWrite
    : null;
  if (leaseTtlMs <= heartbeatMs) throw new Error('leaseTtlMs must be greater than heartbeatMs.');
  /** @type {Promise<unknown>} */
  let writeQueue = Promise.resolve();

  /**
   * @template T
   * @param {() => Promise<T>} operation
   * @returns {Promise<T>}
   */
  function enqueue(operation) {
    const result = writeQueue.then(operation, operation);
    writeQueue = result.catch(() => undefined);
    return result;
  }

  async function initialize({ plan: inputPlan, runId, createdAt = clock().toISOString(), maxAttempts = 3, remote = {}, approvedPlanDigest = null }) {
    return enqueue(async () => {
      const existingFormat = await inspectRunFormat();
      if (isLegacyFormat(existingFormat)) throw legacyReadOnlyError();
      const validation = validateWorkflowPlan(inputPlan);
      if (!validation.ok) {
        throw new Error(`Workflow plan validation failed: ${validation.conflicts.map((item) => item.id).join(', ')}`);
      }
      const plan = validation.plan;
      const state = createInitialRunState(plan, { runId, createdAt, maxAttempts });
      await mkdir(path.dirname(root), { recursive: true });
      if (existsSync(root)) throw new Error('Run store already exists.');
      const stagingRoot = `${root}.initializing-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      await mkdir(stagingRoot);

      const manifest = {
        schemaVersion: WORKFLOW_PLAN_SCHEMA_VERSION,
        kind: 'automation.run-manifest',
        runId: state.runId,
        plan: {
          schemaVersion: plan.schemaVersion,
          kind: plan.kind,
          planId: plan.planId,
          title: plan.title,
          approval: structuredClone(plan.approval),
          ...(plan.sourcePath === undefined ? {} : { sourcePath: plan.sourcePath })
        },
        createdAt,
        maxAttempts,
        ...(hasText(approvedPlanDigest) ? { approvedPlanDigest: approvedPlanDigest.trim() } : {})
      };
      const tasks = {
        schemaVersion: WORKFLOW_PLAN_SCHEMA_VERSION,
        kind: 'automation.run-tasks',
        planId: plan.planId,
        tasks: plan.tasks
      };
      const remoteState = {
        schemaVersion: WORKFLOW_PLAN_SCHEMA_VERSION,
        kind: 'automation.remote-state',
        provider: null,
        updatedAt: createdAt,
        ...structuredClone(remote)
      };

      try {
        await atomicWriteJson(path.join(stagingRoot, STORE_FILES.manifest), manifest);
        await atomicWriteJson(path.join(stagingRoot, STORE_FILES.tasks), tasks);
        await atomicWriteText(path.join(stagingRoot, STORE_FILES.ledger), '');
        await atomicWriteJson(path.join(stagingRoot, STORE_FILES.state), state);
        await atomicWriteJson(path.join(stagingRoot, STORE_FILES.remote), remoteState);
        await atomicWriteText(path.join(stagingRoot, STORE_FILES.summary), initialSummary(state));
        await atomicWriteText(path.join(stagingRoot, STORE_FILES.handoff), initialHandoff(state));
        await mkdir(path.join(stagingRoot, STORE_FILES.evidence));
        await rename(stagingRoot, root);
        return { root, manifest, plan, state };
      } finally {
        await rm(stagingRoot, { recursive: true, force: true }).catch(() => undefined);
      }
    });
  }

  async function appendEvent(inputEvent, options = {}) {
    return enqueue(async () => {
      await requireWritableV2Store();
      return withLeaseLock(async (assertLockOwnership) => {
      const lease = await assertLeaseInternal(options);
      const { manifest, plan } = await readRunDefinition();
      const events = await readEventsInternal(assertLockOwnership);
      const current = reduceRunEvents(plan, events, stateOptions(manifest));
      if (hasText(inputEvent.eventId)) {
        const existing = events.find((event) => event.eventId === inputEvent.eventId);
        if (existing) {
          if (!sameEventIdentity(existing, inputEvent)) {
            throw new Error(`eventId ${inputEvent.eventId} is already used by a different event.`);
          }
          return { event: existing, state: current, duplicate: true };
        }
      }
      const sequence = current.lastEventSequence + 1;
      const event = {
        ...structuredClone(inputEvent),
        schemaVersion: WORKFLOW_PLAN_SCHEMA_VERSION,
        eventId: inputEvent.eventId ?? `${manifest.runId}:${sequence}`,
        sequence,
        timeUtc: inputEvent.timeUtc ?? nowDate().toISOString(),
        ...(lease ? { controllerId: lease.ownerId, fencingToken: lease.fencingToken } : {})
      };
      const nextState = reduceRunEvent(current, event);
      await assertWriteAuthority(assertLockOwnership, options, 'ledger.append');
      await appendJsonLine(filePath(STORE_FILES.ledger), event);
      await assertWriteAuthority(assertLockOwnership, options, 'state.write');
      await atomicWriteJson(filePath(STORE_FILES.state), nextState);
      await assertWriteAuthority(assertLockOwnership, options, 'summary.write');
      await atomicWriteText(filePath(STORE_FILES.summary), initialSummary(nextState));
      await assertWriteAuthority(assertLockOwnership, options, 'handoff.write');
      await atomicWriteText(filePath(STORE_FILES.handoff), initialHandoff(nextState));
      return { event, state: nextState };
      });
    });
  }

  async function acquireLease({ ownerId }) {
    validateOwnerId(ownerId);
    return enqueue(async () => {
      await requireWritableV2Store();
      return withLeaseLock(async (assertLockOwnership) => {
      const now = nowDate();
      const previous = await readLeaseInternal();
      if (isLeaseActive(previous, now)) {
        return {
          acquired: false,
          reclaimed: false,
          lease: previous
        };
      }
      const lease = {
        schemaVersion: WORKFLOW_PLAN_SCHEMA_VERSION,
        kind: 'automation.local-lease',
        ownerId,
        fencingToken: (previous?.fencingToken ?? 0) + 1,
        acquiredAt: now.toISOString(),
        heartbeatAt: now.toISOString(),
        expiresAt: new Date(now.getTime() + leaseTtlMs).toISOString(),
        releasedAt: null,
        heartbeatMs,
        ttlMs: leaseTtlMs
      };
      await beforeAuthoritativeWrite?.({ phase: 'lease.acquire' });
      await assertLockOwnership();
      await atomicWriteJson(filePath(STORE_FILES.lease), lease);
      return {
        acquired: true,
        reclaimed: Boolean(previous?.ownerId && !isLeaseActive(previous, now)),
        lease
      };
      });
    });
  }

  async function heartbeatLease(credentials) {
    return enqueue(async () => {
      await requireWritableV2Store();
      return withLeaseLock(async (assertLockOwnership) => {
      const now = nowDate();
      const lease = await requireActiveLease(credentials, now);
      const renewed = {
        ...lease,
        heartbeatAt: now.toISOString(),
        expiresAt: new Date(now.getTime() + leaseTtlMs).toISOString()
      };
      await assertWriteAuthority(assertLockOwnership, credentials, 'lease.heartbeat');
      await atomicWriteJson(filePath(STORE_FILES.lease), renewed);
      return { heartbeat: true, lease: renewed };
      });
    });
  }

  async function releaseLease(credentials) {
    return enqueue(async () => {
      await requireWritableV2Store();
      return withLeaseLock(async (assertLockOwnership) => {
      const now = nowDate();
      const lease = await requireActiveLease(credentials, now);
      const released = {
        ...lease,
        ownerId: null,
        expiresAt: now.toISOString(),
        releasedAt: now.toISOString()
      };
      await assertWriteAuthority(assertLockOwnership, credentials, 'lease.release');
      await atomicWriteJson(filePath(STORE_FILES.lease), released);
      return { released: true, lease: released };
      });
    });
  }

  async function readLease() {
    await writeQueue;
    return readLeaseInternal();
  }

  async function readEvents() {
    await writeQueue;
    const format = await inspectRunFormat();
    if (isLegacyFormat(format)) return readLegacyEvents().then((result) => result.events);
    return withLeaseLock((assertLockOwnership) => readEventsInternal(assertLockOwnership));
  }

  async function readState() {
    await writeQueue;
    const format = await inspectRunFormat();
    if (isLegacyFormat(format)) return readLegacyState(format);
    if (format.type !== 'automation-v2') throw new Error('Run store is missing or has an unsupported format.');
    return withLeaseLock(async (assertLockOwnership) => {
      const { manifest, plan } = await readRunDefinition();
      const events = await readEventsInternal(assertLockOwnership);
      const replayed = reduceRunEvents(plan, events, stateOptions(manifest));
      let cached = null;
      try {
        cached = JSON.parse(await readFile(filePath(STORE_FILES.state), 'utf8'));
      } catch {
        // The append-only ledger is authoritative; malformed derived state is rebuilt below.
      }
    if (JSON.stringify(cached) !== JSON.stringify(replayed)) {
      await beforeAuthoritativeWrite?.({ phase: 'derived-state.write' });
      await assertLockOwnership();
      await atomicWriteJson(filePath(STORE_FILES.state), replayed);
      await assertLockOwnership();
      await atomicWriteText(filePath(STORE_FILES.summary), initialSummary(replayed));
      await assertLockOwnership();
      await atomicWriteText(filePath(STORE_FILES.handoff), initialHandoff(replayed));
      }
      return replayed;
    });
  }

  async function readRemote() {
    await writeQueue;
    return JSON.parse(await readFile(filePath(STORE_FILES.remote), 'utf8'));
  }

  async function updateRemote(patch, credentials) {
    if (!isRecord(patch)) throw new Error('remote state patch must be an object.');
    return enqueue(async () => {
      await requireWritableV2Store();
      return withLeaseLock(async (assertLockOwnership) => {
        await assertLeaseInternal(credentials ?? {});
        const current = JSON.parse(await readFile(filePath(STORE_FILES.remote), 'utf8'));
        const updated = mergeRemoteState(current, patch);
        updated.schemaVersion = WORKFLOW_PLAN_SCHEMA_VERSION;
        updated.kind = 'automation.remote-state';
        updated.updatedAt = nowDate().toISOString();
        await assertWriteAuthority(assertLockOwnership, credentials ?? {}, 'remote.write');
        await atomicWriteJson(filePath(STORE_FILES.remote), updated);
        return updated;
      });
    });
  }

  async function inspectRunFormat() {
    const manifestPath = filePath(STORE_FILES.manifest);
    if (existsSync(manifestPath)) {
      let manifest;
      try {
        manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
      } catch {
        return { type: 'unsupported', manifest: null };
      }
      if (
        manifest?.schemaVersion === WORKFLOW_PLAN_SCHEMA_VERSION &&
        manifest?.kind === 'automation.run-manifest' &&
        existsSync(filePath(STORE_FILES.tasks))
      ) {
        return { type: 'automation-v2', manifest };
      }
      if (String(manifest?.schemaVersion ?? '') === '1' && manifest?.kind === 'workflow.run') {
        return { type: 'workflow-run-v1', manifest };
      }
      return { type: 'unsupported', manifest };
    }
    if (
      existsSync(filePath(STORE_FILES.ledger)) ||
      existsSync(filePath('criteria.json')) ||
      existsSync(filePath('brief.md'))
    ) {
      return { type: 'run-v1', manifest: null };
    }
    return { type: 'missing', manifest: null };
  }

  async function requireWritableV2Store() {
    const format = await inspectRunFormat();
    if (isLegacyFormat(format)) throw legacyReadOnlyError();
    if (format.type !== 'automation-v2') throw new Error('Run store is missing or has an unsupported format.');
    return format;
  }

  async function readLegacyState(format) {
    const warnings = [];
    const { events, malformed } = await readLegacyEvents();
    warnings.push(...malformed);
    const criteria = format.type === 'workflow-run-v1'
      ? await readLegacyMarkdownCriteria(warnings)
      : await readLegacyJsonCriteria(warnings);
    const ledgerCriteria = events
      .filter((event) => event?.type === 'criterion')
      .map((event, index) => ({
        id: hasText(event.id) ? event.id : `ledger-criterion-${index + 1}`,
        status: event.status ?? 'info',
        message: event.message ?? 'Legacy criterion'
      }));
    const combinedCriteria = [...criteria, ...ledgerCriteria];
    const status = await legacyStatus({ format, events });
    const runId = hasText(format.manifest?.runId) ? format.manifest.runId : path.basename(root);
    const input = {
      schemaVersion: '1',
      kind: format.type === 'workflow-run-v1' ? 'workflow.run' : 'run',
      runId,
      status,
      criteria: combinedCriteria,
      ...(format.manifest?.startedAt ? { startedAt: format.manifest.startedAt } : {})
    };
    const state = readCompatibleRunInput(input);
    state.compatibility = {
      source: format.type,
      sourceSchemaVersion: '1',
      readOnly: true,
      warnings
    };
    state.legacy = {
      kind: input.kind,
      recipeId: format.manifest?.recipe?.id ?? null,
      startedAt: format.manifest?.startedAt ?? await legacyStartedAt(),
      events: events.length,
      evidence: events.filter((event) => event?.type === 'evidence').length,
      criteria: combinedCriteria
    };
    return state;
  }

  async function readLegacyEvents() {
    if (!existsSync(filePath(STORE_FILES.ledger))) return { events: [], malformed: [] };
    const events = [];
    const malformed = [];
    const text = await readFile(filePath(STORE_FILES.ledger), 'utf8');
    for (const [index, rawLine] of text.split(/\r?\n/).entries()) {
      const line = rawLine.trim();
      if (!line) continue;
      try {
        events.push(JSON.parse(line));
      } catch (error) {
        malformed.push({
          id: 'automation.legacy-ledger.malformed-line',
          message: `Could not parse legacy ledger line ${index + 1}: ${error.message}`,
          paths: [STORE_FILES.ledger]
        });
      }
    }
    return { events, malformed };
  }

  async function readLegacyJsonCriteria(warnings) {
    const criteriaPath = filePath('criteria.json');
    if (!existsSync(criteriaPath)) return [];
    try {
      const parsed = JSON.parse(await readFile(criteriaPath, 'utf8'));
      const criteria = Array.isArray(parsed) ? parsed : parsed.criteria;
      if (Array.isArray(criteria)) return structuredClone(criteria);
    } catch (error) {
      warnings.push({
        id: 'automation.legacy-criteria.malformed',
        message: `Could not parse legacy criteria.json: ${error.message}`,
        paths: ['criteria.json']
      });
      return [];
    }
    warnings.push({
      id: 'automation.legacy-criteria.invalid',
      message: 'Legacy criteria.json does not contain a criteria array.',
      paths: ['criteria.json']
    });
    return [];
  }

  async function readLegacyMarkdownCriteria(warnings) {
    const criteriaPath = filePath('criteria.md');
    if (!existsSync(criteriaPath)) return [];
    try {
      return parseLegacyVerificationChecklist(await readFile(criteriaPath, 'utf8'));
    } catch (error) {
      warnings.push({
        id: 'automation.legacy-criteria.malformed',
        message: `Could not read legacy criteria.md: ${error.message}`,
        paths: ['criteria.md']
      });
      return [];
    }
  }

  async function legacyStatus({ format, events }) {
    if (events.some((event) => event?.type === 'blocker' || event?.status === 'blocked')) return 'blocked';
    if (existsSync(filePath(STORE_FILES.summary))) {
      const summary = await readFile(filePath(STORE_FILES.summary), 'utf8');
      const match = summary.match(/^Status:\s*(.+)$/im);
      if (match) return match[1].trim();
    }
    return format.manifest?.status ?? 'planned';
  }

  async function legacyStartedAt() {
    if (!existsSync(filePath('brief.md'))) return null;
    const brief = await readFile(filePath('brief.md'), 'utf8');
    return brief.match(/^Started:\s*(.+)$/im)?.[1]?.trim() ?? null;
  }

  async function readRunDefinition() {
    const manifest = JSON.parse(await readFile(filePath(STORE_FILES.manifest), 'utf8'));
    const tasks = JSON.parse(await readFile(filePath(STORE_FILES.tasks), 'utf8'));
    const plan = {
      ...manifest.plan,
      tasks: tasks.tasks
    };
    const validation = validateWorkflowPlan(plan);
    if (!validation.ok) {
      throw new Error(`Stored workflow plan is invalid: ${validation.conflicts.map((item) => item.id).join(', ')}`);
    }
    return { manifest, plan: validation.plan };
  }

  async function readEventsInternal(assertLockOwnership) {
    const ledgerPath = filePath(STORE_FILES.ledger);
    const bytes = await readFile(ledgerPath);
    const endsWithNewline = bytes.length === 0 || bytes[bytes.length - 1] === 0x0a;
    const committedBytes = endsWithNewline
      ? bytes
      : await recoverIncompleteLedgerTail({
        bytes,
        lineNumber: bytes.toString('utf8').split('\n').length,
        ledgerPath,
        assertLockOwnership
      });
    const lines = committedBytes.toString('utf8').split('\n');
    const events = [];
    for (const [index, rawLine] of lines.entries()) {
      const line = rawLine.trim();
      if (!line) continue;
      try {
        events.push(JSON.parse(line));
      } catch (error) {
        throw new Error(`Malformed ledger event at line ${index + 1}: ${error.message}`);
      }
    }
    return events;
  }

  async function recoverIncompleteLedgerTail({ bytes, lineNumber, ledgerPath, assertLockOwnership }) {
    const finalNewline = bytes.lastIndexOf(0x0a);
    const prefixEnd = finalNewline < 0 ? 0 : finalNewline + 1;
    const prefix = bytes.subarray(0, prefixEnd);
    const tail = bytes.subarray(prefixEnd);
    const digest = createHash('sha256').update(tail).digest('hex').slice(0, 12);
    const evidenceName = `ledger-partial-line-${lineNumber}-${digest}.jsonl.partial`;
    const evidencePath = filePath(path.join(STORE_FILES.evidence, evidenceName));
    await mkdir(path.dirname(evidencePath), { recursive: true });
    let evidenceHandle;
    try {
      evidenceHandle = await open(evidencePath, 'wx', 0o600);
      await evidenceHandle.writeFile(tail);
      await evidenceHandle.sync();
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
    } finally {
      await evidenceHandle?.close().catch(() => undefined);
    }
    await beforeAuthoritativeWrite?.({ phase: 'ledger.recover' });
    await assertLockOwnership?.();
    await atomicWriteBuffer(ledgerPath, prefix);
    return prefix;
  }

  async function assertLeaseInternal(credentials) {
    const lease = await readLeaseInternal();
    if (!lease) {
      if (credentials.ownerId !== undefined || credentials.fencingToken !== undefined) {
        throw staleFencingError();
      }
      return null;
    }
    return requireActiveLease(credentials, nowDate(), lease);
  }

  async function requireActiveLease(credentials, now, knownLease) {
    const lease = knownLease ?? await readLeaseInternal();
    if (
      !lease ||
      !isLeaseActive(lease, now) ||
      credentials?.ownerId !== lease.ownerId ||
      credentials?.fencingToken !== lease.fencingToken
    ) {
      throw staleFencingError();
    }
    return lease;
  }

  async function readLeaseInternal() {
    if (!existsSync(filePath(STORE_FILES.lease))) return null;
    return JSON.parse(await readFile(filePath(STORE_FILES.lease), 'utf8'));
  }

  async function withLeaseLock(operation) {
    // Unique contender directories form a bakery lock. Stale foreign contenders
    // are ignored but never removed, so recovery cannot delete a successor's lock.
    const lockDirectory = filePath(LEASE_LOCK_DIRECTORY);
    await mkdir(lockDirectory, { recursive: true });
    const identity = randomUUID();
    const contenderDirectory = path.join(lockDirectory, identity);
    const ticketPath = path.join(contenderDirectory, LEASE_LOCK_TICKET_FILE);
    await mkdir(contenderDirectory);
    let heartbeatTimer;
    let heartbeatFailure = null;
    let heartbeatPending = Promise.resolve();

    try {
      const observed = await readLockContenders(lockDirectory);
      const maximumTicket = observed.reduce(
        (maximum, contender) => contender.ticket === null ? maximum : Math.max(maximum, contender.ticket),
        0
      );
      const ticket = maximumTicket + 1;
      if (!Number.isSafeInteger(ticket)) throw new Error('Local lease lock ticket space is exhausted.');
      const contender = {
        schemaVersion: 1,
        kind: 'automation.lease-lock-contender',
        identity,
        pid: process.pid,
        ticket,
        createdAt: nowDate().toISOString()
      };
      await writeExclusiveJson(ticketPath, contender);
      const initialHeartbeatAt = nowDate();
      await utimes(contenderDirectory, initialHeartbeatAt, initialHeartbeatAt);

      const heartbeatIntervalMs = Math.max(1, Math.min(heartbeatMs, Math.max(1, Math.floor(leaseTtlMs / 3))));
      heartbeatTimer = setInterval(() => {
        heartbeatPending = heartbeatPending
          .then(async () => {
            const heartbeatAt = nowDate();
            await utimes(contenderDirectory, heartbeatAt, heartbeatAt);
          })
          .catch((error) => {
            heartbeatFailure ??= error;
          });
      }, heartbeatIntervalMs);
      heartbeatTimer.unref?.();

      let hasTurn = false;
      for (let attempt = 0; attempt < 100; attempt += 1) {
        if (heartbeatFailure) throw heartbeatFailure;
        const contenders = await readLockContenders(lockDirectory);
        const blocker = contenders.find((candidate) => (
          candidate.identity !== identity && (
            candidate.ticket === null || lockContenderPrecedes(candidate, contender)
          )
        ));
        if (!blocker) {
          hasTurn = true;
          break;
        }
        await delay(10);
      }
      if (!hasTurn) throw new Error('Could not acquire the local lease lock.');
      if (heartbeatFailure) throw heartbeatFailure;
      const assertLockOwnership = async () => {
        if (heartbeatFailure) throw heartbeatFailure;
        const contenders = await readLockContenders(lockDirectory);
        const own = contenders.find((candidate) => candidate.identity === identity && candidate.ticket === contender.ticket);
        const blocker = contenders.find((candidate) => (
          candidate.identity !== identity && (
            candidate.ticket === null || lockContenderPrecedes(candidate, contender)
          )
        ));
        if (!own || blocker) throw leaseLockLostError();
      };
      await assertLockOwnership();
      const result = await operation(assertLockOwnership);
      if (heartbeatFailure) throw heartbeatFailure;
      return result;
    } finally {
      clearInterval(heartbeatTimer);
      await heartbeatPending;
      await rm(ticketPath, { force: true });
      try {
        await rmdir(contenderDirectory);
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
    }
  }

  async function readLockContenders(lockDirectory) {
    const observedAt = nowDate().getTime();
    const entries = await readdir(lockDirectory, { withFileTypes: true });
    const contenders = [];
    for (const entry of entries) {
      if (!entry.isDirectory() || !LEASE_LOCK_CONTENDER_PATTERN.test(entry.name)) continue;
      const contenderDirectory = path.join(lockDirectory, entry.name);
      try {
        const contenderStat = await stat(contenderDirectory);
        if (observedAt - contenderStat.mtimeMs > leaseTtlMs) {
          await rm(contenderDirectory, { recursive: true, force: true });
          continue;
        }
        let ticket = null;
        try {
          const parsed = JSON.parse(await readFile(path.join(contenderDirectory, LEASE_LOCK_TICKET_FILE), 'utf8'));
          if (
            parsed?.kind === 'automation.lease-lock-contender' &&
            parsed.identity === entry.name &&
            Number.isSafeInteger(parsed.ticket) &&
            parsed.ticket > 0
          ) {
            ticket = parsed.ticket;
          }
        } catch (error) {
          if (error.code !== 'ENOENT' && !(error instanceof SyntaxError)) throw error;
        }
        contenders.push({ identity: entry.name, ticket });
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
    }
    return contenders;
  }

  async function assertWriteAuthority(assertLockOwnership, credentials, phase) {
    await beforeAuthoritativeWrite?.({ phase });
    await assertLockOwnership();
    await assertLeaseInternal(credentials ?? {});
  }

  function nowDate() {
    const value = clock();
    const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
    if (Number.isNaN(date.getTime())) throw new Error('clock must return a valid date value.');
    return date;
  }

  function filePath(name) {
    return path.join(root, name);
  }

  return {
    root,
    files: STORE_FILES,
    initialize,
    appendEvent,
    acquireLease,
    heartbeatLease,
    releaseLease,
    readLease,
    readEvents,
    readState,
    readRemote,
    updateRemote
  };
}

function stateOptions(manifest) {
  return {
    runId: manifest.runId,
    createdAt: manifest.createdAt,
    maxAttempts: manifest.maxAttempts
  };
}

async function atomicWriteJson(file, value) {
  await atomicWriteText(file, `${JSON.stringify(value, null, 2)}\n`);
}

async function atomicWriteText(file, content) {
  return atomicWriteBuffer(file, Buffer.from(content, 'utf8'));
}

async function atomicWriteBuffer(file, content) {
  await mkdir(path.dirname(file), { recursive: true });
  const temporary = path.join(
    path.dirname(file),
    `.${path.basename(file)}.tmp-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`
  );
  let handle;
  try {
    handle = await open(temporary, 'wx', 0o600);
    await handle.writeFile(content);
    await handle.sync();
    await handle.close();
    handle = null;
    await rename(temporary, file);
  } finally {
    await handle?.close().catch(() => undefined);
    await rm(temporary, { force: true }).catch(() => undefined);
  }
}

async function appendJsonLine(file, value) {
  const handle = await open(file, 'a', 0o600);
  try {
    await handle.writeFile(`${JSON.stringify(value)}\n`, 'utf8');
    await handle.sync();
  } finally {
    await handle.close();
  }
}

async function writeExclusiveJson(file, value) {
  const handle = await open(file, 'wx', 0o600);
  try {
    await handle.writeFile(`${JSON.stringify(value)}\n`, 'utf8');
    await handle.sync();
  } finally {
    await handle.close();
  }
}

function lockContenderPrecedes(left, right) {
  return left.ticket < right.ticket || (
    left.ticket === right.ticket && left.identity.localeCompare(right.identity) < 0
  );
}

function initialSummary(state) {
  const delivered = state.tasks.filter((task) => task.delivery?.status === 'succeeded').length;
  return [
    '<!-- ai-agent-playbook:automation-summary -->',
    `# ${state.runId} Automation Summary`,
    '',
    `Status: ${state.runStatus}`,
    `Tasks: ${state.progress.tasks.completed}/${state.progress.tasks.total}`,
    `Criteria: ${state.progress.criteria.passed}/${state.progress.criteria.total}`,
    `Delivery checkpoints: ${delivered}/${state.tasks.length}`,
    ''
  ].join('\n');
}

function initialHandoff(state) {
  const outcome = state.runStatus === 'completed'
    ? 'Completed.'
    : state.runStatus === 'cancelled'
      ? 'Cancelled.'
      : state.runStatus === 'blocked'
        ? 'Blocked; inspect the ledger and task blockers.'
        : 'Pending.';
  const deliveries = state.tasks.filter((task) => task.delivery?.status === 'succeeded');
  const localOnlyDelivery = deliveries.some((task) => (
    !task.delivery.operations.includes('push') && (
      !task.delivery.skipped || ['no-git', 'non-git-project'].includes(task.delivery.reason)
    )
  ));
  return [
    `# ${state.runId} Handoff`,
    '',
    '## Outcome',
    '',
    `- ${outcome}`,
    '',
    '## Delivery checkpoints',
    '',
    ...(deliveries.length > 0
      ? deliveries.map((task) => `- ${task.id}: branch=${task.delivery.branch ?? 'none'}; workspace=${task.delivery.workspace ?? 'current checkout'}; operations=${task.delivery.operations.join(', ') || 'none'}`)
      : ['- None.']),
    '',
    '## Remaining risk',
    '',
    state.runStatus === 'completed' && !localOnlyDelivery
      ? '- None recorded by the controller.'
      : localOnlyDelivery
        ? '- Local-only output remains in the recorded workspace until an operator reviews and integrates or exports it.'
        : '- Pending.',
    ''
  ].join('\n');
}

function positiveInteger(value, fallback, name) {
  const selected = value ?? fallback;
  if (!Number.isInteger(selected) || selected < 1) throw new Error(`${name} must be a positive integer.`);
  return selected;
}

function validateOwnerId(ownerId) {
  if (typeof ownerId !== 'string' || !ownerId.trim() || ownerId.length > 200 || /[\u0000-\u001f\u007f]/.test(ownerId)) {
    throw new Error('ownerId must be a non-empty controller id.');
  }
}

function isLeaseActive(lease, now) {
  return Boolean(
    lease?.ownerId &&
    Number.isInteger(lease.fencingToken) &&
    Date.parse(lease.expiresAt) > now.getTime()
  );
}

function staleFencingError() {
  return new Error('Stale fencing token or inactive controller lease.');
}

function leaseLockLostError() {
  return Object.assign(
    new Error('Local lease lock ownership was lost before an authoritative write.'),
    { code: 'automation.lease.lock-lost' }
  );
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function mergeRemoteState(current, patch) {
  const result = structuredClone(current);
  for (const [key, value] of Object.entries(patch)) {
    if (['__proto__', 'prototype', 'constructor', 'schemaVersion', 'kind'].includes(key)) continue;
    if (isRecord(value) && isRecord(result[key])) result[key] = mergeRemoteState(result[key], value);
    else result[key] = structuredClone(value);
  }
  return result;
}

function sameEventIdentity(existing, candidate) {
  return JSON.stringify(stableEventPayload(existing)) === JSON.stringify(stableEventPayload(candidate));
}

function stableEventPayload(value) {
  if (Array.isArray(value)) return value.map((item) => stableEventPayload(item));
  if (!isRecord(value)) return value;
  const ignored = new Set(['schemaVersion', 'eventId', 'sequence', 'timeUtc', 'controllerId', 'fencingToken']);
  return Object.fromEntries(Object.keys(value)
    .filter((key) => !ignored.has(key) && value[key] !== undefined)
    .sort((left, right) => left.localeCompare(right))
    .map((key) => [key, stableEventPayload(value[key])]));
}

function isLegacyFormat(format) {
  return format?.type === 'run-v1' || format?.type === 'workflow-run-v1';
}

function legacyReadOnlyError() {
  return Object.assign(
    new Error('Legacy run is read-only and cannot be mutated by automation.'),
    { code: 'ERR_AUTOMATION_LEGACY_READ_ONLY' }
  );
}

function parseLegacyVerificationChecklist(text) {
  const criteria = [];
  let inVerification = false;
  for (const rawLine of String(text).replace(/\r\n/g, '\n').split('\n')) {
    const heading = rawLine.trim().match(/^##\s+(.+)$/);
    if (heading) {
      inVerification = heading[1].trim().toLowerCase() === 'verification';
      continue;
    }
    if (!inVerification) continue;
    const item = rawLine.trim().match(/^[-*]\s+\[([ xX])\]\s+(.+)$/);
    if (!item) continue;
    criteria.push({
      id: `legacy-verification-${criteria.length + 1}`,
      status: item[1].toLowerCase() === 'x' ? 'pass' : 'info',
      message: item[2].trim()
    });
  }
  return criteria;
}

export { STORE_FILES as RUN_STORE_FILES };
