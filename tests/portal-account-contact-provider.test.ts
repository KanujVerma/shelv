import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {test} from 'node:test';
import {createAccountContactProvider} from '../apps/portal/session-integration/runtime/server/account-contact-provider.ts';
import {createApplicationSession} from '../apps/portal/src/app/session.ts';
import {clientCookieRequest} from '../apps/portal/src/app/retained.ts';
import type {Credentials} from '../apps/portal/session-integration/runtime/server/credentials.ts';

// No sockets, Auth service, SQL or authority stub: finite synthetic HTTP only.
globalThis.fetch=async()=>{throw Error('global_network_denied');};
const actor='10000000-0000-4000-8000-000000000001',session='10000000-0000-4000-8000-000000000002';
const claims={sub:actor,role:'authenticated',session_id:session,exp:4102444800,email:'jwt@example.invalid'};
const token=`e30.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.synthetic`;
const credentials=():Credentials=>({access_token:token,refresh_token:'synthetic-unused',expires_at:claims.exp,user:{id:actor},providerSessionId:session});
const read={schemaVersion:1,action:'read_account_contact_v1'} as const;
const write={schemaVersion:1,action:'request_account_email_change_v1',requestId:'10000000-0000-4000-8000-000000000003',expectedContactBasis:'a'.repeat(64),email:'new@example.invalid'} as const;
const status={schemaVersion:1,action:'read_account_email_change_request_v1',requestId:write.requestId} as const;
const profile={schemaVersion:1,profileRevision:0,displayName:'Synthetic Client',currentEmail:{state:'known',address:' Canonical@Example.INVALID ',verified:false}};
const auth={id:actor,is_anonymous:false,email:'sdk@example.invalid',new_email:'unproven@example.invalid'};
const json=(value:unknown)=>Response.json(value);
const flush=()=>new Promise<void>(resolve=>setImmediate(resolve));
type Override=(stage:number,url:string,init:RequestInit)=>Response|Promise<Response>|undefined;
function fixture(override?:Override){
  const calls:{url:string;init:RequestInit}[]=[];
  const config={supabaseUrl:'https://project.example.invalid',publicKey:'synthetic-key',allowedOrigins:['https://portal.example.invalid'],fetch:async(input:Parameters<typeof fetch>[0],init:RequestInit={})=>{
    const url=String(input);calls.push({url,init});
    assert.ok(['https://project.example.invalid/auth/v1/user','https://project.example.invalid/rest/v1/rpc/concierge_account_profile_command_v1'].includes(url));
    assert.equal(init.credentials,'omit');assert.equal(init.redirect,'error');assert.equal(init.cache,'no-store');assert.ok(init.signal);
    assert.equal(new Headers(init.headers).get('authorization'),`Bearer ${token}`);assert.equal(new Headers(init.headers).get('apikey'),'synthetic-key');
    if(url.endsWith('/user'))assert.equal(init.method,'GET');
    else{assert.equal(init.method,'POST');assert.deepEqual(JSON.parse(String(init.body)),{p_command:{schemaVersion:1,action:'read_account_profile_v1'}});}
    return await override?.(calls.length,url,init)??json(url.endsWith('/user')?auth:profile);
  }};
  return {provider:createAccountContactProvider(config),calls,config};
}
async function rejects(promise:Promise<unknown>,status:number,code:string){
  await assert.rejects(promise,(e:unknown)=>{assert.ok(e instanceof Error);assert.equal(Reflect.get(e,'status'),status);assert.equal(Reflect.get(e,'code'),code);assert.equal(e.message,code);return true;});
}

test('canonical contact is actual repeated profile projection; JWT/SDK/pending guesses are excluded',async()=>{
  const f=fixture(),result=await f.provider.perform(credentials(),read,new AbortController().signal);
  const pendingEmail={state:'unknown'};
  const contactBasis=createHash('sha256').update(JSON.stringify([1,profile.currentEmail,pendingEmail]),'utf8').digest('hex');
  assert.deepEqual(result,{schemaVersion:1,contactBasis,currentEmail:profile.currentEmail,pendingEmail});
  assert.equal(f.calls.length,5);assert.deepEqual(f.calls.map(x=>x.init.method),['GET','POST','GET','POST','GET']);
  assert.ok(f.calls.every(x=>x.init.signal===f.calls[0].init.signal));assert.ok(Object.isFrozen(result));
  assert.doesNotMatch(JSON.stringify(result),/jwt@|sdk@|unproven@|Synthetic Client|profileRevision/);
});

