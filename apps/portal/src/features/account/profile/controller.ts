import type {ApplicationSession} from '../../../app/session.ts';
import {createClientAccountProfileRequest} from '../../../app/account-profile-request.ts';
import {TransportError} from '../../../transport/session.ts';
import {readAccountProfileCommand, readAccountProfileReceipt, readAccountProfileView} from '../../../../../../src/contracts/PortalAccountProfileValidation.ts';
import type {AccountProfileReceipt} from '../../../../../../src/contracts/PortalAccountProfile.ts';
import type {AccountProfileController, AccountProfileState, ProfileCommand, ProfileDraft} from './types.ts';
import {emptyProfileState, nameError, validDisplayName} from './model.ts';

type Pending = {readonly command:Readonly<ProfileCommand>; readonly draft:ProfileDraft};
type Memory = {readonly owner:object; readonly pending:Pending|null; readonly denied:boolean};
type Operation = {readonly controller:AbortController; readonly context:string; readonly kind:'read'|'write'; readonly intent:Pending|null; dispatched:boolean};
const key='account.profile.original.v1';
/** Actual session only; local applicability can deny but never grant authority.
 * No request/restore occurs at construction, subscription or snapshot time. */
export function createAccountProfileController(runtime:ApplicationSession, options?:{isApplicable?:()=>boolean}):AccountProfileController {
  const boundary=runtime.getSnapshot().boundary, port=createClientAccountProfileRequest(runtime), owner=Object.freeze({}), listeners=new Set<()=>void>();
  let state=emptyProfileState, disposed=false, checking=false, active:Operation|null=null, generation=0, sequence=0;
  const previous=boundary?.memory.get<Memory>(key);
  let pending:Pending|null=previous?.pending??null, denied=previous?.denied??false;
  if (boundary?.isCurrent()) boundary.memory.set(key,Object.freeze({owner,pending,denied}));
  if(denied)state=Object.freeze({...emptyProfileState,phase:'denied'});
  const fingerprint=()=>JSON.stringify([runtime.cookie.identity,runtime.cookie.generation,runtime.cookie._epoch,runtime.cookie._view]);
  let observed=fingerprint();
  const same=()=>!disposed && !!boundary && runtime.getSnapshot().boundary===boundary && boundary.isCurrent() && runtime.cookie.audience==='client' && runtime.cookie.identity?.role==='client' && boundary.memory.get<Memory>(key)?.owner===owner;
  function relevant() {
    if (!same()) return false;
    let allowed=false;
    try { allowed=options?.isApplicable===undefined || options.isApplicable()===true; } catch { /* Deny-only. */ }
    return allowed && same();
  }
  const view=()=>runtime.cookie._view?.capabilities.view===true;
  function remember() { if (same()) boundary!.memory.set(key,Object.freeze({owner,pending,denied})); }
  function notify() {
    const published=state;
    for (const listener of [...listeners]) {
      if (state!==published) break;
      if (listeners.has(listener)) try { listener(); } catch { /* Observer failure cannot affect transport or later retirement. */ }
    }
  }
  function decorate(next:AccountProfileState):AccountProfileState {
    // Relevance is checked by reconciliation/operation guards, never during
    // snapshot derivation where a caller callback could replace the draft.
    const ready=!denied && same() && view() && runtime.cookie.status==='ready';
    return Object.freeze({...next,busy:active!==null,
      canEdit:ready && next.current!==null,
      canSave:ready && !active && !pending && !!next.current && !!next.draft && next.current.profileRevision===next.draft.base.profileRevision && next.current.displayName===next.draft.base.displayName && validDisplayName(next.draft.displayName) && next.writeState!=='conflict',
      canRetry:ready && !active && !!pending});
  }
  function publish(next:AccountProfileState) {
    if(disposed)return;
    const before=state,ticket=sequence;
    const decorated=decorate(next);
    // A newer edit or retirement owns state before any older publication
    // may notify readers. Derivation itself invokes no caller callback.
    if(disposed || state!==before || sequence!==ticket)return;
    state=decorated;notify();
  }
  // Retire private data/ownership BEFORE abort callbacks or observers run.
  function clear(phase:'ended'|'denied'|'inactive') {
    if(disposed)return;
    sequence++;
    const old=active;active=null;
    state=Object.freeze({...emptyProfileState,phase,message:phase==='ended'?'your session has ended. sign in again.':phase==='denied'?'you do not have access to these details.':null});
    if(phase==='denied'){denied=true;remember();}
    old?.controller.abort();notify();
  }
  function detach() {
    const old=active;active=null;
    state=Object.freeze({...state,busy:false,canSave:false,canRetry:false,writeState:pending?'uncertain':state.writeState});
    old?.controller.abort();
  }
  function reconcile() {
    if (disposed || checking) return;
    checking=true;
    try {
      if (!same()) { if(state.phase!=='ended') clear('ended'); return; }
      if (!relevant()) { if(state.phase!=='inactive') clear('inactive'); return; }
      if (!view()) { if(state.phase!=='denied') clear('denied'); return; }
      const next=fingerprint();
      if (next!==observed) {
        observed=next;
        const old=active;active=null;
        state=Object.freeze({...state,phase:'unread',current:null,acknowledgement:null,busy:false,canEdit:false,canSave:false,canRetry:false,writeState:pending?'uncertain':'idle'});
        old?.controller.abort();notify();
      }
      // Offline retains exact dispatched intent, but never presents a private
      // canonical projection as currently verified or a successful completion.
      if (runtime.cookie.status!=='ready' && (state.current || active)) {
        const old=active;active=null;
        state=Object.freeze({...state,current:null,phase:'error',busy:false,canEdit:false,canSave:false,canRetry:false,writeState:pending?'uncertain':state.writeState});
        old?.controller.abort();notify();
      }
      if(disposed)return;
      const before=state,ticket=sequence;
      const nextState=decorate({...before,pending:denied?null:pending?.command??null});
      if(disposed || state!==before || sequence!==ticket)return;
      if (nextState.canEdit!==state.canEdit || nextState.canSave!==state.canSave || nextState.canRetry!==state.canRetry || nextState.pending!==state.pending) { state=nextState;notify(); }
    } finally { checking=false; }
  }
  const owned=(op:Operation)=>{
    if(active!==op || op.controller.signal.aborted || !same())return false;
    const applies=relevant();
    // The deny-only callback may synchronously retire this exact operation.
    return applies && active===op && !op.controller.signal.aborted && same() && view() && fingerprint()===op.context;
  };
  const applicable=(op:Operation)=>owned(op) && runtime.cookie.status==='ready';
  function begin(kind:Operation['kind'],intent:Pending|null=null) {
    detach();
    if (!same() || !relevant() || !view() || runtime.cookie.status!=='ready') return null;
    const op:Operation={kind,intent,context:fingerprint(),controller:new AbortController(),dispatched:false};active=op;return op;
  }
  async function prepare() {
    reconcile();
    if (!same() || !relevant() || !view()) return false;
    const original=fingerprint();
    if (runtime.cookie.status==='offline') {
      try { await runtime.restore(); } catch { reconcile();return false; }
      reconcile();
      if (!same() || !relevant() || !view() || fingerprint()!==original) return false;
    }
    return same() && relevant() && view() && runtime.cookie.status==='ready';
  }
  function failure(op:Operation,error:unknown) {
    reconcile();
    if (!owned(op)) return false;
    const status=error instanceof TransportError?error.status:503;
    active=null;
    if(status===401 || status===403) { clear(status===401?'ended':'denied');return false; }
    if(op.kind==='write' && pending===op.intent && status!==503) { pending=null;remember(); }
    publish({...state,phase:op.kind==='read'?'error':state.phase,current:null,
      pending:pending?.command??null,writeState:pending?'uncertain':status===409?'conflict':state.acknowledgement?'acknowledged':'idle',
      message:pending?'the save result is uncertain. retry the original change to check it.':status===409?'your details changed. read the current details and compare before editing again.':'your details are unavailable. try reading them again.'});
    return false;
  }
  function finish(op:Operation) {
    if(active!==op)return;
    if(!same()){clear('ended');return;}
    if(!view()){clear('denied');return;}
    // Retire this settled operation before callbacks. A newer operation owns
    // its own finalization; this does not reread caller relevance or settle intent.
    active=null;
    publish({...state,phase:state.phase==='loading'?'error':state.phase,
      writeState:pending?'uncertain':state.writeState==='saving'?(state.acknowledgement?'acknowledged':'idle'):state.writeState});
    try{op.controller.abort();}catch{/* Logical custody is already retired. */}
  }
  async function readCurrent() {
    const ticket=++sequence;
    if (!await prepare() || ticket!==sequence) return false;
    // prepare can run observers/restore. Recheck before taking operation custody.
    if (!same() || !relevant() || !view()) return false;
    const op=begin('read');if(!op)return false;
    publish({...state,phase:'loading',current:null,message:null});
    try {
      if(!applicable(op))return false;
      const value=await port.execute({schemaVersion:1,action:'read_account_profile_v1'},{signal:op.controller.signal,isApplicable:()=>applicable(op)});
      reconcile();if(!applicable(op))return false;
      const current=readAccountProfileView(value);if(!applicable(op))return false;
      denied=false;remember();
      const conflict=!!state.draft && (state.draft.base.profileRevision!==current.profileRevision || state.draft.base.displayName!==current.displayName);
      active=null;
      publish({...state,phase:'ready',current,pending:pending?.command??null,writeState:pending?'uncertain':conflict?'conflict':state.writeState,
        message:pending?'current details do not establish the result of the original save.':conflict?'your details changed. compare your unsaved name with the current name.':null});
      return same() && view() && runtime.cookie.status==='ready' && state.current===current;
    } catch(error) { return failure(op,error); }
    finally { finish(op); }
  }
  function editDisplayName() {
    reconcile();if(!same() || !relevant() || !view() || runtime.cookie.status!=='ready' || !state.current)return false;
    if(state.draft)return true;
    const draft=Object.freeze({base:state.current,displayName:state.current.displayName,generation:++generation});
    publish({...state,draft,writeState:pending?'uncertain':'idle',fieldError:null,message:null});
    return state.draft===draft && same() && relevant();
  }
  function setDisplayName(value:string) {
    reconcile();if(!same() || !relevant() || !view() || !state.draft || typeof value!=='string')return;
    const draft=Object.freeze({...state.draft,displayName:value,generation:++generation});
    publish({...state,draft,fieldError:validDisplayName(value)?null:nameError,message:null,writeState:pending?'uncertain':state.writeState==='conflict'?'conflict':'idle'});
  }
  function discardEdit() {
    reconcile();if(!same() || !relevant() || !view())return;
    generation++;
    publish({...state,draft:null,fieldError:null,writeState:pending?'uncertain':state.writeState==='saved'?'saved':'idle',message:pending?'only the unsent edit was discarded. the original save result is still uncertain.':null});
  }
  async function save() {
    // Bind the deliberate click before reconciliation or any caller callback.
    const clickedDraft=state.draft,clickedPending=pending;
    reconcile();if(denied || active || !same() || !relevant() || !view())return false;
    if(pending!==clickedPending || (!clickedPending && state.draft!==clickedDraft))return false;
    const ticket=++sequence;
    let intent=clickedPending;
    if(!intent) {
      if(!state.canSave || !clickedDraft || !state.current)return false;
      let command:ProfileCommand;
      try {
        const value=readAccountProfileCommand({schemaVersion:1,action:'set_account_display_name_v1',requestId:crypto.randomUUID(),expectedRevision:clickedDraft.base.profileRevision,displayName:clickedDraft.displayName});
        if(value.action!=='set_account_display_name_v1')return false;command=value;
      } catch { if(state.draft===clickedDraft && pending===clickedPending)publish({...state,fieldError:nameError});return false; }
      if(state.draft!==clickedDraft || pending!==clickedPending || sequence!==ticket)return false;
      intent=Object.freeze({command,draft:clickedDraft});pending=intent;remember();
    }
    // Capture the clicked draft/command synchronously. An offline recovery may
    // await restore, but cannot select a newer draft or a different original.
    if(runtime.cookie.status!=='ready') {
      if(!await prepare() || ticket!==sequence || pending!==intent)return false;
    }
    if(denied || active || ticket!==sequence || pending!==intent || !same() || !relevant() || !view())return false;
    const op=begin('write',intent);if(!op)return false;
    publish({...state,current:null,pending:intent.command,writeState:'saving',message:null});
    try {
      if(!applicable(op))return false;
      // on dispatch rechecks actual retained applicability. The immutable original
      // is kept before any await; no fresh UUID on lost/malformed acknowledgement.
      op.dispatched=true;
      const value=await port.execute(intent.command,{signal:op.controller.signal,isApplicable:()=>applicable(op)});
      reconcile();if(!applicable(op) || pending!==intent)return false;
      const acknowledgement:AccountProfileReceipt=readAccountProfileReceipt(value,intent.command);
      if(!applicable(op) || pending!==intent)return false;
      pending=null;remember();
      state=Object.freeze({...state,pending:null,acknowledgement,writeState:'acknowledged'});
      // This ACK is historical only. Read while retaining this exact operation,
      // before publishing any state that could reentrantly start a newer edit.
      const canonical=await port.execute({schemaVersion:1,action:'read_account_profile_v1'},{signal:op.controller.signal,isApplicable:()=>applicable(op)});
      reconcile();if(!applicable(op))return false;
      const current=readAccountProfileView(canonical);if(!applicable(op))return false;
      const exactDraft=state.draft===intent.draft;
      const complete=exactDraft && current.displayName===intent.command.displayName && current.profileRevision===acknowledgement.revision;
      active=null;
      publish({...state,phase:'ready',current,pending:null,acknowledgement,draft:complete?null:state.draft,
        writeState:complete?'saved':'acknowledged',fieldError:null,
        message:complete?'your details are saved.':'the original change was acknowledged. current details and any newer unsaved edit are shown separately.'});
      return same() && view() && runtime.cookie.status==='ready' && state.current===current;
    } catch(error) {
      // A valid ACK remains historical even if the canonical reread fails. Keep
      // no stale profile, and never replay that already acknowledged command.
      return failure(op,error);
    } finally { finish(op); }
  }
  const stop=runtime.subscribe(reconcile), stopBoundary=boundary?.subscribeInvalidation(reconcile);
  return {getSnapshot() {
    reconcile();
    if(!disposed && (!same() || !relevant() || !view()))reconcile();
    return state;
  },subscribe(fn){if(disposed)return()=>{};listeners.add(fn);return()=>listeners.delete(fn);},load:readCurrent,readCurrent,editDisplayName,setDisplayName,save,discardEdit,
    dispose() {
      if(disposed)return;
      sequence++;
      const old=active;active=null;disposed=true;
      state=Object.freeze({...emptyProfileState,phase:'ended'});
      // Boundary-owned original intent remains for a later actual controller.
      old?.controller.abort();try{stop();}finally{try{stopBoundary?.();}finally{listeners.clear();}}
    }};
}
