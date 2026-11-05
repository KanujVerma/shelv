import assert from 'node:assert/strict';
import {test} from 'node:test';
import type {AvailableFinalExport,FinalExportPlanUnit,FinalExportSink} from '../src/contracts/PortalFinalExport.ts';
import {assertFinalExportRecord,assertFinalExportPlanUnit} from '../src/contracts/PortalFinalExportValidation.ts';
import {collectFinalExport} from '../src/contracts/PortalFinalExportMapping.ts';
import {createFinalExportHtmlSink} from '../supabase/functions/concierge-final-export/serializer.ts';
import type {FinalExportStagingPorts} from '../supabase/functions/concierge-final-export/serializer.ts';
import {finalExportFixture,finalExportWire} from './portal-final-export-fixtures.ts';

globalThis.fetch=async()=>{throw Error('external_fetch_denied');};
const footer='</pre></main></body></html>\n';
function latch(){let release=()=>{};const promise=new Promise<void>(resolve=>{release=resolve;});return {promise,release};}
const outcome=async<T>(p:Promise<T>)=>p.then(value=>({state:'fulfilled' as const,value}),error=>({state:'rejected' as const,error}));
type Hooks={write?:(chunk:{html:string;text:string})=>Promise<void>;commit?:()=>Promise<string>;abort?:()=>Promise<void>};
function fixture(hooks:Hooks={}){
 const record=finalExportFixture();assertFinalExportRecord(record);const wire=finalExportWire(record);
 const unit:FinalExportPlanUnit={schemaVersion:1,kind:'plan',careBasis:record.careBasis,plan:record.plan,use:record.use};assertFinalExportPlanUnit(unit);
 const model:{html:string;text:string;writes:number;commits:number;aborts:number;released:string[];metadata:{filename:string;contentType:string;rootHash:string}[]}={html:'',text:'',writes:0,commits:0,aborts:0,released:[],metadata:[]};
 const ports:FinalExportStagingPorts<string>={write:async chunk=>{model.writes++;model.html+=chunk.html;model.text+=chunk.text;await hooks.write?.(chunk);},commit:async m=>{model.commits++;model.metadata.push({...m});const value=await hooks.commit?.();model.released.push(model.html);return value??'complete';},abort:async()=>{model.aborts++;model.html='';model.text='';await hooks.abort?.();}};
 const sink=createFinalExportHtmlSink(ports);return {record,wire,unit,model,ports,sink,start:()=>collectFinalExport(wire.read,sink)};
}

test('FE5 acknowledged abort during held footer prevents backing dispatch and successful collector receipt',async()=>{
 const entered=latch(),release=latch();const f=fixture({write:async c=>{if(c.html===footer){entered.release();await release.promise;}}});const pending=outcome(f.start());await entered.promise;assert.equal(f.model.commits,0);await f.sink.abort();assert.equal(f.model.aborts,1);assert.equal(f.model.html,'');release.release();const result=await pending;assert.equal(f.model.commits,0);assert.equal(result.state,'rejected');assert.equal(f.model.aborts,1,'collector cleanup reuses the acknowledged discard');
});

for(const writeNumber of [1,2])test(`aborted pending stage write ${writeNumber} cannot return a stale successful stage completion`,async()=>{
 const entered=latch(),release=latch();const f=fixture({write:async()=>{if(f.model.writes===writeNumber){entered.release();await release.promise;}}});const stage=f.sink.stage.bind(f.sink);let lateStageSuccess=false,aborted=false;
 f.sink.stage=async(...args)=>{await stage(...args);if(aborted)lateStageSuccess=true;};const pending=outcome(f.start());await entered.promise;await f.sink.abort();aborted=true;release.release();assert.equal((await pending).state,'rejected');assert.equal(lateStageSuccess,false);assert.equal(f.model.commits,0);await assert.rejects(f.sink.stage(f.unit,0,f.wire.manifest));await assert.rejects(f.sink.commit(f.wire.manifest));
});

test('reentrant abort awaited by the footer writer cannot be followed by backing commit',async()=>{
 const f=fixture({write:async c=>{if(c.html===footer)await f.sink.abort();}});const result=await outcome(f.start());assert.equal(result.state,'rejected');assert.equal(f.model.commits,0);assert.equal(f.model.aborts,1);
});

