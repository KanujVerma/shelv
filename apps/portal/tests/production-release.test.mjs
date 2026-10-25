import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm, access, symlink } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';

const target = JSON.parse(await readFile(new URL('../release/PRODUCTION-TARGET.json', import.meta.url), 'utf8'));
const installedExports = { AdvisorSessionObject: { type: 'durable-object', storage: 'sqlite' } };
const migrationInputs = Object.fromEntries(await Promise.all(target.pendingMigrationSources.map(async name => [name, await readFile(new URL('../../../' + name, import.meta.url))])));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const module = await import('../scripts/prepare-production-release.mjs').catch(error => {
  if (error.code === 'ERR_MODULE_NOT_FOUND') return null;
  throw error;
});
const edgeModule = await import('../scripts/supabase-function-sources.mjs').catch(error => {
  if (error.code === 'ERR_MODULE_NOT_FOUND') return null;
  throw error;
});
async function fixture(run) {
  const root = await mkdtemp(path.join(tmpdir(), 'shelv-release-guard-'));
  const sourceRoot = path.join(root, 'apps/portal'), build = path.join(root, '.local-artifacts/frozen-build');
  const outputDirectory = path.join(root, '.local-artifacts/release-review');
  const source = { 'index.html': '<!doctype html><title>Local release fixture</title>', '_worker.js': 'historical baseline, never upload this source file', '_routes.json': JSON.stringify({ version: 1, include: ['/api/client/*', '/api/advisor/*'], exclude: [] }), 'portal-config.json': JSON.stringify({ clientSharedSessions: true, advisorSharedSessions: true }) };
  const generated = { ...source, '_worker.js': 'export default {fetch(){return new Response("combined gateway")}};' };
  const manifest = { schemaVersion: 1, sourceSnapshotUnchanged: true, productionDeploymentChanged: false, gatewayRoutes: ['/api/client/*', '/api/advisor/*'], sourceAssets: {}, runtimeSources: {}, assets: {}, assetCount: Object.keys(generated).length };
  const put = async (relative, bytes) => { const p = path.join(root, relative); await mkdir(path.dirname(p), { recursive: true }); await writeFile(p, bytes); return p; };
  for (const [name, text] of Object.entries(source)) { await put('apps/portal/site/' + name, text); manifest.sourceAssets[name] = { bytes: Buffer.byteLength(text), sha256: hash(text) }; }
  for (const [name, text] of Object.entries(generated)) { await put('.local-artifacts/frozen-build/site/' + name, text); manifest.assets[name] = { bytes: Buffer.byteLength(text), sha256: hash(text) }; }
  const runtimeSource = 'export const reviewed = true;';
  for (const folder of ['server', 'workers', 'adapter', 'scripts']) await mkdir(path.join(sourceRoot, 'session-integration/runtime', folder), { recursive: true });
  await put('apps/portal/session-integration/runtime/server/policy.ts', runtimeSource);
  manifest.runtimeSources['server/policy.ts'] = { bytes: Buffer.byteLength(runtimeSource), sha256: hash(runtimeSource) };
  await put('.local-artifacts/frozen-build/runtime/advisor-pages/_worker.js', generated['_worker.js']);
  await put('.local-artifacts/frozen-build/runtime/advisor-pages/_routes.json', generated['_routes.json']);
  const vault = 'export class AdvisorSessionObject {}; export default {fetch(){return new Response(null,{status:404})}};';
  await put('.local-artifacts/frozen-build/runtime/vault/index.js', vault);
  manifest.vault = { bytes: Buffer.byteLength(vault), sha256: hash(vault) };
  for (const name of target.pendingMigrationSources) await put(name, migrationInputs[name]);
  await put('supabase/config.toml', '[functions.concierge-admission]\nenabled = true\nverify_jwt = true\nentrypoint = "./functions/concierge-admission/index.ts"\n');
  await put('.local-artifacts/release-preflight/HOSTED-SOURCE-PREIMAGES.json', JSON.stringify(target.supabase.functions.filter(x => x.verifyJwtEvidence === 'preserve_hosted_true').map(x => ({ slug: x.name, version: 2, verifyJwt: true, bundleSha256: '1'.repeat(64) }))));
  for (const fn of target.supabase.functions) {
    await put(fn.entrypoint, 'import { value } from "./helper.ts"; export const handler = () => value;');
    await put(`supabase/functions/${fn.name}/helper.ts`, 'export {value} from "../../../src/contracts/Fixture.ts";');
  }
  await put('src/contracts/Fixture.ts', 'export const value = "synthetic source fixture";');
  execFileSync('python3', ['-c', 'import pathlib,zipfile,sys\nr=pathlib.Path(sys.argv[1])\nwith zipfile.ZipFile(sys.argv[2],"w",zipfile.ZIP_DEFLATED) as z:\n for p in sorted(r.rglob("*")):\n  if p.is_file():z.write(p,p.relative_to(r).as_posix())', path.join(build, 'site'), path.join(build, 'portal.zip')]);
  manifest.zipSha256 = hash(await readFile(path.join(build, 'portal.zip')));
  const readback = { observedAt: new Date().toISOString(), accountId: target.accountId, errors: [], project: { success: true, name: target.pages.project, productionBranch: 'main', canonicalDeployment: target.pages.baselineDeployment, compatibilityDate: target.compatibilityDate, compatibilityFlags: [...target.compatibilityFlags], flags: { ...target.enabledFlags }, durableObjectNamespaces: { ADVISOR_SESSIONS: { namespace_id: target.vault.namespaceId } } }, vault: { success: true, name: target.vault.script, compatibilityDate: target.compatibilityDate, compatibilityFlags: [...target.compatibilityFlags], bindings: target.vault.bindingInventory.map(binding => ({ ...binding, ...(target.enabledFlags[binding.name] ? { value: 'true' } : {}), ...(binding.type === 'durable_object_namespace' ? { namespaceId: target.vault.namespaceId, className: target.vault.className } : {}) })), observability: { enabled: false }, logpush: false, tailConsumers: [], placement: {}, tags: [], usageModel: 'standard', declaredExports: structuredClone(installedExports) }, vaultDeployments: { success: true, items: [{ id: target.vault.baselineDeployment, versions: [{ version_id: target.vault.baselineVersion, percentage: 100 }] }] }, vaultLatestVersionId: target.vault.baselineVersion, privateExposure: { workersDev: false, previewUrls: false, routeScanComplete: true, customDomainScanComplete: true, routes: [], customDomains: [] } };
  const buildManifestPath = path.join(build, 'BUILD-MANIFEST.json'), readbackPath = path.join(root, 'current-readback.json');
  const sync = async () => { await writeFile(buildManifestPath, JSON.stringify(manifest)); await writeFile(readbackPath, JSON.stringify(readback)); };
  await sync();
  const options = { buildManifestPath, readbackPath, outputDirectory, sourceRoot };
  try { await run({ root, options, manifest, readback, sync, put }); } finally { await rm(root, { recursive: true, force: true }); }
}

