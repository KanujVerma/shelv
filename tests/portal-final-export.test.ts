import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createHash} from 'node:crypto';
import type {FinalExportSink,FinalExportInstruction,FinalExportPart,FinalExportCommand} from '../src/contracts/PortalFinalExport.ts';
import {readFinalExportCommand,assertFinalExportRecord} from '../src/contracts/PortalFinalExportValidation.ts';
import {collectFinalExport,parseFinalExportUnitJson,finalExportLeafFrame,finalExportSha256} from '../src/contracts/PortalFinalExportMapping.ts';
import {finalExportFixture,finalExportWire,finalExportMaximumScopeFixture} from './portal-final-export-fixtures.ts';
globalThis.fetch=async()=>{throw Error('external_fetch_denied');};
function sinkFixture(){const staged:number[]=[];let commits=0,aborts=0;const sink:FinalExportSink<string>={stage:async(unit,index)=>{assert.ok(Object.isFrozen(unit));staged.push(index);},commit:async()=>{commits++;return 'committed';},abort:async()=>{aborts++;}};return {sink,staged,get commits(){return commits;},get aborts(){return aborts;}};}
test('fixed export commands reject caller identity, role, clock, URL and RPC selectors',()=>{
 for(const key of ['clientId','actorId','role','current','asOfDay','rpc','url'])assert.throws(()=>readFinalExportCommand({schemaVersion:1,action:'read_final_export_manifest_v1',[key]:'anything'}));
 assert.deepEqual(readFinalExportCommand({schemaVersion:1,action:'read_final_export_manifest_v1'}),{schemaVersion:1,action:'read_final_export_manifest_v1'});
});
test('pair parser rejects old scalar index, fractional support instant and invalid scalar encoding',()=>{
 const wire=finalExportWire(finalExportFixture());const cmd={schemaVersion:1,action:'read_final_export_part_v1',basis:wire.manifest.basis,partIndex:{unitIndex:0,segmentIndex:0}};
 assert.deepEqual(readFinalExportCommand(cmd),cmd);assert.throws(()=>readFinalExportCommand({...cmd,partIndex:0}));
 assert.throws(()=>readFinalExportCommand({...cmd,basis:{...cmd.basis,supportEndsAt:'2026-11-01T05:00:00.000001Z'}}));
 assert.throws(()=>readFinalExportCommand({...cmd,clientId:'\ud800'}));
});
test('streaming collector commits only after contiguous complete units and final current manifest',async()=>{
 const wire=finalExportWire(finalExportFixture()),f=sinkFixture();const receipt=await collectFinalExport(wire.read,f.sink);
 assert.deepEqual(f.staged,[0,1]);assert.equal(f.commits,1);assert.equal(f.aborts,0);assert.equal(receipt.commitResult,'committed');assert.deepEqual(Object.keys(receipt),['manifest','commitResult']);
 assert.equal(wire.requests.at(-1)?.action,'read_final_export_manifest_v1');
});
test('borrowed part mutation during hashing cannot change the exact validated frozen staged unit',async()=>{
 const wire=finalExportWire(finalExportFixture()),f=sinkFixture();let borrowed:unknown;
 await collectFinalExport(async command=>{const value=await wire.read(command);if(command.action==='read_final_export_part_v1')borrowed=value;return value;},f.sink,async text=>{
  if(text.startsWith('shelv.final-export.segment.v1')&&borrowed&&typeof borrowed==='object'&&'text'in borrowed)borrowed.text='caller mutation';
  return createHash('sha256').update(text).digest('hex');
 });assert.equal(f.commits,1);assert.equal(f.aborts,0);
});
test('changed final authority, mixed basis, corrupt leaves and false totals abort without a completed receipt',async()=>{
 for(const fault of ['authority','basis','leaf','totals']){
  const wire=finalExportWire(finalExportFixture()),f=sinkFixture();let manifests=0;
  const read=async(command:FinalExportCommand):Promise<unknown>=>{
   const value=await wire.read(command);
   if(command.action==='read_final_export_manifest_v1'){
    if(fault==='authority'&&manifests++>0)return {schemaVersion:1,status:'unavailable',reason:'service_end_unknown'};
    return fault==='totals'?{...wire.manifest,totalBytes:wire.manifest.totalBytes+1}:value;
   }
   assert.ok(value&&typeof value==='object'&&'basis'in value&&'leafHash'in value);
   return fault==='basis'?{...value,basis:{...wire.manifest.basis,selectionHash:'f'.repeat(64)}}:fault==='leaf'?{...value,leafHash:'f'.repeat(64)}:value;
  };
  await assert.rejects(collectFinalExport(read,f.sink));assert.equal(f.commits,0);assert.equal(f.aborts,1);
 }
});
test('unavailable final facts are an explicit refusal, never an empty plan or success',async()=>{
 const f=sinkFixture();await assert.rejects(collectFinalExport(async()=>({schemaVersion:1,status:'unavailable',reason:'legacy_snapshot_missing'}),f.sink),/legacy_snapshot_missing/);assert.equal(f.commits,0);assert.equal(f.aborts,1);
});
test('a correctly hashed instruction still must bind the real plan scope, Start and end boundary',async()=>{
 for(const fault of ['scope','start','end']){const r=finalExportFixture(),i=r.instructions[0]!;if(fault==='scope')i.slotId='other-scope';if(fault==='start')i.originalStart={state:'known',value:'2026-10-01'};if(fault==='end')i.effectiveOn='2026-11-01';const f=sinkFixture();await assert.rejects(collectFinalExport(finalExportWire(r).read,f.sink));assert.equal(f.commits,0);assert.equal(f.aborts,1);}
});
test('stage/commit failures abort once and a sink cannot be reentered during any await',async()=>{
 const wire=finalExportWire(finalExportFixture());
 for(const fault of ['stage','commit']){const f=sinkFixture();if(fault==='stage')f.sink.stage=async()=>{throw Error('stage failed');};else f.sink.commit=async()=>{throw Error('commit failed');};await assert.rejects(collectFinalExport(wire.read,f.sink),new RegExp(fault+' failed'));assert.equal(f.aborts,1);}
 const f=sinkFixture();f.sink.stage=async()=>{await assert.rejects(collectFinalExport(wire.read,f.sink),/staging_in_use/);};f.sink.commit=async()=>{await assert.rejects(collectFinalExport(wire.read,f.sink),/staging_in_use/);return 'committed';};
 assert.equal((await collectFinalExport(wire.read,f.sink)).commitResult,'committed');assert.equal(f.aborts,0);
});
test('strict logical-unit parser rejects duplicate keys and escaped lone surrogates before staging',()=>{
 assert.throws(()=>parseFinalExportUnitJson('{"kind":"plan","kind":"instruction"}'));
 assert.throws(()=>parseFinalExportUnitJson('{"text":"\\ud800"}'));
 assert.deepEqual(parseFinalExportUnitJson('{"text":"🧴","nested":[true,null,1]}'),{text:'🧴',nested:[true,null,1]});
});
test('public record validator refuses duplicate product identity and dangling routine references',()=>{
 const record=finalExportFixture();if(record.plan.documentSchemaVersion!==3)throw Error('fixture');record.plan.content.products.push(structuredClone(record.plan.content.products[0]!));assert.throws(()=>assertFinalExportRecord(record));record.plan.content.products.pop();record.instructions=[];record.plan.content.routine[0]!.productId='not-in-this-plan';assert.throws(()=>assertFinalExportRecord(record));
});
test('complete 2550-scope stream loses no instructions and returns no bundle model',async()=>{
 const record=finalExportMaximumScopeFixture();
 const wire=finalExportWire(record),f=sinkFixture();const receipt=await collectFinalExport(wire.read,f.sink);assert.equal(f.staged.length,2551);assert.equal(f.staged.at(-1),2550);assert.equal(receipt.manifest.basis.instructionCount,2550);assert.equal(wire.requests.filter(r=>r.action==='read_final_export_part_v1').length,wire.manifest.partCount);
});
test('leaf framing domain and byte-length have an independent fixed SHA256 vector',async()=>{
 const wire=finalExportWire(finalExportFixture());const p:FinalExportPart={schemaVersion:1,basis:wire.manifest.basis,partIndex:{unitIndex:1,segmentIndex:0},kind:'instruction',segmentCount:1,unitCharacters:3,unitBytes:3,text:'abc',leafHash:'0'.repeat(64)};
 assert.equal(finalExportLeafFrame(p),'shelv.final-export.segment.v1\n1\ninstruction\n0\n1\n3\nabc');assert.equal(await finalExportSha256(finalExportLeafFrame(p)),'5a488c988768f734aef377c03bf1ca450e0364f2c5979307009afe5470f141bb');
});