test('abort after backing commit dispatch suppresses a stale receipt without claiming recall of released bytes',async()=>{
 const entered=latch(),release=latch();let alreadyReleased='';const f=fixture({commit:async()=>{alreadyReleased=f.model.html;entered.release();await release.promise;return 'backing-ack';}});const pending=outcome(f.start());await entered.promise;assert.equal(f.model.commits,1);assert.ok(alreadyReleased.endsWith(footer));await f.sink.abort();release.release();assert.equal((await pending).state,'rejected');assert.equal(f.model.commits,1);assert.ok(alreadyReleased.includes('CeraVe PM'),'already released bytes are not recalled');
});

test('abort reentered from a dispatched backing commit also invalidates its later completion receipt',async()=>{
 const f=fixture({commit:async()=>{await f.sink.abort();return 'already-dispatched';}});assert.equal((await outcome(f.start())).state,'rejected');assert.equal(f.model.commits,1);assert.equal(f.model.aborts,1);
});

test('late footer write can leave private residual bytes but cannot reopen the sink or dispatch completion',async()=>{
 const entered=latch(),release=latch();const f=fixture({write:async c=>{if(c.html===footer){entered.release();await release.promise;f.model.html+='LATE_PRIVATE_STAGING_RESIDUAL';}}});const pending=outcome(f.start());await entered.promise;await f.sink.abort();assert.equal(f.model.html,'');release.release();assert.equal((await pending).state,'rejected');assert.equal(f.model.commits,0);assert.equal(f.model.html,'LATE_PRIVATE_STAGING_RESIDUAL','existing backing write has no physical cancellation protocol');await assert.rejects(f.sink.commit(f.wire.manifest));
});

test('acknowledged repeated abort is idempotent and never reopens an unused sink',async()=>{
 const f=fixture();await f.sink.abort();await f.sink.abort();await f.sink.abort();assert.equal(f.model.aborts,1);await assert.rejects(f.sink.stage(f.unit,0,f.wire.manifest));await assert.rejects(f.sink.commit(f.wire.manifest));
});

test('overlapping abort calls do not dispatch duplicate discards or falsely acknowledge an active discard',async()=>{
 const entered=latch(),release=latch();const f=fixture({abort:async()=>{entered.release();await release.promise;}});const first=f.sink.abort();await entered.promise;const second=outcome(f.sink.abort());release.release();await first;assert.equal((await second).state,'rejected');assert.equal(f.model.aborts,1);await f.sink.abort();assert.equal(f.model.aborts,1);
});

test('a backing discard can test a reentrant abort without recursive discard dispatch or self-await deadlock',async()=>{
 let nested:'fulfilled'|'rejected'|undefined;const f=fixture({abort:async()=>{if(f.model.aborts===1)nested=(await outcome(f.sink.abort())).state;}});await f.sink.abort();assert.equal(nested,'rejected');assert.equal(f.model.aborts,1);
});

test('throwing discard does not acknowledge cleanup, leaves the sink terminal, and remains explicitly retryable',async()=>{
 const failure=Error('discard failed');let attempts=0;const f=fixture({abort:async()=>{if(++attempts===1)throw failure;}});await assert.rejects(f.sink.abort(),error=>error===failure);await assert.rejects(f.sink.stage(f.unit,0,f.wire.manifest));await f.sink.abort();await f.sink.abort();assert.equal(attempts,2);assert.equal(f.model.aborts,2);
});

test('completed export is terminal; later abort is not presented as recall or a second disposition',async()=>{
 const f=fixture();assert.equal((await f.start()).commitResult,'complete');const released=f.model.released[0];assert.ok(released?.endsWith(footer));await f.sink.abort();await f.sink.abort();assert.equal(f.model.aborts,0);assert.equal(f.model.released[0],released);await assert.rejects(f.sink.stage(f.unit,0,f.wire.manifest));await assert.rejects(f.sink.commit(f.wire.manifest));
});

for(const phase of ['footer','backing'] as const)test(`duplicate commit during ${phase} await rejects without stealing the legitimate active owner`,async()=>{
 const entered=latch(),release=latch();const f=fixture({write:async c=>{if(phase==='footer'&&c.html===footer){entered.release();await release.promise;}},commit:async()=>{if(phase==='backing'){entered.release();await release.promise;}return 'complete';}});const pending=f.start();await entered.promise;await assert.rejects(f.sink.commit(f.wire.manifest));await assert.rejects(f.sink.stage(f.unit,0,f.wire.manifest));release.release();assert.equal((await pending).commitResult,'complete');assert.equal(f.model.commits,1);assert.equal(f.model.aborts,0);
});

