import assert from 'node:assert/strict';
import {test} from 'node:test';
import type {FinalExportRecord,FinalExportUse} from '../src/contracts/PortalFinalExport.ts';
import {readPresentation} from '../src/contracts/ConciergePresentationValidation.ts';
import {assertFinalExportRecord} from '../src/contracts/PortalFinalExportValidation.ts';
import {collectFinalExport} from '../src/contracts/PortalFinalExportMapping.ts';
import {createFinalExportHtmlSink,serializeFinalExport} from '../supabase/functions/concierge-final-export/serializer.ts';
import {finalExportLegacyFixture,finalExportWire} from './portal-final-export-fixtures.ts';

globalThis.fetch=async()=>{throw Error('external_fetch_denied');};
const marker='REPLACEMENT_STOP_MARKER: stopped because uncomfortable';
const baselineMarker='BASELINE_USE_CONTROL';
const occurrence:FinalExportUse['occurredOn']={state:'known',value:'2026-10-25'};
function legacy(record:FinalExportRecord){
 if(record.plan.documentSchemaVersion!==2)throw Error('fixture');const plan=record.plan,p=plan.legacyOriginal.presentation;if(!p)throw Error('fixture');return {plan,p};
}
function cardOnly(kind:'replace'|'addition'|'optional_alternative'='replace'):FinalExportRecord{
 const record=finalExportLegacyFixture(),{plan,p}=legacy(record),card=p.categoryCards[0],rec=plan.legacyOriginal.recommendations[0];
 if(!card?.currentProduct||!rec||!record.use[0])throw Error('fixture');
 card.kind=kind;card.proposedProduct={...structuredClone(card.currentProduct),id:'replacement-2',name:'Replacement Lotion'};card.how.productId='replacement-2';rec.proposedProductId='replacement-2';record.use[0].details=baselineMarker;
 if(kind==='addition'){card.slot='addition-slot';card.currentProduct=null;card.comparisons=[];rec.slot='addition-slot';rec.currentProductId=null;}
 record.use.push({productId:'replacement-2',state:'stopped',originalStart:{state:'known',value:'2026-10-12'},occurredOn:occurrence,details:marker,frequency:{state:'known',value:'REPLACEMENT_FREQUENCY_MARKER'},amount:{state:'known',value:'REPLACEMENT_AMOUNT_MARKER'},contradiction:true});
 return record;
}
function validate(record:FinalExportRecord,baseline=[{slot:'slot-1',productId:'product-1'}]):void{
 const {plan,p}=legacy(record);readPresentation(p,plan.legacyOriginal.recommendations,baseline);assertFinalExportRecord(record);
}
function staging(){
 let text='',html='',commits=0,aborts=0;
 const sink=createFinalExportHtmlSink({write:async chunk=>{text+=chunk.text;html+=chunk.html;},commit:async()=>{commits++;return 'complete';},abort:async()=>{aborts++;text='';html='';}});
 return {sink,get text(){return text;},get html(){return html;},get commits(){return commits;},get aborts(){return aborts;}};
}
function count(text:string,value:string):number{return text.split(value).length-1;}
// These two entry points already differ in one introductory sentence at e03. Compare
// all remaining bytes, preserving that known wording distinction without editing it.
const sameIntroduction=(text:string)=>text.replace('current applicable instructions below supersede','applicable instructions below supersede');
async function render(record:FinalExportRecord,caseName:string){
 const wire=finalExportWire(record),stream=staging(),receipt=await collectFinalExport(wire.read,stream.sink),direct=serializeFinalExport(record);
 assert.equal(receipt.commitResult,'complete');assert.equal(stream.commits,1);assert.equal(stream.aborts,0);
 assert.equal(sameIntroduction(direct.text),stream.text);assert.equal(sameIntroduction(direct.html),stream.html);
 console.log(JSON.stringify({caseName,commits:stream.commits,aborts:stream.aborts,unitBytes:wire.manifest.totalBytes,parts:wire.manifest.partCount,rootHash:wire.manifest.rootHash,directTextBytes:Buffer.byteLength(direct.text),streamTextBytes:Buffer.byteLength(stream.text),directHtmlBytes:Buffer.byteLength(direct.html),streamHtmlBytes:Buffer.byteLength(stream.html),replacementUseCount:count(stream.text,marker)}));
 return {direct,stream,manifest:wire.manifest};
}
function allStopFacts(text:string):void{
 for(const value of ['reported use at support end: stopped','original Start: 2026-10-12','latest reported date: 2026-10-25',marker,'reported frequency: REPLACEMENT_FREQUENCY_MARKER','reported amount: REPLACEMENT_AMOUNT_MARKER','recorded use reports contain a contradiction'])assert.equal(count(text,value),1,value);
}

