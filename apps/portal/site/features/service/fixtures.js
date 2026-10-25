import {serviceCommand,ensure,serviceCalendarDay} from './model.js';
const clone=value=>structuredClone(value);
const failure=(status,code)=>{throw {status,code};};
/** Each invocation owns its memory. Only the generic walkthrough uses this;
 * ordinary sessions use the authenticated operations transport and SQL. */
export function createServicePreviewRequests({clientId,clientView,now=new Date().toISOString()}){
 let activeView=clone(clientView);
 const actor='10000000-0000-4000-8000-000000000003',today=serviceCalendarDay(()=>now),state={revision:0,reviews:[],instructions:[],purchases:[],returns:[],cancellation:null},privateNotes=[],drafts=[],privatePurchases=[],privateReturnEvents=[],requests=new Map();
 const read=()=>clone(state);
 const request=advisor=>async command=>{
  if(command.action===(advisor?'service_advisor_read':'service_client_read')){if(advisor&&command.clientId!==clientId)failure(403,'forbidden');return {...read(),...(advisor?{privateNotes:clone(privateNotes),instructionDrafts:clone(drafts.filter(d=>!d.published)),privatePurchases:clone(privatePurchases),privateReturnEvents:clone(privateReturnEvents)}:{})};}
  if(!advisor&&command.action!=='request_return'||advisor&&command.clientId!==clientId)failure(403,'forbidden');
  const {action,requestId,expectedRevision,...rest}=command;if(advisor)delete rest.clientId;
  serviceCommand(action,rest,{clientId,revision:expectedRevision,requestId});
  const key=JSON.stringify(command),prior=requests.get(requestId);if(prior){if(prior.key!==key)failure(409,'request_conflict');return clone(prior.receipt);}if(expectedRevision!==state.revision)failure(409,'revision_conflict');
  const id=crypto.randomUUID();
  if(action==='record_review'){const {privateNote,...data}=rest;if(data.occurredOn>today)failure(400,'invalid_input');state.reviews.push({...data,id,authorId:actor,authorLabel:'Review with your advisor',recordedAt:now});if(privateNote)privateNotes.push({reviewId:id,note:privateNote});}
  else if(action==='save_instruction_draft'){const step=activeView.activeRoutine.find(s=>s.kind==='product'&&s.slot===rest.slot&&s.productId===rest.productId);if(!step||rest.planVersion!==activeView.plan?.version)failure(409,'instruction_conflict');const current=state.instructions.filter(i=>i.slot===rest.slot&&i.productId===rest.productId).at(-1);if(rest.baseInstructionVersion!==(current?.version||0))failure(409,'instruction_conflict');const history=activeView.routineHistory?.find(h=>h.slot===rest.slot&&h.productId===rest.productId&&h.version===step.source.publicationVersion&&h.recommendationId===step.source.recommendationId);drafts.push({...rest,id,draftId:id,version:rest.baseInstructionVersion+1,source:clone(step.source),originalStartedOn:history?.startedOn||null,authorId:actor,createdAt:now});}
  else if(action==='publish_instruction_revision'){const d=drafts.find(d=>d.draftId===rest.draftId&&!d.published);if(!d)failure(409,'instruction_conflict');const last=state.instructions.filter(i=>i.slot===d.slot&&i.productId===d.productId).at(-1);if((last?.version||0)!==d.baseInstructionVersion)failure(409,'instruction_conflict');d.published=true;const {draftId,baseInstructionVersion,published,...record}=d;state.instructions.push({...record,id});}
  else if(action==='record_purchase'){const {orderReference,receiptReference,termsDisclosed,...data}=rest;state.purchases.push({...data,id,recordedAt:now,recordedBy:actor});privatePurchases.push({purchaseId:id,orderReference,receiptReference});}
  else if(action==='request_return'){const purchase=state.purchases.find(p=>p.id===rest.purchaseId);if(!purchase)failure(404,'not_found');const reserved=state.returns.filter(r=>r.purchaseId===purchase.id&&r.status!=='declined').reduce((sum,r)=>sum+r.quantity,0);if(reserved+rest.quantity>purchase.quantity)failure(409,'return_quantity_exceeded');state.returns.push({...rest,id,status:'requested',requestedAt:now,events:[]});}
  else if(action==='record_return_event'){const r=state.returns.find(r=>r.id===rest.returnId);if(!r)failure(404,'not_found');const {returnId,privateReference,...data}=rest;r.status=data.status;r.events.push({...data,id,actorId:actor,recordedAt:now});privateReturnEvents.push({eventId:id,reference:privateReference});}
  else if(action==='cancel_service'){if(state.cancellation)failure(409,'request_conflict');const {confirmedWithClient,...data}=rest;state.cancellation={...data,id,recordedAt:now,recordedBy:actor};}
  else failure(400,'invalid_input');
  state.revision++;const receipt={revision:state.revision,operation:action,entityId:id};requests.set(requestId,{key,receipt});return clone(receipt);
 };
 const client=request(false),advisor=request(true);client.syntheticPreview=true;advisor.syntheticPreview=true;
 const getClientView=()=>{const result=clone(activeView);for(const step of result.activeRoutine||[]){const i=state.instructions.filter(i=>i.slot===step.slot&&i.productId===step.productId&&JSON.stringify(i.source)===JSON.stringify(step.source)&&i.planVersion<=(result.plan?.version||0)).at(-1);if(i){step.usage=clone(i.usage);step.instructionRevision=clone(i);step.guides=[{id:'instruction-'+i.id,productId:step.productId,title:'Current reviewed instructions',intro:i.reason,steps:i.usage.instructions.map(body=>({title:null,body})),careNote:null,sources:[]}];}}return result;};
 return {client,advisor,read,getClientView,updateClientView:view=>{activeView=clone(view);}};
}
