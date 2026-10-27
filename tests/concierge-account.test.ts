import assert from 'node:assert/strict';
import test from 'node:test';
import {mapConciergeClientView} from '../src/contracts/ConciergePortalMapping.ts';
import {emptyClientFixture} from './fixtures/concierge.ts';
test('client account allows only the bounded canonical display name and preserves legacy absence',()=>{
 const raw={...emptyClientFixture(),account:{displayName:'Morgan Lee',email:'PRIVATE_EMAIL',role:'PRIVATE_ROLE'}};
 assert.deepEqual(mapConciergeClientView(raw).account,{displayName:'Morgan Lee'});
 assert.equal(Object.hasOwn(mapConciergeClientView(emptyClientFixture()),'account'),false);
 assert.doesNotMatch(JSON.stringify(mapConciergeClientView(raw)),/PRIVATE_/);
 for(const displayName of ['', ' ', 'x'.repeat(201), null, 123])assert.throws(()=>mapConciergeClientView({...raw,account:{displayName}}),/invalid_concierge_response/);
});

test('existing client read handler carries only own-name projection and rejects a supplied target',async()=>{
 const {handleConciergeRequest}=await import('../supabase/functions/concierge-operations/handler.ts');
 const owner='10000000-0000-4000-8000-000000000001',calls:unknown[]=[];
 const wire={...emptyClientFixture(),schemaVersion:2,activeRoutine:[],account:{displayName:'Canonical client',email:'PRIVATE_EMAIL'}};
 const ports={allowedOrigins:[] as string[],authenticate:async()=>({id:owner,is_anonymous:false}),rpc:async(_token:string,call:unknown)=>{calls.push(call);return {data:wire,error:null};}};
 const request=(body:unknown)=>new Request('https://example.invalid',{method:'POST',headers:{authorization:'Bearer synthetic','content-type':'application/json'},body:JSON.stringify(body)});
 const response=await handleConciergeRequest(request({action:'client_read_v2'}),ports);
 assert.equal(response.status,200);assert.deepEqual((await response.json()).account,{displayName:'Canonical client'});assert.deepEqual(calls,[{name:'concierge_client_view_v2',args:{}}]);
 const denied=await handleConciergeRequest(request({action:'client_read_v2',clientId:'10000000-0000-4000-8000-000000000002'}),ports);assert.equal(denied.status,400);assert.equal(calls.length,1);
});