const kinds:readonly ('replace'|'addition'|'optional_alternative')[]=['replace','addition','optional_alternative'];
for(const kind of kinds)test(`validated R2 ${kind} card-only use retains every fact through both real serializers`,async()=>{
 const record=cardOnly(kind);validate(record);const {direct,stream}=await render(record,kind);
 for(const text of [direct.text,stream.text]){
  assert.ok(text.includes('Replacement Lotion'));allStopFacts(text);assert.equal(count(text,baselineMarker),1);
  assert.ok(text.indexOf('original published decisions (separate from actual use)')<text.indexOf('proposed product'));
  const identity=text.indexOf('Replacement Lotion'),use=text.indexOf(marker);assert.ok(identity<use,'card-only use must follow its actual product identity');
 }
 for(const html of [direct.html,stream.html])for(const value of [marker,'REPLACEMENT_FREQUENCY_MARKER','REPLACEMENT_AMOUNT_MARKER','2026-10-12','2026-10-25'])assert.ok(html.includes(value),value);
});

test('one product shared by multiple valid cards emits one use record, with baseline use deduplicated too',async()=>{
 const record=cardOnly(),{plan,p}=legacy(record),first=p.categoryCards[0],step=p.baselineRoutine[0];if(!first?.currentProduct||!first.proposedProduct||!step)throw Error('fixture');
 const other={...structuredClone(first.currentProduct),id:'product-3',name:'Other Original Product'};
 p.baselineRoutine.push({...structuredClone(step),id:'routine-3',slot:'slot-3',productId:'product-3',product:other});
 p.categoryCards.push({...structuredClone(first),id:'card-3',slot:'slot-3',kind:'optional_alternative',recommendationId:'recommendation-3',currentProduct:other,proposedProduct:structuredClone(first.proposedProduct),how:{...structuredClone(first.how),id:'guide-3'}});
 plan.legacyOriginal.recommendations.push({id:'recommendation-3',slot:'slot-3',currentProductId:'product-3',proposedProductId:'replacement-2',priceCents:1234,currency:'USD',rationale:'second public reason'});
 record.use.push({productId:'product-3',state:'paused',originalStart:{state:'unknown'},occurredOn:{state:'unknown'},details:'OTHER_BASELINE_MARKER',frequency:null,amount:null,contradiction:false});
 validate(record,[{slot:'slot-1',productId:'product-1'},{slot:'slot-3',productId:'product-3'}]);const {direct,stream}=await render(record,'shared-product');
 for(const text of [direct.text,stream.text]){allStopFacts(text);assert.equal(count(text,baselineMarker),1);assert.equal(count(text,'OTHER_BASELINE_MARKER'),1);}
});

test('not-reported card-only use keeps unknown Start/occurrence and invents no report',async()=>{
 const record=cardOnly(),use=record.use.find(u=>u.productId==='replacement-2');if(!use)throw Error('fixture');
 use.state='not_reported';use.originalStart={state:'unknown'};use.occurredOn={state:'unknown'};use.details=null;use.frequency=null;use.amount=null;use.contradiction=false;
 validate(record);const {direct,stream}=await render(record,'not-reported');
 for(const text of [direct.text,stream.text]){assert.equal(count(text,'reported use at support end: not reported'),1);assert.doesNotMatch(text,/2026-10-12|2026-10-25|REPLACEMENT_STOP_MARKER|REPLACEMENT_FREQUENCY_MARKER|REPLACEMENT_AMOUNT_MARKER|recorded use reports contain a contradiction/);assert.ok(text.includes('original Start: unknown'));}
});

