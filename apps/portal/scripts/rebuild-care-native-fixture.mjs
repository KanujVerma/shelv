import assert from 'node:assert/strict';
import {readFile, readdir, lstat, realpath} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {readPreparedPortalAdmissionFixture} from './local-admission.mjs';
import {snapshotDigest, validateRuntimeLineage, verifyFixtureResources} from './local-admission-lineage.mjs';
import {parentRoot, fixtureOwner as protectedR4Owner} from './rebuild-native-fixture.mjs';
import {sha, portalOrigin, providerOrigin} from './rebuild-native-boundary.mjs';

export const careNativePins = Object.freeze({
  nodeVersion:'v22.23.0', migrationCount:56,
  migration:'20261031043655_portal_rebuild_care_use_v1.sql',
  parentThreadId:'d632030a-18f7-4dec-a2c9-f5c0418c3fd5',
  dockerHost:'unix:///Users/kanuj/.colima/shelv-portal-20261024/docker.sock',
  edgeImage:'public.ecr.aws/supabase/edge-runtime@sha256:ad45164b7548bf5820ed7be714789c17ac2865edce79a09cfb4c3756c3d365a8',
});
const uuid = value=>assert.match(value,/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,'Expected canonical UUID');
const hash = value=>assert.match(value,/^[0-9a-f]{64}$/,'Expected exact source hash');
const kinds = ['plan','operations','payments','care','tls'];
const sourceKeys = ['format','purpose','parentRoot','directory','ownerId','projectId','ownerActorId','migrationCount','configSha256','snapshotSha256','ledgerSha256','sourceHashesSha256','helpers','tlsImage'];
function keys(value, expected) {assert.ok(value&&typeof value==='object'&&!Array.isArray(value));assert.deepEqual(Object.keys(value).sort(),[...expected].sort(),'Unexpected or missing selection fields');}

// Pure selection, never an implicit custody grant or lifecycle operation.
export function selectCareFixture(value) {
  keys(value,sourceKeys);assert.equal(value.format,1);assert.equal(value.purpose,'w6-care-native-r5');
  assert.equal(value.parentRoot,parentRoot,'Only the allocated parent checkout is permitted');
  assert.equal(value.directory,path.join(parentRoot,'.local-artifacts/portal-rebuild/canonical-plan-v1-r5'),'Only explicitly selected new R5 is permitted');
  uuid(value.ownerId);uuid(value.ownerActorId);assert.notEqual(value.ownerId,protectedR4Owner,'Protected R4 cannot be adopted');
  assert.equal(value.projectId,'shelv-portal-admission-'+value.ownerId.replaceAll('-','').slice(0,12));
  assert.equal(value.migrationCount,careNativePins.migrationCount,'R5 requires current56, never old55');
  for(const key of ['configSha256','snapshotSha256','ledgerSha256','sourceHashesSha256'])hash(value[key]);
  keys(value.helpers,kinds);
  const suffix=value.ownerId.replaceAll('-','').slice(0,12),ids=new Set(),names=new Set();
  for(const item of Object.values(value.helpers)) {
    keys(item,['name','id','environmentSha256']);hash(item.id);hash(item.environmentSha256);assert.match(item.name,/^[a-z0-9][a-z0-9-]+$/);
    assert.ok(item.name.endsWith('-'+suffix),'Helpers must be fresh selected-R5 names');
    assert.ok(!ids.has(item.id)&&!names.has(item.name),'Distinct helper identities required');ids.add(item.id);names.add(item.name);
  }
  // Parent supplies the complete locked digest with its actual receipt, never a mutable tag.
  assert.match(value.tlsImage,/^nginx:1\.28\.0-alpine@sha256:30f1c[0-9a-f]{59}$/,'Locked reviewed nginx image required');
  return Object.freeze({...value,helpers:Object.freeze(Object.fromEntries(Object.entries(value.helpers).map(([k,v])=>[k,Object.freeze({...v})])))});
}

