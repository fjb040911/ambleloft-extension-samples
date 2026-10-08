const fs = require('node:fs/promises');
const path = require('node:path');
const { build } = require('esbuild');
const { spawnSync } = require('node:child_process');
(async () => {
  const root = __dirname,
    out = path.join(root, 'dist/package');
  const exists = async (p) =>
    fs.access(p).then(
      () => true,
      () => false,
    );
  if (await exists(path.join(root, 'tsconfig.json'))) {
    const result = spawnSync(
      process.execPath,
      [require.resolve('typescript/bin/tsc'), '-p', 'tsconfig.json'],
      { cwd: root, stdio: 'inherit' },
    );
    if (result.status !== 0) throw new Error('Type check failed');
  }
  await fs.rm(out, { recursive: true, force: true });
  await fs.mkdir(out, { recursive: true });
  const manifest = JSON.parse(await fs.readFile(path.join(root, 'extension.json'), 'utf8'));
  delete manifest.$schema;
  await fs.writeFile(path.join(out, 'extension.json'), JSON.stringify(manifest, null, 2));
  for (const file of await fs.readdir(root)) {
    if (
      /^extension\.nls.*\.json$/.test(file) ||
      ['README.md', 'README.zh-CN.md', 'NOTICE.md', 'LICENSE'].includes(file)
    )
      await fs.copyFile(path.join(root, file), path.join(out, file));
  }
  for (const dir of ['web', 'skills', 'assets', 'screenshots'])
    if (await exists(path.join(root, dir)))
      await fs.cp(path.join(root, dir), path.join(out, dir), { recursive: true });
  if (await exists(path.join(root, 'main.cjs')))
    await fs.copyFile(path.join(root, 'main.cjs'), path.join(out, 'main.cjs'));
  if (await exists(path.join(root, 'form.html')))
    await fs.copyFile(path.join(root, 'form.html'), path.join(out, 'form.html'));
  for (const entry of ['src/main.ts', 'src/extension.ts', 'src/extension.cjs'])
    if (await exists(path.join(root, entry)))
      await build({
        entryPoints: [path.join(root, entry)],
        outfile: path.join(out, manifest.main),
        bundle: true,
        platform: 'node',
        format: 'cjs',
        target: 'node22',
      });
  for (const entry of ['src/page.ts', 'src/page.js'])
    if (await exists(path.join(root, entry)))
      await build({
        entryPoints: [path.join(root, entry)],
        outfile: path.join(out, 'web/app.js'),
        bundle: true,
        platform: 'browser',
        format: 'esm',
        target: 'es2022',
      });
  const sdk = path.dirname(require.resolve('@ambleloft/extension-sdk'));
  for (const f of ['LICENSE', 'LICENSE-APACHE-2.0']) {
    const target = path.join(out, 'third-party/ambleloft-sdk', f);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.copyFile(path.join(sdk, f), target);
  }
  const pkg = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8'));
  if (pkg.devDependencies['csv-parse']) {
    const src = path.resolve(path.dirname(require.resolve('csv-parse/sync')), '../../LICENSE');
    await fs.mkdir(path.join(out, 'third-party/csv-parse'), { recursive: true });
    await fs.copyFile(src, path.join(out, 'third-party/csv-parse/LICENSE'));
  }
  console.log('Built ' + manifest.publisher + '.' + manifest.name);
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
