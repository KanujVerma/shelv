import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {build} from 'esbuild';

// Observe the real returned JSX and native callbacks, without replacing hooks,
// currentness predicates, controls or any successful operation.
const require=createRequire(import.meta.url),runtime=require('react/jsx-runtime');
const original={jsx:runtime.jsx,jsxs:runtime.jsxs};let buttons=[],fields=[],textareas=[],boundaries=[];
const text=value=>typeof value==='string'||typeof value==='number'?String(value):Array.isArray(value)?value.map(text).join(''):value?.props?text(value.props.children):'';
for(const key of ['jsx','jsxs'])runtime[key]=(type,props,...rest)=>{
  if(type==='button')buttons.push({label:text(props.children),props});
  if(typeof type==='function'&&type.name==='Field')fields.push(props);
  if(type==='textarea')textareas.push(props);
  if(typeof type==='function'&&type.name==='DecisionReviewBoundary')boundaries.push(props.props);
  return original[key](type,props,...rest);
};
after(()=>Object.assign(runtime,original));
const portal=new URL('../',import.meta.url),base='c02d71392db24cfb43fcbd90068e3944dd842f52';
const built=await build({absWorkingDir:portal.pathname,entryPoints:['tests/w3/maya-self-purchase-entry.ts'],bundle:true,write:false,platform:'node',format:'cjs',packages:'external',loader:{'.css':'empty'},tsconfig:'tsconfig.frontend.json',plugins:process.env.W3_MAYA_ENTRY_OLD==='1'?[{name:'exact-owned-base-files',setup(builder){builder.onLoad({filter:/features\/plan\/(?:ClientPlan\.tsx|DecisionControls\.tsx|useEntry\.ts)$/},args=>({contents:execFileSync('git',['show',base+':apps/portal/'+path.relative(portal.pathname,args.path)],{cwd:portal,encoding:'utf8'}),loader:args.path.endsWith('tsx')?'tsx':'ts',resolveDir:path.dirname(args.path)}));}}]:[]});
const module={exports:{}};new Function('require','module','exports',built.outputFiles[0].text)(require,module,module.exports);
const {createMayaDemoController,renderMaya,renderSharedPlan,selfPurchaseAcquisition,captureUse}=module.exports;
function show(controller){buttons=[];fields=[];textareas=[];boundaries=[];return renderMaya(controller);}
function showProps(props){buttons=[];fields=[];textareas=[];boundaries=[];return renderSharedPlan(props);}
function selfButton(){return buttons.find(button=>button.label==='i’ll buy it myself');}
function acquisition(){return fields.find(field=>field.label==='how did you get it?')?.children.props.value;}
function clickSelf(){const button=selfButton();assert.ok(button,'actual shared self-purchase button');button.props.onClick({preventDefault(){},stopPropagation(){}});}
function edit(controller,label,value){show(controller);const field=fields.find(field=>field.label===label);assert.ok(field,label);const props=field.children.props;if(props.onValueChange)props.onValueChange(value);else props.onChange({target:{value}});}

test('the saved approved D01 includes the independent self-purchase action',async()=>{
  const frame=await readFile(new URL('../../../docs/portal-rebuild/design/D01-503-1271.context.txt',import.meta.url),'utf8');
  assert.ok(frame.includes('label="i’ll buy it myself"'));
});

test('the isolated public controller supplies demo memory and no live plan ports',t=>{
  const controller=createMayaDemoController({initialStage:2});t.after(controller.dispose);
  const props=controller.getPlanProps();assert.equal(props.mode,'public-demo');assert.equal(props.ports,undefined);
  assert.equal(props.demoInteractions.use.kind,'demo-use');assert.equal(props.demoInteractions.choice.kind,'demo-choice');
  assert.equal(props.session.isCurrent(),true);assert.match(show(controller),/fictional staged sample/);
});

test('the actual shared public recommendation enters exact-product self-purchase UI without recording anything',t=>{
  const controller=createMayaDemoController({initialStage:2});t.after(controller.dispose);
  const before=structuredClone(controller.getSnapshot());show(controller);
  const action=selfButton();assert.ok(action,'approved D01 self-purchase action is present in the actual shared renderer');
  assert.equal(action.props['data-slot'],'button');assert.equal(!!action.props.disabled,false);
  action.props.onClick({preventDefault(){},stopPropagation(){}});
  const after=controller.getSnapshot();assert.deepEqual(after.route,{name:'product-use',productId:'ordinary-azelaic-10',routine:'morning'});
  assert.deepEqual(after.view,before.view);assert.deepEqual(after.exampleReports,before.exampleReports);assert.equal(after.exampleReceipt,before.exampleReceipt);
  const html=show(controller);assert.match(html,/sample use form/);assert.equal(acquisition(),'self');
  assert.equal(controller.getPlanProps().ports,undefined);
  controller.backPlan();assert.deepEqual(controller.getSnapshot().route,before.route);assert.equal(controller.getSnapshot().stage,2);
});

