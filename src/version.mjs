import { readFileSync } from 'node:fs';

const packageJson = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8')
);

if (typeof packageJson.version !== 'string' || !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(packageJson.version)) {
  throw new Error('package.json must contain a valid package version.');
}

export const PACKAGE_VERSION = packageJson.version;
export const PACKAGE_SPECIFIER = `ai-agent-playbook@${PACKAGE_VERSION}`;
export const PACKAGE_USER_AGENT = `ai-agent-playbook/${PACKAGE_VERSION}`;
