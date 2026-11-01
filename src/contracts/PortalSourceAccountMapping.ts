import type {
  SourceAccountCommand, SourceAccountResult, SourceAccountMappingContext, SourceAccountPageRead,
  SourceAccountCollection, SourceAccountOutcome, SourceAccountReceipt, SourceAccountWithdrawCommand,
} from './PortalSourceAccount.ts';
import {requireValue} from './ConciergePortalValidation.ts';
import {careUuid,sameCareValue} from './PortalCareValidation.ts';
import {readReviewShape} from './PortalReviewValidation.ts';
import {readSourceAccountCommand,readSourceAccountPage,readSourceAccountReceipt,readSourceAccountStatus,readSourceAccountError,readSourceAccountRecords} from './PortalSourceAccountValidation.ts';
import {isSourceAccountRead,sourceAccountErrorStatuses} from './PortalSourceAccountValues.ts';

function expectedClient(context:SourceAccountMappingContext):string{
  return readReviewShape(context.clientId,careUuid) as string;
}
function originalWithdrawal(c:SourceAccountCommand,context:SourceAccountMappingContext):SourceAccountWithdrawCommand{
  const original=readSourceAccountCommand(c.action==='withdraw_source_consent_v1'?c:context.originalWithdrawal);
  requireValue(original.action==='withdraw_source_consent_v1');
  if(context.originalWithdrawal!==undefined)requireValue(sameCareValue(original,readSourceAccountCommand(context.originalWithdrawal)));
  requireValue('requestId' in c&&c.requestId===original.requestId);
  return original;
}
function bindReceipt(r:SourceAccountReceipt,c:SourceAccountWithdrawCommand,context:SourceAccountMappingContext):void{
  const hash=readReviewShape(context.requestHash,{type:'hash'});
  requireValue(r.clientId===expectedClient(context)&&r.withdrawal.recordedBy===r.clientId&&
    r.requestId===c.requestId&&r.commandHash===hash&&r.revision===c.expectedRevision+1&&
    sameCareValue(r.withdrawal.consent,c.consent));
}
/** Pure response mapping only. The context is not authentication or live Source authority. */
export function mapSourceAccountResult(command:SourceAccountCommand,input:unknown,context:SourceAccountMappingContext):SourceAccountResult{
  const c=readSourceAccountCommand(command);
  try{
    const client=expectedClient(context);
    if(c.action==='list_source_consents_v1'){
      const p=readSourceAccountPage(input);requireValue(p.clientId===client);
      if(p.state==='page')requireValue(p.cursor===c.cursor&&(c.snapshot===null||sameCareValue(c.snapshot,p.snapshot))&&p.entries.length<=c.limit);
      return p;
    }
    const original=originalWithdrawal(c,context);
    if(c.action==='withdraw_source_consent_v1'){
      const r=readSourceAccountReceipt(input);bindReceipt(r,original,context);return r;
    }
    const r=readSourceAccountStatus(input);
    requireValue(r.clientId===client&&r.requestId===original.requestId);
    // Even absent/purged status belongs to the retained original command/hash context.
    readReviewShape(context.requestHash,{type:'hash'});
    if(r.status==='committed')bindReceipt(r.receipt,original,context);
    return r;
  }catch{throw Error(isSourceAccountRead(c.action)?'unavailable':'uncertain');}
}
/** Complete page composition; no total-history cap or first100 truncation. */
export function collectSourceAccountPages(pages:readonly SourceAccountPageRead[],context:SourceAccountMappingContext):SourceAccountCollection{
  try{
    requireValue(pages.length>0);
    const parsed=pages.map(p=>{
      const c=readSourceAccountCommand(p.command);requireValue(c.action==='list_source_consents_v1');
      const result=mapSourceAccountResult(c,p.page,context);requireValue('state' in result&&result.state==='page');
      return {command:c,page:result};
    });
    const first=parsed[0];requireValue(first!==undefined);let cursor:number|null=null;
    const entries:SourceAccountCollection['entries']=[];
    for(let i=0;i<parsed.length;i++){
      const item=parsed[i];requireValue(item!==undefined);
      const c=item.command,p=item.page;
      requireValue(c.cursor===cursor&&sameCareValue(p.snapshot,first.page.snapshot)&&p.total===first.page.total);
      if(i>0)requireValue(c.snapshot!==null&&sameCareValue(c.snapshot,first.page.snapshot));
      entries.push(...p.entries);cursor=p.nextCursor;
      if(cursor===null)requireValue(i===parsed.length-1);
    }
    requireValue(cursor===null&&entries.length===first.page.total);
    return {schemaVersion:1,visibility:'client_account',clientId:first.page.clientId,state:'complete',snapshot:first.page.snapshot,
      entries:readSourceAccountRecords(entries,first.page.clientId)};
  }catch{throw Error('unavailable');}
}
export function decodeSourceAccountResponse(command:SourceAccountCommand,status:number,value:unknown,context:SourceAccountMappingContext):SourceAccountOutcome{
  const parsed=readSourceAccountCommand(command);
  const failed=():SourceAccountOutcome=>parsed.action==='withdraw_source_consent_v1'
    ?{state:'uncertain',status:503,code:'uncertain',retry:parsed}
    :{state:'rejected',status:503,code:'unavailable'};
  if(!Number.isSafeInteger(status)||status<100||status>599)return failed();
  if(status>=200&&status<300){try{return {state:'ok',value:mapSourceAccountResult(parsed,value,context)};}catch{return failed();}}
  try{
    const code=readSourceAccountError(value);requireValue(sourceAccountErrorStatuses[code]===status);
    return status===503?failed():{state:'rejected',status,code};
  }catch{return failed();}
}
