import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildCandidate } from '../session-integration/runtime/scripts/build.mjs';

const portal = fileURLToPath(new URL('../', import.meta.url));
const repository = path.resolve(portal, '../..');
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

async function inventory(root, prefix = '') {
  const result = {};
  for (const entry of (await readdir(path.join(root, prefix), { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    const relative = path.posix.join(prefix, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Site source must not contain symlinks: ${relative}`);
    if (/^\.(?:env|dev\.vars)(?:\.|$)/.test(entry.name)) throw new Error(`Private configuration cannot enter the static package: ${relative}`);
    if (entry.isDirectory()) Object.assign(result, await inventory(root, relative));
    else if (entry.isFile()) {
      const bytes = await readFile(path.join(root, relative));
      result[relative] = { bytes: bytes.length, sha256: sha256(bytes) };
    }
  }
  return result;
}

export async function buildPortal({ sourceDir = path.join(portal, 'site'), outputDir = path.join(repository, '.local-artifacts/portal-build') } = {}) {
  const [major, minor] = process.versions.node.split('.').map(Number);
  if (major < 22 || (major === 22 && minor < 23)) throw new Error('Portal builds require Node.js 22.23.0 or newer.');
  sourceDir = path.resolve(sourceDir);
  outputDir = path.resolve(outputDir);
  if (sourceDir === outputDir || sourceDir.startsWith(outputDir + path.sep) || outputDir.startsWith(sourceDir + path.sep)) throw new Error('Generated output must be separate from site source.');
  const sourceAssets = await inventory(sourceDir);
  const site = path.join(outputDir, 'site');
  const runtime = path.join(outputDir, 'runtime');
  await mkdir(outputDir, { recursive: true });
  await rm(site, { recursive: true, force: true });
  await rm(runtime, { recursive: true, force: true });
  await cp(sourceDir, site, { recursive: true });
  await buildCandidate({ advisor: true, outdir: runtime });
  for (const filename of ['_worker.js', '_routes.json']) await cp(path.join(runtime, 'advisor-pages', filename), path.join(site, filename));
  const assets = await inventory(site);
  const routes = JSON.parse(await readFile(path.join(site, '_routes.json'), 'utf8'));
  if (JSON.stringify(routes.include) !== JSON.stringify(['/api/client/*', '/api/advisor/*'])) throw new Error('Both client and advisor gateway routes are required.');
  const zipPath = path.join(outputDir, 'portal.zip');
  execFileSync('python3', ['-c', `from pathlib import Path
import sys,zipfile
root=Path(sys.argv[1])
with zipfile.ZipFile(sys.argv[2],'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as archive:
 for source in sorted(root.rglob('*')):
  if source.is_file():
   item=zipfile.ZipInfo(source.relative_to(root).as_posix(),date_time=(2026,10,24,0,0,0))
   item.compress_type=zipfile.ZIP_DEFLATED
   item.external_attr=0o100644<<16
   archive.writestr(item,source.read_bytes(),compresslevel=9)
`, site, zipPath]);
  const after = await inventory(sourceDir);
  if (JSON.stringify(after) !== JSON.stringify(sourceAssets)) throw new Error('Site source changed during packaging; build again from a stable source tree.');
  const vaultBytes = await readFile(path.join(runtime, 'vault/index.js'));
  const runtimeSources = {};
  for (const folder of ['server', 'workers', 'adapter', 'scripts']) {
    for (const [name, value] of Object.entries(await inventory(path.join(portal, 'session-integration/runtime', folder)))) runtimeSources[`${folder}/${name}`] = value;
  }
  const baseline = JSON.parse(await readFile(path.join(portal, 'provenance/DEPLOYED-20261024.json'), 'utf8'));
  const deployedBaseline = sourceDir === path.join(portal, 'site') ? {
    deployment: baseline.deployment,
    zipSha256: baseline.zipSha256,
    modifiedSourceFiles: Object.keys(sourceAssets).filter(name => baseline.files[name] && baseline.files[name] !== sourceAssets[name].sha256),
    addedSourceFiles: Object.keys(sourceAssets).filter(name => !baseline.files[name]),
    removedSourceFiles: Object.keys(baseline.files).filter(name => !sourceAssets[name]),
    generatedGatewayMatchesDeployed: assets['_worker.js'].sha256 === baseline.files['_worker.js'],
    generatedVaultMatchesDeployed: sha256(vaultBytes) === baseline.vault.sha256,
  } : null;
  const result = { schemaVersion: 1, assetCount: Object.keys(assets).length, gatewayRoutes: routes.include, sourceSnapshotUnchanged: true, sourceAssets, runtimeSources, assets, zipSha256: sha256(await readFile(zipPath)), vault: { bytes: vaultBytes.length, sha256: sha256(vaultBytes) }, deployedBaseline, productionDeploymentChanged: false };
  await writeFile(path.join(outputDir, 'BUILD-MANIFEST.json'), JSON.stringify(result, null, 2) + '\n');
  return result;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await buildPortal();
  console.log(JSON.stringify({ output: path.join(repository, '.local-artifacts/portal-build'), assetCount: result.assetCount, gatewayRoutes: result.gatewayRoutes, zipSha256: result.zipSha256, vaultSha256: result.vault.sha256, productionDeploymentChanged: false }));
}
