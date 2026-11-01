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
