import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,lstat} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {attestCareFixture,selectCareFixture,requireCareCustody,careNativePins} from '../scripts/rebuild-care-native-fixture.mjs';
import {filteredHistoryCommand} from '../scripts/rebuild-care-native-history.mjs';
import {careClientActions,careAdvisorActions} from '../../../src/contracts/PortalCareValues.ts';
import {syntheticCareContent,createCareCases,careCaseSnapshot} from '../scripts/rebuild-care-native-cases.mjs';
import {prepareSyntheticClaim,closeProviderSession} from '../scripts/rebuild-native-cases.mjs';
import {connectedCareStack} from './rebuild-care-native-stack.mjs';
import {sourceRoot,nodeCookieClient,mailSnapshot,captureCallback} from './rebuild-native-stack.mjs';
import {sha,safePrivateMarkers,portalOrigin} from '../scripts/rebuild-native-boundary.mjs';

const unknown=()=>({state:'unknown'});
const write=(action,fields)=>({schemaVersion:1,action,requestId:randomUUID(),...fields});
const pub=version=>({version,documentSchemaVersion:3});
const product=(version=1)=>({kind:'plan_product',publication:pub(version),productId:'cerave-pm',slotId:'care-slot'});
async function bounded(promise) {let timer;try{return await Promise.race([promise,new Promise((_,reject)=>timer=setTimeout(()=>reject(Error('Native care wait exceeded15s')),15000))]);}finally{clearTimeout(timer);}}

