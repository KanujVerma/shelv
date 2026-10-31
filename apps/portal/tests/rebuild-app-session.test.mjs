import test from 'node:test';
import assert from 'node:assert/strict';
const api=await import('../src/app/session.ts').catch(()=>({}));
const boot=await import('../src/app/bootstrap.ts').catch(()=>({}));
const owner='10000000-0000-4000-8000-000000000004';
const locks={request:async(_,o,run)=>run(o.signal)};
function fixture(audience='client') {
  let now=Date.parse('2026-10-30T12:00:00Z'),csrf='synthetic-csrf',status=200;
  const calls=[];
  const runtime=api.createApplicationSession({audience,now:()=>now,locks,fetcher:async(url,options)=>{
    calls.push({url,options});assert.equal(url,`/api/${audience}/session`);
    return Response.json({signedIn:true,ownerId:owner,generation:7,capabilities:{view:true,edit:true,publish:true,confirmPayments:false},csrf,idleExpiresAt:'2026-10-30T12:10:00Z',absoluteExpiresAt:'2026-10-30T13:00:00Z'},{status});
  }});
  return {runtime,calls,expire(){now=Date.parse('2026-10-30T12:11:00Z');},relogin(){csrf='new-synthetic-csrf';},offline(){status=503;}};
}
test('application session seam exists',()=>assert.equal(typeof api.createApplicationSession,'function'));
test('callback scrubbing precedes route selection, history, cookie initialization and rendering',()=>{
  assert.equal(typeof boot.prepareApplication,'function');
  const location={href:'https://portal.invalid/advisor/plans?code=synthetic-secret#access_token=other-secret'};
  const events=[],history={replaceState(state,_,path){events.push([state,path]);location.href='https://portal.invalid'+path;}};
  const result=boot.prepareApplication(location,history);
  assert.deepEqual(events,[[null,'/advisor/plans']]);assert.equal(result.audience,'advisor');assert.equal(result.callback.error,true);
  assert.equal(JSON.stringify(result.route).includes('secret'),false);
});
test('public Maya and unknown paths never select a live audience; strict client/advisor grammar',()=>{
  for(const path of ['/maya','/maya?stage=3','/unknown','/advisor/plans?role=owner','/plan?clientId=other']){
    const result=boot.prepareApplication({href:'https://portal.invalid'+path},{replaceState(){}});
    assert.equal(result.audience,null);
  }
  assert.equal(boot.prepareApplication({href:'https://portal.invalid/plan?routine=evening'},{replaceState(){}}).audience,'client');
});
test('actual cookie lease captures owner/audience/epoch; same-owner login replaces private boundary',async()=>{
  const f=fixture();try{await f.runtime.restore();const first=f.runtime.getSnapshot().boundary;assert.ok(first.isCurrent());first.memory.set('draft','private');let invalidated=0;first.subscribeInvalidation(()=>invalidated++);
    f.relogin();await f.runtime.restore();const second=f.runtime.getSnapshot().boundary;
    assert.notEqual(first.key,second.key);assert.equal(first.isCurrent(),false);assert.equal(first.memory.get('draft'),undefined);assert.equal(invalidated,1);assert.ok(second.isCurrent());
  }finally{f.runtime.dispose();}
});
test('offline 503 retains unexpired manual work without accepting ready results; expiry clears it',async()=>{
 const f=fixture();try{await f.runtime.restore();const b=f.runtime.getSnapshot().boundary;b.memory.set('intent','private');f.offline();await assert.rejects(f.runtime.restore(),e=>e.status===503);assert.equal(b.isCurrent(),true);assert.equal(b.memory.get('intent'),'private');f.expire();assert.equal(b.isCurrent(),false);assert.equal(b.memory.get('intent'),undefined);}finally{f.runtime.dispose();}
});
test('cookie state invalidates transport and private subscribers before React observers',async()=>{
 const f=fixture('advisor');try{await f.runtime.restore();const b=f.runtime.getSnapshot().boundary;b.memory.set('intent','private');let seen;
 f.runtime.subscribe(()=>{if(!f.runtime.getSnapshot().boundary)seen=b.memory.get('intent');});
 f.runtime.cookie._end();assert.equal(b.isCurrent(),false);assert.equal(seen,undefined);
 }finally{f.runtime.dispose();}
});