test('unknown canonical email stays unknown and canonical field insertion order determines stable basis',async()=>{
  for(const currentEmail of [{state:'unknown'},{verified:true,address:'Exact@Example.INVALID',state:'known'}]){
    const f=fixture((_n,url)=>url.includes('/rpc/')?json({...profile,currentEmail}):undefined);
    const result=await f.provider.perform(credentials(),read,new AbortController().signal);assert.ok('currentEmail' in result);
    const canonical=currentEmail.state==='known'?{state:'known',address:currentEmail.address,verified:true}:{state:'unknown'};
    assert.deepEqual(result.currentEmail,canonical);
    assert.equal(result.contactBasis,createHash('sha256').update(JSON.stringify([1,canonical,{state:'unknown'}])).digest('hex'));
  }
});

test('no durable producer means both mutation and original status are unavailable with ZERO HTTP/PUT/send',async()=>{
  const f=fixture();for(const command of [write,status,{...write,expectedContactBasis:'0'.repeat(64)}])await rejects(f.provider.perform(credentials(),command,new AbortController().signal),503,'unavailable');
  assert.equal(f.calls.length,0);
});

test('invalid/oversized/authority commands fail safely before any HTTP operation',async()=>{
  const f=fixture();for(const command of [{...read,clientId:actor},{...write,email:' '+write.email},{...write,email:'x'.repeat(8192)+'@b'},{...read,action:'updateUser'}])await rejects(f.provider.perform(credentials(),command as typeof read,new AbortController().signal),400,'invalid_input');
  assert.equal(f.calls.length,0);
});

test('configuration is fixed and closed; mutating config after construction cannot redirect reads',async()=>{
  for(const supabaseUrl of ['http://project.example.invalid','https://project.example.invalid/path','https://a:b@project.example.invalid'])assert.throws(()=>createAccountContactProvider({supabaseUrl,publicKey:'key',allowedOrigins:[]}));
  const f=fixture();f.config.supabaseUrl='https://foreign.example.invalid';f.config.publicKey='changed';f.config.fetch=async()=>{throw Error('wrong fetch');};
  await f.provider.perform(credentials(),read,new AbortController().signal);assert.equal(f.calls.length,5);
});

test('canonical email, confirmation or profile drift refuses an earlier private view',async()=>{
  for(const patch of [{currentEmail:{...profile.currentEmail,address:'later@example.invalid'}},{currentEmail:{...profile.currentEmail,verified:true}},{profileRevision:1},{displayName:'Later'}]){
    const f=fixture((n)=>n===4?json({...profile,...patch}):undefined);await rejects(f.provider.perform(credentials(),read,new AbortController().signal),409,'basis_conflict');
  }
});

test('real profile SQL errors remain safe and no missing authority becomes contact unknown',async()=>{
  for(const [message,expected,code] of [['concierge_forbidden',403,'forbidden'],['concierge_session_ended',401,'session_ended'],['concierge_revision_conflict',409,'revision_conflict'],['private SQL detail',503,'unavailable']] as const){
    const f=fixture(n=>n===2?new Response(JSON.stringify({message}),{status:400}):undefined);await rejects(f.provider.perform(credentials(),read,new AbortController().signal),expected,code);
  }
});

test('identity/permanent/session correlation and captured credential ownership must survive every await',async()=>{
  for(const stage of [1,3,5])for(const user of [{...auth,id:session},{...auth,is_anonymous:true}]){
    const f=fixture(n=>n===stage?json(user):undefined);await rejects(f.provider.perform(credentials(),read,new AbortController().signal),403,'forbidden');
  }
  for(const stage of [1,2,3,4,5]){
    const c=credentials(),f=fixture(n=>{if(n===stage)c.providerSessionId='10000000-0000-4000-8000-000000000004';return undefined;});
    await rejects(f.provider.perform(c,read,new AbortController().signal),503,'unavailable');assert.equal(f.calls.length,stage);
  }
  for(const patch of [{providerSessionId:actor},{expires_at:claims.exp-1},{user:{id:session}}]){
    const f=fixture();await rejects(f.provider.perform({...credentials(),...patch},read,new AbortController().signal),403,'forbidden');
  }
});

