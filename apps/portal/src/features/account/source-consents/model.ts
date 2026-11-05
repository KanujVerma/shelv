import {readSourceAccountCommand,readSourceAccountPage} from '../../../../../../src/contracts/PortalSourceAccountValidation.ts';
import {mapSourceAccountResult} from '../../../../../../src/contracts/PortalSourceAccountMapping.ts';
import {readReviewShape} from '../../../../../../src/contracts/PortalReviewValidation.ts';
import type {SourceAccountWithdrawCommand} from '../../../../../../src/contracts/PortalSourceAccount.ts';
import type {SourceConsentGroup,SourceConsentRow,SourceConsentsInput,SourceConsentsModel,SourceConsentsSnapshot} from './types.ts';

/** Only detached codec results and locally created presentation objects enter here. */
function freeze<T>(value:T):T {
  if(value!==null&&typeof value==='object'){
    for(const item of Object.values(value))freeze(item);
    Object.freeze(value);
  }
  return value;
}
type Read=SourceConsentsSnapshot['read'];
function readInput(input:SourceConsentsInput):Read {
  if(input.read?.state==='unknown')return {state:'unknown'};
  if(input.read?.state!=='loaded')return {state:'unavailable'};
  try{
    const page=readSourceAccountPage(input.read.page);
    return page.state==='page'?{state:'loaded',page:freeze(page)}:{state:'unavailable'};
  }catch{return {state:'unavailable'};}
}
type Recovery={state:SourceConsentsSnapshot['recovery']['state'];original:SourceAccountWithdrawCommand|null};
function readRecovery(input:SourceConsentsInput,read:Read):Recovery {
  if(!input.recovery)return {state:'none',original:null};
  try{
    if(read.state!=='loaded')throw Error('unavailable');
    const command=readSourceAccountCommand(input.recovery.original);
    if(command.action!=='withdraw_source_consent_v1')throw Error('unavailable');
    readReviewShape(input.recovery.requestHash,{type:'hash'});
    if(input.recovery.observation.state==='unknown')return {state:'unknown',original:freeze(command)};
    const value=mapSourceAccountResult({schemaVersion:1,action:'request_status_v1',requestId:command.requestId},input.recovery.observation.status,
      {clientId:read.page.clientId,originalWithdrawal:command,requestHash:input.recovery.requestHash});
    // This source slice deliberately has no committed/success presentation.
    if(!('status' in value)||value.status==='committed')throw Error('unavailable');
    return {state:value.status==='absent'?'absent':value.code==='request_purged'?'purged':'unavailable',original:freeze(command)};
  }catch{return {state:'unavailable',original:null};}
}

/** Synchronous UI memory only. No Auth, request factory, journal, IO or autonomous calls.
 * Root DTO feasibility is not evidence of an actual own-client producer or permission.
 * The future controller must retain the original command before any actual dispatch. */
