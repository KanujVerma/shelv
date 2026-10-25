import {validatePresentation,publicPresentation,deriveRecommendations} from '../advisor/presentation-model.js';
import {previewActiveRoutine} from '../advisor/presentation-fixtures.js';
const clone=value=>structuredClone(value);
const fail=(status,message)=>{throw Object.assign(new Error(message),{status});};
/** The R2 client request/receipt contract, scoped to one explicit in-memory case. */
export function createSyntheticClientRequests({identity,presentation,onChange=()=>{},now=()=>new Date()}){
 const errors=validatePresentation(presentation);if(errors.length)throw Error(errors.join('\n'));
 const publicContent=publicPresentation(presentation),recommendations=deriveRecommendations(publicContent),receipts=new Map();
 const view={schemaVersion:2,revision:0,plan:{version:1,presentation:publicContent,recommendations,itemStates:recommendations.map(item=>({recommendationId:item.id,choice:null,reason:null,received:false,startedOn:null}))},history:[],orderProposal:{kind:'proposal',currency:'USD',items:[],subtotalCents:0,payable:false,shippingAndTaxConfirmed:false},routine:publicContent.baselineRoutine.filter(step=>step.kind==='product').map(step=>({slot:step.slot,productId:step.productId})),routineHistory:[]};
 const read=()=>({...clone(view),activeRoutine:previewActiveRoutine(view)});
 function refreshCart(){const items=recommendations.filter(item=>view.plan.itemStates.some(state=>state.recommendationId===item.id&&state.choice==='approved'&&!state.received));view.orderProposal={...view.orderProposal,items:clone(items),subtotalCents:items.every(item=>Number.isSafeInteger(item.priceCents))?items.reduce((sum,item)=>sum+item.priceCents,0):null};}
 const core=async(command,{signal}={})=>{
  if(signal?.aborted)throw new DOMException('Aborted','AbortError');
  if(!command||typeof command!=='object')fail(400,'Preview action unavailable.');
  if(command.clientId&&command.clientId!==identity.clientId)fail(403,'This synthetic case cannot access another case.');
  if(command.action==='client_read_v2')return read();
  if(!['decide','receive','start'].includes(command.action))fail(400,'Preview action unavailable.');
  if(typeof command.requestId!=='string'||!command.requestId)fail(400,'A request identity is required.');
  const fingerprint=JSON.stringify(command),prior=receipts.get(command.requestId);if(prior){if(prior.fingerprint!==fingerprint)fail(409,'Request conflict.');return clone(prior.result);}
  if(command.expectedRevision!==view.revision||command.version!==view.plan.version)fail(409,'This plan changed.');
  const state=view.plan.itemStates.find(state=>state.recommendationId===command.recommendationId),item=recommendations.find(item=>item.id===command.recommendationId);if(!state||!item)fail(404,'Recommendation unavailable.');
  if(command.action==='decide'){if(!['approved','declined'].includes(command.choice))fail(400,'Choose an approval decision.');state.choice=command.choice;state.reason=command.reason??null;}
  else if(command.action==='receive'){if(state.choice!=='approved')fail(409,'Approve first.');state.received=true;}
  else {if(!state.received)fail(409,'Record receipt first.');if(!/^\d{4}-\d{2}-\d{2}$/.test(command.startedOn||'')||!Number.isFinite(Date.parse(command.startedOn))||new Date(command.startedOn).toISOString().slice(0,10)!==command.startedOn||command.startedOn>now().toISOString().slice(0,10))fail(400,'Choose a valid actual start date.');state.startedOn=command.startedOn;view.routine=view.routine.filter(row=>row.slot!==item.slot);view.routine.push({slot:item.slot,productId:item.proposedProductId});view.routineHistory.push({version:1,recommendationId:item.id,slot:item.slot,productId:item.proposedProductId,startedOn:command.startedOn});}
  refreshCart();const result={revision:++view.revision,publishedVersion:1,operation:command.action};receipts.set(command.requestId,{fingerprint,result:clone(result)});onChange(read());return clone(result);
 };
 return {core,clientId:identity.clientId,read,productLabels:Object.fromEntries(recommendations.map(item=>[item.id,publicContent.categoryCards.find(card=>card.recommendationId===item.id)?.proposedProduct.name]))};
}
