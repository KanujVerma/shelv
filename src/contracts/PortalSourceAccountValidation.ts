import type {PlanShape} from './PortalRebuildValidation.ts';
import type {
  SourceAccountCommand, SourceAccountRpcCall, SourceAccountPage, SourceAccountUnavailable,
  SourceAccountReceipt, SourceAccountRequestStatus, SourceAccountConsent,
} from './PortalSourceAccount.ts';
import {readObject,requireValue} from './ConciergePortalValidation.ts';
import {careObject as obj,careArray as arr,careEnum as en,careNull as nil,careUnion as union,
  careUuid as uuid,careRevision as rev,carePositive as pos,careInstant as instant,careKnown as known,sameCareValue} from './PortalCareValidation.ts';
import {readReviewShape,reviewJsonBytes} from './PortalReviewValidation.ts';
import {sourceAccountActions,sourceAccountCommandMaxBytes,sourceAccountPageMaxBytes,
  sourceAccountResponseMaxBytes,sourceAccountDisclosureMaxScalars,sourceAccountPageMax,
  sourceAccountErrorStatuses} from './PortalSourceAccountValues.ts';
import type {SourceAccountErrorCode} from './PortalSourceAccountValues.ts';

const hash:PlanShape={type:'hash'};
const ref=obj({id:uuid,groupId:uuid,purpose:en('service_storage','service_review'),disclosure:obj({version:pos,hash})});
const snapshot=obj({revision:rev,hash});
const base={schemaVersion:en(1),visibility:en('client_account'),clientId:uuid};
const withdrawal=obj({id:uuid,origin:en('client_portal'),consent:ref,recordedBy:uuid,recordedAt:instant});
const consent=obj({consent:ref,supersedesConsentId:nil(uuid),disclosureText:{type:'text',max:sourceAccountDisclosureMaxScalars,empty:false},
  confirmation:obj({kind:en('manual'),decision:en('allow','withdraw'),channel:en('text','call','video','in_person'),
    occurredAt:known(instant),recordedBy:uuid,recordedAt:instant}),
  effective:en('not_withdrawn','withdrawn','superseded'),withdrawal:nil(withdrawal)});
const unavailable=obj({...base,state:en('unavailable'),code:en('client_lineage_unavailable','consent_unavailable','disclosure_unavailable','attribution_unavailable','lifecycle_unavailable')});
const page=obj({...base,state:en('page'),snapshot,cursor:nil(pos),total:rev,entries:arr(consent,sourceAccountPageMax),nextCursor:nil(pos)});
const receipt=obj({...base,action:en('withdraw_source_consent_v1'),requestId:uuid,commandHash:hash,revision:pos,outcome:en('withdrawn'),withdrawal});
const statusBase={...base,requestId:uuid};
const status=union(obj({...statusBase,status:en('absent')}),obj({...statusBase,status:en('committed'),receipt}),
  obj({...statusBase,status:en('unavailable'),code:en('request_unavailable','request_purged')}));
const commandFields:Record<SourceAccountCommand['action'],Record<string,PlanShape>>={
  list_source_consents_v1:{snapshot:nil(snapshot),cursor:nil(pos),limit:{...pos,max:sourceAccountPageMax}},
  withdraw_source_consent_v1:{requestId:uuid,expectedRevision:{...rev,max:Number.MAX_SAFE_INTEGER-1},consent:ref},
  request_status_v1:{requestId:uuid},
};

