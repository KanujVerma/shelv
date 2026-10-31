import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile,unlink,mkdtemp,rename} from 'node:fs/promises';
import path from 'node:path';
import {requireCareBrowserAuthorization,validateCareBrowserApplication,careBrowserPins} from './rebuild-care-native-browser-source.mjs';
import {requireCareCustody,attestCareFixture,careNativePins} from '../scripts/rebuild-care-native-fixture.mjs';
import {connectedCareStack} from './rebuild-care-native-stack.mjs';
import {sha} from '../scripts/rebuild-native-boundary.mjs';

assert.equal(process.env.SHELV_REBUILD_CARE_BROWSER_SOURCE,'1','Pure browser guards require explicit source-only opt-in');
const workspace='/synthetic/shelv/fresh-care-browser-child';
const parentRoot='/Users/kanuj/.t3/worktrees/shelv/kanuj-portal-rebuild-integration-20261030';
const selection={format:1,purpose:'w6-care-native-r7',parentRoot,directory:parentRoot+'/.local-artifacts/portal-rebuild/canonical-plan-v1-r7',ownerId:careNativePins.fixtureOwner,projectId:careNativePins.fixtureProject,ownerActorId:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',migrationCount:57,configSha256:careNativePins.configSha256,snapshotSha256:'1'.repeat(64),ledgerSha256:'2'.repeat(64),sourceHashesSha256:'3'.repeat(64),helpers:Object.fromEntries(['plan','operations','payments','care','tls'].map((k,i)=>[k,{name:`synthetic-${k}-39f4ba79bdd5`,id:String(i+4).repeat(64),environmentSha256:'a'.repeat(64)}])),tlsImage:'nginx:1.28.0-alpine@sha256:30f1c'+'0'.repeat(59)};
const grant={format:1,parentThreadId:careNativePins.parentThreadId,purpose:'genuine-care-browser',workspace,directory:selection.directory,ownerId:selection.ownerId,projectId:selection.projectId,snapshotSha256:selection.snapshotSha256,grantId:'synthetic-native-only'};
const chromeGrant={format:1,parentThreadId:careNativePins.parentThreadId,purpose:'genuine-care-browser',workspace,grantId:'synthetic-chrome-only'};
const authorized=patch=>requireCareBrowserAuthorization({selection,grant,chromeGrant,...patch},workspace);

test('browser authorization requires separate exact native and Chrome grants; neither implies the other',()=>{
  assert.equal(authorized().purpose,'genuine-care-browser');
  for(const patch of [{chromeGrant:undefined},{grant:undefined},{grant:{...grant,purpose:'genuine-care-node'}},{chromeGrant:{...chromeGrant,purpose:'genuine-care-node'}},{chromeGrant:{...chromeGrant,workspace:'/synthetic/other'}},{chromeGrant:{...chromeGrant,parentThreadId:'other'}},{chromeGrant:{...chromeGrant,grantId:grant.grantId}},{chromeGrant:{...chromeGrant,extra:true}}])assert.throws(()=>authorized(patch));
  assert.throws(()=>requireCareBrowserAuthorization({selection,grant:{...grant,workspace:parentRoot},chromeGrant:{...chromeGrant,workspace:parentRoot}},parentRoot));
  assert.throws(()=>requireCareCustody(selection,grant,workspace),/phase-specific/,'Node remains the default phase');
});

test('attestor and care stack reject an unforwarded browser purpose before any resource access',async()=>{
  const root=path.resolve(import.meta.dirname,'../../..');
  await assert.rejects(attestCareFixture(root,selection,{...grant,workspace:root}),/phase-specific/);
  // The invalid lineage sentinel stops even historical code before acquisition. The expected
  // error identifies the earlier phase gate, so this RED cannot accidentally allocate a stack.
  await assert.rejects(connectedCareStack({selection,lineage:{migrationCount:0}},grant,workspace),/phase-specific/);
  await assert.rejects(connectedCareStack({selection,lineage:{migrationCount:0}},grant,workspace,{purpose:'genuine-care-browser'}),/0 !== 57/,'Explicit browser phase passes only the custody gate, then stops at the source sentinel');
});

test('new browser content preserves the retained descriptor and private projection, with a long synthetic routine',async()=>{
  const {careBrowserSyntheticContent}=await import('./rebuild-care-native-browser-cases.mjs');
  const {syntheticCareContent}=await import('../scripts/rebuild-care-native-cases.mjs');
  const {projectClientPlan}=await import('../../../src/contracts/PortalRebuild.ts');
  const content=careBrowserSyntheticContent(),base=syntheticCareContent();
  assert.deepEqual(content.products,base.products);assert.deepEqual(content.decisions,base.decisions);assert.equal(content.routine.length,21);
  assert.equal(content.routine.filter(r=>r.productId==='cerave-pm').length,1);
  assert.equal(content.routine.find(r=>r.productId==='cerave-pm').slotId,content.decisions[0].slotId,'Authored addition row must name its actual decision slot');
  assert.ok(content.routine.every(r=>r.schedule.automaticAdvance===false));
  for(const marker of ['W6_PRIVATE_SYNTHETIC_ONLY','PRIVATE_REAL_AUTH_CANARY']){assert.ok(JSON.stringify(content).includes(marker),'Both known private markers need an actual authorized-draft positive');assert.ok(!JSON.stringify(projectClientPlan(content)).includes(marker));}
});

test('candidate evidence binds exact clean head, all source bytes and all emitted bytes without a gateway',()=>{
  const head='b'.repeat(40),source='actual source bytes',asset=Buffer.from([0,255,1]),output=Buffer.from('actual output');
  const provenance={schemaVersion:1,candidate:true,gatewayIncluded:false,sourceHead:head,sourceDirty:false,entry:'apps/portal/src/main.tsx',template:'apps/portal/src/app/index.html',inputs:[{source:'apps/portal/src/main.tsx',bytes:Buffer.byteLength(source),sha256:sha(source)}],assets:[{source:'docs/portal-rebuild/design/asset.png',output:'assets/approved/asset.png',bytes:asset.length,sha256:sha(asset)}]};
  const declared={'application.js':output,'assets/approved/asset.png':asset,'index.html':Buffer.from('<!doctype html><html></html>'),'build-metadata.json':Buffer.from('{"fresh":"compiler"}\n'),'licenses/emitted-packages.json':Buffer.from('{"fresh":"notices"}\n'),'licenses/packages/example/LICENSE':Buffer.from('original notice'),'fonts/example.woff2':Buffer.from([0,1,2,3]),'application-provenance.json':Buffer.from(JSON.stringify(provenance,null,2)+'\n')};
  const expected={provenance:structuredClone(provenance),outputs:declared};
  const evidence={provenance,head,dirty:false,expected,outputs:{...declared}};
  assert.equal(validateCareBrowserApplication(evidence).sourceHead,head);
  for(const patch of [{head:'c'.repeat(40)},{dirty:true},{expected:undefined},{provenance:{...provenance,sourceDirty:true}},{provenance:{...provenance,gatewayIncluded:true}},{provenance:{...provenance,inputs:[{...provenance.inputs[0],sha256:sha('stale')}]}},{provenance:{...provenance,assets:[...provenance.assets,{source:'caller-extra',output:'extra.txt',bytes:1,sha256:sha('x')}]}},{outputs:{...evidence.outputs,'extra.txt':output}},{outputs:{...evidence.outputs,'_worker.js':output}}])assert.throws(()=>validateCareBrowserApplication({...evidence,...patch}));
  for(const file of Object.keys(declared)){
    assert.throws(()=>validateCareBrowserApplication({...evidence,outputs:{...declared,[file]:Buffer.from('changed')}}),'Changed HTML/meta/provenance/notices/font/asset/code must refuse');
    const missing={...declared};delete missing[file];assert.throws(()=>validateCareBrowserApplication({...evidence,outputs:missing}),'Every expected file is required');
  }
  assert.equal(careBrowserPins.applicationCommit,'18c78b7d');
});

test('historical first-slice runner is preserved; new entry has no import-time acquisition',async()=>{
  const original=await readFile(new URL('./rebuild-native-browser.mjs',import.meta.url));
  assert.equal(sha(original),'c932e3a3c2e41470f899d65bf30a22b45ef24263ed5071460d869d899a60560f');
  const {runCareBrowserProof}=await import('./rebuild-care-native-browser.mjs');
  await assert.rejects(runCareBrowserProof({selection,grant,chromeGrant:{...chromeGrant,workspace:'/synthetic/other'}}));
});

test('browser failure metadata retains a finite method and numeric assertion facts without callback or credential text',async()=>{
  const m=await import('./rebuild-care-native-browser-source.mjs');assert.equal(typeof m.careBrowserFailure,'function');
  const error=Object.assign(new Error('page.goto: https://127.0.0.1:57430/plan?code=PRIVATE_CALLBACK_VALUE'),{name:'TimeoutError',code:'PRIVATE_CREDENTIAL_VALUE',actual:'PRIVATE_ACTUAL',expected:'PRIVATE_EXPECTED'});
  const safe=m.careBrowserFailure(error);assert.deepEqual(safe,{name:'TimeoutError',method:'page.goto',code:null});assert.doesNotMatch(JSON.stringify(safe),/PRIVATE_|https:/);
});

test('SQLite observation is disabled by default and native Node; only granted care-browser enables two fixed SELECTs for existing own object IDs',async()=>{
  const m=await import('./rebuild-care-native-browser-source.mjs');assert.equal(typeof m.careBrowserStoragePlan,'function');assert.equal(typeof m.careBrowserDatabaseId,'function');
  assert.equal(m.careBrowserStoragePlan().enabled,false);assert.equal(m.careBrowserStoragePlan({care:true,purpose:'genuine-care-node'}).enabled,false);
  const options={care:true,purpose:'genuine-care-browser',selection,grant,workspace},plan=m.careBrowserStoragePlan(options);
  assert.equal(plan.enabled,true);assert.equal(plan.script,'vault');assert.equal(plan.className,'AdvisorSessionObject');assert.deepEqual(plan.queries,["SELECT name FROM sqlite_master WHERE type='table' AND name='session_record'",'SELECT json FROM session_record']);assert.equal(Object.isFrozen(plan.queries),true);
  for(const patch of [{care:false},{grant:undefined},{grant:{...grant,purpose:'genuine-care-node'}},{workspace:parentRoot}])assert.throws(()=>m.careBrowserStoragePlan({...options,...patch}));
  const dir='/synthetic/owned-stack',actor=dir+'/resources/do/vault-AdvisorSessionObject/'+'f'.repeat(64)+'.sqlite',metadata=dir+'/resources/do/vault-AdvisorSessionObject/metadata.sqlite',cache=dir+'/resources/cache/miniflare-CacheObject/metadata.sqlite',files=[actor,metadata,cache];
  assert.equal(m.careBrowserDatabaseId(actor,dir,files),'f'.repeat(64));assert.equal(m.careBrowserDatabaseId(metadata,dir,files),null);assert.equal(m.careBrowserDatabaseId(cache,dir,files),null);
  assert.throws(()=>m.careBrowserDatabaseId(actor,dir,[]));assert.throws(()=>m.careBrowserDatabaseId('/foreign/'+path.basename(actor),dir,files));const unknown=dir+'/resources/do/vault-AdvisorSessionObject/unknown.sqlite';assert.throws(()=>m.careBrowserDatabaseId(unknown,dir,[...files,unknown]));
});

// Explicit source-only real-files opt-in. No browser, Miniflare, fixture or Auth.
// The caller must first build the current committed clean application candidate.
if(process.env.SHELV_REBUILD_CARE_BROWSER_CORRESPONDENCE==='1') {
  const {attestCareBrowserApplication}=await import('./rebuild-care-native-browser-source.mjs');
  const directory=path.resolve(import.meta.dirname,'../../../.local-artifacts/portal-rebuild/application'),sourceArea=path.resolve(import.meta.dirname,'../../../.local-artifacts/portal-rebuild/w6-care-native-browser-r7/source');
  let baseline;
  await test('real source correspondence accepts exactly the clean declared83-file candidate',async()=>{baseline=await attestCareBrowserApplication();assert.equal(Object.keys(baseline.outputs).length,83);assert.equal(baseline.sourceDirty,false);assert.equal(baseline.gatewayIncluded,false);});
  assert.ok(baseline,'Positive clean baseline is required before tamper sensitivity');
  const critical=['index.html','build-metadata.json','application-provenance.json','licenses/emitted-packages.json',Object.keys(baseline.outputs).find(p=>p.startsWith('licenses/packages/')),Object.keys(baseline.outputs).find(p=>p.startsWith('fonts/')&&p.endsWith('.woff2')),Object.keys(baseline.outputs).find(p=>p.startsWith('assets/approved/')),'application.js'];
  assert.ok(critical.every(Boolean));
  for(const relative of critical) {
    await test('real source correspondence refuses changed '+relative,async()=>{const file=path.join(directory,relative),original=await readFile(file);try{await writeFile(file,Buffer.concat([original,Buffer.from('\nOWN SOURCE-ONLY BYTE TAMPER\n')]));await assert.rejects(attestCareBrowserApplication());}finally{await writeFile(file,original);}});
    await test('real source correspondence refuses missing '+relative,async()=>{const file=path.join(directory,relative),holding=await mkdtemp(path.join(sourceArea,'cs1-held-')),saved=path.join(holding,'original');await rename(file,saved);try{await assert.rejects(attestCareBrowserApplication());}finally{await rename(saved,file);}});
  }
  await test('real source correspondence refuses an ignored extra without trusting directory inventory',async()=>{const extra=path.join(directory,'own-cs1-extra.txt');let created=false;try{await writeFile(extra,'OWN EXTRA OUTPUT, NO PRIVATE DATA\n',{flag:'wx'});created=true;await assert.rejects(attestCareBrowserApplication());}finally{if(created)await unlink(extra);}});
  await test('real source correspondence refuses self-declared extra provenance input/asset',async()=>{const file=path.join(directory,'application-provenance.json'),original=await readFile(file),value=JSON.parse(original);value.inputs.push({source:'docs/portal-rebuild/README.md',bytes:1,sha256:sha('x')});value.assets.push({source:'docs/portal-rebuild/README.md',output:'caller-added.txt',bytes:1,sha256:sha('x')});try{await writeFile(file,JSON.stringify(value,null,2)+'\n');await assert.rejects(attestCareBrowserApplication());}finally{await writeFile(file,original);}});
  await test('real source correspondence restores the exact clean output digest set after all probes',async()=>{const after=await attestCareBrowserApplication();assert.deepEqual(after.outputs,baseline.outputs);assert.equal(after.provenanceSha256,baseline.provenanceSha256);});
}
