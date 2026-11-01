// Hermetic source-input tests only. No browser/DOM execution or network access.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, mkdir, mkdtemp, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {readGuidanceBaseline} from './rebuild-plan-guidance-browser.mjs';

const root = new URL('../../../', import.meta.url);
const fixtures = new URL('../test-fixtures/guidance-baselines/', import.meta.url);
const artifacts = new URL('.local-artifacts/portal-rebuild/w3-v3-ci-portability-diagnostic/', root);
const manifest = JSON.parse(await readFile(new URL('manifest.json', fixtures), 'utf8'));
assert.equal(manifest.sources.length, 4);
for (const source of manifest.sources) {
  test('retained full source matches pinned bytes and Git blob: ' + source.fixture, async () => {
    const contents = await readGuidanceBaseline(source.sourceCommit + ':' + source.sourcePath);
    const bytes = Buffer.from(contents);
    assert.equal(bytes.length, source.bytes);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), source.sha256);
    assert.equal(createHash('sha1').update('blob ' + bytes.length + '\0').update(bytes).digest('hex'), source.blob);
  });
}

test('unknown, missing, altered source and altered manifest fail closed', async () => {
  const source = manifest.sources[0], key = source.sourceCommit + ':' + source.sourcePath;
  await assert.rejects(readGuidanceBaseline(source.sourceCommit + ':unowned.ts'), /unknown guidance baseline/);
  const missing = Object.assign(new Error('deliberate missing baseline file'), {code: 'ENOENT'});
  await assert.rejects(readGuidanceBaseline(key, {readFile: async url => {
    if (url.pathname.endsWith(source.fixture)) throw missing;
    return readFile(url);
  }}), error => error === missing);
  await assert.rejects(readGuidanceBaseline(key, {readFile: async url => {
    const bytes = await readFile(url);
    if (url.pathname.endsWith(source.fixture)) {const changed = Buffer.from(bytes); changed[0] ^= 1; return changed;}
    return bytes;
  }}), /source hash mismatch/);
  await assert.rejects(readGuidanceBaseline(key, {readFile: async url => {
    const bytes = await readFile(url);
    return url.pathname.endsWith('/manifest.json') ? Buffer.concat([bytes, Buffer.from(' ')]) : bytes;
  }}), /manifest hash mismatch/);
});

test('ordinary packaging assertions retain both sensitivity selectors without historical Git objects', async () => {
  await mkdir(artifacts, {recursive: true});
  const isolated = await mkdtemp(new URL('hermetic-git-', artifacts));
  const env = {...process.env, GIT_DIR: isolated};
  // Confine Git to this own ignored bare store and run a distinct Node test runner.
  for (const key of ['GIT_COMMON_DIR', 'GIT_WORK_TREE', 'GIT_OBJECT_DIRECTORY', 'GIT_ALTERNATE_OBJECT_DIRECTORIES', 'GIT_INDEX_FILE', 'NODE_TEST_CONTEXT']) delete env[key];
  const init = spawnSync('git', ['init', '--bare', isolated], {env, encoding: 'utf8'});
  assert.equal(init.status, 0, init.stderr);
  for (const commit of ['c4d5a9e0ed86c2ca703f6e5d0ac73988a4f6af77', 'e093dd018d59bd1657297f0a7a186179e59d5fc3']) {
    const absent = spawnSync('git', ['cat-file', '-e', commit + '^{commit}'], {env, encoding: 'utf8'});
    assert.notEqual(absent.status, 0, 'historical object must actually be unavailable');
  }
  const result = spawnSync(process.execPath, ['--experimental-strip-types', '--test', '--test-concurrency=1', 'apps/portal/tests/rebuild-plan-guidance-packaging.test.mjs'], {
    cwd: fileURLToPath(root), env, encoding: 'utf8', maxBuffer: 5_000_000,
  });
  await writeFile(new URL('hermetic-packaging-child.log', artifacts), result.stdout + result.stderr);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /# pass 5\b/);
  assert.match(result.stdout, /# fail 0\b/);
  assert.match(result.stdout, /# skipped 0\b/);
});