function read<T>(value:unknown,shape:PlanShape,maxBytes:number):T{
  try{
    requireValue(reviewJsonBytes(value)<=maxBytes);checkArrayPrototypes(value);
    return readReviewShape(value,shape) as T;
  }catch{throw Error('invalid_input');}
}
/** JSON arrays have no subclass/prototype behavior, accessors, holes or extra keys. */
function arrayData(value:unknown):asserts value is unknown[]{
  requireValue(Array.isArray(value)&&Object.getPrototypeOf(value)===Array.prototype&&Object.getOwnPropertySymbols(value).length===0);
  requireValue(Object.getOwnPropertyNames(value).length===value.length+1);
  for(let i=0;i<value.length;i++){
    const descriptor=Object.getOwnPropertyDescriptor(value,String(i));
    requireValue(descriptor!==undefined&&descriptor.enumerable&&Object.hasOwn(descriptor,'value'));
  }
}
/** Root JSON inspection already bounds depth/nodes and rejects cycles/getters before this walk. */
function checkArrayPrototypes(value:unknown):void{
  if(value===null||typeof value!=='object')return;
  if(Array.isArray(value)){arrayData(value);for(const item of value)checkArrayPrototypes(item);}
  else for(const item of Object.values(value))checkArrayPrototypes(item);
}
export function readSourceAccountCommand(value:unknown):SourceAccountCommand{
  try{
    requireValue(reviewJsonBytes(value)<=sourceAccountCommandMaxBytes);
    const input=readObject(value);
    requireValue(typeof input.action==='string'&&(sourceAccountActions as readonly string[]).includes(input.action));
    const action=input.action as SourceAccountCommand['action'];
    const c=read<SourceAccountCommand>(value,obj({schemaVersion:en(1),action:en(action),...commandFields[action]}),sourceAccountCommandMaxBytes);
    if(c.action==='list_source_consents_v1')requireValue(c.cursor===null||c.snapshot!==null);
    return c;
  }catch{throw Error('invalid_input');}
}
export function buildSourceAccountRpc(value:unknown):SourceAccountRpcCall{
  return {name:'concierge_source_account_command_v1',args:{p_command:readSourceAccountCommand(value)}};
}
export function readSourceAccountPage(value:unknown):SourceAccountPage|SourceAccountUnavailable{
  const p=read<SourceAccountPage|SourceAccountUnavailable>(value,union(page,unavailable),sourceAccountPageMaxBytes);
  if(p.state==='page'){
    const offset=p.cursor??0,end=offset+p.entries.length;
    requireValue(Number.isSafeInteger(end)&&end<=p.total);
    requireValue(p.entries.length>0||p.total===0&&p.cursor===null);
    requireValue(p.nextCursor===(end<p.total?end:null));
    p.entries=readSourceAccountRecords(p.entries,p.clientId,p.cursor===null&&p.nextCursor===null?'complete':'partial');
  }
  return p;
}
export function readSourceAccountReceipt(value:unknown):SourceAccountReceipt{
  const r=read<SourceAccountReceipt>(value,receipt,sourceAccountResponseMaxBytes);
  requireValue(r.withdrawal.recordedBy===r.clientId&&r.withdrawal.id!==r.withdrawal.consent.id);
  return r;
}
export function readSourceAccountStatus(value:unknown):SourceAccountRequestStatus{
  const r=read<SourceAccountRequestStatus>(value,status,sourceAccountResponseMaxBytes);
  if(r.status==='committed'){
    r.receipt=readSourceAccountReceipt(r.receipt);
    requireValue(r.receipt.clientId===r.clientId&&r.receipt.requestId===r.requestId);
  }
  return r;
}
export function readSourceAccountError(value:unknown):SourceAccountErrorCode{
  return read<{code:SourceAccountErrorCode}>(value,obj({code:en(...Object.keys(sourceAccountErrorStatuses))}),1024).code;
}

