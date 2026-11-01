import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readGuidanceCommand,reviewJsonBytes} from '../src/contracts/PortalReviewValidation.ts';
import {guidanceBodyMaxBytes} from '../src/contracts/PortalReviewValues.ts';
import {finalExportFixture} from './portal-final-export-fixtures.ts';
import {finalExportInstructionScopesMax,finalExportPlanUnitMaxBytes,finalExportInstructionUnitMaxBytes} from '../src/contracts/PortalFinalExportValues.ts';
globalThis.fetch=async()=>{throw Error('external_fetch_denied');};

test('resource derivation uses an actually accepted rich instruction, without allocating the aggregate',()=>{
 const record=finalExportFixture(),i=record.instructions[0]!;if(i.content.format!=='authored_schedule')throw Error('fixture');
 const body={kind:'instruction',publication:{version:7,documentSchemaVersion:3},slotId:'slot-1',productId:'product-1',baseInstructionId:null,baseInstructionVersion:0,useBasis:{useRevision:0,latestEventId:null,amendmentHeadId:null},directions:Array.from({length:20},()=> 'd'.repeat(4000)),cautions:Array.from({length:9},()=> 'c'.repeat(4000)),schedule:i.content.schedule,reason:'r'.repeat(1000),effectiveOn:'2026-10-31',reviewId:null};
 readGuidanceCommand({schemaVersion:1,action:'create_guidance_draft_v1',requestId:'11111111-1111-4111-8111-111111111111',clientId:'22222222-2222-4222-8222-222222222222',body});
 const bytes=reviewJsonBytes(body);assert.ok(bytes>117000&&bytes<guidanceBodyMaxBytes);
 // This establishes a lower-size example for a full scope set, not measured aggregate memory.
 const directionsAndCautions=117000*2550;assert.equal(directionsAndCautions,298350000);assert.ok(directionsAndCautions>256*1024*1024);
 assert.equal(finalExportInstructionScopesMax,2550);assert.equal(finalExportPlanUnitMaxBytes,14772736);assert.equal(finalExportInstructionUnitMaxBytes,865536);
 console.log(JSON.stringify({acceptedInstructionBytes:bytes,scopes:2550,retainedDirectionsCautionsReasonBytesAtAllScopes:directionsAndCautions,planUnitBound:finalExportPlanUnitMaxBytes,instructionUnitBound:finalExportInstructionUnitMaxBytes,aggregateMaterialization:'REMOVED',sqlExecution:'UNRUN'}));
});
