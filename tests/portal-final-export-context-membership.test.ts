import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createHash} from 'node:crypto';
import type {PlanContent,PlanDecision} from '../src/contracts/PortalRebuild.ts';
import type {FinalExportRecord} from '../src/contracts/PortalFinalExport.ts';
import {projectClientPlan} from '../src/contracts/PortalRebuild.ts';
import {readPlanContent} from '../src/contracts/PortalRebuildValidation.ts';
import {assertFinalExportRecord} from '../src/contracts/PortalFinalExportValidation.ts';
import {collectFinalExport} from '../src/contracts/PortalFinalExportMapping.ts';
import {serializeFinalExport,createFinalExportHtmlSink} from '../supabase/functions/concierge-final-export/serializer.ts';
import {finalExportFixture,finalExportWire} from './portal-final-export-fixtures.ts';

globalThis.fetch=async()=>{throw Error('external_fetch_denied');};
function draft():PlanContent{
 const r=finalExportFixture();if(r.plan.documentSchemaVersion!==3)throw Error('fixture');
 const c=r.plan.content,first=c.products[0];if(!first)throw Error('fixture');
 return {...c,products:[structuredClone(first),{...structuredClone(first),id:'product-2',name:'Second Distinct Lotion',variant:'second public variant'}],context:{products:{state:'recorded',productIds:['product-1']},facts:[
  {id:'fact-1',kind:'client_report',visibility:'client',text:'FIRST_PUBLIC_CONTEXT',sources:[],contradicts:[]},
  {id:'fact-2',kind:'advisor_conclusion',visibility:'client',text:'SECOND_PUBLIC_CONTEXT',sources:[],contradicts:[]}
 ]},goals:[{id:'goal-1',text:'comfort',factIds:[]},{id:'goal-2',text:'even-looking tone',factIds:[]}]};
}
function decision():PlanDecision{return {id:'decision-1',slotId:'decision-slot',recommendationId:null,kind:'optional_alternative',goalIds:[],currentProductIds:['product-1'],primaryProductId:'product-2',alternativeProductIds:[],reason:'reviewed reason',directions:[],cautions:[],limitations:[],schedule:null,factIds:[],guidance:{title:'published choice',subtitle:'',rationaleTitle:'',reasons:[],actions:[],comparisons:[],factsTitle:'',facts:[],how:null,sources:[],group:null,decisionLabels:null}};}
function publicRecord(c:PlanContent,withInstructions=true):FinalExportRecord{
 const r=finalExportFixture();readPlanContent(c);r.plan={documentSchemaVersion:3,content:projectClientPlan(c)};
 r.use=c.products.map(p=>({productId:p.id,state:'not_reported',originalStart:{state:'unknown'},occurredOn:{state:'unknown'},details:null,frequency:null,amount:null,contradiction:false}));
 if(!withInstructions)r.instructions=[];assertFinalExportRecord(r);return r;
}
const normalizeIntroduction=(s:string)=>s.replace('current applicable instructions below supersede','applicable instructions below supersede');
const H=(s:string)=>createHash('sha256').update(s).digest('hex');
async function render(c:PlanContent,caseName:string){
 const record=publicRecord(c),wire=finalExportWire(record);let text='',html='',commits=0,aborts=0;
 const sink=createFinalExportHtmlSink({write:async chunk=>{text+=chunk.text;html+=chunk.html;},commit:async()=>{commits++;return 'complete';},abort:async()=>{aborts++;text='';html='';}});
 const result=await collectFinalExport(wire.read,sink),direct=serializeFinalExport(record);
 assert.equal(result.commitResult,'complete');assert.equal(commits,1);assert.equal(aborts,0);
 assert.equal(normalizeIntroduction(direct.text),text);assert.equal(normalizeIntroduction(direct.html),html);
 console.log(JSON.stringify({caseName,rootHash:wire.manifest.rootHash,totalBytes:wire.manifest.totalBytes,partCount:wire.manifest.partCount,commits,aborts,textBytes:Buffer.byteLength(text),htmlBytes:Buffer.byteLength(html),textSha256:H(text),htmlSha256:H(html),directTextSha256:H(direct.text),directHtmlSha256:H(direct.html)}));
 return {text,html,direct,record,manifest:wire.manifest};
}
function differ(a:Awaited<ReturnType<typeof render>>,b:Awaited<ReturnType<typeof render>>):void{
 assert.notEqual(a.manifest.rootHash,b.manifest.rootHash);
 for(const key of ['text','html'] as const){assert.notEqual(a[key],b[key]);assert.notEqual(a.direct[key],b.direct[key]);}
}
function context(text:string):string{return text.slice(text.indexOf('reported context\ncurrent products:'),text.indexOf('\nproducts\n'));}