test('two actual product IDs with the same display name retain their own variant and use binding',async()=>{
 const record=cardOnly(),{p}=legacy(record),card=p.categoryCards[0],step=p.baselineRoutine[0];if(!card?.currentProduct||!card.proposedProduct||!step?.product)throw Error('fixture');
 step.product.name=card.currentProduct.name=card.proposedProduct.name='Shared Lotion';step.product.variant=card.currentProduct.variant='Baseline Variant';card.proposedProduct.variant='Replacement Variant';
 validate(record);const {direct,stream}=await render(record,'same-name-distinct-products');
 for(const text of [direct.text,stream.text]){assert.ok(text.indexOf('Baseline Variant')<text.indexOf(baselineMarker));assert.ok(text.indexOf('Replacement Variant')<text.indexOf(marker));allStopFacts(text);}
});

test('Unicode names and use text remain complete while both HTML paths escape public text',async()=>{
 const record=cardOnly(),{p}=legacy(record),proposed=p.categoryCards[0]?.proposedProduct,use=record.use.find(u=>u.productId==='replacement-2');if(!proposed||!use)throw Error('fixture');
 proposed.name='Réplàce 🧴 & Co < 3';proposed.variant='été "lotion"';use.details='STOP_UNICODE 🧴 & l’été < 3';use.frequency={state:'known',value:'fréquence 🧴 & nuit'};use.amount={state:'known',value:'量 > 1'};
 validate(record);const {direct,stream}=await render(record,'unicode-escaping');
 for(const text of [direct.text,stream.text])for(const value of ['Réplàce 🧴 & Co < 3','STOP_UNICODE 🧴 & l’été < 3','fréquence 🧴 & nuit','量 > 1'])assert.equal(count(text,value),1,value);
 for(const html of [direct.html,stream.html]){assert.ok(html.includes('Réplàce 🧴 &amp; Co &lt; 3'));assert.ok(html.includes('STOP_UNICODE 🧴 &amp; l’été &lt; 3'));assert.ok(html.includes('été &quot;lotion&quot;'));assert.ok(html.includes('量 &gt; 1'));assert.doesNotMatch(html,/<script|<iframe|onerror=/);}
});

test('valid R2 without product use has no invented product, Start or use record',async()=>{
 const record=finalExportLegacyFixture(),{plan,p}=legacy(record),step=p.baselineRoutine[0];if(!step)throw Error('fixture');
 p.currentProductsStatus='none';p.categoryCards=[];p.routineGuides=[];p.baselineRoutine=[{...step,id:'water-rinse',kind:'instruction',slot:null,productId:null,product:null,title:'water rinse'}];plan.legacyOriginal.recommendations=[];record.use=[];record.instructions=[];
 validate(record,[]);const {direct,stream}=await render(record,'no-products');
 for(const text of [direct.text,stream.text]){assert.ok(text.includes('water rinse'));assert.doesNotMatch(text,/reported use at support end:|original Start:|Legacy Product|Replacement Lotion/);}
});

test('private canaries and missing use cannot bypass the unchanged positive validator or commit staging',async()=>{
 const record=cardOnly();validate(record);
 const leaked={...record,use:record.use.map(use=>({...use,privateNote:'PRIVATE_FE1_CANARY'}))};
 assert.throws(()=>serializeFinalExport(leaked));const a=staging();await assert.rejects(collectFinalExport(finalExportWire(leaked).read,a.sink));assert.equal(a.commits,0);assert.equal(a.aborts,1);assert.equal(a.text,'');assert.equal(a.html,'');
 const missing={...record,use:record.use.filter(use=>use.productId!=='replacement-2')};assert.throws(()=>serializeFinalExport(missing));const b=staging();await assert.rejects(collectFinalExport(finalExportWire(missing).read,b.sink));assert.equal(b.commits,0);assert.equal(b.aborts,1);assert.equal(b.text,'');assert.equal(b.html,'');
});
