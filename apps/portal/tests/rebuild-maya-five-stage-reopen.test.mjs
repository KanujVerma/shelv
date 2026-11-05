import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {sourceModule} from './rebuild-maya-five-stage-build.mjs';
import {MAYA_STAGES} from '../src/features/walkthrough/maya/model.ts';

// Observe real native button props produced by the unchanged shared wrappers.
// Return every original element and invoke its original handler. This is pure
// SSR/callback evidence, not a DOM click, mounted lifecycle or focus test.
const require=createRequire(import.meta.url),runtime=require('react/jsx-runtime');
const original={jsx:runtime.jsx,jsxs:runtime.jsxs};
let buttons=[];
const text=value=>typeof value==='string'||typeof value==='number'?String(value):Array.isArray(value)?value.map(text).join(''):value?.props?text(value.props.children):'';
for(const key of ['jsx','jsxs'])runtime[key]=(type,props,...rest)=>{
  if(type==='button')buttons.push({label:text(props.children),props});
  return original[key](type,props,...rest);
};
after(()=>{for(const key of ['jsx','jsxs'])runtime[key]=original[key];});
const {exports:{createMayaDemoController,renderMaya}}=await sourceModule('tests/rebuild-maya-five-stage-ssr.ts');
function render(controller){buttons=[];return renderMaya(controller);}
function button(label){const found=buttons.filter(b=>b.label===label);assert.equal(found.length,1,'one actual shared button: '+label);assert.equal(found[0].props['data-slot'],'button');return found[0].props;}
function click(label){const props=button(label);assert.equal(!!props.disabled,false,label+' enabled');props.onClick({preventDefault(){},stopPropagation(){}});}
const marker=[/start with Maya’s priorities/,/<h1[^>]*>review a recommendation<\/h1>/,/try sample use states/,/<h1[^>]*>sample follow-up<\/h1>/,/<h2>a plan with follow-through<\/h2>/];
function stageTarget(controller,stage){
  const state=controller.getSnapshot(),expected=MAYA_STAGES[stage-1];
  assert.equal(state.stage,stage);assert.equal(state.guide,'open');assert.equal(state.page,expected.page);assert.deepEqual(state.route,expected.route);
  const html=render(controller);assert.match(html,new RegExp('data-maya-stage="'+expected.id+'"'));assert.match(html,marker[stage-1]);assert.match(html,new RegExp('stage '+stage+' of 5'));
}
function data(controller){const state=controller.getSnapshot(),props=controller.getPlanProps();return structuredClone({view:state.view,receipt:state.exampleReceipt,reports:state.exampleReports,generation:state.generation,sessionKey:props.session.key,draft:props.session.memory.get('reopen-test-draft')});}

for(const stage of [1,2,3,4,5])for(const [action,guide,launcher] of [['exit guide','exited','view tour'],['explore on my own','exploring','view tour'],['hide guide','collapsed','show guide']])test('MF1 stage '+stage+' '+action+' reopens the selected stage, content and route',t=>{
  const c=createMayaDemoController({initialStage:stage});t.after(c.dispose);stageTarget(c,stage);
  c.getPlanProps().session.memory.set('reopen-test-draft','public demo unsent example');const before=data(c);
  click(action);const html=render(c);assert.equal(c.getSnapshot().guide,guide);assert.doesNotMatch(html,/<aside class="maya-guide-rail"/);click(launcher);
  stageTarget(c,stage);assert.deepEqual(data(c),before,'reopen does not replay or reset demo data');
});

async function seeded(stage){
  const c=createMayaDemoController({initialStage:2});render(c);click('decide later');
  // Preserve R1's qualification: a bounded scheduler turn completes the real
  // async choice/read chain; three presumed microtasks were not sufficient.
  await new Promise(setImmediate);
  assert.equal(c.getSnapshot().view.decisions[0]?.choice,'deferred');
  render(c);click('next');
  for(const label of ['try sample receipt','try sample start · date unknown','try sample stop · date unknown']){render(c);click(label);}
  while(c.getSnapshot().stage!==stage){render(c);click(c.getSnapshot().stage<stage?'next':'back');}
  return c;
}
for(const stage of [1,2,3,4,5])test('MF1 stage '+stage+' restores its target after actual product/evidence exploration and preserves choices/use',async t=>{
  const c=await seeded(stage);t.after(c.dispose);stageTarget(c,stage);
  const props=c.getPlanProps();props.session.memory.set('reopen-test-draft','retained public example');const before=data(c);
  click('explore on my own');render(c);click('morning routine');render(c);click('CeraVe PM details');
  assert.deepEqual(c.getSnapshot().route,{name:'product',productId:'cerave-pm',routine:'morning'});
  render(c);click('azelaic directions & evidence');const evidence=render(c);assert.match(evidence,/Patch test first/);assert.equal(c.getSnapshot().route.productId,'ordinary-azelaic-10');
  click('back to product');assert.equal(c.getSnapshot().route.productId,'cerave-pm');
  render(c);click('view tour');stageTarget(c,stage);assert.deepEqual(data(c),before);
  // The unchanged shared parentRoute defaults a top-level plan to morning.
  // Stage 3 itself must still restore evening (asserted by stageTarget above).
  assert.deepEqual(c.getPlanProps().navigation.backDestination(),{name:'plan',routine:'morning'},'exploration predecessor is retired on stage entry');
  assert.equal(c.getSnapshot().view.schemaVersion,2);assert.equal(c.getSnapshot().view.use.planProducts.find(p=>p.product.productId==='ordinary-azelaic-10').state,'stopped');
  assert.equal(c.getSnapshot().exampleReports[0].occurredOn.state,'unknown');assert.deepEqual(c.getSnapshot().view.actualUse,[]);assert.equal(props.session.isCurrent(),true);assert.equal(props.ports,undefined);assert.equal(props.demoPorts.care,undefined);
});

