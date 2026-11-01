// Source-only bridge controls: actual session/rawReview/Root/hydrator, no DOM or fake app port.
import test from 'node:test';import assert from 'node:assert/strict';
import {createManifestObservation,manifestBasis,manifestInstance,manifestAccepted} from './rebuild-plan-guidance-manifest-observation.ts';
import {createApplicationSession} from '../src/app/session.ts';
import {createClientReviewRequest} from '../src/app/review-request.ts';
import {createClientPlanController} from '../src/app/client-state.ts';
import {createClientGuidancePort} from '../src/features/plan/guidancePort.ts';
import {createGuidanceHydrator} from '../src/features/plan/guidanceHydration.ts';
import {productInstructionScopes} from '../src/features/plan/guidancePresentation.ts';
import {GuidanceHttpFixture,largeGuidanceData} from './rebuild-plan-guidance-browser-fixture.mjs';
import {cursor,manifestPage} from './rebuild-plan-guidance-fixture.mjs';
import {mapReviewResult} from '../../../src/contracts/PortalReviewMapping.ts';
async function setup(t){
 const server=new GuidanceHttpFixture(largeGuidanceData());server.pageSize=100;const calls=[],work=[],hydrators=[];
 const runtime=createApplicationSession({audience:'client',locks:{request:async(_n,_o,run)=>run()},fetcher:async(url,init)=>{if(url==='/api/client/session')return Response.json(server.login);assert.equal(url,'/api/client/reviews');assert.equal(new Headers(init.headers).get('x-shelv-csrf'),server.login.csrf);const c=JSON.parse(init.body);calls.push(c);const r=await server.respond(c,calls,url);return Response.json(r.json,{status:r.status??200});}});await runtime.restore();const session=runtime.getSnapshot().boundary;
 const review=createClientGuidancePort({request:createClientReviewRequest(runtime),session,mode:'client'}),controller=createClientPlanController(session,{review},{readVersion:3});await controller.refresh();const view=controller.getSnapshot().view;
 let scope='/plan?routine=morning';const summaries=[],store=createManifestObservation(()=>({view:controller.getSnapshot().view,session:runtime.getSnapshot().boundary,scope}),s=>summaries.push(s));
 function instance(){const h=createGuidanceHydrator({view,session,mode:'client',port:review});hydrators.push(h);return h;}
 const h=instance(),props={view,session,mode:'client'},context={props,hydrator:h},cleanup=store.commit(context,scope);
 t.after(async()=>{server.release();await Promise.allSettled(work);cleanup();hydrators.forEach(h=>h.dispose());controller.dispose();runtime.dispose();});
 return{server,calls,runtime,session,controller,view,review,h,props,context,store,summaries,cleanup,instance,scope(value){scope=value;},get path(){return scope;},run(h,scopes=[]){const p=h.observe(scopes);work.push(p);return p;}};
}
test('same-instance bridge remains incomplete behind terminal26, then accepts actual Root state before51 details',async t=>{
 const f=await setup(t),gate=f.server.hold('read_client_instruction_manifest_v1',{predicate:c=>c.cursor===cursor(2500)}),read=f.run(f.h);await gate.entered;
 const initial=f.store.read();assert.equal(initial.phase,'manifest');assert.equal(initial.manifestCount,null);assert.ok(Object.isFrozen(initial));assert.equal('hydrator' in initial,false);assert.equal('ready' in initial,false);assert.equal('retry' in initial,false);
 const basis=manifestBasis(initial),instance=manifestInstance(initial,basis);assert.ok(instance);assert.equal(manifestAccepted(initial,instance),false);assert.equal(f.calls.filter(c=>c.action==='read_client_instruction_v1').length,0);
 const same=f.run(f.h);assert.equal(f.calls.filter(c=>c.action==='read_client_instruction_manifest_v1'&&c.cursor===null).length,1);gate.release();await read;await same;
 const accepted=f.store.read();assert.equal(accepted.instanceId,instance.instanceId);assert.equal(accepted.phase,'ready');assert.equal(accepted.manifestCount,2550);assert.ok(manifestAccepted(accepted,instance));assert.equal(accepted.detailCount,0);assert.ok(f.summaries.some(s=>s.phase==='ready'&&s.manifestCount===2550));
 const held=f.server.hold('read_client_instruction_v1',{all:true}),scopes=productInstructionScopes(f.view,'product-0'),details=f.run(f.h,scopes);await held.entered;assert.equal(f.store.read().manifestCount,2550);assert.ok(scopes.some(s=>f.h.scope(s).state==='pending'));held.release();await details;
 const ids=f.calls.filter(c=>c.action==='read_client_instruction_v1').map(c=>c.instructionId);assert.equal(new Set(ids).size,51);assert.ok(ids.length<100);assert.equal(f.calls.filter(c=>c.action==='read_client_instruction_manifest_v1').length,26);assert.ok(f.server.maxDetailActive<=3);assert.equal(f.view.use.planProducts.length,50);assert.ok(f.view.use.planProducts.every(p=>p.state==='paused'));
});
test('discarded/uncommitted context cannot publish; replacement and obsolete cleanup preserve the new committed owner',async t=>{
 const f=await setup(t);await f.run(f.h);const old=manifestInstance(f.store.read(),manifestBasis(f.store.read()));assert.ok(old);f.cleanup();assert.equal(f.store.read().lifecycle,'disposed');assert.throws(()=>manifestAccepted(f.store.read(),old),/disposed|changed|replaced/);
 const replacement=f.instance();assert.equal(f.store.read().lifecycle,'disposed','creation/render alone must not publish');const cleanup=f.store.commit({...f.context,hydrator:replacement},f.path);const next=manifestInstance(f.store.read(),manifestBasis(f.store.read()));assert.ok(next);assert.notEqual(next.instanceId,old.instanceId);f.cleanup();assert.equal(f.store.read().instanceId,next.instanceId);assert.throws(()=>manifestAccepted(f.store.read(),old),/changed|replaced/);await f.run(replacement);assert.ok(manifestAccepted(f.store.read(),next));cleanup();
});
test('current view/scope/mode/retirement changes refuse previously accepted summaries',async t=>{
 const f=await setup(t);await f.run(f.h);const captured=manifestInstance(f.store.read(),manifestBasis(f.store.read()));assert.ok(captured);
 f.scope('/plan?routine=evening');assert.equal(f.store.read().lifecycle,'mismatch');assert.throws(()=>manifestAccepted(f.store.read(),captured),/scope|changed|mismatch/);f.scope('/plan?routine=morning');
 f.controller.accept({...f.view});assert.equal(f.store.read().lifecycle,'mismatch');assert.throws(()=>manifestAccepted(f.store.read(),captured),/changed|mismatch/);f.controller.accept(f.view);
 const stop=f.store.commit({props:{...f.props,mode:'historical'},hydrator:f.h},f.path);assert.equal(f.store.read().lifecycle,'mismatch');stop();f.store.commit(f.context,f.path);f.h.dispose();assert.equal(f.store.read().lifecycle,'retired');assert.throws(()=>manifestAccepted(f.store.read(),captured),/retired|changed|replaced/);
});
for(const status of [401,403])test('bridge never accepts known HTTP'+status+' or issues a fallback/action',async t=>{
 const f=await setup(t),initial=manifestInstance(f.store.read(),manifestBasis(f.store.read()));assert.ok(initial);f.server.override('read_client_instruction_manifest_v1',()=>({status,json:{code:status===401?'session_ended':'forbidden'}}),{once:true});await f.run(f.h);const summary=f.store.read();assert.equal(summary.manifestCount,null);assert.throws(()=>manifestAccepted(summary,initial));assert.ok(f.calls.every(c=>['read_client_plan_v3','read_client_instruction_manifest_v1'].includes(c.action)));
});
test('well-shaped terminal HTTP200 is refused until aggregate Root collection succeeds',async t=>{
 const f=await setup(t),initial=manifestInstance(f.store.read(),manifestBasis(f.store.read()));assert.ok(initial);f.server.override('read_client_instruction_manifest_v1',c=>{if(c.cursor!==cursor(2500))return;const page=manifestPage(f.view,f.server.currentDetails(c.snapshot).map(d=>d.item).slice(2500,2549),c.cursor,null);mapReviewResult(page,c);return{json:page};});await f.run(f.h);const s=f.store.read();assert.equal(s.phase,'error');assert.equal(s.error,503);assert.equal(s.manifestCount,null);assert.throws(()=>manifestAccepted(s,initial));
});
