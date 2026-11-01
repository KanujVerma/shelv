import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createHash} from 'node:crypto';
import type {Card} from '../src/contracts/ConciergePresentation.ts';
import type {FinalExportRecord} from '../src/contracts/PortalFinalExport.ts';
import type {PlanContent,PlanDecision,DecisionKind} from '../src/contracts/PortalRebuild.ts';
import {projectClientPlan} from '../src/contracts/PortalRebuild.ts';
import {readPlanContent} from '../src/contracts/PortalRebuildValidation.ts';
import {readPresentation} from '../src/contracts/ConciergePresentationValidation.ts';
import {assertFinalExportRecord} from '../src/contracts/PortalFinalExportValidation.ts';
import {collectFinalExport} from '../src/contracts/PortalFinalExportMapping.ts';
import {createFinalExportHtmlSink,serializeFinalExport} from '../supabase/functions/concierge-final-export/serializer.ts';
import {finalExportFixture,finalExportLegacyFixture,finalExportWire} from './portal-final-export-fixtures.ts';

globalThis.fetch=async()=>{throw Error('external_fetch_denied');};
const normalize=(s:string)=>s.replace('current applicable instructions below supersede','applicable instructions below supersede');
const H=(s:string)=>createHash('sha256').update(s).digest('hex');
function base():PlanContent{const r=finalExportFixture();if(r.plan.documentSchemaVersion!==3)throw Error('fixture');const c=r.plan.content,p=c.products[0];if(!p)throw Error('fixture');return {...c,products:[{...p,name:'Daily Lotion',brand:'Alpha Brand'},{...structuredClone(p),id:'product-2',name:'Daily Lotion',brand:'Beta Brand'}],context:{products:{state:'recorded',productIds:['product-1','product-2']},facts:[]}};}
function v3(c:PlanContent,slotId:string,productId:string|null):FinalExportRecord{
 const r=finalExportFixture(),i=r.instructions[0];if(!i)throw Error('fixture');readPlanContent(c);r.plan={documentSchemaVersion:3,content:projectClientPlan(c)};r.use=c.products.map(p=>({productId:p.id,state:'not_reported',originalStart:{state:'unknown'},occurredOn:{state:'unknown'},details:null,frequency:null,amount:null,contradiction:false}));i.slotId=slotId;i.productId=productId;i.originalStart=productId===null?null:{state:'unknown'};assertFinalExportRecord(r);return r;
}
function choice(kind:DecisionKind,index:number):PlanDecision{
 const current=kind==='addition'||kind==='no_addition'?[]:['product-1'],primary=['replace','finish_then_replace','addition','optional_alternative'].includes(kind)?'product-2':null;
 return {id:'decision-'+index,slotId:'decision-slot-'+index,recommendationId:null,kind,goalIds:['goal-1'],currentProductIds:current,primaryProductId:primary,alternativeProductIds:kind==='optional_alternative'?['product-1']:[],reason:'same reviewed reason',directions:[],cautions:[],limitations:[],schedule:null,factIds:[],guidance:{title:'same public choice',subtitle:'',rationaleTitle:'',reasons:[],actions:[],comparisons:[],factsTitle:'',facts:[],how:null,sources:[],group:null,decisionLabels:null}};
}
async function render(record:FinalExportRecord,caseName:string){
 assertFinalExportRecord(record);const wire=finalExportWire(record);let text='',html='',commits=0,aborts=0;
 const sink=createFinalExportHtmlSink({write:async c=>{text+=c.text;html+=c.html;},commit:async()=>{commits++;return 'complete';},abort:async()=>{aborts++;text='';html='';}});
 const receipt=await collectFinalExport(wire.read,sink),direct=serializeFinalExport(record);assert.equal(receipt.commitResult,'complete');assert.equal(commits,1);assert.equal(aborts,0);assert.equal(normalize(direct.text),text);assert.equal(normalize(direct.html),html);
 const binding=text.split('\n').filter(s=>s.startsWith('applies to: ')).join('\n');
 console.log(JSON.stringify({caseName,rootHash:wire.manifest.rootHash,totalBytes:wire.manifest.totalBytes,partCount:wire.manifest.partCount,commits,aborts,binding,textBytes:Buffer.byteLength(text),htmlBytes:Buffer.byteLength(html),directTextBytes:Buffer.byteLength(direct.text),directHtmlBytes:Buffer.byteLength(direct.html),textSha256:H(text),htmlSha256:H(html),directTextSha256:H(direct.text),directHtmlSha256:H(direct.html)}));return {text,html,direct,binding,manifest:wire.manifest};
}
function different(a:Awaited<ReturnType<typeof render>>,b:Awaited<ReturnType<typeof render>>){assert.notEqual(a.manifest.rootHash,b.manifest.rootHash);for(const key of ['text','html'] as const){assert.notEqual(a[key],b[key]);assert.notEqual(a.direct[key],b.direct[key]);}assert.notEqual(a.binding,b.binding);}

