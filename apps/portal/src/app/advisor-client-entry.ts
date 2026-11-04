import type {ApplicationSession} from './session.ts';
import type {PortalNavigationCore} from '../navigation/react.tsx';
import {parseRoute} from '../navigation/routes.ts';
import {readUuid} from '../../../../src/contracts/ConciergePortalValidation.ts';
import {createAdvisorClientPlansRequest} from './advisor-client-plans-request.ts';
import {createAdvisorClientWorkspaceController} from '../features/advisor/client-workspace/controller.ts';
import type {AdvisorClientWorkspaceController} from '../features/advisor/client-workspace/types.ts';
import {TransportError} from '../transport/session.ts';

type Snapshot=Readonly<{phase:'idle'|'active'|'inactive'|'ended';clientId:string;controller:AdvisorClientWorkspaceController|null}>;
type Owner={retire():void};
const owners=new WeakMap<PortalNavigationCore,Owner>(),lifetimes=new WeakMap<PortalNavigationCore,Owner>();

/** The client route owns one metadata controller. It never mutates the global
 * advisor directory/selection and cannot supply server VIEW authorization. */
export function createAdvisorClientEntry(runtime:ApplicationSession,navigation:PortalNavigationCore,clientId:string){
 clientId=readUuid(clientId).toLowerCase();
 const boundary=runtime.getSnapshot().boundary,cookie=runtime.cookie,actor=cookie.identity?.ownerId,
  epoch=cookie._epoch,generation=cookie.generation,serverGeneration=cookie._view?.generation,csrf=cookie._view?.csrf,
  path=navigation.getSnapshot(),listeners=new Set<()=>void>();
 const blank=(phase:Snapshot['phase']):Snapshot=>Object.freeze({phase,clientId,controller:null});
 let state=blank('idle'),controller:AdvisorClientWorkspaceController|null=null;
 let running=false,disposed=false,superseded=false,checking=false,sequence=0,cleanups:(()=>void)[]=[];
 const owner:Owner={retire(){superseded=true;retire('ended');}};
 function safe(fn:()=>void){try{fn();}catch{/* Finish remaining own retirement. */}}
 function same(){return !disposed&&!superseded&&!!boundary&&runtime.getSnapshot().boundary===boundary&&cookie.audience==='advisor'&&
  cookie.identity?.role==='advisor'&&cookie.identity.ownerId===actor&&cookie._epoch===epoch&&cookie.generation===generation&&cookie._view?.generation===serverGeneration&&cookie._view?.csrf===csrf;}
 function lifetime(){if(checking||!same())return false;checking=true;let valid=false;try{valid=boundary!.isCurrent();}finally{checking=false;}return valid&&same();}
 function onRoute(){const current=navigation.getSnapshot(),route=parseRoute(current);return current===path&&route?.name==='advisor-client'&&route.clientId.toLowerCase()===clientId;}
 function applicable(){return running&&owners.get(navigation)===owner&&lifetime()&&onRoute()&&running&&owners.get(navigation)===owner&&same();}
 function emit(expected:Snapshot){for(const fn of [...listeners]){if(state!==expected)break;if(listeners.has(fn))safe(fn);}}
 function retire(phase:Snapshot['phase']){
  const old=controller,detach=cleanups;sequence++;running=false;controller=null;cleanups=[];state=blank(phase);const next=state;
  if(owners.get(navigation)===owner)owners.delete(navigation);
  if(phase==='ended'&&lifetimes.get(navigation)===owner)lifetimes.delete(navigation);
  for(const stop of detach)safe(stop);if(old)safe(()=>old.dispose());if(state===next)emit(next);
 }
 function reconcile(){if(!running||checking)return;const token=sequence,child=controller,valid=applicable();
  if(token!==sequence||!running||child!==controller)return;
  if(!valid){retire(same()?'inactive':'ended');return;}
  const phase=child?.getSnapshot().phase;
  if(token===sequence&&running&&child===controller&&phase==='ended'){superseded=true;retire('ended');}
 }
 function still(token:number){return token===sequence&&applicable()&&token===sequence&&running;}
 function attach(stop:()=>void,token:number){if(token===sequence&&running)cleanups.push(stop);else safe(stop);}
 function start(){
  if(running){reconcile();if(running)return;}
  if(disposed||superseded)return;
  const token=++sequence;
  if(!lifetime()||token!==sequence){if(token===sequence)retire('ended');return;}
  if(!onRoute()){retire('inactive');return;}
  const previous=lifetimes.get(navigation);running=true;owners.set(navigation,owner);lifetimes.set(navigation,owner);if(previous!==owner)previous?.retire();
  if(!still(token)){if(token===sequence)retire(same()?'inactive':'ended');return;}
  attach(navigation.subscribe(reconcile),token);if(!still(token)){reconcile();return;}
  attach(runtime.subscribe(reconcile),token);attach(boundary!.subscribeInvalidation(reconcile),token);
  if(!still(token)){reconcile();return;}
  const fixed=createAdvisorClientPlansRequest(runtime,clientId);
  const next=createAdvisorClientWorkspaceController({runtime,clientId,readPlans:{async execute(input,options={}){
   if(!applicable())throw new TransportError(401);
   const signal=options.signal,local=options.isApplicable;
   const allowed=()=>{if(!applicable())return false;const accepted=local===undefined||local()===true;return applicable()&&accepted;};
   if(!allowed())throw new TransportError(503);
   const result=await fixed.execute(input,{signal,isApplicable:allowed});
   if(!allowed())throw new TransportError(503);return result;
  }}});
  if(!still(token)){next.dispose();reconcile();return;}
  controller=next;attach(next.subscribe(reconcile),token);
  state=Object.freeze({phase:'active',clientId,controller:next});emit(state);
 }
 function isCurrent(rendered:Snapshot){return state===rendered&&rendered.phase==='active'&&rendered.controller===controller&&applicable()&&cookie.status==='ready'&&state===rendered;}
 return Object.freeze({getSnapshot(){reconcile();return state;},subscribe(fn:()=>void){if(disposed)return()=>{};listeners.add(fn);return()=>{listeners.delete(fn);};},start,isCurrent,
  openDraft(rendered:Snapshot,draftId:string){
   if(!isCurrent(rendered)||!controller)return;
   const child=controller,current=child.getSnapshot();if(current.phase!=='ready')return;
   const row=current.directory?.drafts.find(d=>d.id===draftId&&d.clientId===clientId);
   if(!row||!isCurrent(rendered)||child.getSnapshot()!==current)return;
   navigation.navigate({name:'advisor-editor',draftId:row.id,section:'sources'});
  },
  stop(){if(!disposed)retire('idle');},dispose(){if(disposed)return;disposed=true;retire('ended');listeners.clear();},
 });
}
export type AdvisorClientEntry=ReturnType<typeof createAdvisorClientEntry>;
