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

async function retainedSession(audience, operation) {
  const {CookieAdvisorSession,createCookieRequest}=await import('../site/auth/advisor-cookie-session.js');
  const {CookieClientSession,createClientCookieRequest}=await import('../site/auth/client-cookie-session.js');
  let now=Date.parse('2026-10-30T12:00:00Z'),ownerId='synthetic-a',csrf='synthetic-csrf';
  const session=new (audience==='client'?CookieClientSession:CookieAdvisorSession)({
    now:()=>now,locks:{request:async(_,options,run)=>run(options.signal)},
    fetcher:async url=>url.endsWith('/session')?Response.json({signedIn:true,ownerId,generation:1,capabilities:{view:true},csrf,idleExpiresAt:'2026-10-30T12:10:00Z',absoluteExpiresAt:'2026-10-30T13:00:00Z'}):operation(),
  });
  await session.restore();
  const transport=createSessionTransport(session);session.onState=()=>transport.sessionChanged();
  transport.memory.set('unsent','synthetic unsent work');
  let decoded=0;
  const port=transport.bindCookieChannel(audience==='client'?createClientCookieRequest:createCookieRequest,'operations','write',value=>{decoded++;return value;});
  return {session,transport,execute:()=>port.execute({action:audience==='client'?'decide':'save_draft_v2'}),get decoded(){return decoded;},
    expire(){now=Date.parse('2026-10-30T13:01:00Z');},
    async replace(sameOwner){ownerId=sameOwner?'synthetic-a':'synthetic-b';csrf='replacement-csrf';await session.restore();},
    close(){transport.dispose();session.dispose();},
  };
}

for(const audience of ['client','advisor']) {
  for(const outage of ['503','network']) test(`retained ${audience} factory ${outage} suspension preserves uncertain writes and unsent memory`,async()=>{
    const f=await retainedSession(audience,()=>{if(outage==='network')throw new TypeError('synthetic network loss');return Response.json({code:'unavailable'},{status:503});});
    try {
      await assert.rejects(f.execute(),error=>error.status===503&&error.outcome==='uncertain');
      assert.equal(f.session.status,'offline');assert.equal(f.transport.memory.get('unsent'),'synthetic unsent work');assert.equal(f.decoded,0);
      await assert.rejects(f.execute(),error=>error.status===503&&error.outcome==='uncertain');
    } finally {f.close();}
  });
  for(const boundary of ['owner','same-owner-login','expiry','logout','audience','epoch']) test(`retained ${audience} factory rejects late results/errors after ${boundary}`,async()=>{
    for(const fails of [false,true]) {
      const pending=deferred(),f=await retainedSession(audience,()=>pending.promise);
      try {
        const result=f.execute();await new Promise(resolve=>setImmediate(resolve));
        if(boundary==='owner'||boundary==='same-owner-login')await f.replace(boundary==='same-owner-login');
        if(boundary==='expiry')f.expire();
        if(boundary==='logout')f.session._end();
        if(boundary==='audience')f.session.audience=audience==='client'?'advisor':'client';
        if(boundary==='epoch')f.session._epoch++;
        if(fails)pending.reject(new TypeError('synthetic network loss'));else pending.resolve(Response.json({revision:2}));
        await assert.rejects(result,error=>error.status===401&&error.outcome==='session-ended');assert.equal(f.decoded,0);
        if(['owner','same-owner-login','logout','audience','expiry'].includes(boundary))assert.equal(f.transport.memory.get('unsent'),undefined);
      } finally {f.close();}
    }
  });
  test(`retained ${audience} suspension cannot conceal an epoch, role or deadline change`,async()=>{
    for(const boundary of ['epoch','role','expiry']) {
      const f=await retainedSession(audience,()=>Response.json({code:'unavailable'},{status:503}));
      try {
        // The factory has checked the ready lease immediately before suspend.
        // These synchronous observer changes precede the wrapper's catch.
        f.session.onState=()=>{if(f.session.status==='offline') {
          if(boundary==='epoch')f.session._epoch++;
          if(boundary==='role')f.session.identity.role='other';
          if(boundary==='expiry')f.expire();
        }f.transport.sessionChanged();};
        await assert.rejects(f.execute(),error=>error.status===401&&error.outcome==='session-ended');assert.equal(f.decoded,0);
      } finally {f.close();}
    }
  });
}

test('offline suspension never permits a successful private result to be decoded',async()=>{
  const f=await retainedSession('client',()=>Response.json({revision:2}));
  try {
    const port=f.transport.bind({kind:'read',invoke:async()=>{f.session.suspend();return {private:'synthetic'};},decode:()=>assert.fail('late private response decoded')});
    await assert.rejects(port.execute({}),error=>error.status===401);
  } finally {f.close();}
});
