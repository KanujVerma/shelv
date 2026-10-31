import assert from 'node:assert/strict';
import {test} from 'node:test';
import {handleGuidanceRequest} from '../supabase/functions/concierge-guidance/handler.ts';
import {readGuidanceCommand} from '../src/contracts/PortalReviewValidation.ts';
import type {GuidanceBody} from '../src/contracts/PortalReview.ts';

const id='10000000-0000-4000-8000-000000000001';
const body:Extract<GuidanceBody,{kind:'instruction'}>={kind:'instruction',publication:{version:1,documentSchemaVersion:3},slotId:'routine',productId:null,baseInstructionId:null,baseInstructionVersion:0,useBasis:null,directions:['use a small amount'],cautions:[],schedule:{periods:['evening'],days:{kind:'daily'},condition:null,asNeeded:false,stages:[],anchor:'actual_start',automaticAdvance:false},reason:'reviewed directions',effectiveOn:'2026-10-31',reviewId:null};
const stage=(stageId:string)=>({id:stageId,directions:'same clinical directions',minimumDaysFromActualStart:null,proceedOnlyWhen:'comfortable'});
const target={kind:'instruction',draftId:id,clientId:id,revision:1,basisHash:'a'.repeat(64),contentHash:'b'.repeat(64)};
const command=(ids:string[],save=false)=>({schemaVersion:1,action:save?'save_guidance_draft_v1':'create_guidance_draft_v1',requestId:id,...(save?{target}:{clientId:id}),body:{...body,schedule:{...body.schedule,stages:ids.map(stage)}}});
const request=(value:unknown)=>new Request('https://edge.invalid',{method:'POST',headers:{authorization:'Bearer synthetic','content-type':'application/json'},body:JSON.stringify(value)});
globalThis.fetch=async()=>{throw Error('external_network_forbidden');};

test('actual Guidance create and save reject duplicate opaque stage identities before RPC',async()=>{
 let calls=0;
 const ports={allowedOrigins:[],authenticate:async()=>({id,is_anonymous:false}),rpc:async()=>{calls++;throw Error('invalid_input_reached_rpc');}};
 for(const save of [false,true])for(const ids of [['same','same'],['a','b','a']]){
  const response=await handleGuidanceRequest(request(command(ids,save)),ports);
  assert.equal(response.status,400);assert.deepEqual(await response.json(),{code:'invalid_input'});
 }
 assert.equal(calls,0);
});

test('stage identity is case-sensitive and valid same-direction stages reach fixed RPC unchanged',async()=>{
 const seen:unknown[]=[];
 const ports={allowedOrigins:[],authenticate:async()=>({id,is_anonymous:false}),rpc:async(_token:string,call:unknown)=>{seen.push(call);return {data:null,error:{message:'concierge_forbidden'}};}};
 for(const ids of [[],['Stage','stage'],['non_uuid','non-uuid'],Array.from({length:20},(_,i)=>`stage${i}`)]){
  const value=command(ids);assert.deepEqual(readGuidanceCommand(value),value);
  const response=await handleGuidanceRequest(request(value),ports);
  assert.equal(response.status,403);assert.deepEqual(await response.json(),{code:'forbidden'});
  assert.deepEqual(seen.at(-1),{name:'concierge_guidance_command_v1',args:{p_command:value}});
 }
});

test('stage count and opaque syntax remain closed without whitespace or UUID coercion',()=>{
 for(const ids of [['a',' a'],['a','a '],['constructor'],Array.from({length:21},(_,i)=>`stage${i}`)])assert.throws(()=>readGuidanceCommand(command(ids)));
});