/** Compare already semantically parsed instants without losing microsecond ordering. */
function micros(stamp:string):bigint{
  const fraction=/\.(\d{1,6})/.exec(stamp)?.[1]??'';
  return BigInt(Date.parse(stamp))*1000n+BigInt(fraction.padEnd(6,'0').slice(3));
}
/** Causal links are explicit model facts. UUID order is pagination, never causal evidence. */
function checkConsentHistory(records:readonly SourceAccountConsent[],completeness:'partial'|'complete'):void{
  const byId=new Map(records.map(r=>[r.consent.id,r]));
  const successors=new Map<string,string>();
  const groups=new Map<string,{roots:number;current:number}>();
  const groupKey=(r:SourceAccountConsent)=>`${r.consent.groupId}:${r.consent.purpose}`;
  for(const r of records){
    const key=groupKey(r),group=groups.get(key)??{roots:0,current:0};groups.set(key,group);
    if(r.supersedesConsentId===null)group.roots++;
    else{
      requireValue(r.supersedesConsentId!==r.consent.id&&!successors.has(r.supersedesConsentId));
      successors.set(r.supersedesConsentId,r.consent.id);
      const previous=byId.get(r.supersedesConsentId);
      if(previous)requireValue(groupKey(previous)===key&&previous.effective==='superseded');
      else requireValue(completeness==='partial');
    }
    if(r.effective!=='superseded')group.current++;
  }
  for(const group of groups.values()){
    requireValue(group.roots<=1&&group.current<=1);
    if(completeness==='complete')requireValue(group.roots===1&&group.current===1);
  }
  for(const r of records){
    if(successors.has(r.consent.id))requireValue(r.effective==='superseded');
    else if(completeness==='complete')requireValue(r.effective!=='superseded');
  }
  // Iterative O(n) traversal also rejects a closed cycle beside an otherwise valid chain.
  const finished=new Set<string>();
  for(const r of records){
    const trail=new Set<string>();let at:SourceAccountConsent|undefined=r;
    while(at&&!finished.has(at.consent.id)){
      requireValue(!trail.has(at.consent.id));trail.add(at.consent.id);
      at=at.supersedesConsentId===null?undefined:byId.get(at.supersedesConsentId);
    }
    for(const id of trail)finished.add(id);
  }
}
/** Finite record relationships only. Standalone records default to partial, never complete history.
 * The direct complete-page reader and full collector both request the same complete validation.
 * Completeness is local parsing context, not a wire flag, consent evidence or authorization. */
export function readSourceAccountRecords(value:unknown,clientId:unknown,completeness:'partial'|'complete'='partial'):SourceAccountConsent[]{
  try{
  requireValue(completeness==='partial'||completeness==='complete');
  const client=readReviewShape(clientId,uuid);arrayData(value);
  const records=value.map(item=>read<SourceAccountConsent>(item,consent,sourceAccountPageMaxBytes));
  const ids=new Set<string>(),events=new Set<string>(),disclosures=new Map<string,{hash:string;text:string}>();
  let previous='';
  for(const r of records){
    const id=r.consent.id;requireValue(!ids.has(id)&&id>previous);ids.add(id);previous=id;
    for(const scalar of r.disclosureText)requireValue(scalar.length!==1||scalar.charCodeAt(0)<0xd800||scalar.charCodeAt(0)>0xdfff);
    const disclosureKey=`${r.consent.purpose}:${r.consent.disclosure.version}`,prior=disclosures.get(disclosureKey);
    requireValue(prior===undefined||prior.hash===r.consent.disclosure.hash&&prior.text===r.disclosureText);
    disclosures.set(disclosureKey,{hash:r.consent.disclosure.hash,text:r.disclosureText});
    if(r.confirmation.occurredAt.state==='known')requireValue(micros(r.confirmation.occurredAt.value)<=micros(r.confirmation.recordedAt));
    if(r.withdrawal!==null){
      requireValue(r.withdrawal.origin==='client_portal'&&r.withdrawal.recordedBy===client&&r.withdrawal.id!==id&&
        sameCareValue(r.withdrawal.consent,r.consent)&&r.confirmation.decision==='allow'&&
        micros(r.withdrawal.recordedAt)>=micros(r.confirmation.recordedAt));
      requireValue(!events.has(r.withdrawal.id));events.add(r.withdrawal.id);
    }
    if(r.confirmation.decision==='withdraw')requireValue(r.withdrawal===null&&r.effective!=='not_withdrawn');
    if(r.effective==='not_withdrawn')requireValue(r.confirmation.decision==='allow'&&r.withdrawal===null);
    if(r.effective==='withdrawn')requireValue(r.confirmation.decision==='withdraw'||r.withdrawal!==null);
  }
  checkConsentHistory(records,completeness);
  return records;
  }catch{throw Error('invalid_input');}
}