test('preparation binds generated files and preserves installed bindings without provider calls', () => fixture(async ({ options }) => {
  assert.equal(typeof module?.prepareProductionRelease, 'function', 'A preparation-only production guard is required');
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => { throw Error('No provider request is permitted'); };
  try {
    const result = await module.prepareProductionRelease(options);
    assert.equal(result.preparationOnly, true);
    assert.equal(result.providerWrites, 0);
    assert.equal(result.vaultUpload.metadata.bindings.length, 0);
    assert.deepEqual(result.vaultUpload.metadata.keep_bindings, target.vault.keepBindingTypes);
    assert.equal('migrations' in result.vaultUpload.metadata, false);
    assert.deepEqual(result.vaultUpload.metadata.exports, target.vault.declaredExports);
    assert.equal(result.vaultUpload.metadata.observability.enabled, false);
    assert.match(result.pagesDeployment.worker.file, /frozen-build\/site\/_worker\.js$/);
    assert.equal('_worker.js' in result.pagesDeployment.staticAssets, false);
    assert.equal('_routes.json' in result.pagesDeployment.staticAssets, false);
    assert.equal('_worker.js' in result.pagesDeployment.reservedFiles, true);
    assert.equal(result.sqlMigrations.every(row => row.actualServerVersion === null), true);
    assert.equal(result.sqlMigrations.length, 4);
    assert.ok(result.sqlMigrations.some(row => row.sourceFile.endsWith('20261025011331_concierge_no_current_products.sql') && row.sourceSha256 === '2076cef0e5a647d62eaa9b95e512687dab24b5cf696c4028e387409f34916adf'));
    assert.equal((await readFile(path.join(options.outputDirectory, 'RELEASE-PREPARATION.json'), 'utf8')).includes('secret-value'), false);
  } finally { globalThis.fetch = originalFetch; }
}));

