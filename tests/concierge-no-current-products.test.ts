import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildConciergeRpc} from '../supabase/functions/concierge-operations/commands.ts';
import {readIntakePresentation,readPresentation} from '../src/contracts/ConciergePresentationValidation.ts';
import {ownerId,otherId,requestId} from './fixtures/concierge.ts';
const fixture=()=>JSON.parse(readFileSync(new URL('./fixtures/concierge-presentation.json',import.meta.url),'utf8'));
const empty=()=>({schemaVersion:2,consultationSections:[],baselineRoutine:[],currentProductsStatus:'none'});
const command=(presentation:any,baseline:any[]=[])=>({action:'save_intake_v2',clientId:otherId,requestId,expectedRevision:0,goal:'Consulted by phone',note:'PRIVATE',baseline,presentation});
export function noProductsPlan(){const p=fixture().presentation;p.currentProductsStatus='none';p.baselineRoutine=[];p.routineGuides=[];p.categoryCards=[p.categoryCards[0]];const c=p.categoryCards[0];c.kind='addition';c.currentProduct=null;c.proposedProduct.displayPrice={cents:1399,currency:'USD',sourceUrl:null,checkedOn:null,illustrative:true};c.comparisons=[];c.id='first-moisturizer';return p;}
test('only explicitly confirmed R2 none permits an empty baseline command',()=>{
 const call=buildConciergeRpc(command(empty()),ownerId);assert.equal(call.name,'concierge_presentation_write');assert.deepEqual((call.args as any).p_payload.baseline,[]);assert.equal((call.args as any).p_payload.presentation.currentProductsStatus,'none');
 for(const status of [undefined,'unknown','unreviewed','recorded',null]){const p:any=empty();if(status===undefined)delete p.currentProductsStatus;else p.currentProductsStatus=status;assert.throws(()=>buildConciergeRpc(command(p),ownerId),/invalid_input/);}
 for(const action of ['save_intake','submit_intake'])assert.throws(()=>buildConciergeRpc({...command(empty()),action,presentation:undefined},ownerId),/invalid_input/);
});
test('none cannot contradict a current product and historical nonempty snapshots remain valid',()=>{
 const f=fixture();assert.deepEqual(readIntakePresentation(f.intakePresentation,f.baseline),f.intakePresentation);assert.throws(()=>readIntakePresentation({...f.intakePresentation,currentProductsStatus:'none'},f.baseline),/invalid_input/);assert.equal(readIntakePresentation({...f.intakePresentation,currentProductsStatus:'recorded'},f.baseline).baselineRoutine.length,4);
});
test('genuine instructions may coexist with confirmed no products but never imply product review',()=>{
 const p:any=empty();p.baselineRoutine=[fixture().intakePresentation.baselineRoutine.find((s:any)=>s.kind==='instruction')];assert.equal(readIntakePresentation(p,[]).baselineRoutine.length,1);delete p.currentProductsStatus;assert.throws(()=>readIntakePresentation(p,[]),/invalid_input/);
});
test('real additions bind null current without fabricating a comparator',()=>{
 const p=noProductsPlan(),c=p.categoryCards[0],recommendations=[{id:c.recommendationId,slot:c.slot,currentProductId:null,proposedProductId:c.proposedProduct.id,priceCents:c.proposedProduct.displayPrice.cents,currency:'USD',rationale:c.reasons[0].body}];assert.equal(readPresentation(p,recommendations as any,[]).categoryCards[0].currentProduct,null);c.comparisons=fixture().presentation.categoryCards[0].comparisons;assert.throws(()=>readPresentation(p,recommendations as any,[]),/invalid_input/);
});

test('follow-up context binds actual current identities and activation provenance',()=>{
 const p=noProductsPlan(),c=p.categoryCards[0],a=fixture().presentation.baselineRoutine.find((s:any)=>s.kind==='product');p.baselineRoutine=[a];p.currentProductsStatus='recorded';p.routineBasis={products:[{slot:a.slot,productId:a.productId,source:{kind:'activation',publicationVersion:1,recommendationId:'started-first'}}]};c.kind='replace';c.currentProduct=a.product;assert.equal(readPresentation(p).routineBasis?.products[0].productId,a.productId);p.routineBasis.products[0].productId='forged';assert.throws(()=>readPresentation(p),/invalid_input/);
});
