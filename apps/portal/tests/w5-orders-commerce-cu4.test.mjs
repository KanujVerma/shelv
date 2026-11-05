import test from 'node:test';import assert from 'node:assert/strict';
import {setup,owner,intentKey,deferred,receiptHash,instant} from './w5-orders-commerce-cu-fixtures.mjs';
import {actions,optionsFor,deliberate,naturalConnection} from './w5-orders-commerce-cu4-fixtures.mjs';

for(const action of actions)test(`CU4 natural retained503 BEFORE hash prevents first ${action} egress without false custody`,async t=>{
 const f=await setup(t,optionsFor(action)),connection=naturalConnection(f);await assert.rejects(connection.read(),e=>e.status===503);
 assert.equal(f.runtime.cookie.status,'offline');assert.equal(f.boundary.isCurrent(),true);await deliberate(f.c,f,action);
 assert.equal(f.calls.some(c=>c.action===action),false);assert.equal(f.boundary.memory.get(intentKey),undefined);assert.equal(f.c.getSnapshot().pending,null);
});
for(const action of actions)test(`CU4 natural retained503 DURING real SHA blocks first ${action} at final handoff`,async t=>{
 const f=await setup(t,optionsFor(action)),connection=naturalConnection(f);let suspended;const handoffs=[],seen=[];
 f.request.override=async c=>{if(c.action===action)seen.push(f.runtime.cookie.status);};
 const wrapped={availability:f.port.availability,execute(command,options){const p=f.port.execute(command,{...options,onDispatch(){if(command.action===action)handoffs.push(command.requestId);options?.onDispatch?.();}});if(command.action===action)suspended=connection.read().catch(e=>assert.equal(e.status,503));return p;}};
 const c=f.create('cu4-hash',wrapped);t.after(()=>c.dispose());await c.refresh();await c.open(f.entity);await deliberate(c,f,action);await suspended;
 assert.equal(f.runtime.cookie.status,'offline');assert.equal(f.boundary.isCurrent(),true);assert.deepEqual(seen,[]);assert.deepEqual(handoffs,[]);assert.equal(f.boundary.memory.get(intentKey),undefined);assert.equal(c.getSnapshot().pending,null);
});
for(const action of ['accept_product_quote_v1','submit_payment_claim_v1'])test(`CU4 suspension beginning after command hash DURING complete quote proof blocks ${action}`,async t=>{
 const f=await setup(t,optionsFor(action)),connection=naturalConnection(f);let suspended,checks=0;const handoffs=[];
 const wrapped={availability:f.port.availability,execute(command,options){if(command.action!==action)return f.port.execute(command,options);return f.port.execute(command,{...options,isApplicable(){const valid=options?.isApplicable?.()!==false;if(++checks===2)suspended=connection.read().catch(e=>assert.equal(e.status,503));return valid;},onDispatch(){handoffs.push(command.requestId);options?.onDispatch?.();}});}};
 const c=f.create('cu4-proof',wrapped);t.after(()=>c.dispose());await c.refresh();await c.open(f.entity);await deliberate(c,f,action);await suspended;
 assert.ok(checks>=3);assert.equal(f.runtime.cookie.status,'offline');assert.equal(f.boundary.isCurrent(),true);assert.equal(f.calls.some(x=>x.action===action),false);assert.deepEqual(handoffs,[]);assert.equal(f.boundary.memory.get(intentKey),undefined);
});
for(const action of actions)test(`CU4 natural suspension AFTER ${action} dispatch preserves exact uncertainty and current denial custody`,async t=>{
 const f=await setup(t,optionsFor(action)),connection=naturalConnection(f);
 f.request.override=async c=>{if(c.action===action){await assert.rejects(connection.read(),e=>e.status===503);return Response.json({code:'uncertain'},{status:503});}};
 await deliberate(f.c,f,action);const sent=f.calls.find(c=>c.action===action),held=structuredClone(f.boundary.memory.get(intentKey));assert.ok(sent);assert.equal(f.runtime.cookie.status,'offline');assert.equal(f.boundary.isCurrent(),true);
 assert.deepEqual(held.command,sent);assert.equal(held.rawWire,JSON.stringify(sent));assert.equal(held.commandHash,await receiptHash(sent));assert.equal(held.dispatched,true);assert.equal(f.c.getSnapshot().pending.phase,'uncertain');
 // Only the actual public session restore restores readiness; no automatic write.
 await f.runtime.restore();assert.equal(f.runtime.cookie.status,'ready');assert.equal(f.calls.filter(c=>c.action===action).length,1);
 f.request.override=async c=>c.action==='request_status_v1'?Response.json({code:'forbidden'},{status:403}):undefined;await f.c.checkStatus();assert.equal(f.c.getSnapshot().selection,null);assert.equal(f.c.getSnapshot().index,null);assert.equal(f.boundary.memory.get(intentKey).rawWire,held.rawWire);
});
for(const action of actions)test(`CU4 abort signal during actual ${action} hash prevents first egress and handoff`,async t=>{
 const f=await setup(t,optionsFor(action)),abort=new AbortController();let handoffs=0;
 const wrapped={availability:f.port.availability,execute(command,options){const p=f.port.execute(command,{...options,signal:abort.signal,onDispatch(){handoffs++;options?.onDispatch?.();}});if(command.action===action)abort.abort();return p;}};
 const c=f.create('cu4-abort',wrapped);t.after(()=>c.dispose());await c.refresh();await c.open(f.entity);handoffs=0;await deliberate(c,f,action);
 assert.equal(f.calls.some(x=>x.action===action),false);assert.equal(handoffs,0);assert.equal(f.boundary.memory.get(intentKey),undefined);assert.equal(c.getSnapshot().pending,null);
});
for(const action of actions)test(`CU4 normal ready ${action} plus ordinary Commerce status503 preserves exact original wire`,async t=>{
 const f=await setup(t,optionsFor(action));await deliberate(f.c,f,action);const sent=f.calls.find(c=>c.action===action);assert.ok(sent);assert.equal(f.runtime.cookie.status,'ready');const before=structuredClone(f.c.getSnapshot().pending);
 await f.c.checkStatus();assert.deepEqual(f.c.getSnapshot().pending.command,before.command);assert.equal(f.c.getSnapshot().pending.rawWire,before.rawWire);assert.equal(f.c.getSnapshot().pending.commandHash,before.commandHash);assert.equal(f.c.getSnapshot().pending.status,'failed');
});
for(const action of actions)test(`CU4 same-owner public restore does not replay blocked ${action}; a separate action is required`,async t=>{
 const f=await setup(t,optionsFor(action)),connection=naturalConnection(f);let transition,once=true;
 const wrapped={availability:f.port.availability,execute(command,options){const p=f.port.execute(command,options);if(command.action===action&&once){once=false;transition=connection.read().catch(e=>assert.equal(e.status,503));}return p;}};
 const c=f.create('cu4-public-restore',wrapped);t.after(()=>c.dispose());await c.refresh();await c.open(f.entity);
 const boundary=f.boundary,epoch=f.runtime.cookie._epoch,generation=f.runtime.cookie.generation;await deliberate(c,f,action);await transition;assert.equal(f.calls.some(x=>x.action===action),false);assert.equal(f.boundary.memory.get(intentKey),undefined);
 await f.runtime.restore();assert.equal(f.runtime.cookie.status,'ready');assert.equal(f.runtime.getSnapshot().boundary,boundary);assert.equal(f.runtime.cookie._epoch,epoch);assert.equal(f.runtime.cookie.generation,generation);assert.equal(f.calls.some(x=>x.action===action),false);
 await deliberate(c,f,action);assert.equal(f.calls.filter(x=>x.action===action).length,1);assert.equal(c.getSnapshot().pending.phase,'uncertain');
});
test('CU4 offline status/retry cannot clear or rebase dispatched pending A, nor grant review',async t=>{
 const f=await setup(t,{accepted:true});await deliberate(f.c,f,'submit_payment_claim_v1');const before=structuredClone(f.boundary.memory.get(intentKey)),connection=naturalConnection(f);await assert.rejects(connection.read(),e=>e.status===503);
 await f.c.checkStatus();await f.c.retryIntent();assert.equal(f.calls.filter(x=>x.action==='submit_payment_claim_v1').length,1);assert.equal(f.c.getSnapshot().pending.rawWire,before.rawWire);assert.equal(f.c.getSnapshot().pending.commandHash,before.commandHash);assert.deepEqual(f.c.getSnapshot().pending.command,before.command);assert.equal(f.c.getSnapshot().reviewed,false);
});
test('CU4 an actual private future read value arriving after natural suspension is rejected',async t=>{
 const f=await setup(t),connection=naturalConnection(f);f.request.override=async c=>{if(c.action==='read_commerce_v1'){await assert.rejects(connection.read(),e=>e.status===503);return Response.json({schemaVersion:1,clientId:owner,snapshot:f.request.snapshot,entries:[{entity:f.entity,label:'PRIVATE_FUTURE_CU4',state:'payable',recordedAt:instant}],nextCursor:null});}};
 await f.c.refresh();assert.equal(f.runtime.cookie.status,'offline');assert.equal(f.boundary.isCurrent(),true);assert.equal(f.c.getSnapshot().phase,'offline');assert.equal(JSON.stringify(f.c.getSnapshot()).includes('PRIVATE_FUTURE_CU4'),false);
});
for(const action of actions)test(`CU4 old retained503 after natural owner replacement cannot suspend the new session or dispatch ${action}`,async t=>{
 const f=await setup(t,optionsFor(action)),oldReply=deferred(),entered=deferred(),connection=naturalConnection(f,{operationReply:()=>oldReply.promise,nextOwner:true});let oldRead,replacement;
 const wrapped={availability:f.port.availability,execute(command,options){const p=f.port.execute(command,options);if(command.action===action){oldRead=connection.read().catch(e=>assert.equal(e.status,401));replacement=f.runtime.restore();entered.resolve();}return p;}};
 const c=f.create('cu4-old-owner',wrapped);t.after(()=>c.dispose());await c.refresh();await c.open(f.entity);const operation=deliberate(c,f,action);await entered.promise;await replacement;oldReply.resolve(Response.json({code:'unavailable'},{status:503}));await Promise.all([operation,oldRead]);
 assert.equal(f.runtime.cookie.status,'ready');assert.notEqual(f.runtime.getSnapshot().boundary,f.boundary);assert.equal(f.boundary.isCurrent(),false);assert.equal(f.calls.some(x=>x.action===action),false);assert.equal(c.getSnapshot().pending,null);
});
