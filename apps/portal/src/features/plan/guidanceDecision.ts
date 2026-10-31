import type {ClientPlanViewV3,GuidanceReadSnapshot} from '../../../../../src/contracts/PortalReview.ts';
import type {PlanDecision} from '../../../../../src/contracts/PortalRebuild.ts';
import {readReviewCommand} from '../../../../../src/contracts/PortalReviewValidation.ts';
import {mapReviewResult} from '../../../../../src/contracts/PortalReviewMapping.ts';
import {sameCareValue} from '../../../../../src/contracts/PortalCareValidation.ts';
import type {ClientGuidancePort,GuidanceDecisionCommand} from './guidancePort.ts';
import type {PlanSessionBoundary} from './types.ts';
import type {PresentationMode} from '../../navigation/routes.ts';
export interface GuidanceDecisionContext {view:ClientPlanViewV3;decision:PlanDecision;session:PlanSessionBoundary;mode:PresentationMode;port?:ClientGuidancePort;scope:{token:object;epoch:number};ready():boolean;onViewChange?:(view:ClientPlanViewV3)=>void}
type Basis={view:ClientPlanViewV3;session:PlanSessionBoundary;mode:PresentationMode;token:object;epoch:number;snapshot:GuidanceReadSnapshot};
export interface GuidanceDecisionIntent {phase:'idle'|'saving'|'refreshing'|'uncertain'|'conflict'|'saved'|'acknowledged'|'denied';command:GuidanceDecisionCommand|null;attemptedChoice:GuidanceDecisionCommand['choice']|null;reason:string|null;reviewBasis:Basis|null;error:number|null}
export const guidanceIntentKey=(session:PlanSessionBoundary)=>`plan-guidance-intents:${session.key}:client`;
/** The sole V3 decision intent. Same canonical choice ledger on the server;
 * only exact pending request/basis/recovery state lives in session memory here. */
export function createGuidanceDecisionController(initial:GuidanceDecisionContext){
 let ctx=initial,epoch=0,operation:object|null=null,disposed=false,restricted=initial.view.access!=='active'||initial.mode!=='client',stop:()=>void=()=>{};
 const listeners=new Set<()=>void>();
 const empty=():GuidanceDecisionIntent=>({phase:'idle',command:null,attemptedChoice:null,reason:null,reviewBasis:null,error:null});
 const ledgerKey=guidanceIntentKey(initial.session),prior=initial.mode==='client'?initial.session.memory.get<Record<string,GuidanceDecisionIntent>>(ledgerKey)?.[initial.decision.id]:undefined;
 let state=prior?{...prior,phase:prior.phase==='saving'||prior.phase==='refreshing'?'uncertain' as const:prior.phase}:empty();
 const endedState=empty();
 const live=()=>!disposed&&ctx.session===initial.session&&ctx.session.isCurrent();
 function emit(next:GuidanceDecisionIntent){if(!live())return;state=next;if(ctx.mode==='client')ctx.session.memory.set(ledgerKey,{...ctx.session.memory.get<Record<string,GuidanceDecisionIntent>>(ledgerKey),[initial.decision.id]:state});listeners.forEach(fn=>fn());}
 const writable=()=>live()&&ctx.mode==='client'&&ctx.view.access==='active'&&ctx.view.currentGuidance?.mode==='current_document'&&!!ctx.port&&!!ctx.onViewChange;
 function begin(){if(operation||!live())return null;const op={},captured=ctx,start=epoch;operation=op;return{ctx:captured,current:()=>live()&&operation===op&&epoch===start,finish(){if(operation===op)operation=null;}};}
 async function read(c:GuidanceDecisionContext){if(!c.port)throw Error('unavailable');const command={schemaVersion:1,action:'read_client_plan_v3',version:null} as const;return mapReviewResult(await c.port.execute(command),command) as ClientPlanViewV3;}
 function basis(c:GuidanceDecisionContext,view:ClientPlanViewV3):Basis|null{return view.access==='active'&&view.currentGuidance?.mode==='current_document'?{view,session:c.session,mode:c.mode,token:c.scope.token,epoch:c.scope.epoch+Number(view!==c.view),snapshot:view.currentGuidance.snapshot}:null;}
 function reviewable(c:GuidanceDecisionContext,b:Basis|null){return !!b&&c.ready()&&b.view===c.view&&b.session===c.session&&b.mode===c.mode&&b.token===c.scope.token&&b.epoch===c.scope.epoch&&sameCareValue(b.snapshot,c.view.currentGuidance?.snapshot);}
 async function confirm(op:NonNullable<ReturnType<typeof begin>>,command:GuidanceDecisionCommand,receipt:unknown){
  mapReviewResult(receipt,command);const next=await read(op.ctx);if(!op.current())return;
  const recorded=next.decisions.find(d=>d.decisionId===command.decisionId);
  emit({...state,command:null,phase:recorded?.choice===command.choice&&recorded.reason===command.reason?'saved':'acknowledged',error:null});
  op.ctx.onViewChange?.(next);
 }
 async function write(command:GuidanceDecisionCommand,retry:boolean){
  const op=begin();if(!op)return;const pending={...state,command,attemptedChoice:command.choice,reason:command.reason,phase:'saving' as const,error:null};emit(pending);
  let acknowledged=false;
  try{const receipt=await op.ctx.port!.execute(command);if(!op.current())return;mapReviewResult(receipt,command);acknowledged=true;emit({...state,phase:'refreshing'});await confirm(op,command,receipt);}
  catch(error){if(!op.current())return;const status=(error as {status?:number}).status??503;
   if(!retry&&!acknowledged&&status===409){emit({...pending,phase:'conflict',command:null,reviewBasis:null,error:409});try{const next=await read(op.ctx);if(op.current()){emit({...state,reviewBasis:basis(op.ctx,next)});op.ctx.onViewChange?.(next);}}catch{/* A failed current read cannot unlock the rejected intent. */}}
   else if(!retry&&!acknowledged&&[400,403,404,413,415,429].includes(status))emit({...pending,command:null,phase:'denied',error:status});
   else emit({...pending,phase:'uncertain',error:status});
  }finally{op.finish();}
 }
 return{
  getSnapshot:()=>live()?state:endedState,
  subscribe(fn:()=>void){listeners.add(fn);if(listeners.size===1)stop=ctx.session.subscribeInvalidation(()=>{operation=null;epoch++;state=empty();listeners.forEach(f=>f());});return()=>{listeners.delete(fn);if(!listeners.size)stop();};},
  context(next:GuidanceDecisionContext){
   if(ctx.view!==next.view||ctx.mode!==next.mode||ctx.session!==next.session||ctx.scope.token!==next.scope.token||ctx.scope.epoch!==next.scope.epoch){epoch++;operation=null;if(state.phase==='saving'||state.phase==='refreshing')state={...state,phase:'uncertain'};}
   const wasRestricted=restricted;restricted=next.view.access!=='active'||next.mode!=='client'||next.view.currentGuidance?.mode!=='current_document';
   if(wasRestricted&&!restricted&&!state.command)state={...state,phase:'conflict',reviewBasis:null};
   ctx=next;
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
    emit({...state,phase:same?'idle':'conflict',reviewBasis:basis(op.ctx,next),error:null});op.ctx.onViewChange?.(next);
   }catch(error){if(op.current())emit({...state,phase:'conflict',error:(error as {status?:number}).status??503});}
   finally{op.finish();}
  },
  retire(){epoch++;operation=null;if(state.phase==='saving'||state.phase==='refreshing')state={...state,phase:'uncertain'};},
  dispose(){disposed=true;epoch++;operation=null;stop();listeners.clear();},
 };
}