test('FE2: a different recorded-current set changes all four actual artifacts without relying on reported use',async()=>{
 const a=draft(),b=draft();b.context.products={state:'recorded',productIds:['product-2']};
 const x=await render(a,'membership-first'),y=await render(b,'membership-second');differ(x,y);
 for(const [output,name,other] of [[x,'CeraVe PM','Second Distinct Lotion'],[y,'Second Distinct Lotion','CeraVe PM']] as const){
  for(const text of [output.text,output.direct.text]){const section=context(text);assert.ok(section.includes('recorded current product: '+name));assert.ok(!section.includes('recorded current product: '+other));assert.ok(!section.includes('original Start:'));assert.doesNotMatch(section,/product-1|product-2/);}
 }
 assert.deepEqual(x.record.use,y.record.use);assert.deepEqual(x.record.instructions,y.record.instructions);
});

test('recorded empty, unknown and explicit none retain distinct meanings and the public none basis',async()=>{
 const recorded=draft();recorded.context.products={state:'recorded',productIds:[]};const unknown=draft();unknown.context.products={state:'unknown'};const none=draft();none.context.products={state:'none',factId:'fact-1'};
 const a=await render(recorded,'recorded-empty'),b=await render(unknown,'unknown-products'),c=await render(none,'explicit-none');differ(a,b);differ(b,c);differ(a,c);
 for(const text of [a.text,a.direct.text]){assert.ok(context(text).includes('recorded current-product list is empty'));assert.doesNotMatch(context(text),/current products: none|basis for no current products/);}
 for(const text of [b.text,b.direct.text])assert.ok(context(text).includes('current products: unknown'));
 for(const text of [c.text,c.direct.text])assert.ok(context(text).includes('basis for no current products: public context item 1'));
});

test('changing only the referenced public none basis changes the completed artifact',async()=>{
 const a=draft(),b=draft();a.context.products={state:'none',factId:'fact-1'};b.context.products={state:'none',factId:'fact-2'};differ(await render(a,'none-first-basis'),await render(b,'none-second-basis'));
});

test('membership identifies same-name products by their own public variant and brand, including an unknown name',async()=>{
 const a=draft();for(const p of a.products)p.name='Shared Lotion';const b=structuredClone(a);b.context.products={state:'recorded',productIds:['product-2']};
 const x=await render(a,'same-name-first'),y=await render(b,'same-name-second');differ(x,y);
 assert.match(context(x.text),/recorded current product: Shared Lotion.*variant: lotion/);assert.match(context(y.text),/recorded current product: Shared Lotion.*variant: second public variant/);
 const unnamed=draft(),p=unnamed.products[1];if(!p)throw Error('fixture');p.name='';p.brand='Known Brand';p.variant=null;p.sizeLabel='';unnamed.context.products={state:'recorded',productIds:['product-2']};
 const z=await render(unnamed,'unknown-name-known-brand');assert.match(context(z.text),/recorded current product: product name unknown.*Known Brand.*variant unknown.*size unknown/);
});

for(const target of ['goal','product','decision'] as const)test(`changing only a ${target}'s public context association changes all four outputs`,async()=>{
 const a=draft();a.decisions=[decision()];const b=structuredClone(a);
 const one=target==='goal'?a.goals[0]:target==='product'?a.products[0]:a.decisions[0];const two=target==='goal'?b.goals[0]:target==='product'?b.products[0]:b.decisions[0];if(!one||!two)throw Error('fixture');one.factIds=['fact-1'];two.factIds=['fact-2'];
 const x=await render(a,target+'-fact-first'),y=await render(b,target+'-fact-second');differ(x,y);
 assert.ok(x.text.includes('public context item 1: client report: FIRST_PUBLIC_CONTEXT'));assert.ok(x.text.includes('public context for this '+target+': public context item 1'));assert.ok(y.text.includes('public context for this '+target+': public context item 2'));
});

test('a published decision retains its related public goal instead of relying on the global goal list',async()=>{
 const a=draft();a.decisions=[{...decision(),goalIds:['goal-1']}];const b=structuredClone(a);const d=b.decisions[0];if(!d)throw Error('fixture');d.goalIds=['goal-2'];
 const x=await render(a,'decision-goal-first'),y=await render(b,'decision-goal-second');differ(x,y);assert.ok(x.text.includes('related goal: goal listing item 1'));assert.ok(y.text.includes('related goal: goal listing item 2'));
});