export function requireCareCustody(selection, grant, workspace, purpose='genuine-care-node') {
  selectCareFixture(selection);
  assert.ok(['genuine-care-node','genuine-care-browser'].includes(purpose));
  keys(grant,['format','parentThreadId','purpose','workspace','directory','ownerId','projectId','snapshotSha256','grantId']);
  assert.equal(grant.format,1);assert.equal(grant.parentThreadId,careNativePins.parentThreadId);assert.equal(grant.purpose,purpose,'Separate phase-specific parent grant required');
  assert.equal(grant.workspace,workspace);assert.ok(path.isAbsolute(workspace));assert.notEqual(workspace,parentRoot);
  for(const key of ['directory','ownerId','projectId','snapshotSha256'])assert.equal(grant[key],selection[key],'Custody must bind the selected R5');
  assert.ok(typeof grant.grantId==='string'&&/^[a-zA-Z0-9:_-]{1,200}$/.test(grant.grantId),'Exact parent grant reference required');
  return grant;
}

export function validateCareSource(selection,{manifest,config,migrations,sourceHashes}) {
  selectCareFixture(selection);
  assert.equal(manifest.marker,'shelv-portal-admission-fixture-v2');
  for(const key of ['ownerId','projectId','configSha256'])assert.equal(manifest[key],selection[key],'Selected prepared source mismatch');
  assert.equal(sha(config),selection.configSha256,'Prepared config bytes differ');
  assert.equal(Object.keys(manifest.migrations).length,56,'Prepared fixture must have56 migrations');
  assert.ok(Object.hasOwn(manifest.migrations,careNativePins.migration),'Actual care migration required');
  assert.deepEqual(migrations,manifest.migrations,'Current canonical migration bytes differ from selected snapshot');
  for(const value of Object.values(migrations))hash(value);
  assert.equal(snapshotDigest(manifest),selection.snapshotSha256,'Prepared snapshot differs');
  assert.equal(sha(JSON.stringify(sourceHashes)),selection.sourceHashesSha256,'Current native source closure differs');
  return {migrationCount:56,snapshotSha256:selection.snapshotSha256,sourceHashesSha256:selection.sourceHashesSha256};
}

// A source-only plan. This function never executes Docker, copies files, reads credentials or adapts helpers.
export function careHelperPlan(selection) {
  selectCareFixture(selection);
  const helpers=Object.fromEntries([['plan','concierge-plans',57440],['operations','concierge-operations',57441],['payments','concierge-payments',57442],['care','concierge-care',57443]].map(([kind,family,port])=>[kind,{...selection.helpers[kind],entry:'supabase/functions/'+family+'/index.ts',port,host:'127.0.0.1',sourceCopy:'/app',certCopy:'/certs'}]));
  return {ownerId:selection.ownerId,projectId:selection.projectId,directory:selection.directory,edgeImage:careNativePins.edgeImage,tlsImage:selection.tlsImage,helpers,
    rpcAdditions:['concierge_care_command_v1'],
    tlsLocation:`location = /rest/v1/rpc/concierge_care_command_v1 { proxy_pass http://supabase_kong_${selection.projectId}:8000; }`,
    origins:'https://portal.goshelv.com,'+portalOrigin,ca:'separate CA and CA:false leaf, container-only system store',
    globalTrustChanges:false,adaptExistingHelpers:false,executionAuthorized:false};
}

