import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createEmptyPlanContent, projectClientPlan, adaptLegacyPlan } from '../src/contracts/PortalRebuild.ts';
import { readPlanContent, readPlanCommand, buildPlanRpc } from '../src/contracts/PortalRebuildValidation.ts';
const id='10000000-0000-4000-8000-000000000001';
test('incomplete content is saveable and unknown is distinct from none',()=>{
 const content=createEmptyPlanContent(); assert.deepEqual(readPlanContent(content),content);
 assert.equal(content.context.products.state,'unknown');
 const call=buildPlanRpc({schemaVersion:1,action:'save_draft_v1',requestId:id,draftId:id,expectedContentRevision:0,expectedAssignmentRevision:0,kind:'care_plan',content});
 assert.equal(call.name,'concierge_plan_command_v1');assert.equal(call.args.p_command.action,'save_draft_v1');
});
test('closed commands reject impersonation, proxy, reserved actions and client targeting',()=>{
 for(const value of [
 {schemaVersion:1,action:'read_client_plan_v1',version:null,clientId:id},
 {schemaVersion:1,action:'read_policy_v1',role:'owner'},
 {schemaVersion:1,action:'source_upload_v1'},
 {schemaVersion:1,action:'read_policy_v1',rpc:'concierge_write'},
 {schemaVersion:1,action:'create_draft_v1',requestId:id,kind:'instruction',templateVersionId:null},
 ])assert.throws(()=>readPlanCommand(value),/invalid_input/);
});
test('plain bounded content rejects code, bad URLs and unsupported fields',()=>{
 for(const delta of [{title:'<script>alert(1)</script>'},{buttonLabel:'publish'},{schemaVersion:2}])assert.throws(()=>readPlanContent({...createEmptyPlanContent(),...delta}),/invalid_input/);
 const content=createEmptyPlanContent();content.sources=[{label:'private',url:'https://example.com/storage/v1/object/sign/private?token=secret'}];
 assert.throws(()=>readPlanContent(content),/invalid_input/);
});
test('client allowlist omits private facts, raw source locators and private reference identities',()=>{
 const content=createEmptyPlanContent();content.context.facts=[
 {id:'private-fact',kind:'client_report',visibility:'advisor_only',text:'PRIVATE',sources:[],contradicts:[]},
 {id:'public-fact',kind:'advisor_conclusion',visibility:'client',text:'gentle care',sources:[{sourceId:id,sourceVersion:1,locator:{kind:'text',start:0,end:4}}],contradicts:['private-fact']}];
 content.goals=[{id:'comfort',text:'comfort',factIds:['private-fact','public-fact']}];
 const projection=projectClientPlan(content);const json=JSON.stringify(projection);
 assert.ok(!json.includes('PRIVATE'));assert.ok(!json.includes(id));assert.ok(!json.includes('private-fact'));assert.ok(!json.includes('sourceVersion'));
 assert.deepEqual(projection.context.facts,[{id:'public-fact',kind:'advisor_conclusion',text:'gentle care'}]);
 assert.deepEqual(projection.goals[0].factIds,['public-fact']);
});
test('opaque legacy identities and complete R2 guidance survive the adapter',async()=>{
 const {readFile}=await import('node:fs/promises');const fixture=JSON.parse(await readFile(new URL('./fixtures/concierge-presentation.json',import.meta.url),'utf8'));
 const original={version:7,recommendations:[],presentation:fixture.presentation};
 const adapted=adaptLegacyPlan(original,2);
 assert.deepEqual(adapted.original,original);assert.equal(adapted.documentSchemaVersion,2);
 assert.deepEqual(adapted.content.products.find(p=>p.id===fixture.presentation.categoryCards[0].proposedProduct.id)?.imageUrl,fixture.presentation.categoryCards[0].proposedProduct.imageUrl);
 assert.deepEqual(adapted.content.decisions[0].guidance.comparisons,fixture.presentation.categoryCards[0].comparisons);
 assert.deepEqual(adapted.content.decisions[0].guidance.how,fixture.presentation.categoryCards[0].how);
 assert.deepEqual(adapted.content.consultationSections,fixture.presentation.consultationSections);
 assert.deepEqual(adapted.content.preparation,{by:fixture.presentation.preparedBy,on:fixture.presentation.preparedOn});
 assert.deepEqual(adapted.content.routineGuides,fixture.presentation.routineGuides);
 assert.deepEqual(adapted.content.routine[0].usage,fixture.presentation.baselineRoutine[0].usage);
 assert.deepEqual(adapted.content.decisions[0].usage,fixture.presentation.categoryCards[0].usage);
 assert.equal(adapted.content.context.products.state,'recorded');
 assert.deepEqual(readPlanContent(adapted.content),adapted.content);
});
test('R1 conversion retains exact identifiers and known price only in original financial content',()=>{
 const legacy={version:4,recommendations:[{id:'old-decision',slot:'old-slot',currentProductId:'old-product',proposedProductId:'new-product',priceCents:2500,currency:'USD',rationale:'original rationale'}],presentation:null};
 const adapted=adaptLegacyPlan(legacy,1);assert.deepEqual(adapted.original,legacy);assert.deepEqual(readPlanContent(adapted.content),adapted.content);
 assert.equal(adapted.content.products.find(p=>p.id==='new-product')?.displayPrice,null);
 assert.equal(adapted.content.decisions[0].id,'old-decision');assert.equal(adapted.content.decisions[0].slotId,'old-slot');
});
test('task grants have finite actions and explicit single client or draft scope',()=>{
 const command={schemaVersion:1,action:'grant_task_v1',requestId:id,agentActorId:id,providerSessionId:id,clientId:id,draftId:null,actions:['create_draft_v1','save_draft_v1'],sourceIds:[],expiresAt:'2026-11-01T00:00:00Z'};
 assert.deepEqual(readPlanCommand(command),command);
 for(const delta of [{actions:['confirm_payment']},{clientId:null},{draftId:id},{sourceIds:['not-a-uuid']}])assert.throws(()=>readPlanCommand({...command,...delta}),/invalid_input/);
});
