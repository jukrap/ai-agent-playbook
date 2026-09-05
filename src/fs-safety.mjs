import { constants } from 'node:fs';
import { lstat, realpath, readdir, open, mkdir, writeFile, rename, unlink } from 'node:fs/promises';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';

export const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
export function inside(root, target) {
  const rel = path.relative(path.resolve(root), path.resolve(target));
  return rel === '' || (!path.isAbsolute(rel) && rel !== '..' && !rel.startsWith(`..${path.sep}`));
}
export function relativePath(value) {
  if (typeof value !== 'string' || !value || /[\x00-\x1f:]/.test(value) || path.isAbsolute(value) || /^[\\/]/.test(value)) {
    throw new Error('Expected a non-empty project-relative path.');
  }
  const normalized = value.replaceAll('\\', '/');
  if (normalized.split('/').some((p) => !p || p === '.' || p === '..' || /[. ]$/.test(p) || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\.|$)/i.test(p))) {
    throw new Error('Unsafe relative path.');
  }
  return normalized;
}
export async function statOrNull(file) {
  try { return await lstat(file); } catch (e) { if (e.code === 'ENOENT') return null; throw e; }
}
export async function noLinks(file) {
  const full = path.resolve(file);
  let current = path.parse(full).root;
  for (const part of full.slice(current.length).split(path.sep).filter(Boolean)) {
    current = path.join(current, part);
    const st = await statOrNull(current);
    if (!st) return;
    if (st.isSymbolicLink()) throw new Error('Refusing a symbolic link or junction: ' + current);
  }
}
export async function projectRoot(target) {
  const full = path.resolve(target);
  await noLinks(full);
  const st = await lstat(full);
  if (!st.isDirectory()) throw new Error('Target must be an existing directory.');
  return realpath(full);
}
export async function safePath(root, relative) {
  const file = path.resolve(root, relativePath(relative));
  if (!inside(root, file) || file === path.resolve(root)) throw new Error('Path escapes the selected root.');
  await noLinks(file);
  return file;
}
export async function readBytes(file, maxBytes = 1_000_000) {
  await noLinks(file);
  const before = await lstat(file);
  if (!before.isFile() || before.size > maxBytes) throw new Error('Expected a bounded regular file: ' + file);
  const handle = await open(file, constants.O_RDONLY);
  try {
    const opened = await handle.stat();
    if (!opened.isFile() || opened.dev !== before.dev || opened.ino !== before.ino || opened.size > maxBytes) throw new Error('File changed during inspection.');
    const buffer = Buffer.alloc(maxBytes + 1);
    let size = 0;
    while (size <= maxBytes) {
      const read = await handle.read(buffer, size, buffer.length - size, size);
      if (!read.bytesRead) break;
      size += read.bytesRead;
    }
    if (size > maxBytes) throw new Error('File exceeds the read limit.');
    return buffer.subarray(0, size);
  } finally { await handle.close(); }
}
export async function readText(file, maxBytes = 1_000_000) {
  const bytes = await readBytes(file, maxBytes);
  if (bytes.includes(0)) throw new Error('Binary files are not text records.');
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes).replace(/^\uFEFF/, '');
}
export async function readJson(file, maxBytes = 1_000_000) {
  return JSON.parse(await readText(file, maxBytes));
}
export async function writeAtomic(file, content, { exclusive = false } = {}) {
  await noLinks(file);
  await mkdir(path.dirname(file), { recursive: true });
  await noLinks(path.dirname(file));
  if (exclusive) {
    await writeFile(file, content, { flag: 'wx' });
    return;
  }
  const temp = path.join(path.dirname(file), '.' + path.basename(file) + '.' + randomUUID() + '.tmp');
  try {
    await writeFile(temp, content, { flag: 'wx' });
    await noLinks(file);
    await rename(temp, file);
  } finally { await unlink(temp).catch((e) => { if (e.code !== 'ENOENT') throw e; }); }
}
export async function treeSnapshot(root, { maxFiles = 4000, maxBytes = 32_000_000, exclude = [] } = {}) {
  await noLinks(root);
  if (!await statOrNull(root)) return null;
  const files = {};
  let bytes = 0;
  async function walk(dir) {
    const entries = (await readdir(dir, { withFileTypes: true })).sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
    for (const entry of entries) {
      const file = path.join(dir, entry.name);
      if (entry.isSymbolicLink()) throw new Error('Refusing a linked tree entry: ' + file);
      if (entry.isDirectory()) await walk(file);
      else if (entry.isFile()) {
        const rel = path.relative(root, file).replaceAll('\\', '/');
        const content = await readBytes(file, maxBytes);
        bytes += content.length;
        if (bytes > maxBytes || Object.keys(files).length >= maxFiles) throw new Error('Tree exceeds snapshot limits.');
        files[rel] = sha256(content);
      } else throw new Error('Unsupported filesystem entry: ' + file);
    }
  }
  await walk(root);
  const signature = (names) => sha256(names.sort().map((name) => name + '=' + files[name]).join('\n'));
  const legacyNames = Object.keys(files).filter((name) => !exclude.includes(name)).sort((a, b) => a.localeCompare(b));
  return { files, bytes, hash: signature(Object.keys(files).filter((name) => !exclude.includes(name))), legacyHash: sha256(legacyNames.map((name) => name + '=' + files[name]).join('\n')), treeHash: signature(Object.keys(files)) };
}
