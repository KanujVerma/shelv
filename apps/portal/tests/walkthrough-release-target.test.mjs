import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const historical = JSON.parse(await readFile(new URL('../release/PRODUCTION-TARGET.json', import.meta.url), 'utf8'));
const walkthroughs = JSON.parse(await readFile(new URL('../release/WALKTHROUGHS-TARGET.json', import.meta.url), 'utf8'));
const policy = await import('../scripts/release-target-policy.mjs').catch(error => {
  if (error.code === 'ERR_MODULE_NOT_FOUND') return null;
  throw error;
});
const validate = target => {
  assert.equal(typeof policy?.validateReleaseTarget, 'function', 'Release targets need an explicit fail-closed prerequisite contract');
  return policy.validateReleaseTarget({ target, targetName: 'walkthroughs', historicalTarget: historical });
};

test('walkthrough release target preserves historical installed state and records pending hosted dependencies', () => {
  const result = validate(walkthroughs);
  assert.deepEqual(result.gatewayRoutes, ['/api/client/*', '/api/advisor/*', '/api/walkthroughs/*']);
  assert.equal(result.releasePrerequisites.vaultSecret.name, 'SUPABASE_WALKTHROUGH_KEY');
  assert.equal(result.releasePrerequisites.privateImport.caseCount, 4);
  assert.equal(result.releasePrerequisites.privateImport.initialShareGrants, 0);
});

for (const key of ['vaultSecret', 'advisorGrants', 'privateImport', 'coordinatedDeployment', 'hostedAcceptance']) {
  test(`walkthrough target rejects a missing ${key} prerequisite`, () => {
    const changed = structuredClone(walkthroughs); delete changed.releasePrerequisites[key];
    assert.throws(() => validate(changed), /prerequisite/i);
  });
}
for (const [label, mutate, expected] of [
  ['key name', t => t.releasePrerequisites.vaultSecret.name = 'SUPABASE_PUBLIC_KEY', /secret|prerequisite/i],
  ['public key destination', t => t.releasePrerequisites.vaultSecret.destination = 'pages_gateway', /secret|prerequisite/i],
  ['presumed provisioning', t => t.releasePrerequisites.vaultSecret.keepBindingsDoesNotProvision = false, /secret|prerequisite/i],
  ['invented installed secret', t => t.vault.bindingInventory.push({ name: 'SUPABASE_WALKTHROUGH_KEY', type: 'secret_text' }), /secret|prerequisite/i],
  ['grant permissions', t => t.releasePrerequisites.advisorGrants.requiredPermissions = ['can_view'], /grant|prerequisite/i],
  ['guessed founder identities', t => t.releasePrerequisites.advisorGrants.inferUserIds = true, /grant|prerequisite/i],
  ['import case count', t => t.releasePrerequisites.privateImport.caseCount = 1, /import|prerequisite/i],
  ['initial active share', t => t.releasePrerequisites.privateImport.initialShareGrants = 1, /import|prerequisite/i],
  ['embedded private payload', t => t.releasePrerequisites.privateImport.embedPayloadsInPublicArtifacts = true, /import|prerequisite/i],
  ['static only release', t => t.releasePrerequisites.coordinatedDeployment.staticOnlyRelease = true, /deployment|prerequisite/i],
  ['missing hosted revoked check', t => t.releasePrerequisites.hostedAcceptance.checks = ['advisor', 'anonymous_valid_share', 'expired'], /acceptance|prerequisite/i],
  ['historical migrations', t => t.pendingMigrationSources = historical.pendingMigrationSources, /migration/i],
  ['missing migration digest', t => delete t.pendingMigrationSha256[t.pendingMigrationSources[0]], /migration/i],
  ['unbound extra migration digest', t => t.pendingMigrationSha256['supabase/migrations/extra.sql'] = '1'.repeat(64), /migration/i],
  ['lost installed binding', t => t.vault.bindingInventory = t.vault.bindingInventory.filter(binding => binding.name !== 'SUPABASE_PUBLIC_KEY'), /installed binding/i],
  ['changed installed binding type', t => t.vault.bindingInventory[0].type = 'plain_text', /installed binding/i],
  ['duplicate installed binding', t => t.vault.bindingInventory.push(t.vault.bindingInventory[0]), /binding/i],
  ['dropped binding preservation type', t => t.vault.keepBindingTypes = ['durable_object_namespace'], /binding/i],
  ['lost source/server alias', t => t.installedMigrationProvenance.pop(), /provenance/i],
  ['changed actual server alias', t => t.installedMigrationProvenance[3].actualServerVersion = '20261025011331', /provenance/i],
]) test(`walkthrough target refuses ${label}`, () => {
  const changed = structuredClone(walkthroughs); mutate(changed);
  assert.throws(() => validate(changed), expected);
});
