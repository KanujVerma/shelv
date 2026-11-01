import test from 'node:test';
import assert from 'node:assert/strict';
import {sourceModule} from './rebuild-maya-five-stage-build.mjs';
import {carePlan} from './rebuild/care-fixture.mjs';
const {exports:{renderSharedPlan}}=await sourceModule('tests/rebuild-maya-five-stage-ssr.ts');
const session={key:'public-only-seam',isCurrent:()=>true,subscribeInvalidation:()=>()=>{},memory:{get(){},set(){},delete(){}}};
function props(view,route) {
  let calls=0;
  const demoPorts={mode:'public-demo',read:{execute:async()=>view},decision:{execute:async()=>{calls++;}},care:{execute:async()=>{calls++;throw Error('must not execute');}}};
  return {value:{view,mode:'public-demo',session,demoPorts,onViewChange(){},navigation:{route,navigate(){},back(){}}},calls:()=>calls};
}
test('bounded counterexample: actual v2 public-demo choices remain unavailable even with separate memory ports',()=>{
  const p=props(carePlan(),{name:'recommendation',decisionId:'maya-card-treatments',routine:'morning'}),html=renderSharedPlan(p.value);
  assert.match(html,/choices are unavailable in this view/);assert.doesNotMatch(html,/>approve product</);assert.equal(p.calls(),0);
});
test('bounded counterexample: actual v2 public-demo use form remains unavailable without pretending to be a client',()=>{
  const p=props(carePlan(),{name:'product-use',productId:'cerave-pm',routine:'evening'}),html=renderSharedPlan(p.value);
  assert.match(html,/use reporting unavailable/);assert.doesNotMatch(html,/>record change</);assert.equal(p.calls(),0);
});
