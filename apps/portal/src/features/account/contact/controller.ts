import type {ApplicationSession} from '../../../app/session.ts';
import {createClientAccountContactRequest} from '../../../app/account-contact-request.ts';
import {TransportError} from '../../../transport/session.ts';
import {readAccountContactCommand} from '../../../../../../src/contracts/PortalAccountContactValidation.ts';
import type {AccountContactCommand} from '../../../../../../src/contracts/PortalAccountContact.ts';
import {initialAccountContactSnapshot,emailDraftError} from './model.ts';
import type {AccountContactController,AccountContactSnapshot} from './types.ts';

type Stored=Pick<AccountContactSnapshot,'original'|'receipt'|'originalStatus'>;
type Lane=Stored&{readonly owner:object;readonly retire:()=>void};
type Operation={readonly kind:'load'|'request'|'status';readonly abort:AbortController};
const memoryKey='account.contact.original.v1';
/** Creation-bound actual session only. Constructor and SSR do no work. The first
 * explicit action claims local custody; that custody never grants server rights. */
export function createAccountContactController(runtime:ApplicationSession,options?:{isApplicable?:()=>boolean}):AccountContactController {
  const boundary=runtime.getSnapshot().boundary,port=createClientAccountContactRequest(runtime),owner=Object.freeze({}),listeners=new Set<()=>void>();
  let state=initialAccountContactSnapshot(),active:Operation|null=null,started=false,terminal=false,disposed=false,reconciling=false,checkingApplicability=false;
  let stopRuntime:(()=>void)|undefined,stopBoundary:(()=>void)|undefined;
  function same():boolean {
    return !!boundary&&runtime.getSnapshot().boundary===boundary&&boundary.isCurrent()&&runtime.getSnapshot().boundary===boundary&&runtime.cookie.audience==='client'&&runtime.cookie.identity?.role==='client';
  }
  function lane():Lane|undefined {return boundary?.memory.get<Lane>(memoryKey);}
  function ownsLane():boolean {return !started||lane()?.owner===owner;}
  function notify():void {
    const published=state;
    for(const fn of [...listeners]){
      if(state!==published||disposed)break;
      if(listeners.has(fn)){try{fn();}catch{/* Isolate local observers. */}}
    }
  }
  function publish(next:AccountContactSnapshot):void {state=Object.freeze(next);notify();}
  function cleanup(fn:(()=>void)|undefined):void {try{fn?.();}catch{/* All captured cleanup must run. */}}
  function retire(phase:'ended'|'denied',forget=true):void {
    if(terminal)return;
    terminal=true;
    const prior=active;active=null;
    const a=stopRuntime,b=stopBoundary;stopRuntime=stopBoundary=undefined;
    // Clear every private field before memory, abort, cleanup or observer callbacks.
    state=Object.freeze({...initialAccountContactSnapshot(),phase,message:phase==='ended'?'your session has ended. sign in again.':'you do not have access to these contact details.'});
    try{if(forget&&started&&lane()?.owner===owner)boundary?.memory.delete(memoryKey);}catch{/* Invalid actual boundary already cleared memory. */}
    cleanup(()=>prior?.abort.abort());cleanup(a);cleanup(b);notify();
  }
  function usable(ready=false):boolean {
    if(disposed||terminal)return false;
    if(!same()||!ownsLane()){retire('ended');return false;}
    if(runtime.cookie._view?.capabilities.view!==true){retire('denied');return false;}
    // A local predicate may inspect or retire this controller. Reentrant actions
    // cannot recursively evaluate it or begin a second operation.
    if(checkingApplicability)return false;
    let applies=true;checkingApplicability=true;
    try{applies=options?.isApplicable===undefined||options.isApplicable()===true;}catch{applies=false;}
    finally{checkingApplicability=false;}
    if(disposed||terminal)return false;
    if(!same()||!ownsLane()){retire('ended');return false;}
    if(runtime.cookie._view?.capabilities.view!==true){retire('denied');return false;}
    if(!applies){retire('ended',false);return false;}
    return !ready||runtime.cookie.status==='ready';
  }
  function reconcile():void {
    if(reconciling||disposed||terminal)return;
    reconciling=true;
    try{usable();}finally{reconciling=false;}
  }
  function remember():boolean {
    if(!usable()||!started)return false;
    boundary!.memory.set(memoryKey,Object.freeze({owner,retire:()=>retire('ended'),original:state.original,receipt:state.receipt,originalStatus:state.originalStatus}));
    return usable();
  }
  function start():boolean {
    if(!usable())return false;
    if(started)return true;
    const previous=lane();
    if(!usable())return false;
    started=true;
    boundary!.memory.set(memoryKey,Object.freeze({owner,retire:()=>retire('ended'),original:previous?.original??null,receipt:previous?.receipt??null,originalStatus:previous?.originalStatus??null}));
    // Registration is lazy and cleanup remains owned even under synchronous reentry.
    const a=runtime.subscribe(reconcile);
    if(terminal||disposed){cleanup(a);return false;}stopRuntime=a;
    const b=boundary!.subscribeInvalidation(reconcile);
    if(terminal||disposed){cleanup(b);cleanup(stopRuntime);stopRuntime=undefined;return false;}stopBoundary=b;
    state=Object.freeze({...state,original:previous?.original??null,receipt:previous?.receipt??null,originalStatus:previous?.originalStatus??null,requestState:previous?.original?'uncertain':'idle'});
    cleanup(previous?.retire);
    return usable();
  }
  function owns(op:Operation,ready=false):boolean {return active===op&&usable(ready)&&active===op&&!op.abort.signal.aborted;}
  function begin(kind:Operation['kind']):Operation {
    const op={kind,abort:new AbortController()};active=op;
    publish({...state,busy:kind,message:null,...(kind==='load'?{phase:'loading' as const,current:null,review:null}:{}),...(kind==='request'?{requestState:'requesting' as const,review:null}:{} )});
    return op;
  }
  async function ready(op:Operation):Promise<boolean> {
    if(!owns(op))return false;
    if(runtime.cookie.status==='offline')await runtime.restore();
    return owns(op,true);
  }
  function finish(op:Operation,next:AccountContactSnapshot):boolean {
    if(!owns(op,true))return false;
    active=null;publish({...next,busy:null});
    return usable(true)&&active===null;
  }
  function fail(op:Operation,error:unknown):boolean {
    if(!owns(op))return false;
    const status=error instanceof TransportError?error.status:503;
    if(status===401||status===403){retire(status===401?'ended':'denied');return false;}
    active=null;
    if(op.kind==='load')publish({...state,phase:'unavailable',current:null,review:null,busy:null,message:'email details are unavailable. refresh to try again.'});
    else if(op.kind==='request'){
      state=Object.freeze({...state,review:null,busy:null,requestState:status===409?'conflict':'uncertain',message:status===409?'email details changed. refresh and compare your unsent edit.':'the original request outcome is uncertain. check its status.'});
      remember();notify();
    }else publish({...state,busy:null,message:'the original request status is unavailable. check again later.'});
    return false;
  }
  function mayRequest():boolean {
    if(!state.original)return true;
    if(state.originalStatus?.state==='provider_rejected')return true;
    // Current facts may permit a later deliberate request, but never resolve an
    // unknown original or claim which request caused a changed canonical email.
    return (state.receipt!==null||state.originalStatus?.state==='provider_accepted')&&state.current?.pendingEmail.state==='none'&&state.current.contactBasis!==state.original.expectedContactBasis;
  }
  async function load():Promise<boolean> {
    if(!start()||active)return false;
    const op=begin('load');
    try{
      if(!await ready(op))return false;
      const result=await port.execute({schemaVersion:1,action:'read_account_contact_v1'},{signal:op.abort.signal,isApplicable:()=>owns(op,true)});
      if(!owns(op,true))return false;
      if(!('contactBasis' in result))throw new TransportError(503);
      const conflict=state.draft!==null&&state.draft.expectedContactBasis!==result.contactBasis;
      return finish(op,{...state,phase:'ready',current:result,review:null,requestState:conflict?'conflict':state.requestState,message:conflict?'email details changed. compare your unsent edit with the current details.':null});
    }catch(error){return fail(op,error);}
  }
  function editEmail():void {
    if(!start()||!usable(true)||active||!state.current||state.current.currentEmail.state!=='known')return;
    publish({...state,draft:Object.freeze({email:state.draft?.email??state.current.currentEmail.address,expectedContactBasis:state.current.contactBasis}),review:null,emailError:null,requestState:state.original&&!mayRequest()?'uncertain':'idle',message:null});
  }
  function setEmail(email:string):void {
    if(!started||!usable()||active||!state.draft||typeof email!=='string')return;
    publish({...state,draft:Object.freeze({...state.draft,email}),review:null,emailError:null,requestState:state.original&&!mayRequest()?'uncertain':'idle',message:null});
  }
  function reviewEmail():boolean {
    if(!started||!usable(true)||active||!state.current||!state.draft||!mayRequest()||state.current.pendingEmail.state==='pending')return false;
    const draft=state.draft,current=state.current,error=emailDraftError(draft.email);
    if(!usable(true)||state.draft!==draft||state.current!==current||active)return false;
    if(error){publish({...state,emailError:error,review:null});return false;}
    if(draft.expectedContactBasis!==current.contactBasis){publish({...state,review:null,requestState:'conflict',message:'email details changed. compare your unsent edit with the current details.'});return false;}
    if(current.currentEmail.state==='known'&&current.currentEmail.address===draft.email){publish({...state,review:null,emailError:'enter a different email address.'});return false;}
    publish({...state,review:draft,emailError:null,requestState:'reviewing',message:null});
    return usable(true)&&state.review===draft;
  }
  async function requestChange():Promise<boolean> {
    if(!started||!usable(true)||active||!state.current||!state.review||state.review!==state.draft||!mayRequest()||state.current.pendingEmail.state==='pending')return false;
    const review=state.review;
    if(review.expectedContactBasis!==state.current.contactBasis||emailDraftError(review.email))return false;
    const command=readAccountContactCommand({schemaVersion:1,action:'request_account_email_change_v1',requestId:crypto.randomUUID(),expectedContactBasis:review.expectedContactBasis,email:review.email});
    if(!usable(true)||active||state.review!==review)return false;
    if(command.action!=='request_account_email_change_v1')return false;
    const op=begin('request');
    if(!owns(op,true))return false;
    // Publication can reenter and discard the unsent edit. No intent has been
    // installed or invoked until the exact reviewed draft is still owned.
    if(state.draft!==review){active=null;publish({...state,busy:null,requestState:'idle'});return false;}
    state=Object.freeze({...state,original:command,receipt:null,originalStatus:null,draft:null});
    if(!remember()||!owns(op,true))return false;
    try{
      const result=await port.execute(command,{signal:op.abort.signal,isApplicable:()=>owns(op,true)});
      if(!owns(op,true)||state.original!==command)return false;
      if(!('outcome' in result))throw new TransportError(503,'write');
      state=Object.freeze({...state,receipt:result,requestState:'acknowledged'});
      if(!remember())return false;
      return finish(op,state);
    }catch(error){return fail(op,error);}
  }
  async function readOriginalStatus():Promise<boolean> {
    if(!start()||active||!state.original)return false;
    const original=state.original,op=begin('status');
    const command:AccountContactCommand=Object.freeze({schemaVersion:1,action:'read_account_email_change_request_v1',requestId:original.requestId});
    try{
      if(!await ready(op))return false;
      const result=await port.execute(command,{signal:op.abort.signal,isApplicable:()=>owns(op,true)});
      if(!owns(op,true)||state.original!==original)return false;
      if(!('state' in result))throw new TransportError(503);
      state=Object.freeze({...state,originalStatus:result,requestState:result.state==='provider_accepted'||result.state==='provider_rejected'?'acknowledged':'uncertain'});
      if(!remember())return false;
      return finish(op,state);
    }catch(error){return fail(op,error);}
  }
  function discardEdit():void {
    const draft=state.draft,review=state.review;
    if(!started||!usable()||active?.kind==='request'||state.draft!==draft||state.review!==review)return;
    publish({...state,draft:null,review:null,emailError:null,requestState:state.original?'uncertain':'idle',message:null});
  }
  return {
    getSnapshot(){reconcile();return state;},
    subscribe(fn){if(disposed)return()=>{};listeners.add(fn);return()=>{listeners.delete(fn);};},
    load,editEmail,setEmail,reviewEmail,requestChange,readOriginalStatus,discardEdit,
    dispose(){
      if(disposed)return;
      // Preserve only the immutable historical original in actual session memory.
      // Retire private locals before cancellation and cleanup can reenter.
      disposed=true;terminal=true;
      const prior=active;active=null;const a=stopRuntime,b=stopBoundary;stopRuntime=stopBoundary=undefined;
      state=Object.freeze({...initialAccountContactSnapshot(),phase:'ended'});listeners.clear();
      cleanup(()=>prior?.abort.abort());cleanup(a);cleanup(b);
    },
  };
}
