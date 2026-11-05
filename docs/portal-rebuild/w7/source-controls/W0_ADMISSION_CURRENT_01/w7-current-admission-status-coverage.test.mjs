// Actual admitted feature controller + actual Root ports/session; finite HTTP.
import test from 'node:test';import assert from 'node:assert/strict';
import {createApplicationSession} from '../src/app/session.ts';
import {createAdvisorAdmissionPorts} from '../src/app/advisor-admission-request.ts';
import {createAdvisorAdmissionController} from '../src/features/advisor/admission/controller.ts';
async function fixture(t){
 const actor='11111111-1111-4111-8111-111111111111',client='22222222-2222-4222-8222-222222222222';
 let cap=true,addStatus=200,statusCode=200;const calls=[];
 const login={signedIn:true,ownerId:actor,generation:1,csrf:'SYNTHETIC-composed-admission',capabilities:{view:true,edit:false,publish:false,confirmPayments:false},idleExpiresAt:'2099-01-01',absoluteExpiresAt:'2099-01-02'};
 const runtime=createApplicationSession({audience:'advisor',locks:{request:async(_n,o,run)=>run(o.signal)},fetcher:async(url,init)=>{
  if(url==='/api/advisor/session')return Response.json(login);
  assert.equal(url,'/api/advisor/admission');const c=JSON.parse(init.body);calls.push(c);
  if(c.action==='capabilities')return Response.json({canAddClient:cap});
  if(c.action==='add_client')return addStatus===200?Response.json({requestId:c.requestId,status:'admitted',clientId:client,displayName:c.displayName,email:c.email,emailSent:false,portalUrl:'https://portal.goshelv.com/'}):Response.json({code:addStatus===409?'concierge_admission_conflict':'unavailable'},{status:addStatus});
  assert.equal(c.action,'admission_status');return statusCode===404?Response.json({code:'concierge_admission_not_found'},{status:404}):Response.json({requestId:c.requestId,status:'pending',client:null});
 }});await runtime.restore();const controller=createAdvisorAdmissionController({runtime,ports:createAdvisorAdmissionPorts(runtime)});t.after(()=>{controller.dispose();runtime.dispose();});
 return{runtime,controller,calls,mode(values){if('cap'in values)cap=values.cap;if('add'in values)addStatus=values.add;if('status'in values)statusCode=values.status;}};
}
async function prepared(f){await f.controller.refreshCapabilities();f.controller.editFields({email:'synthetic@example.invalid',displayName:'Synthetic Client'});f.controller.prepare();assert.ok(f.controller.getSnapshot().confirmation);}
test('actual VIEW-only consumer uses real capability and canonical mapped acknowledgement',async t=>{
 const f=await fixture(t);await prepared(f);await f.controller.confirm();const state=f.controller.getSnapshot();assert.equal(state.receipt.email,'synthetic@example.invalid');assert.equal(state.pending,null);assert.equal(f.runtime.cookie._view.capabilities.edit,false);
});
test('actual false capability leaves Add unavailable despite a live session',async t=>{
 const f=await fixture(t);f.mode({cap:false});await f.controller.refreshCapabilities();f.controller.editFields({email:'synthetic@example.invalid',displayName:'Synthetic Client'});f.controller.prepare();await f.controller.confirm();assert.equal(f.controller.getSnapshot().confirmation,null);assert.deepEqual(f.calls.map(c=>c.action),['capabilities']);
});
test('canonical conflict plus same-original status not-found enables only deliberate correction',async t=>{
 const f=await fixture(t);await prepared(f);f.mode({add:409,status:404});await f.controller.confirm();const original=f.controller.getSnapshot().pending;assert.ok(original);await f.controller.checkStatus();
 assert.equal(f.controller.getSnapshot().recovery,'rejected_no_intent');assert.deepEqual(f.controller.getSnapshot().pending,original);f.controller.correctDetails();assert.equal(f.controller.getSnapshot().pending,null);assert.equal(f.controller.getSnapshot().fields.email,original.email);
});
test('uncertain add plus bare absence cannot discard the original through actual ports',async t=>{
 const f=await fixture(t);await prepared(f);f.mode({add:503,status:404});await f.controller.confirm();const original=f.controller.getSnapshot().pending;assert.ok(original);await f.controller.checkConnection();await f.controller.checkStatus();f.controller.correctDetails();
 assert.deepEqual(f.controller.getSnapshot().pending,original);assert.notEqual(f.controller.getSnapshot().recovery,'rejected_no_intent');assert.equal(f.calls.filter(c=>c.action==='add_client').length,1);
});

test('the uncertainty/absence integration case actually invokes its same-original status read',async t=>{
 const f=await fixture(t);await prepared(f);f.mode({add:503,status:404});await f.controller.confirm();const original=f.controller.getSnapshot().pending;assert.ok(original);
 await f.controller.checkConnection();await f.controller.checkStatus();f.controller.correctDetails();
 assert.deepEqual(f.controller.getSnapshot().pending,original);
 assert.equal(f.calls.filter(c=>c.action==='admission_status'&&c.requestId===original.requestId).length,1,'the claimed404 branch must be exercised through the actual adapter');
});
