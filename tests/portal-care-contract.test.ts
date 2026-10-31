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
test('current projection is bounded by actual products and provider byte budget',async()=>{
 const values=await import('../src/contracts/PortalCareValues.ts');
 assert.equal(values.carePlanProductsMax,50,'one state per document product, never product x slots');
 assert.equal(values.carePageMaxBytes,400000);
 assert.equal(values.careResponseMaxBytes,1800000);
});
test('source-valid near500k UTF8 document keeps all50 paused states plus bounded descriptor page',async()=>{
 const {readFileSync}=await import('node:fs');
 const {createEmptyPlanContent,projectClientPlan}=await import('../src/contracts/PortalRebuild.ts');
 const {readPlanContent}=await import('../src/contracts/PortalRebuildValidation.ts');
 const template=JSON.parse(readFileSync(new URL('./fixtures/concierge-presentation.json',import.meta.url),'utf8')).presentation.categoryCards.find((c:{currentProduct:unknown})=>c.currentProduct).currentProduct;
 const c=createEmptyPlanContent();c.title='maximum valid synthetic';c.context={products:{state:'recorded',productIds:[]},facts:[]};c.goals=[{id:'comfort',text:'comfort',factIds:[]}];c.followUp.criteria=['report changes'];
 for(let i=0;i<50;i++){const pid='p'+String(i).padStart(2,'0')+'x'.repeat(97);c.products.push({...template,id:pid,name:'😀'.repeat(200),brand:'😀'.repeat(100),variant:'😀'.repeat(200),sizeLabel:'😀'.repeat(120),strength:{state:'known',value:'😀'.repeat(200)},category:{state:'known',value:'😀'.repeat(200)},identity:'unresolved',formula:'unknown',factIds:[],guides:[],evidence:[]});}
 c.context={products:{state:'recorded',productIds:c.products.map(p=>p.id)},facts:[]};
 const bytes=(v:unknown)=>new TextEncoder().encode(JSON.stringify(v)).byteLength;
 while(c.consultationSections.length<50&&bytes(c)+16500<499000)c.consultationSections.push({title:'source',body:'😀'.repeat(4000)});
 c.consultationSections.push({title:'last',body:'😀'.repeat(Math.min(4000,Math.floor((498900-bytes(c))/4)))});
 assert.ok(bytes(c)>480000&&bytes(c)<500000);readPlanContent(c);
 const stamp='2026-01-01T00:00:00Z',actor=id,unknownDate={state:'unknown' as const};
 const planProducts=c.products.map(p=>{const ref={kind:'plan_product' as const,publication:{version:1,documentSchemaVersion:3 as const},productId:p.id,slotId:null};const original={...ref,slotId:'s'.repeat(100)};return {product:ref,state:'paused',originalStart:unknownDate,contradiction:false,identity:{eventId:id,target:{subject:original,comparedWith:original},match:'not_sure',sourcePublication:publication,occurredOn:unknownDate,recordedAt:stamp,reportedBy:actor,recordedBy:actor,channel:'call'},latestEvent:{eventId:id,product:original,changeKind:'started',sourcePublication:publication,occurredOn:unknownDate,recordedAt:stamp,reportedBy:actor,recordedBy:actor,channel:'call',acquisition:'self',identityEventId:id,originalActivationId:'9'.repeat(19),amendment:{id,eventId:id,previousAmendmentHeadId:id,product:ref,changeKind:'paused',occurredOn:unknownDate,sourcePublication:publication,acquisition:'self',identityEventId:id,amendedBy:actor,amendedAt:stamp}}};});
 const photos=Array.from({length:100},(_,n)=>'10000000-0000-4000-8000-'+String(n).padStart(12,'0'));
 const descriptor={name:'😀'.repeat(200),brand:{state:'known',value:'😀'.repeat(200)},variant:{state:'known',value:'😀'.repeat(200)},strength:{state:'known',value:'😀'.repeat(200)},sizeLabel:{state:'known',value:'😀'.repeat(200)},labelPhotoIds:photos};
 const row={product:{kind:'client_reported_product',reportedProductId:id,version:1},descriptor,state:'unreviewed',originalStart:unknownDate,latestEvent:null,identity:null,contradiction:false};
 const items:unknown[]=[];while(items.length<100&&bytes({items:[...items,row],nextCursor:null})<399500)items.push(row);
 assert.ok(items.length>1&&items.length<100);
 const view={schemaVersion:2,access:'active',plan:{documentSchemaVersion:3,version:1,publishedAt:stamp,content:projectClientPlan(c)},decisionRevision:0,decisions:[],actualUse:[],nextReviewOn:null,use:{revision:1,planProducts,reportedProducts:{items,nextCursor:'c:'+'a'.repeat(64)+':'+id}},latestPublicReview:null};
 const mapped=mapCareResult(view,readCareCommand({schemaVersion:1,action:'read_client_plan_v2',version:1}));assert.equal((mapped as typeof view).use.planProducts.filter(p=>p.state==='paused').length,50);assert.ok(bytes(mapped)<1800000);assert.ok(bytes(mapped)>900000);
 const omitted={...view,use:{...view.use,planProducts:planProducts.slice(1)}};assert.throws(()=>mapCareResult(omitted,readCareCommand({schemaVersion:1,action:'read_client_plan_v2',version:1})));
 const over={...view,use:{...view.use,reportedProducts:{items:Array.from({length:100},()=>row),nextCursor:null}}};assert.throws(()=>mapCareResult(over,readCareCommand({schemaVersion:1,action:'read_client_plan_v2',version:1})));
});
test('400000 byte UTF8 history page accepts exact boundary and rejects one extra byte',()=>{
 const bytes=(v:unknown)=>new TextEncoder().encode(JSON.stringify(v)).byteLength;
 const entry=(details:string)=>({kind:'use',event:{eventId:id,product,change:{kind:'stopped',details},sourcePublication:publication,occurredOn:unknown,recordedAt:'2026-01-01T00:00:00Z',reportedBy:id,recordedBy:id,channel:'portal',acquisition:'self',identityEventId:null,originalActivationId:null,amendment:null}});
 const page={revision:1,entries:[] as ReturnType<typeof entry>[],nextCursor:null};
 while(bytes({...page,entries:[...page.entries,entry('😀'.repeat(4000)),entry('x')]})<400000)page.entries.push(entry('😀'.repeat(4000)));
 page.entries.push(entry('x'));const missing=400000-bytes(page);const size=missing+1;page.entries[page.entries.length-1].event.change.details='😀'.repeat(Math.floor(size/4))+'x'.repeat(size%4);assert.equal(bytes(page),400000);
 const command=readCareCommand({schemaVersion:1,action:'read_use_history_v1',product:null,cursor:null,limit:100});assert.equal((mapCareResult(page,command) as typeof page).entries.length,page.entries.length);
 page.entries[page.entries.length-1].event.change.details+='x';assert.equal(bytes(page),400001);assert.throws(()=>mapCareResult(page,command));
});
test('slotnull selected-product history includes exact original slot and exact amendment replacement',()=>{
 const original={...product,slotId:'actual-slot'},other={...product,productId:'other-product',slotId:'other-slot'};
 const amendment={id,eventId:id,previousAmendmentHeadId:null,replacement:{product:other,change:{kind:'paused',details:'corrected'},sourcePublication:publication,occurredOn:unknown,acquisition:'self',identityEventId:null},amendedBy:id,amendedAt:'2026-01-02T00:00:00Z',reason:'wrong product'};
 const event={eventId:id,product:original,change:{kind:'started'},sourcePublication:publication,occurredOn:unknown,recordedAt:'2026-01-01T00:00:00Z',reportedBy:id,recordedBy:id,channel:'portal',acquisition:'self',identityEventId:null,originalActivationId:null,amendment};
 const page={revision:2,entries:[{kind:'use',event}],nextCursor:null};
 for(const filter of [{...product,slotId:null},original,{...other,slotId:null},other])assert.deepEqual(mapCareResult(page,readCareCommand({schemaVersion:1,action:'read_use_history_v1',product:filter,cursor:null,limit:10})),page);
 for(const filter of [{...original,slotId:'wrong-slot'},{...other,publication:{...publication,version:2}}])assert.throws(()=>mapCareResult(page,readCareCommand({schemaVersion:1,action:'read_use_history_v1',product:filter,cursor:null,limit:10})));
});
test('amendment history entry binds replacement context and exact descriptor version',()=>{
 const ref={kind:'client_reported_product',reportedProductId:id,version:2};
 const amendment={id,eventId:id,previousAmendmentHeadId:null,replacement:{product:ref,change:{kind:'stopped',details:null},sourcePublication:null,occurredOn:unknown,acquisition:'unknown',identityEventId:null},amendedBy:id,amendedAt:'2026-01-02T00:00:00Z',reason:'correct version'};
 const page={revision:2,entries:[{kind:'amendment',amendment}],nextCursor:null};
 assert.deepEqual(mapCareResult(page,readCareCommand({schemaVersion:1,action:'read_use_history_v1',product:ref,cursor:null,limit:1})),page);
 assert.throws(()=>mapCareResult(page,readCareCommand({schemaVersion:1,action:'read_use_history_v1',product:{...ref,version:1},cursor:null,limit:1})));
});
test('reported descriptor creation has one nested unreviewed original event and corrections have none',()=>{
 const ref={kind:'client_reported_product',reportedProductId:id,version:1},stamp='2026-01-01T00:00:00Z';
 const attr={sourcePublication:null,occurredOn:unknown,recordedAt:stamp,reportedBy:id,recordedBy:id,channel:'portal'};
 const initialUse={...attr,eventId:id,product:ref,change:{kind:'unreviewed_added',details:null},acquisition:'self',identityEventId:null,originalActivationId:null,amendment:null};
 const event={...attr,eventId:id,product:ref,descriptor:{name:'synthetic serum',brand:unknown,variant:unknown,strength:unknown,sizeLabel:unknown,labelPhotoIds:[]},previousVersion:null,reason:null,initialUse};
 const page={revision:1,entries:[{kind:'reported_product',event}],nextCursor:null},command=readCareCommand({schemaVersion:1,action:'read_use_history_v1',product:ref,cursor:null,limit:1});
 assert.deepEqual(mapCareResult(page,command),page);
 for(const change of [{kind:'started'},{kind:'paused',details:null}])assert.throws(()=>mapCareResult({...page,entries:[{kind:'reported_product',event:{...event,initialUse:{...initialUse,change}}}]},command));
 assert.throws(()=>mapCareResult({...page,entries:[{kind:'reported_product',event:{...event,previousVersion:1}}]},command));
 const correction={...event,product:{...ref,version:2},previousVersion:1,reason:'correct descriptor',initialUse:null};assert.equal((mapCareResult({...page,revision:2,entries:[{kind:'reported_product',event:correction}]},readCareCommand({schemaVersion:1,action:'read_use_history_v1',product:correction.product,cursor:null,limit:1})) as typeof page).entries.length,1);
});
