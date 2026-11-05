import {readSourceAccountPage,readSourceAccountCommand} from '../../../src/contracts/PortalSourceAccountValidation.ts';
export const uid=n=>`61000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
export const client=uid(1),recorder=uid(2);
export function consent(id=10,purpose='service_storage',groupId=uid(3)){
 return {consent:{id:uid(id),groupId,purpose,disclosure:{version:1,hash:(purpose==='service_storage'?'a':'b').repeat(64)}},
  disclosureText:`SYNTHETIC DISCLOSURE ONLY: ${purpose}. Not approved client disclosure.`,supersedesConsentId:null,
  confirmation:{kind:'manual',decision:'allow',channel:'call',occurredAt:{state:'unknown'},recordedBy:recorder,recordedAt:'2026-11-01T12:00:00Z'},effective:'not_withdrawn',withdrawal:null};
}
export function page(entries=[consent(),consent(11,'service_review')],changes={}){
 return readSourceAccountPage({schemaVersion:1,visibility:'client_account',clientId:client,state:'page',snapshot:{revision:7,hash:'c'.repeat(64)},cursor:null,total:entries.length,entries,nextCursor:null,...changes});
}
export const loaded=(value=page(),changes={})=>({read:{state:'loaded',page:value},presentation:'review',...changes});
export const original=()=>readSourceAccountCommand({schemaVersion:1,action:'withdraw_source_consent_v1',requestId:uid(90),expectedRevision:7,consent:consent().consent});
export const pending=(observation={state:'unknown'})=>({original:original(),requestHash:'d'.repeat(64),observation});
