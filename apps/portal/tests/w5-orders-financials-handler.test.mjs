import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture,view,command,actor,origin} from './w5-orders-financials-helper.mjs';
test('canonical own financial read uses actual retained Auth/fixed RPC and preserves explicit unavailable guarantee',async()=>{
 const f=await fixture(),r=await f.run(f.request());assert.equal(r.status,200);assert.deepEqual(await r.json(),view());
 assert.equal(f.calls.length,2);assert.deepEqual(JSON.parse(f.calls[1].init.body),{p_command:command});
 assert.match(r.headers.get('cache-control'),/private, no-store/);assert.equal(r.headers.get('pragma'),'no-cache');assert.equal(r.headers.get('x-content-type-options'),'nosniff');
});
for(const patch of [{clientId:actor},{actorId:actor},{role:'client'},{requestId:actor},{rpc:'concierge_service_write'},{url:'https://other.invalid'},{action:'confirm_payment'},{schemaVersion:2}])test('canonical financial command refuses selector/authority/action '+JSON.stringify(patch),async()=>{
 const f=await fixture(),r=await f.run(f.request({...command,...patch}));assert.equal(r.status,400);assert.deepEqual(await r.json(),{code:'invalid_input'});assert.equal(f.calls.length,1);
});
test('JSON byte limit refuses before any RPC and empty malformed input stays invalid',async()=>{
 const f=await fixture();let r=await f.run(f.request(command,{body:' '.repeat(8193)}));assert.equal(r.status,413);assert.equal(f.calls.length,1);
 r=await f.run(f.request(command,{body:'{'}));assert.equal(r.status,400);assert.equal(f.calls.length,2);
});
test('foreign origin and missing bearer cannot reach Auth or RPC',async()=>{
 const f=await fixture();assert.equal((await f.run(f.request(command,{headers:{origin:'https://foreign.invalid'}}))).status,403);
 assert.equal((await f.run(f.request(command,{headers:{authorization:''}}))).status,401);assert.equal(f.calls.length,0);
});
test('method/media/preflight are finite and do not dispatch business calls',async()=>{
 const f=await fixture();assert.equal((await f.run(new Request('https://edge.invalid/financials'))).status,405);
 assert.equal((await f.run(f.request(command,{headers:{'content-type':'multipart/form-data'}}))).status,415);
 const response=await f.run(new Request('https://edge.invalid/financials',{method:'OPTIONS',headers:{origin}}));assert.equal(response.status,204);assert.equal(f.calls.length,0);
});
test('actual Auth denial and anonymous identity cannot read a ledger',async()=>{
 const f=await fixture();f.setAuthReply(()=>new Response(null,{status:401}));assert.equal((await f.run(f.request())).status,401);assert.equal(f.calls.length,1);
 f.setAuthReply(()=>Response.json({id:actor,is_anonymous:true}));assert.equal((await f.run(f.request())).status,403);assert.equal(f.calls.length,2);
});
for(const [message,status,code] of [['concierge_session_ended',401,'session_ended'],['concierge_forbidden',403,'forbidden'],['concierge_snapshot_conflict',409,'snapshot_conflict'],['concierge_cursor_conflict',409,'cursor_conflict']])test('closed SQL error '+message+' preserves safe status without private data',async()=>{
 const f=await fixture();f.setRpcReply(()=>Response.json({message},{status:400}));const r=await f.run(f.request());assert.equal(r.status,status);assert.deepEqual(await r.json(),{code});
});
for(const kind of ['private-fields','supported-policy','legacy-receipt','wrong-snapshot'])test('unproven response '+kind+' is unavailable, never financial authority',async()=>{
 const f=await fixture(),data=view();let c=command;
 if(kind==='private-fields')data.privateBankReference='PRIVATE_NEVER_RETURN';
 if(kind==='supported-policy')data.guarantee={state:'supported',termsVersion:1,firstThreePaidCents:30000};
 if(kind==='legacy-receipt')data.payments[0]={kind:'legacy_receipt',serviceCents:2500};
 if(kind==='wrong-snapshot')c={...command,snapshot:{...data.snapshot,paymentRevision:8}};
 f.setRpcReply(()=>Response.json(data));const r=await f.run(f.request(c));assert.equal(r.status,503);assert.deepEqual(await r.json(),{code:'unavailable'});
});
test('provider/RPC error text is never echoed and read failure never fabricates empty facts',async()=>{
 const f=await fixture();f.setRpcReply(()=>Response.json({message:'PRIVATE_SQL_REFERENCE'},{status:500}));const r=await f.run(f.request());assert.equal(r.status,503);assert.deepEqual(await r.json(),{code:'unavailable'});
});
