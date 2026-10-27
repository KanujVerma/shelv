import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const target = JSON.parse(await readFile(new URL('../release/WALKTHROUGHS-TARGET.json', import.meta.url), 'utf8'));
const evidence = await import('../scripts/release-vault-evidence.mjs').catch(error => {
  if (error.code === 'ERR_MODULE_NOT_FOUND') return null;
  throw error;
});
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
function fixture() {
  const selected = structuredClone(target);
  const metadata = { bindings: [], keep_bindings: selected.vault.keepBindingTypes, exports: selected.vault.declaredExports };
  const upload = { success: true, status: 200, errors: [], result: { id: selected.vault.script, etag: '1'.repeat(64), deploymentId: selected.vault.baselineVersion.replaceAll('-', ''), exportsReconciliation: structuredClone(selected.vault.expectedExportsReconciliation), observability: { enabled: false, logs: { enabled: false }, traces: { enabled: false }, issues: { enabled: false } } } };
  const readback = { vaultScriptEtag: upload.result.etag, vaultLatestVersionId: selected.vault.baselineVersion, vaultDeployments: { success: true, items: [{ id: selected.vault.baselineDeployment, versions: [{ version_id: selected.vault.baselineVersion, percentage: 100 }] }] } };
  const inputs = { target: selected, readback };
  const sync = () => {
    inputs.metadataBytes = Buffer.from(JSON.stringify(metadata)); inputs.uploadResultBytes = Buffer.from(JSON.stringify(upload));
    selected.vault.installedUploadEvidence = { source: 'retained_exact_version_release_execution', metadataSha256: hash(inputs.metadataBytes), uploadResultSha256: hash(inputs.uploadResultBytes), versionId: selected.vault.baselineVersion, scriptEtag: upload.result.etag };
  };
  sync(); return { inputs, metadata, upload, readback, sync };
}
const verify = inputs => {
  assert.equal(typeof evidence?.verifyVaultUploadEvidence, 'function', 'Retained receipts must be verified against the exact current deployed version');
  return evidence.verifyVaultUploadEvidence(inputs);
};

test('recorded upload metadata is coupled to fresh deployed version and script etag without inventing GET fields', () => {
  const { inputs, readback } = fixture(); const result = verify(inputs);
  assert.equal(result.source, 'retained_exact_version_upload_receipt_coupled_to_current_version');
  assert.deepEqual(result.declaredExports, target.vault.declaredExports);
  assert.equal(result.observability.enabled, false);
  assert.equal(readback.declaredExports, undefined);
});
for (const [label, mutate, expected] of [
  ['metadata bytes drift', f => f.inputs.metadataBytes = Buffer.from('{}'), /metadata.*hash/i],
  ['upload receipt bytes drift', f => f.inputs.uploadResultBytes = Buffer.from('{}'), /upload.*hash/i],
  ['latest version drift', f => f.readback.vaultLatestVersionId = 'other', /version/i],
  ['current etag drift', f => f.readback.vaultScriptEtag = '2'.repeat(64), /etag/i],
  ['missing current etag', f => delete f.readback.vaultScriptEtag, /etag/i],
  ['deployed version drift', f => f.readback.vaultDeployments.items[0].versions[0].version_id = 'other', /version/i],
  ['nonempty reconciliation', f => { f.upload.result.exportsReconciliation.created = ['new-class']; f.sync(); }, /reconciliation/i],
  ['different export', f => { f.metadata.exports = { AnotherObject: { type: 'durable-object', storage: 'sqlite' } }; f.sync(); }, /exports/i],
  ['receipt enables logging', f => { f.upload.result.observability.enabled = true; f.sync(); }, /observability/i],
  ['receipt replaces a binding', f => { f.metadata.bindings = [{ name: 'ADVISOR_SESSION_KEYS', type: 'secret_text' }]; f.sync(); }, /binding/i],
]) test(`retained receipt refuses ${label}`, () => {
  const f = fixture(); mutate(f); assert.throws(() => verify(f.inputs), expected);
});
