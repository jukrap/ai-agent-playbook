import path from 'node:path';
import { assertDirectory, normalizePortablePath, resolvePlaybookLayout, SCHEMA_VERSION } from '../harness/core.mjs';
import { buildDependencyInventoryIndex } from './dependency-inventory.mjs';
import { buildRuntimeIndex } from './indexes.mjs';
import { buildRouteApiHintsIndex } from './route-api-hints.mjs';
import { buildSymbolOutlineIndex } from './symbol-outline.mjs';

const REPO_GRAPH_FILE = 'runtime/graphs/repo-graph.json';
const DEFAULT_MAX_NODES = 300;
const DEFAULT_MAX_EDGES = 600;

export async function previewRepoGraph({ target, maxNodes = DEFAULT_MAX_NODES, maxEdges = DEFAULT_MAX_EDGES } = {}) {
  await assertDirectory(target, 'Target repository does not exist');
  const resolvedTarget = path.resolve(target);
  const playbook = resolvePlaybookLayout(resolvedTarget);
  const nodeLimit = normalizeLimit(maxNodes, DEFAULT_MAX_NODES);
  const edgeLimit = normalizeLimit(maxEdges, DEFAULT_MAX_EDGES);
  const [inventory, symbols, dependencies, routeApiHints] = await Promise.all([
    buildRuntimeIndex({ target: resolvedTarget, apply: false }),
    buildSymbolOutlineIndex({ target: resolvedTarget, maxEntries: nodeLimit }),
    buildDependencyInventoryIndex({ target: resolvedTarget }),
    buildRouteApiHintsIndex({ target: resolvedTarget, maxHints: nodeLimit })
  ]);

  const graph = createGraphBuilder({ maxNodes: nodeLimit, maxEdges: edgeLimit });
  const relevantFiles = collectRelevantFiles({ symbols, dependencies, routeApiHints });

  for (const filePath of relevantFiles) {
    const inventoryEntry = inventory.files.find((entry) => entry.path === filePath);
    addFileNode(graph, inventoryEntry ?? { path: filePath, category: 'source' });
  }
  for (const hint of routeApiHints.hints) addRouteApiHintNode(graph, hint);
  for (const manifest of dependencies.manifests) addPackageNode(graph, manifest, 'manifest');
  for (const lockfile of dependencies.lockfiles) addPackageNode(graph, lockfile, 'lockfile');
  for (const container of dependencies.containers) addPackageNode(graph, container, 'container');
  for (const ci of dependencies.ci) addPackageNode(graph, ci, 'ci');
  for (const entry of symbols.entries) addSymbolNode(graph, entry);
  for (const entry of inventory.files) addFileNode(graph, entry);

  const warnings = [
    ...inventory.warnings,
    ...symbols.warnings,
    ...dependencies.warnings,
    ...routeApiHints.warnings,
    ...graph.warnings
  ];

  return {
    schemaVersion: SCHEMA_VERSION,
    kind: 'runtime.repo-graph',
    ok: true,
    target: resolvedTarget,
    applied: false,
    mode: { localOnly: true, network: false, writes: false },
    graph: `${playbook.dir}/${REPO_GRAPH_FILE}`,
    generatedAt: new Date().toISOString(),
    scanRange: {
      sourceReports: ['runtime.file-inventory', 'runtime.symbol-outline', 'runtime.dependency-inventory', 'runtime.route-api-hints'],
      maxNodes: nodeLimit,
      maxEdges: edgeLimit
    },
    sources: sourceSummaries([inventory, symbols, dependencies, routeApiHints]),
    nodes: graph.nodes,
    edges: graph.edges,
    summary: summarizeGraph(graph, warnings),
    warnings,
    conflicts: []
  };
}

function createGraphBuilder({ maxNodes, maxEdges }) {
  return {
    maxNodes,
    maxEdges,
    nodes: [],
    edges: [],
    nodeIds: new Set(),
    edgeIds: new Set(),
    nodeTruncated: false,
    edgeTruncated: false,
    warnings: []
  };
}

function collectRelevantFiles({ symbols, dependencies, routeApiHints }) {
  const files = new Set();
  for (const entry of symbols.entries ?? []) files.add(entry.file);
  for (const hint of routeApiHints.hints ?? []) files.add(hint.file);
  for (const entry of dependencies.manifests ?? []) files.add(entry.path);
  for (const entry of dependencies.lockfiles ?? []) files.add(entry.path);
  for (const entry of dependencies.containers ?? []) files.add(entry.path);
  for (const entry of dependencies.ci ?? []) files.add(entry.path);
  return [...files].sort();
}

function addFileNode(graph, entry) {
  if (!entry?.path) return false;
  return addNode(graph, {
    id: fileNodeId(entry.path),
    kind: entry.category === 'docs' ? 'doc' : 'file',
    label: entry.path,
    path: entry.path,
    category: entry.category ?? 'unknown',
    extension: entry.extension ?? null,
    bytes: typeof entry.bytes === 'number' ? entry.bytes : null,
    source: 'runtime.file-inventory'
  });
}

