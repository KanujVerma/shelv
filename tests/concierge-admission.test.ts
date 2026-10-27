import assert from 'node:assert/strict';
import test from 'node:test';
const contract=await import('../src/contracts/ConciergeAdmission.ts').catch(()=>null);
const endpoint=await import('../supabase/functions/concierge-admission/handler.ts').catch(()=>null);
const actor='10000000-0000-4000-8000-000000000001',target='10000000-0000-4000-8000-000000000002',requestId='10000000-0000-4000-8000-000000000003';
const command={action:'add_client',requestId,email:' Client+pilot@Example.com ',displayName:' Client Example '};
test('admission accepts one explicit intent and preserves email aliases',()=>{
 assert.ok(contract,'Admission command contract is implemented');
 assert.deepEqual(contract.parseAdmissionCommand(command),{...command,email:'client+pilot@example.com',displayName:'Client Example'});
 for(const extra of [{clientId:target},{sendEmail:true},{emailConfirmed:true},{role:'founder'},{password:'never'}])assert.throws(()=>contract.parseAdmissionCommand({...command,...extra}),/invalid_input/);
 for(const email of ['a@localhost','a\n@example.com','a@@example.com',''])assert.throws(()=>contract.parseAdmissionCommand({...command,email}),/invalid_input/);
 assert.deepEqual(contract.parseAdmissionCommand({action:'capabilities'}),{action:'capabilities'});
});
function fixture(){
 const events:string[]=[];let created=false,finished=false,permitted=true,failAfterCreate=false;
 const receipt={requestId,status:'admitted',clientId:target,displayName:'Client Example',email:'client+pilot@example.com',emailSent:false,portalUrl:'https://portal.goshelv.com/'};
 const ports={allowedOrigins:['https://portal.goshelv.com'],authenticate:async()=>({id:actor,is_anonymous:false}),
  rpc:async(_token:string,name:string)=>{events.push(name);if(!permitted)throw Error('concierge_admission_forbidden');if(name==='concierge_admission_capabilities')return{canAddClient:true};if(name==='concierge_admission_status')return{requestId,status:finished?'ready':'pending',client:finished?receipt:null};return finished?{state:'complete',receipt}:{state:created?'identity_ready':'needs_identity',targetId:target,email:receipt.email};},
  getIdentity:async(id:string)=>{events.push('admin_get');assert.equal(id,target);return created?{id:target,email:receipt.email,is_anonymous:false}:null;},
  createIdentity:async(id:string,email:string)=>{events.push('admin_create');assert.equal(id,target);assert.equal(email,receipt.email);created=true;if(failAfterCreate)throw Error('unavailable');return{id:target,email,is_anonymous:false};},
  finish:async(id:string,request:string)=>{events.push('finalize');assert.equal(id,actor);assert.equal(request,requestId);if(!permitted)throw Error('concierge_admission_forbidden');finished=true;return receipt;}};
 return{ports,events,revoke:()=>{permitted=false;},loseCreateReply:()=>{failAfterCreate=true;},receipt};
}
const request=(body:unknown,token='actor-jwt')=>new Request('https://edge.invalid/concierge-admission',{method:'POST',headers:{authorization:'Bearer '+token,origin:'https://portal.goshelv.com','content-type':'application/json'},body:JSON.stringify(body)});
test('admission creates a stable identity and finalizes with no email side effect',async()=>{
 assert.ok(endpoint,'Admission endpoint is implemented');const f=fixture();const response=await endpoint.handleAdmissionRequest(request(command),f.ports);
 assert.equal(response.status,200);assert.deepEqual(await response.json(),f.receipt);assert.deepEqual(f.events,['concierge_admission_begin','admin_get','admin_create','finalize']);
 const replay=await endpoint.handleAdmissionRequest(request(command),f.ports);assert.equal(replay.status,200);assert.equal(f.events.filter(x=>x==='admin_create').length,1);
});
test('lost Auth-create reply resumes the reserved UUID and never recreates or deletes',async()=>{
 assert.ok(endpoint);const f=fixture();f.loseCreateReply();assert.equal((await endpoint.handleAdmissionRequest(request(command),f.ports)).status,503);
 const resumed=await endpoint.handleAdmissionRequest(request(command),f.ports);assert.equal(resumed.status,200);assert.equal(f.events.filter(x=>x==='admin_create').length,1);assert.ok(!f.events.some(x=>x.includes('delete')));
});
test('fresh capability denial is checked before administrative lookup and replay',async()=>{
 assert.ok(endpoint);const f=fixture();f.revoke();const denied=await endpoint.handleAdmissionRequest(request(command),f.ports);assert.equal(denied.status,403);assert.deepEqual(f.events,['concierge_admission_begin']);
});
test('unknown keys and missing bearer never reach administrative work',async()=>{
 assert.ok(endpoint);const f=fixture();assert.equal((await endpoint.handleAdmissionRequest(request({...command,sendEmail:true}),f.ports)).status,400);assert.equal(f.events.length,0);
 const noBearer=new Request('https://edge.invalid/concierge-admission',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(command)});assert.equal((await endpoint.handleAdmissionRequest(noBearer,f.ports)).status,401);
});
test('an unverified upstream receipt is an unavailable result, never caller validation or success',async()=>{
 assert.ok(endpoint);const f=fixture();f.ports.finish=async()=>({...f.receipt,emailSent:true});
 const response=await endpoint.handleAdmissionRequest(request(command),f.ports);assert.equal(response.status,503);assert.deepEqual(await response.json(),{code:'unavailable'});
});
