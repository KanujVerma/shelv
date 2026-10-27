import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildConciergeRpc} from '../source/supabase/functions/concierge-operations/commands.ts';
import {readPresentation} from '../source/src/contracts/ConciergePresentationValidation.ts';
import {mapConciergeClientViewV2} from '../source/src/contracts/ConciergePresentationMapping.ts';
import {validateDraft} from '../../site/advisor/model.js';
import {createSyntheticClientRequests} from '../../site/preview/synthetic-requests.js';

const fixture=()=>JSON.parse(readFileSync(new URL('../source/tests/fixtures/concierge-maya.json',import.meta.url),'utf8'));
const clientId='00000000-0000-4000-8000-000000000001';
const draft=(f=fixture())=>({intakeVersion:1,recommendations:f.recommendations,advisorNote:'Synthetic private note',presentation:f.presentation});
const command=(f=fixture())=>({action:'save_draft_v2',clientId,requestId:'00000000-0000-4000-8000-000000000009',expectedRevision:1,...draft(f)});
for(const kind of ['replace','finish_then_replace'])for(const boundary of ['absent-slot','wrong-current','colliding-id','capacity'])test(`${kind} rejects ${boundary} baseline bypass in operations and advisor preflight`,()=>{
 const f=fixture();let card=f.presentation.categoryCards.find((c:any)=>c.kind==='addition');
 let item=f.recommendations.find((r:any)=>r.id===card.recommendationId);
 if(boundary==='wrong-current'){card=f.presentation.categoryCards[0];item=f.recommendations[0];}
 card.kind=kind;card.currentProduct=structuredClone(f.presentation.baselineRoutine.find((s:any)=>s.kind==='product'&&(boundary!=='wrong-current'||s.slot==='cleanser')).product);
 item.currentProductId=card.currentProduct.id;
 if(boundary==='colliding-id')card.id='maya-water-rinse';
 if(boundary==='capacity')while(f.presentation.baselineRoutine.length<50)f.presentation.baselineRoutine.push({...structuredClone(f.presentation.baselineRoutine[0]),id:'synthetic-capacity-'+f.presentation.baselineRoutine.length});
 assert.throws(()=>buildConciergeRpc(command(f),clientId),/invalid_input/);
 assert.ok(validateDraft(draft(f)).length>0,'Advisor preflight must reject the same invalid binding');
});
test('existing Maya presentation passes live draft preflight without invented current product',()=>{
 const f=fixture();assert.deepEqual(validateDraft(draft(f)),[]);
 assert.equal(f.recommendations.find((r:{id:string})=>r.id==='maya-azelaic-1').currentProductId,null);
});
test('Maya save command preserves complete approved presentation and nullable addition identity',()=>{
 const f=fixture(),rpc=buildConciergeRpc(command(f),clientId);
 assert.equal(rpc.name,'concierge_presentation_write');assert.deepEqual(rpc.args.p_payload,draft(f));
 assert.deepEqual(readPresentation(f.presentation,f.recommendations,f.baseline),f.presentation);
});
test('Maya published projection is mapped with unselected choices and no invented cart or activation',()=>{
 const f=fixture(),store=createSyntheticClientRequests({identity:{clientId},presentation:f.presentation});
 const raw=store.read(),mapped=mapConciergeClientViewV2(raw);
 assert.deepEqual(mapped.plan?.presentation,f.presentation);assert.deepEqual(mapped.orderProposal.items,[]);
 assert.ok(mapped.plan?.itemStates.every(s=>s.choice===null&&!s.received&&s.startedOn===null));
 assert.ok(!mapped.activeRoutine.some(s=>s.productId==='ordinary-azelaic-10'||s.productId==='cerave-makeup-removing-balm'));
});
test('legacy save continues rejecting nullable current product',()=>{
 const f=fixture(),{presentation,...legacy}=command(f);
 assert.throws(()=>buildConciergeRpc({...legacy,action:'save_draft'},clientId),/invalid_input/);
});
for(const [name,mutate] of [
 ['addition cannot replace an existing baseline slot',(f:any)=>{f.presentation.categoryCards.find((c:any)=>c.kind==='addition').slot='cleanser';f.recommendations.find((r:any)=>r.currentProductId===null).slot='cleanser';f.presentation.categoryCards=f.presentation.categoryCards.filter((c:any)=>c.id!=='maya-card-cleanser');}],
 ['addition cannot claim a current product',(f:any)=>{f.presentation.categoryCards.find((c:any)=>c.kind==='addition').currentProduct=f.presentation.baselineRoutine[1].product;}],
 ['optional must match authoritative baseline',(f:any)=>{f.presentation.categoryCards[0].currentProduct.id='wrong-current';f.recommendations[0].currentProductId='wrong-current';}],
 ['purchase reference price must be present',(f:any)=>{f.presentation.categoryCards[0].proposedProduct.displayPrice=null;}],
 ['reference cards cannot create purchase obligations',(f:any)=>{f.presentation.categoryCards.find((c:any)=>c.kind==='pause').recommendationId='illicit';}],
 ['prices remain integer cents',(f:any)=>{f.recommendations[0].priceCents=null;}],
 ['unknown fields remain rejected',(f:any)=>{f.presentation.categoryCards[0].ownerOverride=true;}],
 ['additions cannot exceed the active routine projection bound',(f:any)=>{const step=f.presentation.baselineRoutine[0];while(f.presentation.baselineRoutine.length<50)f.presentation.baselineRoutine.push({...structuredClone(step),id:'extra-'+f.presentation.baselineRoutine.length});}],
] as const)test(name,()=>{
 const f=fixture();mutate(f);assert.throws(()=>buildConciergeRpc(command(f),clientId),/invalid_input/);
});
