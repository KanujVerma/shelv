import type {ClientPlanViewV3,GuidanceReadSnapshot,GuidanceDecisionReceipt} from '../../../../../src/contracts/PortalReview.ts';
import type {PlanDecision} from '../../../../../src/contracts/PortalRebuild.ts';
import {readReviewCommand} from '../../../../../src/contracts/PortalReviewValidation.ts';
import {mapReviewResult} from '../../../../../src/contracts/PortalReviewMapping.ts';
import {sameCareValue} from '../../../../../src/contracts/PortalCareValidation.ts';
import type {ClientGuidancePort,GuidanceDecisionCommand} from './guidancePort.ts';
import type {PlanSessionBoundary} from './types.ts';
import type {PresentationMode} from '../../navigation/routes.ts';
import {guidanceRestriction} from './guidanceContext.ts';
export interface GuidanceDecisionContext {view:ClientPlanViewV3;decision:PlanDecision;session:PlanSessionBoundary;mode:PresentationMode;port?:ClientGuidancePort;scope:{token:object;epoch:number};ready():boolean;onViewChange?:(view:ClientPlanViewV3)=>void}
type Basis={view:ClientPlanViewV3;session:PlanSessionBoundary;mode:PresentationMode;token:object;epoch:number;snapshot:GuidanceReadSnapshot};
export interface GuidanceDecisionIntent {phase:'idle'|'saving'|'refreshing'|'uncertain'|'conflict'|'saved'|'acknowledged'|'denied';command:GuidanceDecisionCommand|null;attemptedChoice:GuidanceDecisionCommand['choice']|null;reason:string|null;reviewBasis:Basis|null;error:number|null;reviewedRestriction?:object|null;receipt?:GuidanceDecisionReceipt|null}
export const guidanceIntentKey=(session:PlanSessionBoundary)=>`plan-guidance-intents:${session.key}:client`;
export type GuidanceDecisionLedger=Record<string,GuidanceDecisionIntent>;
const intentListeners=new WeakMap<PlanSessionBoundary,Set<()=>void>>();
export const emptyGuidanceIntents:GuidanceDecisionLedger={};
export function subscribeGuidanceIntents(session:PlanSessionBoundary,listener:()=>void){let set=intentListeners.get(session);if(!set){set=new Set();intentListeners.set(session,set);}set.add(listener);const stop=session.subscribeInvalidation(listener);return()=>{set!.delete(listener);stop();};}
function storeGuidanceIntent(session:PlanSessionBoundary,ledgerKey:string,id:string,value:GuidanceDecisionIntent){session.memory.set(ledgerKey,{...session.memory.get<GuidanceDecisionLedger>(ledgerKey),[id]:value});intentListeners.get(session)?.forEach(fn=>fn());}

/** The sole V3 decision intent. Same canonical choice ledger on the server;
 * only exact pending request/basis/recovery state lives in session memory here. */
