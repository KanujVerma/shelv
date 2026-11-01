import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFinalExportCommand} from '../src/contracts/PortalFinalExportValidation.ts';
import {collectFinalExport} from '../src/contracts/PortalFinalExportMapping.ts';
import {finalExportFixture,finalExportWire} from './portal-final-export-fixtures.ts';

test('fixed export commands reject caller identity, role, clock, URL and RPC selectors',()=>{
 for(const key of ['clientId','actorId','role','current','asOfDay','rpc','url'])assert.throws(()=>readFinalExportCommand({schemaVersion:1,action:'read_final_export_manifest_v1',[key]:'anything'}));
 assert.deepEqual(readFinalExportCommand({schemaVersion:1,action:'read_final_export_manifest_v1'}),{schemaVersion:1,action:'read_final_export_manifest_v1'});
});
test('part parser rejects a fractional-second support boundary instead of accepting a nearby clock',()=>{
 const wire=finalExportWire(finalExportFixture());wire.manifest.basis.supportEndsAt='2026-11-01T05:00:00.000001Z';
 assert.throws(()=>readFinalExportCommand({schemaVersion:1,action:'read_final_export_part_v1',basis:wire.manifest.basis,partIndex:0}));
});
test('collector hashes the detached exact record and freezes every returned nested value',async()=>{
 const source=finalExportFixture(),wire=finalExportWire(source),finalManifest=structuredClone(wire.manifest);let manifests=0;
 const collected=await collectFinalExport(async command=>command.action==='read_final_export_manifest_v1'&&manifests++>0?finalManifest:wire.read(command),async text=>{
  source.use[0]!.details='later caller edit';wire.manifest.basis.recordHash='f'.repeat(64);
  const {createHash}=await import('node:crypto');return createHash('sha256').update(text).digest('hex');
 });
 assert.equal(collected.record.use[0]?.details,'felt uncomfortable');assert.equal(collected.recordText,wire.text);
 assert.ok(Object.isFrozen(collected.record)&&Object.isFrozen(collected.record.plan)&&Object.isFrozen(collected.record.instructions[0]?.content));
});
test('collector refuses an unavailable final basis instead of producing an empty plan',async()=>{
 await assert.rejects(collectFinalExport(async()=>({schemaVersion:1,status:'unavailable',reason:'service_end_unknown'})),/service_end_unknown/);
});
