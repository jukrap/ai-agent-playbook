import { readdir } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
const files = [];
async function walk(root) {
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const file = path.join(root, entry.name);
    if (entry.isDirectory()) await walk(file);
    else if (entry.isFile() && entry.name.endsWith('.mjs')) files.push(file);
  }
}
for (const root of ['bin', 'src', 'scripts']) await walk(root);
for (const file of files) await promisify(execFile)(process.execPath, ['--check', file]);
console.log('Syntax checked ' + files.length + ' JavaScript modules.');
