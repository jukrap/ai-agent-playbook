import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

export const SKILL_PROFILES = Object.freeze({
  core: ['project-memory', 'spec-artifacts'],
  development: ['project-memory', 'spec-artifacts', 'design-brief-direction', 'ui-polish', 'natural-writing-humanization'],
  legacy: ['legacy-contracts']
});
export async function skillCatalog({ repoRoot }) {
  const skills = [];
  const root = path.join(repoRoot, 'skills');
  for (const category of await readdir(root, { withFileTypes: true })) {
    if (!category.isDirectory() || category.isSymbolicLink()) continue;
    for (const entry of await readdir(path.join(root, category.name), { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.isSymbolicLink()) continue;
      const directory = path.join(root, category.name, entry.name);
      let text;
      try { text = await readFile(path.join(directory, 'SKILL.md'), 'utf8'); }
      catch (error) { if (error.code === 'ENOENT') continue; throw error; }
      const name = /^name:\s*(.+)$/m.exec(text)?.[1].trim();
      const description = /^description:\s*(.+)$/m.exec(text)?.[1].trim();
      if (name !== entry.name || !description?.startsWith('Use when')) throw new Error('Invalid skill: ' + entry.name);
      skills.push({ name, category: category.name, description, directory });
    }
  }
  return skills.sort((a, b) => a.name.localeCompare(b.name));
}
/** @param {Array<{name: string, category: string, description: string, directory: string}>} catalog
 * @param {{profile?: string, skills?: string[]}} options */
export function selectSkills(catalog, { profile = 'core', skills } = {}) {
  if (!SKILL_PROFILES[profile]) throw new Error('Unknown skill profile: ' + profile);
  const names = skills?.length ? skills.flatMap((s) => s.split(',').map((name) => name.trim())) : SKILL_PROFILES[profile];
  if (names.some((name) => !name)) throw new Error('An explicit selection contains an empty skill name. Use skills list for available names.');
  const selected = [...new Set(names)].map((name) => {
    const skill = catalog.find((s) => s.name === name);
    if (!skill) throw new Error('Unknown skill: ' + name + '. Use skills list for available entrypoints; old wrappers are retired.');
    return skill;
  });
  return selected;
}