test('each purchase decision uses its own exact primary product and keeps all reported use unchanged',t=>{
  const controller=createMayaDemoController({initialStage:2});t.after(controller.dispose);
  const content=controller.getSnapshot().view.plan.content;
  const decisions=content.decisions.filter(decision=>decision.primaryProductId&&['addition','replace','finish_then_replace','optional_alternative'].includes(decision.kind));
  assert.ok(decisions.length>1);
  for(const decision of decisions){
    controller.navigate({name:'recommendation',decisionId:decision.id,routine:'evening'});const before=structuredClone(controller.getSnapshot().view);
    show(controller);clickSelf();assert.deepEqual(controller.getSnapshot().route,{name:'product-use',productId:decision.primaryProductId,routine:'evening'});
    show(controller);assert.equal(acquisition(),'self');assert.deepEqual(controller.getSnapshot().view,before);
  }
});

test('nonpurchase sample decisions never gain a self-purchase action',t=>{
  const controller=createMayaDemoController({initialStage:2});t.after(controller.dispose);
  for(const decision of controller.getSnapshot().view.plan.content.decisions.filter(decision=>['keep','pause','leave_out','no_addition'].includes(decision.kind))){
    controller.navigate({name:'recommendation',decisionId:decision.id,routine:'morning'});show(controller);assert.equal(selfButton(),undefined);
  }
});

test('public entry never delegates a supplied live client callback or executes demo read/decision operations',t=>{
  const controller=createMayaDemoController({initialStage:2});t.after(controller.dispose);
  const props=controller.getPlanProps();let calls=0;
  for(const port of [props.demoPorts.read,props.demoPorts.decision]){const execute=port.execute;port.execute=(...args)=>{calls++;return execute(...args);};}
  const refuse=()=>{calls++;throw Error('live operation was attempted');};
  const liveCallback=()=>{calls++;throw Error('live callback was delegated');};
  showProps({...props,ports:{read:{execute:refuse},decision:{execute:refuse},care:{execute:refuse}},onSelfPurchase:liveCallback});
  assert.equal(boundaries.length,1);assert.notEqual(boundaries[0].onSelfPurchase,liveCallback,'caller live callback is not forwarded into the public rendering boundary');clickSelf();
  assert.equal(calls,0);assert.deepEqual(controller.getSnapshot().route,{name:'product-use',productId:'ordinary-azelaic-10',routine:'morning'});
  show(controller);assert.equal(acquisition(),'self');
});

for(const mode of ['advisor-preview','historical','private-walkthrough'])test(mode+' cannot acquire the public sample entry',t=>{
  const controller=createMayaDemoController({initialStage:2});t.after(controller.dispose);let calls=0;
  showProps({...controller.getPlanProps(),mode,onSelfPurchase(){calls++;}});
  assert.equal(selfButton(),undefined);assert.equal(calls,0);
});

for(const fault of ['interactions','navigation','view-change','use-kind','choice-kind','read-only','legacy-view','stale-context'])test('public entry refuses missing or retired '+fault,t=>{
  const controller=createMayaDemoController({initialStage:2});t.after(controller.dispose);const props=controller.getPlanProps();
  if(fault==='interactions')props.demoInteractions=undefined;
  if(fault==='navigation')props.navigation=undefined;
  if(fault==='view-change')props.onViewChange=undefined;
  if(fault==='use-kind')props.demoInteractions={...props.demoInteractions,use:{...props.demoInteractions.use,kind:'not-a-demo-use'}};
  if(fault==='choice-kind')props.demoInteractions={...props.demoInteractions,choice:{...props.demoInteractions.choice,kind:'not-a-demo-choice'}};
  if(fault==='read-only')props.view={...props.view,access:'read_only'};
  if(fault==='legacy-view'){const {use,latestPublicReview,...legacy}=props.view;props.view={...legacy,schemaVersion:1};}
  if(fault==='stale-context')controller.navigate({name:'plan',routine:'evening'});
  let calls=0;showProps({...props,onSelfPurchase(){calls++;}});assert.equal(selfButton(),undefined);assert.equal(calls,0);
});

