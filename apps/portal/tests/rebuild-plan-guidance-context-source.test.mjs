import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdir,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createClientGuidancePort} from '../src/features/plan/guidancePort.ts';
import {createClientReviewRequest} from '../src/app/review-request.ts';
import {createClientPlanController} from '../src/app/client-state.ts';
import {createClientPorts} from '../src/app/ports.ts';
import {createGuidanceHydrator} from '../src/features/plan/guidanceHydration.ts';
import {decisionInstructionScopes,decisionGuidanceReady} from '../src/features/plan/guidancePresentation.ts';
import {guidancePlan,finiteSession,deferred} from './rebuild-plan-guidance-fixture.mjs';
import {summary,uid} from './rebuild/care-fixture.mjs';
import {readCurrentPlan} from '../src/features/plan/care.ts';
const output=new URL('../../../.local-artifacts/portal-rebuild/w3-v3-guidance-g1g2/context-source.cjs',import.meta.url);
await mkdir(new URL('.',output),{recursive:true});
const baselineRef='c4d5a9e0ed86c2ca703f6e5d0ac73988a4f6af77';
const baseline=process.env.W3_GUIDANCE_CONTEXT_BASELINE==='1';
await build({absWorkingDir:new URL('..',import.meta.url).pathname,entryPoints:['tests/rebuild-plan-guidance-context-source.tsx'],outfile:output.pathname,tsconfig:'tsconfig.frontend.json',platform:'node',format:'cjs',bundle:true,loader:{'.css':'empty'},plugins:baseline?[{name:'exact-frozen-context-inputs',setup(b){b.onLoad({filter:/features\/plan\/(ClientPlan\.tsx|guidanceDecision\.ts)$/},args=>({contents:execFileSync('git',['show',baselineRef+':'+args.path.slice(new URL('../../../',import.meta.url).pathname.length)],{encoding:'utf8'}),loader:args.path.endsWith('tsx')?'tsx':'ts'}));}}]:[]});
const {renderFeature,createGuidanceDecisionController}=(await import(pathToFileURL(output.pathname))).default;
const route={name:'recommendation',decisionId:'maya-card-treatments',routine:'evening'};
async function setup(t){
 let serverView=guidancePlan(),mode='client',engine,hydrator,scope={token:{},epoch:0},writeHold=null,readHold=null,readError=null,writeError=null;
 const writes=[],applied=[],receipts=[];
 const f=await finiteSession(t,{respond:async c=>{
  if(c.action==='read_client_plan_v3'){if(readHold){const held=readHold;readHold=null;held.entered.resolve();await held.release.promise;}if(readError)return Response.json({code:'unavailable'},{status:readError});return Response.json(serverView);}
  if(c.action==='read_client_instruction_manifest_v1')return Response.json({schemaVersion:1,audience:'client',snapshot:c.snapshot,total:0,cursor:null,items:[],nextCursor:null});
  if(c.action==='request_status_v1')return Response.json({status:'committed',receipt:receipts[0]});
  if(c.action==='report_product_use_v1'){
   assert.equal(c.expectedUseRevision,serverView.use.revision);
   serverView={...serverView,use:{...serverView.use,revision:serverView.use.revision+1,planProducts:serverView.use.planProducts.map(p=>p.product.productId===c.product.productId?{...p,state:'stopped',latestEvent:summary(c.product,'stopped',77)}:p)},currentGuidance:{...serverView.currentGuidance,snapshot:{...serverView.currentGuidance.snapshot,useHead:serverView.use.revision+1}}};
   return Response.json({requestId:c.requestId,event:{kind:'use',id:uid(77)},revision:serverView.use.revision,recordedAt:'2026-10-31T12:00:00Z',notificationEventId:null});
  }
  assert.equal(c.action,'record_decision_v2');writes.push(c);
  if(writeHold){const held=writeHold;writeHold=null;held.entered.resolve();await held.release.promise;}
  if(writeError)return Response.json({code:'unavailable'},{status:writeError});
  const receipt={requestId:c.requestId,action:c.action,publicationVersion:c.publicationVersion,decisionId:c.decisionId,choice:c.choice,reason:c.reason,decisionRevision:c.expectedDecisionRevision+1,snapshot:c.snapshot};receipts.push(receipt);
  serverView={...serverView,decisionRevision:receipt.decisionRevision,decisions:[{decisionId:c.decisionId,choice:c.choice,reason:c.reason}],currentGuidance:{...serverView.currentGuidance,snapshot:{...serverView.currentGuidance.snapshot,decisionRevision:receipt.decisionRevision}},decisionGuidance:[{decisionId:c.decisionId,recordedDecisionRevision:receipt.decisionRevision,acceptedSnapshot:c.snapshot,basisStatus:'current'}]};
  return Response.json(receipt);
 }});
 const session=f.runtime.getSnapshot().boundary,review=createClientGuidancePort({request:createClientReviewRequest(f.runtime),session,mode:'client'}),ports={...createClientPorts(f.runtime,{care:true}),review};
 let effectivePort=review;
 const controller=createClientPlanController(session,ports,{readVersion:3});await controller.refresh();t.after(()=>controller.dispose());
 const decision=controller.getSnapshot().view.plan.content.decisions.find(d=>d.id===route.decisionId);
 const apply=next=>{applied.push(next);controller.accept(next);scope={...scope,epoch:scope.epoch+1};};let callback=apply;
 const props=()=>({view:controller.getSnapshot().view,session,mode,ports:{...ports,review:effectivePort},onViewChange:callback});
 const context=()=>({view:controller.getSnapshot().view,decision,session,mode,port:effectivePort,scope,ready:()=>decisionGuidanceReady(controller.getSnapshot().view,decision,hydrator),onViewChange:callback});
 const update=()=>{renderFeature(props());engine?.context(context());};
 async function ready(){hydrator?.dispose();const view=controller.getSnapshot().view;hydrator=createGuidanceHydrator({view,session,mode,port:effectivePort});await hydrator.load(decisionInstructionScopes(view,decision));engine?.context(context());}
 t.after(()=>{engine?.dispose();hydrator?.dispose();});
 return {session,review,controller,writes,applied,calls:f.calls,receipts,props,context,update,ready,get engine(){return engine;},mount(){engine?.retire();engine?.dispose();renderFeature(props(),route);engine=createGuidanceDecisionController(context());return engine;},view(v){controller.accept(v);scope={...scope,epoch:scope.epoch+1};update();},mode(v){mode=v;scope={...scope,epoch:scope.epoch+1};update();},port(v){effectivePort=v;update();},newReview:()=>createClientGuidancePort({request:createClientReviewRequest(f.runtime),session,mode:'client'}),callback(v){callback=v;update();},sameContext(){engine.context({...context(),ready:()=>decisionGuidanceReady(controller.getSnapshot().view,decision,hydrator)});},restore:()=>f.runtime.restore(),readError(v){readError=v;},writeError(v){writeError=v;},hold(kind){const held={entered:deferred(),release:deferred()};t.after(()=>held.release.resolve());if(kind==='write')writeHold=held;else readHold=held;return held;},async evidence(name){await writeFile(new URL(name+'.json',output),JSON.stringify({calls:f.calls.map(({command,wire})=>({command,wire})),writes,applied:applied.length,state:engine?.getSnapshot()},null,2)+'\n');}};
}
// Source equivalents of the exact copied reviewer transitions. The untouched
// reviewer Chrome probes are preserved locally and await a fresh browser grant.
test('R1 G2 held decision cannot reread or apply through withdrawn Review source',async t=>{
 const f=await setup(t);f.update();f.mount();await f.ready();const held=f.hold('write'),pending=f.engine.submit('approved','original reason');await held.entered.promise;const original=f.engine.getSnapshot().command;
 f.port(undefined);const reads=f.calls.filter(c=>c.command.action==='read_client_plan_v3').length;held.release.resolve();await pending;await f.evidence('G2-withdrawn');
 assert.equal(f.applied.length,0,'obsolete Review callback must not install a view');assert.equal(f.calls.filter(c=>c.command.action==='read_client_plan_v3').length,reads,'withdrawn source must not issue a post-write reread');assert.equal(f.engine.getSnapshot().command,original);assert.equal(f.engine.getSnapshot().phase,'uncertain');
});
for(const transition of ['read-only','mode'])test('R1 G1 routine-first '+transition+' roundtrip cannot submit on exact original active object',async t=>{
 const f=await setup(t);f.update();const original=f.controller.getSnapshot().view;
 if(transition==='read-only'){f.view({...original,access:'read_only'});f.view(original);}else{f.mode('advisor-preview');f.mode('client');}
 assert.equal(f.controller.getSnapshot().view,original);f.mount();await f.ready();await f.engine.submit('approved',null);await f.evidence('G1-'+transition);
 assert.equal(f.writes.length,0,'fresh plan fetch and deliberate same-basis review must precede a choice');assert.equal(f.engine.getSnapshot().phase,'conflict');assert.equal(f.calls.filter(c=>c.command.action==='read_client_plan_v3').length,1,'hydration is not a plan reread');
});
for(const source of ['port','callback'])test('G1 routine-first '+source+' capability roundtrip retains a spent review gate before controls exist',async t=>{
 const f=await setup(t);f.update();const original=f.controller.getSnapshot().view,callback=f.context().onViewChange;
 if(source==='port'){f.port(undefined);f.port(f.review);}else{f.callback(undefined);f.callback(callback);}
 f.mount();await f.ready();await f.engine.submit('approved',null);assert.equal(f.writes.length,0);assert.equal(f.engine.getSnapshot().phase,'conflict');assert.equal(f.controller.getSnapshot().view,original);assert.equal(f.calls.filter(c=>c.command.action==='read_client_plan_v3').length,1);
});
test('G1 spent gate needs a successful current plan fetch then a separate same-fetched-basis review, and survives remount',async t=>{
 const f=await setup(t);f.update();const original=f.controller.getSnapshot().view;f.view({...original,access:'read_only'});f.view(original);f.mount();await f.ready();
 f.readError(503);await f.engine.review();assert.equal(f.engine.getSnapshot().phase,'conflict');assert.equal(f.applied.length,0);await f.restore();f.readError(null);
 await f.engine.review();const fetched=f.applied.at(-1);assert.equal(f.controller.getSnapshot().view,fetched);assert.notEqual(fetched,original);f.update();await f.ready();assert.equal(f.engine.getSnapshot().phase,'conflict');
 await f.engine.submit('approved',null);assert.equal(f.writes.length,0);await f.engine.review();f.update();await f.ready();assert.equal(f.engine.getSnapshot().phase,'idle');f.mount();await f.ready();assert.equal(f.engine.getSnapshot().phase,'idle');
 await f.engine.submit('approved',null);assert.equal(f.writes.length,1);assert.equal(f.engine.getSnapshot().phase,'saved');
});
test('G2 unchanged effective source callback and owner survive fresh context wrappers and normal feature rerenders',async t=>{
 const f=await setup(t);f.update();f.mount();await f.ready();const held=f.hold('write'),pending=f.engine.submit('declined','keep actual reason');await held.entered.promise;f.update();f.sameContext();held.release.resolve();await pending;
 assert.equal(f.applied.length,1);assert.equal(f.controller.getSnapshot().view,f.applied[0]);assert.equal(f.engine.getSnapshot().phase,'saved');assert.equal(f.writes.length,1);
});
test('G2 withdrawn committed receipt and original wire survive restoration and lawful status READ recovery',async t=>{
 const f=await setup(t);f.update();f.mount();await f.ready();const held=f.hold('write'),pending=f.engine.submit('deferred','original payload');await held.entered.promise;const original=f.engine.getSnapshot().command,wire=f.calls.find(c=>c.command.action==='record_decision_v2').wire;
 f.port(undefined);held.release.resolve();await pending;assert.equal(f.engine.getSnapshot().command,original);assert.deepEqual(f.engine.getSnapshot().receipt,f.receipts[0]);assert.equal(f.applied.length,0);
 await f.restore();f.port(f.review);await f.ready();await f.engine.status();assert.equal(f.writes.length,1);assert.equal(f.engine.getSnapshot().command,null);assert.equal(f.controller.getSnapshot().view,f.applied[0]);assert.equal(f.calls.find(c=>c.command.action==='record_decision_v2').wire,wire);assert.equal(f.calls.at(-2).command.action,'request_status_v1');assert.equal(f.calls.at(-1).command.action,'read_client_plan_v3');
});
for(const changed of ['port','callback'])test('G2 '+changed+' replacement while post-write read is held denies obsolete callback',async t=>{
 const f=await setup(t);f.update();f.mount();await f.ready();const held=f.hold('read'),pending=f.engine.submit('approved',null);await held.entered.promise;const original=f.engine.getSnapshot().command,replacementApplied=[];
 if(changed==='port')f.port(f.newReview());else f.callback(v=>replacementApplied.push(v));
 held.release.resolve();await pending;assert.equal(f.applied.length,0);assert.equal(replacementApplied.length,0);assert.equal(f.engine.getSnapshot().command,original);assert.equal(f.engine.getSnapshot().phase,'uncertain');assert.equal(f.writes.length,1);
});
test('G2 callback removed during receipt notification cannot receive a current view',async t=>{
 const f=await setup(t);f.update();f.mount();await f.ready();let removed=false;const stop=f.engine.subscribe(()=>{if(!removed&&f.engine.getSnapshot().phase==='saved'){removed=true;f.callback(undefined);}});t.after(stop);
 await f.engine.submit('approved',null);assert.equal(removed,true);assert.equal(f.applied.length,0);assert.equal(f.writes.length,1);
});
test('G1 restored historical receipt cannot clear the spent restriction for a new choice',async t=>{
 const f=await setup(t);f.update();f.mount();await f.ready();const held=f.hold('write'),pending=f.engine.submit('approved',null);await held.entered.promise;f.port(undefined);held.release.resolve();await pending;await f.restore();f.port(f.review);await f.ready();await f.engine.status();f.update();await f.ready();
 const before=f.writes.length;await f.engine.submit('declined',null);assert.equal(f.writes.length,before,'receipt plus current read is not deliberate same-basis review');assert.equal(f.engine.getSnapshot().phase,'conflict');
});
test('G2 exact source restoration before old receipt cannot revive the retired operation',async t=>{
 const f=await setup(t);f.update();f.mount();await f.ready();const held=f.hold('write'),pending=f.engine.submit('approved',null);await held.entered.promise;const command=f.engine.getSnapshot().command;f.port(undefined);f.port(f.review);held.release.resolve();await pending;
 assert.equal(f.applied.length,0);assert.equal(f.calls.filter(c=>c.command.action==='read_client_plan_v3').length,1);assert.equal(f.engine.getSnapshot().command,command);assert.equal(f.engine.getSnapshot().phase,'uncertain');
});
test('G2 withdrawn uncertain write retries its exact original UUID payload snapshot and wire after normal session restore',async t=>{
 const f=await setup(t);f.update();f.mount();await f.ready();f.writeError(503);const held=f.hold('write'),pending=f.engine.submit('declined','retain this exact choice');await held.entered.promise;const command=f.engine.getSnapshot().command;f.port(undefined);held.release.resolve();await pending;
 assert.equal(f.engine.getSnapshot().command,command);assert.equal(f.engine.getSnapshot().phase,'uncertain');assert.equal(f.applied.length,0);await f.restore();f.writeError(null);f.port(f.review);await f.ready();await f.engine.retry();
 assert.deepEqual(f.writes,[command,command]);const wires=f.calls.filter(c=>c.command.action==='record_decision_v2').map(c=>c.wire);assert.equal(wires[0],wires[1]);assert.equal(f.engine.getSnapshot().command,null);assert.equal(f.engine.getSnapshot().phase,'conflict');assert.equal(f.applied.length,1);assert.equal(f.calls.some(c=>c.command.action==='record_decision_v1'),false);
 assert.equal(Object.keys(command).some(k=>['actualStart','startedOn','payment','quote','order','clientId','role'].includes(k)),false);
});
test('G2 old finally cannot release a replacement current read operation',async t=>{
 const f=await setup(t);f.update();f.mount();await f.ready();const old=f.hold('read'),oldPending=f.engine.review();await old.entered.promise;f.port(f.newReview());const newer=f.hold('read'),currentPending=f.engine.review();await new Promise(r=>setImmediate(r));assert.equal(f.calls.filter(c=>c.command.action==='read_client_plan_v3').length,3,'replacement source must begin its own current read without waiting for the obsolete read');await newer.entered.promise;
 old.release.resolve();await oldPending;const count=f.calls.length;await f.engine.review();assert.equal(f.calls.length,count,'old finally must leave the newer operation owned');assert.equal(f.applied.length,0);newer.release.resolve();await currentPending;assert.equal(f.applied.length,1);assert.equal(f.controller.getSnapshot().view,f.applied[0]);
});
test('Care factual Stop and strict Review3 reread remain independent of an unhydrated spent decision gate',async t=>{
 const f=await setup(t);f.update();const original=f.controller.getSnapshot().view;f.view({...original,access:'read_only'});f.view(original);f.mount();const props=f.props(),product=props.view.use.planProducts.find(p=>p.product.productId==='cerave-pm').product;
 const command={schemaVersion:1,action:'report_product_use_v1',requestId:uid(90),expectedUseRevision:props.view.use.revision,product,change:{kind:'stopped',details:null},sourcePublication:product.publication,occurredOn:{state:'unknown'},channel:'portal',acquisition:'already_owned',identityEventId:null};
 const receipt=await props.ports.care.execute(command);assert.equal(receipt.revision,1);const fetched=await readCurrentPlan(props);f.controller.accept(fetched);assert.equal(f.controller.getSnapshot().view,fetched);assert.equal(fetched.schemaVersion,3);assert.equal(fetched.use.planProducts.find(p=>p.product.productId==='cerave-pm').state,'stopped');assert.equal(f.writes.length,0);assert.equal(f.engine.getSnapshot().phase,'conflict');
 assert.deepEqual(f.calls.map(c=>c.command.action),['read_client_plan_v3','report_product_use_v1','read_client_plan_v3']);assert.equal(f.calls.some(c=>c.command.action==='read_client_plan_v2'||c.command.action==='read_client_plan_v1'),false);
});
for(const mode of ['advisor-preview','public-demo','guest','historical'])test('feature restriction in '+mode+' never writes or reads through client decision actions',async t=>{
 const f=await setup(t);f.mode(mode);assert.equal(f.session.memory.get('plan-guidance-intents:'+f.session.key+':client'),undefined);f.mount();const before=f.calls.length;await f.engine.submit('approved',null);await f.engine.retry();await f.engine.status();await f.engine.review();assert.equal(f.calls.length,before);assert.equal(f.writes.length,0);assert.equal(f.session.memory.get('plan-guidance-intents:'+f.session.key+':client'),undefined);
});