test('FE3 brand/product and routine bindings survive both actual artifact paths',async()=>{
 const c=base(),step=c.routine[0];if(!step)throw Error('fixture');c.routine.push({...structuredClone(step),id:'step-2',slotId:'slot-2',productId:'product-2',title:'second moisturizer'});
 const a=await render(v3(c,'slot-1','product-1'),'brand-first'),b=await render(v3(c,'slot-2','product-2'),'brand-second');different(a,b);assert.match(a.binding,/Daily Lotion.*Alpha Brand.*product listing item 1.*published routine item 1.*moisturize/);assert.match(b.binding,/Daily Lotion.*Beta Brand.*product listing item 2.*published routine item 2.*second moisturizer/);assert.doesNotMatch(a.binding,/slot-1|product-1|step-1/);
});

test('completely identical product labels and a repeated routine title still retain distinct listing bindings',async()=>{
 const c=base(),p=c.products[0],q=c.products[1],s=c.routine[0];if(!p||!q||!s)throw Error('fixture');c.products[1]={...structuredClone(p),id:q.id};c.routine.push({...structuredClone(s),id:'step-2',slotId:'slot-2',productId:'product-2'});
 const a=await render(v3(c,'slot-1','product-1'),'identical-product-first'),b=await render(v3(c,'slot-2','product-2'),'identical-product-second');different(a,b);assert.ok(a.binding.includes('product listing item 1'));assert.ok(b.binding.includes('product listing item 2'));
});

test('one product in multiple identically titled routines retains the actual scope without inferring Start',async()=>{
 const c=base(),s=c.routine[0];if(!s)throw Error('fixture');c.routine.push({...structuredClone(s),id:'step-2',slotId:'slot-2'});
 const a=await render(v3(c,'slot-1','product-1'),'same-product-first-routine'),b=await render(v3(c,'slot-2','product-1'),'same-product-second-routine');different(a,b);assert.match(a.binding,/published routine item 1/);assert.match(b.binding,/published routine item 2/);assert.doesNotMatch(a.binding,/Start|2026-/);
});

const kinds:readonly DecisionKind[]=['keep','pause','leave_out','replace','finish_then_replace','addition','optional_alternative'];
for(const kind of kinds)test(`V3 ${kind} separately published instruction identifies the actual decision scope and product role`,async()=>{
 const c=base();c.decisions=[choice(kind,1),choice(kind,2)];const target=kind==='addition'?'product-2':'product-1';
 const a=await render(v3(c,'decision-slot-1',target),'v3-'+kind+'-first'),b=await render(v3(c,'decision-slot-2',target),'v3-'+kind+'-second');different(a,b);assert.ok(a.binding.includes('published decision item 1'));assert.ok(b.binding.includes('published decision item 2'));assert.ok(a.binding.includes(kind.replaceAll('_',' ')));assert.ok(a.binding.includes(kind==='addition'?'primary product':'current product'));
});

test('primary and optional-alternative roles remain bound to the actual product in the same decision',async()=>{
 const c=base();c.decisions=[{...choice('optional_alternative',1),currentProductIds:[],alternativeProductIds:['product-1']}];const a=await render(v3(c,'decision-slot-1','product-2'),'primary-role'),b=await render(v3(c,'decision-slot-1','product-1'),'alternative-role');different(a,b);assert.ok(a.binding.includes('primary product'));assert.ok(b.binding.includes('optional alternative'));
});

test('one selected tuple includes every matching routine/decision and every matching product role',async()=>{
 const c=base(),s=c.routine[0];if(!s)throw Error('fixture');c.routine.push({...structuredClone(s),id:'step-2'});c.decisions=[{...choice('optional_alternative',1),slotId:'slot-1',primaryProductId:'product-1',alternativeProductIds:['product-1']}];
 const a=await render(v3(c,'slot-1','product-1'),'shared-tuple');for(const value of ['published routine item 1','published routine item 2','published decision item 1','current product','primary product','optional alternative'])assert.ok(a.binding.includes(value),value);
});

test('nonproduct instructions retain their actual routine scope, including identical titles',async()=>{
 const c=base(),s=c.routine[0];if(!s)throw Error('fixture');c.products=[];c.context.products={state:'unknown'};c.routine=[{...s,kind:'instruction',productId:null,title:'water rinse'},{...structuredClone(s),id:'step-2',slotId:'slot-2',kind:'instruction',productId:null,title:'water rinse'}];
 const a=await render(v3(c,'slot-1',null),'nonproduct-first'),b=await render(v3(c,'slot-2',null),'nonproduct-second');different(a,b);assert.match(a.binding,/nonproduct instruction.*published routine item 1.*water rinse/);assert.doesNotMatch(a.binding,/product listing item|Start|product-1/);
});