export function validateCareRuntime(selection,{manifest,binding,volume,containers,ledger,helperInspections,sourceHashes}) {
  selectCareFixture(selection);
  assert.equal(manifest.ownerId,selection.ownerId);assert.equal(manifest.projectId,selection.projectId);
  assert.equal(Object.keys(manifest.migrations).length,56);assert.equal(snapshotDigest(manifest),selection.snapshotSha256);
  assert.equal(verifyFixtureResources(manifest,binding,volume,containers,selection.directory).fresh,false);
  const lineage=validateRuntimeLineage(manifest,ledger,binding);
  assert.equal(lineage.migrationCount,56);assert.equal(lineage.snapshotSha256,selection.snapshotSha256);assert.equal(lineage.ledgerSha256,selection.ledgerSha256);
  assert.equal(binding.migrationCount,56);assert.equal(sha(JSON.stringify(sourceHashes)),selection.sourceHashesSha256);
  const db=containers.find(c=>c.Name==='/supabase_db_'+selection.projectId);assert.ok(db,'Selected running DB container required');assert.equal(db.State.Running,true);
  const plan=careHelperPlan(selection);
  keys(helperInspections,kinds);
  for(const kind of kinds) {
    const live=helperInspections[kind],expected=selection.helpers[kind];
    assert.equal(live.Id,expected.id,'Recorded helper ID differs');assert.equal(live.Name,'/'+expected.name);assert.equal(live.State.Running,true);
    assert.equal(live.Config.Labels['shelv.fixture.owner'],selection.ownerId);assert.equal(live.Config.Labels['shelv.fixture.project'],selection.projectId);assert.equal(live.Config.Labels['shelv.fixture.workdir'],selection.directory);
    assert.equal(live.Config.Image,kind==='tls'?selection.tlsImage:careNativePins.edgeImage,'Locked helper image differs');
    assert.equal(sha(live.Config.Env.join('\n')+'\n'),expected.environmentSha256,'Recorded helper environment differs');
    if(kind==='tls')continue;
    assert.deepEqual(live.HostConfig.PortBindings['9000/tcp'],[{HostIp:'127.0.0.1',HostPort:String(plan.helpers[kind].port)}]);
    const env=Object.fromEntries(live.Config.Env.map(line=>{const split=line.indexOf('=');return[line.slice(0,split),line.slice(split+1)];}));
    assert.equal(env.CONCIERGE_ALLOWED_ORIGINS,plan.origins);assert.equal(env.SUPABASE_URL,'https://shelv-native-tls');assert.equal(env.DENO_TLS_CA_STORE,'system');assert.equal(env.SSL_CERT_FILE,'/certs/server.crt');
  }
  return lineage;
}

async function sourceTree(directory,prefix='') {
  const result={};
  for(const entry of (await readdir(directory,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))) {
    const file=path.join(directory,entry.name);assert.ok(!entry.isSymbolicLink(),'No symlink in native source closure');
    if(entry.isDirectory())Object.assign(result,await sourceTree(file,prefix+entry.name+'/'));
    else {assert.ok(entry.isFile());result[prefix+entry.name]=sha(await readFile(file));}
  }
  return result;
}
export async function careSourceHashes(root) {
  const result={};
  const paths=['src/contracts',...(await readdir(path.join(root,'supabase/functions'))).filter(n=>n.startsWith('concierge-')).sort().map(n=>'supabase/functions/'+n),'supabase/functions/_shared/vendor/jpeg-js'].sort();
  for(const relative of paths)Object.assign(result,await sourceTree(path.join(root,relative),relative+'/'));
  return result;
}
async function migrationHashes(root) {
  const names=(await readdir(path.join(root,'supabase/migrations'))).filter(n=>n.endsWith('.sql')).sort();
  return Object.fromEntries(await Promise.all(names.map(async name=>[name,sha(await readFile(path.join(root,'supabase/migrations',name)))])));
}

