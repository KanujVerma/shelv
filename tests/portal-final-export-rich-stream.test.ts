import assert from 'node:assert/strict';
import {test} from 'node:test';
import type {FinalExportUnit} from '../src/contracts/PortalFinalExport.ts';
import {collectFinalExport} from '../src/contracts/PortalFinalExportMapping.ts';
import {createFinalExportHtmlSink} from '../supabase/functions/concierge-final-export/serializer.ts';
import {readGuidanceCommand,reviewJsonBytes} from '../src/contracts/PortalReviewValidation.ts';
import {guidanceBodyMaxBytes} from '../src/contracts/PortalReviewValues.ts';
import {finalExportMaximumScopeFixture,finalExportUnitWire} from './portal-final-export-fixtures.ts';
globalThis.fetch=async()=>{throw Error('external_fetch_denied');};
test('all 2550 maximal-body instruction units stream escaped HTML without a full-bundle result',async()=>{
 const r=finalExportMaximumScopeFixture();if(r.plan.documentSchemaVersion!==3)throw Error('fixture');const c=r.plan.content;
 c.goals=Array.from({length:50},(_,i)=>({id:`goal-${i+1}`,text:'g'.repeat(4000),factIds:[]}));c.context.facts=Array.from({length:150},(_,i)=>({id:`fact-${i}`,kind:'client_report',text:'f'.repeat(1000)}));
 const planBytes=Buffer.byteLength(JSON.stringify(c));assert.ok(planBytes<500000&&planBytes>350000);
 for(const u of r.use){u.state='using_differently';u.details='🧴'.repeat(4000);u.frequency={state:'known',value:'🧴'.repeat(4000)};u.amount={state:'known',value:'🧴'.repeat(4000)};}
 const first=r.instructions[0]!;if(first.content.format!=='authored_schedule')throw Error('fixture');
 const authored={kind:'instruction',publication:{version:7,documentSchemaVersion:3},slotId:first.slotId,productId:first.productId,baseInstructionId:null,baseInstructionVersion:0,useBasis:{useRevision:0,latestEventId:null,amendmentHeadId:null},directions:Array.from({length:20},()=> 'd'.repeat(4000)),cautions:Array.from({length:9},()=> 'c'.repeat(4000)),schedule:first.content.schedule,reason:'r'.repeat(1000),effectiveOn:'2026-10-31',reviewId:null};
 authored.reason+='r'.repeat(guidanceBodyMaxBytes-reviewJsonBytes(authored));assert.equal(reviewJsonBytes(authored),120000);readGuidanceCommand({schemaVersion:1,action:'create_guidance_draft_v1',requestId:'11111111-1111-4111-8111-111111111111',clientId:'22222222-2222-4222-8222-222222222222',body:authored});
 const wire=finalExportUnitWire(2551,r.careBasis,(i):FinalExportUnit=>{
  if(i===0)return {schemaVersion:1,kind:'plan',careBasis:r.careBasis,plan:r.plan,use:r.use};
  const instruction=r.instructions[i-1];if(!instruction)throw Error('fixture');return {schemaVersion:1,kind:'instruction',instruction:{...instruction,content:{format:'authored_schedule',directions:authored.directions,cautions:authored.cautions,schedule:authored.schedule,reason:authored.reason}}};
 },false);
 let stagedBytes=0,writes=0,commits=0,aborts=0,maxObservedHeapBytes=0;
 const sink=createFinalExportHtmlSink({write:async chunk=>{stagedBytes+=Buffer.byteLength(chunk.html);writes++;maxObservedHeapBytes=Math.max(maxObservedHeapBytes,process.memoryUsage().heapUsed);},commit:async metadata=>{commits++;return metadata.rootHash;},abort:async()=>{aborts++;}});
 const result=await collectFinalExport(wire.read,sink);assert.equal(commits,1);assert.equal(aborts,0);assert.equal(writes,2552);assert.ok(wire.manifest.totalBytes>298350000);assert.ok(stagedBytes>298350000);assert.ok(wire.metrics.maxUnitBytes>1800000);assert.equal(wire.metrics.partReads,wire.manifest.partCount);assert.equal(result.commitResult,wire.manifest.rootHash);assert.deepEqual(Object.keys(result),['manifest','commitResult']);
 console.log(JSON.stringify({evidence:'pure Node synthetic streaming; not SQL/Edge/browser',planBytes,authoredBodyBytes:120000,units:2551,parts:wire.metrics.partReads,totalUnitBytes:wire.manifest.totalBytes,stagedHtmlBytes:stagedBytes,maxUnitBytes:wire.metrics.maxUnitBytes,maxObservedHeapBytes,heapSampling:'write-boundary samples only; not a hard maximum',bundleMaterialized:false}));
});
