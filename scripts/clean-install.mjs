import { mkdtemp, readFile, cp, rm, mkdir, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalog = JSON.parse(await readFile(path.join(root, 'catalog.json')));
const result = {
  time: new Date().toISOString(),
  node: process.version,
  mode: 'outside-repository; npm ci --offline uses previously populated npm cache',
  samples: [],
};
const temp = await mkdtemp(path.join(os.tmpdir(), 'amble-samples-clean-'));
try {
  for (const s of catalog.filter((s) => s.status !== 'planned')) {
    const dir = path.join(temp, s.id);
    await cp(path.join(root, s.id), dir, {
      recursive: true,
      filter: (source) => !['node_modules', 'dist'].includes(path.basename(source)),
    });
    for (const args of [
      ['ci', '--offline', '--ignore-scripts', '--no-audit'],
      ['run', 'build'],
      ['run', 'validate'],
      ['run', 'pack'],
      ['run', 'validate:archive'],
    ]) {
      const p = spawnSync('npm', args, { cwd: dir, encoding: 'utf8' });
      if (p.status !== 0) throw Error(`${s.id} ${args.join(' ')}\n${p.stdout}\n${p.stderr}`);
    }
    result.samples.push({ id: s.id, status: 'passed' });
    console.log('PASS clean install', s.id);
    await rm(dir, { recursive: true, force: true });
  }
} catch (e) {
  result.error = e.message;
  console.error(e);
  process.exitCode = 1;
} finally {
  await mkdir(path.join(root, 'docs/evidence'), { recursive: true });
  await writeFile(
    path.join(root, 'docs/evidence/clean-install.json'),
    JSON.stringify(result, null, 2),
  );
  await rm(temp, { recursive: true, force: true });
}
