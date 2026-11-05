import test from 'node:test';
import assert from 'node:assert/strict';
import {createApplicationSession} from '../src/app/session.ts';
import {TransportError} from '../src/transport/session.ts';

const api=await import('../src/app/final-export-request.ts').catch(error=>{
  if(error.code!=='ERR_MODULE_NOT_FOUND')throw error;
  return {};
});
const actor='11111111-1111-4111-8111-111111111111';
const manifest=()=>({schemaVersion:1,action:'read_final_export_manifest_v1'});
const part=()=>({schemaVersion:1,action:'read_final_export_part_v1',basis:{
  supportEndsOn:'2026-11-01',supportEndsAt:'2026-11-01T05:00:00.000000Z',
  readOnlyEndsOn:'2026-12-01',readOnlyEndsAt:'2026-12-01T06:00:00.000000Z',
  publication:{version:2,documentSchemaVersion:3},publishedAt:'2026-10-01T12:00:00.000000Z',
  hashProfile:'shelv.final-export.folded-sha256.v1',selectionHash:'a'.repeat(64),unitCount:1,instructionCount:0,
},partIndex:{unitIndex:0,segmentIndex:0}});

async function fixture(t,{audience='client',restore=true,view=true}={}){
  let login={signedIn:true,ownerId:actor,generation:1,csrf:'SYNTHETIC-export-request',
    capabilities:{view,edit:false,publish:false,confirmPayments:false},
    idleExpiresAt:'2099-01-01',absoluteExpiresAt:'2099-01-02'};
  const calls=[];
  const runtime=createApplicationSession({audience,locks:{request:async(_name,options,run)=>run(options.signal)},
    fetcher:async(url,init)=>{
      calls.push(url);
      assert.equal(url,`/api/${audience}/session`,'all non-session HTTP is forbidden');
      assert.equal(init.credentials,'same-origin');
      assert.equal(init.cache,'no-store');
      assert.equal(new Headers(init.headers).has('authorization'),false);
      return Response.json(login);
    }});
  t.after(()=>runtime.dispose());
  if(restore)await runtime.restore();
  return{runtime,calls,create:()=>api.createClientFinalExportRequest(runtime),
    update(patch){login={...login,...patch};}};
}
const status=(expected)=>(error)=>error instanceof TransportError&&error.status===expected&&error.outcome!=='uncertain';

