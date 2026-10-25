const demand = (condition, message) => { if (!condition) throw new Error(message); };
const stable = value => value && typeof value === 'object' && !Array.isArray(value)
  ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]))
  : Array.isArray(value) ? value.map(stable) : value;
const same = (left, right) => JSON.stringify(stable(left)) === JSON.stringify(stable(right));
const historicalRoutes = ['/api/client/*', '/api/advisor/*'];
const walkthroughRoutes = [...historicalRoutes, '/api/walkthroughs/*'];
const walkthroughMigrations = [
  'supabase/migrations/20261025221028_concierge_service_workflows.sql',
  'supabase/migrations/20261025221043_concierge_private_walkthroughs.sql',
];
const installedServerVersions = ['20261025030725', '20261025030747', '20261025030748', '20261025031419'];

// This is a preparation contract. It deliberately cannot claim provisioning,
// hosted import, permission changes, deployment or hosted acceptance succeeded.
const prerequisites = {
  vaultSecret: {
    status: 'pending_separately_approved_provisioning', name: 'SUPABASE_WALKTHROUGH_KEY', type: 'secret_text',
    destination: 'private_vault_only', additive: true, keepBindingsDoesNotProvision: true, serializeSecretValue: false,
  },
  advisorGrants: {
    status: 'pending_explicit_current_founder_grants', table: 'walkthroughs.advisor_grants', principals: 'authorized_founders_only',
    requiredPermissions: ['active', 'can_view', 'can_share'], requiresLiveAdvisorPublishCapability: true,
    inferUserIds: false, preparationWritesPermissions: false,
  },
  privateImport: {
    status: 'pending_separately_approved_hosted_import', caseCount: 4, immutableVersions: true, initialShareGrants: 0,
    source: 'external_or_ignored_private_authoring_input', embedPayloadsInPublicArtifacts: false, enrollLiveClients: false,
  },
  coordinatedDeployment: {
    status: 'pending_separate_authorization',
    components: ['supabase_sql', 'supabase_edge', 'private_vault', 'pages_gateway', 'private_import', 'explicit_advisor_grants'],
    activationGate: 'all_prerequisites_then_hosted_acceptance', staticOnlyRelease: false,
  },
  hostedAcceptance: {
    status: 'pending_separately_authorized_synthetic_case',
    checks: ['advisor', 'anonymous_valid_share', 'revoked', 'expired', 'client_isolation'],
    localTestsProveHostedAcceptance: false, issueRealShareGrantsDuringTests: false,
  },
};

export function validateReleaseTarget({ target, targetName, historicalTarget }) {
  demand(['historical', 'walkthroughs'].includes(targetName), 'Unknown release target; use historical or walkthroughs');
  demand(target?.schemaVersion === 1 && historicalTarget?.schemaVersion === 1, 'Invalid release target descriptor');
  const installed = historicalTarget.vault.bindingInventory;
  demand(Array.isArray(target.vault?.bindingInventory) && new Set(target.vault.bindingInventory.map(binding => binding.name)).size === target.vault.bindingInventory.length, 'Duplicate or missing installed binding inventory');
  for (const binding of installed) demand(target.vault.bindingInventory.some(candidate => same(candidate, binding)), `Release target dropped or changed installed binding: ${binding.name}`);
  demand(same(target.vault.keepBindingTypes, historicalTarget.vault.keepBindingTypes)
    && target.vault.bindingInventory.every(binding => target.vault.keepBindingTypes.includes(binding.type)), 'Release metadata must preserve every installed binding type');
  for (const key of ['accountId', 'origin', 'compatibilityDate', 'compatibilityFlags', 'enabledFlags', 'constraints', 'migrationPolicy']) {
    demand(same(target[key], historicalTarget[key]), `Release target changes preserved ${key} policy`);
  }
  for (const key of ['script', 'namespaceId', 'className', 'secretBinding', 'privateExposure', 'declaredExports', 'expectedExportsReconciliation']) {
    demand(same(target.vault[key], historicalTarget.vault[key]), `Release target changes preserved vault ${key}`);
  }
  for (const key of ['project', 'productionBranch', 'namespaceBinding']) demand(target.pages?.[key] === historicalTarget.pages[key], `Release target changes preserved Pages ${key}`);
  const expectedSupabase = structuredClone(historicalTarget.supabase);
  if (targetName === 'walkthroughs') {
    expectedSupabase.hostedPreimages = '.local-artifacts/walkthroughs/HOSTED-SOURCE-PREIMAGES.json';
    for (const fn of expectedSupabase.functions) fn.verifyJwtEvidence = 'preserve_hosted_true';
  }
  demand(same(target.supabase, expectedSupabase), 'Release target must preserve current hosted function targets and JWT verification');
  if (targetName === 'historical') {
    demand(!target.releaseKind && !target.releasePrerequisites && (!target.gatewayRoutes || same(target.gatewayRoutes, historicalRoutes)), 'Historical release target cannot accept walkthrough routes or prerequisites');
    return { gatewayRoutes: [...historicalRoutes], releasePrerequisites: null };
  }
  demand(target.releaseKind === 'private_walkthroughs' && same(target.gatewayRoutes, walkthroughRoutes), 'Walkthrough release target routes are incomplete');
  demand(same(target.pendingMigrationSources, walkthroughMigrations)
    && same(Object.keys(target.pendingMigrationSha256 ?? {}).sort(), [...walkthroughMigrations].sort())
    && walkthroughMigrations.every(name => /^[a-f0-9]{64}$/.test(target.pendingMigrationSha256[name])), 'Walkthrough release requires both canonical migrations and their exact reviewed SHA256 entries');
  demand(Array.isArray(target.installedMigrationProvenance) && target.installedMigrationProvenance.length === historicalTarget.pendingMigrationSources.length, 'Installed migration provenance is incomplete');
  for (const [index, name] of historicalTarget.pendingMigrationSources.entries()) {
    const row = target.installedMigrationProvenance[index];
    demand(row?.sourceFile === name && row.sourceSha256 === historicalTarget.pendingMigrationSha256[name]
      && row.actualServerVersion === installedServerVersions[index]
      && row.execution === 'already installed; preserve mapping, never reapply or repair historical ledger', 'Installed source/server migration provenance changed');
  }
  demand(target.releasePrerequisites && same(Object.keys(target.releasePrerequisites).sort(), Object.keys(prerequisites).sort()), 'Walkthrough release prerequisite inventory is incomplete');
  for (const [key, expected] of Object.entries(prerequisites)) demand(same(target.releasePrerequisites[key], expected), `Walkthrough ${key} prerequisite is missing or mismatched`);
  demand(!target.vault.bindingInventory.some(binding => binding.name === prerequisites.vaultSecret.name), 'Pending additive secret prerequisite must not be represented as an installed binding');
  const uploadEvidence = target.vault.installedUploadEvidence;
  demand(uploadEvidence?.source === 'retained_exact_version_release_execution' && uploadEvidence.versionId === target.vault.baselineVersion
    && ['metadataSha256', 'uploadResultSha256', 'scriptEtag'].every(key => /^[a-f0-9]{64}$/.test(uploadEvidence[key])), 'Installed exact-version upload receipt provenance is incomplete');
  demand(target.baselineEvidence?.status === 'recorded_release_result_not_fresh_provider_readback'
    && target.baselineEvidence.source === 'docs/PORTAL_RELEASE_RESULT.md', 'Walkthrough baseline provenance must distinguish recorded evidence from fresh readback');
  return { gatewayRoutes: [...walkthroughRoutes], releasePrerequisites: structuredClone(prerequisites) };
}
