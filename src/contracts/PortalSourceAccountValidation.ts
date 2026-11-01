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
const ref=obj({id:uuid,purpose:en('service_storage','service_review'),disclosure:obj({version:pos,hash})});
const snapshot=obj({revision:rev,hash});
const base={schemaVersion:en(1),visibility:en('client_account'),clientId:uuid};
const withdrawal=obj({id:uuid,origin:en('client_portal'),consent:ref,recordedBy:uuid,recordedAt:instant});
const consent=obj({consent:ref,disclosureText:{type:'text',max:sourceAccountDisclosureMaxScalars,empty:false},
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
  requireValue(reviewJsonBytes(value)<=maxBytes);
  return readReviewShape(value,shape) as T;
}
export function readSourceAccountCommand(value:unknown):SourceAccountCommand{
  requireValue(reviewJsonBytes(value)<=sourceAccountCommandMaxBytes);
  const input=readObject(value);
  requireValue(typeof input.action==='string'&&(sourceAccountActions as readonly string[]).includes(input.action));
  const action=input.action as SourceAccountCommand['action'];
  const c=read<SourceAccountCommand>(value,obj({schemaVersion:en(1),action:en(action),...commandFields[action]}),sourceAccountCommandMaxBytes);
  if(c.action==='list_source_consents_v1')requireValue(c.cursor===null||c.snapshot!==null);
  return c;
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
    p.entries=readSourceAccountRecords(p.entries,p.clientId);
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
/** Finite record relationships only. This is neither consent evidence nor current authorization. */
export function readSourceAccountRecords(value:unknown,clientId:unknown):SourceAccountConsent[]{
  const client=readReviewShape(clientId,uuid);requireValue(Array.isArray(value));
  const records=value.map(item=>read<SourceAccountConsent>(item,consent,sourceAccountPageMaxBytes));
  const ids=new Set<string>(),currentPurposes=new Set<string>(),disclosures=new Map<string,{hash:string;text:string}>();
  let previous='';
  for(const r of records){
    const id=r.consent.id;requireValue(!ids.has(id)&&id>previous);ids.add(id);previous=id;
    for(const scalar of r.disclosureText)requireValue(scalar.length!==1||scalar.charCodeAt(0)<0xd800||scalar.charCodeAt(0)>0xdfff);
    const disclosureKey=`${r.consent.purpose}:${r.consent.disclosure.version}`,prior=disclosures.get(disclosureKey);
    requireValue(prior===undefined||prior.hash===r.consent.disclosure.hash&&prior.text===r.disclosureText);
    disclosures.set(disclosureKey,{hash:r.consent.disclosure.hash,text:r.disclosureText});
    if(r.effective!=='superseded'){
      requireValue(!currentPurposes.has(r.consent.purpose));currentPurposes.add(r.consent.purpose);
    }
    if(r.confirmation.occurredAt.state==='known')requireValue(micros(r.confirmation.occurredAt.value)<=micros(r.confirmation.recordedAt));
    if(r.withdrawal!==null){
      requireValue(r.withdrawal.origin==='client_portal'&&r.withdrawal.recordedBy===client&&r.withdrawal.id!==id&&
        sameCareValue(r.withdrawal.consent,r.consent)&&r.confirmation.decision==='allow'&&
        micros(r.withdrawal.recordedAt)>=micros(r.confirmation.recordedAt));
    }
    if(r.confirmation.decision==='withdraw')requireValue(r.withdrawal===null&&r.effective!=='not_withdrawn');
    if(r.effective==='not_withdrawn')requireValue(r.confirmation.decision==='allow'&&r.withdrawal===null);
    if(r.effective==='withdrawn')requireValue(r.confirmation.decision==='withdraw'||r.withdrawal!==null);
  }
  return records;
}
