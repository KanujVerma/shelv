import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {sourceModule} from './rebuild-maya-five-stage-build.mjs';
import {assertMayaStaticImages} from './w3/maya-static-images.mjs';
import {captureUse} from '../src/features/plan/useModel.ts';
import {mapCareResult} from '../../../src/contracts/PortalCareMapping.ts';
import {guidancePlan} from './rebuild-plan-guidance-fixture.mjs';
const require=createRequire(import.meta.url),runtime=require('react/jsx-runtime'),original={jsx:runtime.jsx,jsxs:runtime.jsxs};
let buttons=[],forms=[],fields=[];
const text=v=>typeof v==='string'||typeof v==='number'?String(v):Array.isArray(v)?v.map(text).join(''):v?.props?text(v.props.children):'';
for(const key of ['jsx','jsxs'])runtime[key]=(type,props,...rest)=>{
  if(type==='button')buttons.push({label:text(props.children),props});
  if(type==='form')forms.push(props);
  if(typeof type==='function'&&type.name==='Field')fields.push(props);
  return original[key](type,props,...rest);
};
after(()=>Object.assign(runtime,original));
const {exports:{createMayaDemoController,renderMaya,renderSharedPlan}}=await sourceModule('tests/rebuild-maya-five-stage-ssr.ts');
function render(c){buttons=[];forms=[];fields=[];return renderMaya(c);}
function button(label){const b=buttons.filter(b=>b.label===label);assert.equal(b.length,1,label);assert.equal(b[0].props['data-slot'],'button');return b[0].props;}
function click(c,label){render(c);const b=button(label);assert.equal(!!b.disabled,false);b.onClick({preventDefault(){},stopPropagation(){}});}
function edit(c,label,value){render(c);const p=fields.find(f=>f.label===label).children.props;(p.onValueChange??(v=>p.onChange({target:{value:v}})))(value);}
function submit(c){render(c);assert.equal(forms.length,1);forms[0].onSubmit({preventDefault(){}});}
function open(c,id='ordinary-azelaic-10'){c.navigate({name:'product-use',productId:id,routine:'evening'});}
function captured(c,id='ordinary-azelaic-10',patch={}){
  const v=c.getSnapshot().view,p=v.use.planProducts.find(s=>s.product.productId===id).product;
  return captureUse({match:'yes',action:'started_earlier',when:'unknown',date:'',acquisition:'self',details:'',frequency:'',amount:'',name:'',brand:'',variant:'',strength:'',sizeLabel:'',differentProduct:false,...patch},p,p.publication,'2026-11-03');
}
function commit(p,result){assert.equal(result.kind,'demo-memory');assert.deepEqual(Object.keys(result).sort(),['kind','view']);p.onViewChange(result.view);}

