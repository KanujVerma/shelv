import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readCareCommand,buildCareRpc,careCommandFields} from '../src/contracts/PortalCareValidation.ts';
import {mapCareResult} from '../src/contracts/PortalCareMapping.ts';
import {readPlanCommand,planCommandFields} from '../src/contracts/PortalRebuildValidation.ts';
import {taskActions} from '../src/contracts/PortalRebuildValues.ts';
const id='10000000-0000-4000-8000-000000000001',unknown={state:'unknown'},publication={version:1,documentSchemaVersion:3};
const product={kind:'plan_product',publication,productId:'opaque-product',slotId:'evening'};
const use={schemaVersion:1,action:'report_product_use_v1',requestId:id,expectedUseRevision:0,product,change:{kind:'started'},sourcePublication:publication,occurredOn:unknown,channel:'portal',acquisition:'self',identityEventId:null};
test('single reported Start accepts unknown and rejects second date, impersonation and plan selector',()=>{
 assert.deepEqual(buildCareRpc(use),{name:'concierge_care_command_v1',args:{p_command:use}});
 for(const change of [{kind:'started',startedOn:unknown},{kind:'stopped',details:null,startedOn:'2026-01-01'}])assert.throws(()=>readCareCommand({...use,change}));
 for(const extra of [{clientId:id},{reportedBy:id},{recordedAt:'2026-01-01'},{role:'owner'},{rpc:'other'}])assert.throws(()=>readCareCommand({...use,...extra}));
 for(const value of ['2025-02-29','2100-01-01','1899-12-31'])assert.throws(()=>readCareCommand({...use,occurredOn:{state:'known',value}}));
 assert.equal(readCareCommand({...use,occurredOn:{state:'known',value:'2024-02-29'}}).action,'report_product_use_v1');
});
test('exact identity discriminants preserve variant and reported descriptor version',()=>{
 const command={schemaVersion:1,action:'report_identity_v1',requestId:id,expectedUseRevision:0,target:{subject:product,comparedWith:product},answer:{match:'not_sure',reportedName:null,variant:unknown,strength:unknown,labelPhotoIds:[]},sourcePublication:publication,occurredOn:unknown,channel:'portal'};
 for(const match of ['yes','no','not_sure'])assert.equal(readCareCommand({...command,answer:{...command.answer,match}}).action,'report_identity_v1');
 assert.throws(()=>readCareCommand({...command,target:{subject:product,comparedWith:{...product,productId:'other'}}}));
 assert.throws(()=>readCareCommand({...use,change:{kind:'unreviewed_added',details:null}}));
 assert.throws(()=>readCareCommand({...use,product:{kind:'client_reported_product',reportedProductId:id,version:0}}));
 assert.throws(()=>readCareCommand({...use,change:{kind:'different',frequency:unknown,amount:unknown,details:''}}));
});
test('closed care and dependency seams leave all old task grants unchanged',()=>{
 assert.equal(Object.keys(careCommandFields).length,13);
 assert.equal(Object.keys(planCommandFields).length,26);
 assert.equal(taskActions.length,14);
 for(const action of ['read_draft_dependencies_v1','rebase_draft_dependencies_v1'])assert.ok(!taskActions.includes(action as never));
 assert.equal(readPlanCommand({schemaVersion:1,action:'read_draft_dependencies_v1',draftId:id,contentRevision:0,assignmentRevision:0}).action,'read_draft_dependencies_v1');
 assert.throws(()=>readPlanCommand({schemaVersion:1,action:'read_draft_dependencies_v1',draftId:id,contentRevision:0,assignmentRevision:0,useHead:1}));
 for(const limit of [0,101,null])assert.throws(()=>readCareCommand({schemaVersion:1,action:'read_use_history_v1',product:null,cursor:null,limit}));
});
test('positive receipt/status mapping rejects private additions and request mismatches',()=>{
 const receipt={requestId:id,event:{kind:'use',id},revision:1,recordedAt:'2026-01-01T00:00:00Z',notificationEventId:null};
 assert.deepEqual(mapCareResult(receipt,readCareCommand(use)),receipt);
 assert.throws(()=>mapCareResult({...receipt,privateNote:'private'},readCareCommand(use)));
 assert.throws(()=>mapCareResult({...receipt,requestId:'10000000-0000-4000-8000-000000000002'},readCareCommand(use)));
 assert.throws(()=>mapCareResult({status:'committed',receipt:{schemaVersion:2,use:{}}},readCareCommand({schemaVersion:1,action:'request_status_v1',requestId:id})));
});
test('v2 keeps strict rich immutable document and original receipt meanings',async()=>{
 const {createEmptyPlanContent,projectClientPlan}=await import('../src/contracts/PortalRebuild.ts');
 const content=projectClientPlan(createEmptyPlanContent());
 const view={schemaVersion:2,access:'active',plan:{documentSchemaVersion:3,version:1,publishedAt:'2026-01-01T00:00:00Z',content},decisionRevision:0,decisions:[],actualUse:[],nextReviewOn:null,use:{revision:0,planProducts:[],reportedProducts:{items:[],nextCursor:null}},latestPublicReview:null};
 const command=readCareCommand({schemaVersion:1,action:'read_client_plan_v2',version:1});
 assert.deepEqual(mapCareResult(view,command),view);
 assert.throws(()=>mapCareResult({...view,latestPublicReview:{reviewId:id}},command));
 assert.throws(()=>mapCareResult({...view,privateNote:'secret'},command));
 assert.throws(()=>mapCareResult({...view,plan:{...view.plan,version:2}},command));
 const {mapPlanResult}=await import('../src/contracts/PortalRebuildMapping.ts');
 assert.throws(()=>mapPlanResult(view,{schemaVersion:1,action:'read_client_plan_v1',version:1}));
});
test('dependency read binds exact revision while old strict Draft basis cannot widen',async()=>{
 const {mapPlanResult}=await import('../src/contracts/PortalRebuildMapping.ts');
 const command=readPlanCommand({schemaVersion:1,action:'read_draft_dependencies_v1',draftId:id,contentRevision:2,assignmentRevision:1});
 const basis={schemaVersion:2,legacyBasis:{publicationVersion:1,useRevision:23},legacyBasisManifestHash:'a'.repeat(64),useHead:1,reportHead:0,instructionHead:0,references:[]};
 const result={draftId:id,contentRevision:2,assignmentRevision:1,captured:basis,current:basis,needsRebase:false,affectedSections:[]};
 assert.deepEqual(mapPlanResult(result,command),result);
 assert.throws(()=>mapPlanResult({...result,contentRevision:3},command));
 assert.throws(()=>mapPlanResult({...result,captured:{...basis,privateSource:'secret'}},command));
 const rebase={schemaVersion:1,action:'rebase_draft_dependencies_v1',requestId:id,draftId:id,expectedContentRevision:2,expectedAssignmentRevision:1,expectedHeads:{useHead:1,reportHead:0,instructionHead:0},expectedLegacyBasis:{publicationVersion:1,useRevision:23},expectedLegacyBasisManifestHash:'a'.repeat(64)};
 assert.deepEqual(readPlanCommand(rebase),rebase);
 assert.throws(()=>readPlanCommand({...rebase,approved:true}));
});
