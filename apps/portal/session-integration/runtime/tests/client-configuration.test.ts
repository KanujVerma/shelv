import test from 'node:test';
import assert from 'node:assert/strict';
import {Miniflare,convertV4MiniflareOptions} from 'miniflare';
import gateway from '../server/gateway';
import {buildCandidate} from '../scripts/build.mjs';
import {ClientProvider} from '../server/client-upstream';
const origin='https://portal.goshelv.com';
const key=Buffer.alloc(32,31).toString('base64url'); // Fixed synthetic bytes; no file or hosted secret is read.
const valid={PORTAL_ORIGIN:origin,SUPABASE_PUBLIC_KEY:'sb_publishable_synthetic',ADVISOR_SESSION_KEYS:JSON.stringify({active:'fixture',keys:{fixture:key}}),SESSION_IDLE_SECONDS:'3600',SESSION_ABSOLUTE_SECONDS:'28800',SESSION_FLOW_SECONDS:'600',CLIENT_SHARED_SESSIONS:'true',CLIENT_REMEMBER_IDLE_SECONDS:'604800',CLIENT_REMEMBER_ABSOLUTE_SECONDS:'2592000'};

test('original client workerd distinguishes runtime config gates from lazy key-ring validation without provider calls',async()=>{
 await buildCandidate();
 const cases=[
  {label:'valid',change:{},expected:'valid'},
  {label:'client-disabled',change:{CLIENT_SHARED_SESSIONS:'false'},expected:'gate'},
  {label:'wrong-origin',change:{PORTAL_ORIGIN:'https://wrong.example'},expected:'gate'},
  {label:'missing-secret',change:{ADVISOR_SESSION_KEYS:''},expected:'gate'},
  {label:'invalid-public-key',change:{SUPABASE_PUBLIC_KEY:'synthetic-invalid'},expected:'gate'},
  {label:'invalid-idle',change:{SESSION_IDLE_SECONDS:'03600'},expected:'gate'},
  {label:'invalid-flow',change:{SESSION_FLOW_SECONDS:'901'},expected:'gate'},
  {label:'idle-after-absolute',change:{SESSION_IDLE_SECONDS:'28800',SESSION_ABSOLUTE_SECONDS:'3600'},expected:'gate'},
  {label:'remember-idle-after-absolute',change:{CLIENT_REMEMBER_IDLE_SECONDS:'2592000',CLIENT_REMEMBER_ABSOLUTE_SECONDS:'604800'},expected:'gate'},
  {label:'remember-over-max',change:{CLIENT_REMEMBER_ABSOLUTE_SECONDS:'2592001'},expected:'gate'},
  {label:'invalid-ring-json',change:{ADVISOR_SESSION_KEYS:'synthetic-invalid'},expected:'ring'},
  {label:'ring-active-missing',change:{ADVISOR_SESSION_KEYS:JSON.stringify({active:'missing',keys:{fixture:key}})},expected:'ring'},
  {label:'ring-wrong-length',change:{ADVISOR_SESSION_KEYS:JSON.stringify({active:'fixture',keys:{fixture:Buffer.alloc(31,31).toString('base64url')}})},expected:'ring'},
  {label:'ring-long-key',change:{ADVISOR_SESSION_KEYS:JSON.stringify({active:'fixture',keys:{fixture:Buffer.alloc(33,31).toString('base64url')}})},expected:'ring'},
  {label:'ring-too-many-keys',change:{ADVISOR_SESSION_KEYS:JSON.stringify({active:'fixture0',keys:Object.fromEntries(Array.from({length:6},(_,i)=>[`fixture${i}`,key]))})},expected:'ring'},
  {label:'ring-invalid-id',change:{ADVISOR_SESSION_KEYS:JSON.stringify({active:'invalid id',keys:{'invalid id':key}})},expected:'ring'},
  {label:'ring-invalid-base64',change:{ADVISOR_SESSION_KEYS:JSON.stringify({active:'fixture',keys:{fixture:'*'.repeat(43)}})},expected:'ring'},
 ];
 let outbound=0;
 const workers=cases.map((c,i)=>({name:`config-${i}`,modules:true,scriptPath:'dist/vault/index.js',compatibilityDate:'2026-10-20',compatibilityFlags:['nodejs_compat'],durableObjects:{ADVISOR_SESSIONS:{className:'AdvisorSessionObject',useSQLite:true}},bindings:{...valid,...c.change},outboundService:async()=>{outbound++;throw Error('unexpected synthetic provider request');}}));
 const mf=new Miniflare({...convertV4MiniflareOptions({cf:false,logRequests:false,workers}),telemetry:{enabled:false}});
 try{
  for(const [i,c] of cases.entries()){
   const ns:any=await mf.getDurableObjectNamespace('ADVISOR_SESSIONS',`config-${i}`);
   for(const type of ['limit','flow.bootstrap','session.logout-context']){
    const result=await ns.getByName(`${c.label}:${type}`).invoke({audience:'client',type,...(type==='limit'?{scope:'bootstrap'}:{})});
    if(c.expected==='valid'&&type==='session.logout-context'){assert.equal(result.ok,false,c.label);assert.equal(result.error.status,401,c.label);assert.equal(result.error.code,'session_ended',c.label);}
    else if(c.expected==='valid'||c.expected==='ring'&&type==='limit')assert.equal(result.ok,true,`${c.label}:${type}`);
    else {assert.equal(result.ok,false,`${c.label}:${type}`);assert.equal(result.error.status,503,`${c.label}:${type}`);assert.equal(result.error.code,'configuration_missing',`${c.label}:${type}`);}
   }
  }
  assert.equal(outbound,0);
 }finally{await mf.dispose();}
});