test('MF1 actual forward/back, finish/reopen, replay and reset keep their distinct meanings',async t=>{
  const c=await seeded(1);t.after(c.dispose);
  for(let stage=1;stage<=5;stage++){stageTarget(c,stage);if(stage<5)click('next');}
  const before=data(c);click('finish guide');assert.equal(c.getSnapshot().guide,'exploring');assert.equal(c.getSnapshot().page,'plan');render(c);click('view tour');stageTarget(c,5);assert.deepEqual(data(c),before);
  for(let stage=5;stage>=1;stage--){stageTarget(c,stage);if(stage>1)click('back');}
  assert.equal(button('back').disabled,true);render(c);click('next');render(c);click('next');render(c);click('next');render(c);click('next');stageTarget(c,5);
  click('replay guide');stageTarget(c,1);assert.deepEqual(c.getSnapshot().exampleReports,before.reports);assert.deepEqual(c.getSnapshot().view.decisions,before.view.decisions);assert.equal(c.getSnapshot().generation,before.generation);
  click('reset demo');stageTarget(c,1);assert.deepEqual(c.getSnapshot().exampleReports,[]);assert.deepEqual(c.getSnapshot().view.decisions,[]);assert.equal(c.getSnapshot().generation,before.generation+1);
});

for(const stage of [1,2,3,4,5])test('MF1 stage '+stage+' captured launcher/navigation/ports cannot revive a disposed demo or affect another demo',async()=>{
  const c=createMayaDemoController({initialStage:stage}),other=createMayaDemoController();const otherBefore=structuredClone(other.getSnapshot());
  try{
    render(c);click('exit guide');render(c);const captured=button('view tour').onClick,old=c.getPlanProps();old.session.memory.set('reopen-test-draft','dispose this public example');
    const late=await old.demoPorts.read.execute({schemaVersion:1,action:'read_client_plan_v1',version:null});c.reportExample('started-unknown');c.dispose();const disposed=c.getSnapshot();
    assert.throws(()=>captured({preventDefault(){}}),{status:403});assert.throws(()=>old.navigation.navigate({name:'plan',routine:'evening'}),{status:403});old.onViewChange(late);
    await assert.rejects(old.demoPorts.read.execute({schemaVersion:1,action:'read_client_plan_v1',version:null}),{status:403});assert.equal(c.getSnapshot(),disposed);assert.equal(old.session.isCurrent(),false);assert.equal(old.session.memory.get('reopen-test-draft'),undefined);assert.deepEqual(disposed.exampleReports,[]);assert.deepEqual(other.getSnapshot(),otherBefore);
  }finally{c.dispose();other.dispose();}
});

for(const stage of [1,2,3,4,5])test('MF1 stage '+stage+' reentrant subscriber sees the restored target and its explicit exit remains the final state',t=>{
  const c=createMayaDemoController({initialStage:stage});t.after(c.dispose);render(c);click('exit guide');render(c);const reopen=button('view tour').onClick;let entered=false;
  const stop=c.subscribe(()=>{const state=c.getSnapshot();if(!entered&&state.guide==='open'){entered=true;assert.equal(state.page,MAYA_STAGES[stage-1].page);assert.deepEqual(state.route,MAYA_STAGES[stage-1].route);c.exit();}});t.after(stop);
  reopen({preventDefault(){}});assert.equal(entered,true);assert.equal(c.getSnapshot().guide,'exited');assert.equal(c.getSnapshot().page,'plan');assert.equal(c.getSnapshot().generation,0);
});