test('routine and decision product references retain variant identity independently of the flat product list',async()=>{
 const a=draft();for(const p of a.products)p.name='Shared Lotion';a.decisions=[decision()];const b=structuredClone(a),step=b.routine[0],d=b.decisions[0];if(!step||!d)throw Error('fixture');step.productId='product-2';d.currentProductIds=['product-2'];d.primaryProductId='product-1';d.alternativeProductIds=['product-2'];
 // Neither publication carries separately published instructions in this relationship control.
 async function withoutInstructions(c:PlanContent){const r=publicRecord(c,false);assertFinalExportRecord(r);let text='',html='';const sink=createFinalExportHtmlSink({write:async v=>{text+=v.text;html+=v.html;},commit:async()=>true,abort:async()=>{throw Error('unexpected abort');}});await collectFinalExport(finalExportWire(r).read,sink);const direct=serializeFinalExport(r);assert.equal(normalizeIntroduction(direct.text),text);return {text,html,direct};}
 const x=await withoutInstructions(a),y=await withoutInstructions(b);for(const key of ['text','html'] as const){assert.notEqual(x[key],y[key]);assert.notEqual(x.direct[key],y.direct[key]);}
 const routine=y.text.slice(y.text.indexOf('published routine'),y.text.indexOf('published decisions'));assert.ok(routine.includes('variant: second public variant'));
 const decisions=y.text.slice(y.text.indexOf('published decisions'));assert.match(decisions,/current: Shared Lotion.*variant: second public variant/);assert.match(decisions,/primary: Shared Lotion.*variant: lotion/);assert.match(decisions,/optional alternative: Shared Lotion.*variant: second public variant/);
});

test('a public guide product binding changes meaning even when its body and all products are identical',async()=>{
 const a=draft();a.routineGuides=[{id:'guide-1',productId:'product-1',title:'public guide',intro:'same directions',steps:[],careNote:null,sources:[]}];const b=structuredClone(a),g=b.routineGuides[0];if(!g)throw Error('fixture');g.productId='product-2';
 const x=await render(a,'guide-first-product'),y=await render(b,'guide-second-product');differ(x,y);assert.ok(x.text.includes('guide product: CeraVe PM'));assert.ok(y.text.includes('guide product: Second Distinct Lotion'));
});

test('all recorded members survive Unicode escaping without turning context into advice or Start',async()=>{
 const a=draft(),p=a.products[1];if(!p)throw Error('fixture');p.name='L’été 🧴 & Co < 3';p.variant='été "gel"';a.context.products={state:'recorded',productIds:['product-2','product-1']};
 const x=await render(a,'unicode-membership');assert.ok(context(x.text).includes('recorded current product: L’été 🧴 & Co < 3'));assert.ok(context(x.text).includes('recorded current product: CeraVe PM'));assert.ok(x.html.includes('L’été 🧴 &amp; Co &lt; 3'));assert.ok(x.html.includes('été &quot;gel&quot;'));assert.doesNotMatch(context(x.text),/original Start:|primary:|using at support end/);assert.doesNotMatch(x.html,/<script|<iframe|onerror=/);
});

test('actual public projector filters private links and downgrades a private none basis; invalid public links cannot commit',async()=>{
 const a=draft();a.context.facts.push({id:'private-fact',kind:'advisor_conclusion',visibility:'advisor_only',text:'PRIVATE_FE2_CANARY',sources:[{sourceId:'00000001-0000-4000-8000-000000000001',sourceVersion:1,locator:{kind:'whole'}}],contradicts:['fact-1']});a.context.products={state:'none',factId:'private-fact'};const g=a.goals[0],p=a.products[0];if(!g||!p)throw Error('fixture');g.factIds=['private-fact'];p.factIds=['private-fact'];a.decisions=[{...decision(),factIds:['private-fact']}];
 const x=await render(a,'private-projection');for(const output of [x.text,x.html,x.direct.text,x.direct.html])assert.doesNotMatch(output,/PRIVATE_FE2_CANARY|private-fact|sourceId|sourceVersion|contradicts|advisor_only/);assert.ok(context(x.text).includes('current products: unknown'));
 const bad=publicRecord(draft());if(bad.plan.documentSchemaVersion!==3)throw Error('fixture');bad.plan.content.context.products={state:'recorded',productIds:['not-a-product']};assert.throws(()=>serializeFinalExport(bad));let commits=0,aborts=0,output='';const sink=createFinalExportHtmlSink({write:async v=>{output+=v.text;},commit:async()=>{commits++;},abort:async()=>{aborts++;output='';}});await assert.rejects(collectFinalExport(finalExportWire(bad).read,sink));assert.equal(commits,0);assert.equal(aborts,1);assert.equal(output,'');
});