test('client OTP and code exchange make one attempt and preserve uncertainty without resend or sensitive errors',async()=>{
 for(const phase of ['otp','exchange'])for(const failure of [429,500,503,401,403,'timeout']){
  let failing=false,attempts=0;
  const p=new ClientProvider('sb_publishable_synthetic',async(input:any,init:any)=>{
   const url=new URL(String(input));assert.ok(url.pathname.endsWith('/otp')||url.pathname.endsWith('/token'));
   if(!failing){assert.ok(url.pathname.endsWith('/otp'));assert.equal(JSON.parse(init.body).create_user,false);return Response.json({});}
   attempts++;
   if(failure==='timeout')return new Promise((_resolve,reject)=>init.signal.addEventListener('abort',()=>reject(Error('SENSITIVE_EXCEPTION_CANARY')),{once:true}));
   return Response.json({msg:'SENSITIVE_PROVIDER_CANARY'},{status:failure as number});
  },10);
  const storage=phase==='exchange'?await p.requestOtp('synthetic@example.test'):{};failing=true;
  const operation=phase==='exchange'?p.exchange('synthetic-code',storage):p.requestOtp('synthetic@example.test');
  await assert.rejects(operation,(error:any)=>{assert.equal(error.status,failure===401||failure===403?401:503,`${phase}:${failure}`);assert.doesNotMatch(String(error),/SENSITIVE_/);return true;});
  assert.equal(attempts,1,`${phase}:${failure}: no transport retry or duplicate send`);
 }
});

test('gateway configuration failures precede object dispatch and stay generic private no-store',async()=>{
 for(const fault of ['disabled','origin','binding','missing-ip','oversized-ip']){
  let calls=0;const env:any={PORTAL_ORIGIN:origin,CLIENT_SHARED_SESSIONS:'true',ADVISOR_SESSIONS:{getByName:()=>{calls++;throw Error('must not dispatch');}}};
  const headers:any={Origin:origin,'Sec-Fetch-Site':'same-origin','CF-Connecting-IP':'192.0.2.1'};
  if(fault==='disabled')env.CLIENT_SHARED_SESSIONS='false';if(fault==='origin')env.PORTAL_ORIGIN='https://wrong.example';if(fault==='binding')env.ADVISOR_SESSIONS={};if(fault==='missing-ip')delete headers['CF-Connecting-IP'];if(fault==='oversized-ip')headers['CF-Connecting-IP']='a'.repeat(65);
  const response=await gateway.fetch(new Request(origin+'/api/client/session',{headers}),env);
  assert.equal(response.status,503,fault);assert.deepEqual(await response.json(),{code:'configuration_missing'});assert.match(response.headers.get('cache-control')??'',/private, no-store/);assert.equal(response.headers.get('set-cookie'),null);assert.equal(calls,0);
 }
});
