import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createHash} from 'node:crypto';
import type {FinalExportRecord} from '../src/contracts/PortalFinalExport.ts';
import type {Guide,Card,Presentation} from '../src/contracts/ConciergePresentation.ts';
import type {PlanContent,DecisionKind,PlanDecision} from '../src/contracts/PortalRebuild.ts';
import {projectClientPlan} from '../src/contracts/PortalRebuild.ts';
import {readPlanContent} from '../src/contracts/PortalRebuildValidation.ts';
import {readPresentation} from '../src/contracts/ConciergePresentationValidation.ts';
import {assertFinalExportRecord} from '../src/contracts/PortalFinalExportValidation.ts';
import {collectFinalExport} from '../src/contracts/PortalFinalExportMapping.ts';
import {createFinalExportHtmlSink,serializeFinalExport} from '../supabase/functions/concierge-final-export/serializer.ts';
import {finalExportFixture,finalExportLegacyFixture,finalExportWire} from './portal-final-export-fixtures.ts';

globalThis.fetch=async()=>{throw Error('external_fetch_denied');};
const guide=(productId:string|null):Guide=>({id:'guide-public',productId,title:'public guide',intro:'GUIDE_INTRO',steps:[{title:'directions',body:'GUIDE_BODY'}],careNote:'GUIDE_CAUTION',sources:[]});
const H=(s:string)=>createHash('sha256').update(s).digest('hex');
const normalize=(s:string)=>s.replace('current applicable instructions below supersede','applicable instructions below supersede');
const maskGuide=(s:string)=>s.replace(/^guide applicability:.*\n/gm,'').replace(/^guide product:.*\n/gm,'').replace(/^general guidance\n/gm,'');
function presentation(r:FinalExportRecord):Presentation{if(r.plan.documentSchemaVersion!==2||!r.plan.legacyOriginal.presentation)throw Error('fixture');return r.plan.legacyOriginal.presentation;}
function legacy():FinalExportRecord{
 const r=finalExportLegacyFixture(),p=presentation(r),s=p.baselineRoutine[0];if(r.plan.documentSchemaVersion!==2||!s?.product)throw Error('fixture');s.product.name='Daily Lotion';s.product.brand='Alpha Brand';s.title='same public routine';p.baselineRoutine.push({...structuredClone(s),id:'routine-2',slot:'slot-2',productId:'product-2',product:{...structuredClone(s.product),id:'product-2',brand:'Beta Brand'}});p.categoryCards=[];p.routineGuides=[guide('product-1')];r.plan.legacyOriginal.recommendations=[];r.instructions=[];r.use=p.baselineRoutine.map(s=>{if(!s.productId)throw Error('fixture');return {productId:s.productId,state:'not_reported',originalStart:{state:'unknown'},occurredOn:{state:'unknown'},details:null,frequency:null,amount:null,contradiction:false};});return r;
}
function validate(r:FinalExportRecord){if(r.plan.documentSchemaVersion===2){const p=presentation(r);readPresentation(p,r.plan.legacyOriginal.recommendations,p.baselineRoutine.flatMap(s=>s.slot&&s.productId?[{slot:s.slot,productId:s.productId}]:[]));}assertFinalExportRecord(r);}
async function render(record:FinalExportRecord,caseName:string){
 validate(record);const wire=finalExportWire(record);let text='',html='',commits=0,aborts=0;
 const sink=createFinalExportHtmlSink({write:async c=>{text+=c.text;html+=c.html;},commit:async()=>{commits++;return 'complete';},abort:async()=>{aborts++;text='';html='';}});const receipt=await collectFinalExport(wire.read,sink),direct=serializeFinalExport(record);assert.equal(receipt.commitResult,'complete');assert.equal(commits,1);assert.equal(aborts,0);assert.equal(normalize(direct.text),text);assert.equal(normalize(direct.html),html);
 console.log(JSON.stringify({caseName,rootHash:wire.manifest.rootHash,totalBytes:wire.manifest.totalBytes,partCount:wire.manifest.partCount,commits,aborts,textBytes:Buffer.byteLength(text),htmlBytes:Buffer.byteLength(html),directTextBytes:Buffer.byteLength(direct.text),directHtmlBytes:Buffer.byteLength(direct.html),textSha256:H(text),htmlSha256:H(html),directTextSha256:H(direct.text),directHtmlSha256:H(direct.html)}));return {record,manifest:wire.manifest,text,html,direct};
}
function differs(a:Awaited<ReturnType<typeof render>>,b:Awaited<ReturnType<typeof render>>){assert.notEqual(a.manifest.rootHash,b.manifest.rootHash);for(const key of ['text','html'] as const){assert.notEqual(a[key],b[key]);assert.notEqual(a.direct[key],b.direct[key]);assert.equal(maskGuide(a[key]),maskGuide(b[key]));assert.equal(maskGuide(a.direct[key]),maskGuide(b.direct[key]));}}
function binding(s:string){return s.split('\n').filter(s=>s.startsWith('guide applicability: ')).join('\n');}

