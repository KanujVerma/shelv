import test from 'node:test';
import assert from 'node:assert/strict';
import {createMayaDemoController} from '../src/features/walkthrough/maya/controller.ts';
import {routineFor,productContext} from '../src/features/plan/model.ts';
const treatment='ordinary-azelaic-10';
const command=(revision=0,requestId='ec000000-0000-4000-8000-000000000800')=>({schemaVersion:1,action:'record_decision_v1',requestId,publicationVersion:1,expectedDecisionRevision:revision,decisionId:'maya-card-treatments',choice:'approved',reason:null});
test('five actual forward/back targets and safe ordinary exploration keep data and plan context',()=>{
  const c=createMayaDemoController(),views=[];
  for(let i=1;i<=5;i++){const s=c.getSnapshot();assert.equal(s.stage,i);views.push([s.page,s.route.name,s.route.routine]);if(i<5)c.next();}
  assert.deepEqual(views,[['plan','plan','morning'],['plan','recommendation','morning'],['plan','plan','evening'],['follow-up','plan','morning'],['next-step','plan','morning']]);
  for(let i=5;i>=1;i--){assert.equal(c.getSnapshot().stage,i);c.back();}assert.equal(c.getSnapshot().stage,1);
  c.selectStage(2);c.navigate({name:'product',productId:'cerave-pm',routine:'evening'});c.navigate({name:'product-evidence',productId:'cerave-pm',routine:'evening'});c.backPlan();assert.equal(c.getSnapshot().route.name,'product');c.backPlan();assert.equal(c.getSnapshot().route.name,'recommendation');
  c.exit();assert.equal(c.getSnapshot().guide,'exited');c.reopen();assert.equal(c.getSnapshot().stage,2);c.collapse();assert.equal(c.getSnapshot().guide,'collapsed');c.reopen();c.explore();assert.equal(c.getSnapshot().guide,'exploring');c.replay();assert.equal(c.getSnapshot().stage,1);assert.equal(c.getSnapshot().guide,'open');c.dispose();
});
test('shared memory DemoPlanPorts confirm choices without Start, money, orders or service effects',async()=>{
  const c=createMayaDemoController({initialStage:2}),p=c.getPlanProps(),before=structuredClone(p.view.plan);
  assert.equal(p.mode,'public-demo');assert.equal(p.ports,undefined);assert.equal(p.demoPorts.mode,'public-demo');assert.equal(p.demoPorts.care,undefined);
  await p.demoPorts.decision.execute(command());const v=await p.demoPorts.read.execute({schemaVersion:1,action:'read_client_plan_v1',version:null});p.onViewChange(v);
  assert.equal(c.getSnapshot().view.decisions[0].choice,'approved');assert.deepEqual(c.getSnapshot().view.actualUse,[]);assert.deepEqual(c.getSnapshot().view.plan,before);assert.equal(routineFor(c.getSnapshot().view,'evening').some(s=>s.productId===treatment),false);
  await p.demoPorts.decision.execute(command());await assert.rejects(p.demoPorts.decision.execute({...command(),choice:'declined'}),{status:409});
  c.receiveExample();assert.equal(c.getSnapshot().exampleReceipt,true);assert.deepEqual(c.getSnapshot().exampleReports,[]);assert.equal(routineFor(c.getSnapshot().view,'evening').some(s=>s.productId===treatment),false);c.dispose();
});
test('unknown Start and stop use actual capture/shared state without mutating published advice or creating purchase state',()=>{
  const c=createMayaDemoController({initialStage:3}),before=structuredClone(c.getSnapshot().view.plan);
  c.reportExample('started-unknown');let s=c.getSnapshot();assert.equal(s.view.schemaVersion,2);assert.equal(productContext(s.view,treatment).use.effective.originalStart.state,'unknown');assert.equal(routineFor(s.view,'evening').some(s=>s.productId===treatment),true);assert.deepEqual(s.view.actualUse,[]);
  c.reportExample('stopped-unknown');s=c.getSnapshot();assert.equal(productContext(s.view,treatment).use.effective.state,'stopped');assert.equal(routineFor(s.view,'evening').some(s=>s.productId===treatment),false);assert.deepEqual(s.view.plan,before);assert.equal(s.exampleReports.length,2);assert.equal(s.exampleReports[1].occurredOn.state,'unknown');assert.equal(s.exampleReports[0].acquisition,'self');assert.equal('orders'in s,false);
  c.selectStage(2);assert.equal(c.getSnapshot().view.schemaVersion,2,'do not downcast reported use just to expose v1 buttons');c.dispose();
});
test('known sample Start stays distinct from recording time, while stop needs no identity answer',()=>{
  const c=createMayaDemoController();c.reportExample('started-known');assert.deepEqual(productContext(c.getSnapshot().view,treatment).use.effective.originalStart,{state:'known',value:'2026-11-03'});c.reportExample('stopped-unknown','cerave-pm');assert.equal(routineFor(c.getSnapshot().view,'morning').some(s=>s.productId==='cerave-pm'),false);c.dispose();
});
test('reset invalidates old ports, callbacks, subscriptions and transient memory; another demo remains unchanged',async()=>{
  const c=createMayaDemoController({initialStage:2}),other=createMayaDemoController(),old=c.getPlanProps();let invalidations=0;
  old.session.subscribeInvalidation(()=>invalidations++);old.session.memory.set('draft','DEMO_ONLY_UNSENT');await old.demoPorts.decision.execute(command());const late=await old.demoPorts.read.execute({schemaVersion:1,action:'read_client_plan_v1',version:null});c.receiveExample();c.reportExample('started-unknown');c.reset();old.onViewChange(late);
  assert.equal(invalidations,1);assert.equal(old.session.isCurrent(),false);assert.equal(old.session.memory.get('draft'),undefined);await assert.rejects(old.demoPorts.decision.execute(command()),{status:403});await assert.rejects(old.demoPorts.read.execute({schemaVersion:1,action:'read_client_plan_v1',version:null}),{status:403});
  const s=c.getSnapshot();assert.equal(s.stage,1);assert.equal(s.generation,1);assert.equal(s.exampleReceipt,false);assert.deepEqual(s.exampleReports,[]);assert.deepEqual(s.view.decisions,[]);assert.deepEqual(other.getSnapshot().view.decisions,[]);assert.equal(other.getSnapshot().generation,0);c.dispose();other.dispose();
});
test('unmount cleanup releases sample reports and makes all mutators unavailable',()=>{
  const c=createMayaDemoController();c.reportExample('started-unknown');const p=c.getPlanProps();c.dispose();assert.equal(p.session.isCurrent(),false);assert.deepEqual(c.getSnapshot().exampleReports,[]);assert.throws(()=>c.reopen(),{status:403});assert.throws(()=>c.reset(),{status:403});
});
test('invalid stages, products, commands and out-of-scope routes are refused without a side effect',async()=>{
  assert.throws(()=>createMayaDemoController({initialStage:6}));const c=createMayaDemoController(),s=c.getSnapshot();assert.throws(()=>c.selectStage(0));assert.throws(()=>c.navigate({name:'orders'}));assert.throws(()=>c.reportExample('started-unknown','not-public'));await assert.rejects(c.getPlanProps().demoPorts.decision.execute({action:'publish_v1'}));assert.equal(c.getSnapshot(),s);c.dispose();
});