// Explicit later-phase entry only. Everything before Docker is read-only source/prepared receipt validation.
// No fallback to R4 and no preparation/reset/start/stop/adopt command exists here.
export async function attestCareFixture(sourceRoot,rawSelection,grant) {
  assert.equal(sourceRoot,path.resolve(import.meta.dirname,'../../..'),'Attestor must run from its allocated source checkout');
  const selection=selectCareFixture(rawSelection);requireCareCustody(selection,grant,sourceRoot);
  assert.equal(process.version,careNativePins.nodeVersion);assert.equal(process.env.SHELV_REBUILD_CARE_NATIVE,'1','Explicit connected care opt-in required');
  const fixture=await readPreparedPortalAdmissionFixture(parentRoot,selection.directory);
  assert.equal(await realpath(selection.directory),selection.directory,'Real fixture path must match selection');
  const sourceHashes=await careSourceHashes(sourceRoot);
  assert.deepEqual(await careSourceHashes(parentRoot),sourceHashes,'Parent/current native source closure differs');
  const migrations=await migrationHashes(sourceRoot);
  assert.deepEqual(await migrationHashes(parentRoot),migrations,'Parent/current migrations differ');
  assert.deepEqual(await migrationHashes(selection.directory),migrations,'Prepared/current migrations differ');
  validateCareSource(selection,{manifest:fixture.manifest,config:await readFile(path.join(selection.directory,'supabase/config.toml')),migrations,sourceHashes});
  const env={...process.env,DOCKER_HOST:careNativePins.dockerHost,DOCKER_CONFIG:path.join(selection.directory,'docker-config')};delete env.DOCKER_CONTEXT;
  const docker=(...args)=>{try{return execFileSync('docker',args,{env,encoding:'utf8',stdio:['ignore','pipe','pipe'],maxBuffer:16*1024*1024}).trim();}catch{throw Error('Selected R5 Docker read failed; private output suppressed');}};
  const db='supabase_db_'+selection.projectId;
  const sql=text=>{try{return execFileSync('docker',['exec','-i',db,'psql','-U','postgres','-d','postgres','-X','-At','-v','ON_ERROR_STOP=1'],{env,input:text,encoding:'utf8',stdio:['pipe','pipe','pipe'],maxBuffer:16*1024*1024}).trim();}catch{throw Error('Selected R5 SQL operation failed; private output suppressed');}};
  const readPrivate=async relative=>{
    assert.ok(['status.private.json','AUTH-PROBE.private.json'].includes(relative),'Only selected fixture identity/config files permitted');
    const file=path.join(selection.directory,relative),entry=await lstat(file);assert.ok(entry.isFile()&&!entry.isSymbolicLink());assert.equal(entry.mode&0o777,0o600,'Private fixture file must be600');
    return JSON.parse(await readFile(file,'utf8'));
  };
  const bindingEntry=await lstat(path.join(selection.directory,'RUNTIME-BINDING.json'));assert.ok(bindingEntry.isFile()&&!bindingEntry.isSymbolicLink());assert.equal(bindingEntry.mode&0o077,0);
  const binding=JSON.parse(await readFile(path.join(selection.directory,'RUNTIME-BINDING.json'),'utf8'));
  const volume=JSON.parse(docker('volume','inspect',db))[0];
  const containers=docker('ps','-a','--format','{{.Names}}').split('\n').filter(n=>n.endsWith('_'+selection.projectId)).map(n=>JSON.parse(docker('inspect',n))[0]);
  const ledger=JSON.parse(sql("select coalesce(jsonb_agg(jsonb_build_object('version',version,'name',name,'statements',statements) order by version),'[]'::jsonb) from supabase_migrations.schema_migrations"));
  const helperInspections=Object.fromEntries(kinds.map(kind=>[kind,JSON.parse(docker('inspect',selection.helpers[kind].name))[0]]));
  const lineage=validateCareRuntime(selection,{manifest:fixture.manifest,binding,volume,containers,ledger,helperInspections,sourceHashes});
  assert.deepEqual(JSON.parse(sql('select payload from public.shelv_portal_fixture_attestation where singleton')),binding);
  // Verify actual copied source in every fresh native helper, not only a local source receipt.
  for(const kind of kinds.filter(k=>k!=='tls')) {
    const lines=docker('exec',selection.helpers[kind].name,'sha256sum',...Object.keys(sourceHashes).map(file=>'/app/'+file)).split('\n');
    assert.equal(lines.length,Object.keys(sourceHashes).length);
    for(const line of lines){const match=line.match(/^([0-9a-f]{64})\s+\/app\/(.+)$/);assert.ok(match);assert.equal(match[1],sourceHashes[match[2]],'Copied native helper source differs');}
  }
  const config=await readPrivate('status.private.json'),owner=await readPrivate('AUTH-PROBE.private.json');
  assert.equal(config.API_URL,providerOrigin);assert.equal(owner.id,selection.ownerActorId);assert.ok(owner.email.endsWith('.invalid'));
  assert.equal(sql('select owner_actor_id from concierge.plan_policy where singleton'),owner.id);assert.equal(sql('select activated from concierge.plan_policy where singleton'),'t');
  return {...fixture,selection,config,owner,sql,docker,readPrivate,lineage,sourceHashes,helpers:selection.helpers};
}
