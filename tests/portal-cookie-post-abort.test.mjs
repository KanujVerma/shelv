import test from 'node:test';import assert from 'node:assert/strict';
import {families,fixture,rawRequest,statusCommand,positiveRoot,deferred} from '../apps/portal/tests/rebuild-cookie-cancellation-helper.mjs';
globalThis.fetch=async()=>{throw Error('global_network_denied');};
for(const family of families)for(const status of [401,403])for(const timing of ['synchronous','held'])test(`${family}: ${timing} HTTP${status} headers first delivered after caller abort are local503 without session effects`,async t=>{
 const audience=family.split('/')[0],f=await fixture(t,{audience}),controller=new AbortController();const entered=deferred(),held=deferred();
 f.queue.push(timing==='synchronous'?(_url,init)=>{controller.abort();assert.equal(init.signal.aborted,true);return Response.json({code:status===401?'session_ended':'forbidden'},{status});}:async(_url,init)=>{entered.resolve();await held.promise;assert.equal(init.signal.aborted,true);return Response.json({code:status===401?'session_ended':'forbidden'},{status});});
 const boundary=f.runtime.getSnapshot().boundary,epoch=f.runtime.cookie._epoch,generation=f.runtime.cookie.generation;
 const pending=rawRequest(f,family).execute(statusCommand,{signal:controller.signal});const rejected=assert.rejects(pending,e=>e.status===503&&e.outcome==='rejected');
 if(timing==='held'){await entered.promise;controller.abort();held.resolve();}await rejected;
 assert.equal(f.runtime.cookie.status,'ready');assert.equal(f.runtime.getSnapshot().boundary,boundary);assert.equal(boundary.isCurrent(),true);assert.equal(f.runtime.cookie._epoch,epoch);assert.equal(f.runtime.cookie.generation,generation);
 f.reply({status:'absent'});assert.deepEqual(positiveRoot(await rawRequest(f,family).execute(statusCommand),statusCommand,family),{status:'absent'});assert.equal(f.calls.length,2);
});
