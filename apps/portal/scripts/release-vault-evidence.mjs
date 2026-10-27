import { createHash } from 'node:crypto';
const demand = (condition, message) => { if (!condition) throw new Error(message); };
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const stable = value => value && typeof value === 'object' && !Array.isArray(value)
  ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]))
  : Array.isArray(value) ? value.map(stable) : value;
const same = (left, right) => JSON.stringify(stable(left)) === JSON.stringify(stable(right));

// These are recorded upload receipts, coupled to a separately acquired current
// version/etag readback. They are never described as fields returned by settings GET.
export function verifyVaultUploadEvidence({ metadataBytes, uploadResultBytes, target, readback }) {
  const expected = target.vault.installedUploadEvidence;
  demand(expected?.versionId === target.vault.baselineVersion, 'Installed upload receipt version pin mismatch');
  demand(hash(metadataBytes) === expected.metadataSha256, 'Installed vault metadata receipt hash mismatch');
  demand(hash(uploadResultBytes) === expected.uploadResultSha256, 'Installed vault upload receipt hash mismatch');
  const metadata = JSON.parse(metadataBytes), upload = JSON.parse(uploadResultBytes);
  demand(same(metadata.exports, target.vault.declaredExports), 'Installed upload declared exports mismatch');
  demand(same(metadata.bindings, []) && same(metadata.keep_bindings, target.vault.keepBindingTypes) && !Object.hasOwn(metadata, 'migrations'), 'Installed upload binding preservation mismatch');
  demand(upload.success === true && upload.status === 200 && same(upload.errors, []) && upload.result?.id === target.vault.script, 'Installed vault upload receipt was not successful for this script');
  demand(upload.result.deploymentId === target.vault.baselineVersion.replaceAll('-', ''), 'Installed upload version mismatch');
  demand(same(upload.result.exportsReconciliation, target.vault.expectedExportsReconciliation), 'Installed export reconciliation must have no effects');
  demand(upload.result.etag === expected.scriptEtag && readback.vaultScriptEtag === expected.scriptEtag, 'Current script etag does not match the installed upload receipt');
  const deployment = readback.vaultDeployments?.items?.[0] ?? readback.vaultDeployment;
  demand(readback.vaultLatestVersionId === expected.versionId && deployment?.id === target.vault.baselineDeployment
    && same(deployment.versions, [{ version_id: expected.versionId, percentage: 100 }]), 'Current deployed/latest version does not match the installed upload receipt');
  const observability = upload.result.observability;
  demand(observability?.enabled === false && ['logs', 'traces', 'issues'].every(key => observability[key]?.enabled === false), 'Installed upload observability acknowledgement must disable every collection channel');
  return {
    source: 'retained_exact_version_upload_receipt_coupled_to_current_version',
    versionId: expected.versionId, scriptEtag: expected.scriptEtag,
    metadataSha256: expected.metadataSha256, uploadResultSha256: expected.uploadResultSha256,
    declaredExports: metadata.exports, observability,
  };
}