test('preparation echoes only the exact already-installed Durable Object export', () => fixture(async ({ options, readback, sync }) => {
  readback.vault.declaredExports = structuredClone(installedExports); await sync();
  const result = await module.prepareProductionRelease(options);
  assert.deepEqual(result.vaultUpload.metadata.exports, installedExports);
  assert.equal('migrations' in result.vaultUpload.metadata, false);
  assert.deepEqual(result.vaultUpload.metadata.bindings, []);
}));

for (const [label, exports] of [
  ['missing declared export', undefined],
  ['new class', { ...installedExports, AnotherObject: { type: 'durable-object', storage: 'sqlite' } }],
  ['renamed class', { AnotherObject: { type: 'durable-object', storage: 'sqlite' } }],
  ['deleted class', { AdvisorSessionObject: { type: 'durable-object', state: 'deleted' } }],
  ['renamed tombstone', { AdvisorSessionObject: { type: 'durable-object', state: 'renamed', renamed_to: 'AnotherObject' } }],
  ['transferred class', { AdvisorSessionObject: { type: 'durable-object', state: 'transferred', transferred_to: 'another-worker' } }],
  ['storage drift', { AdvisorSessionObject: { type: 'durable-object', storage: 'legacy-kv' } }],
]) test(`preparation refuses ${label} before emitting metadata`, () => fixture(async ({ options, readback, sync }) => {
  readback.vault.declaredExports = exports; await sync();
  await assert.rejects(module.prepareProductionRelease(options), /declared exports/);
  await assert.rejects(access(options.outputDirectory));
}));

test('Edge source freeze includes transitive modules and detects a changed helper after approval', () => fixture(async ({ root, put }) => {
  assert.equal(typeof edgeModule?.collectSupabaseFunctionSources, 'function', 'Edge source closures must be frozen separately from Workers');
  const frozen = await edgeModule.collectSupabaseFunctionSources({ repositoryRoot: root, configuration: target.supabase });
  assert.equal(frozen.functions.length, 4);
  assert.ok(frozen.functions.every(fn => fn.verifyJwt === true && fn.files.some(file => file.name === 'src/contracts/Fixture.ts')));
  await put('supabase/functions/concierge-payments/helper.ts', 'export const value = "unreviewed body change";');
  await assert.rejects(edgeModule.verifySupabaseFunctionSources({ repositoryRoot: root, configuration: target.supabase, manifest: frozen }), /Supabase function source.*mismatch/);
}));

