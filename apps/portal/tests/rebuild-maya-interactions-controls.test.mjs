import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {sourceModule} from './rebuild-maya-five-stage-build.mjs';

// Observe actual shared elements and invoke their original callbacks. No hook,
// control, currentness predicate or successful live operation is substituted.
const require=createRequire(import.meta.url),runtime=require('react/jsx-runtime');
const original={jsx:runtime.jsx,jsxs:runtime.jsxs};
let buttons=[],fields=[],forms=[];
const text=value=>typeof value==='string'||typeof value==='number'?String(value):Array.isArray(value)?value.map(text).join(''):value?.props?text(value.props.children):'';
for(const key of ['jsx','jsxs'])runtime[key]=(type,props,...rest)=>{
  if(type==='button')buttons.push({label:text(props.children),props});
  if(type==='form')forms.push(props);
  if(typeof type==='function'&&type.name==='Field')fields.push(props);
  return original[key](type,props,...rest);
};
after(()=>{for(const key of ['jsx','jsxs'])runtime[key]=original[key];});
const {exports:{createMayaDemoController,renderMaya}}=await sourceModule('tests/rebuild-maya-five-stage-ssr.ts');
function render(c){buttons=[];fields=[];forms=[];return renderMaya(c);}
function button(label){const found=buttons.filter(b=>b.label===label);assert.equal(found.length,1,'one actual shared button: '+label);assert.equal(found[0].props['data-slot'],'button');return found[0].props;}
function click(c,label){render(c);const p=button(label);assert.equal(!!p.disabled,false,label+' enabled');p.onClick({preventDefault(){},stopPropagation(){}});}
function edit(c,label,value){render(c);const found=fields.filter(f=>f.label===label);assert.equal(found.length,1,'one shared field: '+label);const p=found[0].children.props;if(p.onValueChange)p.onValueChange(value);else p.onChange({target:{value}});}
function submit(c){render(c);assert.equal(forms.length,1,'actual shared use form is available');forms[0].onSubmit({preventDefault(){}});}
function use(c,id='ordinary-azelaic-10'){c.navigate({name:'product-use',productId:id,routine:'evening'});}
const state=(c,id='ordinary-azelaic-10')=>c.getSnapshot().view.use.planProducts.find(p=>p.product.productId===id);

test('public Maya exposes the actual shared use form without becoming a client',t=>{
  const c=createMayaDemoController({initialStage:3});t.after(c.dispose);use(c);
  const html=render(c);assert.equal(forms.length,1,'actual shared use form is available');
  assert.match(html,/what changed\?/);assert.match(html,/is this your product\?/);
  assert.equal(c.getPlanProps().mode,'public-demo');assert.equal(c.getPlanProps().ports,undefined);
});
test('shared choices remain usable after a preset and the follow-up sample',t=>{
  const c=createMayaDemoController({initialStage:3});t.after(c.dispose);c.reportExample('started-unknown');c.selectStage(4);c.back();c.back();
  const html=render(c);assert.match(html,/>approve product</);assert.doesNotMatch(html,/reset demo to try choices/);
  const before=structuredClone(c.getSnapshot().view.use);click(c,'decide later');
  assert.equal(c.getSnapshot().view.decisions.find(d=>d.decisionId==='maya-card-treatments')?.choice,'deferred');
  assert.deepEqual(c.getSnapshot().view.use,before,'choice never creates use');
});
test('shared form reports an unknown Start and a product-bound stop in demo memory',t=>{
  const c=createMayaDemoController({initialStage:3});t.after(c.dispose);use(c);click(c,'yes');
  edit(c,'what changed?','started_earlier');edit(c,'when did this happen?','unknown');edit(c,'how did you get it?','self');submit(c);
  assert.equal(state(c).state,'using');assert.deepEqual(state(c).originalStart,{state:'unknown'});
  assert.equal(c.getSnapshot().exampleReports.at(-1).acquisition,'self');assert.deepEqual(c.getSnapshot().view.actualUse,[]);
  assert.match(render(c),/demo use updated/);assert.doesNotMatch(render(c),/use report recorded/);
  use(c,'cerave-pm');edit(c,'what changed?','stopped');edit(c,'when did this happen?','unknown');submit(c);
  assert.equal(state(c,'cerave-pm').state,'stopped');assert.equal(state(c).state,'using');
  assert.equal(c.getSnapshot().exampleReports.at(-1).product.productId,'cerave-pm');
});

