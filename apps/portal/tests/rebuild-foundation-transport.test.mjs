import test from 'node:test';
import assert from 'node:assert/strict';
import {createSessionTransport, TransportError} from '../src/transport/session.ts';

const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return{promise,resolve,reject};};
function fixture(){
  const lease={ownerId:'synthetic-a',localEpoch:1,csrf:'test-only-csrf'};
  const session={audience:'client',status:'ready',generation:1,identity:{ownerId:lease.ownerId,role:'client'},async acquire(){return {...lease};},isCurrent(l){return this.status==='ready'&&l.ownerId===this.identity?.ownerId&&l.localEpoch===this.generation;},async signOut(){this.status='signedout';this.identity=null;this.generation++;}};
  return {session};
}

test('late private results are rejected after owner/generation replacement, including same-owner re-login',async()=>{
  for(const nextOwner of ['synthetic-b','synthetic-a']){
    const {session}=fixture(),pending=deferred(),transport=createSessionTransport(session);
    transport.memory.set('unsent',{notes:'synthetic private draft'});
    const port=transport.bind({kind:'read',invoke:()=>pending.promise,decode:v=>v});
    const result=port.execute({});await Promise.resolve();session.generation++;session.identity={ownerId:nextOwner,role:'client'};transport.sessionChanged();pending.resolve({private:'old'});
    await assert.rejects(result,e=>e instanceof TransportError&&e.status===401);
    assert.equal(transport.memory.get('unsent'),undefined);
  }
});

test('logout clears memory/invalidates subscribers before its network request settles',async()=>{
  const {session}=fixture(),pending=deferred();session.signOut=()=>pending.promise;
  const transport=createSessionTransport(session);let invalidated=0;transport.subscribeInvalidation(()=>invalidated++);
  transport.memory.set('unsent','private');const result=transport.signOut();
  assert.equal(transport.memory.get('unsent'),undefined);assert.equal(invalidated,1);
  assert.throws(()=>transport.memory.set('later','private'),e=>e.status===401);
  pending.resolve();await result;
});

test('conflict and interrupted writes preserve session-bound edits and never report success',async()=>{
  for(const status of [409,503]){
    const {session}=fixture(),transport=createSessionTransport(session);transport.memory.set('unsent','synthetic edit');
    const port=transport.bind({kind:'write',invoke:async()=>{throw {status,code:'unsafe private payload here'};},decode:v=>v});
    await assert.rejects(port.execute({requestId:'synthetic-request'}),e=>e.status===status&&e.outcome===(status===503?'uncertain':'rejected')&&!e.message.includes('private'));
    assert.equal(transport.memory.get('unsent'),'synthetic edit');
  }
});

test('expiry/audience fences deny invocation and late errors cannot affect another session',async()=>{
  const {session}=fixture(),transport=createSessionTransport(session);let invoked=0;
  const port=transport.bind({kind:'read',invoke:async()=>{invoked++;return{};},decode:v=>v});
  session.status='signedout';await assert.rejects(port.execute({}),e=>e.status===401);assert.equal(invoked,0);
  session.status='ready';session.audience='advisor';await assert.rejects(port.execute({}),e=>e.status===401);assert.equal(invoked,0);
  session.audience='client';session.identity.role='advisor';await assert.rejects(port.execute({}),e=>e.status===401);assert.equal(invoked,0);
});

test('the retained cookie factory still owns CSRF, no-store and its operation allowlist',async()=>{
  const {CookieClientSession,createClientCookieRequest}=await import('../site/auth/client-cookie-session.js');
  const requests=[];
  const session=new CookieClientSession({locks:{request:async(_,options,run)=>run(options.signal)},fetcher:async(url,options)=>{
    requests.push({url,options});
    return new Response(JSON.stringify(url.endsWith('/session')?{signedIn:true,ownerId:'synthetic-a',generation:1,capabilities:{view:true},csrf:'synthetic-csrf',idleExpiresAt:'2099-01-01T00:00:00Z',absoluteExpiresAt:'2099-01-02T00:00:00Z'}:{revision:2}),{status:200,headers:{'Content-Type':'application/json'}});
  }});
  try {
    await session.restore();const transport=createSessionTransport(session);
    const port=transport.bindCookieChannel(createClientCookieRequest,'operations','read',v=>{assert.equal(typeof v.revision,'number');return v;});
    assert.deepEqual(await port.execute({action:'client_read_v2'}),{revision:2});
    const operation=requests.at(-1);assert.equal(operation.url,'/api/client/operations');
    assert.equal(operation.options.headers['X-Shelv-CSRF'],'synthetic-csrf');assert.equal(operation.options.credentials,'same-origin');
    assert.equal(operation.options.cache,'no-store');assert.equal(operation.options.redirect,'error');
    await assert.rejects(port.execute({action:'invented_publish'}),e=>e.status===403);assert.equal(requests.length,2);
    transport.dispose();
  } finally {session.dispose();}
});

test('demo operations are explicitly memory-only and have no cookie channel',async()=>{
  const {createDemoPort}=await import('../src/transport/session.ts');
  const port=createDemoPort(input=>({selection:input.selection}));
  assert.equal(port.mode,'public-demo');assert.deepEqual(await port.execute({selection:'later'}),{selection:'later'});
});
