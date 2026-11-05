import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import ts from 'typescript';
import {fixture, ids, stamp} from './rebuild/advisor-fixture.mjs';
import {mayaPlan} from './rebuild/plan-fixture.mjs';
import * as model from './rebuild-app-browser-model.mjs';
import {createApplicationSession} from '../src/app/session.ts';
import {createClientComposition} from '../src/app/client-composition.ts';
import {mapReviewResult} from '../../../src/contracts/PortalReviewMapping.ts';
import {instructionScopes} from '../../../src/contracts/PortalReviewMapping.ts';
import {readReviewCommand} from '../../../src/contracts/PortalReviewValidation.ts';
import {mapCareResult} from '../../../src/contracts/PortalCareMapping.ts';
import {readCareCommand} from '../../../src/contracts/PortalCareValidation.ts';
import {createGuidanceHydrator} from '../src/features/plan/guidanceHydration.ts';
import {createGuidanceDecisionController} from '../src/features/plan/guidanceDecision.ts';
import {publicationDeliveryReadUnavailable} from './helpers/publication-notification-fixture.mjs';

// Read and execute ONLY the actual state() and context.route callback ASTs.
// No module import means no before/after hook, build, Chrome, DOM or listener.
// This replaces only the HTTP request/Response boundary, never a business port.
const source = await readFile(new URL('./rebuild-app-browser.test.mjs', import.meta.url), 'utf8');
function router(text) {
  const ast = ts.createSourceFile('fixture.mjs', text, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const state = ast.statements.find(n => ts.isFunctionDeclaration(n) && n.name?.text === 'state');
  let callback;
  function visit(n) {
    if (ts.isCallExpression(n) && n.expression.getText(ast) === 'context.route') callback = n.arguments[1];
    ts.forEachChild(n, visit);
  }
  visit(ast);
  assert.ok(state && callback && ts.isArrowFunction(callback), 'exact finite HTTP router must exist');
  const deps = {assert, path, fixture, ids, stamp, mayaPlan, publicationDeliveryReadUnavailable, origin:'https://shelv-app.invalid', ...model};
  return new Function(...Object.keys(deps), `return {state:${state.getText(ast)},handle:(s,unexpected)=>${callback.getText(ast)}}`)(...Object.values(deps));
}
const actual = router(source);
async function session(t, s=actual.state()) {
  const unexpected = [], handle = actual.handle(s, unexpected);
  const send=async(url, init={})=>handle({request:()=>({url:()=>new URL(url, 'https://shelv-app.invalid').href,method:()=>init.method??'GET',postDataJSON:()=>JSON.parse(init.body),headers:()=>Object.fromEntries(new Headers(init.headers))}),fulfill:({json,status=200})=>Response.json(json,{status}),abort:()=>{throw Error('unexpected finite HTTP request');}});
  const runtime = createApplicationSession({audience:'client',locks:{request:async(_n,_o,run)=>run()},fetcher:async(url, init={}) => {
    const headers = new Headers(init.headers);
    if (init.method === 'POST' && !url.endsWith('/auth/complete')) assert.equal(headers.get('x-shelv-csrf'), s.csrf);
    if (init.method === 'POST') {
      assert.equal(init.credentials, 'same-origin');
      assert.equal(init.cache, 'no-store');
      assert.equal(init.redirect, 'error');
    }
    return send(url,init);
  }});
  await runtime.restore();
  const c = createClientComposition(runtime);
  t.after(()=>{c.dispose();runtime.dispose();});
  return {runtime,c,s,unexpected,send};
}
test('actual default App session reaches the browser HTTP fixture using Review V3, without legacy fallback', async t => {
  const f=await session(t);
  await f.c.controller.refresh();
  assert.deepEqual(f.unexpected, []);
  const v=f.c.controller.getSnapshot().view;
  assert.equal(v?.schemaVersion, 3);
  assert.equal(f.c.controller.getSnapshot().error, null);
  assert.deepEqual(f.s.calls.filter(c=>c.command).map(c=>[c.endpoint,c.command.action]), [['reviews','read_client_plan_v3']]);
  assert.deepEqual(mapReviewResult(v,{schemaVersion:1,action:'read_client_plan_v3',version:null}),v);
});

async function decision(t,f) {
  await f.c.controller.refresh();
  const view=f.c.controller.getSnapshot().view,session=f.runtime.getSnapshot().boundary;
  assert.equal(view?.schemaVersion,3);
  const hydrator=createGuidanceHydrator({view,session,mode:'client',port:f.c.ports.review});
  t.after(()=>hydrator.dispose());
  await hydrator.load(instructionScopes(view));
  assert.equal(hydrator.getSnapshot().phase,'ready');
  assert.deepEqual(hydrator.getSnapshot().manifest,[]);
  const controller=createGuidanceDecisionController({view,decision:view.plan.content.decisions.find(d=>d.id==='maya-card-treatments'),session,mode:'client',port:f.c.ports.review,scope:{token:{},epoch:0},ready:()=>hydrator.getSnapshot().phase==='ready',onViewChange:f.c.controller.acceptFrom(view)});
  t.after(()=>controller.dispose());
  return {controller,view};
}
test('actual guidance controller records one snapshot-bound choice then rereads V3 twice total, without Start or finance',async t=>{
  const f=await session(t),d=await decision(t,f);
  await d.controller.submit('approved',null);
  assert.equal(d.controller.getSnapshot().phase,'saved');
  assert.deepEqual(f.unexpected,[]);
  assert.deepEqual(f.s.calls.filter(c=>c.command).map(c=>c.command.action),['read_client_plan_v3','record_decision_v2','read_client_plan_v3']);
  const v=f.c.controller.getSnapshot().view,c=f.s.calls.find(c=>c.command?.action==='record_decision_v2').command;
  readReviewCommand(c);
  assert.equal(f.s.review.decisions.size,1);
  assert.equal(v.decisionRevision,1);
  assert.deepEqual(v.decisions,[{decisionId:c.decisionId,choice:'approved',reason:null}]);
  assert.deepEqual(v.decisionGuidance,[{decisionId:c.decisionId,recordedDecisionRevision:1,acceptedSnapshot:d.view.currentGuidance.snapshot,basisStatus:'current'}]);
  assert.deepEqual(v.actualUse,[]);
  assert.ok(v.use.planProducts.every(p=>p.state==='not_reported'&&p.originalStart.state==='unknown'));
  assert.equal(f.s.calls.some(c=>/start|payment|publish|notification/.test(c.command?.action??'')),false);
});
test('finite choice ledger supports exact idempotency/status but rejects altered UUID reuse, stale snapshot and unknown decision',async t=>{
  const f=await session(t);await f.c.controller.refresh();
  const v=f.c.controller.getSnapshot().view;
  const c=readReviewCommand({schemaVersion:1,action:'record_decision_v2',requestId:ids.event,expectedDecisionRevision:0,publicationVersion:v.plan.version,decisionId:'maya-card-treatments',choice:'deferred',reason:'SYNTHETIC reason',snapshot:v.currentGuidance.snapshot});
  const receipt=await f.c.ports.review.execute(c);
  assert.deepEqual(mapReviewResult(receipt,c),receipt);
  assert.deepEqual(await f.c.ports.review.execute(c),receipt);
  assert.equal(f.s.view.decisionRevision,1);
  assert.deepEqual(await f.c.ports.review.execute({schemaVersion:1,action:'request_status_v1',requestId:c.requestId}),{status:'committed',receipt});
  assert.deepEqual(await f.c.ports.review.execute({schemaVersion:1,action:'request_status_v1',requestId:ids.other}),{status:'absent'});
  await assert.rejects(f.c.ports.review.execute({...c,reason:'changed'}),e=>e.status===409);
  await assert.rejects(f.c.ports.review.execute({...c,requestId:ids.other}),e=>e.status===409);
  await f.c.controller.refresh();
  const snapshot=f.c.controller.getSnapshot().view.currentGuidance.snapshot;
  await assert.rejects(f.c.ports.review.execute({...c,requestId:ids.other,expectedDecisionRevision:1,decisionId:'undeclared-decision',snapshot}),e=>e.status===404);
  const stop=readCareCommand({schemaVersion:1,action:'report_product_use_v1',requestId:ids.other,expectedUseRevision:0,product:{kind:'plan_product',publication:{version:1,documentSchemaVersion:3},productId:'cerave-pm',slotId:null},change:{kind:'stopped',details:'SYNTHETIC changed care basis'},occurredOn:{state:'unknown'},channel:'portal',sourcePublication:{version:1,documentSchemaVersion:3},acquisition:'unknown',identityEventId:null});
  await f.c.ports.care.execute(stop);await f.c.controller.refresh();
  const changed=f.c.controller.getSnapshot().view;
  assert.equal(changed.decisionGuidance[0].basisStatus,'stale');
  assert.deepEqual(changed.decisionGuidance[0].acceptedSnapshot,c.snapshot);
  assert.equal(changed.currentGuidance.snapshot.useHead,1);
  await assert.rejects(f.c.ports.review.execute({...c,requestId:ids.quote,expectedDecisionRevision:1,snapshot}),e=>e.status===409);
  assert.deepEqual(await f.c.ports.review.execute({schemaVersion:1,action:'request_status_v1',requestId:c.requestId}),{status:'committed',receipt});
  const forged=structuredClone(receipt);forged.snapshot.manifestHash='f'.repeat(64);
  assert.throws(()=>mapReviewResult(forged,c));
  assert.deepEqual(f.unexpected,[]);
});

test('current HTTP DTO retains exact Maya content/publication, zero-ledger facts and strict private/current/head rejection',async t=>{
  const f=await session(t);await f.c.controller.refresh();const v=f.c.controller.getSnapshot().view;
  assert.deepEqual(v.plan,f.s.view.plan);assert.deepEqual(v.actualUse,[]);
  assert.equal(v.plan.publishedAt,'2026-10-20T12:00:00Z');
  assert.deepEqual(v.currentGuidance.snapshot.publication,{version:1,documentSchemaVersion:3});
  assert.deepEqual(v.currentGuidance.snapshot.currentPublication,v.currentGuidance.snapshot.publication);
  assert.deepEqual([v.currentGuidance.snapshot.useHead,v.currentGuidance.snapshot.reportHead,v.currentGuidance.snapshot.instructionHead,v.currentGuidance.snapshot.serviceRevision,v.currentGuidance.snapshot.decisionRevision],[0,0,0,0,0]);
  assert.equal(v.currentGuidance.snapshot.asOfDay,'2026-11-01');
  assert.equal(v.currentGuidance.instructionCount,0);assert.equal(v.latestPublicReview,null);
  const command={schemaVersion:1,action:'read_client_plan_v3',version:null};
  for(const mutate of [x=>x.privateNote='SYNTHETIC-private',x=>x.currentGuidance.snapshot.useHead++,x=>x.currentGuidance.snapshot.currentPublication.version=0,x=>x.plan.content.context.facts.push({id:'private',kind:'advisor_conclusion',visibility:'advisor',text:'SYNTHETIC-private',sources:[],contradicts:[]})]){
    const bad=structuredClone(v);mutate(bad);assert.throws(()=>mapReviewResult(bad,command));
  }
  const selected=await f.c.ports.review.execute({...command,version:1});assert.deepEqual(selected,v);
  await assert.rejects(f.c.ports.review.execute({...command,version:2}),e=>e.status===404);
  assert.deepEqual(f.unexpected,[]);
});
test('preparation and read-only HTTP projections remain truthful and never acquire care/choice writes',async t=>{
  for(const access of ['preparation','read_only']){
    const s=actual.state();s.view.access=access;
    if(access==='preparation')s.view={schemaVersion:1,access,plan:null,decisionRevision:0,decisions:[],actualUse:[],nextReviewOn:null};
    const f=await session(t,s);await f.c.controller.refresh();const v=f.c.controller.getSnapshot().view;
    assert.equal(v.access,access);assert.equal(f.c.controller.getSnapshot().error,null);
    if(access==='preparation'){assert.equal(v.plan,null);assert.equal(v.currentGuidance,null);assert.deepEqual(v.use.planProducts,[]);}
    else{
      const d=await decision(t,f);await d.controller.submit('approved',null);
      assert.equal(s.review.decisions.size,0);
    }
    assert.ok(s.calls.every(c=>!c.command||c.command.action==='read_client_plan_v3'));assert.deepEqual(f.unexpected,[]);
  }
});
test('original stop command/receipt persists in the current V3 read after a new actual composition; unknown Start stays unknown',async t=>{
  const s=actual.state(),f=await session(t,s);await f.c.controller.refresh();const original=f.c.controller.getSnapshot().view;
  const command=readCareCommand({schemaVersion:1,action:'report_product_use_v1',requestId:ids.event,expectedUseRevision:0,
    product:{kind:'plan_product',publication:{version:1,documentSchemaVersion:3},productId:'cerave-pm',slotId:null},
    change:{kind:'stopped',details:'synthetic actual-app stop note'},occurredOn:{state:'unknown'},channel:'portal',sourcePublication:{version:1,documentSchemaVersion:3},acquisition:'unknown',identityEventId:null});
  const receipt=await f.c.ports.care.execute(command);assert.deepEqual(mapCareResult(receipt,command),receipt);
  f.c.dispose();const reloaded=createClientComposition(f.runtime);t.after(()=>reloaded.dispose());await reloaded.controller.refresh();
  const next=reloaded.controller.getSnapshot().view,p=next.use.planProducts.find(p=>p.product.productId==='cerave-pm');
  assert.equal(p.state,'stopped');assert.deepEqual(p.originalStart,{state:'unknown'});
  assert.equal(p.latestEvent.eventId,command.requestId);assert.deepEqual(p.latestEvent.occurredOn,{state:'unknown'});
  assert.equal(p.latestEvent.reportedBy,ids.actor);assert.equal(p.latestEvent.recordedBy,ids.actor);
  assert.deepEqual(p.latestEvent.sourcePublication,command.sourcePublication);
  assert.equal(next.currentGuidance.snapshot.useHead,1);
  assert.notEqual(next.currentGuidance.snapshot.manifestHash,original.currentGuidance.snapshot.manifestHash);
  assert.deepEqual(next.plan,original.plan);assert.deepEqual(s.view.actualUse,[]);
  assert.deepEqual(s.calls.filter(c=>c.command).map(c=>[c.endpoint,c.command.action]),[['reviews','read_client_plan_v3'],['care','report_product_use_v1'],['reviews','read_client_plan_v3']]);
  assert.deepEqual(f.unexpected,[]);
});
for(const status of [403,409,503])test(`current read ${status} preserves honest cookie recovery and consumes only the original failed attempt`,async t=>{
  const s=actual.state();s.failure=status;const f=await session(t,s);await f.c.controller.refresh();
  assert.equal(f.c.controller.getSnapshot().error,status);assert.equal(f.c.controller.getSnapshot().view,null);
  assert.equal(s.calls.filter(c=>c.command).length,1);s.failure=0;
  if(status===503){assert.equal(f.runtime.cookie.status,'offline');await f.c.controller.refresh();assert.equal(s.calls.filter(c=>c.command).length,1);await f.runtime.restore();}
  await f.c.controller.refresh();assert.equal(f.c.controller.getSnapshot().view.schemaVersion,3);assert.equal(f.runtime.cookie.status,'ready');
  assert.deepEqual(s.calls.filter(c=>c.command).map(c=>c.command.action),['read_client_plan_v3','read_client_plan_v3']);assert.deepEqual(f.unexpected,[]);
});
test('actual held V3 read after logout cannot restore private data or a retired composition',async t=>{
  const s=actual.state();s.hold=true;const f=await session(t,s),pending=f.c.controller.refresh();
  await new Promise(setImmediate);assert.equal(typeof s.release,'function');
  await f.runtime.signOut();s.release();await pending;
  assert.equal(f.c.controller.getSnapshot().view,null);assert.equal(f.c.controller.getSnapshot().ended,true);
  assert.equal(s.signedIn,false);assert.deepEqual(f.unexpected,[]);
});
test('actual caller abort before/after HTTP dispatch rejects late V3 success without forcing offline',async t=>{
  const s=actual.state(),f=await session(t,s),command={schemaVersion:1,action:'read_client_plan_v3',version:null};
  const early=new AbortController();early.abort();await assert.rejects(f.c.ports.review.execute(command,{signal:early.signal}),e=>e.status===503);
  assert.equal(s.calls.filter(c=>c.command).length,0);
  s.hold=true;const late=new AbortController(),pending=f.c.ports.review.execute(command,{signal:late.signal});
  const rejected=assert.rejects(pending,e=>e.status===503);await new Promise(setImmediate);assert.equal(typeof s.release,'function');late.abort();s.release();await rejected;
  assert.equal(f.runtime.cookie.status,'ready');assert.equal(s.calls.filter(c=>c.command).length,1);assert.deepEqual(f.unexpected,[]);
});
test('legacy Plan V1/Care V2 positives stay separate from the default current App wire',async t=>{
  const f=await session(t),read={schemaVersion:1,action:'read_client_plan_v1',version:null};
  assert.equal((await f.c.ports.read.execute(read)).schemaVersion,1);
  assert.equal((await f.c.ports.care.execute({...read,action:'read_client_plan_v2'})).schemaVersion,2);
  await f.c.ports.decision.execute({schemaVersion:1,action:'record_decision_v1',requestId:ids.event,expectedDecisionRevision:0,publicationVersion:1,decisionId:'maya-card-treatments',choice:'deferred',reason:null});
  await f.c.controller.refresh();assert.equal(f.c.controller.getSnapshot().view.decisionGuidance[0].basisStatus,'legacy_unbound');
  assert.deepEqual(f.s.view.actualUse,[]);assert.deepEqual(f.unexpected,[]);
});
test('selectors/extra authority are rejected before egress and unknown action/audience/origin/channel remain unexpected',async t=>{
  const f=await session(t),command={schemaVersion:1,action:'read_client_plan_v3',version:null},count=f.s.calls.length;
  for(const field of ['ownerId','clientId','approved','authorization'])await assert.rejects(f.c.ports.review.execute({...command,[field]:'SYNTHETIC-forged'}),e=>e.status===400);
  await assert.rejects(f.c.ports.review.execute({...command,action:'read_advisor_publication_v3',clientId:ids.client}),e=>e.status===403);
  assert.equal(f.s.calls.length,count);
  for(const [url,action] of [['/api/client/reviews','unknown_action'],['/api/advisor/reviews','read_client_plan_v3'],['/api/task/reviews','read_client_plan_v3'],['https://external.invalid/api/client/reviews','read_client_plan_v3'],['/api/client/unexpected','read_client_plan_v3']]){
    await assert.rejects(f.send(url,{method:'POST',body:JSON.stringify({...command,action})}),/unexpected finite HTTP request/);
  }
  assert.deepEqual(f.unexpected,['POST /api/client/reviews unknown_action','POST /api/advisor/reviews read_client_plan_v3','unknown audience','POST /api/client/reviews','POST /api/client/unexpected read_client_plan_v3']);
});
