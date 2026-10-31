import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readPlanCommand,buildPlanRpc} from '../src/contracts/PortalRebuildValidation.ts';
import {mapPlanResult} from '../src/contracts/PortalRebuildMapping.ts';
import {createEmptyPlanContent,projectClientPlan} from '../src/contracts/PortalRebuild.ts';
const id='10000000-0000-4000-8000-000000000001', other='10000000-0000-4000-8000-000000000002';
const target={draftId:id,clientId:id,contentRevision:1,assignmentRevision:1,contentHash:'a'.repeat(64)};
const publisher={kind:'human',actorId:id};
const gateCommand={schemaVersion:1,action:'read_advisor_gate_v1',target,publisher};
const capabilities={actorId:id,view:true,edit:true,assign:true,review:true,approve:true,publish:true,confirmPayments:false};
const gate={schemaVersion:1,clientId:id,target,publisher,approval:null,publication:'first',coverage:'inactive',capabilities,policy:{revision:1,ownerActorId:id,requireKanujApproval:true}};
const pubCommand={schemaVersion:1,action:'read_advisor_publication_v1',clientId:id,version:2};
const pub={schemaVersion:1,clientId:id,version:2,plan:{documentSchemaVersion:3,version:2,publishedAt:'2026-10-30T10:00:00Z',content:projectClientPlan(createEmptyPlanContent())},decisionRevision:0,decisions:[],actualUse:[],nextReviewOn:null,reviewSchedule:null,clientAccess:{care:'ended',entitled:true,canRead:false,canWrite:false}};
test('advisor reads are strict fixed commands; owner-derived client read still rejects a client selector',()=>{
 for(const command of [gateCommand,pubCommand,{...pubCommand,version:null}])assert.deepEqual(buildPlanRpc(command),{name:'concierge_plan_command_v1',args:{p_command:command}});
 for(const command of [{...gateCommand,actorId:other},{...pubCommand,rpc:'raw'},{...gateCommand,publisher:null},{schemaVersion:1,action:'read_client_plan_v1',version:2,clientId:other}])assert.throws(()=>readPlanCommand(command));
});
test('gate response binds all target/publisher identities and only current exact approval',()=>{
 const command=readPlanCommand(gateCommand);assert.deepEqual(mapPlanResult(gate,command),gate);
 const approval={...target,id,scope:'care_plan.publish',approvedBy:id,approvedAt:'2026-10-30T10:00:00Z',publisher,revokedAt:null,publicationReceiptId:null};
 assert.deepEqual(mapPlanResult({...gate,approval},command),{...gate,approval});
 for(const delta of [{clientId:other},{target:{...target,assignmentRevision:2}},{publisher:{...publisher,actorId:other}},{approval:{...approval,contentHash:'b'.repeat(64)}},{approval:{...approval,revokedAt:'2026-10-30T11:00:00Z'}},{approval:{...approval,publicationReceiptId:id}},{privateNote:'CANARY'}])assert.throws(()=>mapPlanResult({...gate,...delta},command));
});
test('advisor publication binds client/version and reports ended client access without fabricated entitlement',()=>{
 const command=readPlanCommand(pubCommand);assert.deepEqual(mapPlanResult(pub,command),pub);
 for(const delta of [{clientId:other},{version:3},{plan:{...pub.plan,version:3}},{privateSource:'CANARY'},{clientAccess:{care:'ended',entitled:true,canRead:true,canWrite:false}},{clientAccess:{care:'active',entitled:false,canRead:true,canWrite:true}}])assert.throws(()=>mapPlanResult({...pub,...delta},command));
});
test('stored write receipts cannot be interpreted as fresh advisor gate or publication authority',()=>{
 const command=readPlanCommand({schemaVersion:1,action:'request_status_v1',requestId:id});
 for(const receipt of [gate,pub])assert.throws(()=>mapPlanResult({status:'committed',receipt},command));
});
test('legacy advisor publication format agrees with the actual immutable original',()=>{
 const command=readPlanCommand(pubCommand);
 assert.throws(()=>mapPlanResult({...pub,plan:{...pub.plan,documentSchemaVersion:2,legacyOriginal:{version:2,recommendations:[],presentation:null}}},command));
});
