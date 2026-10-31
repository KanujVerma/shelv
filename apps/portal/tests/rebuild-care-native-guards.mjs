import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import path from 'node:path';
import {selectCareFixture, validateCareSource, validateCareRuntime, requireCareCustody, careHelperPlan, careNativePins} from '../scripts/rebuild-care-native-fixture.mjs';
import {providerTarget, providerOrigin, sha, localPolicy} from '../scripts/rebuild-native-boundary.mjs';
import {snapshotDigest, attestFreshRuntime} from '../scripts/local-admission-lineage.mjs';

assert.equal(process.env.SHELV_REBUILD_CARE_NATIVE_GUARDS, '1', 'Explicit pure care guard opt-in required');
const root = path.resolve(import.meta.dirname, '../../..');
const parentRoot = '/Users/kanuj/.t3/worktrees/shelv/kanuj-portal-rebuild-integration-20261030';
// Authorization test metadata must not become valid merely because this test runs in the parent checkout.
const syntheticChildWorkspace = '/synthetic/shelv/w6-care-child-workspace';
const foreignDirectory = '/synthetic/shelv/foreign-directory';
const ownerId = '39f4ba79-bdd5-4822-bc4d-c4412d70d732';
const directory = parentRoot + '/.local-artifacts/portal-rebuild/canonical-plan-v1-r7';
const projectId = 'shelv-portal-admission-39f4ba79bdd5';
const actorId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
// Pure metadata only. These are never actual container/credential inputs.
const migrations = Object.fromEntries(await Promise.all((await readdir(path.join(root, 'supabase/migrations'))).filter(n=>n.endsWith('.sql')).sort().map(async n=>[n,sha(await readFile(path.join(root,'supabase/migrations',n)))])));
// Derive public configuration bytes from checked-in source; never read a fixture or secret input.
const configTemplate=await readFile(new URL('../test-fixtures/admission/supabase/config.toml',import.meta.url),'utf8');
const config=Buffer.from(configTemplate.replace(/^project_id\s*=.*$/m,'project_id = '+JSON.stringify(projectId)));
const manifest = {marker:'shelv-portal-admission-fixture-v2',ownerId,projectId,configSha256:sha(config),migrations};
const ledger = Object.keys(migrations).map(n=>{const i=n.indexOf('_');return{version:n.slice(0,i),name:n.slice(i+1,-4),statements:['-- synthetic metadata only']};});
const volume = {Name:'supabase_db_'+projectId,CreatedAt:'2026-10-31T00:00:00Z',Labels:{'com.supabase.cli.project':projectId}};
const binding = attestFreshRuntime(manifest,ledger,{name:volume.Name,createdAt:volume.CreatedAt},directory);
const sourceHashes = {'src/contracts/PortalCare.ts':sha('synthetic source metadata')};
const nativeEnv=['CONCIERGE_ALLOWED_ORIGINS=https://portal.goshelv.com,https://127.0.0.1:57430','SUPABASE_URL=https://shelv-native-tls','DENO_TLS_CA_STORE=system','SSL_CERT_FILE=/certs/server.crt'];
const helpers = Object.fromEntries(['plan','operations','payments','care','tls'].map((kind,i)=>[kind,{name:`portal-r7-${kind}-39f4ba79bdd5`,id:String(i+1).repeat(64),environmentSha256:sha((kind==='tls'?[]:nativeEnv).join('\n')+'\n')}]));
const selection = {format:1,purpose:'w6-care-native-r7',parentRoot,directory,ownerId,projectId,ownerActorId:actorId,migrationCount:57,configSha256:sha(config),snapshotSha256:snapshotDigest(manifest),ledgerSha256:binding.ledgerSha256,sourceHashesSha256:sha(JSON.stringify(sourceHashes)),helpers,tlsImage:'nginx:1.28.0-alpine@sha256:30f1c'+ '0'.repeat(59)};
const clone = value=>structuredClone(value);
const selected = ()=>selectCareFixture(clone(selection));
function runtime() {
  const plan = careHelperPlan(selected());
  const helperInspections = Object.fromEntries(Object.entries(helpers).map(([kind,item])=>[kind,{Id:item.id,Name:'/'+item.name,State:{Running:true},Config:{Image:kind==='tls'?selection.tlsImage:careNativePins.edgeImage,Labels:{'shelv.fixture.owner':ownerId,'shelv.fixture.project':projectId,'shelv.fixture.workdir':directory},Env:kind==='tls'?[]:['CONCIERGE_ALLOWED_ORIGINS=https://portal.goshelv.com,https://127.0.0.1:57430','SUPABASE_URL=https://shelv-native-tls','DENO_TLS_CA_STORE=system','SSL_CERT_FILE=/certs/server.crt']},HostConfig:{PortBindings:kind==='tls'?{}:{'9000/tcp':[{HostIp:'127.0.0.1',HostPort:String(plan.helpers[kind].port)}]}}} ]));
  const containers=[{Name:'/supabase_db_'+projectId,State:{Running:true},Config:{Labels:{'com.supabase.cli.project':projectId,'com.supabase.cli.workdir':directory}}}];
  return {manifest,ledger,binding,volume,containers,helperInspections,sourceHashes};
}

