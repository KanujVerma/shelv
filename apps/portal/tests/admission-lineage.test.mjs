import assert from 'node:assert/strict';
import test from 'node:test';
const lineage=await import('../scripts/local-admission-lineage.mjs').catch(()=>null);
const manifest={ownerId:'11111111-1111-4111-8111-111111111111',projectId:'shelv-portal-admission-111111111111',configSha256:'config',migrations:{'20261024000000_first.sql':'first-hash'}};
const ledger=[{version:'20261024000000',name:'first',statements:['select 1']}];
const attestation=()=>lineage.attestFreshRuntime(manifest,ledger,{name:'supabase_db_'+manifest.projectId,createdAt:'first-volume'},'/fixture');
test('fresh and reused matching runtime lineage reports its actual ledger count',()=>{
 assert.ok(lineage,'Runtime migration lineage verifier exists');const bound=attestation();assert.equal(lineage.validateRuntimeLineage(manifest,ledger,bound).migrationCount,1);
});
test('retained old database cannot satisfy a newly prepared version',()=>{
 assert.ok(lineage);const newer={...manifest,migrations:{...manifest.migrations,'20261024000001_second.sql':'second-hash'}};
 assert.throws(()=>lineage.validateRuntimeLineage(newer,ledger,attestation()),/runtime migration versions/);
});
test('same version with different prepared content cannot reuse the old attestation',()=>{
 assert.ok(lineage);const changed={...manifest,migrations:{'20261024000000_first.sql':'different-content'}};
 assert.throws(()=>lineage.validateRuntimeLineage(changed,ledger,attestation()),/runtime snapshot/);
});
test('changed actual applied statements are rejected even if version and prepared content match',()=>{
 assert.ok(lineage);assert.throws(()=>lineage.validateRuntimeLineage(manifest,[{...ledger[0],statements:['select 2']}],attestation()),/runtime ledger/);
});
test('unbound retained database and foreign owner are rejected',()=>{
 assert.ok(lineage);assert.throws(()=>lineage.validateRuntimeLineage(manifest,ledger,null),/unbound runtime/);assert.throws(()=>lineage.validateRuntimeLineage({...manifest,ownerId:'foreign'},ledger,attestation()),/runtime owner/);
});
test('unknown or other-checkout existing resources fail before startup or cleanup',()=>{
 assert.ok(lineage);const volume={Name:'supabase_db_'+manifest.projectId,CreatedAt:'first-volume',Labels:{'com.supabase.cli.project':manifest.projectId}};
 assert.throws(()=>lineage.verifyFixtureResources(manifest,null,volume,[],'/fixture'),/unbound retained/);
 const bound=attestation();assert.throws(()=>lineage.verifyFixtureResources(manifest,bound,volume,[{Config:{Labels:{'com.supabase.cli.project':manifest.projectId,'com.supabase.cli.workdir':'/other-checkout'}}}],'/fixture'),/foreign checkout/);
 assert.equal(lineage.verifyFixtureResources(manifest,bound,volume,[],'/fixture').fresh,false);
 assert.equal(lineage.verifyFixtureResources(manifest,null,null,[],'/fixture').fresh,true);
});
