import { readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const action = process.argv[2],
  only = process.argv.slice(3);
if (!['install', 'build', 'validate', 'validate:archive', 'pack', 'test'].includes(action))
  throw Error('Use install, build, validate, pack, or test');
for (const sample of JSON.parse(readFileSync(path.join(root, 'catalog.json')))) {
  if (sample.status === 'planned' || (only.length && !only.includes(sample.id))) continue;
  console.log('\n' + action + ' ' + sample.id);
  const cwd = path.join(root, sample.id);
  const args =
    action === 'install'
      ? [
          existsSync(path.join(cwd, 'package-lock.json')) ? 'ci' : 'install',
          '--ignore-scripts',
          '--registry=https://registry.npmjs.org',
        ]
      : ['run', action];
  const result = spawnSync('npm', args, { cwd, stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
}