for(const retirement of ['reset','dispose'])test('captured entry refuses after real demo '+retirement,t=>{
  const controller=createMayaDemoController({initialStage:2});t.after(controller.dispose);show(controller);
  const action=selfButton();assert.ok(action);controller[retirement]();const before=structuredClone(controller.getSnapshot());
  action.props.onClick({preventDefault(){},stopPropagation(){}});assert.deepEqual(controller.getSnapshot(),before);
});

test('retirement during the real memory set prevents navigation and clears the old seed',t=>{
  const controller=createMayaDemoController({initialStage:2});t.after(controller.dispose);const props=controller.getPlanProps();
  const memory=props.session.memory;let written=false;
  const observed={...props,session:{...props.session,memory:{...memory,set(key,value){memory.set(key,value);written=true;controller.reset();}}}};
  showProps(observed);clickSelf();assert.equal(written,true);assert.equal(controller.getSnapshot().stage,1);assert.equal(controller.getSnapshot().route.name,'plan');
  controller.navigate({name:'product-use',productId:'ordinary-azelaic-10',routine:'morning'});show(controller);assert.equal(acquisition(),'unknown');
});

test('same-lease context replacement during staging cannot prefill the fresh form',t=>{
  const controller=createMayaDemoController({initialStage:2});t.after(controller.dispose);const props=controller.getPlanProps(),memory=props.session.memory;
  const observed={...props,session:{...props.session,memory:{...memory,set(key,value){memory.set(key,value);controller.navigate({name:'product-use',productId:'ordinary-azelaic-10',routine:'morning'});}}}};
  showProps(observed);clickSelf();assert.equal(props.session.isCurrent(),true,'lease alone is still current');assert.equal(props.demoInteractions.use.isCurrent(),false,'old view/route context retired');
  show(controller);assert.equal(acquisition(),'unknown');assert.equal(controller.getSnapshot().exampleReports.length,0);
});

test('abandoning the outer staged entry never removes a reentrant replacement',t=>{
  const controller=createMayaDemoController({initialStage:2});t.after(controller.dispose);const props=controller.getPlanProps(),memory=props.session.memory;let entered=false,callback;
  const observed={...props,session:{...props.session,memory:{...memory,set(key,value){memory.set(key,value);if(!entered){entered=true;callback({preventDefault(){},stopPropagation(){}});}}}}};
  showProps(observed);const action=selfButton();assert.ok(action);callback=action.props.onClick;callback({preventDefault(){},stopPropagation(){}});
  assert.equal(entered,true);show(controller);assert.equal(acquisition(),'self');assert.equal(controller.getSnapshot().exampleReports.length,0);
});

test('an unsent sample form takes precedence over the later entry seed',t=>{
  const controller=createMayaDemoController({initialStage:3});t.after(controller.dispose);
  controller.navigate({name:'product-use',productId:'ordinary-azelaic-10',routine:'evening'});
  edit(controller,'what changed?','different');edit(controller,'how are you using it differently?','retained fictional sample note');
  controller.navigate({name:'recommendation',decisionId:'maya-card-treatments',routine:'evening'});show(controller);clickSelf();
  show(controller);assert.equal(acquisition(),'unknown');assert.ok(textareas.some(area=>area.value==='retained fictional sample note'));
  assert.equal(controller.getSnapshot().exampleReports.length,0);
});

test('a retained uncertain UI intent wins without creating or retrying an operation',t=>{
  const controller=createMayaDemoController({initialStage:3});t.after(controller.dispose);
  controller.navigate({name:'product-use',productId:'ordinary-azelaic-10',routine:'evening'});show(controller);
  buttons.find(button=>button.label==='yes').props.onClick({});edit(controller,'what changed?','different');edit(controller,'how are you using it differently?','retained uncertain sample note');
  const props=controller.getPlanProps(),key=`care-use:${props.session.key}:ordinary-azelaic-10`,intent=props.session.memory.get(key);
  const product=props.view.use.planProducts.find(row=>row.product.productId==='ordinary-azelaic-10').product;
  // Source-only UI-state fixture, not a fabricated Care ACK or persisted event.
  const capture=captureUse(intent.form,product,product.publication,'2026-11-03');
  const retained={...intent,flow:{capture,steps:['use'],index:0,subject:product,identityId:null,receipts:[],pending:null,phase:'uncertain'}};
  props.session.memory.set(key,retained);controller.navigate({name:'recommendation',decisionId:'maya-card-treatments',routine:'evening'});show(controller);clickSelf();
  assert.equal(controller.getPlanProps().session.memory.get(key),retained);const html=show(controller);assert.match(html,/report result uncertain/);
  assert.equal(acquisition(),'unknown');assert.ok(textareas.some(area=>area.value==='retained uncertain sample note'));assert.equal(controller.getSnapshot().exampleReports.length,0);
});

