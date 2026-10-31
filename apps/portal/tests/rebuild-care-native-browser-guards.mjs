import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
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
  assert.ok(content.routine.every(r=>r.schedule.automaticAdvance===false));
  for(const marker of ['W6_PRIVATE_SYNTHETIC_ONLY','PRIVATE_REAL_AUTH_CANARY']){assert.ok(JSON.stringify(content).includes(marker),'Both known private markers need an actual authorized-draft positive');assert.ok(!JSON.stringify(projectClientPlan(content)).includes(marker));}
});

test('candidate evidence binds exact clean head, all source bytes and all emitted bytes without a gateway',()=>{
  const head='b'.repeat(40),source='actual source bytes',asset=Buffer.from([0,255,1]),output=Buffer.from('actual output');
  const provenance={schemaVersion:1,candidate:true,gatewayIncluded:false,sourceHead:head,sourceDirty:false,entry:'apps/portal/src/main.tsx',template:'apps/portal/src/app/index.html',inputs:[{source:'apps/portal/src/main.tsx',bytes:Buffer.byteLength(source),sha256:sha(source)}],assets:[{source:'docs/portal-rebuild/design/asset.png',output:'assets/approved/asset.png',bytes:asset.length,sha256:sha(asset)}]};
  const evidence={provenance,head,dirty:false,inputs:{'apps/portal/src/main.tsx':Buffer.from(source),'docs/portal-rebuild/design/asset.png':asset},outputs:{'application.js':output,'assets/approved/asset.png':asset}};
  assert.equal(validateCareBrowserApplication(evidence).sourceHead,head);
  for(const patch of [{head:'c'.repeat(40)},{dirty:true},{provenance:{...provenance,sourceDirty:true}},{provenance:{...provenance,gatewayIncluded:true}},{inputs:{...evidence.inputs,'apps/portal/src/main.tsx':Buffer.from('stale')}},{outputs:{...evidence.outputs,'assets/approved/asset.png':Buffer.from('stale')}},{outputs:{...evidence.outputs,'_worker.js':output}}])assert.throws(()=>validateCareBrowserApplication({...evidence,...patch}));
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