test('duplicate stage while writing rejects without terminating its legitimate owner',async()=>{
 const entered=latch(),release=latch();const f=fixture({write:async()=>{if(f.model.writes===1){entered.release();await release.promise;}}});const pending=f.start();await entered.promise;await assert.rejects(f.sink.stage(f.unit,0,f.wire.manifest));release.release();assert.equal((await pending).commitResult,'complete');assert.equal(f.model.commits,1);assert.equal(f.model.aborts,0);
});

test('rejected direct stage write closes the sink instead of allowing reuse of partial bytes',async()=>{
 const failure=Error('private write failed');const f=fixture({write:async()=>{if(f.model.writes===1)throw failure;}});await assert.rejects(f.sink.stage(f.unit,0,f.wire.manifest),error=>error===failure);await assert.rejects(f.sink.stage(f.unit,0,f.wire.manifest));assert.equal(f.model.aborts,1);assert.equal(f.model.html,'');assert.equal(f.model.commits,0);
});

for(const phase of ['write','commit'] as const)test(`original ${phase} failure remains authoritative even when discard also throws`,async()=>{
 const failure=Error('original '+phase+' failure'),discardFailure=Error('discard secondary failure');const f=fixture({write:async c=>{if(phase==='write'&&c.html===footer)throw failure;},commit:async()=>{throw failure;},abort:async()=>{throw discardFailure;}});const result=await outcome(f.start());assert.equal(result.state,'rejected');if(result.state==='rejected')assert.equal(result.error,failure);await assert.rejects(f.sink.stage(f.unit,0,f.wire.manifest));
});

test('captured backing methods survive replacements during a real collector run',async()=>{
 const f=fixture({write:async()=>{f.ports.write=async()=>{throw Error('replacement write used');};f.ports.commit=async()=>{throw Error('replacement commit used');};f.ports.abort=async()=>{throw Error('replacement abort used');};}});assert.equal((await f.start()).commitResult,'complete');assert.equal(f.model.commits,1);assert.equal(f.model.aborts,0);
});

test('collector captures sink methods before its first await, including the actual abort path',async()=>{
 const entered=latch(),release=latch();const f=fixture();let manifests=0;const pending=outcome(collectFinalExport(async c=>{if(c.action==='read_final_export_manifest_v1'&&manifests++===0){entered.release();await release.promise;}if(c.action==='read_final_export_manifest_v1'&&manifests>1)return {...f.wire.manifest,rootHash:'f'.repeat(64)};return f.wire.read(c);},f.sink));await entered.promise;f.sink.stage=async()=>{throw Error('replacement stage used');};f.sink.commit=async()=>{throw Error('replacement commit used');};f.sink.abort=async()=>{throw Error('replacement abort used');};release.release();assert.equal((await pending).state,'rejected');assert.equal(f.model.commits,0);assert.equal(f.model.aborts,1);assert.equal(f.model.html,'');
});

test('backing commit metadata is captured from the validated manifest before a borrowed input can mutate',async()=>{
 let borrowed:AvailableFinalExport|undefined;const f=fixture({write:async c=>{if(c.html===footer){if(!borrowed)throw Error('fixture');borrowed.rootHash='f'.repeat(64);borrowed.basis.publication.version=999;}}});const commit=f.sink.commit.bind(f.sink);f.sink.commit=async m=>{borrowed=structuredClone(m);return commit(borrowed);};assert.equal((await f.start()).commitResult,'complete');assert.equal(f.model.metadata[0]?.rootHash,f.wire.manifest.rootHash);assert.equal(f.model.metadata[0]?.filename,'shelv-final-plan-v7.html');
});

test('accessor-bearing direct commit manifest is rejected without invoking the accessor or backing finish',async()=>{
 const f=fixture();await f.sink.stage(f.unit,0,f.wire.manifest);const i=f.record.instructions[0];if(!i)throw Error('fixture');await f.sink.stage({schemaVersion:1,kind:'instruction',instruction:i},1,f.wire.manifest);let getterCalls=0;const malicious=structuredClone(f.wire.manifest);Object.defineProperty(malicious,'rootHash',{enumerable:true,get(){getterCalls++;return f.wire.manifest.rootHash;}});await assert.rejects(f.sink.commit(malicious));assert.equal(getterCalls,0);assert.equal(f.model.commits,0);
});
