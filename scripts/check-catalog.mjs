import { readFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalog = JSON.parse(await readFile(path.join(root, 'catalog.json'), 'utf8'));
assert.equal(new Set(catalog.map((s) => s.id)).size, catalog.length);
for (const s of catalog) {
  for (const lang of ['en', 'zh']) {
    assert.ok(s.title[lang]);
    assert.ok(s.summary[lang]);
  }
  for (const file of ['README.md', 'README.zh-CN.md']) {
    const text = await readFile(path.join(root, s.id, file), 'utf8');
    for (const [, image] of text.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g))
      if (!/^https?:/.test(image)) await access(path.resolve(root, s.id, image));
  }
  if (s.status === 'planned') continue;
  const m = JSON.parse(await readFile(path.join(root, s.id, 'extension.json')));
  assert.equal(m.publisher + '.' + m.name, 'samples.' + s.id);
  const lock = JSON.parse(await readFile(path.join(root, s.id, 'package-lock.json')));
  assert.equal(lock.packages['node_modules/@ambleloft/extension-sdk'].version, '0.1.0-alpha.7');
  if (s.screenshot) await access(path.resolve(root, s.screenshot));
}
console.log(`Catalog checked: ${catalog.length} entries`);