test('R7 selection is explicit, current57 and does not adopt old R4 or caller-selected paths',()=>{
  assert.equal(selected().migrationCount,57);
  for(const patch of [undefined,{directory:directory.replace('r7','r4')},{directory:directory.replace('r7','r5')},{purpose:'w6-care-native-r5'},{purpose:'w6-care-native-r6'},{directory:directory.replace('r7','r6')},{ownerId:'ed43b296-fde5-400b-9465-9c26ef662e21',projectId:'shelv-portal-admission-ed43b296fde5'},{ownerId:'d5c39897-0583-4056-8056-000000000000',projectId:'shelv-portal-admission-d5c398970583'},{parentRoot:foreignDirectory},{directory:foreignDirectory},{ownerId:'6214c384-1fb3-4aad-b5a8-9dd9042345a3'},{projectId:'shelv-portal-admission-6214c3841fb3'},{ownerId:actorId},{configSha256:sha('foreign config')},{migrationCount:55},{migrationCount:56},{directory:directory+'/../canonical-plan-v1-r7'},{unexpected:true}]) {
    assert.throws(()=>selectCareFixture(patch===undefined?undefined:{...clone(selection),...patch}));
  }
});
test('care grant is separate from selection and binds parent, fixture, workspace and phase',()=>{
  const grant={format:1,parentThreadId:'d632030a-18f7-4dec-a2c9-f5c0418c3fd5',purpose:'genuine-care-node',workspace:syntheticChildWorkspace,directory,ownerId,projectId,snapshotSha256:selection.snapshotSha256,grantId:'synthetic-unit-only'};
  assert.doesNotThrow(()=>requireCareCustody(selected(),grant,syntheticChildWorkspace));
  for(const patch of [null,{purpose:'genuine-care-browser'},{ownerId:actorId},{workspace:foreignDirectory},{workspace:parentRoot},{snapshotSha256:sha('different')},{parentThreadId:'other'},{grantId:''}])assert.throws(()=>requireCareCustody(selected(),patch===null?null:{...grant,...patch},syntheticChildWorkspace));
  assert.throws(()=>requireCareCustody(selected(),{...grant,workspace:parentRoot},parentRoot),'Matching parent workspace remains explicitly disallowed');
});
test('source attestation rejects old55, wrong bytes, mismatched snapshot/config and foreign source',()=>{
  assert.doesNotThrow(()=>validateCareSource(selected(),{manifest,config,migrations,sourceHashes}));
  const missing=clone(migrations);delete missing['20261031043655_portal_rebuild_care_use_v1.sql'];
  for(const patch of [{migrations:missing},{config:Buffer.from('changed')},{sourceHashes:{...sourceHashes,extra:sha('x')}},{manifest:{...manifest,ownerId:actorId}}])assert.throws(()=>validateCareSource(selected(),{manifest,config,migrations,sourceHashes,...patch}));
  const staleMigrations={...migrations,[careNativePins.migration]:sha('synthetic superseded M56')},staleManifest={...manifest,migrations:staleMigrations};
  const matchingStaleSelection=selectCareFixture({...clone(selection),snapshotSha256:snapshotDigest(staleManifest)});
  assert.throws(()=>validateCareSource(matchingStaleSelection,{manifest:staleManifest,config,migrations:staleMigrations,sourceHashes}),/corrected M56/,'Matching old57 metadata still cannot admit superseded SQL');
  const staleForward={...migrations,[careNativePins.historyMigration]:sha('synthetic superseded M57')},staleForwardManifest={...manifest,migrations:staleForward};
  assert.throws(()=>validateCareSource(selectCareFixture({...clone(selection),snapshotSha256:snapshotDigest(staleForwardManifest)}),{manifest:staleForwardManifest,config,migrations:staleForward,sourceHashes}),/forward M57/);
});
test('runtime attestation rejects replaced volume, wrong owner/workdir/ledger/helper/source and missing DB',()=>{
  assert.doesNotThrow(()=>validateCareRuntime(selected(),runtime()));
  const variants=[r=>r.volume.CreatedAt='different',r=>r.volume.Labels['com.supabase.cli.project']='foreign',r=>r.binding.ownerId=actorId,r=>r.binding.workdirSha256=sha(foreignDirectory),r=>r.ledger.pop(),r=>r.containers=[],r=>r.containers[0].State.Running=false,r=>r.helperInspections.care.Id='a'.repeat(64),r=>r.helperInspections.care.Config.Labels['shelv.fixture.owner']=actorId,r=>r.helperInspections.care.Config.Labels['shelv.fixture.workdir']=foreignDirectory,r=>r.helperInspections.care.Config.Image='edge-runtime:latest',r=>r.helperInspections.tls.Config.Image='nginx:latest',r=>r.helperInspections.care.Config.Env[0]='CONCIERGE_ALLOWED_ORIGINS=https://foreign.invalid',r=>r.helperInspections.care.HostConfig.PortBindings['9000/tcp'][0].HostIp='0.0.0.0',r=>r.helperInspections.care.State.Running=false,r=>r.sourceHashes.extra=sha('drift')];
  for(const mutate of variants){const r=clone(runtime());mutate(r);assert.throws(()=>validateCareRuntime(selected(),r));}
});
test('native helper plan is fresh R7 only, locked unmodified care entry, finite TLS RPC and loopback57443',()=>{
  const plan=careHelperPlan(selected());
  assert.equal(plan.helpers.care.entry,'supabase/functions/concierge-care/index.ts');
  assert.equal(plan.helpers.care.port,57443);assert.equal(plan.edgeImage,careNativePins.edgeImage);
  assert.deepEqual(plan.rpcAdditions,['concierge_care_command_v1']);
  assert.match(plan.tlsLocation,/location = \/rest\/v1\/rpc\/concierge_care_command_v1/);
  assert.equal(plan.globalTrustChanges,false);assert.equal(plan.adaptExistingHelpers,false);
});
test('care provider destination is finite and default Genuine13 boundary stays closed',async()=>{
  const raw=providerOrigin+'/functions/v1/concierge-care';
  assert.throws(()=>providerTarget(raw),/provider boundary/);
  assert.equal(providerTarget(raw,{care:true}),'http://127.0.0.1:57443/');
  for(const suffix of ['?rpc=concierge_care_command_v1','/extra','#fragment'])assert.throws(()=>providerTarget(raw+suffix,{care:true}),/provider boundary/);
  assert.throws(()=>providerTarget(providerOrigin+'/rest/v1/rpc/concierge_care_command_v1',{care:true}),/provider boundary/);
  const source=await readFile(path.join(root,'apps/portal/session-integration/runtime/server/policy.ts'),'utf8');
  assert.equal(sha(source),'e091552ab66fb26a907c14d6942553a90b9cbbd415cba0177d817b40658976d7');
  assert.equal(localPolicy(source).replace('https://127.0.0.1:57430','https://portal.goshelv.com').replace(providerOrigin,'https://snojlbqovlawewwqbviz.supabase.co'),source);
});