for (const name of ['supabase/functions/concierge-payments/helper.ts', 'supabase/functions/concierge-operations/index.ts']) test(`approved Edge capsule rejects subsequent source change: ${name}`, () => fixture(async ({ root, options, put }) => {
  const frozen = await edgeModule.collectSupabaseFunctionSources({ repositoryRoot: root, configuration: target.supabase });
  const approved = await put('.local-artifacts/approved-function-sources.json', JSON.stringify(frozen));
  await put(name, 'export const value = "unreviewed business body";');
  await assert.rejects(module.prepareProductionRelease({ ...options, functionSourcesPath: approved }), /Supabase function source.*mismatch/);
  await assert.rejects(access(options.outputDirectory));
}));

test('external npm/jsr imports are recorded without retrieval', () => fixture(async ({ root, put }) => {
  await put('supabase/functions/concierge-admission/helper.ts', 'import "npm:example@1.0.0"; import type { Value } from "jsr:@example/types@1.0.0"; export const value = 1;');
  const originalFetch = globalThis.fetch; globalThis.fetch = () => { throw Error('No network acquisition'); };
  try {
    const frozen = await edgeModule.collectSupabaseFunctionSources({ repositoryRoot: root, configuration: target.supabase });
    const external = frozen.functions.find(fn => fn.name === 'concierge-admission').externalImports;
    assert.equal(external.length, 2); assert.ok(external.every(reference => reference.retrieved === false));
  } finally { globalThis.fetch = originalFetch; }
}));

test('JPEG runtime, declaration and license sources join the transitive closure', () => fixture(async ({ root, put }) => {
  await put('supabase/functions/concierge-payments/helper.ts', 'import decode from "../_shared/vendor/jpeg-js/decoder.mjs"; export const value = decode;');
  await put('supabase/functions/_shared/vendor/jpeg-js/decoder.mjs', 'export default function decode() { return 1; }');
  await put('supabase/functions/_shared/vendor/jpeg-js/decoder.d.mts', 'export default function decode(): number;');
  for (const name of ['LICENSE', 'APACHE-2.0', 'NOTICE.md']) await put('supabase/functions/_shared/vendor/jpeg-js/' + name, 'Synthetic license fixture');
  const frozen = await edgeModule.collectSupabaseFunctionSources({ repositoryRoot: root, configuration: target.supabase });
  const files = frozen.functions.find(fn => fn.name === 'concierge-payments').files;
  for (const name of ['decoder.mjs', 'decoder.d.mts', 'LICENSE', 'APACHE-2.0', 'NOTICE.md']) assert.ok(files.some(file => file.name === 'supabase/functions/_shared/vendor/jpeg-js/' + name));
}));

test('Edge source collection rejects symlinks without following them', () => fixture(async ({ root }) => {
  const helper = path.join(root, 'supabase/functions/concierge-payments/helper.ts'); await rm(helper);
  await symlink(path.join(root, 'src/contracts/Fixture.ts'), helper);
  await assert.rejects(edgeModule.collectSupabaseFunctionSources({ repositoryRoot: root, configuration: target.supabase }), /Symlink/);
}));

test('existing hosted JWT verification cannot be disabled by source configuration', () => fixture(async ({ root, put }) => {
  await put('supabase/config.toml', '[functions.concierge-operations]\nverify_jwt = false\n[functions.concierge-admission]\nverify_jwt = true\n');
  await assert.rejects(edgeModule.collectSupabaseFunctionSources({ repositoryRoot: root, configuration: target.supabase }), /verify-JWT must remain true/);
}));

test('new admission JWT mode requires actual explicit source configuration', () => fixture(async ({ root, put }) => {
  await put('supabase/config.toml', '# No admission mode configured\n');
  await assert.rejects(edgeModule.collectSupabaseFunctionSources({ repositoryRoot: root, configuration: target.supabase }), /requires explicit source configuration/);
}));

test('an explicitly false admission JWT flag is rejected before preparation output', () => fixture(async ({ root, options, put }) => {
  await put('supabase/config.toml', '[functions.concierge-admission]\nenabled = true\nverify_jwt = false\nentrypoint = "./functions/concierge-admission/index.ts"\n');
  await assert.rejects(module.prepareProductionRelease(options), /required verify-JWT|verify-JWT.*true/);
  await assert.rejects(access(options.outputDirectory));
}));

