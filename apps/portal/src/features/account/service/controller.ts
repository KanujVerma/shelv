import type {ApplicationSession} from '../../../app/session.ts';
import {createClientAccountServiceRequest} from '../../../app/account-service-request.ts';
import {TransportError} from '../../../transport/session.ts';
import type {ClientServiceCancelCommand,ClientServiceReceipt,ClientServiceStatus,ClientServiceView} from '../../../../../../src/contracts/PortalClientService.ts';
import {readClientServiceCommand,readClientServiceReceipt,readClientServiceStatus,readClientServiceView} from '../../../../../../src/contracts/PortalClientServiceValidation.ts';
import {clientServiceMaximumRevision} from '../../../../../../src/contracts/PortalClientServiceValues.ts';
import type {AccountServiceController,AccountServiceState,CancellationDraft} from './types.ts';
import {initialServiceState,matchesCancellationDraft} from './model.ts';

type Stored={readonly original:ClientServiceCancelCommand|null;readonly review:CancellationDraft|null;readonly receipt:ClientServiceReceipt|null;readonly status:ClientServiceStatus|null;readonly conflict:boolean};
type Lane=Stored&{readonly owner:object;readonly retire:()=>void};
type Operation={readonly kind:NonNullable<AccountServiceState['busy']>;readonly context:string;readonly abort:AbortController;readonly original:ClientServiceCancelCommand|null};
const memoryKey='account.service.original.v1';
const emptyStored:Stored=Object.freeze({original:null,review:null,receipt:null,status:null,conflict:false});

/** Construction/render/subscription do not load, restore or claim a lane.
 * All transport authority comes from the actual ApplicationSession and Root. */