test('shared form uses the declared sample day and preserves the first Start through pause and restart',t=>{
  const c=createMayaDemoController({initialStage:3});t.after(c.dispose);use(c);click(c,'yes');
  edit(c,'what changed?','started_earlier');edit(c,'when did this happen?','earlier');edit(c,'actual date','2026-10-29');submit(c);
  assert.deepEqual(state(c).originalStart,{state:'known',value:'2026-10-29'});
  edit(c,'what changed?','paused');edit(c,'when did this happen?','unknown');submit(c);assert.equal(state(c).state,'paused');
  edit(c,'what changed?','started_today');submit(c);
  assert.deepEqual(c.getSnapshot().exampleReports.at(-1).occurredOn,{state:'known',value:'2026-11-03'});
  assert.deepEqual(state(c).originalStart,{state:'known',value:'2026-10-29'});
  assert.match(render(c),/sample today: 2026-11-03/);
});
test('shared changed-use fields retain user-entered details without changing authored advice',t=>{
  const c=createMayaDemoController({initialStage:3});t.after(c.dispose);const advice=structuredClone(c.getSnapshot().view.plan);
  use(c,'cerave-pm');click(c,'yes');edit(c,'what changed?','different');edit(c,'when did this happen?','unknown');
  edit(c,'frequency (if known)','some evenings');edit(c,'amount (if known)','a small amount');edit(c,'how are you using it differently?','using a little less in this sample');submit(c);
  assert.equal(state(c,'cerave-pm').state,'using_differently');
  assert.deepEqual(c.getSnapshot().exampleReports.at(-1).change,{kind:'different',frequency:{state:'known',value:'some evenings'},amount:{state:'known',value:'a small amount'},details:'using a little less in this sample'});
  assert.deepEqual(c.getSnapshot().view.plan,advice);
});
test('a mismatch uses the shared descriptor fields and never activates the recommended product',t=>{
  const c=createMayaDemoController({initialStage:3});t.after(c.dispose);use(c);click(c,'no');
  edit(c,'product name','visitor-entered sample product');edit(c,'what changed?','started_earlier');edit(c,'when did this happen?','unknown');submit(c);
  assert.equal(state(c).state,'not_reported');assert.equal(c.getSnapshot().view.use.reportedProducts.items.length,1);
  const row=c.getSnapshot().view.use.reportedProducts.items[0];assert.equal(row.descriptor.name,'visitor-entered sample product');assert.equal(row.state,'unreviewed');
  assert.deepEqual(row.descriptor.variant,{state:'unknown'});assert.deepEqual(row.originalStart,{state:'unknown'});
  assert.equal(row.identity.match,'no');assert.equal(row.identity.target.comparedWith.productId,'ordinary-azelaic-10');
  assert.deepEqual(c.getSnapshot().view.actualUse,[]);
});
test('shared validation retains invalid answers until corrected and records nothing',t=>{
  const c=createMayaDemoController({initialStage:3});t.after(c.dispose);use(c);submit(c);
  assert.equal(c.getSnapshot().exampleReports.length,0);
  click(c,'yes');edit(c,'what changed?','started_earlier');edit(c,'when did this happen?','earlier');edit(c,'actual date','2026-02-30');submit(c);
  render(c);assert.equal(fields.find(f=>f.label==='actual date').children.props.value,'2026-02-30');assert.equal(c.getSnapshot().exampleReports.length,0);
  edit(c,'actual date','2026-11-04');submit(c);assert.equal(c.getSnapshot().exampleReports.length,0);
  edit(c,'actual date','2026-10-31');submit(c);assert.equal(c.getSnapshot().exampleReports.length,1);
});
test('actual product Back preserves unsent sample form values and exact product binding',t=>{
  const c=createMayaDemoController({initialStage:3});t.after(c.dispose);
  c.navigate({name:'product',productId:'cerave-pm',routine:'evening'});use(c,'cerave-pm');
  click(c,'yes');edit(c,'what changed?','different');edit(c,'how are you using it differently?','unsent public sample note');
  click(c,'back to product');assert.equal(c.getSnapshot().route.name,'product');assert.equal(c.getSnapshot().route.productId,'cerave-pm');
  use(c,'cerave-pm');render(c);assert.equal(fields.find(f=>f.label==='how are you using it differently?').children.props.value,'unsent public sample note');
  assert.equal(c.getSnapshot().exampleReports.length,0);submit(c);assert.equal(c.getSnapshot().exampleReports.at(-1).product.productId,'cerave-pm');
});
test('captured form submit after reset cannot mutate fresh memory or another demo',t=>{
  const c=createMayaDemoController({initialStage:3}),other=createMayaDemoController({initialStage:3});t.after(c.dispose);t.after(other.dispose);
  use(c);click(c,'yes');render(c);assert.equal(forms.length,1);const oldSubmit=forms[0].onSubmit,old=c.getPlanProps();
  c.reset();const fresh=c.getSnapshot(),otherBefore=other.getSnapshot();oldSubmit({preventDefault(){}});
  assert.equal(c.getSnapshot(),fresh);assert.equal(other.getSnapshot(),otherBefore);assert.equal(old.session.isCurrent(),false);
  assert.equal(c.getSnapshot().exampleReports.length,0);
});
