import type {ApplicationSession} from './session.ts';
import type {PortalNavigationCore} from '../navigation/react.tsx';
import {parseRoute} from '../navigation/routes.ts';
import {createClientPaymentPorts} from './client-payments-request.ts';
import {createClientPaymentsController} from '../features/payments/controller.ts';
import type {ClientPaymentsController} from '../features/payments/types.ts';
import type {OperationPort} from '../transport/session.ts';
import {TransportError} from '../transport/session.ts';

type Snapshot=Readonly<{phase:'idle'|'active'|'inactive'|'ended';controller:ClientPaymentsController|null}>;
type Owner={retire():void};
const owners=new WeakMap<PortalNavigationCore,Owner>();
const lifetimes=new WeakMap<PortalNavigationCore,Owner>();
const empty=(phase:Snapshot['phase']):Snapshot=>Object.freeze({phase,controller:null});

/** Independent of care/publication and service-history reads. A route only
 * limits relevance; actual own-client authority stays in the retained channel. */
export function createServicePaymentEntry(runtime:ApplicationSession,navigation:PortalNavigationCore){
 const boundary=runtime.getSnapshot().boundary,cookie=runtime.cookie,actor=cookie.identity?.ownerId,
  epoch=cookie._epoch,generation=cookie.generation,serverGeneration=cookie._view?.generation;
 const listeners=new Set<()=>void>();
 let state:Snapshot=empty('idle'),controller:ClientPaymentsController|null=null;
 let running=false,disposed=false,superseded=false,sequence=0,cleanups:(()=>void)[]=[],initial:Promise<void>|null=null;
 const owner:Owner={retire(){superseded=true;retire('ended');}};
 function same(){return !disposed&&!superseded&&!!boundary&&runtime.getSnapshot().boundary===boundary&&
  cookie.audience==='client'&&cookie.identity?.role==='client'&&cookie.identity.ownerId===actor&&
  cookie._epoch===epoch&&cookie.generation===generation&&cookie._view?.generation===serverGeneration;}
 function lifetime(){if(!same())return false;const valid=boundary!.isCurrent();return valid&&same();}
 function applicable(){return running&&owners.get(navigation)===owner&&lifetime()&&
  parseRoute(navigation.getSnapshot())?.name==='account-service'&&running&&owners.get(navigation)===owner&&same();}
 function emit(expected:Snapshot){for(const fn of [...listeners]){if(state!==expected)break;if(listeners.has(fn))try{fn();}catch{/* Local observer. */}}}
 function retire(phase:Snapshot['phase']){
  const old=controller,detach=cleanups;sequence++;running=false;controller=null;cleanups=[];initial=null;state=empty(phase);
  const next=state;if(owners.get(navigation)===owner)owners.delete(navigation);
  if(phase==='ended'&&lifetimes.get(navigation)===owner)lifetimes.delete(navigation);
  for(const stop of detach)try{stop();}catch{/* Finish own retirement. */}
  try{old?.dispose();}catch{/* Ownership and private state are already cleared. */}
  if(state===next)emit(next);
 }
 function reconcile(){if(!running)return;const token=sequence,captured=controller,valid=applicable();
  if(token!==sequence||!running||controller!==captured)return;
  if(!valid){retire(same()?'inactive':'ended');return;}
  const phase=captured?.getSnapshot().phase;
  if(token===sequence&&running&&controller===captured&&phase==='ended'){superseded=true;retire('ended');}
 }
 function still(token:number){return token===sequence&&applicable()&&token===sequence&&running;}
 function attach(stop:()=>void,token:number){if(token===sequence&&running)cleanups.push(stop);else stop();}
 function restrict<I,O>(port:OperationPort<I,O>):OperationPort<I,O>{return {async execute(input,options={}){
  if(!applicable())throw new TransportError(401);
  const signal=options.signal,local=options.isApplicable;
  const allowed=()=>{if(!applicable())return false;const valid=local===undefined||local()===true;return applicable()&&valid;};
  if(!allowed())throw new TransportError(503);
  const result=await port.execute(input,{signal,isApplicable:allowed});
  if(!allowed())throw new TransportError(503);return result;
 } };}
 function start():Promise<void>{
  if(running){reconcile();if(running)return initial??Promise.resolve();}
  if(disposed||superseded)return Promise.resolve();
  const token=++sequence;
  if(!lifetime()||token!==sequence){if(token===sequence)retire('ended');return Promise.resolve();}
  if(parseRoute(navigation.getSnapshot())?.name!=='account-service'){retire('inactive');return Promise.resolve();}
  const previous=lifetimes.get(navigation);running=true;owners.set(navigation,owner);lifetimes.set(navigation,owner);
  if(previous!==owner)previous?.retire();
  if(!still(token)){if(token===sequence)retire(same()?'inactive':'ended');return Promise.resolve();}
  attach(navigation.subscribe(reconcile),token);if(!still(token)){reconcile();return Promise.resolve();}
  attach(runtime.subscribe(reconcile),token);attach(boundary!.subscribeInvalidation(reconcile),token);
  if(!still(token)){reconcile();return Promise.resolve();}
  const ports=createClientPaymentPorts(runtime),next=createClientPaymentsController(runtime,{read:restrict(ports.read),claim:restrict(ports.claim)});
  if(!still(token)){next.dispose();reconcile();return Promise.resolve();}
  controller=next;attach(next.subscribe(reconcile),token);
  state=Object.freeze({phase:'active',controller:next});const published=state;
  const read=Promise.resolve().then(async()=>{if(still(token)&&controller===next)await next.load();});
  initial=read;emit(published);return read;
 }
 return Object.freeze({getSnapshot(){reconcile();return state;},subscribe(fn:()=>void){if(disposed)return()=>{};listeners.add(fn);return()=>{listeners.delete(fn);};},start,
  stop(){if(!disposed)retire('idle');},dispose(){if(disposed)return;disposed=true;retire('ended');listeners.clear();}});
}
export type ServicePaymentEntry=ReturnType<typeof createServicePaymentEntry>;