test('shared final-export request factory is available',()=>{
  assert.equal(typeof api.createClientFinalExportRequest,'function');
});
test('actual request exposes only execute and leaves namespace unregistered',async t=>{
  const f=await fixture(t),port=f.create();
  assert.deepEqual(Object.keys(port),['execute']);
  assert.equal(Object.hasOwn(f.runtime.cookie.actions,'final-export'),false);
  assert.deepEqual(f.calls,['/api/client/session']);
});
for(const [name,command] of [['manifest',manifest],['part',part]]){
  test(`valid ${name} remains unavailable with no export egress`,async t=>{
    const f=await fixture(t);
    await assert.rejects(f.create().execute(command()),status(503));
    assert.equal(f.runtime.cookie.status,'ready');
    assert.equal(Object.hasOwn(f.runtime.cookie.actions,'final-export'),false);
    assert.deepEqual(f.calls,['/api/client/session']);
  });
}
for(const key of ['clientId','ownerId','role','rpc','url','activeCare']){
  test(`caller ${key} selector is rejected before the unregistered factory`,async t=>{
    const f=await fixture(t);
    await assert.rejects(f.create().execute({...manifest(),[key]:'caller-selected'}),status(400));
    assert.equal(f.runtime.cookie.status,'ready');assert.equal(f.calls.length,1);
  });
}
for(const action of ['publish_plan_v1','read_client_plan_v3','write_final_export_v1']){
  test(`unsupported ${action} is not an export read`,async t=>{
    const f=await fixture(t);
    await assert.rejects(f.create().execute({schemaVersion:1,action}),status(400));
    assert.equal(f.calls.length,1);
  });
}
test('an unrestored runtime cannot create the binding',async t=>{
  const f=await fixture(t,{restore:false});assert.throws(()=>f.create(),status(401));assert.equal(f.calls.length,0);
});
test('the actual advisor runtime cannot create an own-client binding',async t=>{
  const f=await fixture(t,{audience:'advisor'});assert.throws(()=>f.create(),status(401));assert.equal(f.calls.length,1);
});
test('the retained SDK rejects a no-view client lease before binding',async t=>{
  const f=await fixture(t,{view:false,restore:false});
  await assert.rejects(f.runtime.restore(),error=>error.status===503);
  assert.throws(()=>f.create(),status(401));assert.equal(f.calls.length,1);
});
test('permanent disposal retires the creation-bound request',async t=>{
  const f=await fixture(t),port=f.create();f.runtime.dispose();
  await assert.rejects(port.execute(manifest()),status(401));assert.equal(f.calls.length,1);
});
test('offline suspension is unavailable rather than an export grant',async t=>{
  const f=await fixture(t),port=f.create();f.runtime.cookie.suspend();
  await assert.rejects(port.execute(manifest()),status(503));assert.equal(f.calls.length,1);
});
for(const replacement of [{ownerId:'22222222-2222-4222-8222-222222222222'},{generation:2},{csrf:'SYNTHETIC-new-csrf'}]){
  test(`actual restoration replacement ${Object.keys(replacement)[0]} retires the old port`,async t=>{
    const f=await fixture(t),port=f.create();f.update(replacement);await f.runtime.restore();
    await assert.rejects(port.execute(manifest()),status(401));
    await assert.rejects(f.create().execute(manifest()),status(503));assert.equal(f.calls.length,2);
  });
}
test('a pre-aborted native signal denies without suspending the session',async t=>{
  const f=await fixture(t),abort=new AbortController();abort.abort();
  await assert.rejects(f.create().execute(manifest(),{signal:abort.signal}),status(503));
  assert.equal(f.runtime.cookie.status,'ready');assert.equal(f.calls.length,1);
});
test('local false and throwing applicability cannot grant or forge a denial',async t=>{
  const f=await fixture(t),port=f.create();
  for(const isApplicable of [()=>false,()=>{throw new TransportError(401);},()=>Promise.resolve(true)]){
    await assert.rejects(port.execute(manifest(),{isApplicable}),status(503));
  }
  assert.equal(f.runtime.cookie.status,'ready');assert.equal(f.calls.length,1);
});
test('signal getter suspension is fenced before later option access',async t=>{
  const f=await fixture(t);let later=0;
  const options={get signal(){f.runtime.cookie.suspend();return new AbortController().signal;},
    get isApplicable(){later++;return()=>true;}};
  await assert.rejects(f.create().execute(manifest(),options),status(503));assert.equal(later,0);assert.equal(f.calls.length,1);
});
test('applicability getter disposal is fenced',async t=>{
  const f=await fixture(t),port=f.create();
  await assert.rejects(port.execute(manifest(),{get isApplicable(){f.runtime.dispose();return()=>true;}}),status(401));
  assert.equal(f.calls.length,1);
});
for(const kind of ['suspend','dispose','abort']){
  test(`applicability ${kind} is rechecked even when callback returns true`,async t=>{
    const f=await fixture(t),port=f.create(),abort=new AbortController();
    await assert.rejects(port.execute(manifest(),{signal:abort.signal,isApplicable(){
      if(kind==='abort')abort.abort();else if(kind==='suspend')f.runtime.cookie.suspend();else f.runtime.dispose();
      return true;
    }}),status(kind==='dispose'?401:503));assert.equal(f.calls.length,1);
  });
}
test('command accessors are rejected without evaluation',async t=>{
  const f=await fixture(t);let read=0;const command={action:'read_final_export_manifest_v1',get schemaVersion(){read++;return 1;}};
  await assert.rejects(f.create().execute(command),status(400));assert.equal(read,0);assert.equal(f.calls.length,1);
});
test('descriptor-clone retirement cannot reach the retained factory',async t=>{
  const f=await fixture(t),port=f.create();const command=new Proxy(manifest(),{ownKeys(target){f.runtime.dispose();return Reflect.ownKeys(target);}});
  await assert.rejects(port.execute(command),status(401));assert.equal(f.calls.length,1);
});
test('a local descriptor exception cannot manufacture a session denial',async t=>{
  const f=await fixture(t),port=f.create();
  const command=new Proxy(manifest(),{getOwnPropertyDescriptor(){throw new TransportError(401);}});
  await assert.rejects(port.execute(command),status(400));assert.equal(f.runtime.cookie.status,'ready');assert.equal(f.calls.length,1);
});
test('the existing UTF8 command budget is enforced before dispatch',async t=>{
  const f=await fixture(t);
  await assert.rejects(f.create().execute({...manifest(),extra:'x'.repeat(100000)}),status(413));assert.equal(f.calls.length,1);
});