test('aliased CommonJS loading cannot produce an incomplete approved capsule', () => fixture(async ({ root, options, put }) => {
  await put('supabase/functions/concierge-payments/index.ts', 'import value from "./loader.cjs"; export const handler = () => value;');
  await put('supabase/functions/concierge-payments/loader.cjs', 'const load = require; module.exports = load("./missing-unfrozen.cjs");');
  await assert.rejects(module.prepareProductionRelease(options), /CommonJS|unsupported loader|require/);
  await assert.rejects(access(options.outputDirectory));
}));

test('a require alias in a js helper is also rejected before output', () => fixture(async ({ options, put }) => {
  await put('supabase/functions/concierge-payments/index.ts', 'import value from "./loader.js"; export const handler = () => value;');
  await put('supabase/functions/concierge-payments/loader.js', 'const load = require; module.exports = load("./missing-unfrozen.cjs");');
  await assert.rejects(module.prepareProductionRelease(options), /CommonJS|unsupported loader|require/);
  await assert.rejects(access(options.outputDirectory));
}));

test('the release target must explicitly require true JWT mode for every function', () => fixture(async ({ root }) => {
  const configuration = structuredClone(target.supabase); delete configuration.functions[3].requiredVerifyJwt;
  await assert.rejects(edgeModule.collectSupabaseFunctionSources({ repositoryRoot: root, configuration }), /required verify-JWT|explicitly require.*true/);
}));

test('tampered embedded Edge content cannot pass its approved source digest', () => fixture(async ({ root }) => {
  const frozen = await edgeModule.collectSupabaseFunctionSources({ repositoryRoot: root, configuration: target.supabase }); frozen.functions[0].files[0].content += '\nexport const changed = true;';
  await assert.rejects(edgeModule.verifySupabaseFunctionSources({ repositoryRoot: root, configuration: target.supabase, manifest: frozen }), /content hash mismatch/);
}));

test('pending SQL source is compared with the reviewed migration hash', () => fixture(async ({ options, put }) => {
  await put('supabase/migrations/20261025011331_concierge_no_current_products.sql', '-- changed after review');
  await assert.rejects(module.prepareProductionRelease(options), /Pending migration source hash mismatch/);
}));

for (const [label, reference, expected] of [
  ['missing local import', 'import "./not-found.ts";', /missing|ENOENT/i],
  ['computed import', 'const name = "./helper.ts"; import(name);', /computed|unsupported/i],
  ['unsupported bare import', 'import "some-unmapped-package";', /unsupported/i],
  ['private configuration import', 'import "./.env";', /private/i],
  ['out-of-repository import', 'import "../../../../outside.ts";', /outside|out.of.repository/i],
]) test(`Edge source freeze refuses ${label}`, () => fixture(async ({ root, put }) => {
  assert.ok(edgeModule?.collectSupabaseFunctionSources);
  await put('supabase/functions/concierge-payments/helper.ts', reference);
  await assert.rejects(edgeModule.collectSupabaseFunctionSources({ repositoryRoot: root, configuration: target.supabase }), expected);
}));

