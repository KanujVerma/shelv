import assert from 'node:assert/strict';
import {test} from 'node:test';
import type {SourceAccountConsent,SourceAccountPage,SourceAccountListCommand,SourceAccountWithdrawCommand,SourceAccountReceipt} from '../src/contracts/PortalSourceAccount.ts';
import {mapSourceAccountResult,collectSourceAccountPages} from '../src/contracts/PortalSourceAccountMapping.ts';
import {readSourceAccountRecords,buildSourceAccountRpc} from '../src/contracts/PortalSourceAccountValidation.ts';

globalThis.fetch=async()=>{throw Error('external_fetch_denied');};
const id=(n:number)=>`60000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const client=id(1),advisor=id(2),group=id(100),otherGroup=id(101),hash='a'.repeat(64),requestHash='b'.repeat(64);
const snapshot={revision:7,hash};
const command:SourceAccountListCommand={schemaVersion:1,action:'list_source_consents_v1',snapshot:null,cursor:null,limit:100};
function row(n:number,previous:number|null=null):SourceAccountConsent{return {
  consent:{id:id(n),groupId:group,purpose:'service_storage',disclosure:{version:1,hash}},
  supersedesConsentId:previous===null?null:id(previous),disclosureText:'SYNTHETIC EXACT DISCLOSURE ONLY',
  confirmation:{kind:'manual',decision:'allow',channel:'call',occurredAt:{state:'unknown'},recordedBy:advisor,recordedAt:'2026-11-01T12:00:00Z'},
  effective:'not_withdrawn',withdrawal:null,
};}
function page(entries:SourceAccountConsent[]):SourceAccountPage{return {schemaVersion:1,visibility:'client_account',clientId:client,state:'page',snapshot,cursor:null,total:entries.length,entries,nextCursor:null};}
function both(entries:SourceAccountConsent[]):void{
  const p=page(entries);assert.deepEqual(mapSourceAccountResult(command,p,{clientId:client}),p);
  assert.deepEqual(collectSourceAccountPages([{command,page:p}],{clientId:client}).entries,entries);
}
function rejectBoth(entries:SourceAccountConsent[]):void{
  const p=page(entries);assert.throws(()=>mapSourceAccountResult(command,p,{clientId:client}),/^Error: unavailable$/);
  assert.throws(()=>collectSourceAccountPages([{command,page:p}],{clientId:client}),/^Error: unavailable$/);
}
function withdrawn(r:SourceAccountConsent):SourceAccountConsent{
  return {...r,effective:'withdrawn',withdrawal:{id:id(200),origin:'client_portal',consent:r.consent,recordedBy:client,recordedAt:'2026-11-01T12:00:00Z'}};
}

test('complete orphan supersession and older-current/later-superseded withdrawal reject on both boundaries',()=>{
  rejectBoth([{...row(10),effective:'superseded'}]);
  rejectBoth([row(10),{...row(11,10),confirmation:{...row(11).confirmation,decision:'withdraw'},effective:'superseded'}]);
});
test('independent lawful groups each retain a current record for the same purpose',()=>{
  both([row(10),{...row(11),consent:{...row(11).consent,groupId:otherGroup}}]);
});
test('one group has independent storage/review chains and root manual denial is representable',()=>{
  const review=row(12);review.consent.purpose='service_review';review.confirmation.decision='withdraw';review.effective='withdrawn';
  both([{...row(10),effective:'superseded'},row(11,10),review]);
});
test('manual allow/withdraw/reallow chain retains older withdrawal and only actual terminal state',()=>{
  const denial=row(11,10);denial.confirmation.decision='withdraw';denial.effective='superseded';
  both([{...row(10),effective:'superseded'},denial,row(12,11)]);
  const terminal={...denial,effective:'withdrawn' as const};both([{...row(10),effective:'superseded'},terminal]);
});
test('portal withdrawal is linked to its original manual allow and survives later supersession',()=>{
  both([withdrawn(row(10))]);
  both([{...withdrawn(row(10)),effective:'superseded'},row(11,10)]);
  rejectBoth([{...row(10),effective:'superseded'},withdrawn(row(11,10)),row(12,11)]);
});
test('opaque UUID and recorded timestamp order never manufacture causal order',()=>{
  const original=row(40);original.effective='superseded';original.confirmation.recordedAt='2026-11-02T12:00:00Z';
  const current=row(10,40);current.confirmation.recordedAt='2026-11-01T12:00:00Z';
  both([current,original]);
});
test('partial pages permit genuinely off-page successors and predecessors, including a terminal tail',()=>{
  const a={...row(10),effective:'superseded' as const},b=row(11,10);
  const first={...page([a]),total:2,nextCursor:1};
  assert.deepEqual(mapSourceAccountResult(command,first,{clientId:client}),first);
  const nextCommand:SourceAccountListCommand={...command,snapshot,cursor:1};
  const tail={...page([b]),cursor:1,total:2};
  assert.deepEqual(mapSourceAccountResult(nextCommand,tail,{clientId:client}),tail);
  assert.deepEqual(collectSourceAccountPages([{command,page:first},{command:nextCommand,page:tail}],{clientId:client}).entries,[a,b]);
  assert.throws(()=>collectSourceAccountPages([{command,page:first}],{clientId:client}),/^Error: unavailable$/);
});
test('self, cycle, fork and cross-group/purpose predecessor relations reject',()=>{
  rejectBoth([row(10,10)]);
  rejectBoth([{...row(10,11),effective:'superseded'},{...row(11,10),effective:'superseded'}]);
  rejectBoth([{...row(10),effective:'superseded'},row(11,10),row(12,10)]);
  rejectBoth([{...row(10),effective:'superseded'},{...row(11,10),consent:{...row(11).consent,groupId:otherGroup}}]);
  rejectBoth([{...row(10),effective:'superseded'},{...row(11,10),consent:{...row(11).consent,purpose:'service_review'}}]);
});
test('complete history rejects unresolved predecessor, disconnected roots and a cycle beside a valid chain',()=>{
  rejectBoth([row(10,9)]);rejectBoth([{...row(10),effective:'superseded'},row(11)]);
  rejectBoth([row(10),{...row(11,12),effective:'superseded'},{...row(12,11),effective:'superseded'}]);
});
test('partial pages still reject visible successors of current nodes, cycles, forks and current conflicts',()=>{
  for(const entries of [
    [row(10),row(11,10)],
    [{...row(10,11),effective:'superseded' as const},{...row(11,10),effective:'superseded' as const}],
    [{...row(10),effective:'superseded' as const},row(11,10),row(12,10)],
    [row(10),row(11)],
  ])assert.throws(()=>mapSourceAccountResult(command,{...page(entries),total:entries.length+1,nextCursor:entries.length},{clientId:client}),/^Error: unavailable$/);
});
test('group binding protects direct withdrawal and original status independently from declared hashes',()=>{
  const c:SourceAccountWithdrawCommand={schemaVersion:1,action:'withdraw_source_consent_v1',requestId:id(8),expectedRevision:7,consent:row(10).consent};
  const r:SourceAccountReceipt={schemaVersion:1,visibility:'client_account',clientId:client,action:c.action,requestId:c.requestId,commandHash:requestHash,revision:8,outcome:'withdrawn',withdrawal:withdrawn(row(10)).withdrawal!};
  const context={clientId:client,requestHash,originalWithdrawal:c};
  assert.deepEqual(mapSourceAccountResult(c,r,context),r);assert.deepEqual(buildSourceAccountRpc(c).args.p_command,c);
  const wrong={...r,withdrawal:{...r.withdrawal,consent:{...r.withdrawal.consent,groupId:otherGroup}}};
  assert.throws(()=>mapSourceAccountResult(c,wrong,context),/^Error: uncertain$/);
  assert.throws(()=>mapSourceAccountResult({schemaVersion:1,action:'request_status_v1',requestId:c.requestId},{schemaVersion:1,visibility:'client_account',clientId:client,requestId:c.requestId,status:'committed',receipt:wrong},context),/^Error: unavailable$/);
});
test('empty complete and explicit unavailable remain separate from unprovable lineage',()=>{
  both([]);
  const value={schemaVersion:1,visibility:'client_account',clientId:client,state:'unavailable',code:'client_lineage_unavailable'};
  assert.deepEqual(mapSourceAccountResult(command,value,{clientId:client}),value);
  assert.throws(()=>readSourceAccountRecords([{...row(10),supersedesConsentId:undefined}],client),/^Error: invalid_input$/);
});

test('withdrawal in one independent group does not retire another group of the same purpose',()=>{
  const denial=row(10);denial.confirmation.decision='withdraw';denial.effective='withdrawn';
  const independent={...row(11),consent:{...row(11).consent,groupId:otherGroup}};
  both([denial,independent]);
  both([withdrawn(row(10)),independent]);
});
test('cross-page forks and closed cycles cannot borrow a complete label from individually valid pages',()=>{
  const first={...page([{...row(10),effective:'superseded'},{...row(11,10),effective:'superseded'}]),total:4,nextCursor:2};
  const second={...page([{...row(12,10),effective:'superseded'},row(13,11)]),cursor:2,total:4};
  const nextCommand:SourceAccountListCommand={...command,snapshot,cursor:2};
  assert.deepEqual(mapSourceAccountResult(command,first,{clientId:client}),first);
  assert.deepEqual(mapSourceAccountResult(nextCommand,second,{clientId:client}),second);
  assert.throws(()=>collectSourceAccountPages([{command,page:first},{command:nextCommand,page:second}],{clientId:client}),/^Error: unavailable$/);
  const a={...page([{...row(10,11),effective:'superseded'}]),total:3,nextCursor:1};
  const b={...page([{...row(11,10),effective:'superseded'},row(20,11)]),cursor:1,total:3};
  assert.deepEqual(mapSourceAccountResult(command,a,{clientId:client}),a);
  assert.deepEqual(mapSourceAccountResult({...command,snapshot,cursor:1},b,{clientId:client}),b);
  assert.throws(()=>collectSourceAccountPages([{command,page:a},{command:{...command,snapshot,cursor:1},page:b}],{clientId:client}),/^Error: unavailable$/);
});
test('partial visible cross-group and cross-purpose predecessor contradictions reject',()=>{
  const previous={...row(10),effective:'superseded' as const};
  for(const child of [{...row(11,10),consent:{...row(11).consent,groupId:otherGroup}},
    {...row(11,10),consent:{...row(11).consent,purpose:'service_review' as const}}]){
    assert.throws(()=>mapSourceAccountResult(command,{...page([previous,child]),total:3,nextCursor:2},{clientId:client}),/^Error: unavailable$/);
  }
});
test('missing or unsafe group aliases never become an inferred group or client/source selector',()=>{
  for(const groupId of [undefined,null,'invalid']){
    const input={...page([row(10)]),entries:[{...row(10),consent:{...row(10).consent,groupId}}]};
    assert.throws(()=>mapSourceAccountResult(command,input,{clientId:client}),/^Error: unavailable$/);
  }
  for(const extra of [{scope:{kind:'draft',draftId:id(9)}},{sourceId:id(9)},{draftId:id(9)},{groupLabel:'PRIVATE_CANARY'},{reference:'PRIVATE_CANARY'}]){
    assert.throws(()=>mapSourceAccountResult(command,{...page([row(10)]),entries:[{...row(10),consent:{...row(10).consent,...extra}}]},{clientId:client}),/^Error: unavailable$/);
  }
});
test('original status binds the required group and cannot adopt a changed original command',()=>{
  const original:SourceAccountWithdrawCommand={schemaVersion:1,action:'withdraw_source_consent_v1',requestId:id(8),expectedRevision:7,consent:row(10).consent};
  const receipt:SourceAccountReceipt={schemaVersion:1,visibility:'client_account',clientId:client,action:original.action,requestId:original.requestId,commandHash:requestHash,revision:8,outcome:'withdrawn',withdrawal:withdrawn(row(10)).withdrawal!};
  const status={schemaVersion:1 as const,action:'request_status_v1' as const,requestId:original.requestId};
  const response={schemaVersion:1,visibility:'client_account',clientId:client,requestId:original.requestId,status:'committed',receipt};
  assert.throws(()=>mapSourceAccountResult(status,response,{clientId:client,requestHash,originalWithdrawal:{...original,consent:{...original.consent,groupId:otherGroup}}}),/^Error: unavailable$/);
  assert.deepEqual(mapSourceAccountResult(status,response,{clientId:client,requestHash,originalWithdrawal:original}),response);
  const purged={schemaVersion:1,visibility:'client_account',clientId:client,requestId:original.requestId,status:'unavailable',code:'request_purged'};
  assert.deepEqual(mapSourceAccountResult(status,purged,{clientId:client,requestHash,originalWithdrawal:original}),purged);
});
test('201 explicit causal records remain complete when UUID pagination reverses their causal order',()=>{
  const entries=Array.from({length:201},(_,i)=>{
    const n=10+i,r=row(n,n===210?null:n+1);r.effective=n===10?'not_withdrawn':'superseded';return r;
  });
  const first={...page(entries.slice(0,100)),total:201,nextCursor:100};
  const middle={...page(entries.slice(100,200)),cursor:100,total:201,nextCursor:200};
  const last={...page(entries.slice(200)),cursor:200,total:201};
  assert.deepEqual(collectSourceAccountPages([{command,page:first},{command:{...command,snapshot,cursor:100},page:middle},{command:{...command,snapshot,cursor:200},page:last}],{clientId:client}).entries,entries);
});

function typeCases():void{
  const c:SourceAccountWithdrawCommand={schemaVersion:1,action:'withdraw_source_consent_v1',requestId:id(8),expectedRevision:7,consent:row(10).consent};
  // @ts-expect-error an exact consent reference requires the actual opaque group fact
  const missingGroup:SourceAccountWithdrawCommand={...c,consent:{id:id(10),purpose:'service_storage',disclosure:{version:1,hash}}};
  // @ts-expect-error the alias belongs inside the exact consent, never a top-level scope selector
  const selector:SourceAccountWithdrawCommand={...c,groupId:group};
  void [missingGroup,selector];
}
void typeCases;
