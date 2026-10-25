import { readFile, readdir, lstat, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { inflateRawSync } from 'node:zlib';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { collectSupabaseFunctionSources, verifySupabaseFunctionSources } from './supabase-function-sources.mjs';

const portal = fileURLToPath(new URL('../', import.meta.url));
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const demand = (condition, message) => { if (!condition) throw new Error(message); };
const json = async filename => JSON.parse(await readFile(filename, 'utf8'));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function relativeName(name) {
  demand(typeof name === 'string' && name.length > 0 && !name.includes('\\') && !name.includes('\0') && !path.posix.isAbsolute(name) && name.split('/').every(part => part && part !== '.' && part !== '..' && !/^\.(?:env|dev\.vars)(?:\.|$)/.test(part) && !/\.(?:pem|key|p12|p8|private\.json)$/i.test(part)), 'Unsafe or private source path');
  return name;
}
async function safeRead(root, name) {
  relativeName(name);
  let current = root;
  for (const part of name.split('/')) {
    current = path.join(current, part);
    demand(!(await lstat(current)).isSymbolicLink(), 'Symlink source/output is not accepted');
  }
  demand((await lstat(current)).isFile(), 'Expected a regular source/output file');
  return readFile(current);
}
async function names(root, prefix = '') {
  const result = [];
  for (const entry of await readdir(path.join(root, prefix), { withFileTypes: true })) {
    const name = prefix ? `${prefix}/${entry.name}` : entry.name;
    demand(!entry.isSymbolicLink(), 'Symlink source/output is not accepted');
    relativeName(name);
    if (entry.isDirectory()) result.push(...await names(root, name));
    else { demand(entry.isFile(), 'Expected a regular source/output file'); result.push(name); }
  }
  return result.sort();
}
async function verifyFiles(root, inventory, label, exactInventory = true) {
  demand(inventory && typeof inventory === 'object' && !Array.isArray(inventory) && Object.keys(inventory).length > 0, `Missing ${label} inventory`);
  if (exactInventory) demand(same(await names(root), Object.keys(inventory).sort()), `${label} inventory mismatch`);
  for (const [name, expected] of Object.entries(inventory)) {
    demand(Number.isSafeInteger(expected?.bytes) && expected.bytes >= 0 && /^[a-f0-9]{64}$/.test(expected.sha256), `Invalid ${label} hash entry`);
    const bytes = await safeRead(root, name);
    demand(bytes.length === expected.bytes && sha256(bytes) === expected.sha256, `${label} hash mismatch: ${name}`);
  }
}

// Inspect ZIP members in memory. No archive member is extracted or executed.
function verifyZip(bytes, inventory) {
  demand(bytes.length <= 64 * 1024 * 1024, 'ZIP exceeds the reviewed package size bound');
  let end = -1;
  for (let at = bytes.length - 22; at >= Math.max(0, bytes.length - 65557); at--) if (bytes.readUInt32LE(at) === 0x06054b50) { end = at; break; }
  demand(end >= 0 && bytes.readUInt16LE(end + 4) === 0 && bytes.readUInt16LE(end + 6) === 0, 'ZIP central directory is invalid');
  const count = bytes.readUInt16LE(end + 10), offset = bytes.readUInt32LE(end + 16), found = [];
  demand(count === Object.keys(inventory).length && count !== 65535, 'ZIP member count mismatch');
  let cursor = offset;
  for (let index = 0; index < count; index++) {
    demand(cursor + 46 <= end && bytes.readUInt32LE(cursor) === 0x02014b50, 'ZIP central directory is invalid');
    const flags = bytes.readUInt16LE(cursor + 8), method = bytes.readUInt16LE(cursor + 10), compressed = bytes.readUInt32LE(cursor + 20), size = bytes.readUInt32LE(cursor + 24), nameLength = bytes.readUInt16LE(cursor + 28), extraLength = bytes.readUInt16LE(cursor + 30), commentLength = bytes.readUInt16LE(cursor + 32), local = bytes.readUInt32LE(cursor + 42);
    const name = relativeName(bytes.subarray(cursor + 46, cursor + 46 + nameLength).toString('utf8')), expected = inventory[name];
    demand(expected && !found.includes(name) && !(flags & 1) && [0, 8].includes(method) && size === expected.bytes, 'ZIP contents do not match the frozen output');
    demand(local + 30 <= offset && bytes.readUInt32LE(local) === 0x04034b50, 'ZIP local header is invalid');
    const start = local + 30 + bytes.readUInt16LE(local + 26) + bytes.readUInt16LE(local + 28);
    demand(start + compressed <= offset, 'ZIP member exceeds its package boundary');
    const content = method === 0 ? bytes.subarray(start, start + compressed) : inflateRawSync(bytes.subarray(start, start + compressed), { maxOutputLength: Math.max(1, expected.bytes) });
    demand(content.length === expected.bytes && sha256(content) === expected.sha256, 'ZIP contents do not match the frozen output');
    found.push(name); cursor += 46 + nameLength + extraLength + commentLength;
  }
  demand(same(found.sort(), Object.keys(inventory).sort()), 'ZIP inventory mismatch');
}

function validateReadback(readback, target) {
  demand(readback.accountId === target.accountId, 'Production account mismatch');
  demand(Array.isArray(readback.errors) && readback.errors.length === 0, 'Current readback contains errors');
  demand(Number.isFinite(Date.parse(readback.observedAt)) && Date.now() - Date.parse(readback.observedAt) <= target.constraints.readbackMaxAgeMinutes * 60000 && Date.parse(readback.observedAt) <= Date.now() + 60000, 'Current readback is stale or has an invalid time');
  const project = readback.project, vault = readback.vault;
  demand(project?.success === true && project.name === target.pages.project && project.productionBranch === target.pages.productionBranch && project.canonicalDeployment === target.pages.baselineDeployment, 'Pages target/deployment mismatch');
  demand(vault?.success === true && vault.name === target.vault.script, 'Private vault target mismatch');
  for (const current of [project, vault]) demand(current.compatibilityDate === target.compatibilityDate && same(current.compatibilityFlags, target.compatibilityFlags), 'Compatibility settings mismatch');
  demand(same(project.flags, target.enabledFlags), 'Production Pages enabled flags must remain true');
  demand(project.durableObjectNamespaces?.[target.pages.namespaceBinding]?.namespace_id === target.vault.namespaceId, 'Pages namespace mismatch');
  demand(Array.isArray(vault.bindings), 'Missing sanitized binding inventory');
  const identity = bindings => bindings.map(binding => ({ name: binding.name, type: binding.type })).sort((a, b) => a.name.localeCompare(b.name));
  demand(same(identity(vault.bindings), identity(target.vault.bindingInventory)), 'Installed binding inventory drift');
  for (const binding of vault.bindings) {
    if (binding.type === 'secret_text') demand(same(Object.keys(binding).sort(), ['name', 'type']), 'Readback must be sanitized; secret values are forbidden');
    else if (binding.type === 'plain_text') {
      if (Object.hasOwn(target.enabledFlags, binding.name)) demand(binding.value === 'true', 'Private vault enabled flags must remain true');
      else demand(!Object.hasOwn(binding, 'text') && !Object.hasOwn(binding, 'value'), 'Readback must be sanitized; unrelated binding values are forbidden');
    }
    if (binding.type === 'durable_object_namespace') demand(binding.namespaceId === target.vault.namespaceId && binding.className === target.vault.className && (!binding.scriptName || binding.scriptName === target.vault.script), 'Private vault namespace/class mismatch');
  }
  const deployment = readback.vaultDeployments?.items?.[0];
  demand(readback.vaultDeployments?.success === true && deployment?.id === target.vault.baselineDeployment && same(deployment.versions, [{ version_id: target.vault.baselineVersion, percentage: 100 }]), 'Private vault deployment/version mismatch');
  demand(readback.vaultLatestVersionId === target.vault.baselineVersion, 'The latest uploaded version must equal the expected deployed version before keeping bindings');
  const exposure = readback.privateExposure;
  demand(exposure?.workersDev === false && exposure.previewUrls === false && exposure.routeScanComplete === true && exposure.customDomainScanComplete === true && same(exposure.routes, []) && same(exposure.customDomains, []), 'Private vault exposure must remain disabled with complete route/domain evidence');
  const observability = vault.observability;
  demand(!observability || (observability.enabled === false && ![observability.logs, observability.traces, observability.issues].some(value => value?.enabled === true)), 'Private vault observability must not be enabled');
  demand(vault.logpush === false && same(vault.tailConsumers, []), 'Private vault logging/tail exposure mismatch');
  demand(vault.usageModel === 'standard' && same(vault.placement, {}) && same(vault.tags, []) && !vault.limits && !vault.cacheOptions, 'Unreviewed private vault settings drift');
  return observability ? [] : ['Cloudflare omitted observability in the supplied settings readback. Absence is not proof of disabled collection; the proposed upload explicitly disables it and action-time readback must confirm the approved state.'];
}

export async function prepareProductionRelease({ buildManifestPath, readbackPath, outputDirectory, functionSourcesPath = null, sourceRoot = portal } = {}) {
  demand(buildManifestPath && readbackPath && outputDirectory, 'Provide frozen build manifest, sanitized readback and a new ignored output directory');
  sourceRoot = path.resolve(sourceRoot);
  const repository = path.resolve(sourceRoot, '../..'), build = path.dirname(path.resolve(buildManifestPath)), output = path.resolve(outputDirectory);
  demand(output.startsWith(path.join(repository, '.local-artifacts') + path.sep) && !output.startsWith(build + path.sep) && output !== build, 'Release review output must be a separate ignored local-artifacts directory');
  const target = await json(new URL('../release/PRODUCTION-TARGET.json', import.meta.url));
  const [manifestBytes, readbackBytes] = await Promise.all([readFile(buildManifestPath), readFile(readbackPath)]);
  const manifest = JSON.parse(manifestBytes), readback = JSON.parse(readbackBytes);
  const readbackGaps = validateReadback(readback, target);
  demand(manifest.schemaVersion === 1 && manifest.sourceSnapshotUnchanged === true && manifest.productionDeploymentChanged === false && same(manifest.gatewayRoutes, ['/api/client/*', '/api/advisor/*']), 'Unreviewed build manifest');
  await verifyFiles(path.join(sourceRoot, 'site'), manifest.sourceAssets, 'source');
  await verifyFiles(path.join(sourceRoot, 'session-integration/runtime'), manifest.runtimeSources, 'runtime source', false);
  const currentRuntimeNames = [];
  for (const folder of ['server', 'workers', 'adapter', 'scripts']) currentRuntimeNames.push(...(await names(path.join(sourceRoot, 'session-integration/runtime', folder))).map(name => `${folder}/${name}`));
  demand(same(currentRuntimeNames.sort(), Object.keys(manifest.runtimeSources).sort()), 'runtime source inventory mismatch');
  await verifyFiles(path.join(build, 'site'), manifest.assets, 'output');
  demand(manifest.assetCount === Object.keys(manifest.assets).length, 'Build asset count mismatch');
  const config = JSON.parse(await safeRead(path.join(build, 'site'), 'portal-config.json'));
  demand(config.clientSharedSessions === true && config.advisorSharedSessions === true, 'Public build enabled flags must remain true');
  const routes = JSON.parse(await safeRead(path.join(build, 'site'), '_routes.json'));
  demand(same(routes, { version: 1, include: ['/api/client/*', '/api/advisor/*'], exclude: [] }), 'Combined gateway routes mismatch');
  const gateway = await safeRead(build, 'runtime/advisor-pages/_worker.js'), generatedRoutes = await safeRead(build, 'runtime/advisor-pages/_routes.json');
  demand(sha256(gateway) === manifest.assets['_worker.js']?.sha256 && sha256(generatedRoutes) === manifest.assets['_routes.json']?.sha256, 'Upload must use generated combined gateway output, not the historical site source');
  const vault = await safeRead(build, 'runtime/vault/index.js');
  demand(vault.length === manifest.vault?.bytes && sha256(vault) === manifest.vault.sha256, 'Private vault hash mismatch');
  const zip = await safeRead(build, 'portal.zip');
  demand(sha256(zip) === manifest.zipSha256, 'ZIP hash mismatch');
  verifyZip(zip, manifest.assets);
  const sqlMigrations = [];
  for (const sourceFile of target.pendingMigrationSources) {
    const sourceSha256 = sha256(await safeRead(repository, sourceFile));
    demand(sourceSha256 === target.pendingMigrationSha256[sourceFile], `Pending migration source hash mismatch: ${sourceFile}`);
    sqlMigrations.push({ sourceFile, sourceSha256, actualServerVersion: null, execution: 'not applied; record actual server ledger version returned at approved apply time' });
  }
  const functionSources = functionSourcesPath
    ? await verifySupabaseFunctionSources({ repositoryRoot: repository, configuration: target.supabase, manifest: await json(functionSourcesPath) })
    : await collectSupabaseFunctionSources({ repositoryRoot: repository, configuration: target.supabase });
  const functionSourcesBytes = JSON.stringify(functionSources, null, 2) + '\n';
  const metadata = { main_module: 'index.js', bindings: [], keep_bindings: target.vault.keepBindingTypes, compatibility_date: target.compatibilityDate, compatibility_flags: target.compatibilityFlags, usage_model: 'standard', logpush: false, tail_consumers: [], tags: [], observability: { enabled: false, logs: { enabled: false, invocation_logs: false, persist: false }, traces: { enabled: false, persist: false }, issues: { enabled: false } } };
  const reserved = new Set(['_worker.js', '_routes.json', '_headers', '_redirects', 'functions-filepath-routing-config.json']);
  const result = {
    schemaVersion: 1,
    status: readbackGaps.length ? 'prepared_for_review_with_readback_gap' : 'prepared_for_review',
    preparationOnly: true,
    providerWrites: 0,
    providerCalls: 0,
    approvalGrantedByPreparation: false,
    frozenBuildManifestSha256: sha256(manifestBytes),
    sanitizedReadbackSha256: sha256(readbackBytes),
    targetDescriptorSha256: sha256(await readFile(new URL('../release/PRODUCTION-TARGET.json', import.meta.url))),
    target: {
      accountId: target.accountId,
      origin: target.origin,
      pages: target.pages,
      vault: {
        script: target.vault.script,
        baselineDeployment: target.vault.baselineDeployment,
        baselineVersion: target.vault.baselineVersion,
        namespaceId: target.vault.namespaceId,
        className: target.vault.className,
      },
    },
    readbackObservedAt: readback.observedAt,
    readbackGaps,
    revalidateBeforeEveryProviderWrite: true,
    pagesDeployment: {
      method: 'POST',
      path: `/accounts/${target.accountId}/pages/projects/${target.pages.project}/deployments`,
      configurationUpdate: 'none; preserve all production and preview project settings',
      branch: target.pages.productionBranch,
      worker: { file: path.join(build, 'site/_worker.js'), sha256: sha256(gateway), contentType: 'application/javascript+module' },
      routes: { file: path.join(build, 'site/_routes.json'), sha256: sha256(generatedRoutes) },
      frozenZip: { file: path.join(build, 'portal.zip'), sha256: sha256(zip) },
      staticAssets: Object.fromEntries(Object.entries(manifest.assets).filter(([name]) => !reserved.has(name))),
      reservedFiles: Object.fromEntries(Object.entries(manifest.assets).filter(([name]) => reserved.has(name))),
      providerAssetUploadManifest: 'Not generated here. The separately approved executor must upload these exact assets and construct the provider manifest; SHA256 review hashes are not Cloudflare content hashes.',
      wranglerConfiguration: 'none; never send historical candidate config or wrangler_config_hash',
    },
    vaultUpload: {
      method: 'PUT',
      path: `/accounts/${target.accountId}/workers/scripts/${target.vault.script}`,
      file: path.join(build, 'runtime/vault/index.js'),
      sha256: sha256(vault),
      moduleContentType: 'application/javascript+module',
      metadata,
      preserve: {
        bindingInventory: target.vault.bindingInventory,
        privateExposure: target.vault.privateExposure,
        secretValues: 'retain installed binding; never read, replace or serialize key material',
        namespace: 'retain installed namespace, storage and class; no exports reconciliation or Durable Object migration',
      },
    },
    sqlMigrations,
    migrationPolicy: target.migrationPolicy,
    supabaseFunctionSources: {
      file: path.join(output, 'SUPABASE-FUNCTION-SOURCES.json'),
      sha256: sha256(functionSourcesBytes),
      aggregateSha256: functionSources.aggregateSha256,
      sourceConfig: functionSources.sourceConfig,
      functions: functionSources.functions.map(fn => ({ name: fn.name, entrypoint: fn.entrypoint, verifyJwt: fn.verifyJwt, sourceSha256: fn.sourceSha256, fileCount: fn.files.length })),
      deploymentContent: target.supabase.deploymentContent,
    },
  };
  await mkdir(path.dirname(output), { recursive: true });
  await mkdir(output); // A new review folder is required; never overwrite a prior release record.
  await writeFile(path.join(output, 'RELEASE-PREPARATION.json'), JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
  await writeFile(path.join(output, 'VAULT-UPLOAD-METADATA.json'), JSON.stringify(metadata, null, 2) + '\n', { flag: 'wx' });
  await writeFile(path.join(output, 'SUPABASE-FUNCTION-SOURCES.json'), functionSourcesBytes, { flag: 'wx' });
  return result;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = new Map();
  for (let index = 2; index < process.argv.length; index += 2) { demand(['--build-manifest', '--readback', '--output', '--function-sources'].includes(process.argv[index]) && process.argv[index + 1], 'Usage: node prepare-production-release.mjs --build-manifest PATH --readback PATH --output NEW_IGNORED_DIRECTORY [--function-sources APPROVED_CAPSULE]'); args.set(process.argv[index], process.argv[index + 1]); }
  const result = await prepareProductionRelease({ buildManifestPath: args.get('--build-manifest'), readbackPath: args.get('--readback'), outputDirectory: args.get('--output'), functionSourcesPath: args.get('--function-sources') });
  console.log(JSON.stringify({ status: result.status, providerCalls: 0, providerWrites: 0, preparationOnly: true, readbackGaps: result.readbackGaps }));
}