function addSymbolNode(graph, entry) {
  if (!entry?.file || !entry.name) return;
  const fileId = fileNodeId(entry.file);
  if (!graph.nodeIds.has(fileId)) return;
  const symbolId = `symbol:${entry.file}:${entry.line}:${entry.name}`;
  if (!addNode(graph, {
    id: symbolId,
    kind: 'symbol',
    label: entry.name,
    path: entry.file,
    line: entry.line,
    symbolKind: entry.kind,
    language: entry.language,
    confidence: entry.confidence,
    source: entry.source
  })) return;
  addEdge(graph, {
    id: `contains:${fileId}:${symbolId}`,
    kind: 'contains',
    from: fileId,
    to: symbolId,
    sourcePath: entry.file,
    line: entry.line,
    confidence: entry.confidence,
    source: entry.source
  });
}

function addRouteApiHintNode(graph, hint) {
  if (!hint?.file) return;
  const fileId = fileNodeId(hint.file);
  if (!graph.nodeIds.has(fileId)) return;
  const label = hint.path || hint.name || `${hint.kind}:${hint.line}`;
  const nodeKind = hint.kind === 'data' ? 'data' : 'route';
  const nodeId = `${nodeKind}:${hint.file}:${hint.line}:${stablePart(label)}`;
  if (!addNode(graph, {
    id: nodeId,
    kind: nodeKind,
    label,
    path: hint.file,
    line: hint.line,
    hintKind: hint.kind,
    method: hint.method ?? null,
    framework: hint.framework ?? null,
    operation: hint.operation ?? null,
    confidence: hint.confidence,
    source: hint.source
  })) return;
  addEdge(graph, {
    id: `${hint.kind === 'data' ? 'mentions' : 'defines-route'}:${fileId}:${nodeId}`,
    kind: hint.kind === 'data' ? 'mentions' : 'defines-route',
    from: fileId,
    to: nodeId,
    sourcePath: hint.file,
    line: hint.line,
    confidence: hint.confidence,
    source: hint.source
  });
}

function addPackageNode(graph, entry, packageKind) {
  if (!entry?.path) return;
  const fileId = fileNodeId(entry.path);
  if (!graph.nodeIds.has(fileId)) addFileNode(graph, { path: entry.path, category: 'config' });
  if (!graph.nodeIds.has(fileId)) return;
  const label = entry.name ?? entry.ecosystem ?? entry.kind ?? path.basename(entry.path);
  const packageId = `package:${packageKind}:${entry.path}`;
  if (!addNode(graph, {
    id: packageId,
    kind: 'package',
    label,
    path: entry.path,
    packageKind,
    ecosystem: entry.ecosystem ?? null,
    source: 'runtime.dependency-inventory'
  })) return;
  addEdge(graph, {
    id: `uses-package:${fileId}:${packageId}`,
    kind: 'uses-package',
    from: fileId,
    to: packageId,
    sourcePath: entry.path,
    confidence: 'medium',
    source: 'runtime.dependency-inventory'
  });
}

function addNode(graph, node) {
  if (graph.nodeIds.has(node.id)) return true;
  if (graph.nodes.length >= graph.maxNodes) {
    markNodeTruncated(graph);
    return false;
  }
  graph.nodeIds.add(node.id);
  graph.nodes.push(node);
  return true;
}

function addEdge(graph, edge) {
  if (graph.edgeIds.has(edge.id)) return true;
  if (!graph.nodeIds.has(edge.from) || !graph.nodeIds.has(edge.to)) return false;
  if (graph.edges.length >= graph.maxEdges) {
    markEdgeTruncated(graph);
    return false;
  }
  graph.edgeIds.add(edge.id);
  graph.edges.push(edge);
  return true;
}

function markNodeTruncated(graph) {
  if (graph.nodeTruncated) return;
  graph.nodeTruncated = true;
  graph.warnings.push({
    id: 'repo-graph.max-nodes',
    message: `Repo graph truncated at ${graph.maxNodes} nodes.`
  });
}

function markEdgeTruncated(graph) {
  if (graph.edgeTruncated) return;
  graph.edgeTruncated = true;
  graph.warnings.push({
    id: 'repo-graph.max-edges',
    message: `Repo graph truncated at ${graph.maxEdges} edges.`
  });
}

function summarizeGraph(graph, warnings) {
  return {
    nodes: graph.nodes.length,
    edges: graph.edges.length,
    byNodeKind: countBy(graph.nodes, 'kind'),
    byEdgeKind: countBy(graph.edges, 'kind'),
    truncatedNodes: graph.nodeTruncated,
    truncatedEdges: graph.edgeTruncated,
    warnings: warnings.length,
    conflicts: 0
  };
}

function sourceSummaries(reports) {
  return reports.map((report) => ({
    kind: report.kind,
    generatedAt: report.generatedAt,
    index: report.index ?? null,
    entries: report.summary?.files ?? report.summary?.entries ?? report.summary?.manifests ?? report.summary?.hints ?? 0,
    warnings: report.warnings?.length ?? 0,
    conflicts: report.conflicts?.length ?? 0
  }));
}

function countBy(entries, field) {
  const counts = {};
  for (const entry of entries) {
    const value = entry[field] ?? 'unknown';
    counts[value] = (counts[value] ?? 0) + 1;
  }
  return counts;
}

function fileNodeId(filePath) {
  return `file:${normalizePortablePath(filePath)}`;
}

function stablePart(value) {
  return String(value).replace(/[^A-Za-z0-9_.:/-]+/g, '_').slice(0, 80);
}

function normalizeLimit(value, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(Math.trunc(parsed), 1000);
}