test('FE4 retained-valid R2 routine guide keeps its actual product/routine target in all four artifacts',async()=>{
 const a=legacy(),b=structuredClone(a),g=presentation(b).routineGuides[0];if(!g)throw Error('fixture');g.productId='product-2';const x=await render(a,'fe4-routine-first'),y=await render(b,'fe4-routine-second');differs(x,y);assert.match(binding(x.text),/original published routine item 1/);assert.match(binding(y.text),/original published routine item 2/);assert.doesNotMatch(binding(x.text),/original published routine item 2|product-1|slot-1/);
});

test('identical names/brands/variants/sizes/headings remain bound to distinct public occurrences',async()=>{
 const a=legacy(),p=presentation(a),first=p.baselineRoutine[0],second=p.baselineRoutine[1];if(!first?.product||!second)throw Error('fixture');second.product={...structuredClone(first.product),id:'product-2'};const b=structuredClone(a),g=presentation(b).routineGuides[0];if(!g)throw Error('fixture');g.productId='product-2';differs(await render(a,'fe4-identical-first'),await render(b,'fe4-identical-second'));
});

function addCard(r:FinalExportRecord,kind:DecisionKind){
 if(r.plan.documentSchemaVersion!==2)throw Error('fixture');const p=presentation(r),seed=presentation(finalExportLegacyFixture()).categoryCards[0],first=p.baselineRoutine[0]?.product,second=p.baselineRoutine[1]?.product;if(!seed||!first||!second)throw Error('fixture');
 const c:Card={...structuredClone(seed),id:'card-public',slot:'slot-1',kind,recommendationId:null,currentProduct:structuredClone(first),proposedProduct:null,how:guide('product-1')};
 if(kind==='pause'||kind==='leave_out')c.usage=null;
 else if(kind==='no_addition'){c.currentProduct=null;c.usage=null;c.comparisons=[];}
 else if(['replace','finish_then_replace','addition','optional_alternative'].includes(kind)){c.proposedProduct=structuredClone(second);c.recommendationId='rec-public';if(kind==='addition'){c.slot='addition-slot';c.currentProduct=null;c.comparisons=[];}r.plan.legacyOriginal.recommendations=[{id:'rec-public',slot:c.slot,currentProductId:c.currentProduct?.id??null,proposedProductId:second.id,priceCents:1234,currency:'USD',rationale:'retained reason'}];}
 p.categoryCards=[c];return c;
}
const kinds:readonly DecisionKind[]=['keep','pause','leave_out','replace','finish_then_replace','addition','optional_alternative','no_addition'];
for(const kind of kinds)test(`R2 ${kind} category guide binds its defined target rather than inferring from its container`,async()=>{
 const a=legacy(),card=addCard(a,kind);presentation(a).routineGuides=[];card.how.productId='product-1';const b=structuredClone(a),other=presentation(b).categoryCards[0];if(!other)throw Error('fixture');other.how.productId='product-2';const x=await render(a,'fe4-card-'+kind+'-first'),y=await render(b,'fe4-card-'+kind+'-second');differs(x,y);assert.match(binding(x.text),/original published routine item 1/);assert.match(binding(y.text),/original published routine item 2/);
});

test('guide targeting one product retains every baseline/card current/proposed occurrence and full body once',async()=>{
 const r=legacy(),p=presentation(r),first=p.baselineRoutine[0],card=addCard(r,'optional_alternative');if(!first?.product)throw Error('fixture');p.baselineRoutine.push({...structuredClone(first),id:'routine-3',slot:'slot-3'});card.proposedProduct=structuredClone(first.product);if(r.plan.documentSchemaVersion!==2)throw Error('fixture');const rec=r.plan.legacyOriginal.recommendations[0];if(!rec)throw Error('fixture');rec.proposedProductId='product-1';p.routineGuides=[guide('product-1')];card.how={...guide(null),id:'guide-general'};const x=await render(r,'fe4-all-occurrences');const line=binding(x.text).split('\n').find(s=>s.includes('original published routine item 1'));if(!line)throw Error('fixture');for(const s of ['original published routine item 3','original published decision item 1 (current product)','original published decision item 1 (proposed product)'])assert.ok(line.includes(s),s);assert.equal(x.text.split('GUIDE_BODY').length-1,2,'two authored guide occurrences, each body once');assert.ok(binding(x.text).includes('general guidance'));
});

test('general null guide is explicit and distinct from a product target even with no products',async()=>{
 const a=legacy(),b=structuredClone(a),g=presentation(b).routineGuides[0];if(!g)throw Error('fixture');g.productId=null;const x=await render(a,'fe4-targeted'),y=await render(b,'fe4-general');differs(x,y);assert.match(binding(y.text),/general guidance/);assert.doesNotMatch(binding(y.text),/original published routine item [12] /);
 const empty=legacy(),p=presentation(empty);p.baselineRoutine=[];p.currentProductsStatus='none';p.routineGuides=[guide(null)];empty.use=[];const z=await render(empty,'fe4-general-no-products');assert.ok(binding(z.text).includes('general guidance'));assert.doesNotMatch(z.text,/original Start:|reported use at support end:/);
});

