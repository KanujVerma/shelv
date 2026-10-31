import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {chromium} from 'playwright-core';
import {attestFixture} from '../scripts/rebuild-native-fixture.mjs';
import {portalOrigin} from '../scripts/rebuild-native-boundary.mjs';
import {syntheticCases,syntheticContent,prepareSyntheticClaim,closeProviderSession} from '../scripts/rebuild-native-cases.mjs';
import {connectedStack,sourceRoot,artifacts,mailSnapshot,captureCallback} from './rebuild-native-stack.mjs';

// Set only after the coordinator has explicitly allocated the sole Chrome slot.
assert.equal(process.env.SHELV_REBUILD_NATIVE_BROWSER,'1','Explicit coordinator browser grant required');
assert.equal(process.env.SHELV_REBUILD_NATIVE,'1','Explicit fixture custody required');
const fixture=await attestFixture(sourceRoot),stack=await connectedStack(fixture);
const result={kind:'genuine-connected-application-browser',sourceBase:'cdc00bd9b5a0a02e897d67885c368bcd3126fc3c',status:'RUNNING',checks:[],realEmails:0,hostedRequests:0,realFunds:0};
let browser,phase='setup',released;
const contexts=[];const pass=label=>result.checks.push({label,status:'PASS'});
const command=async(page,audience,family,body,override={})=>page.evaluate(async({audience,family,body,override})=>{
  const session=await(await fetch('/api/'+audience+'/session')).json();
  const response=await fetch('/api/'+audience+'/'+family,{method:'POST',headers:{'content-type':'application/json','x-shelv-csrf':session.csrf,...override},body:JSON.stringify(body)});
  return{status:response.status,value:await response.json()};
},{audience,family,body,override});
async function signIn(identity,audience,index,preparation=false,initialRoute=null) {
  phase=audience+' PKCE';
  const context=await browser.newContext({viewport:{width:1440,height:960},serviceWorkers:'block'});contexts.push(context);
  await stack.bind(context,index);const page=await context.newPage();page.setDefaultTimeout(12000);
  const route=initialRoute??(audience==='advisor'?'/advisor/plans':'/plan');
  await page.goto(portalOrigin+route);
  await page.getByRole('textbox',{name:'email',exact:true}).fill(identity.email);
  const before=await mailSnapshot();
  await page.getByRole('button',{name:'send sign-in link',exact:true}).click();
  await page.getByText('check your email',{exact:true}).waitFor();
  let callback=await captureCallback(identity.email,before,route);result.localEmails=(result.localEmails??0)+callback.localEmails;
  await page.goto(callback.url);callback=null;
  await page.waitForURL(portalOrigin+route);
  if(route==='/advisor/clients')await page.getByRole('heading',{name:'clients',exact:true}).waitFor();
  else if(audience==='advisor')await page.getByRole('button',{name:'new plan',exact:true}).waitFor();
  else if(preparation)await page.getByText('your plan is being prepared',{exact:true}).waitFor();
  else await page.getByRole('heading',{name:'your current routine',exact:true}).waitFor();
  assert.equal(new URL(page.url()).search,'');assert.equal(new URL(page.url()).hash,'');
  const cookie=(await context.cookies()).find(c=>c.name==='__Host-shelv_'+audience);
  assert.ok(cookie?.httpOnly&&cookie.secure&&cookie.sameSite==='Lax');assert.equal(cookie.path,'/');
  const storage=await page.evaluate(()=>({local:{...localStorage},session:{...sessionStorage},cookie:document.cookie,history:history.state}));
  assert.doesNotMatch(JSON.stringify(storage),/access_token|refresh_token|code_verifier|__Host-shelv_(advisor|client)=/);
  return {context,page};
}
function persisted(clientId) {
  assert.match(clientId,/^[0-9a-f-]{36}$/);
  const count=query=>Number(fixture.sql(query));
  return{publications:count(`select count(*) from concierge.publications where client_id='${clientId}'`),events:count(`select count(*) from concierge.plan_events where client_id='${clientId}'`),deliveries:count(`select count(*) from concierge.plan_deliveries d join concierge.plan_events e on e.id=d.event_id where e.client_id='${clientId}'`),serviceStarts:count(`select count(*) from concierge.service_periods where client_id='${clientId}' and starts_on is not null`),reviewSchedules:count(`select count(*) from concierge.plan_review_schedule where client_id='${clientId}'`),starts:count(`select count(*) from concierge.activations where client_id='${clientId}'`)};
}
try {
  const cases=await syntheticCases(fixture);result.runId=cases.runId;result.ownedClientIds=[cases.client.id,cases.other.id];result.ownedViewerId=cases.viewer.id;
  browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-proxy-server','--disable-background-networking','--disable-quic','--host-resolver-rules=MAP * ~NOTFOUND']});
  const advisor=await signIn(fixture.owner,'advisor',1),p=advisor.page;
  result.sqlite=await stack.inspectVault();assert.ok(result.sqlite.sqliteFiles>0);assert.equal(result.sqlite.activeSessions,1);assert.equal(result.sqlite.credentialEnvelopes,1);
  pass('Actual app advisor link request and callback establish Secure HttpOnly opaque cookie through genuine Auth and SQLite Vault');
  phase='incomplete unassigned draft';
  const authCount=fixture.sql('select count(*) from auth.users');
  await p.getByRole('button',{name:'new plan',exact:true}).click();
  await p.waitForURL(/\/advisor\/plans\/[0-9a-f-]+\/client-context$/);
  const draftId=new URL(p.url()).pathname.split('/')[3];assert.match(draftId,/^[0-9a-f-]{36}$/);result.draftId=draftId;
  await p.getByRole('textbox',{name:'plan title',exact:true}).fill('SYNTHETIC W6 incomplete work');
  await p.getByText('saved',{exact:true}).waitFor();
  await p.reload();await p.getByRole('textbox',{name:'plan title',exact:true}).waitFor();
  assert.equal(await p.getByRole('textbox',{name:'plan title',exact:true}).inputValue(),'SYNTHETIC W6 incomplete work');
  let view=await command(p,'advisor','plans',{schemaVersion:1,action:'read_draft_v1',draftId});
  assert.equal(view.status,200);assert.equal(view.value.draft.clientId,null);assert.ok(view.value.issues.length>0);
  pass('Actual UI creates an unassigned plan and saves/reloads incomplete work without Auth identity creation');
  phase='strict manual import';
  await p.getByRole('button',{name:'import agent draft',exact:true}).click();
  const raw=p.getByRole('textbox',{name:'plan JSON',exact:true});
  await raw.fill(JSON.stringify({...syntheticContent(),unsupportedCode:'<script>invalid</script>'}));
  await p.getByRole('button',{name:'compare import',exact:true}).click();
  await p.getByText('import must match the plan fields; unsupported fields are not accepted',{exact:true}).waitFor();
  assert.equal(await p.getByRole('button',{name:'apply compared import',exact:true}).count(),0);
  await p.getByRole('button',{name:'import agent draft',exact:true}).click();
  await raw.fill(JSON.stringify(syntheticContent()));
  await p.getByRole('button',{name:'compare import',exact:true}).click();
  await p.getByRole('button',{name:'apply compared import',exact:true}).click();
  await p.getByText('saved',{exact:true}).waitFor();
  view=await command(p,'advisor','plans',{schemaVersion:1,action:'read_draft_v1',draftId});
  assert.equal(view.value.draft.content.title,'synthetic browser verification plan');assert.ok(JSON.stringify(view.value.draft.content).includes('W6_PRIVATE_SYNTHETIC_ONLY'));
  pass('Actual import rejects unsupported/code fields, compares/applies valid safe structured content and persists private synthetic fact');
  phase='deliberate existing assignment';
  await p.getByRole('button',{name:'assign client',exact:true}).click();
  await p.getByRole('combobox',{name:'admitted client'}).click();
  await p.getByRole('option',{name:cases.client.displayName,exact:true}).click();
  await p.getByRole('button',{name:'confirm intended client',exact:true}).click();
  await p.getByText(cases.client.displayName,{exact:true}).first().waitFor();
  view=await command(p,'advisor','plans',{schemaVersion:1,action:'read_draft_v1',draftId});
  assert.equal(view.value.draft.clientId,cases.client.id);assert.equal(fixture.sql('select count(*) from auth.users'),authCount);
  pass('Actual advisor deliberately assigns an already admitted synthetic client; Auth count is unchanged');
  phase='human section review';
  for(const section of ['sources','client-context','decisions','routine','follow-up']) {
    await p.goto(portalOrigin+'/advisor/plans/'+draftId+'/'+section);
    await p.getByRole('button',{name:'mark section reviewed',exact:true}).click();
    await p.getByRole('button',{name:'section reviewed',exact:true}).waitFor();
  }
  view=await command(p,'advisor','plans',{schemaVersion:1,action:'read_draft_v1',draftId});
  assert.ok(view.value.sections.every(s=>s.reviewed));assert.equal(view.value.issues.length,0);
  pass('Five exact current sections are deliberately reviewed through the actual advisor UI and persisted backend');
  phase='preview basis and navigation';
  await p.goto(portalOrigin+'/advisor/plans/'+draftId+'/routine');
  await p.getByRole('button',{name:'open client preview',exact:true}).click();
  await p.getByRole('heading',{name:'draft routine',exact:true}).waitFor();
  assert.equal(new URL(p.url()).pathname,'/advisor/plans/'+draftId+'/preview');
  assert.ok(!(await p.locator('body').innerText()).includes('W6_PRIVATE_SYNTHETIC_ONLY'));
  await p.getByRole('tab',{name:'evening',exact:true}).click();
  await p.getByRole('tab',{name:'evening',exact:true,selected:true}).waitFor();
  await p.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  phase='preview initial scroll capture';
  await p.evaluate(()=>{document.getElementById('portal-content').focus({preventScroll:true});window.scrollTo({top:250,behavior:'instant'});});
  await p.waitForFunction(()=>scrollY===250&&history.state.shelvNavigation.restore.scrollY===250);
  phase='preview recommendation entry';
  await p.getByRole('button',{name:'review recommendation',exact:true}).click();
  await p.getByRole('heading',{name:'synthetic no addition decision',exact:true}).waitFor();
  phase='preview native Back scroll focus';
  await p.goBack();await p.getByRole('heading',{name:'draft routine',exact:true}).waitFor();
  await p.getByRole('tab',{name:'evening',exact:true,selected:true}).waitFor();
  await p.waitForFunction(()=>scrollY===250&&document.activeElement?.hasAttribute('data-page-heading'));
  phase='preview native Forward';
  await p.goForward();await p.getByRole('heading',{name:'synthetic no addition decision',exact:true}).waitFor();
  await p.goBack();await p.getByRole('heading',{name:'draft routine',exact:true}).waitFor();
  assert.ok(!JSON.stringify(await p.evaluate(()=>history.state)).includes('no-addition'));
  await p.getByRole('button',{name:'back to draft',exact:true}).click();
  await p.waitForURL(portalOrigin+'/advisor/plans/'+draftId+'/routine');
  await p.waitForFunction(()=>document.activeElement?.id==='advisor-preview-open-plan');
  const same=await command(p,'advisor','plans',{schemaVersion:1,action:'read_draft_v1',draftId});
  assert.deepEqual(same.value.target,view.value.target);
  pass('Client-safe exact-basis preview uses actual shared renderer, evening routine, native Back/Forward, nonzero scroll/focus and exact editor opener');
  phase='exact approval and before-payment gate';
  await p.goto(portalOrigin+'/advisor/plans/'+draftId+'/review-publish');
  await p.getByRole('button',{name:'refresh publication checks',exact:true}).click();
  await p.getByText('first publication',{exact:true}).waitFor();
  await p.getByRole('button',{name:'approve this exact version',exact:true}).click();
  await p.getByText('revision approved',{exact:true}).waitFor();
  assert.equal(await p.getByRole('button',{name:'publish first plan',exact:true}).isDisabled(),true);
  const gateCommand={schemaVersion:1,action:'read_advisor_gate_v1',target:view.value.target,publisher:{kind:'human',actorId:fixture.owner.id}};
  let gate=await command(p,'advisor','plans',gateCommand);assert.equal(gate.status,200);const approvalId=gate.value.approval.id;result.approvalId=approvalId;
  const denied=await command(p,'advisor','plans',{schemaVersion:1,action:'publish_plan_v1',requestId:randomUUID(),target:view.value.target,approvalId,firstServiceClaimId:null});assert.equal(denied.status,409);
  assert.deepEqual(persisted(cases.client.id),{publications:0,events:0,deliveries:0,serviceStarts:0,reviewSchedules:0,starts:0});
  pass('Exact human UI approval persists but actual direct publication still denies before verified first service receipt');
  phase='genuine canonical quote and claim setup';
  const claim=await prepareSyntheticClaim(fixture,stack,cases.client);result.quoteId=claim.quoteId;result.claimId=claim.claimId;
  assert.ok(claim.temporarySessionIds.every(id=>stack.issued.get(id).closed));
  gate=await command(p,'advisor','plans',gateCommand);assert.equal(gate.value.approval.id,approvalId);
  await p.getByRole('button',{name:'refresh publication checks',exact:true}).click();
  phase='actual UI synthetic receipt confirmation';
  await p.getByRole('button',{name:'open payment verification',exact:true}).click();
  await p.getByRole('textbox',{name:'actual gross amount received'}).fill('100.00');
  await p.getByRole('combobox',{name:'receipt checked outside shelv'}).click();
  await p.getByRole('option',{name:'amount, recipient and transaction checked',exact:true}).click();
  await p.getByRole('button',{name:'confirm verified payment',exact:true}).click();
  await p.waitForFunction(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent==='publish first plan');return b&&!b.disabled;});
  gate=await command(p,'advisor','plans',gateCommand);assert.equal(gate.value.approval.id,approvalId);
  assert.deepEqual(persisted(cases.client.id),{publications:0,events:0,deliveries:0,serviceStarts:0,reviewSchedules:0,starts:0});
  pass('Actual UI confirms explicitly synthetic gross receipt through genuine Payments Edge; unchanged approval and null service/review clocks remain');
  phase='deliberate publication';
  await p.getByRole('button',{name:'publish first plan',exact:true}).click();
  await p.getByRole('heading',{name:'publication committed',exact:true}).waitFor();
  const snapshot=persisted(cases.client.id);assert.deepEqual(snapshot,{publications:1,events:1,deliveries:2,serviceStarts:1,reviewSchedules:1,starts:0});result.persistence=snapshot;
  const audit=await command(p,'advisor','plans',{schemaVersion:1,action:'read_advisor_publication_v1',clientId:cases.client.id,version:1});assert.equal(audit.status,200);assert.equal(audit.value.reviewSchedule.firstPublicationAt,audit.value.plan.publishedAt);
  result.publishedAt=audit.value.plan.publishedAt;
  pass('Deliberate UI publication commits exactly one immutable version/event, two queued outbox rows, real service/review dates and no Start');
  phase='client PKCE and decision';
  const client=await signIn(cases.client,'client',2),c=client.page;
  assert.ok(!(await c.locator('body').innerText()).includes('W6_PRIVATE_SYNTHETIC_ONLY'));
  const entitled=await command(c,'client','plans',{schemaVersion:1,action:'read_client_plan_v1',version:null});assert.equal(entitled.status,200);assert.equal(entitled.value.plan.version,1);assert.equal(entitled.value.access,'active');assert.deepEqual(entitled.value.actualUse,[]);assert.ok(!JSON.stringify(entitled.value).includes('W6_PRIVATE_SYNTHETIC_ONLY'));
  await c.getByRole('button',{name:'review recommendation',exact:true}).click();
  await c.getByRole('button',{name:'approve decision',exact:true}).click();
  await c.getByText('choice recorded',{exact:true}).waitFor();await c.reload();
  const chosen=await command(c,'client','plans',{schemaVersion:1,action:'read_client_plan_v1',version:null});assert.equal(chosen.value.decisions[0].choice,'approved');assert.deepEqual(chosen.value.actualUse,[]);assert.deepEqual(persisted(cases.client.id),snapshot);
  assert.equal(stack.browserCalls.filter(x=>x.path==='/api/client/plans'&&x.action==='record_decision_v1').length,1);
  pass('Actual client app PKCE reads entitled safe plan, deliberately records decision and rereads persisted state without Start or other business effects');
  phase='audience owner CSRF negatives';
  const cross=await command(c,'client','plans',{schemaVersion:1,action:'read_client_plan_v1',version:null,clientId:cases.other.id});assert.equal(cross.status,400);
  const wrongCsrf=await command(c,'client','plans',{schemaVersion:1,action:'read_client_plan_v1',version:null},{'x-shelv-csrf':'wrong'});assert.equal(wrongCsrf.status,403);
  const wrongAudience=await command(c,'advisor','plans',{schemaVersion:1,action:'list_plans_v1',clientId:null,cursor:null,limit:25});assert.equal(wrongAudience.status,401);
  const other=await signIn(cases.other,'client',3,true); // preparation is a valid own-owner projection
  const otherView=await command(other.page,'client','plans',{schemaVersion:1,action:'read_client_plan_v1',version:null});assert.equal(otherView.status,200);assert.equal(otherView.value.plan,null);
  pass('Actual server rejects caller-selected owner, wrong CSRF and wrong cookie audience; another real owner receives own preparation only');
  phase='real view-only advisor and role revocation';
  const viewer=await signIn(cases.viewer,'advisor',4,false,'/advisor/clients');
  assert.equal(await viewer.page.getByRole('button',{name:'new plan',exact:true}).count(),0);
  const roleDenied=await command(viewer.page,'advisor','plans',{schemaVersion:1,action:'create_draft_v1',requestId:randomUUID(),kind:'care_plan',templateVersionId:null});assert.equal(roleDenied.status,403);
  await new Promise(resolve=>setTimeout(resolve,1100)); // Honor the unchanged local GoTrue 1s email max_frequency.
  const freshViewer=await signIn(cases.viewer,'advisor',5,false,'/advisor/clients');
  // Revoke only the newly created explicitly owned synthetic viewer's grant.
  fixture.sql(`update concierge.advisors set active=false where user_id='${cases.viewer.id}'`);
  await freshViewer.page.reload();await freshViewer.page.getByRole('button',{name:'send sign-in link',exact:true}).waitFor();
  pass('Real view-only advisor cannot author; revoking only its new local grant ends actual browser authority on live context reread');
  phase='late response after actual logout';
  const held=stack.hold('read_client_plan_v1');released=held.release;
  const late=command(c,'client','plans',{schemaVersion:1,action:'read_client_plan_v1',version:null}).catch(()=>({status:0}));
  let holdTimer;
  try {await Promise.race([held.entered,new Promise((_,reject)=>holdTimer=setTimeout(()=>reject(Error('held request did not reach genuine backend')),15000))]);}finally{clearTimeout(holdTimer);}
  const logoutCommitted=c.waitForResponse(response=>new URL(response.url()).pathname==='/api/client/logout'&&response.request().method()==='POST');
  await c.getByRole('button',{name:'sign out',exact:true}).click();
  await c.getByRole('button',{name:'send sign-in link',exact:true}).waitFor();assert.equal((await logoutCommitted).status(),200);held.release();released=null;
  assert.ok([401,403].includes((await late).status));assert.ok(!(await c.locator('body').innerText()).includes('synthetic browser verification plan'));
  phase='supported provider revocation';
  const otherSession=[...stack.issued.values()].find(x=>x.ownerId===cases.other.id&&!x.closed);assert.ok(otherSession);await closeProviderSession(fixture,otherSession);
  await other.page.reload();await other.page.getByRole('button',{name:'send sign-in link',exact:true}).waitFor();
  pass('Actual logout rejects a held genuine backend reply; supported provider revocation ends another real browser session');
  assert.deepEqual(stack.errors,[]);
  assert.equal(stack.browserCalls.filter(x=>x.path.endsWith('/auth/complete')).length,5);
  assert.ok(stack.browserScan.responses>0&&stack.browserScan.clientResponses>0&&stack.browserScan.safePreviewResponses>0&&stack.browserScan.advisorPrivateDraftResponses>0);
  assert.equal(stack.browserScan.credentialLeaks,0);assert.equal(stack.browserScan.privateFactLeaks,0);
  result.status='PASS';
} catch(error) {
  result.status='FAIL';result.failure={phase,type:error.name};
  // Never preserve a callback URL or screenshot before it has been scrubbed.
  for(const context of contexts) for(const page of context.pages()) {
    try {result.failure.navigation=await page.evaluate(()=>({scrollY,focus:document.activeElement?.id,pageHeading:document.activeElement?.hasAttribute('data-page-heading'),restoreScroll:history.state?.shelvNavigation?.restore?.scrollY??null}));await page.evaluate(()=>{history.replaceState(null,'',location.pathname);});await writeFile(path.join(artifacts,'failure-dom.txt'),await page.locator('body').innerText(),{mode:0o600});}catch {}
  }
} finally {
  released?.();
  for(const context of contexts)await context.close().catch(()=>{});
  await browser?.close().catch(()=>{});
  try {result.cleanup=await stack.cleanup();}catch {result.status='FAIL';result.cleanup='FAILED';}
  result.calls=stack.calls;result.browserCalls=stack.browserCalls;result.browserResponseScan=stack.browserScan;result.errors=stack.errors;result.testBundleSeams=stack.seams;
  result.sessionIds=[...stack.issued.values()].map(item=>({id:item.id,ownerId:item.ownerId,closed:item.closed}));
  await stack.dispose();
  await writeFile(path.join(artifacts,'browser-result.json'),JSON.stringify(result,null,2)+'\n',{mode:0o600});
  if(result.runId)await writeFile(path.join(artifacts,'browser-result-'+result.runId+'.json'),JSON.stringify(result,null,2)+'\n',{mode:0o600});
}
console.log(JSON.stringify({...result,calls:result.calls.length,browserCalls:result.browserCalls.length}));if(result.status!=='PASS')process.exitCode=1;
  phase='preview editor opener';
