import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { buildCandidate } from '../session-integration/runtime/scripts/build.mjs';

const scanner = await import('../session-integration/runtime/scripts/package-content-safety.mjs').catch(error => {
  if (error.code === 'ERR_MODULE_NOT_FOUND') return null;
  throw error;
});
const check = (content, filename = 'dist/vault/index.js') => {
  assert.equal(typeof scanner?.assertPackageContentSafe, 'function', 'Package secret checks must distinguish key values from prefix validation');
  return scanner.assertPackageContentSafe(content, filename);
};
const realisticSecret = ['sb', 'secret', 'A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7r8S9t0uVw'].join('_');

test('package scan permits secret-prefix validators without permitting secret values', () => {
  check('const permitted = /^sb_secret_/.test(key);');
  check('const permitted = key.startsWith("sb_secret_");');
});
for (const marker of [
  realisticSecret, 'sb_secret_synthetic', 'synthetic-access', 'synthetic-refresh', 'synthetic-verifier',
  'synthetic-storage-signature', 'sb_publishable_synthetic', 'testRunAlarm', 'testGetAlarm',
]) test(`package scan rejects prohibited marker category ${marker.startsWith('sb_secret_') ? 'secret-key-value' : marker}`, () => {
  assert.throws(() => check(`export const unexpected = ${JSON.stringify(marker)};`), error => {
    assert.match(error.message, /dist\/vault\/index\.js.*1 match/);
    assert.equal(error.message.includes(marker), false, 'Diagnostics must never echo credential or bundle contents');
    return true;
  });
});

test('package scan verifies the compiled gateway/vault and safely rejects a realistic injected key', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'shelv-package-secret-scan-'));
  try {
    await buildCandidate({ outdir: directory });
    for (const relative of ['advisor-pages/_worker.js', 'advisor-pages/_routes.json', 'pages/_worker.js', 'vault/index.js']) {
      const bytes = await readFile(path.join(directory, relative)); check(bytes, 'dist/' + relative);
      if (relative === 'vault/index.js') {
        assert.equal(bytes.includes(Buffer.from('sb_secret_')), true, 'Compiled reader still needs its secret-prefix validation');
        const injected = bytes.toString() + '\nconst injectedCredential = ' + JSON.stringify(realisticSecret) + ';';
        assert.throws(() => check(injected), error => {
          assert.match(error.message, /dist\/vault\/index\.js.*1 match/);
          assert.equal(error.message.includes(realisticSecret), false);
          assert.ok(error.message.length < 200, 'Failure must not dump a compiled bundle');
          return true;
        });
      }
    }
  } finally { await rm(directory, { recursive: true, force: true }); }
});