function v3(location:'routine'|'product'|'decision',target:string|null){
 const r=finalExportFixture();if(r.plan.documentSchemaVersion!==3)throw Error('fixture');const c=r.plan.content,p=c.products[0],step=c.routine[0];if(!p||!step)throw Error('fixture');c.products.push({...structuredClone(p),id:'product-2',name:'Second Lotion',brand:'Beta Brand'});c.routine.push({...structuredClone(step),id:'step-2',slotId:'slot-2',productId:'product-2',title:'second routine'});const d:PlanDecision={id:'decision-1',slotId:'decision-slot',recommendationId:null,kind:'optional_alternative',goalIds:[],currentProductIds:['product-1'],primaryProductId:'product-2',alternativeProductIds:['product-1'],reason:'retained reason',directions:[],cautions:[],limitations:[],schedule:null,factIds:[],guidance:{title:'public choice',subtitle:'',rationaleTitle:'',reasons:[],actions:[],comparisons:[],factsTitle:'',facts:[],how:null,sources:[],group:null,decisionLabels:null}};c.decisions=[d];if(location==='routine')c.routineGuides=[guide(target)];else if(location==='product')p.guides=[guide(target)];else d.guidance.how=guide(target);
 const draft:PlanContent={...c,context:{...c.context,facts:[]}};readPlanContent(draft);r.plan.content=projectClientPlan(draft);r.use=c.products.map(p=>({productId:p.id,state:'not_reported',originalStart:{state:'unknown'},occurredOn:{state:'unknown'},details:null,frequency:null,amount:null,contradiction:false}));r.instructions=[];return r;
}
for(const location of ['routine','product','decision'] as const)test(`V3 ${location} guide retains all actual product/routine/decision relationships`,async()=>{
 const x=await render(v3(location,'product-1'),'fe4-v3-'+location+'-first'),y=await render(v3(location,'product-2'),'fe4-v3-'+location+'-second');differs(x,y);for(const s of ['product listing item 1','published routine item 1','published decision item 1 (current product, optional alternative)'])assert.ok(binding(x.text).includes(s),s);for(const s of ['product listing item 2','published routine item 2','published decision item 1 (primary product)'])assert.ok(binding(y.text).includes(s),s);
});

test('unfounded V3 target remains honestly unavailable; a defined but unreferenced product remains known',async()=>{
 const absent=await render(v3('product','not-in-plan'),'fe4-v3-unavailable');assert.ok(absent.text.includes('guide product identity unavailable'));assert.ok(binding(absent.text).includes('public product target unavailable'));assert.doesNotMatch(binding(absent.text),/not-in-plan|product listing item/);
 const r=v3('routine','product-2');if(r.plan.documentSchemaVersion!==3)throw Error('fixture');r.plan.content.routine=r.plan.content.routine.filter(s=>s.productId!=='product-2');r.plan.content.decisions=[];const x=await render(r,'fe4-v3-known-unreferenced');assert.ok(binding(x.text).includes('product listing item 2'));assert.doesNotMatch(binding(x.text),/unavailable|published routine item 2|published decision item/);
});

test('invalid legacy guide target and private guide fields never produce a completed artifact',async()=>{
 const r=legacy(),g=presentation(r).routineGuides[0];if(!g)throw Error('fixture');g.productId='not-in-plan';assert.throws(()=>validate(r));assert.throws(()=>serializeFinalExport(r));let commits=0,aborts=0,output='';const sink=createFinalExportHtmlSink({write:async v=>{output+=v.text;},commit:async()=>{commits++;},abort:async()=>{aborts++;output='';}});await assert.rejects(collectFinalExport(finalExportWire(r).read,sink));assert.equal(commits,0);assert.equal(aborts,1);assert.equal(output,'');
 const safe=legacy(),p=presentation(safe),original=p.routineGuides[0];if(!original)throw Error('fixture');Object.assign(original,{privateNote:'PRIVATE_FE4_CANARY'});assert.throws(()=>serializeFinalExport(safe));
});

test('Unicode/private-looking authored text stays escaped and guide body is never repeated by target enumeration',async()=>{
 const r=legacy(),p=presentation(r),g=p.routineGuides[0],s=p.baselineRoutine[0];if(!g||!s?.product)throw Error('fixture');g.title='guide 🧴 & été';g.steps=[{title:null,body:'GUIDE_UNICODE 🧴 & soin < 3'}];g.careNote='caution "été"';s.product.brand=null;s.product.variant=null;s.product.sizeLabel='';const x=await render(r,'fe4-unicode-unknown');for(const text of [x.text,x.direct.text])assert.equal(text.split('GUIDE_UNICODE 🧴 & soin < 3').length-1,1);for(const html of [x.html,x.direct.html]){assert.ok(html.includes('GUIDE_UNICODE 🧴 &amp; soin &lt; 3'));assert.ok(html.includes('caution &quot;été&quot;'));assert.doesNotMatch(html,/<script|<iframe|onerror=/);}assert.doesNotMatch(binding(x.text),/product-1|slot-1|Start|2026-/);
});
