import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as adapter from '../adapter/account-advisor-local-bindings.mjs';
import * as caller from '../caller/genuine-advisor-host.mjs';
const owner='10000000-0000-4000-8000-000000000001';
const portal='https://127.0.0.1:58630',supabase='https://127.0.0.1:58621';
const descriptor={schemaVersion:1,ownerId:owner,projectId:'sa-'+owner.replaceAll('-',''),sourceCommit:'359c6bf0c759357df648ca441e9e3d1c3d29398c',fixtureDirectory:'/synthetic/.local-artifacts/owned',privateDirectory:'/synthetic/.local-artifacts/owned/private',endpoints:{portal,supabase,mailpit:'http://127.0.0.1:58624'},actors:{a:{id:'10000000-0000-4000-8000-000000000002',email:'a@example.invalid',initialDisplayName:'SYNTHETIC A'},b:{id:'10000000-0000-4000-8000-000000000003',email:'b@example.invalid',initialDisplayName:'SYNTHETIC B'}}};
const request=(pathname,method='POST')=>({url:supabase+pathname,method});
const sha=value=>createHash('sha256').update(value).digest('hex');
test('fixed owner and viewer addresses derive from resource UUID without granting actor identity',()=>{
 assert.equal(typeof adapter.fixedAdvisorEmails,'function');
 assert.deepEqual(adapter.fixedAdvisorEmails(owner),{owner:'owner-'+owner+'@example.invalid',viewer:'viewer-'+owner+'@example.invalid'});
 assert.throws(()=>adapter.fixedAdvisorEmails('../foreign'),/UUID/);
});
for(const path of ['/advisor/plans','/advisor/clients','/advisor/plans/'+owner+'/preview','/advisor/plans/'+owner+'/review-publish','/history/versions/25','/history/versions/abc','/history/versions/-1'])test('bounded SPA document admits '+path,()=>{
 assert.equal(adapter.fixtureSpaDestination(path),true);
});
for(const path of ['/api/walkthroughs','/advisor/reviews/'+owner,'/advisor/permissions','/advisor/plans/'+owner+'/code','/history/versions/','/history/versions/1/extra','/history/versions/'+ 'a'.repeat(161),'/history/versions/%2fprivate','/unknown/path','//evil.invalid'])test('SPA refuses '+path,()=>{
 assert.equal(adapter.fixtureSpaDestination(path),false);
});
for(const path of ['/api/walkthroughs','/api/walkthroughs/anything','/api/advisor/guidance','/api/advisor/preview/photo','/api/client/checkins/photos/upload','/api/advisor/admission'])test('fixture entry refuses unapproved API '+path,()=>{
 assert.equal(adapter.fixtureApiDestination(path),false);
});
test('fixture entry retains actual advisor/client commands only',()=>{
 for(const path of ['/api/advisor/session','/api/advisor/auth/request','/api/advisor/auth/complete','/api/advisor/plans','/api/advisor/payments','/api/advisor/operations','/api/client/client-orders','/api/client/plans'])assert.equal(adapter.fixtureApiDestination(path),true,path);
});
const otp=(email,path,extra={})=>({r:request('/auth/v1/otp?redirect_to='+encodeURIComponent(portal+path)),body:Buffer.from(JSON.stringify({create_user:false,email,...extra}))});
for(const role of ['owner','viewer'])test('OTP admits only exact derived '+role+' recipient and fixed advisor destination',()=>{
 const v=otp(role+'-'+owner+'@example.invalid','/advisor/plans');
 assert.equal(adapter.localProviderTarget(v.r,descriptor,v.body),v.r.url);
});
for(const [name,email,path,extra] of [
 ['foreign advisor','owner-10000000-0000-4000-8000-000000000009@example.invalid','/advisor/plans',{}],
 ['invented descriptor advisor','advisor@example.invalid','/advisor/plans',{}],
 ['held route','owner-'+owner+'@example.invalid','/advisor/reviews/'+owner,{}],
 ['nested route','owner-'+owner+'@example.invalid','/advisor/plans/'+owner+'/preview/extra',{}],
 ['create-user','owner-'+owner+'@example.invalid','/advisor/plans',{create_user:true}],
 ['advisor recipient on client destination','owner-'+owner+'@example.invalid','/plan',{}],
 ['client recipient on advisor destination',descriptor.actors.a.email,'/advisor/plans',{}],
])test('OTP refuses '+name,()=>{const v=otp(email,path,extra);assert.throws(()=>adapter.localProviderTarget(v.r,descriptor,v.body));});
for(const [rpc,body] of [
 ['concierge_advisor_session_context',{}],['concierge_advisor_directory',{}],
 ['concierge_plan_command_v1',{p_command:{schemaVersion:1,action:'read_client_plan_v1',version:null}}],
 ['concierge_payment_view_v2',{p_client_id:descriptor.actors.a.id}],
 ['concierge_payment_write_v2',{p_client_id:descriptor.actors.a.id,p_action:'issue_quote',p_payload:{},p_expected_revision:0,p_request_id:owner}],
])test('closed actual RPC route permits '+rpc,()=>{const r=request('/rest/v1/rpc/'+rpc);assert.equal(adapter.localProviderTarget(r,descriptor,Buffer.from(JSON.stringify(body))),r.url);});
for(const [rpc,body] of [
 ['concierge_plan_command_v1',{p_command:{schemaVersion:1,action:'grant_task_v1'}}],
 ['concierge_care_command_v1',{p_command:{schemaVersion:1,action:'record_use_v1'}}],
 ['concierge_payment_write_v2',{p_action:'record_refund'}],
 ['concierge_service_write',{}],['concierge_review_command_v1',{p_command:{action:'read_client_plan_v3'}}],
])test('closed RPC action refuses '+rpc+' '+(body.p_command?.action??body.p_action??''),()=>assert.throws(()=>adapter.localProviderTarget(request('/rest/v1/rpc/'+rpc),descriptor,Buffer.from(JSON.stringify(body)))));
test('actual handler composition keeps diagnostic v1 separate and refuses held V3 service path',()=>{
 assert.equal(adapter.fixtureServiceAction('/functions/v1/concierge-plans',{schemaVersion:1,action:'read_client_plan_v1',version:null}),'diagnostic-v1');
 assert.throws(()=>adapter.fixtureServiceAction('/functions/v1/concierge-reviews',{schemaVersion:1,action:'read_client_plan_v3'}));
 assert.throws(()=>adapter.fixtureServiceAction('/functions/v1/concierge-guidance',{schemaVersion:1,action:'publish_reply_v1'}));
});
const grant=()=>({schemaVersion:1,ownerId:owner,projectId:'sa-'+owner.replaceAll('-',''),sourceCommit:descriptor.sourceCommit,sourceRoot:caller.HOST_PINS.root,fixtureDirectory:caller.HOST_PINS.root+'/.local-artifacts/synthetic-only',descriptorFile:caller.HOST_PINS.root+'/.local-artifacts/synthetic-only/DESCRIPTOR.json',adapterPath:'/synthetic/new-adapter.mjs',adapterSha256:caller.HOST_PINS.adapterSha256,executorSha256:'e'.repeat(64),dependencyRoots:[{path:caller.HOST_PINS.root+'/apps/portal/session-integration/runtime',manifestFile:'/synthetic/root-2.json',manifestSha256:'2cc3c59ca1be485a60a83b243a5d6957ffc145349025546d0d1bfeb6885beb86'}],authorization:'SYNTHETIC DATA CONTROL ONLY, NOT A RESOURCE GRANT',expiresAt:'2080-01-01T00:00:00Z',actions:['build','host','observe']});
test('caller refuses obsolete runtime manifest before dependencies/private IO',()=>{const g=grant();g.dependencyRoots[0].manifestSha256='1'.repeat(64);const bytes=Buffer.from(JSON.stringify(g));assert.throws(()=>caller.validateHostGrant(bytes,sha(bytes),g.executorSha256),/E_M04_RUNTIME_CLOSURE/);});
test('caller preserves existing external pin and exact-field refusals',()=>{
 const g=grant(),b=Buffer.from(JSON.stringify(g));assert.throws(()=>caller.validateHostGrant(b,'0'.repeat(64),g.executorSha256),/E_EXTERNAL_GRANT/);
 g.authority=true;const c=Buffer.from(JSON.stringify(g));assert.throws(()=>caller.validateHostGrant(c,sha(c),g.executorSha256),/E_FIELDS/);
});
test('new input helper refuses missing byte bindings instead of interpreting them as authority',()=>{
 assert.equal(typeof caller.preparePublicationInput,'function');
 assert.throws(()=>caller.preparePublicationInput({descriptorBytes:Buffer.from('{}')}),/E_M04_INPUT_FIELDS/);
});
test('host caller remains inert without external grant bytes',async()=>{await assert.rejects(caller.startAccountHost(),/E_EXTERNAL_GRANT/);});