// Full public facts are printed once; item numbers are local document references,
// not invented domain identities or an alternative provenance model.
test('identical public fact text still retains its exact association through display item references',async()=>{
 const a=draft(),first=a.context.facts[0],second=a.context.facts[1],goal=a.goals[0];if(!first||!second||!goal)throw Error('fixture');second.text=first.text;second.kind=first.kind;goal.factIds=['fact-1'];const b=structuredClone(a),other=b.goals[0];if(!other)throw Error('fixture');other.factIds=['fact-2'];differ(await render(a,'identical-context-first'),await render(b,'identical-context-second'));
});

test('public guide unknown/general bindings are explicit without inventing a target from its container',async()=>{
 const a=draft(),p=a.products[0];if(!p)throw Error('fixture');p.guides=[{id:'guide-orphan',productId:'absent-public-product',title:'orphan public guide',intro:'original text',steps:[],careNote:null,sources:[]}];a.routineGuides=[{id:'guide-general',productId:null,title:'general public guide',intro:'original general text',steps:[],careNote:null,sources:[]}];const x=await render(a,'guide-unresolved-general');for(const text of [x.text,x.direct.text]){assert.ok(text.includes('guide product identity unavailable'));assert.ok(text.includes('general guidance'));assert.doesNotMatch(text,/absent-public-product|guide-orphan|guide-general/);}
});

test('identical public product labels keep recorded membership bound to the correct listing item without raw IDs',async()=>{
 const a=draft(),first=a.products[0],second=a.products[1];if(!first||!second)throw Error('fixture');a.products[1]={...structuredClone(first),id:second.id};const b=structuredClone(a);b.context.products={state:'recorded',productIds:['product-2']};const x=await render(a,'identical-product-first'),y=await render(b,'identical-product-second');differ(x,y);assert.match(context(x.text),/recorded current product: CeraVe PM.*product listing item 1/);assert.match(context(y.text),/recorded current product: CeraVe PM.*product listing item 2/);
});

test('identical public goal text keeps each decision association bound to the correct goal listing item',async()=>{
 const a=draft(),first=a.goals[0],second=a.goals[1];if(!first||!second)throw Error('fixture');second.text=first.text;a.decisions=[{...decision(),goalIds:['goal-1']}];const b=structuredClone(a),d=b.decisions[0];if(!d)throw Error('fixture');d.goalIds=['goal-2'];differ(await render(a,'identical-goal-first'),await render(b,'identical-goal-second'));
});

test('all 15000 allowed public context links retain full facts once instead of multiplying their bodies',async()=>{
 const a=draft(),base=a.products[0];if(!base)throw Error('fixture');
 a.context.facts=Array.from({length:100},(_,i)=>({id:'fact-'+i,kind:'client_report',visibility:'client',text:'PUBLIC_FACT_BODY_'+i+': '+'x'.repeat(3950),sources:[],contradicts:[]}));
 const refs=a.context.facts.map(f=>f.id);
 a.products=Array.from({length:50},(_,i)=>({...structuredClone(base),id:'product-'+(i+1),name:'Product '+(i+1),factIds:[...refs]}));
 a.goals=Array.from({length:50},(_,i)=>({id:'goal-'+(i+1),text:'Goal '+(i+1),factIds:[...refs]}));
 a.decisions=Array.from({length:50},(_,i)=>({...decision(),id:'decision-'+i,slotId:'decision-slot-'+i,factIds:[...refs],goalIds:a.goals.map(g=>g.id)}));
 const x=await render(a,'all-public-context-links');
 for(const text of [x.text,x.direct.text]){
  for(const f of a.context.facts)assert.equal(text.split(f.text).length-1,1,'each full fact must appear once');
  assert.equal(text.split('public context for this goal:').length-1,5000);assert.equal(text.split('public context for this product:').length-1,5000);assert.equal(text.split('public context for this decision:').length-1,5000);assert.equal(text.split('related goal:').length-1,2500);
 }
 assert.ok(x.manifest.totalBytes<1800000,'this complete relationship control fits the established plan input allowance');
 assert.ok(Buffer.byteLength(x.text)<1600000,'ordinal relationships must avoid repeating 60MB of fact bodies');
});