export function createGuidanceDecisionController(initial:GuidanceDecisionContext){
 let ctx=initial,epoch=0,operation:object|null=null,disposed=false,restricted=initial.view.access!=='active'||initial.mode!=='client',restriction=guidanceRestriction(initial.session),stop:()=>void=()=>{};
 const listeners=new Set<()=>void>();
 const empty=():GuidanceDecisionIntent=>({phase:'idle',command:null,attemptedChoice:null,reason:null,reviewBasis:null,error:null});
 const ledgerKey=guidanceIntentKey(initial.session),prior=initial.mode==='client'?initial.session.memory.get<Record<string,GuidanceDecisionIntent>>(ledgerKey)?.[initial.decision.id]:undefined;
 let state=prior?{...prior,phase:prior.phase==='saving'||prior.phase==='refreshing'?'uncertain' as const:prior.phase}:empty();
 if(guidanceRestriction(initial.session)&&state.reviewedRestriction!==guidanceRestriction(initial.session)&&!state.command)state={...state,phase:'conflict',reviewBasis:null};
 const endedState=empty();
 const live=()=>!disposed&&ctx.session===initial.session&&ctx.session.isCurrent();
 function emit(next:GuidanceDecisionIntent){if(!live())return;const spent=guidanceRestriction(ctx.session);state=!next.command&&spent&&next.reviewedRestriction!==spent&&['idle','saved','acknowledged'].includes(next.phase)?{...next,phase:'conflict'}:next;if(ctx.mode==='client')storeGuidanceIntent(ctx.session,ledgerKey,initial.decision.id,state);listeners.forEach(fn=>fn());}
 const writable=()=>live()&&ctx.mode==='client'&&ctx.view.access==='active'&&ctx.view.currentGuidance?.mode==='current_document'&&!!ctx.port&&!!ctx.onViewChange;
 function begin(){if(operation||!live())return null;const op={},captured=ctx,start=epoch,restriction=guidanceRestriction(ctx.session);operation=op;return{ctx:captured,restriction,current:()=>live()&&operation===op&&epoch===start&&guidanceRestriction(ctx.session)===restriction,finish(){if(operation===op)operation=null;}};}
 async function read(c:GuidanceDecisionContext){if(!c.port)throw Error('unavailable');const command={schemaVersion:1,action:'read_client_plan_v3',version:null} as const;return mapReviewResult(await c.port.execute(command),command) as ClientPlanViewV3;}
 function basis(c:GuidanceDecisionContext,view:ClientPlanViewV3):Basis|null{return view.access==='active'&&view.currentGuidance?.mode==='current_document'?{view,session:c.session,mode:c.mode,token:c.scope.token,epoch:c.scope.epoch+Number(view!==c.view),snapshot:view.currentGuidance.snapshot}:null;}
 function reviewable(c:GuidanceDecisionContext,b:Basis|null){return !!b&&c.ready()&&b.view===c.view&&b.session===c.session&&b.mode===c.mode&&b.token===c.scope.token&&b.epoch===c.scope.epoch&&sameCareValue(b.snapshot,c.view.currentGuidance?.snapshot);}
 async function confirm(op:NonNullable<ReturnType<typeof begin>>,command:GuidanceDecisionCommand,receipt:unknown){
  mapReviewResult(receipt,command);if(!op.current())return;const next=await read(op.ctx);if(!op.current())return;
  const recorded=next.decisions.find(d=>d.decisionId===command.decisionId);
  emit({...state,command:null,phase:recorded?.choice===command.choice&&recorded.reason===command.reason?'saved':'acknowledged',error:null});
  if(op.current())op.ctx.onViewChange?.(next);
 }
 function retainReceipt(command:GuidanceDecisionCommand,receipt:GuidanceDecisionReceipt){
  // A committed old receipt is historical acknowledgement, not current view
  // authority. Keep the exact intent recoverable through the effective source.
  if(live()&&state.command===command)emit({...state,receipt});
 }
 async function write(command:GuidanceDecisionCommand,retry:boolean){
  const op=begin();if(!op)return;const pending={...state,command,attemptedChoice:command.choice,reason:command.reason,phase:'saving' as const,error:null};emit(pending);
  let acknowledged=false;
  try{if(!op.current()){
    // No first dispatch occurred. Preserve its witness, but never overwrite a
    // newer operation that a synchronous subscriber deliberately started.
    op.finish();
    if(operation===null&&state.command===command&&state.phase==='saving')emit({...state,phase:'uncertain'});
    return;
   }const receipt=mapReviewResult(await op.ctx.port!.execute(command),command) as GuidanceDecisionReceipt;retainReceipt(command,receipt);if(!op.current())return;acknowledged=true;emit({...state,phase:'refreshing'});if(op.current())await confirm(op,command,receipt);}
  catch(error){if(!op.current())return;const status=(error as {status?:number}).status??503;
   if(!retry&&!acknowledged&&status===409){emit({...pending,phase:'conflict',command:null,reviewBasis:null,error:409});try{if(!op.current())return;const next=await read(op.ctx);if(op.current()){emit({...state,reviewBasis:basis(op.ctx,next)});if(op.current())op.ctx.onViewChange?.(next);}}catch{/* A failed current read cannot unlock the rejected intent. */}}
   else if(!retry&&!acknowledged&&[400,403,404,413,415,429].includes(status))emit({...pending,command:null,phase:'denied',error:status});
   else emit({...pending,phase:'uncertain',error:status});
  }finally{op.finish();}
 }
 return{
  getSnapshot:()=>live()?state:endedState,
  subscribe(fn:()=>void){listeners.add(fn);if(listeners.size===1)stop=ctx.session.subscribeInvalidation(()=>{operation=null;epoch++;state=empty();listeners.forEach(f=>f());});return()=>{listeners.delete(fn);if(!listeners.size)stop();};},
  context(next:GuidanceDecisionContext){
   if(ctx.view!==next.view||ctx.mode!==next.mode||ctx.session!==next.session||ctx.scope.token!==next.scope.token||ctx.scope.epoch!==next.scope.epoch||ctx.port!==next.port||ctx.onViewChange!==next.onViewChange){epoch++;operation=null;if(state.phase==='saving'||state.phase==='refreshing')state={...state,phase:'uncertain'};}
   const wasRestricted=restricted;restricted=next.view.access!=='active'||next.mode!=='client'||next.view.currentGuidance?.mode!=='current_document';
   const nextRestriction=guidanceRestriction(next.session);
   if(!state.command&&(wasRestricted&&!restricted||nextRestriction!==restriction&&nextRestriction&&state.reviewedRestriction!==nextRestriction))state={...state,phase:'conflict',reviewBasis:null};
   restriction=nextRestriction;
   ctx=next;
   if(live()&&ctx.mode==='client'&&(state.command||state.attemptedChoice||state.phase==='conflict'))ctx.session.memory.set(ledgerKey,{...ctx.session.memory.get<GuidanceDecisionLedger>(ledgerKey),[initial.decision.id]:state});
  },
  async submit(choice:GuidanceDecisionCommand['choice'],reason:string|null){
   if(!writable()||!ctx.ready()||operation||state.command||state.phase==='conflict')return;
   const command=readReviewCommand({schemaVersion:1,action:'record_decision_v2',requestId:crypto.randomUUID(),expectedDecisionRevision:ctx.view.decisionRevision,publicationVersion:ctx.view.plan!.version,decisionId:ctx.decision.id,choice,reason,snapshot:ctx.view.currentGuidance!.snapshot}) as GuidanceDecisionCommand;
   await write(command,false);
  },
  async retry(){if(!writable()||operation||!state.command)return;await write(state.command,true);},
  async status(){
   if(!live()||ctx.mode!=='client'||!ctx.port||operation||!state.command)return;
   const op=begin();if(!op)return;const command=state.command;
   try{const query={schemaVersion:1,action:'request_status_v1',requestId:command.requestId} as const;const result=mapReviewResult(await op.ctx.port!.execute(query),query);if(!op.current())return;
    if(!('status'in result)||result.status!=='committed'){emit({...state,phase:'uncertain',error:null});return;}
    await confirm(op,command,result.receipt);
   }catch(error){if(op.current())emit({...state,command,phase:'uncertain',error:(error as {status?:number}).status??503});}
   finally{op.finish();}
  },
  async review(){
   if(!writable()||operation||state.command)return;
   const op=begin();if(!op)return;const acknowledge=reviewable(op.ctx,state.reviewBasis),before=state.reviewBasis;
   try{const next=await read(op.ctx);if(!op.current())return;
    const same=acknowledge&&before&&next.access==='active'&&sameCareValue(before.snapshot,next.currentGuidance?.snapshot);
    emit({...state,phase:same?'idle':'conflict',reviewBasis:basis(op.ctx,next),reviewedRestriction:same?op.restriction:state.reviewedRestriction,error:null});if(op.current())op.ctx.onViewChange?.(next);
   }catch(error){if(op.current())emit({...state,phase:'conflict',error:(error as {status?:number}).status??503});}
   finally{op.finish();}
  },
  retire(){
   epoch++;operation=null;if(state.phase==='saving'||state.phase==='refreshing')state={...state,phase:'uncertain'};
   // A spent access/review context must survive leaving the recommendation.
   // Retain only an actual intent or restriction; no background server command.
   if(live()&&ctx.mode==='client'&&(state.command||state.attemptedChoice||state.phase==='conflict'))storeGuidanceIntent(ctx.session,ledgerKey,initial.decision.id,state);
  },
  dispose(){disposed=true;epoch++;operation=null;stop();listeners.clear();},
 };
}