export function createSourceConsentsModel(initial:SourceConsentsInput={}):SourceConsentsModel {
  let input:SourceConsentsInput={},read:Read={state:'unavailable'},recovery:Recovery={state:'none',original:null};
  let disposed=false,dispatching=false,generation=0;
  const listeners=new Set<()=>void>();
  let state:SourceConsentsSnapshot;
  function rowReason(record:SourceConsentRow['record'],phase:SourceConsentsSnapshot['intentState']):string|null {
    if(record.effective==='superseded')return 'this recorded consent has been superseded.';
    if(record.effective==='withdrawn')return 'this consent is recorded as withdrawn.';
    if(input.presentation!=='review')return 'this is a read-only view.';
    if(recovery.state!=='none')return 'resolve the original withdrawal result before reviewing another withdrawal.';
    if(phase!=='idle')return 'this withdrawal has not been confirmed. review its result before continuing.';
    if(typeof input.onWithdrawalIntent!=='function')return 'withdrawal is unavailable here.';
    return null;
  }
  function snapshot(confirmation:SourceConsentsSnapshot['confirmation']=null,intentState:SourceConsentsSnapshot['intentState']='idle'):SourceConsentsSnapshot {
    const rows:SourceConsentRow[]=read.state==='loaded'?read.page.entries.map(record=>({record,unavailableReason:rowReason(record,intentState)})):[];
    const grouped=new Map<string,SourceConsentRow[]>();
    for(const row of rows){const id=row.record.consent.groupId,group=grouped.get(id)??[];group.push(row);grouped.set(id,group);}
    const groups:SourceConsentGroup[]=[...grouped].map(([alias,group])=>({alias,rows:group}));
    const busy=intentState!=='idle';
    return freeze({read,rows,groups,confirmation,intentState,recovery:{state:recovery.state,
      checkUnavailableReason:!recovery.original||recovery.state==='none'||recovery.state==='purged'?'the original result cannot be checked here.':busy?'a result check or withdrawal review is already awaiting an update.':typeof input.onCheckStatusIntent!=='function'?'result checking is unavailable here.':null,
      retryUnavailableReason:recovery.state!=='absent'?'the original result must be confirmed absent before a retry.':input.presentation!=='review'?'this is a read-only view.':busy?'a retry is already awaiting an update.':!recovery.original||typeof input.onRetryOriginalIntent!=='function'?'retrying the original withdrawal is unavailable here.':null},
      refreshUnavailableReason:typeof input.onRefreshIntent!=='function'?'refreshing recorded consents is unavailable here.':null});
  }
  function notify(next:SourceConsentsSnapshot):void {
    state=next;
    for(const listener of [...listeners]){try{listener();}catch{/* A subscriber cannot restore or authorize an intent. */}}
  }
  function owns(expected:SourceConsentsSnapshot,version:number):boolean {return !disposed&&state===expected&&generation===version;}
  function invoke(callback:()=>void,expected:SourceConsentsSnapshot,version:number):void {
    if(dispatching||!owns(expected,version))return;
    dispatching=true;
    try{callback();}catch{if(owns(expected,version))notify(snapshot(null,'unavailable'));}
    finally{dispatching=false;}
  }
  const model:SourceConsentsModel={
    getSnapshot:()=>state,
    subscribe(listener){if(disposed)return ()=>{};listeners.add(listener);return ()=>{listeners.delete(listener);};},
    replace(next){
      if(disposed)return;
      generation++;
      // Copy callback slots; later mutation of caller input cannot change this model owner.
      input={...next};read=readInput(next);recovery=readRecovery(next,read);notify(snapshot());
    },
    reviewWithdrawal(row){
      if(disposed||dispatching||state.confirmation!==null||read.state!=='loaded'||!state.rows.includes(row)||row.unavailableReason!==null)return;
      notify(snapshot(freeze({consent:row.record.consent,snapshot:read.page.snapshot,disclosureText:row.record.disclosureText})));
    },
    cancelReview(review){if(!disposed&&review!==null&&state.confirmation===review)notify(snapshot());},
    confirmWithdrawal(review){
      const callback=input.onWithdrawalIntent;
      if(disposed||dispatching||review===null||state.confirmation!==review||typeof callback!=='function'||read.state!=='loaded')return;
      const row=state.rows.find(r=>r.record.consent===review.consent);
      if(!row||row.unavailableReason!==null||review.snapshot!==read.page.snapshot)return;
      const intent=freeze({kind:'withdrawal' as const,consent:review.consent,snapshot:review.snapshot,disclosureText:review.disclosureText}),version=generation;
      const issued=snapshot(null,'emitted');notify(issued);
      // Notification can synchronously replace/dispose this owner before the callback.
      invoke(()=>callback(intent),issued,version);
    },
    checkOriginalResult(){
      const callback=input.onCheckStatusIntent,original=recovery.original;
      if(disposed||dispatching||state.recovery.checkUnavailableReason!==null||!original||typeof callback!=='function')return;
      const command=freeze({schemaVersion:1 as const,action:'request_status_v1' as const,requestId:original.requestId}),version=generation;
      const issued=snapshot(null,'emitted');notify(issued);invoke(()=>callback(command),issued,version);
    },
    retryOriginal(){
      const callback=input.onRetryOriginalIntent,original=recovery.original;
      if(disposed||dispatching||state.recovery.retryUnavailableReason!==null||!original||typeof callback!=='function')return;
      const version=generation,issued=snapshot(null,'emitted');notify(issued);invoke(()=>callback(original),issued,version);
    },
    refresh(){const callback=input.onRefreshIntent;if(!disposed&&typeof callback==='function')invoke(callback,state,generation);},
    dispose(){
      if(disposed)return;
      disposed=true;generation++;input={};read={state:'unavailable'};recovery={state:'none',original:null};notify(snapshot());listeners.clear();
    },
  };
  model.replace(initial);
  return Object.freeze(model);
}
