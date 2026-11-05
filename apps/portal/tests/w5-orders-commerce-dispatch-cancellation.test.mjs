import test from 'node:test';
import assert from 'node:assert/strict';
import {createApplicationSession} from '../src/app/session.ts';
import {createCommercePort} from '../src/features/orders/port.ts';

test('Orders port does not invoke the fixed request after onDispatch synchronously suspends its actual session',async t=>{
 const runtime=createApplicationSession({audience:'client',locks:{request:async(_n,_o,run)=>run()},fetcher:async url=>{
  assert.equal(url,'/api/client/session');
  return Response.json({signedIn:true,ownerId:'11111111-1111-4111-8111-111111111111',generation:1,csrf:'SYNTHETIC-w7-orders-dispatch',capabilities:{view:true,edit:false,publish:false,confirmPayments:false},idleExpiresAt:'2099-01-01T00:00:00Z',absoluteExpiresAt:'2099-01-02T00:00:00Z'});
 }});
 t.after(()=>runtime.dispose());await runtime.restore();
 let calls=0;
 const port=createCommercePort(runtime,{family:'commerce-v1',async execute(){calls++;return undefined;}});
 await assert.rejects(port.execute({schemaVersion:1,action:'read_commerce_v1',snapshot:null,cursor:null,limit:100},{onDispatch(){runtime.cookie.suspend();}}),error=>error.status===503);
 assert.equal(runtime.cookie.status,'offline');
 assert.equal(calls,0,'a synchronously retired READY state must fence the fixed request invocation');
});


// Owner extensions exercise only the corrected successor and actual session.
async function clientRuntime(t){
 const broadcast=globalThis.BroadcastChannel;globalThis.BroadcastChannel=undefined;t.after(()=>{globalThis.BroadcastChannel=broadcast;});
 const runtime=createApplicationSession({audience:'client',locks:{request:async(_n,_o,run)=>run()},fetcher:async url=>{
  assert.equal(url,'/api/client/session');return Response.json({signedIn:true,ownerId:'11111111-1111-4111-8111-111111111111',generation:1,csrf:'SYNTHETIC-w5-o1-successor',capabilities:{view:true,edit:false,publish:false,confirmPayments:false},idleExpiresAt:'2099-01-01T00:00:00Z',absoluteExpiresAt:'2099-01-02T00:00:00Z'});
 }});await runtime.restore();t.after(()=>runtime.dispose());return runtime;
}
const indexRead=()=>({schemaVersion:1,action:'read_commerce_v1',snapshot:null,cursor:null,limit:100});
function counted(runtime){const seen=[];return {seen,port:createCommercePort(runtime,{family:'commerce-v1',async execute(command){seen.push(JSON.stringify(command));return undefined;}})};}
test('onDispatch cannot replace an aborted original signal with a fresh one',async t=>{
 const runtime=await clientRuntime(t),{port,seen}=counted(runtime),abort=new AbortController(),options={signal:abort.signal,onDispatch(){abort.abort();options.signal=new AbortController().signal;}};
 await assert.rejects(port.execute(indexRead(),options),error=>error.status===503);assert.equal(seen.length,0);
});
test('actual owner retirement inside onDispatch cannot invoke the fixed request',async t=>{
 const runtime=await clientRuntime(t),{port,seen}=counted(runtime);await assert.rejects(port.execute(indexRead(),{onDispatch(){runtime.cookie._end();}}),error=>error.status===401);assert.equal(runtime.getSnapshot().boundary,null);assert.equal(seen.length,0);
});
test('onDispatch cannot replace a captured deny-only relevance predicate',async t=>{
 const runtime=await clientRuntime(t),{port,seen}=counted(runtime);let relevant=true;const options={isApplicable:()=>relevant,onDispatch(){relevant=false;options.isApplicable=()=>true;}};
 await assert.rejects(port.execute(indexRead(),options),error=>error.status===503);assert.equal(seen.length,0);
});
test('a relevance callback returning true after actual suspension remains a denial',async t=>{
 const runtime=await clientRuntime(t),{port,seen}=counted(runtime);let handoffs=0;await assert.rejects(port.execute(indexRead(),{isApplicable(){runtime.cookie.suspend();return true;},onDispatch(){handoffs++;}}),error=>error.status===503);assert.equal(seen.length,0);assert.equal(handoffs,0);
});
test('post-handoff relevance callback retirement is checked after the callback too',async t=>{
 const runtime=await clientRuntime(t),{port,seen}=counted(runtime);let handed=false;await assert.rejects(port.execute(indexRead(),{onDispatch(){handed=true;},isApplicable(){if(handed)runtime.cookie.suspend();return true;}}),error=>error.status===503);assert.equal(handed,true);assert.equal(seen.length,0);
});
test('throwing custody callback cannot invoke the fixed request',async t=>{
 const runtime=await clientRuntime(t),{port,seen}=counted(runtime);await assert.rejects(port.execute(indexRead(),{onDispatch(){throw Error('local cancellation');}}),error=>error.status===503);assert.equal(seen.length,0);
});
test('write custody retained by the hook keeps original UUID body and hash after cancellation',async t=>{
 const runtime=await clientRuntime(t),{port,seen}=counted(runtime),boundary=runtime.getSnapshot().boundary;
 const {readCommerceCommand,hashCommerceCommand}=await import('../../../src/contracts/PortalCommerceValidation.ts');
 const command=readCommerceCommand({schemaVersion:1,action:'confirm_product_received_v1',requestId:'a0000000-0000-4000-8000-000000000001',purchaseId:'a0000000-0000-4000-8000-000000000002',expectedFulfillmentRevision:3,occurredOn:{state:'unknown'}}),rawWire=JSON.stringify(command),commandHash=await hashCommerceCommand(command),key='orders-intent:11111111-1111-4111-8111-111111111111';
 const held={command,phase:'uncertain',status:'unchecked',dispatched:true,rawWire,commandHash};
 await assert.rejects(port.execute(command,{onDispatch(){boundary.memory.set(key,structuredClone(held));runtime.cookie.suspend();}}),error=>error.status===503&&error.dispatched===false&&error.uncertain===true);
 assert.equal(seen.length,0);assert.deepEqual(boundary.memory.get(key),held);await runtime.restore();assert.equal(runtime.getSnapshot().boundary,boundary);assert.deepEqual(boundary.memory.get(key),held);
});
test('local handoff callback cannot manufacture a definite financial conflict status',async t=>{
 const runtime=await clientRuntime(t),{port,seen}=counted(runtime);
 const {CommerceError}=await import('../src/features/orders/port.ts');
 await assert.rejects(port.execute(indexRead(),{onDispatch(){throw new CommerceError(409);}}),error=>error.status===503);
 assert.equal(seen.length,0);
});
