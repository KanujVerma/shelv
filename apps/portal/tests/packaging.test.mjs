import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';

const portal = fileURLToPath(new URL('../', import.meta.url));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');

test('portable build includes both gateway audiences and preserves the supplied site source', async () => {
  const module = await import('../scripts/build.mjs').catch(error => {
    if (error.code === 'ERR_MODULE_NOT_FOUND') return null;
    throw error;
  });
  assert.equal(typeof module?.buildPortal, 'function', 'The portal needs a portable combined build entry point');
  const directory = await mkdtemp(path.join(tmpdir(), 'shelv-portal-package-'));
  try {
    const sourceDir = path.join(directory, 'source');
    await mkdir(sourceDir);
    const content = '<!doctype html><title>Synthetic packaging fixture</title>';
    await writeFile(path.join(sourceDir, 'index.html'), content);
    await writeFile(path.join(sourceDir, 'portal-config.json'), JSON.stringify({ advisorSharedSessions: true, clientSharedSessions: true }));
    const first = await module.buildPortal({ sourceDir, outputDir: path.join(directory, 'one') });
    assert.deepEqual(first.gatewayRoutes, ['/api/client/*', '/api/advisor/*']);
    assert.equal(first.assetCount, 4);
    assert.equal(await readFile(path.join(sourceDir, 'index.html'), 'utf8'), content);
    assert.equal(first.assets['index.html'].sha256, hash(Buffer.from(content)));
    const routes = JSON.parse(await readFile(path.join(directory, 'one/site/_routes.json'), 'utf8'));
    assert.deepEqual(routes.include, first.gatewayRoutes);
    const second = await module.buildPortal({ sourceDir, outputDir: path.join(directory, 'two') });
    assert.equal(second.zipSha256, first.zipSha256, 'Identical source must produce identical ZIP bytes');
    const worker = await readFile(path.join(directory, 'one/site/_worker.js'));
    assert.equal(first.assets['_worker.js'].sha256, hash(worker));
    const vault = await readFile(path.join(directory, 'one/runtime/vault/index.js'));
    assert.equal(first.vault.sha256, hash(vault));
    assert.equal(first.sourceSnapshotUnchanged, true);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('historical composition entry point cannot overwrite the current portal', () => {
  const result = spawnSync(process.execPath, [path.join(portal, 'session-integration/build-profile.mjs')], { encoding: 'utf8' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /historical|retired/i);
  assert.match(result.stderr, /npm.*build/i);
});
