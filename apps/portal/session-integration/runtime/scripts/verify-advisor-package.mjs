import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { buildCandidate } from './build.mjs';
import { assertPackageContentSafe } from './package-content-safety.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
await buildCandidate();
const expected = { version: 1, include: ['/api/client/*', '/api/advisor/*', '/api/walkthroughs/*'], exclude: [] };
assert.deepEqual(JSON.parse(await readFile(path.join(root, 'dist/advisor-pages/_routes.json'), 'utf8')), expected);
const artifacts = {};
for (const relative of ['dist/advisor-pages/_worker.js', 'dist/advisor-pages/_routes.json', 'dist/pages/_worker.js', 'dist/vault/index.js']) {
  const bytes = await readFile(path.join(root, relative));
  assertPackageContentSafe(bytes, relative);
  artifacts[relative] = { bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') };
}
await mkdir(path.join(root, 'evidence'), { recursive: true });
await writeFile(path.join(root, 'evidence/ADVISOR-PACKAGE-CHECKS.json'), JSON.stringify({ combinedGatewayBuilt: true, syntheticCredentialsAbsent: true, testInstrumentationAbsent: true, artifacts }, null, 2) + '\n');
console.log(JSON.stringify({ ok: true, artifacts: Object.keys(artifacts).length, combinedGatewayBuilt: true }));
