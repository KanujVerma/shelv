import test from 'node:test';
import assert from 'node:assert/strict';
import {actual} from './rebuild-client-orders-fixture.mjs';

const source=()=>import('../src/app/account-service-request.ts');
const id='55555555-5555-4555-8555-555555555555';
const read={schemaVersion:1,action:'read_client_service_v1'};
const commands=[read,{schemaVersion:1,action:'client_service_request_status_v1',requestId:id},
 {schemaVersion:1,action:'cancel_client_service_period_end_v1',requestId:id,expectedServiceRevision:0,expectedBasisHash:'a'.repeat(64),reason:null,confirmed:true}];

// Actual ApplicationSession/transport/retained factory, closed HTTP only. No
// constructor projection, namespace admission, successful port or authority bit.
for(const command of commands)test('pending fixed service '+command.action+' stays unavailable without registration',async t=>{
 const f=await actual(t),{createClientAccountServiceRequest}=await source();
 const port=createClientAccountServiceRequest(f.runtime),before=f.calls.length;
 await assert.rejects(port.execute(command),error=>error.status===503);
 assert.equal(f.calls.length,before);assert.equal(f.runtime.cookie.status,'ready');
});
test('service request rejects selectors, unknown actions and unconfirmed cancellation before egress',async t=>{
 const f=await actual(t),{createClientAccountServiceRequest}=await source(),port=createClientAccountServiceRequest(f.runtime),before=f.calls.length;
 for(const invalid of [{...read,clientId:id},{...read,schemaVersion:2},{...read,action:'grant_service'},{...commands[2],confirmed:false}]){
  await assert.rejects(port.execute(invalid),error=>error.status===400);
  assert.equal(f.calls.length,before);
 }
});
test('service request creation-bound handle cannot operate after actual session disposal',async t=>{
 const f=await actual(t),{createClientAccountServiceRequest}=await source(),port=createClientAccountServiceRequest(f.runtime),before=f.calls.length;
 f.runtime.dispose();await assert.rejects(port.execute(read),error=>error.status===401);
 assert.equal(f.calls.length,before);
});
test('an advisor session cannot use the own-client service request',async t=>{
 const f=await actual(t,{audience:'advisor'}),{createClientAccountServiceRequest}=await source(),before=f.calls.length;
 await assert.rejects(createClientAccountServiceRequest(f.runtime).execute(read),error=>error.status===401);
 assert.equal(f.calls.length,before);
});
test('caller relevance cannot supply the missing service registration',async t=>{
 const f=await actual(t),{createClientAccountServiceRequest}=await source(),before=f.calls.length;
 await assert.rejects(createClientAccountServiceRequest(f.runtime).execute(read,{isApplicable:()=>true}),error=>error.status===503);
 assert.equal(f.calls.length,before);
});
