// Pure source and finite synthetic HTTP. File handles below are controlled
// in-memory method models, never observed browser filesystem delivery.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createApplicationSession} from '../src/app/session.ts';
import {TransportError} from '../src/transport/session.ts';
import {finalExportFixture, finalExportLegacyFixture, finalExportWire} from '../../../tests/portal-final-export-fixtures.ts';
const load = path => import(path).catch(error => {
  if (error.code === 'ERR_MODULE_NOT_FOUND' && error.url?.includes('final-export')) return {};
  throw error;
});
const requestApi = await load('../src/app/final-export-request.ts');
const clientApi = await load('../src/features/account/final-export/client.ts');
const writerApi = await load('../src/features/account/final-export/writer.ts');
const transferApi = await load('../src/features/account/final-export/transfer.ts');
const controllerApi = await load('../src/features/account/final-export/controller.ts');
function deferred() { let resolve; return {promise:new Promise(r=>resolve=r), resolve:v=>resolve(v)}; }
async function session(t, audience='client') {
  let owner='11111111-1111-4111-8111-111111111111';
  const calls=[];
  const runtime=createApplicationSession({audience, now:()=>Date.parse('2026-11-02T12:00:00Z'), locks:{request:async(_n,_o,run)=>run()}, fetcher:async(url,options)=>{
    calls.push(url); assert.equal(url,`/api/${audience}/session`);
    assert.equal(options.credentials,'same-origin');
    return Response.json({signedIn:true,ownerId:owner,generation:1,csrf:'synthetic-lane6',capabilities:{view:true,edit:false,publish:false,confirmPayments:false},idleExpiresAt:'2026-11-02T12:10:00Z',absoluteExpiresAt:'2026-11-02T13:00:00Z'});
  }});
  await runtime.restore(); t.after(()=>runtime.dispose());
  return {runtime,calls,async switchOwner(){owner='22222222-2222-4222-8222-222222222222';await runtime.restore();}};
}
function fileModel({onWrite,onClose,onAbort,onCreate}={}) {
  const chunks=[],events=[];let writes=0,closes=0,aborts=0;
  const stream={async write(html){writes++;events.push('write');await onWrite?.(html,writes);chunks.push(html);},async close(){closes++;events.push('close');await onClose?.();},async abort(){aborts++;events.push('abort');await onAbort?.();}};
  const handle={async createWritable(){events.push('create');await onCreate?.();return stream;}};
  return {handle,stream,chunks,events,get writes(){return writes;},get closes(){return closes;},get aborts(){return aborts;}};
}
async function transfer(t,options={}) {
  assert.equal(typeof clientApi.captureFinalExportClient,'function','Lane6 client fence is implemented');
  assert.equal(typeof writerApi.createBrowserFinalExportStaging,'function','Lane6 concrete writer adapter is implemented');
  const s=await session(t),client=clientApi.captureFinalExportClient(s.runtime),file=fileModel(options);
  const writer=writerApi.createBrowserFinalExportStaging(file.handle,()=>client.assertReady());
  await writer.open();
  const wire=finalExportWire(options.record??finalExportFixture());
  const run=(read=wire.read)=>transferApi.collectFinalExportToWriter(read,writer,()=>client.assertReady());
  return {...s,client,file,writer,wire,run};
}
test('unsupported actual retained final-export channel fails closed with no export HTTP',async t=>{
  assert.equal(typeof requestApi.createClientFinalExportRequest,'function','actual request seam exists');
  const f=await session(t),port=requestApi.createClientFinalExportRequest(f.runtime);
  await assert.rejects(port.execute({schemaVersion:1,action:'read_final_export_manifest_v1'}),e=>e.status===503);
  assert.deepEqual(f.calls,['/api/client/session']);
});
test('request rejects extra selectors, abort and wrong audience without export HTTP',async t=>{
  assert.equal(typeof requestApi.createClientFinalExportRequest,'function');
  const f=await session(t),p=requestApi.createClientFinalExportRequest(f.runtime);
  await assert.rejects(p.execute({schemaVersion:1,action:'read_final_export_manifest_v1',clientId:'other'}),e=>e.status===400);
  const abort=new AbortController();abort.abort();
  await assert.rejects(p.execute({schemaVersion:1,action:'read_final_export_manifest_v1'},{signal:abort.signal}),e=>e.status===503);
  const a=await session(t,'advisor');
  await assert.rejects(async()=>requestApi.createClientFinalExportRequest(a.runtime).execute({schemaVersion:1,action:'read_final_export_manifest_v1'}),e=>e.status===401);
  assert.equal(f.calls.length,1);assert.equal(a.calls.length,1);
});
for(const [name,record] of [['V3',finalExportFixture],['R2',finalExportLegacyFixture]]) test(`actual ${name} collector/serializer writes sequential HTML and closes only after final manifest`,async t=>{
  const f=await transfer(t,{record:record()});let final=false;
  const receipt=await f.run(async command=>{const value=await f.wire.read(command);if(command.action==='read_final_export_manifest_v1'&&f.wire.requests.length>1)final=true;return value;});
  assert.deepEqual(receipt,{kind:'browser-writer-close-acknowledged'});
  assert.equal(final,true);assert.equal(f.file.closes,1);assert.equal(f.file.aborts,0);
  assert.ok(f.file.chunks.length>=2);assert.ok(f.file.chunks.every(x=>typeof x==='string'));
  const html=f.file.chunks.join('');assert.match(html,/shelv final plan/);assert.match(html,/static final care record/);assert.match(html,/instructions/);assert.match(html,/<\/pre><\/main><\/body><\/html>\n$/);
  assert.equal(f.writer.getDisposition(),'close-acknowledged');
});
for(const kind of ['leaf','root','final','private','pair']) test(`actual collector refuses ${kind} corruption before writer close`,async t=>{
  const f=await transfer(t);let manifests=0;
  await assert.rejects(f.run(async command=>{
    const value=structuredClone(await f.wire.read(command));
    if(command.action==='read_final_export_manifest_v1') {manifests++;if(kind==='root')value.rootHash='f'.repeat(64);if(kind==='final'&&manifests===2)value.totalBytes++;}
    else if(kind==='leaf')value.leafHash='f'.repeat(64);
    else if(kind==='private')value.privateNote='PRIVATE_NEVER_STAGED';
    else if(kind==='pair')value.partIndex.segmentIndex++;
    return value;
  }));
  assert.equal(f.file.closes,0);assert.equal(f.file.aborts,1);assert.ok(!f.file.chunks.join('').includes('PRIVATE_NEVER_STAGED'));
});
test('late received 401 from finite reader prevents completion after staged public bytes',async t=>{
  const f=await transfer(t);let manifests=0;
  await assert.rejects(f.run(async c=>{if(c.action==='read_final_export_manifest_v1'&&++manifests===2)throw new TransportError(401);return f.wire.read(c);}),e=>e.status===401);
  assert.ok(f.file.writes>0);assert.equal(f.file.closes,0);assert.equal(f.file.aborts,1);
});
for(const status of [403,409,503]) test(`reader ${status} remains a failure and aborts staging`,async t=>{
  const f=await transfer(t);await assert.rejects(f.run(async()=>{throw new TransportError(status);}),e=>e.status===status);
  assert.equal(f.file.closes,0);assert.equal(f.file.aborts,1);
});
test('partial write failure aborts and never closes',async t=>{
  const f=await transfer(t,{onWrite:(_html,n)=>{if(n===2)throw Error('synthetic partial write');}});
  await assert.rejects(f.run());assert.equal(f.file.writes,2);assert.equal(f.file.closes,0);assert.equal(f.file.aborts,1);
});
test('close rejection stays unconfirmed even when abort acknowledges',async t=>{
  const f=await transfer(t,{onClose:()=>{throw Error('synthetic close failure');}});
  await assert.rejects(f.run());assert.equal(f.file.closes,1);assert.equal(f.file.aborts,1);assert.equal(f.writer.getDisposition(),'close-unconfirmed');
});
test('retirement during pending write fences before abort and prevents footer/close',async t=>{
  const entered=deferred(),release=deferred();t.after(()=>release.resolve());
  const f=await transfer(t,{onWrite:async()=>{entered.resolve();await release.promise;}}),work=f.run();
  await entered.promise;const cleanup=f.writer.abort();assert.equal(f.writer.getDisposition(),'aborting');release.resolve();
  await cleanup;await assert.rejects(work);assert.equal(f.file.closes,0);assert.equal(f.file.aborts,1);
});
test('actual owner replacement while hash/read is pending prevents all stale writes',async t=>{
  const f=await transfer(t),entered=deferred(),release=deferred();t.after(()=>release.resolve());
  const work=f.run(async c=>{const value=await f.wire.read(c);entered.resolve();await release.promise;return value;});
  await entered.promise;await f.switchOwner();release.resolve();await assert.rejects(work,e=>e.status===401);
  assert.equal(f.file.writes,0);assert.equal(f.file.closes,0);assert.equal(f.file.aborts,1);
});
test('owner loss after close dispatch returns no success and never claims cleanup',async t=>{
  const entered=deferred(),release=deferred();t.after(()=>release.resolve());
  const f=await transfer(t,{onClose:async()=>{entered.resolve();await release.promise;}}),work=f.run();
  await entered.promise;await f.switchOwner();const cleanup=f.writer.abort();release.resolve();await cleanup;
  await assert.rejects(work,e=>e.status===401);assert.equal(f.writer.getDisposition(),'close-unconfirmed');
});
test('late createWritable after retirement aborts the captured owned stream',async t=>{
  assert.equal(typeof writerApi.createBrowserFinalExportStaging,'function');
  const s=await session(t),client=clientApi.captureFinalExportClient(s.runtime),entered=deferred(),release=deferred();t.after(()=>release.resolve());
  const file=fileModel({onCreate:async()=>{entered.resolve();await release.promise;}}),w=writerApi.createBrowserFinalExportStaging(file.handle,()=>client.assertReady()),work=w.open();
  await entered.promise;
  // AFEC1 successor: cleanup no longer acknowledges an outstanding open.
  // Preserve all original assertions; release acquisition before joining it.
  let acknowledged=false;const cleanup=w.abort().then(()=>{acknowledged=true;});
  await Promise.resolve();await Promise.resolve();assert.equal(acknowledged,false);
  release.resolve();await cleanup;await assert.rejects(work);assert.equal(file.aborts,1);assert.equal(file.closes,0);
});
test('controller constructor and subscription are inert; unsupported picker is unavailable on action',async t=>{
  assert.equal(typeof controllerApi.createAccountFinalExport,'function');
  const f=await session(t),c=controllerApi.createAccountFinalExport(f.runtime,{});t.after(()=>c.dispose());
  const stop=c.subscribe(()=>{});assert.equal(c.getSnapshot().phase,'idle');assert.equal(f.calls.length,1);stop();
  await c.saveFromUserAction();assert.equal(c.getSnapshot().phase,'unavailable');assert.equal(f.calls.length,1);
});
test('controller chooses HTML destination on explicit action then actual unsupported channel aborts without writes',async t=>{
  assert.equal(typeof controllerApi.createAccountFinalExport,'function');
  const f=await session(t),file=fileModel();let picks=0;
  const c=controllerApi.createAccountFinalExport(f.runtime,{async showSaveFilePicker(options){picks++;assert.deepEqual(options,{suggestedName:'shelv-final-plan.html',excludeAcceptAllOption:true,types:[{description:'HTML document',accept:{'text/html':['.html']}}]});return file.handle;}});t.after(()=>c.dispose());
  assert.equal(picks,0);await c.saveFromUserAction();assert.equal(picks,1);assert.equal(c.getSnapshot().phase,'unavailable');assert.equal(file.writes,0);assert.equal(file.closes,0);assert.equal(file.aborts,1);
});
test('throwing/reentrant observers cannot trigger a second picker or interrupt retirement',async t=>{
  assert.equal(typeof controllerApi.createAccountFinalExport,'function');
  const f=await session(t),held=deferred(),entered=deferred();t.after(()=>held.resolve(fileModel().handle));let picks=0;
  const c=controllerApi.createAccountFinalExport(f.runtime,{async showSaveFilePicker(){picks++;entered.resolve();return held.promise;}});t.after(()=>c.dispose());
  c.subscribe(()=>{throw Error('observer');});c.subscribe(()=>{void c.saveFromUserAction();});
  const work=c.saveFromUserAction();await entered.promise;assert.equal(picks,1);c.dispose();assert.equal(c.getSnapshot().phase,'retired');
  held.resolve(fileModel().handle);await work;assert.equal(c.getSnapshot().phase,'retired');assert.equal(picks,1);
});
test('picker cancellation and session replacement never open a late destination',async t=>{
  assert.equal(typeof controllerApi.createAccountFinalExport,'function');
  const f=await session(t),c=controllerApi.createAccountFinalExport(f.runtime,{async showSaveFilePicker(){throw new DOMException('cancelled','AbortError');}});t.after(()=>c.dispose());
  await c.saveFromUserAction();assert.equal(c.getSnapshot().phase,'cancelled');
  const held=deferred(),entered=deferred(),file=fileModel();t.after(()=>held.resolve(file.handle));
  const late=controllerApi.createAccountFinalExport(f.runtime,{async showSaveFilePicker(){entered.resolve();return held.promise;}});t.after(()=>late.dispose());
  const work=late.saveFromUserAction();await entered.promise;await f.switchOwner();held.resolve(file.handle);await work;
  assert.equal(late.getSnapshot().phase,'retired');assert.deepEqual(file.events,[]);
});
test('actual offline suspension while picker is pending stays unavailable, without declaring session end',async t=>{
  const f=await session(t),entered=deferred(),release=deferred(),file=fileModel();t.after(()=>release.resolve(file.handle));
  const c=controllerApi.createAccountFinalExport(f.runtime,{async showSaveFilePicker(){entered.resolve();return release.promise;}});t.after(()=>c.dispose());
  const work=c.saveFromUserAction();await entered.promise;const boundary=f.runtime.getSnapshot().boundary;
  f.runtime.cookie.suspend();release.resolve(file.handle);await work;
  assert.equal(f.runtime.getSnapshot().boundary,boundary);assert.equal(boundary.isCurrent(),true);
  assert.equal(c.getSnapshot().phase,'unavailable');assert.deepEqual(file.events,[]);
});
test('overlapping cleanup rejects without falsely acknowledging the pending abort',async t=>{
  const entered=deferred(),release=deferred();t.after(()=>release.resolve());
  const f=await transfer(t,{onAbort:async()=>{entered.resolve();await release.promise;}}),first=f.writer.abort();
  await entered.promise;let rejected=false;const second=f.writer.abort().catch(()=>{rejected=true;});
  await Promise.resolve();await Promise.resolve();
  try {assert.equal(rejected,true);assert.equal(f.writer.getDisposition(),'aborting');}
  finally {release.resolve();await first;await second;}
  assert.equal(f.file.aborts,1);
});
for(const prefix of ['shelv.final-export.root.v1\n','shelv.final-export.segment.v1\n','shelv.final-export.fold.v1\n','shelv.final-export.complete.v1\n']) test(`actual digest retirement fence: ${prefix.trim()}`,async t=>{
  const f=await transfer(t),entered=deferred(),release=deferred(),original=crypto.subtle.digest;
  let held=false;
  crypto.subtle.digest=async function(algorithm,data){
    const result=await original.call(this,algorithm,data);
    if(!held&&new TextDecoder().decode(data).startsWith(prefix)){held=true;entered.resolve();await release.promise;}
    return result;
  };
  t.after(()=>{release.resolve();crypto.subtle.digest=original;});
  const work=f.run();await entered.promise;await f.switchOwner();release.resolve();await assert.rejects(work,e=>e.status===401);
  assert.equal(f.file.closes,0);assert.equal(f.file.aborts,1);
});
test('backing methods are captured and the writer never repeats a completed close',async t=>{
  const f=await transfer(t);f.file.stream.write=async()=>{throw Error('replacement write must not run');};f.file.stream.close=async()=>{throw Error('replacement close must not run');};
  await f.run();await assert.rejects(f.writer.ports.commit({filename:'ignored',contentType:'ignored',rootHash:'ignored'}));
  await f.writer.abort();assert.equal(f.file.closes,1);assert.equal(f.file.aborts,0);
});
test('failed abort is unconfirmed and may be explicitly retried without reopening',async t=>{
  let failures=1;const f=await transfer(t,{onAbort:()=>{if(failures-->0)throw Error('abort rejected');}});
  await assert.rejects(f.writer.abort());assert.equal(f.writer.getDisposition(),'abort-unconfirmed');
  await f.writer.abort();assert.equal(f.writer.getDisposition(),'abort-acknowledged');
  await assert.rejects(f.run());assert.equal(f.file.closes,0);assert.equal(f.file.aborts,2);
});
test('a reentrant backing abort is rejected instead of waiting on itself',async t=>{
  let writer;const f=await transfer(t,{onAbort:async()=>{await assert.rejects(writer.abort(),/cleanup_in_progress/);}});writer=f.writer;
  await writer.abort();assert.equal(f.file.aborts,1);assert.equal(writer.getDisposition(),'abort-acknowledged');
});
test('caller abort before picker, and disposal after pending open, never manufacture a completed file',async t=>{
  const f=await session(t);let picks=0;const abort=new AbortController();abort.abort();
  const c=controllerApi.createAccountFinalExport(f.runtime,{async showSaveFilePicker(){picks++;return fileModel().handle;}});t.after(()=>c.dispose());
  await c.saveFromUserAction({signal:abort.signal});assert.equal(c.getSnapshot().phase,'cancelled');assert.equal(picks,0);
  const entered=deferred(),release=deferred(),file=fileModel({onCreate:async()=>{entered.resolve();await release.promise;}});t.after(()=>release.resolve());
  const late=controllerApi.createAccountFinalExport(f.runtime,{async showSaveFilePicker(){return file.handle;}});t.after(()=>late.dispose());
  const work=late.saveFromUserAction();await entered.promise;late.dispose();release.resolve();await work;
  assert.equal(late.getSnapshot().phase,'retired');assert.equal(file.aborts,1);assert.equal(file.closes,0);
});
test('reentrant relevance callbacks can deny but cannot preserve READY after suspension',async t=>{
  const f=await session(t),port=requestApi.createClientFinalExportRequest(f.runtime);
  await assert.rejects(port.execute({schemaVersion:1,action:'read_final_export_manifest_v1'},{isApplicable(){f.runtime.cookie.suspend();return true;}}),e=>e.status===503);
  assert.equal(f.runtime.getSnapshot().status,'offline');assert.equal(f.calls.length,1);
});
test('collection exposes actual sink retirement before observer notification, even during pending work',async t=>{
  assert.equal(typeof transferApi.createFinalExportCollection,'function');
  const f=await transfer(t),entered=deferred(),release=deferred();t.after(()=>release.resolve());
  const collection=transferApi.createFinalExportCollection(async c=>{const value=await f.wire.read(c);if(c.action==='read_final_export_part_v1'){entered.resolve();await release.promise;}return value;},f.writer,()=>f.client.assertReady());
  const work=collection.collect();await entered.promise;await collection.abort();release.resolve();await assert.rejects(work);
  assert.equal(f.file.writes,0);assert.equal(f.file.closes,0);assert.equal(f.file.aborts,1);
});
test('an error observer cannot start another destination picker without a new user action',async t=>{
  const f=await session(t);let picks=0,extra;
  const c=controllerApi.createAccountFinalExport(f.runtime,{async showSaveFilePicker(){picks++;return fileModel().handle;}});t.after(()=>c.dispose());
  let retried=false;c.subscribe(()=>{if(c.getSnapshot().phase==='unavailable'&&!retried){retried=true;extra=c.saveFromUserAction();}});
  await c.saveFromUserAction();await extra;assert.equal(picks,1);
});
