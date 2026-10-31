import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,lstat} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {randomUUID} from 'node:crypto';
import {careBrowserRoot,careBrowserPins,requireCareBrowserAuthorization,attestCareBrowserApplication} from './rebuild-care-native-browser-source.mjs';
import {sha,portalOrigin,safePrivateMarkers} from '../scripts/rebuild-native-boundary.mjs';

// Importing this module is source-only. Both independent grants are checked before
// loading the connected journey, reading a fixture or acquiring any browser/runtime.
export async function runCareBrowserProof({selection,grant,chromeGrant}) {
  const authorization=requireCareBrowserAuthorization({selection,grant,chromeGrant},careBrowserRoot);
  assert.equal(process.version,'v22.23.0');assert.equal(process.env.SHELV_REBUILD_CARE_NATIVE,'1');
  assert.equal(process.env.SHELV_REBUILD_CARE_NATIVE_BROWSER,'1','Separate coordinator Chrome grant required');
  const application=await attestCareBrowserApplication();
  const {chromium}=await import('playwright-core');
  const {attestCareFixture}=await import('../scripts/rebuild-care-native-fixture.mjs');
  const {connectedCareStack}=await import('./rebuild-care-native-stack.mjs');
  const {createCareCases,careCaseSnapshot}=await import('../scripts/rebuild-care-native-cases.mjs');
  const {closeProviderSession}=await import('../scripts/rebuild-native-cases.mjs');
  const {signIn,prepareCareBrowserPublication,verifyCareBrowserAssets,call,browserCommand,select,bounded,unknown,publication,planProduct,useFields}=await import('./rebuild-care-native-browser-cases.mjs');
  const {inventoryProtected,verifyProtected,auditCareBrowserResources,ownBrowserProcesses,assertOwnProcessesClosed}=await import('./rebuild-care-native-browser-audit.mjs');
  const runId=randomUUID(),area=path.join(careBrowserRoot,'.local-artifacts/portal-rebuild',careBrowserPins.artifactDirectory,runId);
  const result={kind:'genuine-care-complete-App-browser',runId,status:'RUNNING',sourceOnly:false,application,authorization:{purpose:authorization.purpose,grantId:authorization.grantId,chromeGrantId:authorization.chromeGrantId},checks:[],realEmails:0,hostedRequests:0,realFunds:0,orders:0,limits:['Representative care UI paths, not all13 actions or the full W3 matrix','No actual cancellation/+30 UI cutoff; service-admin RPC is not permitted','Photos[] only, no completed label Storage','Queued notifications, not delivered email','No new clinical guidance, full visual/human/accessibility or release acceptance']};
  let fixture,stack,browser,protectedBefore,phase='pre-resource attestation';const contexts=[],releases=[],pass=label=>result.checks.push({label,status:'PASS'}),setPhase=value=>phase=value;
  try {
    fixture=await attestCareFixture(careBrowserRoot,selection,grant,{purpose:careBrowserPins.purpose});
    assert.equal(fixture.sql('select count(*) from auth.sessions'),'0','Unknown sessions prevent acquisition; never clean them');assert.equal(fixture.sql('select count(*) from auth.refresh_tokens'),'0');
    protectedBefore=await inventoryProtected(fixture.directory);await mkdir(area,{recursive:true,mode:0o700});
    await writeFile(path.join(area,'protected-before.json'),JSON.stringify(protectedBefore,null,2)+'\n',{mode:0o600});
    result.before=await auditCareBrowserResources(fixture);
    stack=await connectedCareStack(fixture,grant,careBrowserRoot,{purpose:careBrowserPins.purpose});
    phase='actual gateway ASSETS/deeplink/header correspondence';result.static=await verifyCareBrowserAssets(stack,application);pass('Actual retained gateway serves exact current App/static/deeplink bytes and security headers; unlisted static path denies');
    phase='new own synthetic case setup';const cases=await createCareCases(fixture,runId);result.clientId=cases.client.id;result.otherId=cases.other.id;result.viewerId=cases.viewer.id;
    browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-proxy-server','--disable-background-networking','--disable-quic','--host-resolver-rules=MAP * ~NOTFOUND']});
    phase='actual advisor PKCE';const advisor=await signIn({browser,stack,contexts,identity:fixture.owner,audience:'advisor',index:1,result});
    const {initial}=await prepareCareBrowserPublication({fixture,stack,advisor,cases,result,setPhase,pass,releases});
    const clocks=sha(JSON.stringify([initial.service_periods,initial.plan_review_schedule])),money=sha(JSON.stringify(initial.finance)),documents=sha(JSON.stringify([initial.plan_documents,initial.publications,initial.plan_publication_receipts]));
    const read=c=>call(c,'client','care','read_client_plan_v2',{version:null});
    phase='actual client PKCE/first v2 read';const client=await signIn({browser,stack,contexts,identity:cases.client,audience:'client',index:2,result}),c=client.page;
    result.sqlite=await stack.inspectVault();assert.ok(result.sqlite.sqliteFiles>0);assert.equal(result.sqlite.activeSessions,2);assert.equal(result.sqlite.credentialEnvelopes,2);
    const firstRead=stack.browserCalls.find(x=>x.path==='/api/client/care'&&x.action==='read_client_plan_v2');assert.equal(firstRead?.status,200);
    assert.equal(stack.browserCalls.some(x=>x.action==='read_client_plan_v1'),false);
    let view=await read(c);assert.equal(view.schemaVersion,2);assert.equal(view.use.revision,0);assert.equal(view.use.planProducts[0].state,'not_reported');assert.deepEqual(view.actualUse,[]);
    assert.equal(await c.locator('[data-plan-routine] [data-product-id="cerave-pm"]').count(),0);
    for(const marker of safePrivateMarkers)assert.ok(!(await c.locator('body').innerText()).includes(marker));
    pass('Actual client App starts with v2 through real PKCE/opaque Chrome cookie/encrypted SQLite and no v1 request, Start or private bytes');

    phase='actual client decision without Start or financial effects';await c.getByRole('button',{name:'review recommendation',exact:true}).click();await c.getByRole('button',{name:'approve product',exact:true}).click();await c.getByText('choice recorded',{exact:true}).waitFor();
    view=await read(c);assert.equal(view.decisions.find(x=>x.decisionId==='care-addition').choice,'approved');assert.equal(view.use.revision,0);assert.equal(view.use.planProducts[0].state,'not_reported');assert.deepEqual(careCaseSnapshot(fixture,cases.client.id),initial);
    pass('Actual deliberate client product decision persists independently without Start, care head, money, orders or service/review-clock changes');

    phase='unknown-date self-purchased Start';await c.goto(portalOrigin+'/plan/products/cerave-pm/use?routine=evening');
    await c.getByRole('button',{name:'yes',exact:true}).click();await select(c,'what changed?','started earlier');await select(c,'when did this happen?','date not known');await select(c,'how did you get it?','i bought it myself');
    assert.equal(await c.getByRole('textbox',{name:'anything we should know? (optional)',exact:true}).count(),0);
    const startOffset=client.requests.length;await c.getByRole('button',{name:'record start',exact:true}).click();await c.getByText('use report recorded',{exact:true}).waitFor();
    const startWrites=client.requests.slice(startOffset).filter(x=>x.command.requestId);assert.deepEqual(startWrites.map(x=>[x.command.action,x.command.expectedUseRevision]),[['report_identity_v1',0],['report_product_use_v1',1]]);
    assert.deepEqual(startWrites[1].command.change,{kind:'started'});assert.deepEqual(startWrites[1].command.occurredOn,unknown());assert.equal(startWrites[1].command.acquisition,'self');
    view=await read(c);assert.equal(view.use.planProducts[0].state,'using');assert.deepEqual(view.use.planProducts[0].originalStart,unknown());assert.equal(startWrites[1].command.identityEventId,view.use.planProducts[0].identity.eventId);
    assert.deepEqual(view.plan.content.products[0].formula,'unknown');
    pass('Separate actual identity and explicit self-purchased Start retain unknown occurrence/formula and no fabricated order');

    phase='client native history/routine/opener/nonzero scroll';await c.goto(portalOrigin+'/plan?routine=evening');await c.getByRole('tab',{name:'evening',exact:true,selected:true}).waitFor();
    const opener=c.locator('#plan-product-cerave-pm');await opener.waitFor();await opener.scrollIntoViewIfNeeded();
    const scroll=await c.evaluate(()=>scrollY);assert.ok(scroll>0,'Actual authored long routine must provide nonzero scroll');
    await c.waitForFunction(y=>history.state.shelvNavigation.restore.scrollY===y,scroll);await opener.click();await c.getByRole('dialog').waitFor();
    await c.getByRole('dialog').getByRole('button',{name:'record a change in use',exact:true}).click();
    await select(c,'what changed?','stopped');await select(c,'when did this happen?','date not known');await c.getByRole('textbox',{name:'anything we should know? (optional)',exact:true}).fill('SYNTHETIC retained native navigation note');
    await c.getByRole('button',{name:'back to product',exact:true}).click();await c.getByRole('dialog').waitFor();await c.goForward();
    assert.equal(await c.getByRole('textbox',{name:'anything we should know? (optional)',exact:true}).inputValue(),'SYNTHETIC retained native navigation note');
    const stored=await c.evaluate(()=>JSON.stringify({url:location.href,history:history.state,local:{...localStorage},session:{...sessionStorage}}));assert.ok(!stored.includes('retained native navigation note'));
    await c.goBack();await c.getByRole('dialog').waitFor();await c.keyboard.press('Escape');await c.getByRole('tab',{name:'evening',exact:true,selected:true}).waitFor();await c.waitForFunction(()=>document.activeElement?.id==='plan-product-cerave-pm');
    await c.waitForFunction(y=>scrollY===y,scroll);
    pass('Actual native Back/Forward/Escape retains selected evening routine, unsent memory, original opener and nonzero scroll without sensitive history/storage');

    phase='Stop without identity/approval/order/photo prerequisite';await c.goto(portalOrigin+'/plan/products/cerave-pm/use?routine=evening');await select(c,'what changed?','stopped');await select(c,'when did this happen?','date not known');
    await c.getByRole('textbox',{name:'anything we should know? (optional)',exact:true}).fill('SYNTHETIC actual stop details');const stopOffset=client.requests.length;
    await c.getByRole('button',{name:'record change',exact:true}).click();await c.getByText('use report recorded',{exact:true}).waitFor();
    const stopWrites=client.requests.slice(stopOffset).filter(x=>x.command.requestId);assert.equal(stopWrites.length,1);assert.equal(stopWrites[0].command.action,'report_product_use_v1');assert.equal(stopWrites[0].command.identityEventId,null);assert.deepEqual(stopWrites[0].command.change,{kind:'stopped',details:'SYNTHETIC actual stop details'});
    view=await read(c);assert.equal(view.use.planProducts[0].state,'stopped');await c.reload();await c.getByText('record actual use',{exact:true}).first().waitFor();
    pass('Actual Stop persists details/unknown date with no identity answer, photo or purchase approval requirement');

    phase='mismatch/no and not-sure four-step server descriptor flows';result.reportedProducts=[];
    for(const match of ['no','not sure']) {
      await c.goto(portalOrigin+'/plan/products/cerave-pm/use?routine=evening');await c.getByRole('button',{name:match,exact:true}).click();await select(c,'what changed?','started earlier');await select(c,'when did this happen?','date not known');await select(c,'how did you get it?','i bought it myself');
      const name='SYNTHETIC '+match+' different lotion '+runId.slice(0,8);await c.getByRole('textbox',{name:'product name',exact:true}).fill(name);const offset=client.requests.length,head=(await read(c)).use.revision;
      await c.getByRole('button',{name:'record start',exact:true}).click();await c.getByText('use report recorded',{exact:true}).waitFor();
      const writes=client.requests.slice(offset).filter(x=>x.command.requestId);assert.deepEqual(writes.map(x=>x.command.action),['report_identity_v1','report_unreviewed_product_v1','report_identity_v1','report_product_use_v1']);assert.deepEqual(writes.map(x=>x.command.expectedUseRevision),[head,head+1,head+2,head+3]);
      view=await read(c);const reported=view.use.reportedProducts.items.find(x=>x.descriptor.name===name);assert.ok(reported);assert.equal(reported.product.version,1);assert.match(reported.product.reportedProductId,/^[0-9a-f-]{36}$/);assert.equal(reported.state,'unreviewed');assert.deepEqual(reported.originalStart,unknown());
      assert.deepEqual(writes[2].command.target.subject,reported.product);assert.deepEqual(writes[3].command.product,reported.product);assert.ok(view.plan.content.products.every(x=>x.name!==name));assert.equal(view.use.planProducts[0].state,'stopped');result.reportedProducts.push(reported.product);
      await c.goto(portalOrigin+'/plan/products/'+reported.product.reportedProductId+'?routine=evening');await c.getByRole('dialog').getByRole('heading',{name,exact:true}).waitFor();await c.getByRole('dialog').getByRole('button',{name:'record a change in use',exact:true}).click();await c.reload();await c.getByRole('heading',{name,exact:true}).waitFor();await c.getByRole('button',{name:'back to product',exact:true}).click();await c.getByRole('dialog').getByRole('heading',{name,exact:true}).waitFor();
    }
    await c.goto(portalOrigin+'/plan/use?routine=evening');await c.getByRole('textbox',{name:'product name',exact:true}).fill('SYNTHETIC general route lotion');const generalOffset=client.requests.length;await c.getByRole('button',{name:'record change',exact:true}).click();await c.getByText('use report recorded',{exact:true}).waitFor();assert.deepEqual(client.requests.slice(generalOffset).filter(x=>x.command.requestId).map(x=>x.command.action),['report_unreviewed_product_v1']);
    pass('Actual no/not-sure four-step flows and general report route retain server UUID/version/unreviewed identity, deep-link/reload/Back and no dummy PlanContent product');

    phase='actual human recording/amendment plus shared selected-report history';
    const human=await call(advisor.page,'advisor','care','record_client_use_v1',{requestId:randomUUID(),expectedUseRevision:(await read(c)).use.revision,...useFields({kind:'different',frequency:{state:'known',value:'SYNTHETIC original frequency'},amount:unknown(),details:'SYNTHETIC immutable original report'}),clientId:cases.client.id,confirmedClientReport:true,channel:'text'});
    const correction=await call(advisor.page,'advisor','care','amend_use_v1',{requestId:randomUUID(),expectedUseRevision:(await read(c)).use.revision,eventId:human.event.id,expectedAmendmentHeadId:null,replacement:{product:planProduct,change:{kind:'different',frequency:unknown(),amount:{state:'known',value:'SYNTHETIC corrected amount'},details:'SYNTHETIC correction details'},sourcePublication:publication,occurredOn:unknown(),acquisition:'self',identityEventId:null},reason:'SYNTHETIC retained correction reason'});
    result.humanEventId=human.event.id;result.amendmentId=correction.event.id;
    await c.goto(portalOrigin+'/plan/products/cerave-pm?routine=evening');const dialog=c.getByRole('dialog');await dialog.getByText(/correction by advisor/).waitFor();await dialog.getByRole('button',{name:'view original report',exact:true}).click();
    for(const text of ['SYNTHETIC immutable original report','frequency: SYNTHETIC original frequency','amount: not known','SYNTHETIC correction details','frequency: not known','amount: SYNTHETIC corrected amount','SYNTHETIC retained correction reason'])await dialog.getByText(text,{exact:true}).waitFor();
    assert.match(await dialog.innerText(),/reported by client · recorded by advisor · text/);assert.match(await dialog.innerText(),/correction by advisor · amended/);
    const history=await call(c,'client','care','read_use_history_v1',{product:planProduct,cursor:null,limit:100});const original=history.entries.find(x=>x.kind==='use'&&x.event.eventId===human.event.id);assert.equal(original.event.recordedBy,fixture.owner.id);assert.equal(original.event.reportedBy,cases.client.id);assert.equal(original.event.amendment.amendedBy,fixture.owner.id);assert.equal(original.event.amendment.id,correction.event.id);
    pass('Ordinary actual human recording/amendment persists originals, actor/channel/dates and full correction, rendered through UseFacts and original-product filtered history');

    phase='actual App canonical advisor v2 audit';await advisor.page.goto(portalOrigin+'/advisor/clients/'+cases.client.id+'?task=history');await advisor.page.getByRole('button',{name:'read current publication',exact:true}).click();await advisor.page.getByRole('heading',{name:'published plan record',exact:true}).waitFor();await advisor.page.getByRole('heading',{name:'current reported use',exact:true}).waitFor();
    assert.match(await advisor.page.locator('main').innerText(),/correction by advisor/);assert.equal(await advisor.page.getByRole('button',{name:'record a change in use',exact:true}).count(),0);assert.equal(await advisor.page.getByRole('button',{name:'record change',exact:true}).count(),0);assert.equal(stack.browserCalls.some(x=>x.action==='read_advisor_publication_v1'),false);
    pass('Actual advisor App reads canonical v2/shared use facts with no client entitlement fabrication or care-write controls');

    phase='real CAS conflict with ordinary concurrent event';await c.goto(portalOrigin+'/plan/products/cerave-pm/use?routine=evening');await select(c,'what changed?','stopped');await select(c,'when did this happen?','date not known');await c.getByRole('textbox',{name:'anything we should know? (optional)',exact:true}).fill('SYNTHETIC retained conflict intent');
    let intercepted=false,concurrent;
    const inject=async route=>{const request=route.request();if(request.method()==='POST'&&request.postDataJSON()?.action==='report_product_use_v1'&&!intercepted){intercepted=true;const pending=request.postDataJSON();concurrent=await call(advisor.page,'advisor','care','record_client_use_v1',{requestId:randomUUID(),expectedUseRevision:pending.expectedUseRevision,...useFields({kind:'paused',details:'SYNTHETIC actual concurrent report'}),clientId:cases.client.id,confirmedClientReport:true,channel:'call'});}await route.fallback();};
    await client.context.route('**/api/client/care',inject);const conflictOffset=client.requests.length;
    try {await c.getByRole('button',{name:'record change',exact:true}).click();await c.getByText('plan or use changed',{exact:true}).waitFor();}finally{await client.context.unroute('**/api/client/care',inject);}
    assert.ok(intercepted&&concurrent);const rejected=client.requests.slice(conflictOffset).find(x=>x.command.action==='report_product_use_v1');assert.ok(rejected);assert.ok(stack.calls.some(x=>x.action==='report_product_use_v1'&&x.status===409));
    assert.equal(await c.getByRole('textbox',{name:'anything we should know? (optional)',exact:true}).inputValue(),'SYNTHETIC retained conflict intent');
    await c.getByRole('button',{name:'review latest plan',exact:true}).click();await c.getByRole('button',{name:'i’ve reviewed this plan',exact:true}).waitFor();assert.equal(client.requests.slice(conflictOffset).filter(x=>x.command.action==='report_product_use_v1').length,1);
    await c.getByRole('button',{name:'i’ve reviewed this plan',exact:true}).click();await c.getByRole('button',{name:'continue reviewed report',exact:true}).click();await c.getByText('use report recorded',{exact:true}).waitFor();
    const conflictWrites=client.requests.slice(conflictOffset).filter(x=>x.command.action==='report_product_use_v1');assert.equal(conflictWrites.length,2);assert.notEqual(conflictWrites[0].command.requestId,conflictWrites[1].command.requestId);assert.equal(conflictWrites[1].command.expectedUseRevision,concurrent.revision);assert.deepEqual(conflictWrites[1].command.change,conflictWrites[0].command.change);result.conflict={rejectedRequestId:rejected.command.requestId,concurrentEventId:concurrent.event.id,retriedRequestId:conflictWrites[1].command.requestId};
    pass('Unchanged original request receives real SQL CAS409 after an ordinary concurrent advisor event; successful current fetch and deliberate same-basis review preserve intent before a new retry');

    phase='actual committed uncertain response and exact same-request retry';await c.goto(portalOrigin+'/plan/products/cerave-pm?routine=evening');await c.getByRole('dialog').getByRole('button',{name:'record a change in use',exact:true}).click();await select(c,'what changed?','stopped');await select(c,'when did this happen?','date not known');await c.getByRole('textbox',{name:'anything we should know? (optional)',exact:true}).fill('SYNTHETIC exact uncertain payload');
    const held=stack.hold('report_product_use_v1');releases.push(held.release);const uncertainOffset=client.requests.length;
    await c.getByRole('button',{name:'record change',exact:true}).click();await bounded(held.entered);
    const committed=client.requests.slice(uncertainOffset).find(x=>x.command.action==='report_product_use_v1');assert.ok(committed);const beforeRetry=careCaseSnapshot(fixture,cases.client.id);
    await c.getByRole('button',{name:'back to product',exact:true}).click();await c.getByRole('dialog').waitFor();await c.goForward();await c.getByText('report result uncertain',{exact:true}).waitFor();await c.getByRole('button',{name:'retry same report',exact:true}).click();await c.getByText('use report recorded',{exact:true}).waitFor();held.release();
    const uncertainWrites=client.requests.slice(uncertainOffset).filter(x=>x.command.action==='report_product_use_v1');assert.equal(uncertainWrites.length,2);assert.equal(uncertainWrites[0].wire,uncertainWrites[1].wire);assert.deepEqual(careCaseSnapshot(fixture,cases.client.id),beforeRetry);result.uncertain={requestId:committed.command.requestId,wireSha256:committed.sha256};
    pass('Held genuine committed reply plus native remount becomes uncertain; exact UUID/payload retry succeeds once with identical persisted rows and no response rewrite');

    phase='owner/audience/CSRF/view-only/logout/provider negatives';
    await call(c,'client','care','read_client_plan_v2',{version:null,clientId:cases.other.id},400);
    assert.equal((await browserCommand(c,'client','care',{schemaVersion:1,action:'read_client_plan_v2',version:null},{'x-shelv-csrf':'wrong'})).status,403);
    await call(c,'advisor','care','read_advisor_publication_v2',{clientId:cases.client.id,version:null},401);
    const other=await signIn({browser,stack,contexts,identity:cases.other,audience:'client',index:3,result,preparation:true});assert.equal((await read(other.page)).plan,null);
    await call(other.page,'client','care','amend_use_v1',{requestId:randomUUID(),expectedUseRevision:(await read(c)).use.revision,eventId:human.event.id,expectedAmendmentHeadId:correction.event.id,replacement:{product:planProduct,change:{kind:'stopped',details:null},sourcePublication:publication,occurredOn:unknown(),acquisition:'unknown',identityEventId:null},reason:'SYNTHETIC forbidden other-owner attempt'},403);
    const viewer=await signIn({browser,stack,contexts,identity:cases.viewer,audience:'advisor',index:4,result});
    const safe=await call(viewer.page,'advisor','care','read_advisor_publication_v2',{clientId:cases.client.id,version:null});assert.equal(safe.schemaVersion,2);for(const marker of safePrivateMarkers)assert.ok(!JSON.stringify(safe).includes(marker));
    await call(viewer.page,'advisor','care','record_client_use_v1',{requestId:randomUUID(),expectedUseRevision:(await read(c)).use.revision,...useFields({kind:'stopped',details:null}),clientId:cases.client.id,confirmedClientReport:true},403);
    fixture.sql(`update concierge.advisors set active=false where user_id='${cases.viewer.id}'`);await viewer.page.reload();await viewer.page.getByRole('button',{name:'send sign-in link',exact:true}).waitFor();
    const lateHold=stack.hold('read_client_plan_v2');releases.push(lateHold.release);const late=browserCommand(c,'client','care',{schemaVersion:1,action:'read_client_plan_v2',version:null});await bounded(lateHold.entered);
    const signedOut=c.waitForResponse(r=>new URL(r.url()).pathname==='/api/client/logout'&&r.request().method()==='POST');await c.getByRole('button',{name:'sign out',exact:true}).click();await c.getByRole('button',{name:'send sign-in link',exact:true}).waitFor();assert.equal((await signedOut).status(),200);lateHold.release();assert.ok([401,403].includes((await bounded(late)).status));
    const otherSession=[...stack.issued.values()].find(x=>x.ownerId===cases.other.id&&!x.closed);assert.ok(otherSession);await closeProviderSession(fixture,otherSession);await other.page.reload();await other.page.getByRole('button',{name:'send sign-in link',exact:true}).waitFor();
    pass('Actual owner isolation, wrong audience/CSRF, view-only denial/live role revocation, acknowledged logout held-reply rejection and supported provider logout');

    phase='immutable money/clocks/publication/private response evidence';const final=careCaseSnapshot(fixture,cases.client.id);
    assert.equal(sha(JSON.stringify(final.finance)),money);assert.equal(sha(JSON.stringify([final.service_periods,final.plan_review_schedule])),clocks);assert.equal(sha(JSON.stringify([final.plan_documents,final.publications,final.plan_publication_receipts])),documents);assert.equal(final.activations.length,0);assert.equal(final.care_events.length,final.useHead);assert.equal(final.care_attention.length,final.useHead);assert.ok(final.plan_deliveries.every(d=>d.status==='queued'&&d.attempts===0));
    assert.equal(stack.browserCalls.some(x=>x.action==='read_client_plan_v1'),false);assert.ok(stack.browserScan.clientResponses>0&&stack.browserScan.safePreviewResponses>0&&stack.browserScan.advisorPrivateDraftResponses>0);assert.equal(stack.browserScan.credentialLeaks,0);assert.equal(stack.browserScan.privateFactLeaks,0);assert.deepEqual(stack.errors,[]);
    result.rows={careEvents:final.useHead,publications:final.publications.length,legacyActivations:final.activations.length,deliveries:final.plan_deliveries.length};result.snapshotSha256=sha(JSON.stringify(final));result.requestProofs=client.requests.filter(x=>x.command.requestId).map(x=>({action:x.command.action,requestId:x.command.requestId,expectedUseRevision:x.command.expectedUseRevision,wireSha256:x.sha256}));
    await writeFile(path.join(area,'snapshot.private.json'),JSON.stringify(final,null,2)+'\n',{mode:0o600});result.status='PASS';
  } catch(error) {result.status='FAIL';result.failure={phase,kind:error instanceof assert.AssertionError?'assertion':'browser-or-native-failure',code:typeof error.code==='string'&&/^[A-Z_]+$/.test(error.code)?error.code:null};if(error instanceof assert.AssertionError){result.failure.operator=error.operator;for(const key of ['actual','expected'])if(error[key]===null||['number','boolean'].includes(typeof error[key]))result.failure[key]=error[key];}}
  finally {
    for(const release of releases)release();
    let ownedProcesses=[];try{ownedProcesses=ownBrowserProcesses();}catch{result.status='FAIL';result.processInventoryFailed=true;}
    for(const context of contexts)try{await context.close();}catch{result.status='FAIL';result.contextCloseFailed=true;}
    try{await browser?.close();}catch{result.status='FAIL';result.browserCloseFailed=true;}
    if(stack){try{result.cleanup=await stack.cleanup();}catch{result.status='FAIL';result.cleanup={status:'FAILED'};}result.sessionIds=[...stack.issued.values()].map(x=>({id:x.id,ownerId:x.ownerId,closed:x.closed}));result.calls=stack.calls;result.browserCalls=stack.browserCalls;result.browserResponseScan=stack.browserScan;result.seams=stack.seams;result.errors=stack.errors;try{await stack.dispose();}catch{result.status='FAIL';result.disposeFailed=true;}}
    if(fixture){try{if(result.clientId){const retained=careCaseSnapshot(fixture,result.clientId);await mkdir(area,{recursive:true,mode:0o700});await writeFile(path.join(area,'retained-attempt-snapshot.private.json'),JSON.stringify(retained,null,2)+'\n',{mode:0o600});result.retainedAttemptSnapshotSha256=sha(JSON.stringify(retained));}const last=await attestCareFixture(careBrowserRoot,selection,grant,{purpose:careBrowserPins.purpose});result.after=await auditCareBrowserResources(last);if(protectedBefore)result.protected=await verifyProtected(fixture.directory,protectedBefore);assert.equal(result.after.sessions,0);assert.equal(result.after.refreshTokens,0);}catch{result.status='FAIL';result.finalAuditFailed=true;}}
    try{result.processes=assertOwnProcessesClosed(ownedProcesses);}catch{result.status='FAIL';result.processCloseFailed=true;}
    await mkdir(area,{recursive:true,mode:0o700});await writeFile(path.join(area,'browser-result.json'),JSON.stringify(result,null,2)+'\n',{mode:0o600});
  }
  return result;
}

if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href) {
  assert.equal(process.env.SHELV_REBUILD_CARE_NATIVE,'1');assert.equal(process.env.SHELV_REBUILD_CARE_NATIVE_BROWSER,'1');assert.equal(process.argv.length,5,'Pass exact selection, separate R7 grant and separate Chrome grant JSON');
  const read=async file=>{const info=await lstat(file);assert.ok(info.isFile()&&!info.isSymbolicLink());assert.equal(info.mode&0o077,0);return JSON.parse(await readFile(file,'utf8'));};
  const result=await runCareBrowserProof({selection:await read(process.argv[2]),grant:await read(process.argv[3]),chromeGrant:await read(process.argv[4])});
  console.log(JSON.stringify({kind:result.kind,runId:result.runId,status:result.status,checks:result.checks,rows:result.rows,cleanup:result.cleanup,failure:result.failure,finalAuditFailed:result.finalAuditFailed}));if(result.status!=='PASS')process.exitCode=1;
}