test('Auth8192 and profile/contact16384 bounds include metadata and never truncate',async()=>{
  for(const authStage of [true,false]){
    const at=authStage?auth:profile,limit=authStage?8192:16384;
    const padding=limit-Buffer.byteLength(JSON.stringify({...at,padding:''}));
    const f=fixture((_n,url)=>url.endsWith('/user')===authStage?json({...at,padding:'x'.repeat(padding+1)}):undefined);
    await rejects(f.provider.perform(credentials(),read,new AbortController().signal),503,'unavailable');
  }
  const padding=8192-Buffer.byteLength(JSON.stringify({...auth,padding:''}));
  await fixture((_n,url)=>url.endsWith('/user')?json({...auth,padding:'x'.repeat(padding)}):undefined).provider.perform(credentials(),read,new AbortController().signal);
  const fixed=Buffer.byteLength(JSON.stringify({...profile,currentEmail:{...profile.currentEmail,address:''}}));
  const address='x'.repeat(16384-fixed),f=fixture((_n,url)=>url.includes('/rpc/')?json({...profile,currentEmail:{...profile.currentEmail,address}}):undefined);
  // A profile at its own cap can exceed the final contact-envelope cap. Refuse,
  // then prove the exact contact boundary using the unchanged canonical email.
  await rejects(f.provider.perform(credentials(),read,new AbortController().signal),503,'unavailable');
  const contactFixed=Buffer.byteLength(JSON.stringify({schemaVersion:1,contactBasis:'0'.repeat(64),currentEmail:{...profile.currentEmail,address:''},pendingEmail:{state:'unknown'}}));
  for(const extra of [0,1]){
    const address='x'.repeat(16384-contactFixed+extra),f=fixture((_n,url)=>url.includes('/rpc/')?json({...profile,currentEmail:{...profile.currentEmail,address}}):undefined);
    if(extra)await rejects(f.provider.perform(credentials(),read,new AbortController().signal),503,'unavailable');
    else assert.equal(Buffer.byteLength(JSON.stringify(await f.provider.perform(credentials(),read,new AbortController().signal))),16384);
  }
});

for(const denial of [401,403] as const)test(`known received ${denial} survives all stages, throwing cleanup and abort`,async()=>{
  for(const stage of [1,2,3,4,5]){
    const ac=new AbortController(),f=fixture(n=>n===stage?new Proxy(new Response(null,{status:denial}),{get(target,key){if(key==='status'){ac.abort();return denial;}if(['body','statusText','headers'].includes(String(key)))throw Error('private');return Reflect.get(target,key,target);}}):undefined);
    await rejects(f.provider.perform(credentials(),read,ac.signal),denial,denial===401?'session_ended':'forbidden');assert.equal(f.calls.length,stage);
  }
});

test('preabort and actual abort at every HTTP stage refuse value and retire late native bodies',async()=>{
  const ac=new AbortController();ac.abort();const initial=fixture();await rejects(initial.provider.perform(credentials(),read,ac.signal),503,'unavailable');assert.equal(initial.calls.length,0);
  for(const stage of [1,2,3,4,5]){
    const ac=new AbortController();let finish!:(r:Response)=>void,entered!:()=>void,cancelled=0;
    const reached=new Promise<void>(resolve=>{entered=resolve;});
    const f=fixture(n=>n===stage?new Promise<Response>(resolve=>{finish=resolve;entered();}):undefined),p=f.provider.perform(credentials(),read,ac.signal);
    await reached;ac.abort();await rejects(p,503,'unavailable');finish(new Response(new ReadableStream({cancel(){cancelled++;}})));await flush();assert.equal(cancelled,1);assert.equal(f.calls.length,stage);
  }
});

test('whole operation has one absolute10s budget across later Auth and stable read',async(t)=>{
  const start=Date.UTC(2026,10,2);t.mock.timers.enable({apis:['Date','setTimeout'],now:start});
  let entered!:()=>void;const reached=new Promise<void>(resolve=>{entered=resolve;});
  const f=fixture(n=>n===3?(entered(),new Promise<Response>(()=>{})):new Promise<Response>(resolve=>setTimeout(()=>resolve(json(n===1?auth:profile)),4000)));
  const p=f.provider.perform(credentials(),read,new AbortController().signal);await flush();t.mock.timers.tick(4000);await flush();t.mock.timers.tick(4000);await reached;assert.equal(f.calls.length,3);
  const refused=rejects(p,503,'unavailable');t.mock.timers.tick(2000);await refused;assert.equal(Date.now(),start+10000);
});

test('absolute deadline equality before timer dispatch retires body at every HTTP stage (AP1)',async(t)=>{
  const start=Date.UTC(2026,10,2);t.mock.timers.enable({apis:['Date','setTimeout'],now:start});
  for(const stage of [1,2,3,4,5]){
    t.mock.timers.setTime(start);let cancelled=0;const f=fixture(n=>{if(n!==stage)return undefined;t.mock.timers.setTime(start+10000);return new Response(new ReadableStream({cancel(){cancelled++;return new Promise<void>(()=>{});}}));});
    await rejects(f.provider.perform(credentials(),read,new AbortController().signal),503,'unavailable');assert.equal(cancelled,1);assert.equal(f.calls.length,stage);
  }
});