// Called only after the parent supplies reviewed exact source, selection and explicit fresh R7 custody.
// This Node cookie jar does not claim Chrome cookie enforcement or application/UI acceptance.
export async function runCareNativeProof({selection:rawSelection,grant}) {
  const selection=selectCareFixture(rawSelection);requireCareCustody(selection,grant,sourceRoot);
  assert.equal(process.env.SHELV_REBUILD_CARE_NATIVE,'1');assert.equal(process.version,'v22.23.0');
  const runId=randomUUID(),area=path.join(sourceRoot,'.local-artifacts/portal-rebuild',careNativePins.artifactDirectory);
  const result={kind:'genuine-care-node-pkce-cookie-vault-native',runId,status:'RUNNING',checks:[],sourceOnly:false,realEmails:0,realFunds:0,hostedRequests:0,limits:['Node cookie jar, not Chrome enforcement','No actual notification delivery','No label Storage lifecycle','No clock/backdate fiction; exact cutoffs remain separately tested']};
  let fixture,stack,phase='attestation';const releases=[];
  const pass=label=>result.checks.push({label,status:'PASS'});
  const call=async(session,family,action,fields={},status=200)=>{
    const response=await session.client.request(family,{schemaVersion:1,action,...fields},session.csrf);
    if(response.status!==status)result.failureResponse={family,action,expectedStatus:status,actualStatus:response.status,code:typeof response.value?.code==='string'&&/^[a-z_]+$/.test(response.value.code)?response.value.code:null};
    assert.equal(response.status,status,'Actual '+family+'/'+action+' status');return response.value;
  };
  try {
    fixture=await attestCareFixture(sourceRoot,selection,grant);
    assert.equal(fixture.sql('select count(*) from auth.sessions'),'0','Parent fixture must begin with no existing sessions');
    assert.equal(fixture.sql('select count(*) from auth.refresh_tokens'),'0','Parent fixture must begin with no existing refresh rows');
    await mkdir(area,{recursive:true,mode:0o700});
    result.fixture={ownerId:selection.ownerId,projectId:selection.projectId,snapshotSha256:selection.snapshotSha256,ledgerSha256:selection.ledgerSha256,sourceHashesSha256:selection.sourceHashesSha256};
    stack=await connectedCareStack(fixture,grant,sourceRoot);
    phase='explicit synthetic identity setup';result.caseRunId=runId;
    const cases=await createCareCases(fixture,runId);result.clientId=cases.client.id;result.otherId=cases.other.id;result.viewerId=cases.viewer.id;
    async function login(identity,audience,ip) {
      const client=nodeCookieClient(stack,audience,ip);let response=await client.request('session');assert.equal(response.status,200);assert.equal(response.value.signedIn,false);
      const flow=response.value.csrf,before=await mailSnapshot(),returnTo=audience==='client'?'/plan':'/advisor/clients';
      response=await client.request('auth/request',{email:identity.email,remember:false,returnTo},flow);assert.equal(response.status,200);
      let callback=await captureCallback(identity.email,before,returnTo);result.localEmails=(result.localEmails??0)+callback.localEmails;
      response=await client.request('auth/complete',{code:callback.code},flow);callback=null;assert.equal(response.status,200);assert.equal(response.value.ownerId,identity.id);assert.equal(response.value.signedIn,true);
      assert.match(response.headers.get('set-cookie'),new RegExp('__Host-shelv_'+audience+'=.*Secure; HttpOnly; SameSite=Lax'));
      assert.doesNotMatch(JSON.stringify(response.value),/access_token|refresh_token|code_verifier/);
      return {client,csrf:response.value.csrf,ownerId:identity.id};
    }
    phase='real PKCE and initial draft';
    const advisor=await login(fixture.owner,'advisor',1),client=await login(cases.client,'client',2);
    result.sqlite=await stack.inspectVault();assert.ok(result.sqlite.sqliteFiles>0);assert.equal(result.sqlite.activeSessions,2);assert.equal(result.sqlite.credentialEnvelopes,2);
    pass('Both genuine PKCE audiences, actual Mailpit/live contexts/opaque cookie attributes and encrypted persisted SQLite rows');
    const authCount=fixture.sql('select count(*) from auth.users');
    let draftView=await call(advisor,'plans','create_draft_v1',{requestId:randomUUID(),kind:'care_plan',templateVersionId:null});
    const draftId=draftView.draft.id;result.draftId=draftId;
    const draftWrite=view=>({draftId:view.draft.id,expectedContentRevision:view.draft.contentRevision,expectedAssignmentRevision:view.draft.assignmentRevision});
    draftView=await call(advisor,'plans','save_draft_v1',{requestId:randomUUID(),...draftWrite(draftView),kind:'care_plan',content:{...draftView.draft.content,title:'synthetic incomplete care plan'}});
    assert.ok(draftView.issues.length>0);assert.equal(draftView.draft.clientId,null);
    draftView=await call(advisor,'plans','save_draft_v1',{requestId:randomUUID(),...draftWrite(draftView),kind:'care_plan',content:syntheticCareContent()});
    draftView=await call(advisor,'plans','assign_draft_v1',{requestId:randomUUID(),...draftWrite(draftView),fromClientId:null,toClientId:cases.client.id});
    async function reviewAndApprove(view) {
      for(const section of view.sections)await call(advisor,'plans','review_section_v1',{requestId:randomUUID(),...draftWrite(view),sectionId:section.sectionId,sectionHash:section.sectionHash});
      view=await call(advisor,'plans','read_draft_v1',{draftId:view.draft.id});if(view.issues.length)result.readinessIssues=view.issues.map(({section,path,code})=>({section,path,code}));assert.equal(view.issues.length,0);assert.ok(view.sections.every(s=>s.reviewed));
      const approval=await call(advisor,'plans','approve_publication_v1',{requestId:randomUUID(),target:view.target,scope:'care_plan.publish',publisher:{kind:'human',actorId:fixture.owner.id}});
      return {view,approval};
    }
    let reviewed=await reviewAndApprove(draftView);draftView=reviewed.view;result.approvalId=reviewed.approval.id;
    assert.equal(fixture.sql('select count(*) from auth.users'),authCount);
    const beforePayment=careCaseSnapshot(fixture,cases.client.id);assert.equal(beforePayment.publications.length,0);assert.equal(beforePayment.activations.length,0);
    await call(advisor,'plans','publish_plan_v1',{requestId:randomUUID(),target:draftView.target,approvalId:reviewed.approval.id,firstServiceClaimId:null},409);
    pass('Actual incomplete save/full structured one-product save/assignment/five human reviews/exact approval; prepayment publication denies with no Start');
    phase='synthetic service receipt and deliberate publication';
    const claim=await prepareSyntheticClaim(fixture,stack,cases.client);result.quoteId=claim.quoteId;result.claimId=claim.claimId;
    const finance=await advisor.client.request('payments',{schemaVersion:2,action:'advisor_read',clientId:cases.client.id},advisor.csrf);assert.equal(finance.status,200);
    const quote=finance.value.quotes.find(q=>q.id===claim.quoteId);assert.ok(quote);assert.equal(quote.totalCents,10000);assert.equal(quote.productTotalCents,0);
    const confirmed=await advisor.client.request('payments',{schemaVersion:2,action:'confirm_payment',requestId:randomUUID(),clientId:cases.client.id,expectedRevision:finance.value.revision,quoteId:quote.id,quoteVersion:quote.version,shippingAddressVersion:quote.shippingAddressVersion,claimId:claim.claimId,serviceCents:10000,productCents:0,totalCents:10000,paymentOptionId:claim.paymentOptionId,receiptVerified:true},advisor.csrf);assert.equal(confirmed.status,200);
    const gate=await call(advisor,'plans','read_advisor_gate_v1',{target:draftView.target,publisher:{kind:'human',actorId:fixture.owner.id}});assert.equal(gate.approval.id,reviewed.approval.id);
    const paid=careCaseSnapshot(fixture,cases.client.id);assert.equal(paid.publications.length,0);assert.equal(paid.plan_review_schedule.length,0);assert.equal(paid.activations.length,0);
    assert.ok(paid.service_periods.every(row=>row.starts_on===null&&row.ends_on===null),'Receipt alone must not start service');
    assert.ok(paid.payment_confirmations.every(row=>row.service_start===null&&row.service_end===null),'Receipt alone must not supply service clock dates');
    const published=await call(advisor,'plans','publish_plan_v1',{requestId:randomUUID(),target:draftView.target,approvalId:reviewed.approval.id,firstServiceClaimId:claim.claimId});assert.equal(published.firstServiceStarted,true);result.firstPublication=published;
    const initial=careCaseSnapshot(fixture,cases.client.id);assert.equal(initial.publications.length,1);assert.equal(initial.plan_events.length,1);assert.equal(initial.plan_deliveries.length,2);assert.equal(initial.plan_review_schedule.length,1);assert.equal(initial.activations.length,0);
    assert.equal(initial.service_periods.length,1);assert.equal(initial.service_periods[0].ends_on,initial.plan_review_schedule[0].month_one_on);
    const dayParts=new Intl.DateTimeFormat('en-US',{timeZone:'America/Chicago',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(published.publishedAt));
    const part=name=>dayParts.find(p=>p.type===name).value;assert.equal(initial.service_periods[0].starts_on,part('year')+'-'+part('month')+'-'+part('day'));
    assert.equal(Date.parse(initial.plan_review_schedule[0].first_publication_at),Date.parse(published.publishedAt));
    const clockHash=sha(JSON.stringify([initial.service_periods,initial.plan_review_schedule]));
    const moneyHash=sha(JSON.stringify(initial.finance));
    const documentHash=sha(JSON.stringify(initial.plan_documents));
    pass('Actual service-only frozen quote/claim/gross synthetic receipt preserves approval and no clocks until deliberate first publication');
    const read=()=>call(client,'care','read_client_plan_v2',{version:null});
    const history=fields=>call(client,'care','read_use_history_v1',{product:null,cursor:null,limit:100,...fields});
    let view=await read();assert.equal(view.schemaVersion,2);assert.equal(view.use.revision,0);assert.equal(view.use.planProducts[0].state,'not_reported');assert.deepEqual(view.actualUse,[]);
    const careWrite=async(action,fields,session=client)=>call(session,'care',action,{requestId:randomUUID(),expectedUseRevision:(await read()).use.revision,...fields});
    const useFields=(change,p=product())=>({product:p,change,sourcePublication:pub(1),occurredOn:unknown(),channel:'portal',acquisition:'self',identityEventId:null});
    phase='identity unknown Start retries and stop';
    const identity=await careWrite('report_identity_v1',{target:{subject:product(),comparedWith:product()},answer:{match:'yes',reportedName:null,variant:unknown(),strength:unknown(),labelPhotoIds:[]},sourcePublication:pub(1),occurredOn:unknown(),channel:'portal'});
    const start=write('report_product_use_v1',{expectedUseRevision:1,...useFields({kind:'started'}),identityEventId:identity.event.id});
    const started=await call(client,'care',start.action,start);view=await read();assert.equal(view.use.planProducts[0].state,'using');assert.deepEqual(view.use.planProducts[0].originalStart,unknown());assert.equal(view.use.planProducts[0].latestEvent.reportedBy,cases.client.id);assert.equal(view.use.planProducts[0].latestEvent.recordedBy,cases.client.id);
    const retryBefore=careCaseSnapshot(fixture,cases.client.id);assert.deepEqual(await call(client,'care',start.action,start),started);assert.deepEqual(careCaseSnapshot(fixture,cases.client.id),retryBefore);
    await call(client,'care',start.action,{...start,requestId:randomUUID(),expectedUseRevision:0},409);
    assert.deepEqual((await call(client,'care','request_status_v1',{requestId:start.requestId})).receipt,started);
    await careWrite('report_product_use_v1',useFields({kind:'paused',details:'synthetic pause report'}));
    await careWrite('report_product_use_v1',useFields({kind:'different',frequency:unknown(),amount:unknown(),details:'synthetic different-use report'}));
    const stopped=await careWrite('report_product_use_v1',useFields({kind:'stopped',details:'synthetic stop report'}));view=await read();assert.equal(view.use.planProducts[0].state,'stopped');assert.deepEqual(view.use.planProducts[0].originalStart,unknown());
    assert.deepEqual(await call(client,'plans','read_client_plan_v1',{version:null},409),{code:'use_version_required'});
    assert.equal(sha(JSON.stringify(careCaseSnapshot(fixture,cases.client.id).plan_documents)),documentHash);
    pass('Actual v2 identity/self-purchase explicit unknown Start, pause/different/stop, one-event exact retry/status/stale CAS and lossy v1 HTTP409');
    phase='reported descriptor and append-only amendment';
    const descriptor={name:'SYNTHETIC reported different lotion',brand:unknown(),variant:{state:'known',value:'synthetic different variant'},strength:unknown(),sizeLabel:unknown(),labelPhotoIds:[]};
    const reported=await careWrite('report_unreviewed_product_v1',{product:descriptor,sourcePublication:pub(1),occurredOn:unknown(),channel:'portal',acquisition:'self'});result.reportedProduct=reported.product;
    let rows=await history();let creation=rows.entries.find(x=>x.kind==='reported_product'&&x.event.eventId===reported.receipt.event.id);assert.ok(creation);assert.equal(creation.event.initialUse.eventId,creation.event.eventId);assert.equal(creation.event.initialUse.change.kind,'unreviewed_added');assert.deepEqual(creation.event.initialUse.occurredOn,unknown());const originalCreation=structuredClone(creation.event);
    for(const match of ['no','not_sure'])await careWrite('report_identity_v1',{target:{subject:reported.product,comparedWith:product()},answer:{match,reportedName:null,variant:unknown(),strength:unknown(),labelPhotoIds:[]},sourcePublication:pub(1),occurredOn:unknown(),channel:'portal'});
    view=await read();assert.equal(view.use.reportedProducts.items[0].state,'unreviewed');assert.equal(view.use.planProducts[0].state,'stopped');
    await careWrite('amend_use_v1',{eventId:reported.receipt.event.id,expectedAmendmentHeadId:null,replacement:{product:product(),change:{kind:'stopped',details:'synthetic product-changing correction'},sourcePublication:pub(1),occurredOn:unknown(),acquisition:'self',identityEventId:null},reason:'synthetic correction changes reported product reference'});
    rows=await history();creation=rows.entries.find(x=>x.kind==='reported_product'&&x.event.eventId===reported.receipt.event.id);const {amendment,...originalNested}=creation.event.initialUse;const {amendment:oldAmendment,...priorNested}=originalCreation.initialUse;assert.deepEqual(originalNested,priorNested);assert.deepEqual(amendment.replacement.product,product());assert.equal(amendment.amendedBy,cases.client.id);assert.equal(amendment.reason,'synthetic correction changes reported product reference');
    const descriptorCorrection=await careWrite('amend_reported_product_v1',{product:reported.product,replacement:{...descriptor,name:'SYNTHETIC corrected reported lotion'},reason:'synthetic descriptor name correction'});view=await read();const corrected=view.use.reportedProducts.items[0].product;assert.equal(corrected.reportedProductId,reported.product.reportedProductId);assert.equal(corrected.version,2);assert.equal(view.use.reportedProducts.items[0].identity,null);
    rows=await history();const correctionRow=rows.entries.find(x=>x.kind==='reported_product'&&x.event.eventId===descriptorCorrection.event.id);assert.equal(correctionRow.event.initialUse,null);assert.equal(correctionRow.event.previousVersion,1);
    const human=await careWrite('record_client_use_v1',{...useFields({kind:'different',frequency:unknown(),amount:unknown(),details:'synthetic confirmed text report'}),clientId:cases.client.id,confirmedClientReport:true,channel:'text'},advisor);
    rows=await history();const humanRow=rows.entries.find(x=>x.kind==='use'&&x.event.eventId===human.event.id);assert.equal(humanRow.event.reportedBy,cases.client.id);assert.equal(humanRow.event.recordedBy,fixture.owner.id);assert.equal(humanRow.event.channel,'text');
    const photoHead=(await read()).use.revision;
    assert.deepEqual(await call(client,'care','report_identity_v1',{requestId:randomUUID(),expectedUseRevision:photoHead,target:{subject:corrected,comparedWith:product()},answer:{match:'yes',reportedName:null,variant:unknown(),strength:unknown(),labelPhotoIds:[randomUUID()]},sourcePublication:pub(1),occurredOn:unknown(),channel:'portal'},409),{code:'photo_unavailable'});
    assert.equal((await read()).use.revision,photoHead);
    phase='human unreviewed recording and actual reported-product pages';
    const humanDescriptor={...descriptor,name:'SYNTHETIC human-recorded second lotion'};
    const humanReportHead=(await read()).use.revision;
    const humanReportCommand=write('record_client_unreviewed_product_v1',{expectedUseRevision:humanReportHead,clientId:cases.client.id,confirmedClientReport:true,product:humanDescriptor,sourcePublication:pub(1),occurredOn:unknown(),channel:'call',acquisition:'already_owned'});
    const humanAdded=await call(advisor,'care',humanReportCommand.action,humanReportCommand);result.humanReportedProduct=humanAdded.product;
    assert.notEqual(humanAdded.product.reportedProductId,reported.product.reportedProductId);assert.equal(humanAdded.product.version,1);assert.equal(humanAdded.receipt.revision,humanReportHead+1);
    const beforeHumanRetry=careCaseSnapshot(fixture,cases.client.id);assert.deepEqual(await call(advisor,'care',humanReportCommand.action,humanReportCommand),humanAdded);assert.deepEqual(careCaseSnapshot(fixture,cases.client.id),beforeHumanRetry);
    assert.deepEqual((await call(advisor,'care','request_status_v1',{requestId:humanReportCommand.requestId})).receipt,humanAdded);assert.deepEqual(await call(client,'care','request_status_v1',{requestId:humanReportCommand.requestId}),{status:'absent'});
    await call(advisor,'care',humanReportCommand.action,{...humanReportCommand,requestId:randomUUID()},409);
    rows=await history();const humanAddedRow=rows.entries.find(x=>x.kind==='reported_product'&&x.event.eventId===humanAdded.receipt.event.id);assert.ok(humanAddedRow);assert.equal(humanAddedRow.event.reportedBy,cases.client.id);assert.equal(humanAddedRow.event.recordedBy,fixture.owner.id);assert.equal(humanAddedRow.event.channel,'call');assert.deepEqual(humanAddedRow.event.occurredOn,unknown());assert.equal(humanAddedRow.event.initialUse.eventId,humanAddedRow.event.eventId);assert.equal(humanAddedRow.event.initialUse.change.kind,'unreviewed_added');
    const reportedHead=(await read()).use.revision,reportedItems=[],reportedCursors=new Set();let reportedCursor=null,reportedPageCount=0;
    do{assert.ok(++reportedPageCount<=2,'Bounded reported pages must terminate');assert.ok(!reportedCursors.has(reportedCursor),'Repeated reported cursor');reportedCursors.add(reportedCursor);const reportedPage=await call(client,'care','read_reported_products_v1',{cursor:reportedCursor,limit:1,expectedUseRevision:reportedHead,publicationVersion:1});assert.ok(Buffer.byteLength(JSON.stringify(reportedPage))<=400000);assert.equal(reportedPage.revision,reportedHead);reportedItems.push(...reportedPage.items);reportedCursor=reportedPage.nextCursor;assert.ok(reportedItems.length<=2,'Bounded known descriptors must terminate');}while(reportedCursor);
    assert.equal(reportedItems.length,2);assert.deepEqual(new Set(reportedItems.map(x=>x.product.reportedProductId)),new Set([reported.product.reportedProductId,humanAdded.product.reportedProductId]));
    const actualHumanProduct=reportedItems.find(x=>x.product.reportedProductId===humanAdded.product.reportedProductId);assert.equal(actualHumanProduct.state,'unreviewed');assert.deepEqual(actualHumanProduct.originalStart,unknown());assert.deepEqual(actualHumanProduct.descriptor,humanDescriptor);
    await call(client,'care','read_reported_products_v1',{cursor:null,limit:1,expectedUseRevision:reportedHead-1,publicationVersion:1},409);
    await call(client,'care','read_reported_products_v1',{cursor:null,limit:1,expectedUseRevision:reportedHead,publicationVersion:99999},404);
    pass('Actual human unreviewed recording/attribution, same-UUID silent retry/actor-scoped status/stale CAS and complete real reported-product pages without Start');
    const afterReports=careCaseSnapshot(fixture,cases.client.id);assert.equal(sha(JSON.stringify(afterReports.finance)),moneyHash);assert.equal(afterReports.activations.length,0);assert.equal(afterReports.care_events.length,afterReports.useHead);assert.equal(afterReports.care_attention.length,afterReports.useHead);
    assert.equal(afterReports.plan_events.filter(e=>e.source_kind==='care').length,afterReports.useHead);
    pass('Server UUID/version reported descriptor, same-event nested unreviewed creation, no/not-sure, append-only product-changing amendment and real human reporter/recorder attribution; no finance/order/legacy Start');
    phase='bounded actual history pages';
    let page=await history({limit:2}),entries=[...page.entries],cursor=page.nextCursor,historyPageCount=1;const historyCursors=new Set();assert.ok(cursor);assert.ok(Buffer.byteLength(JSON.stringify(page))<=400000);
    while(cursor){assert.ok(++historyPageCount<=12,'Bounded history pages must terminate');assert.ok(!historyCursors.has(cursor),'Repeated history cursor');historyCursors.add(cursor);page=await history({limit:2,cursor});entries.push(...page.entries);cursor=page.nextCursor;assert.ok(Buffer.byteLength(JSON.stringify(page))<=400000);}
    assert.equal(entries.length,(await history()).entries.length);assert.equal(new Set(entries.map(e=>e.kind==='amendment'?e.amendment.id:e.event.eventId)).size,entries.length);
    pass('Few actual immutable history rows paginate completely with originals and separate corrections; no synthetic fake page stress');
    phase='actual filtered client and advisor history CN1 regression';
    const beforeFiltered=careCaseSnapshot(fixture,cases.client.id),entryId=entry=>entry.kind==='amendment'?entry.amendment.id:entry.event.eventId;
    // Unfiltered is a separate control, never a replacement for a failed filtered request.
    assert.deepEqual(await call(advisor,'care','read_advisor_use_history_v1',{clientId:cases.client.id,product:null,cursor:null,limit:100}),await history());
    async function filteredPages(session,audience,filter) {
      let cursor=null,firstCursor=null,pageCount=0;const selected=[],cursors=new Set();
      do{assert.ok(++pageCount<=6,'Bounded filtered pages must terminate');assert.ok(!cursors.has(cursor),'Repeated filtered cursor');cursors.add(cursor);const command=filteredHistoryCommand(audience,{product:filter,cursor,limit:2,...(audience==='advisor'?{clientId:cases.client.id}:{})});const page=await call(session,'care',command.action,command);assert.ok(Buffer.byteLength(JSON.stringify(page))<=400000);if(firstCursor===null&&page.nextCursor)firstCursor=page.nextCursor;selected.push(...page.entries);cursor=page.nextCursor;assert.ok(selected.length<=12,'Bounded actual filtered history must terminate');}while(cursor);
      assert.equal(new Set(selected.map(entryId)).size,selected.length);return {entries:selected,firstCursor};
    }
    const filteredChecks=[{ref:humanAdded.product,count:1,required:humanAdded.receipt.event.id},{ref:corrected,count:1,required:descriptorCorrection.event.id},{ref:reported.product,count:3,required:reported.receipt.event.id}];
    for(const expected of filteredChecks){const c=await filteredPages(client,'client',expected.ref),a=await filteredPages(advisor,'advisor',expected.ref);assert.deepEqual(a.entries,c.entries);assert.equal(c.entries.length,expected.count);assert.ok(c.entries.some(e=>entryId(e)===expected.required));}
    const planFilter={...product(),slotId:null},filteredPlan=await filteredPages(client,'client',planFilter),advisorPlanHistory=await filteredPages(advisor,'advisor',planFilter);assert.deepEqual(advisorPlanHistory.entries,filteredPlan.entries);assert.equal(filteredPlan.entries.length,8);assert.ok(filteredPlan.firstCursor);
    const planIds=new Set(filteredPlan.entries.map(entryId));for(const id of [identity.event.id,started.event.id,stopped.event.id,reported.receipt.event.id,human.event.id])assert.ok(planIds.has(id));for(const id of [descriptorCorrection.event.id,humanAdded.receipt.event.id])assert.ok(!planIds.has(id));
    await call(client,'care','read_use_history_v1',{product:humanAdded.product,cursor:filteredPlan.firstCursor,limit:2},409);
    assert.deepEqual(careCaseSnapshot(fixture,cases.client.id),beforeFiltered,'Filtered reads/denials must not mutate committed rows');
    result.filteredHistory={clientAdvisorEqual:true,planItems:8,originalReportedItems:3,correctedReportedItems:1,humanRecordedItems:1};
    pass('Actual product-filtered client/advisor HTTP200 pages match exact IDs/versions/original-amendment context and exclude unrelated unamended/correction rows; no all-history fallback');
    phase='dependency invalidation rebase and publication carry';
    draftView=await call(advisor,'plans','restore_publication_v1',{requestId:randomUUID(),clientId:cases.client.id,publicationVersion:1,expectedWorkingDraftId:null});
    const originalText=structuredClone(draftView.draft.content);reviewed=await reviewAndApprove(draftView);draftView=reviewed.view;
    const dependencyFields=()=>({draftId:draftView.draft.id,contentRevision:draftView.draft.contentRevision,assignmentRevision:draftView.draft.assignmentRevision});
    const captured=await call(advisor,'plans','read_draft_dependencies_v1',dependencyFields());assert.equal(captured.needsRebase,false);
    const finalStop=await careWrite('report_product_use_v1',useFields({kind:'stopped',details:'synthetic current stop invalidates draft'}));
    assert.deepEqual(await call(client,'care','read_use_history_v1',{product:planFilter,cursor:filteredPlan.firstCursor,limit:2},409),{code:'cursor_conflict'});
    const current=await call(advisor,'plans','read_draft_dependencies_v1',dependencyFields());assert.equal(current.needsRebase,true);
    assert.equal((await call(advisor,'plans','read_advisor_gate_v1',{target:draftView.target,publisher:{kind:'human',actorId:fixture.owner.id}})).approval,null);
    const rebase=dep=>({requestId:randomUUID(),...draftWrite(draftView),expectedHeads:{useHead:dep.useHead,reportHead:dep.reportHead,instructionHead:dep.instructionHead},expectedLegacyBasis:dep.legacyBasis,expectedLegacyBasisManifestHash:dep.legacyBasisManifestHash});
    await call(advisor,'plans','rebase_draft_dependencies_v1',rebase(captured.current),409);
    const previousRevision=draftView.draft.contentRevision;draftView=await call(advisor,'plans','rebase_draft_dependencies_v1',rebase(current.current));assert.equal(draftView.draft.contentRevision,previousRevision+1);assert.deepEqual(draftView.draft.content,originalText);assert.ok(draftView.sections.some(s=>!s.reviewed));
    reviewed=await reviewAndApprove(draftView);draftView=reviewed.view;const headBeforePublish=(await read()).use.revision;
    const later=await call(advisor,'plans','publish_plan_v1',{requestId:randomUUID(),target:draftView.target,approvalId:reviewed.approval.id,firstServiceClaimId:null});assert.equal(later.firstServiceStarted,false);assert.equal(later.publicationVersion,2);
    view=await read();assert.equal(view.use.revision,headBeforePublish);assert.equal(view.use.planProducts[0].state,'stopped');assert.equal(view.use.planProducts[0].latestEvent.eventId,finalStop.event.id);assert.deepEqual(view.use.planProducts[0].latestEvent.product,product());assert.equal(view.use.planProducts[0].identity,null);assert.deepEqual(view.use.planProducts[0].originalStart,unknown());
    const afterLater=careCaseSnapshot(fixture,cases.client.id);assert.equal(sha(JSON.stringify([afterLater.service_periods,afterLater.plan_review_schedule])),clockHash);assert.equal(afterLater.activations.length,0);
    pass('Care head invalidates reviewed draft/exact approval; deliberate stale-CAS refusal/rebase preserves text/new revision, new human reviews/later publication retains original clock/stop/slot/unknown Start without identity carry');
    phase='changed immutable descriptor does not carry use';
    draftView=await call(advisor,'plans','restore_publication_v1',{requestId:randomUUID(),clientId:cases.client.id,publicationVersion:2,expectedWorkingDraftId:null});
    const changed=structuredClone(draftView.draft.content);changed.products[0].variant='synthetic descriptor changed for software verification';
    draftView=await call(advisor,'plans','save_draft_v1',{requestId:randomUUID(),...draftWrite(draftView),kind:'care_plan',content:changed});reviewed=await reviewAndApprove(draftView);draftView=reviewed.view;
    const changedPublication=await call(advisor,'plans','publish_plan_v1',{requestId:randomUUID(),target:draftView.target,approvalId:reviewed.approval.id,firstServiceClaimId:null});assert.equal(changedPublication.publicationVersion,3);assert.equal(changedPublication.firstServiceStarted,false);
    view=await read();assert.equal(view.use.revision,headBeforePublish);const unresolved=view.use.planProducts[0];assert.equal(unresolved.state,'not_reported');assert.equal(unresolved.contradiction,true);assert.deepEqual(unresolved.originalStart,unknown());assert.equal(unresolved.identity,null);assert.equal(unresolved.latestEvent.eventId,finalStop.event.id);
    pass('Same product ID with changed immutable descriptor is unresolved/contradictory with unknown Start, original event retained and no identity or formula promotion');
    phase='real authorization and logout negatives';
    await call(client,'care','read_client_plan_v2',{version:null,clientId:cases.other.id},400);
    const reflection=await call(client,'care','read_client_plan_v2',{version:null,privateValue:'W6_PRIVATE_SYNTHETIC_ONLY'},400);assert.ok(!JSON.stringify(reflection).includes('W6_PRIVATE_SYNTHETIC_ONLY'));
    assert.equal((await client.client.request('care',{schemaVersion:1,action:'read_client_plan_v2',version:null},'wrong-csrf')).status,403);
    assert.equal((await advisor.client.request('care',{schemaVersion:1,action:'read_client_plan_v2',version:null},advisor.csrf)).status,403);
    const wrongAudience=await stack.mf.dispatchFetch(portalOrigin+'/api/advisor/care',{method:'POST',headers:{origin:portalOrigin,cookie:[...client.client.cookies].map(([k,v])=>k+'='+v).join('; '),'content-type':'application/json','x-shelv-csrf':client.csrf,'cf-connecting-ip':'192.0.2.2'},body:JSON.stringify({schemaVersion:1,action:'read_advisor_publication_v2',clientId:cases.client.id,version:null})});assert.equal(wrongAudience.status,401);
    const other=await login(cases.other,'client',3);assert.deepEqual(await call(other,'care','request_status_v1',{requestId:start.requestId}),{status:'absent'});
    await call(other,'care','amend_use_v1',{requestId:randomUUID(),expectedUseRevision:headBeforePublish,eventId:started.event.id,expectedAmendmentHeadId:null,replacement:{product:product(),change:{kind:'stopped',details:null},sourcePublication:pub(1),occurredOn:unknown(),acquisition:'self',identityEventId:null},reason:'synthetic forbidden cross-owner attempt'},403);
    const viewer=await login(cases.viewer,'advisor',4);const safe=await call(viewer,'care','read_advisor_publication_v2',{clientId:cases.client.id,version:null});assert.equal(safe.clientAccess.canWrite,true);
    for(const marker of safePrivateMarkers)assert.ok(!JSON.stringify(safe).includes(marker));
    const viewerHistory=filteredHistoryCommand('advisor',{clientId:cases.client.id,product:humanAdded.product,limit:2});const viewedHistory=await call(viewer,'care',viewerHistory.action,viewerHistory);assert.equal(viewedHistory.entries.length,1);assert.equal(entryId(viewedHistory.entries[0]),humanAdded.receipt.event.id);
    await call(viewer,'care','record_client_use_v1',{requestId:randomUUID(),expectedUseRevision:headBeforePublish,...useFields({kind:'paused',details:null}),clientId:cases.client.id,confirmedClientReport:true},403);
    fixture.sql(`update concierge.advisors set active=false where user_id='${cases.viewer.id}'`);
    const revoked=await viewer.client.request('care',{schemaVersion:1,action:'read_advisor_publication_v2',clientId:cases.client.id,version:null},viewer.csrf);assert.ok([401,403].includes(revoked.status));result.roleRevocationStatus=revoked.status;
    const held=stack.hold('read_client_plan_v2');releases.push(held.release);const late=client.client.request('care',{schemaVersion:1,action:'read_client_plan_v2',version:null},client.csrf).then(value=>({value}),()=>({failed:true}));await bounded(held.entered);
    try{assert.equal((await client.client.request('logout',{},client.csrf)).status,200);}finally{held.release();}
    const lateResult=await bounded(late);assert.ok(!lateResult.failed);assert.equal(lateResult.value.status,401);
    const fresh=await login(cases.client,'client',5),issued=[...stack.issued.values()].filter(s=>s.ownerId===cases.client.id&&!s.closed).at(-1);assert.ok(issued);await closeProviderSession(fixture,issued);await call(fresh,'care','read_client_plan_v2',{version:null},401);
    pass('Actual owner-selector/CSRF/audience/cross-owner/event-scope/view-only/live grant revocation, acknowledged logout held care401 and supported provider revocation');
    const final=careCaseSnapshot(fixture,cases.client.id);assert.equal(sha(JSON.stringify([final.service_periods,final.plan_review_schedule])),clockHash);assert.equal(sha(JSON.stringify(final.finance)),moneyHash);assert.equal(final.activations.length,0);assert.ok(final.plan_deliveries.every(d=>d.status==='queued'&&d.attempts===0));assert.deepEqual(stack.errors,[]);
    for(const table of ['publications','plan_documents','plan_publication_receipts'])assert.deepEqual(final[table].find(row=>row.version===1),initial[table][0],'Original first publication/receipt/document must remain unchanged');
    result.rows={careEvents:final.care_events.length,useHead:final.useHead,attention:final.care_attention.length,planEvents:final.plan_events.length,deliveries:final.plan_deliveries.length,publications:final.publications.length,legacyStarts:0};result.committedSnapshotSha256=sha(JSON.stringify(final));
    result.positiveCareActions=[...new Set(stack.calls.filter(c=>c.path==='/functions/v1/concierge-care'&&c.status===200).map(c=>c.action))].sort();assert.deepEqual(result.positiveCareActions,[...new Set([...careClientActions,...careAdvisorActions])].sort(),'Every closed care action requires an actual positive native HTTP result');
    await writeFile(path.join(area,'snapshot-'+runId+'.private.json'),JSON.stringify(final,null,2)+'\n',{mode:0o600});
    result.status='PASS';
  } catch(error) {
    result.status='FAIL';result.failurePhase=phase;result.failureKind=error instanceof assert.AssertionError?'assertion':'native-care-failure';
  } finally {
    for(const release of releases)release();
    if(stack){try{result.cleanup=await stack.cleanup();}catch{result.status='FAIL';result.cleanup={status:'FAILED'};}result.sessionIds=[...stack.issued.keys()];result.calls=stack.calls;result.seams=stack.seams;result.errors=stack.errors;try{await stack.dispose();}catch{result.status='FAIL';result.disposeFailed=true;}}
    if(fixture){try{result.fixtureSessionRows=Number(fixture.sql('select count(*) from auth.sessions'));result.fixtureRefreshRows=Number(fixture.sql('select count(*) from auth.refresh_tokens'));if(result.fixtureSessionRows||result.fixtureRefreshRows)result.status='FAIL';const finalAttestation=await attestCareFixture(sourceRoot,selection,grant);result.finalAttestation={...finalAttestation.lineage,helpers:'RUNNING',helperIds:Object.fromEntries(Object.entries(selection.helpers).map(([k,v])=>[k,v.id]))};}catch{result.status='FAIL';result.finalAttestationFailed=true;}}
    await mkdir(area,{recursive:true,mode:0o700});await writeFile(path.join(area,'node-care-result-'+runId+'.json'),JSON.stringify(result,null,2)+'\n',{mode:0o600});
  }
  return result;
}

if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href) {
  assert.equal(process.env.SHELV_REBUILD_CARE_NATIVE,'1','Parent R7 custody and explicit connected opt-in required before reading selection files');
  assert.equal(process.argv.length,4,'Pass exact parent selection JSON and separate custody JSON');
  const read=async file=>{const s=await lstat(file);assert.ok(s.isFile()&&!s.isSymbolicLink());return JSON.parse(await readFile(file,'utf8'));};
  const result=await runCareNativeProof({selection:await read(process.argv[2]),grant:await read(process.argv[3])});console.log(JSON.stringify(result));if(result.status!=='PASS')process.exitCode=1;
}