export function createAccountServiceController(runtime:ApplicationSession,options?:{isApplicable?:()=>boolean}):AccountServiceController {
  const boundary=runtime.getSnapshot().boundary,actor=runtime.cookie.identity?.ownerId,
    epoch=runtime.cookie._epoch,generation=runtime.cookie.generation,serverGeneration=runtime.cookie._view?.generation;
  const owner=Object.freeze({}),port=createClientAccountServiceRequest(runtime),listeners=new Set<()=>void>();
  let state=initialServiceState(),stored=emptyStored,active:Operation|null=null,started=false,terminal=false,disposed=false,
    reconciling=false,checking=false,draftGeneration=0,serial=0;
  let stopRuntime:(()=>void)|undefined,stopBoundary:(()=>void)|undefined;
  const fingerprint=()=>JSON.stringify([runtime.cookie.identity,runtime.cookie.generation,runtime.cookie._epoch,runtime.cookie._view]);
  let observed=fingerprint();
  const cleanup=(fn:(()=>void)|undefined)=>{try{fn?.();}catch{/* Finish all owned cleanup. */}};
  function same():boolean {
    const matches=()=>!disposed&&!terminal&&!!boundary&&runtime.getSnapshot().boundary===boundary&&
      runtime.cookie.audience==='client'&&runtime.cookie.identity?.role==='client'&&runtime.cookie.identity.ownerId===actor&&
      runtime.cookie._epoch===epoch&&runtime.cookie.generation===generation&&runtime.cookie._view?.generation===serverGeneration;
    if(!matches())return false;
    const valid=boundary!.isCurrent();return valid&&matches();
  }
  function lane():Lane|undefined{return boundary?.memory.get<Lane>(memoryKey);}
  function notify(){
    const expected=state;
    for(const listener of [...listeners]){
      if(state!==expected||disposed)break;
      if(listeners.has(listener))try{listener();}catch{/* Observers grant no authority. */}
    }
  }
  function decorated(next:AccountServiceState):AccountServiceState {
    const ready=runtime.cookie.status==='ready'&&runtime.cookie._view?.capabilities.view===true&&next.phase==='ready'&&next.busy===null;
    const current=next.current,available=current?.periodEndCancellation.state==='available';
    return Object.freeze({...next,
      canReview:ready&&available===true,
      canConfirm:ready&&stored.original===null&&current!==null&&current.serviceRevision<clientServiceMaximumRevision&&matchesCancellationDraft(current,next.draft),
      // Exact-original recovery is not a new cancellation intent. The server
      // resolves its immutable UUID/body through idempotency and CAS even if
      // current coverage changed after an absent status observation.
      canRetry:ready&&current!==null&&!stored.conflict&&stored.original!==null&&stored.receipt===null&&stored.status?.state==='absent'});
  }
  function publish(next:AccountServiceState){state=decorated(next);notify();}
  function retire(phase:'ended'|'denied'|'inactive'){
    if(terminal)return;
    terminal=true;serial++;
    const prior=active;active=null;const a=stopRuntime,b=stopBoundary;stopRuntime=stopBoundary=undefined;
    // Private local state is empty before abort, cleanup or subscriber callbacks.
    // Only the already-stored immutable original survives in session memory.
    state=Object.freeze({...initialServiceState(),phase,message:phase==='ended'?'your session has ended. sign in again.':phase==='denied'?'you do not have access to service details.':null});
    stored=emptyStored;cleanup(()=>prior?.abort.abort());cleanup(a);cleanup(b);notify();
  }
  function usable(ready=false):boolean {
    if(disposed||terminal)return false;
    if(!same()||started&&lane()?.owner!==owner){retire('ended');return false;}
    if(runtime.cookie._view?.capabilities.view!==true){retire('denied');return false;}
    if(checking)return false;
    let applies=false;checking=true;
    try{applies=options?.isApplicable===undefined||options.isApplicable()===true;}catch{/* Deny only. */}
    finally{checking=false;}
    if(disposed||terminal)return false;
    if(!same()||started&&lane()?.owner!==owner){retire('ended');return false;}
    if(runtime.cookie._view?.capabilities.view!==true){retire('denied');return false;}
    if(!applies){retire('inactive');return false;}
    return !ready||runtime.cookie.status==='ready';
  }
  function reconcile(){
    if(!started||reconciling||disposed||terminal)return;
    reconciling=true;
    try{
      if(!usable())return;
      const context=fingerprint();
      if(context!==observed){
        observed=context;serial++;const prior=active;active=null;
        state=Object.freeze({...initialServiceState(),phase:'unavailable',message:'read your current service details again.'});
        cleanup(()=>prior?.abort.abort());notify();return;
      }
      if(runtime.cookie.status!=='ready'&&(state.current!==null||active!==null)){
        serial++;const prior=active;active=null;
        state=Object.freeze({...state,phase:'unavailable',current:null,busy:null,canReview:false,canConfirm:false,canRetry:false,
          writeState:stored.receipt?'acknowledged':stored.conflict?'conflict':stored.original?'uncertain':state.writeState,
          message:stored.original&&!stored.receipt?'the original cancellation result is uncertain. check its status.':'current service details are unavailable.'});
        cleanup(()=>prior?.abort.abort());notify();
      }
    }finally{reconciling=false;}
  }
  function remember():boolean {
    if(!same()||!started||lane()?.owner!==owner)return false;
    boundary!.memory.set(memoryKey,Object.freeze({...stored,owner,retire:()=>retire('ended')}));
    return same()&&lane()?.owner===owner;
  }
  function start():boolean {
    if(!usable())return false;
    if(started)return true;
    const previous=lane();if(!usable())return false;
    stored=previous?Object.freeze({original:previous.original,review:previous.review,receipt:previous.receipt,status:previous.status,conflict:previous.conflict}):emptyStored;
    started=true;observed=fingerprint();
    boundary!.memory.set(memoryKey,Object.freeze({...stored,owner,retire:()=>retire('ended')}));
    const a=runtime.subscribe(reconcile);if(terminal||disposed){cleanup(a);return false;}stopRuntime=a;
    const b=boundary!.subscribeInvalidation(reconcile);if(terminal||disposed){cleanup(b);cleanup(stopRuntime);stopRuntime=undefined;return false;}stopBoundary=b;
    // Stored originals are not disclosed by generic VIEW or local lane custody.
    // Only canonical(), after the actual own-service read, may publish them.
    cleanup(previous?.retire);return usable();
  }
  function owns(op:Operation,ready=false):boolean {
    if(active!==op||op.abort.signal.aborted||!usable(ready))return false;
    return active===op&&!op.abort.signal.aborted&&fingerprint()===op.context;
  }
  function begin(kind:Operation['kind'],original:ClientServiceCancelCommand|null=null):Operation|null {
    if(!usable())return null;
    const ticket=++serial,prior=active;active=null;
    state=Object.freeze({...state,busy:null,current:null,canReview:false,canConfirm:false,canRetry:false,
      writeState:stored.receipt?'acknowledged':stored.conflict?'conflict':stored.original?'uncertain':state.writeState});
    cleanup(()=>prior?.abort.abort());
    if(serial!==ticket||!usable()||active!==null)return null;
    const op:Operation={kind,original,context:fingerprint(),abort:new AbortController()};active=op;
    publish({...state,busy:kind,message:null,...(kind==='load'?{phase:'loading' as const}:{}),
      ...(kind==='confirm'||kind==='retry'?{writeState:'sending' as const}:{} )});
    return op;
  }
  async function ready(op:Operation):Promise<boolean> {
    if(!owns(op))return false;
    if(runtime.cookie.status==='offline')await runtime.restore();
    return owns(op,true);
  }
  function settle(op:Operation){
    if(active!==op)return;
    const valid=usable();if(active!==op)return;active=null;
    if(!valid){return;}
    publish({...state,busy:null,phase:state.phase==='loading'?'unavailable':state.phase,
      writeState:state.writeState==='sending'?(stored.receipt?'acknowledged':stored.original?'uncertain':'idle'):state.writeState});
  }
  function fail(op:Operation,error:unknown):boolean {
    if(!owns(op))return false;
    const status=error instanceof TransportError?error.status:503;
    if(status===401||status===403){retire(status===401?'ended':'denied');return false;}
    if(status===409&&(op.kind==='confirm'||op.kind==='retry')){stored=Object.freeze({...stored,conflict:true});if(!remember()||!owns(op))return false;}
    active=null;
    publish({...state,phase:'unavailable',current:null,busy:null,
      writeState:stored.receipt?'acknowledged':status===409?'conflict':stored.original?'uncertain':state.writeState,
      message:status===409?'service details changed. read and compare the current dates before making a new cancellation.':
        stored.receipt?'the original cancellation was acknowledged. current service details are unavailable.':
        stored.original?'the original cancellation result is uncertain. check its status.':'your service details are unavailable. try reading them again.'});
    return false;
  }
  function currentOutcome(current:ClientServiceView):AccountServiceState['writeState']{
    if(stored.receipt){const cancel=current.cancellation,receipt=stored.receipt.cancellation;
      return cancel?.id===receipt.id&&cancel.kind===receipt.kind&&cancel.supportEndsOn===receipt.supportEndsOn?'confirmed':'acknowledged';}
    if(stored.original)return stored.conflict?'conflict':'uncertain';
    if(current.coverage.status==='expired')return 'expired';
    if(state.draft&&!matchesCancellationDraft(current,state.draft))return 'conflict';
    return state.draft?'reviewing':'idle';
  }
  async function canonical(op:Operation):Promise<boolean>{
    const value=await port.execute({schemaVersion:1,action:'read_client_service_v1'},{signal:op.abort.signal,isApplicable:()=>owns(op,true)});
    if(!owns(op,true))return false;
    const current=readClientServiceView(value);if(!owns(op,true))return false;
    const outcome=currentOutcome(current),drop=outcome==='confirmed'&&state.draft===stored.review;
    active=null;
    publish({...state,phase:'ready',current,draft:drop?null:state.draft,original:stored.original,receipt:stored.receipt,originalStatus:stored.status,busy:null,writeState:outcome,
      message:outcome==='confirmed'?'cancellation confirmed. future renewal requests stop; your paid support is retained.':
        outcome==='conflict'?'compare your reviewed dates with the current service details.':null});
    return usable(true)&&active===null&&state.current===current;
  }
  async function load():Promise<boolean>{
    if(!start())return false;
    const op=begin('load');if(!op)return false;
    try{if(!await ready(op))return false;return await canonical(op);}
    catch(error){return fail(op,error);}finally{settle(op);}
  }
  function openCancellation(expectedCurrent:ClientServiceView):boolean{
    const clicked=state.current,existing=state.draft;
    if(expectedCurrent!==clicked||!start()||!usable(true)||state.current!==clicked||state.draft!==existing||active||!state.canReview||!clicked)return false;
    // Reopening is navigation, never an implicit rebase of an existing review.
    if(existing)return true;
    const e=clicked.periodEndCancellation;if(e.state!=='available')return false;
    const draft=Object.freeze({current:clicked,supportEndsOn:e.supportEndsOn,readOnlyEndsOn:e.readOnlyEndsOn,generation:++draftGeneration});
    publish({...state,draft,writeState:stored.conflict?'conflict':stored.original?'uncertain':'reviewing',message:null});
    return usable(true)&&state.draft===draft&&state.current===clicked;
  }
  function discardCancellation(expectedDraft:CancellationDraft):boolean{
    const clicked=state.draft;
    if(clicked!==expectedDraft||!started||!usable()||state.draft!==clicked||active?.kind==='confirm'||active?.kind==='retry')return false;
    // A definitive conflict can be abandoned deliberately. An uncertain original
    // is retained even when its local, unsent review is discarded.
    if(stored.conflict&&stored.original&&!stored.receipt){stored=emptyStored;if(!remember())return false;}
    publish({...state,draft:null,original:stored.original,receipt:stored.receipt,originalStatus:stored.status,
      writeState:stored.receipt?'acknowledged':stored.original?'uncertain':'idle',message:null});
    return usable()&&state.draft===null;
  }
  function receiptMatches(receipt:ClientServiceReceipt):boolean{return !!stored.review&&receipt.cancellation.supportEndsOn===stored.review.supportEndsOn;}
  async function send(op:Operation,command:ClientServiceCancelCommand):Promise<boolean>{
    if(!owns(op,true)||stored.original!==command)return false;
    const value=await port.execute(command,{signal:op.abort.signal,isApplicable:()=>owns(op,true)});
    if(!owns(op,true)||stored.original!==command)return false;
    const receipt=readClientServiceReceipt(value,command);
    if(!receiptMatches(receipt)||!owns(op,true))throw new TransportError(503,'write');
    stored=Object.freeze({...stored,receipt,conflict:false});if(!remember()||!owns(op,true))return false;
    state=Object.freeze({...state,receipt,writeState:'acknowledged'});
    return canonical(op);
  }
  async function confirmCancellation(expectedDraft:CancellationDraft):Promise<boolean>{
    // Capture the rendered review before any callback or await.
    const clicked=state.draft,current=state.current;
    if(clicked!==expectedDraft||!started||!usable(true)||active||state.draft!==clicked||state.current!==current||!state.canConfirm||!clicked||!current)return false;
    let parsed:ReturnType<typeof readClientServiceCommand>;
    try{parsed=readClientServiceCommand({schemaVersion:1,action:'cancel_client_service_period_end_v1',requestId:crypto.randomUUID(),
      expectedServiceRevision:current.serviceRevision,expectedBasisHash:current.basisHash,reason:null,confirmed:true});}
    catch{if(usable(true)&&state.draft===clicked&&state.current===current)publish({...state,message:'cancellation could not be prepared. try again.'});return false;}
    if(parsed.action!=='cancel_client_service_period_end_v1'||!usable(true)||active||state.draft!==clicked||state.current!==current||stored.original)return false;
    stored=Object.freeze({original:parsed,review:clicked,receipt:null,status:null,conflict:false});if(!remember())return false;
    state=Object.freeze({...state,original:parsed,receipt:null,originalStatus:null});
    const op=begin('confirm',parsed);if(!op)return false;
    try{if(!owns(op,true)||state.draft!==clicked)return false;return await send(op,parsed);}
    catch(error){return fail(op,error);}finally{settle(op);}
  }
  async function readOriginalStatus(expectedOriginal:ClientServiceCancelCommand):Promise<boolean>{
    const clicked=state.original;
    if(clicked!==expectedOriginal||!start()||state.original!==clicked||!clicked)return false;
    const op=begin('status',clicked);if(!op)return false;
    try{
      if(!await ready(op)||stored.original!==clicked)return false;
      const value=await port.execute({schemaVersion:1,action:'client_service_request_status_v1',requestId:clicked.requestId},{signal:op.abort.signal,isApplicable:()=>owns(op,true)});
      if(!owns(op,true)||stored.original!==clicked)return false;
      const status=readClientServiceStatus(value,clicked.requestId);
      if(status.state==='committed'&&(JSON.stringify(status.original)!==JSON.stringify(clicked)||!receiptMatches(status.receipt)))throw new TransportError(503);
      if(!owns(op,true))return false;
      stored=Object.freeze({...stored,status,receipt:status.state==='committed'?status.receipt:stored.receipt,conflict:status.state==='committed'?false:stored.conflict});if(!remember()||!owns(op,true))return false;
      state=Object.freeze({...state,originalStatus:status,receipt:stored.receipt,writeState:stored.receipt?'acknowledged':'uncertain'});
      return await canonical(op);
    }catch(error){return fail(op,error);}finally{settle(op);}
  }
  async function retryOriginal(expectedOriginal:ClientServiceCancelCommand):Promise<boolean>{
    const clicked=state.original;
    if(clicked!==expectedOriginal||!started||!usable(true)||active||state.original!==clicked||!clicked||!state.canRetry)return false;
    const op=begin('retry',clicked);if(!op)return false;
    try{return await send(op,clicked);}catch(error){return fail(op,error);}finally{settle(op);}
  }
  return {getSnapshot(){reconcile();return state;},subscribe(listener){if(disposed)return()=>{};listeners.add(listener);return()=>{listeners.delete(listener);};},
    load,readCurrent:load,openCancellation,discardCancellation,confirmCancellation,readOriginalStatus,retryOriginal,
    dispose(){if(disposed)return;retire('ended');disposed=true;listeners.clear();}};
}
