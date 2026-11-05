// Synthetic finite sessions/responses. No cookie channel, server or business effect.
import test from 'node:test';
import assert from 'node:assert/strict';
const api = await import('../src/features/orders/port.ts').catch(()=>({}));
const owner='11111111-1111-4111-8111-111111111111';
const snapshot={revision:1,paymentRevision:2,serviceRevision:3,asOfDay:'2026-10-31',hash:'a'.repeat(64)};
const input={schemaVersion:1,action:'read_commerce_v1',snapshot:null,cursor:null,limit:100};
function session(){const boundary={key:'session',isCurrent:()=>true};return {cookie:{audience:'client',identity:{ownerId:owner,role:'client'},generation:1,_epoch:1,status:'ready'},getSnapshot:()=>({boundary})};}
test('absent Commerce transport is explicitly unavailable before dispatch',async()=>{
 assert.equal(typeof api.createCommercePort,'function');
 const p=api.createCommercePort(session());
 assert.equal(p.availability,'unavailable');
 await assert.rejects(p.execute(input),e=>e.status===503&&e.dispatched===false);
});
test('finite future request strictly maps actual Root response and rejects advisor/private actions',async()=>{
 assert.equal(typeof api.createCommercePort,'function');
 let calls=0;const p=api.createCommercePort(session(),{family:'commerce-v1',async execute(c,o){calls++;assert.equal(o.kind,'read');return {schemaVersion:1,clientId:owner,snapshot,entries:[],nextCursor:null};}});
 assert.deepEqual((await p.execute(input)).entries,[]);
 await assert.rejects(p.execute({...input,action:'read_advisor_commerce_v1',clientId:owner}));
 assert.equal(calls,1);
});
test('creation boundary cannot adopt another owner epoch generation or boundary',async()=>{
 assert.equal(typeof api.createCommercePort,'function');
 for(const field of ['owner','epoch','generation','boundary']){const s=session();let release;const p=api.createCommercePort(s,{family:'commerce-v1',execute:()=>new Promise(r=>release=r)});const result=p.execute(input);await new Promise(r=>setImmediate(r));if(field==='owner')s.cookie.identity.ownerId='22222222-2222-4222-8222-222222222222';if(field==='epoch')s.cookie._epoch++;if(field==='generation')s.cookie.generation++;if(field==='boundary')s.getSnapshot=()=>({boundary:{key:'replacement',isCurrent:()=>true}});release({schemaVersion:1,clientId:owner,snapshot,entries:[],nextCursor:null});await assert.rejects(result,e=>e.status===401);}
});
test('unknown private response fields never cross the client mapper',async()=>{
 assert.equal(typeof api.createCommercePort,'function');
 const p=api.createCommercePort(session(),{family:'commerce-v1',async execute(){return {schemaVersion:1,clientId:owner,snapshot,entries:[],nextCursor:null,bankAccount:'PRIVATE'};}});
 await assert.rejects(p.execute(input),e=>e.status===503);
});
test('status cannot widen the finite client action surface with a service/referral intent',async()=>{
 let calls=0;const p=api.createCommercePort(session(),{family:'commerce-v1',async execute(){calls++;return {status:'absent'};}});
 await assert.rejects(p.execute({schemaVersion:1,action:'request_status_v1',requestId:'10000000-0000-4000-8000-000000000005'},{statusIntent:{schemaVersion:1,action:'request_service_refund_v1',requestId:'10000000-0000-4000-8000-000000000005',reason:null}}));assert.equal(calls,0);
});
test('actual ApplicationSession invalidates a creation-bound port after sign-out without admitting any commerce cookie route',async()=>{
 const {createApplicationSession}=await import('../src/app/session.ts');
 const calls=[];const runtime=createApplicationSession({audience:'client',locks:{request:async(_key,options,fn)=>fn(options.signal)},fetcher:async(url)=>{calls.push(url);assert.ok(url==='/api/client/session');return Response.json({signedIn:true,ownerId:owner,generation:1,capabilities:{view:true,edit:false,publish:false,confirmPayments:false},csrf:'synthetic-csrf',idleExpiresAt:'2099-01-01T00:00:00Z',absoluteExpiresAt:'2099-01-02T00:00:00Z'});}});
 try{await runtime.restore();const d={};d.promise=new Promise(r=>d.resolve=r);const p=api.createCommercePort(runtime,{family:'commerce-v1',execute:()=>d.promise});const operation=p.execute(input);await new Promise(r=>setImmediate(r));runtime.dispose();d.resolve({schemaVersion:1,clientId:owner,snapshot,entries:[],nextCursor:null});await assert.rejects(operation,e=>e.status===401);assert.deepEqual(calls,['/api/client/session']);}finally{runtime.dispose();}
});
test('product slice rejects service obligation and refund detail before any request or policy mapper',async()=>{let calls=0;const p=api.createCommercePort(session(),{family:'commerce-v1',async execute(){calls++;throw Error('must not dispatch');}});for(const kind of ['obligation','refund_request','referral','repayment_details'])await assert.rejects(p.execute({schemaVersion:1,action:'read_commerce_detail_v1',snapshot,entity:{kind,id:'10000000-0000-4000-8000-000000000005',revision:0}}),e=>e.status===403);assert.equal(calls,0);});