function legacy(kind:DecisionKind,second=false):FinalExportRecord{
 const r=finalExportLegacyFixture();if(r.plan.documentSchemaVersion!==2)throw Error('fixture');const l=r.plan.legacyOriginal,p=l.presentation,card=p?.categoryCards[0],step=p?.baselineRoutine[0],rec=l.recommendations[0],i=r.instructions[0];if(!p||!card?.currentProduct||!step||!rec||!i)throw Error('fixture');
 const original=structuredClone(card.currentProduct),proposed={...structuredClone(original),id:'product-2',brand:'Other Brand'};original.name=proposed.name='Same Lotion';
 p.baselineRoutine=[{...structuredClone(step),title:'same original routine',product:original},{...structuredClone(step),id:'routine-2',slot:'slot-2',title:'same original routine',product:structuredClone(original)}];
 const cards=[1,2].map(n=>{const c:Card={...structuredClone(card),id:'card-'+n,slot:'slot-'+n,kind,title:'same original choice',currentProduct:structuredClone(original),proposedProduct:null,recommendationId:null,how:{...structuredClone(card.how),id:'guide-'+n}};return c;});
 p.categoryCards=cards;l.recommendations=[];
 for(const [index,c] of cards.entries()){
  if(kind==='keep'){c.usage=structuredClone(card.usage);}
  else if(kind==='pause'||kind==='leave_out')c.usage=null;
  else if(kind==='no_addition'){c.currentProduct=null;c.proposedProduct=null;c.usage=null;c.comparisons=[];c.slot='no-addition-'+index;}
  else {c.proposedProduct=structuredClone(proposed);c.recommendationId='rec-'+index;c.usage=structuredClone(card.usage);if(kind==='addition'){c.slot='addition-'+index;c.currentProduct=null;c.comparisons=[];}l.recommendations.push({...structuredClone(rec),id:c.recommendationId,slot:c.slot,currentProductId:c.currentProduct?.id??null,proposedProductId:proposed.id});c.how.productId=proposed.id;}
 }
 const target=kind==='addition'||kind==='replace'||kind==='finish_then_replace'||kind==='optional_alternative'?'product-2':'product-1';
 r.use=[{...r.use[0],productId:'product-1',state:'not_reported',originalStart:{state:'unknown'},occurredOn:{state:'unknown'},details:null,frequency:null,amount:null,contradiction:false}];
 if(target==='product-2')r.use.push({...structuredClone(r.use[0]),productId:'product-2',state:'not_reported',originalStart:{state:'unknown'},occurredOn:{state:'unknown'},details:null,frequency:null,amount:null,contradiction:false});
 const selected=cards[second?1:0];if(!selected)throw Error('fixture');i.slotId=selected.slot;i.productId=target;i.originalStart={state:'unknown'};
 readPresentation(p,l.recommendations,[{slot:'slot-1',productId:'product-1'},{slot:'slot-2',productId:'product-1'}]);if(kind!=='no_addition')assertFinalExportRecord(r);return r;
}
for(const kind of kinds)test(`retained-valid R2 ${kind} instruction retains its exact original card scope`,async()=>{
 const a=await render(legacy(kind),'r2-'+kind+'-first'),b=await render(legacy(kind,true),'r2-'+kind+'-second');different(a,b);assert.ok(a.binding.includes('original published decision item 1'));assert.ok(b.binding.includes('original published decision item 2'));assert.ok(a.binding.includes(kind.replaceAll('_',' ')));assert.ok(a.binding.includes('Same Lotion'));
});

test('no-addition with no product is not an instruction scope in either supported schema',async()=>{
 const c=base();c.decisions=[choice('no_addition',1)];for(const record of [v3(c,'slot-1','product-1'),legacy('no_addition')]){
  const i=record.instructions[0];if(!i)throw Error('fixture');i.slotId=record.plan.documentSchemaVersion===3?'decision-slot-1':'no-addition-0';i.productId=null;i.originalStart=null;assert.throws(()=>serializeFinalExport(record));let commits=0,aborts=0;const sink=createFinalExportHtmlSink({write:async()=>{},commit:async()=>{commits++;},abort:async()=>{aborts++;}});await assert.rejects(collectFinalExport(finalExportWire(record).read,sink));assert.equal(commits,0);assert.equal(aborts,1);
 }
});

test('unknown and Unicode public identities escape in instruction bindings without raw/private IDs or invented dates',async()=>{
 const c=base(),p=c.products[0],s=c.routine[0];if(!p||!s)throw Error('fixture');p.name='L’été 🧴 & Co < 3';p.brand='Brand "A"';p.variant=null;p.sizeLabel='';s.title='soir 🧴 & soin < 3';const a=await render(v3(c,'slot-1','product-1'),'unicode-binding');assert.ok(a.binding.includes('L’été 🧴 & Co < 3'));assert.ok(a.binding.includes('variant unknown'));assert.ok(a.binding.includes('size unknown'));assert.ok(a.html.includes('Brand &quot;A&quot;'));assert.ok(a.html.includes('soir 🧴 &amp; soin &lt; 3'));assert.doesNotMatch(a.binding,/slot-1|product-1|step-1|Start|2026-/);
 const bad=v3(base(),'slot-1','product-1');const leaked={...bad,plan:{...bad.plan,privateNote:'PRIVATE_FE3_CANARY'}};assert.throws(()=>serializeFinalExport(leaked));
});