test('blocked body read and pending overflow cleanup share the original deadline',async(t)=>{
  t.mock.timers.enable({apis:['Date','setTimeout'],now:Date.UTC(2026,10,2)});
  for(const stage of [1,2,3,4,5])for(const overflow of [false,true]){
    let cancelled=0,entered!:()=>void;const reached=new Promise<void>(resolve=>{entered=resolve;});
    const f=fixture(n=>n===stage?(entered(),new Response(new ReadableStream<Uint8Array>({start(c){if(overflow)c.enqueue(new Uint8Array(16385));},cancel(){cancelled++;return new Promise<void>(()=>{});}}))):undefined);
    const p=f.provider.perform(credentials(),read,new AbortController().signal);await reached;await flush();const refused=rejects(p,503,'unavailable');t.mock.timers.tick(10000);await refused;assert.equal(cancelled,1);
  }
});

test('malformed private profile/Auth bodies and unexpected fields never leak into contact',async()=>{
  for(const stage of [1,2,3,4,5])for(const body of ['private error',new Uint8Array([0xc0,0xaf])]){
    const f=fixture(n=>n===stage?new Response(body):undefined);await rejects(f.provider.perform(credentials(),read,new AbortController().signal),503,'unavailable');
  }
  // Missing actual permanent-user evidence is profile's existing persona denial.
  for(const stage of [1,2,3,4,5]){
    const f=fixture(n=>n===stage?new Response('{"schemaVersion":1}'):undefined);
    await rejects(f.provider.perform(credentials(),read,new AbortController().signal),stage%2?403:503,stage%2?'forbidden':'unavailable');
  }
  const f=fixture(n=>n===2?json({...profile,privateNotes:'private'}):undefined);await rejects(f.provider.perform(credentials(),read,new AbortController().signal),503,'unavailable');
});

test('cleanup reentry/throw/cancel/deadline cannot publish a private success',async(t)=>{
  const start=Date.UTC(2026,10,2);t.mock.timers.enable({apis:['Date','setTimeout'],now:start});
  for(const mode of ['abort','replace','throw','deadline'] as const){
    t.mock.timers.setTime(start);const ac=new AbortController(),c=credentials(),remove=ac.signal.removeEventListener.bind(ac.signal);
    ac.signal.removeEventListener=(...args:Parameters<AbortSignal['removeEventListener']>)=>{remove(...args);if(mode==='abort')ac.abort();if(mode==='replace')c.user={id:session};if(mode==='throw')throw Error('private');if(mode==='deadline')t.mock.timers.setTime(start+10000);};
    await rejects(fixture().provider.perform(c,read,ac.signal),503,'unavailable');
  }
});

function requestLock<T>(name:string,callback:LockGrantedCallback<T>):Promise<Awaited<T>>;
function requestLock<T>(name:string,options:LockOptions,callback:LockGrantedCallback<T>):Promise<Awaited<T>>;
function requestLock<T>(_name:string,options:LockOptions|LockGrantedCallback<T>,callback?:LockGrantedCallback<T>):Promise<Awaited<T>>{
  const run=typeof options==='function'?options:callback;
  if(!run)return Promise.reject(Error('missing lock callback'));
  return Promise.resolve(run(null));
}

test('actual ApplicationSession/cookie/transport still refuses an unregistered namespace after explicit contact registration',async()=>{
  let reads=0,decoded=0;
  const runtime=createApplicationSession({audience:'client',locks:{request:requestLock},fetcher:async(input)=>{
    reads++;assert.equal(input,'/api/client/session');return json({signedIn:true,ownerId:actor,generation:1,csrf:'synthetic-contact',capabilities:{view:true},idleExpiresAt:'2099-01-01',absoluteExpiresAt:'2099-01-02'});
  }});
  try{
    await runtime.restore();const boundary=runtime.getSnapshot().boundary;assert.ok(boundary);
    await assert.rejects(async()=>{
      const port=Reflect.apply(runtime.transport.bindCookieChannel,runtime.transport,[clientCookieRequest,'account-contact-unregistered-control','read',()=>{decoded++;throw Error('must not decode');}]);
      await port.execute(read);
    },(e:unknown)=>{assert.ok(e instanceof Error);assert.equal(e.constructor.name,'CookieSessionError');assert.equal(Reflect.get(e,'status'),403);assert.equal(Reflect.get(e,'code'),'action_forbidden');return true;});
    assert.equal(reads,1);assert.equal(decoded,0);assert.equal(runtime.cookie.status,'ready');assert.equal(runtime.getSnapshot().boundary,boundary);assert.equal(boundary.isCurrent(),true);
  }finally{runtime.dispose();}
});