test('demo reset clears the self-purchase entry without changing the source plan',t=>{
  const controller=createMayaDemoController({initialStage:2});t.after(controller.dispose);const source=structuredClone(controller.getSnapshot().view.plan);
  show(controller);clickSelf();show(controller);assert.equal(acquisition(),'self');controller.reset();
  controller.navigate({name:'product-use',productId:'ordinary-azelaic-10',routine:'morning'});show(controller);assert.equal(acquisition(),'unknown');
  assert.deepEqual(controller.getSnapshot().view.plan,source);assert.equal(controller.getSnapshot().exampleReports.length,0);
});

test('stale publication, schema, decision and product entry records do not prefill the sample form',t=>{
  const controller=createMayaDemoController({initialStage:2});t.after(controller.dispose);show(controller);clickSelf();
  const props=controller.getPlanProps(),key=`care-self-purchase:${props.session.key}:ordinary-azelaic-10`,entry=props.session.memory.get(key);
  assert.ok(entry);show(controller);assert.equal(acquisition(),'self');
  for(const change of [{version:2},{documentSchemaVersion:2},{decisionId:'maya-card-sunscreen'},{productId:'cerave-pm'}]){
    props.session.memory.set(key,{...entry,...change});show(controller);assert.equal(acquisition(),'unknown');
  }
  props.session.memory.set(key,entry);show(controller);assert.equal(acquisition(),'self');
});

test('real retirement during the public entry-memory read cannot return old acquisition',t=>{
  const controller=createMayaDemoController({initialStage:2});t.after(controller.dispose);show(controller);clickSelf();
  const props=controller.getPlanProps(),product=props.view.use.planProducts.find(row=>row.product.productId==='ordinary-azelaic-10').product;
  const memory=props.session.memory;let read=false;
  const observed={...props,session:{...props.session,memory:{...memory,get(key){const value=memory.get(key);read=true;controller.reset();return value;}}}};
  assert.equal(selfPurchaseAcquisition(observed,product),null);assert.equal(read,true);assert.equal(controller.getSnapshot().stage,1);
});

test('an owned old-generation entry cannot be replayed into a reset lease',t=>{
  const controller=createMayaDemoController({initialStage:2});t.after(controller.dispose);show(controller);clickSelf();
  const old=controller.getPlanProps(),entry=old.session.memory.get(`care-self-purchase:${old.session.key}:ordinary-azelaic-10`);assert.ok(entry);
  controller.reset();controller.navigate({name:'product-use',productId:'ordinary-azelaic-10',routine:'morning'});
  const fresh=controller.getPlanProps();fresh.session.memory.set(`care-self-purchase:${fresh.session.key}:ordinary-azelaic-10`,entry);
  show(controller);assert.equal(acquisition(),'unknown');
});

test('equal public session keys do not allow an owned entry to cross controllers',t=>{
  const first=createMayaDemoController({initialStage:2}),second=createMayaDemoController({initialStage:3});t.after(first.dispose);t.after(second.dispose);
  show(first);clickSelf();const a=first.getPlanProps(),entry=a.session.memory.get(`care-self-purchase:${a.session.key}:ordinary-azelaic-10`);assert.ok(entry);
  second.navigate({name:'product-use',productId:'ordinary-azelaic-10',routine:'morning'});const b=second.getPlanProps();assert.equal(a.session.key,b.session.key);
  b.session.memory.set(`care-self-purchase:${b.session.key}:ordinary-azelaic-10`,entry);show(second);assert.equal(acquisition(),'unknown');
});

test('current public form consumption still checks the exact product publication and schema',t=>{
  const controller=createMayaDemoController({initialStage:2});t.after(controller.dispose);show(controller);clickSelf();const props=controller.getPlanProps();
  const product=props.view.use.planProducts.find(row=>row.product.productId==='ordinary-azelaic-10').product;
  assert.equal(selfPurchaseAcquisition(props,product),'self');
  assert.equal(selfPurchaseAcquisition(props,{...product,publication:{...product.publication,version:2}}),null);
  assert.equal(selfPurchaseAcquisition(props,{...product,publication:{...product.publication,documentSchemaVersion:2}}),null);
  assert.equal(selfPurchaseAcquisition(props,{...product,productId:'cerave-pm'}),null);
});
