import test from 'node:test';
import assert from 'node:assert/strict';
import {sourceModule} from './rebuild-maya-five-stage-build.mjs';
import {captureUse} from '../src/features/plan/useModel.ts';
const {exports:{createMayaDemoController}}=await sourceModule('tests/rebuild-maya-five-stage-ssr.ts');
function pendingUse(){
  const c=createMayaDemoController({initialStage:3});
  c.navigate({name:'product-use',productId:'ordinary-azelaic-10',routine:'evening'});
  const p=c.getPlanProps(),product=p.view.use.planProducts.find(s=>s.product.productId==='ordinary-azelaic-10').product;
  p.session.memory.set('unsent','synthetic memory only');
  const capture=captureUse({match:'yes',action:'started_earlier',when:'unknown',date:'',acquisition:'self',details:'',frequency:'',amount:'',name:'',brand:'',variant:'',strength:'',sizeLabel:'',differentProduct:false},product,product.publication,'2026-11-03');
  return {c,p,result:p.demoInteractions.use.report(capture)};
}
const summary=c=>{const s=c.getSnapshot();return {stage:s.stage,guide:s.guide,reports:s.exampleReports.length,revision:s.view.use.revision};};
const ended={stage:1,guide:'exited',reports:0,revision:0};
test('throwing disposal observers see wiped state and cannot restore a held memory result',()=>{
  const {c,p,result}=pendingUse(),observed=[];
  p.session.subscribeInvalidation(()=>{observed.push(summary(c));p.onViewChange(result.view);throw Error('synthetic first observer');});
  p.session.subscribeInvalidation(()=>observed.push(summary(c)));
  assert.doesNotThrow(()=>c.dispose());
  assert.deepEqual(observed,[ended,ended]);assert.deepEqual(summary(c),ended);
  assert.equal(p.session.memory.get('unsent'),undefined);assert.equal(p.demoInteractions.use.isCurrent(),false);
  assert.throws(()=>p.demoInteractions.choice.choose({decisionId:'maya-card-treatments',choice:'approved'}),{status:403});
  assert.doesNotThrow(()=>c.dispose());assert.equal(observed.length,2);
});
test('fresh memory interaction inside reset observer survives old-cache cleanup and another throwing observer',()=>{
  const {c,p,result}=pendingUse();let freshSession,observedFresh,retiredResultIgnored=false;
  p.session.subscribeInvalidation(()=>{observedFresh=summary(c);throw Error('synthetic reset observer');});
  p.session.subscribeInvalidation(()=>{
    c.selectStage(2);const fresh=c.getPlanProps();freshSession=fresh.session;
    const choice=fresh.demoInteractions.choice.choose({decisionId:'maya-card-treatments',choice:'declined'});fresh.onViewChange(choice.view);
    const before=c.getSnapshot();p.onViewChange(result.view);retiredResultIgnored=c.getSnapshot()===before;
  });
  assert.doesNotThrow(()=>c.reset());
  assert.deepEqual(observedFresh,{stage:1,guide:'open',reports:0,revision:0});assert.equal(retiredResultIgnored,true);
  assert.equal(p.session.isCurrent(),false);assert.equal(freshSession.isCurrent(),true);
  assert.equal(c.getSnapshot().stage,2);assert.equal(c.getSnapshot().view.decisions[0].choice,'declined');
  assert.deepEqual(c.getSnapshot().exampleReports,[]);c.dispose();
});
test('reentrant disposal during reset retires held memory handles and publishes no ready replacement',()=>{
  const {c,p,result}=pendingUse();let late;
  p.session.subscribeInvalidation(()=>c.dispose());
  p.session.subscribeInvalidation(()=>{late=c.getPlanProps();p.onViewChange(result.view);});
  assert.doesNotThrow(()=>c.reset());
  assert.deepEqual(summary(c),ended);assert.equal(late.session.isCurrent(),false);
  assert.equal(late.demoInteractions.use.isCurrent(),false);assert.equal(p.session.memory.get('unsent'),undefined);
  assert.throws(()=>late.demoInteractions.choice.choose({decisionId:'maya-card-treatments',choice:'approved'}),{status:403});
});
