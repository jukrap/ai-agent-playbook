import { readdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { normalizePortablePath, SCHEMA_VERSION } from '../harness/core.mjs';

export const TAXONOMY_VERSION = '2';

export const CAPABILITY_CATEGORIES = [
  { id: 'foundation', title: 'Foundation', description: 'Repository onboarding, bootstrap, and project memory setup.' },
  { id: 'delivery', title: 'Delivery', description: 'Planning, verification, git, PR, release, and worklog flows.' },
  { id: 'architecture', title: 'Architecture', description: 'FSD, layered architecture, DDD, monorepos, and boundary review.' },
  { id: 'frontend', title: 'Frontend', description: 'UI, state, data fetching, accessibility, performance, and visual QA.' },
  { id: 'backend', title: 'Backend', description: 'API contracts, auth, server-rendered flows, workers, and integrations.' },
  { id: 'database', title: 'Database', description: 'Schema change, migration, SQL, reporting, and data integrity.' },
  { id: 'devops', title: 'DevOps', description: 'CI/CD, containers, deployment, runtime configuration, and observability.' },
  { id: 'security', title: 'Security', description: 'Secrets, threat modeling, authorization, and dependency risk review.' },
  { id: 'mobile', title: 'Mobile', description: 'Expo, React Native, native app, WebView bridge, and device QA.' },
  { id: 'data', title: 'Data', description: 'Analytics, pipelines, ETL, dashboards, and data quality.' },
  { id: 'ai-harness', title: 'AI Harness', description: 'MCP, skills, agents, context engineering, cache, and index design.' },
  { id: 'legacy', title: 'Legacy', description: 'Legacy change safety and compatibility strategy.' }
];

export const COMPATIBILITY_WRAPPERS = {
  'commit-worklog-guardrails': {
    primary: 'delivery/git-worklog-guardrails',
    references: []
  },
  'frontend-ui-polish': {
    primary: 'frontend/ui-polish',
    references: []
  },
  'legacy-java-spring-mvc': {
    primary: 'backend/server-rendered-change',
    references: ['references/java-spring-mvc.md']
  },
  'legacy-php-lamp': {
    primary: 'backend/server-rendered-change',
    references: ['references/php-lamp.md']
  },
  'legacy-dotnet-webforms': {
    primary: 'backend/server-rendered-change',
    references: ['references/dotnet-webforms.md']
  },
  'legacy-jquery-web': {
    primary: 'frontend/browser-dom-change',
    references: ['references/jquery-browser.md']
  },
  'legacy-android-webview-hybrid': {
    primary: 'mobile/webview-bridge',
    references: ['references/android-webview-hybrid.md']
  }
};

export const CANONICAL_SKILL_CATEGORIES = {
  'api-contract-boundary': 'backend',
  'cleanup-ai-slop': 'delivery',
  'commit-worklog-guardrails': 'delivery',
  'frontend-ui-polish': 'frontend',
  'project-bootstrap': 'foundation',
  'project-doc-system': 'foundation',
  'repo-onboarding': 'foundation',
  'review-work-light': 'delivery',
  'style-quality-review': 'frontend',
  'ui-style-policy': 'frontend',
  'agent-skill-authoring': 'ai-harness'
};

export const WORKFLOW_RECIPES = [
  {
    id: 'repo-onboarding',
    title: 'Repo Onboarding',
    category: 'foundation',
    outputs: ['memory/context', 'memory/maps', 'runtime/indexes']
  },
  {
    id: 'feature-delivery',
    title: 'Feature Delivery',
    category: 'delivery',
    outputs: ['workflows/plans', 'workflows/runs', 'workflows/worklogs']
  },
  {
    id: 'legacy-change',
    title: 'Legacy Change',
    category: 'legacy',
    outputs: ['workflows/plans', 'memory/contracts', 'workflows/worklogs']
  },
  {
    id: 'backend-contract-change',
    title: 'Backend Contract Change',
    category: 'backend',
    outputs: ['memory/contracts', 'workflows/runs']
  },
  {
    id: 'database-migration',
    title: 'Database Migration',
    category: 'database',
    outputs: ['memory/contracts', 'workflows/runbooks', 'workflows/worklogs']
  },
  {
    id: 'ci-failure-triage',
    title: 'CI Failure Triage',
    category: 'devops',
    outputs: ['runtime/reports', 'workflows/worklogs']
  },
  {
    id: 'security-audit',
    title: 'Security Audit',
    category: 'security',
    outputs: ['runtime/reports', 'memory/decisions']
  },
  {
    id: 'frontend-polish',
    title: 'Frontend Polish',
    category: 'frontend',
    outputs: ['runtime/reports', 'workflows/runs']
  },
  {
    id: 'mobile-release',
    title: 'Mobile Release',
    category: 'mobile',
    outputs: ['workflows/runbooks', 'runtime/reports']
  },
  {
    id: 'documentation-package',
    title: 'Documentation Package',
    category: 'foundation',
    outputs: ['knowledge/references', 'memory/maps']
  },
  {
    id: 'harness-extension',
    title: 'Harness Extension',
    category: 'ai-harness',
    outputs: ['integrations/mcp', 'policy/SKILLS.md']
  }
];

export async function capabilityCatalog({ repoRoot }) {
  const skills = await skillCatalog({ repoRoot });
  const workflows = workflowCatalog();
  return {
    schemaVersion: SCHEMA_VERSION,
    ok: true,
    taxonomyVersion: TAXONOMY_VERSION,
    categories: CAPABILITY_CATEGORIES.map((category) => ({
      ...category,
      skills: skills.skills.filter((skill) => skill.canonicalCategory === category.id).length,
      workflows: workflows.workflows.filter((workflow) => workflow.category === category.id).length
    })),
    summary: {
      categories: CAPABILITY_CATEGORIES.length,
      skills: skills.summary.skills,
      workflows: workflows.summary.workflows,
      wrappers: Object.keys(COMPATIBILITY_WRAPPERS).length,
      warnings: skills.summary.warnings,
      conflicts: skills.summary.conflicts
    },
    warnings: skills.warnings,
    conflicts: skills.conflicts
  };
}

export async function skillCatalog({ repoRoot }) {
  const skillsRoot = path.join(repoRoot, 'skills');
  const categoryIds = new Set(CAPABILITY_CATEGORIES.map((category) => category.id));
  const warnings = [];
  const conflicts = [];
  const skills = [];
  const seenNames = new Map();

  for (const category of await listDirectories(skillsRoot)) {
    const categoryRoot = path.join(skillsRoot, category);
    for (const skillDirName of await listDirectories(categoryRoot)) {
      const skillRoot = path.join(categoryRoot, skillDirName);
      const skillFile = path.join(skillRoot, 'SKILL.md');
      if (!existsSync(skillFile)) continue;
      const text = await readFile(skillFile, 'utf8');
      const frontmatter = parseSkillFrontmatter(text);
      const name = String(frontmatter.name ?? skillDirName).trim();
      const wrapper = COMPATIBILITY_WRAPPERS[name] ?? null;
      const canonicalCategory = canonicalCategoryFor({ name, category });
      const relativePath = normalizePortablePath(path.relative(repoRoot, skillFile));

      if (seenNames.has(name)) {
        conflicts.push({
          id: 'skill-taxonomy.duplicate-name',
          message: `Duplicate skill name: ${name}.`,
          paths: [seenNames.get(name), relativePath]
        });
      } else {
        seenNames.set(name, relativePath);
      }

      if (!categoryIds.has(canonicalCategory)) {
        warnings.push({
          id: 'skill-taxonomy.unknown-category',
          message: `Skill ${name} maps to unknown category ${canonicalCategory}.`,
          paths: [relativePath]
        });
      }

      if (wrapper && !text.includes(wrapper.primary)) {
        warnings.push({
          id: 'skill-taxonomy.wrapper-primary-missing',
          message: `Compatibility wrapper ${name} should point to ${wrapper.primary}.`,
          paths: [relativePath]
        });
      }

      for (const reference of wrapper?.references ?? []) {
        if (!existsSync(path.join(skillRoot, ...reference.split('/')))) {
          warnings.push({
            id: 'skill-taxonomy.wrapper-reference-missing',
            message: `Compatibility wrapper ${name} references missing ${reference}.`,
            paths: [relativePath]
          });
        }
      }

      skills.push({
        name,
        category,
        canonicalCategory,
        path: relativePath,
        description: String(frontmatter.description ?? ''),
        wrapperFor: wrapper?.primary ?? null,
        references: wrapper?.references ?? []
      });
    }
  }

  skills.sort((left, right) => left.canonicalCategory.localeCompare(right.canonicalCategory) || left.name.localeCompare(right.name));
  return {
    schemaVersion: SCHEMA_VERSION,
    ok: conflicts.length === 0,
    taxonomyVersion: TAXONOMY_VERSION,
    skills,
    summary: {
      skills: skills.length,
      categories: new Set(skills.map((skill) => skill.canonicalCategory)).size,
      wrappers: skills.filter((skill) => skill.wrapperFor).length,
      warnings: warnings.length,
      conflicts: conflicts.length
    },
    warnings,
    conflicts
  };
}

export function workflowCatalog() {
  return {
    schemaVersion: SCHEMA_VERSION,
    ok: true,
    taxonomyVersion: TAXONOMY_VERSION,
    workflows: WORKFLOW_RECIPES,
    summary: {
      workflows: WORKFLOW_RECIPES.length,
      categories: new Set(WORKFLOW_RECIPES.map((workflow) => workflow.category)).size,
      warnings: 0,
      conflicts: 0
    },
    warnings: [],
    conflicts: []
  };
}

function canonicalCategoryFor({ name, category }) {
  if (name.startsWith('legacy-')) return 'legacy';
  if (CANONICAL_SKILL_CATEGORIES[name]) return CANONICAL_SKILL_CATEGORIES[name];
  return category;
}

async function listDirectories(root) {
  if (!existsSync(root)) return [];
  const entries = await readdir(root, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function parseSkillFrontmatter(text) {
  if (!text.startsWith('---')) return {};
  const normalized = text.replace(/\r\n/g, '\n');
  const end = normalized.indexOf('\n---\n', 4);
  if (end === -1) return {};
  const raw = normalized.slice(4, end).trim();
  const result = {};
  for (const line of raw.split('\n')) {
    const index = line.indexOf(':');
    if (index === -1) continue;
    const key = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim();
    result[key] = value.replace(/^['"]|['"]$/g, '');
  }
  return result;
}