for (const [label, mutate, expected] of [
  ['wrong account', r => r.accountId = 'wrong', /account/],
  ['wrong Pages target', r => r.project.name = 'another-project', /Pages target/],
  ['disabled Pages sessions', r => r.project.flags.CLIENT_SHARED_SESSIONS = 'false', /enabled flags/],
  ['disabled vault sessions', r => r.vault.bindings.find(x => x.name === 'ADVISOR_SHARED_SESSIONS').value = 'false', /enabled flags/],
  ['changed namespace', r => r.vault.bindings.find(x => x.type === 'durable_object_namespace').namespaceId = 'another', /namespace/],
  ['public vault', r => r.privateExposure.workersDev = true, /private/i],
  ['logging enabled', r => r.vault.observability.enabled = true, /observability/],
  ['different latest upload', r => r.vaultLatestVersionId = 'unreviewed', /latest uploaded/],
  ['stale readback', r => r.observedAt = '2000-01-01T00:00:00Z', /stale/],
  ['secret value in readback', r => r.vault.bindings.find(x => x.type === 'secret_text').value = 'secret-value', /sanitized/],
]) test(`preparation rejects ${label} before writing output`, () => fixture(async ({ options, readback, sync }) => {
  assert.ok(module?.prepareProductionRelease);
  mutate(readback); await sync();
  await assert.rejects(module.prepareProductionRelease(options), expected);
  await assert.rejects(access(options.outputDirectory));
}));

for (const [label, relative, expected] of [
  ['changed static source', 'apps/portal/site/index.html', /source hash/],
  ['changed runtime source', 'apps/portal/session-integration/runtime/server/policy.ts', /runtime source hash/],
  ['changed generated gateway', '.local-artifacts/frozen-build/site/_worker.js', /output hash/],
  ['changed private bundle', '.local-artifacts/frozen-build/runtime/vault/index.js', /vault hash/],
  ['changed ZIP', '.local-artifacts/frozen-build/portal.zip', /ZIP hash/],
]) test(`preparation rejects ${label}`, () => fixture(async ({ options, put }) => {
  assert.ok(module?.prepareProductionRelease);
  await put(relative, 'changed since freeze');
  await assert.rejects(module.prepareProductionRelease(options), expected);
  await assert.rejects(access(options.outputDirectory));
}));

test('disabled flags in a checksum-matching public build are refused', () => fixture(async ({ options, manifest, sync, put }) => {
  const bytes = JSON.stringify({ clientSharedSessions: false, advisorSharedSessions: true });
  await put('.local-artifacts/frozen-build/site/portal-config.json', bytes);
  manifest.assets['portal-config.json'] = { bytes: Buffer.byteLength(bytes), sha256: hash(bytes) };
  await sync();
  await assert.rejects(module.prepareProductionRelease(options), /Public build enabled flags/);
}));

test('a checksum-matching historical worker cannot replace generated gateway output', () => fixture(async ({ options, manifest, sync, put }) => {
  const bytes = 'historical baseline, never upload this source file';
  await put('.local-artifacts/frozen-build/site/_worker.js', bytes);
  manifest.assets['_worker.js'] = { bytes: Buffer.byteLength(bytes), sha256: hash(bytes) };
  await sync();
  await assert.rejects(module.prepareProductionRelease(options), /generated combined gateway/);
}));

test('a matching ZIP checksum does not conceal contents that differ from reviewed output', () => fixture(async ({ options, manifest, sync }) => {
  const zip = path.join(path.dirname(options.buildManifestPath), 'portal.zip');
  execFileSync('python3', ['-c', 'import zipfile,sys\np=sys.argv[1]\nwith zipfile.ZipFile(p) as z:items={n:z.read(n) for n in z.namelist()}\nitems["index.html"]=b"unreviewed replacement"\nwith zipfile.ZipFile(p,"w",zipfile.ZIP_DEFLATED) as z:\n for n,b in items.items():z.writestr(n,b)', zip]);
  manifest.zipSha256 = hash(await readFile(zip)); await sync();
  await assert.rejects(module.prepareProductionRelease(options), /ZIP contents/);
}));

test('omitted observability remains an explicit evidence gap rather than a disabled-state claim', () => fixture(async ({ options, readback, sync }) => {
  delete readback.vault.observability; await sync();
  const result = await module.prepareProductionRelease(options);
  assert.equal(result.status, 'prepared_for_review_with_readback_gap');
  assert.equal(result.readbackGaps.length, 1);
  assert.equal(result.vaultUpload.metadata.observability.enabled, false);
}));
