import test from 'node:test';
import assert from 'node:assert/strict';
import {createApplicationSession} from '../src/app/session.ts';
import {CookieSessionError} from '../site/auth/advisor-cookie-session.js';
const api=await import('../src/app/advisor-admission-request.ts').catch(e=>{if(e.code!=='ERR_MODULE_NOT_FOUND')throw e;return {};});
test('actual-runtime fixed admission ports exist',()=>{assert.equal(typeof api.createAdvisorAdmissionPorts,'function');});
const actor='11111111-1111-4111-8111-111111111111',client='22222222-2222-4222-8222-222222222222',requestId='77777777-7777-4777-8777-777777777777';
const add=()=>({action:'add_client',requestId,email:'Synthetic@Example.invalid',displayName:' Synthetic Client '});
const receipt=(status='admitted')=>({requestId,status,clientId:client,email:'synthetic@example.invalid',displayName:status==='already_admitted'?'Existing Name':'Synthetic Client',emailSent:false,portalUrl:'https://portal.goshelv.com/'});
const gate=()=>{let enter,release;return{entered:new Promise(r=>enter=r),promise:new Promise(r=>release=r),enter:()=>enter(),release:()=>release()};};
async function fixture(t,{audience='advisor',restore=true}={}){
 let login={signedIn:true,ownerId:actor,generation:1,csrf:'SYNTHETIC-admission',capabilities:{view:true,edit:true,publish:false,confirmPayments:false},idleExpiresAt:'2099-01-01',absoluteExpiresAt:'2099-01-02'};
 let respond=c=>Response.json(c.action==='capabilities'?{canAddClient:false}:c.action==='add_client'?receipt():{requestId,status:'ready',client:receipt()});const calls=[];
 const runtime=createApplicationSession({audience,locks:{request:async(_n,o,run)=>run(o.signal)},fetcher:async(url,init)=>{
  assert.equal(init.credentials,'same-origin');assert.equal(init.cache,'no-store');assert.equal(init.redirect,'error');assert.equal(new Headers(init.headers).has('authorization'),false);
  if(url===`/api/${audience}/session`)return Response.json(login);
  assert.equal(url,`/api/${audience}/admission`,'unexpected HTTP refused');assert.equal(new Headers(init.headers).get('X-Shelv-CSRF'),login.csrf);const command=JSON.parse(init.body);calls.push(command);return respond(command);
 }});if(restore)await runtime.restore();t.after(()=>runtime.dispose());return{runtime,calls,create:()=>api.createAdvisorAdmissionPorts(runtime),reply(fn){respond=fn;},login(value){login={...login,...value};}};
}
test('three fixed ports read the actual capability without inferring it from edit',async t=>{
 const f=await fixture(t),p=f.create();assert.deepEqual(Object.keys(p).sort(),['add','capabilities','status']);assert.deepEqual(await p.capabilities.execute({action:'capabilities'}),{canAddClient:false});
 assert.equal(f.runtime.cookie._view.capabilities.edit,true);assert.deepEqual(f.calls,[{action:'capabilities'}]);
});
test('add detaches and canonicalizes the original command and maps its correlated receipt',async t=>{
 const f=await fixture(t),c=add(),pending=f.create().add.execute(c);c.email='other@example.invalid';c.requestId=actor;assert.deepEqual(await pending,receipt());
 assert.deepEqual(f.calls,[{action:'add_client',requestId,email:'synthetic@example.invalid',displayName:'Synthetic Client'}]);
});
test('already-admitted acknowledgement preserves its actual existing name',async t=>{
 const f=await fixture(t);f.reply(()=>Response.json(receipt('already_admitted')));assert.equal((await f.create().add.execute(add())).displayName,'Existing Name');
});
test('status binds both the wrapper request and the ready inner receipt',async t=>{
 const f=await fixture(t),p=f.create();assert.deepEqual(await p.status.execute({action:'admission_status',requestId}),{requestId,status:'ready',client:receipt()});
 f.reply(()=>Response.json({requestId,status:'pending',client:null}));assert.deepEqual(await p.status.execute({action:'admission_status',requestId}),{requestId,status:'pending',client:null});
});
for(const [status,code,port,command] of [[409,'concierge_admission_conflict','add',add()],[404,'concierge_admission_not_found','status',{action:'admission_status',requestId}]])test('actual fixed HTTP'+status+' retains its finite '+code+' code',async t=>{
 const f=await fixture(t);f.reply(()=>Response.json({code},{status}));await assert.rejects(f.create()[port].execute(command),e=>e.status===status&&e.code===code);assert.equal(f.calls.length,1);
});
test('wrong status/code pairs and bare status cannot manufacture definitive recovery codes',async t=>{
 const f=await fixture(t),p=f.create();for(const body of [{code:'concierge_admission_not_found'},{code:'other_conflict'},{}]){f.reply(()=>Response.json(body,{status:409}));await assert.rejects(p.add.execute(add()),e=>e.status===409&&e.code===undefined);}
});
test('malformed success is unavailable rather than a fabricated conflict',async t=>{
 const f=await fixture(t);f.reply(()=>Response.json({code:'concierge_admission_conflict'}));await assert.rejects(f.create().add.execute(add()),e=>e.status===503&&e.code===undefined);
});
test('local callback errors with matching fields cannot become an HTTP conflict',async t=>{
 const f=await fixture(t);await assert.rejects(f.create().add.execute(add(),{isApplicable(){throw new CookieSessionError(409,'concierge_admission_conflict');}}),e=>e.status===503&&e.code===undefined);assert.equal(f.calls.length,0);
});
test('selectors and wrong-port actions are refused before egress',async t=>{
 const f=await fixture(t),p=f.create();for(const c of [{...add(),clientId:client},{...add(),rpc:'anything'},{...add(),actorId:actor}])await assert.rejects(p.add.execute(c),e=>e.status===400);
 await assert.rejects(p.add.execute({action:'capabilities'}),e=>e.status===400);assert.equal(f.calls.length,0);
});
test('an actual client runtime cannot use admission ports',async t=>{
 const f=await fixture(t,{audience:'client'});await assert.rejects(f.create().capabilities.execute({action:'capabilities'}),e=>e.status===401);assert.equal(f.calls.length,0);
});
test('wrong-email or foreign-request acknowledgements are refused',async t=>{
 const f=await fixture(t),p=f.create();for(const c of [{...receipt(),requestId:actor},{...receipt(),email:'other@example.invalid'},{...receipt(),displayName:'Wrong Name'}]){f.reply(()=>Response.json(c));await assert.rejects(p.add.execute(add()),e=>e.status===503);}
});
test('pending status cannot smuggle a receipt and ready status cannot have mismatched request',async t=>{
 const f=await fixture(t),p=f.create();for(const c of [{requestId,status:'pending',client:receipt()},{requestId:actor,status:'ready',client:receipt()},{requestId,status:'ready',client:{...receipt(),requestId:actor}}]){f.reply(()=>Response.json(c));await assert.rejects(p.status.execute({action:'admission_status',requestId}),e=>e.status===503);}
});
test('option getter suspension cannot be a positive READY signal',async t=>{
 const f=await fixture(t);await assert.rejects(f.create().capabilities.execute({action:'capabilities'},{get isApplicable(){f.runtime.cookie.suspend();return()=>true;}}),e=>e.status===503);assert.equal(f.calls.length,0);
});
test('pre-aborted add remains undispatched',async t=>{
 const f=await fixture(t),abort=new AbortController();abort.abort();await assert.rejects(f.create().add.execute(add(),{signal:abort.signal}),e=>e.status===503);assert.equal(f.calls.length,0);
});
test('a late actor replacement cannot return capability or attach a recovery code',async t=>{
 const f=await fixture(t),p=f.create(),held=gate();f.reply(async()=>{held.enter();await held.promise;return Response.json({code:'concierge_admission_conflict'},{status:409});});
 const adding=p.add.execute(add());await held.entered;f.login({ownerId:client});await f.runtime.restore();held.release();await assert.rejects(adding,e=>e.status===401&&e.code===undefined);
});
test('post-response local denial cannot acquire a definitive HTTP code',async t=>{
 const f=await fixture(t);let returned=false;f.reply(()=>{returned=true;return Response.json({code:'concierge_admission_conflict'},{status:409});});
 await assert.rejects(f.create().add.execute(add(),{isApplicable:()=>!returned}),e=>e.status===503&&e.code===undefined);
});
test('a separate admission capability can be true for an actual VIEW-only session',async t=>{
 const f=await fixture(t);f.login({capabilities:{view:true,edit:false,publish:false,confirmPayments:false}});await f.runtime.restore();f.reply(()=>Response.json({canAddClient:true}));
 assert.deepEqual(await f.create().capabilities.execute({action:'capabilities'}),{canAddClient:true});assert.equal(f.runtime.cookie._view.capabilities.edit,false);
});
for(const status of [401,403])test('actual admission HTTP'+status+' preserves current denial',async t=>{
 const f=await fixture(t);f.reply(()=>Response.json({code:status===401?'concierge_admission_session_ended':'concierge_admission_forbidden'},{status}));
 await assert.rejects(f.create().capabilities.execute({action:'capabilities'}),e=>e.status===status);assert.equal(f.calls.length,1);
});
test('ports captured without an actual boundary cannot adopt a later login',async t=>{
 const f=await fixture(t,{restore:false}),p=f.create();await f.runtime.restore();await assert.rejects(p.capabilities.execute({action:'capabilities'}),e=>e.status===401);assert.equal(f.calls.length,0);
});