test('provider default-fetch projections restore every original Root359 byte',async()=>{
 for(const name of ['upstream.ts','client-upstream.ts']){
  const relative='apps/portal/session-integration/runtime/server/'+name;
  const original=await readFile(caller.HOST_PINS.root+'/'+relative);
  const p=adapter.projectM04ProviderSource(relative,original);let restored=p.source;
  assert.equal(p.delta.length,2);
  for(const change of [...p.delta].reverse()){
   assert.equal(restored.slice(change.offset,change.offset+change.after.length),change.after);
   restored=restored.slice(0,change.offset)+change.before+restored.slice(change.offset+change.after.length);
  }
  assert.deepEqual(Buffer.from(restored),original);
  const changed=Buffer.from(original);changed[0]^=1;
  assert.throws(()=>adapter.projectM04ProviderSource(relative,changed),/exact Root359/);
 }
});
test('new source copies restore exact approved B923/3430 baselines',async()=>{
 const inverse=JSON.parse(await readFile(new URL('../receipts/FULL-EXACT-INVERSE.json',import.meta.url),'utf8'));
 for(const [key,file] of [['adapter','../adapter/account-advisor-local-bindings.mjs'],['caller','../caller/genuine-advisor-host.mjs']]){
  let source=await readFile(new URL(file,import.meta.url),'utf8');assert.equal(sha(source),inverse[key].projectedSha256);
  for(const delta of [...inverse[key].changes].reverse()){
   assert.equal(source.slice(delta.offset,delta.offset+delta.after.length),delta.after);
   source=source.slice(0,delta.offset)+delta.before+source.slice(delta.offset+delta.after.length);
  }
  assert.equal(sha(source),inverse[key].baselineSha256);
 }
});
test('fixture layout refuses an old persistence adoption before any directory read',()=>{
 assert.throws(()=>adapter.localBindingLayout({fixtureDirectory:'/synthetic',artifactDirectory:'/synthetic/account-host-code2/bundle',rollforward:{}}),/no resource adoption/);
});
test('source plan has no implicit server or handler import when queried as data',()=>{
 const sources=adapter.fixtureVirtualSources();assert.equal(typeof sources.gatewayEntry,'string');assert.equal(typeof sources.fixedHandlers,'string');
 assert.throws(()=>adapter.fixtureVirtualSources('/foreign/root'),/foreign virtual source root/);
});