test('memory ports return only a strict Root-compatible read projection without a live-operation ABI',t=>{
  const c=createMayaDemoController({initialStage:3});t.after(c.dispose);open(c);const p=c.getPlanProps();
  assert.equal(p.ports,undefined);assert.equal('execute'in p.demoInteractions.use,false);assert.equal('execute'in p.demoInteractions.choice,false);
  const result=p.demoInteractions.use.report(captured(c));
  assert.deepEqual(mapCareResult({...result.view,latestPublicReview:null},{schemaVersion:1,action:'read_client_plan_v2',version:null}),{...result.view,latestPublicReview:null});
  assert.throws(()=>p.demoInteractions.use.report(captured(c)),{status:403},'a pending result cannot be applied twice');
  commit(p,result);assert.equal(p.demoInteractions.use.isCurrent(),false);
  assert.deepEqual(c.getSnapshot().view.actualUse,[]);
});
test('a follow-up-stage memory result is accepted by the exact Root read decoder without a fabricated review',t=>{
  const c=createMayaDemoController({initialStage:4});t.after(c.dispose);open(c);const p=c.getPlanProps();
  const result=p.demoInteractions.use.report(captured(c));
  assert.deepEqual(mapCareResult(result.view,{schemaVersion:1,action:'read_client_plan_v2',version:null}),result.view);
  assert.equal(result.view.latestPublicReview,null);commit(p,result);
  c.reopen();assert.match(render(c),/sample follow-up/);assert.match(render(c),/an example review/);
});
for(const mode of ['client','advisor-preview','private-walkthrough','historical'])test('injected demo capability is never inspected by '+mode,t=>{
  const c=createMayaDemoController({initialStage:3});t.after(c.dispose);let touched=0;
  const capability=Object.defineProperty({},'mode',{get(){touched++;throw Error('demo inspected outside public V2');}});
  for(const route of [{name:'product-use',productId:'cerave-pm',routine:'morning'},{name:'recommendation',decisionId:'maya-card-treatments',routine:'morning'}]){
    const p={...c.getPlanProps(),mode,demoInteractions:capability,demoPorts:undefined,navigation:{route,navigate(){},back(){}}};
    const html=renderSharedPlan(p);assert.match(html,route.name==='product-use'?/use reporting unavailable|read-only plan/:/choices are unavailable/);
  }
  assert.equal(touched,0);assert.equal(c.getSnapshot().exampleReports.length,0);
});
test('public V3 ignores demo capabilities and retains actual V3 unavailable guards',t=>{
  const c=createMayaDemoController();t.after(c.dispose);let touched=0;
  const capability=Object.defineProperty({},'mode',{get(){touched++;throw Error('V3 demo override');}});
  for(const route of [{name:'product-use',productId:'cerave-pm',routine:'morning'},{name:'recommendation',decisionId:'maya-card-treatments',routine:'evening'}]){
    const html=renderSharedPlan({...c.getPlanProps(),view:guidancePlan(),demoInteractions:capability,demoPorts:undefined,navigation:{route,navigate(){},back(){}}});
    assert.doesNotMatch(html,/sample use form|demo choice updated/);
  }
  assert.equal(touched,0);
});
test('captured use/choice/navigation ports reject old contexts and exact-object reentry',t=>{
  const c=createMayaDemoController({initialStage:3});t.after(c.dispose);open(c);const p=c.getPlanProps(),input=captured(c);
  c.navigate({name:'product-evidence',productId:'ordinary-azelaic-10',routine:'evening'});c.backPlan();
  assert.equal(p.demoInteractions.use.isCurrent(),false);assert.throws(()=>p.demoInteractions.use.report(input),{status:403});
  assert.throws(()=>p.navigation.back(),{status:403});assert.equal(c.getSnapshot().exampleReports.length,0);
  c.selectStage(2);const q=c.getPlanProps();c.selectStage(4);c.selectStage(2);
  assert.throws(()=>q.demoInteractions.choice.choose({decisionId:'maya-card-treatments',choice:'approved'}),{status:403});
  assert.deepEqual(c.getSnapshot().view.decisions,[]);
});
test('a retired unconsumed result cannot strand a fresh displayed context',t=>{
  const c=createMayaDemoController({initialStage:3});t.after(c.dispose);open(c);const old=c.getPlanProps();
  const pending=old.demoInteractions.use.report(captured(c));c.selectStage(2);
  const fresh=c.getPlanProps();commit(fresh,fresh.demoInteractions.choice.choose({decisionId:'maya-card-treatments',choice:'declined'}));
  const before=c.getSnapshot();old.onViewChange(pending.view);assert.equal(c.getSnapshot(),before);
  assert.equal(c.getSnapshot().view.decisions[0].choice,'declined');
});
test('a captured selected-product capability cannot report another product or publication',t=>{
  const c=createMayaDemoController({initialStage:3});t.after(c.dispose);open(c);const p=c.getPlanProps(),input=captured(c);
  assert.throws(()=>p.demoInteractions.use.report(captured(c,'cerave-pm')),/sample use target changed/);
  assert.throws(()=>p.demoInteractions.use.report({...input,sourcePublication:{version:2,documentSchemaVersion:3}}),/sample publication changed/);
  assert.equal(c.getSnapshot().exampleReports.length,0);
});
test('pause and stop need no identity answer, and an added sample product supplies no Start',t=>{
  const c=createMayaDemoController({initialStage:3});t.after(c.dispose);open(c,'cerave-pm');
  edit(c,'what changed?','paused');edit(c,'when did this happen?','unknown');submit(c);
  assert.equal(c.getSnapshot().view.use.planProducts.find(s=>s.product.productId==='cerave-pm').state,'paused');
  c.navigate({name:'report-use',routine:'evening'});edit(c,'product name','visitor sample bottle');edit(c,'when did this happen?','unknown');submit(c);
  const row=c.getSnapshot().view.use.reportedProducts.items[0];assert.equal(row.state,'unreviewed');assert.deepEqual(row.originalStart,{state:'unknown'});assert.equal(row.latestEvent.changeKind,'unreviewed_added');
});
test('all three shared choices still work after follow-up without altering advice or actual use',t=>{
  const c=createMayaDemoController({initialStage:3});t.after(c.dispose);c.reportExample('stopped-unknown');c.selectStage(4);c.selectStage(2);
  const advice=structuredClone(c.getSnapshot().view.plan),use=structuredClone(c.getSnapshot().view.use);
  for(const [label,want] of [['approve product','approved'],['decide later','deferred'],['decline','declined']]){
    click(c,label);assert.equal(c.getSnapshot().view.decisions[0].choice,want);assert.match(render(c),/demo choice updated/);
    assert.deepEqual(c.getSnapshot().view.use,use);assert.deepEqual(c.getSnapshot().view.plan,advice);
  }
});
for(const action of ['use','choice'])test('reentrant reset during '+action+' completion cannot restore old memory',t=>{
  const c=createMayaDemoController({initialStage:action==='use'?3:2}),other=createMayaDemoController();t.after(c.dispose);t.after(other.dispose);
  if(action==='use'){open(c);click(c,'yes');}
  const old=c.getPlanProps(),otherBefore=other.getSnapshot();let reset=false;
  const unsub=c.subscribe(()=>{if(!reset&&(c.getSnapshot().exampleReports.length||c.getSnapshot().view.decisions.length)){reset=true;c.reset();}});t.after(unsub);
  if(action==='use')submit(c);else click(c,'approve product');
  assert.equal(reset,true);assert.equal(old.session.isCurrent(),false);assert.equal(c.getSnapshot().generation,1);
  assert.deepEqual(c.getSnapshot().exampleReports,[]);assert.deepEqual(c.getSnapshot().view.decisions,[]);assert.equal(other.getSnapshot(),otherBefore);
});
test('reset/dispose retire captured field, submit, choice and Back callbacks while another demo survives',t=>{
  const c=createMayaDemoController({initialStage:3}),other=createMayaDemoController();t.after(c.dispose);t.after(other.dispose);
  c.navigate({name:'product',productId:'cerave-pm',routine:'morning'});open(c,'cerave-pm');click(c,'yes');edit(c,'what changed?','different');
  render(c);const field=fields.find(f=>f.label==='how are you using it differently?').children.props.onChange,send=forms[0].onSubmit,back=button('back to product').onClick,old=c.getPlanProps();
  c.reset();const fresh=c.getSnapshot(),otherBefore=other.getSnapshot();field({target:{value:'old sample note'}});send({preventDefault(){}});assert.throws(()=>back({}),{status:403});old.onViewChange(old.view);
  assert.equal(c.getSnapshot(),fresh);assert.equal(other.getSnapshot(),otherBefore);assert.equal(old.session.memory.get('anything'),undefined);
  c.selectStage(2);render(c);const choice=button('approve product').onClick;c.dispose();choice({});assert.equal(c.getSnapshot().view.decisions.length,0);
});
test('captured guide and sample-control callbacks cannot mutate the fresh demo after reset',t=>{
  const c=createMayaDemoController({initialStage:3});t.after(c.dispose);render(c);
  const callbacks=['try sample use form','try sample receipt','try sample start · date unknown','try sample stop · date unknown','next','exit guide'].map(label=>button(label).onClick);
  c.reset();const fresh=c.getSnapshot();
  for(const callback of callbacks){assert.throws(()=>callback({preventDefault(){},stopPropagation(){}}),{status:403});assert.equal(c.getSnapshot(),fresh);}
});
test('all stages permit only exact local images while deliberate shared interactions cause zero network/cookie/storage/UUID effects',t=>{
  let effects=0;const denied=()=>{effects++;throw Error('effect outside demo memory');};
  const fetch=globalThis.fetch,random=crypto.randomUUID,values=crypto.getRandomValues;
  const names=['localStorage','sessionStorage','indexedDB'],descriptors=names.map(n=>Object.getOwnPropertyDescriptor(globalThis,n)),doc=Object.getOwnPropertyDescriptor(globalThis,'document');
  globalThis.fetch=denied;crypto.randomUUID=denied;crypto.getRandomValues=denied;
  for(const n of names)Object.defineProperty(globalThis,n,{configurable:true,get:denied});
  Object.defineProperty(globalThis,'document',{configurable:true,value:Object.defineProperty({},'cookie',{get:denied,set:denied})});
  const c=createMayaDemoController();
  try{
    for(let i=1;i<=5;i++){c.selectStage(i);assertMayaStaticImages(render(c),{required:i<5});}
    c.selectStage(3);click(c,'try sample use form');click(c,'yes');edit(c,'what changed?','started_earlier');edit(c,'when did this happen?','unknown');submit(c);
    c.selectStage(4);c.selectStage(2);click(c,'approve product');click(c,'decline');c.replay();c.explore();c.reopen();c.reset();c.dispose();assert.equal(effects,0);
  }finally{c.dispose();globalThis.fetch=fetch;crypto.randomUUID=random;crypto.getRandomValues=values;names.forEach((n,i)=>descriptors[i]?Object.defineProperty(globalThis,n,descriptors[i]):delete globalThis[n]);if(doc)Object.defineProperty(globalThis,'document',doc);else delete globalThis.document;}
});
test('public emitted module closure contains no live factory, endpoint or effectful transport',async()=>{
  const {inputs,code}=await sourceModule('src/features/walkthrough/maya/index.ts');
  assert.equal(inputs.some(p=>/\/app\/|session-integration|\/server\/|backend\/|supabase\//.test(p)),false);
  assert.doesNotMatch(code,/createApplicationSession|createSessionTransport|createCookieOperationPort|createCookieRequestFactory|document\.cookie|\/api\/|fetch\(/);
  // Immutable 3bd public-input fingerprints; regular tests need no historical
  // Git object in a shallow checkout. Full old/current compiler is separate.
  const approved={
    // Historical no-image fixture: 2074fb7f120461fee619159180d0d7dfbcd0822345cd715d15ddddf490c19819.
    // Image successor uses only existing canonical assets/<basename> paths.
    'fixture.ts':'ae452056969baccbb34d6fbb9934d80a6465fb0546e7d9b680161baee3f52083',
    'images.ts':'76762196709b90c118fa016e8c44889b746257f947a425bed0fa2e52c97d5014',
    'model.ts':'b8af3631bdac6875c306495775eda66d3d3884d450ef4862fd641484b3d3160b',
    'maya.css':'6cdb2064162ef35aab8b1f08da1c7b95dd0f6ef04f51a5f0b089998c84b89112',
    'public-source.d.ts':'cf789c309c965a1222d671d7192afc3970898e7263526831fc2842406728788e',
    'index.ts':'747f8ad964c23f2ebef651afba6b3c43b388f36c78933acebad9bb74baffd0c9',
  };
  for(const [n,expected] of Object.entries(approved)){
    assert.equal(createHash('sha256').update(readFileSync(new URL('../src/features/walkthrough/maya/'+n,import.meta.url))).digest('hex'),expected);
  }
});
