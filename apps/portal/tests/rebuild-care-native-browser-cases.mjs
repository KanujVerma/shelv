import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {syntheticCareContent,careCaseSnapshot} from '../scripts/rebuild-care-native-cases.mjs';
import {syntheticContent,prepareSyntheticClaim} from '../scripts/rebuild-native-cases.mjs';
import {readPlanContent} from '../../../src/contracts/PortalRebuildValidation.ts';
import {portalOrigin,safePrivateMarkers,sha} from '../scripts/rebuild-native-boundary.mjs';
import {mailSnapshot,captureCallback} from './rebuild-native-stack.mjs';

export const unknown=()=>({state:'unknown'});
export const publication={version:1,documentSchemaVersion:3};
export const planProduct={kind:'plan_product',publication,productId:'cerave-pm',slotId:null};
export const useFields=change=>({product:planProduct,change,sourcePublication:publication,occurredOn:unknown(),channel:'portal',acquisition:'self',identityEventId:null});
export function careBrowserSyntheticContent() {
  const content=syntheticCareContent();
  content.routine=syntheticContent().routine;
  content.routine.push({id:'care-product-step',slotId:'care-product-step',kind:'product',productId:'cerave-pm',title:'synthetic product instruction',directions:['software fixture only; no actual product use is requested'],cautions:['synthetic test, not skincare guidance'],schedule:structuredClone(content.decisions[0].schedule)});
  return readPlanContent(content);
}
export async function bounded(promise) {let timer;try{return await Promise.race([promise,new Promise((_,reject)=>timer=setTimeout(()=>reject(Error('Care browser wait exceeded15s')),15000))]);}finally{clearTimeout(timer);}}
export async function select(page,label,value) {await page.getByRole('combobox',{name:label,exact:true}).click();await page.getByRole('option',{name:value,exact:true}).click();}
export async function browserCommand(page,audience,family,body,headers={}) {
  return page.evaluate(async({audience,family,body,headers})=>{
    const session=await(await fetch('/api/'+audience+'/session')).json();
    const response=await fetch('/api/'+audience+'/'+family,{method:'POST',headers:{'content-type':'application/json','x-shelv-csrf':session.csrf,...headers},body:JSON.stringify(body)});
    return {status:response.status,value:await response.json()};
  },{audience,family,body,headers});
}
export async function call(page,audience,family,action,fields={},status=200) {
  const response=await browserCommand(page,audience,family,{schemaVersion:1,action,...fields});
  assert.equal(response.status,status,'Actual '+audience+'/'+family+'/'+action+' status');return response.value;
}

export function observeCareCommands(context) {
  const requests=[];
  context.on('request',request=>{const url=new URL(request.url());if(url.origin===portalOrigin&&url.pathname==='/api/client/care'&&request.method()==='POST'){const bytes=request.postDataBuffer();requests.push({command:JSON.parse(bytes),wire:bytes.toString(),sha256:sha(bytes)});}});
  return requests;
}
export async function signIn({browser,stack,contexts,identity,audience,index,result,preparation=false}) {
  const context=await browser.newContext({viewport:{width:1440,height:960},serviceWorkers:'block'});contexts.push(context);
  await stack.bind(context,index);const requests=observeCareCommands(context),page=await context.newPage();page.setDefaultTimeout(12000);
  const route=audience==='advisor'?identity.kind==='viewer'?'/advisor/clients':'/advisor/plans':'/plan';await page.goto(portalOrigin+route);
  await page.getByRole('textbox',{name:'email',exact:true}).fill(identity.email);const before=await mailSnapshot();
  await page.getByRole('button',{name:'send sign-in link',exact:true}).click();await page.getByText('check your email',{exact:true}).waitFor();
  let callback=await captureCallback(identity.email,before,route);result.localEmails=(result.localEmails??0)+callback.localEmails;
  await page.goto(callback.url);callback=null;await page.waitForURL(portalOrigin+route);
  if(audience==='advisor')await page.getByRole('heading',{name:identity.kind==='viewer'?'clients':'plans',exact:true}).waitFor();
  else if(preparation)await page.getByText('your plan is being prepared',{exact:true}).waitFor();
  else await page.getByRole('heading',{name:'your current routine',exact:true}).waitFor();
  assert.equal(new URL(page.url()).search,'');assert.equal(new URL(page.url()).hash,'');
  const cookie=(await context.cookies()).find(c=>c.name==='__Host-shelv_'+audience);assert.ok(cookie?.httpOnly&&cookie.secure&&cookie.sameSite==='Lax');assert.equal(cookie.path,'/');
  const storage=await page.evaluate(()=>({local:{...localStorage},session:{...sessionStorage},cookie:document.cookie,history:history.state}));
  assert.doesNotMatch(JSON.stringify(storage),/access_token|refresh_token|code_verifier|__Host-shelv_(advisor|client)=/);
  return {context,page,requests};
}

export async function prepareCareBrowserPublication({fixture,stack,advisor,cases,result,setPhase,pass,releases}) {
  const p=advisor.page,clientId=cases.client.id,authCount=fixture.sql('select count(*) from auth.users');
  setPhase('actual App incomplete create/save/import/assignment');
  await p.getByRole('button',{name:'new plan',exact:true}).click();await p.waitForURL(/\/advisor\/plans\/[0-9a-f-]+\/client-context$/);
  const draftId=new URL(p.url()).pathname.split('/')[3];assert.match(draftId,/^[0-9a-f-]{36}$/);result.draftId=draftId;
  await p.getByRole('textbox',{name:'plan title',exact:true}).fill('SYNTHETIC W6 CARE incomplete work');await p.getByText('saved',{exact:true}).waitFor();await p.reload();
  assert.equal(await p.getByRole('textbox',{name:'plan title',exact:true}).inputValue(),'SYNTHETIC W6 CARE incomplete work');
  let draft=await call(p,'advisor','plans','read_draft_v1',{draftId});assert.equal(draft.draft.clientId,null);assert.ok(draft.issues.length>0);
  await p.getByRole('button',{name:'import agent draft',exact:true}).click();await p.getByRole('textbox',{name:'plan JSON',exact:true}).fill(JSON.stringify(careBrowserSyntheticContent()));
  await p.getByRole('button',{name:'compare import',exact:true}).click();await p.getByRole('button',{name:'apply compared import',exact:true}).click();await p.getByText('saved',{exact:true}).waitFor();
  draft=await call(p,'advisor','plans','read_draft_v1',{draftId});assert.ok(JSON.stringify(draft.draft.content).includes(safePrivateMarkers[0]));
  await p.getByRole('button',{name:'assign client',exact:true}).click();await select(p,'admitted client',cases.client.displayName);await p.getByRole('button',{name:'confirm intended client',exact:true}).click();await p.getByText(cases.client.displayName,{exact:true}).first().waitFor();
  assert.equal(fixture.sql('select count(*) from auth.users'),authCount);
  for(const section of ['sources','client-context','decisions','routine','follow-up']) {await p.goto(portalOrigin+'/advisor/plans/'+draftId+'/'+section);await p.getByRole('button',{name:'mark section reviewed',exact:true}).click();await p.getByRole('button',{name:'section reviewed',exact:true}).waitFor();}
  draft=await call(p,'advisor','plans','read_draft_v1',{draftId});assert.equal(draft.issues.length,0);assert.ok(draft.sections.every(s=>s.reviewed));
  pass('Actual App creates, saves/reloads, imports, assigns and reviews the new synthetic case; original private draft is positively present');

  setPhase('actual unpublished shared renderer/navigation/privacy');
  await p.goto(portalOrigin+'/advisor/plans/'+draftId+'/routine');await p.getByRole('button',{name:'open client preview',exact:true}).click();await p.getByRole('heading',{name:'draft routine',exact:true}).waitFor();
  for(const marker of safePrivateMarkers)assert.ok(!(await p.locator('body').innerText()).includes(marker));
  assert.equal(await p.getByRole('button',{name:'record a change in use',exact:true}).count(),0);
  await p.getByRole('tab',{name:'evening',exact:true}).click();await p.evaluate(()=>{document.getElementById('portal-content').focus({preventScroll:true});window.scrollTo({top:250,behavior:'instant'});});
  await p.waitForFunction(()=>scrollY===250&&history.state.shelvNavigation.restore.scrollY===250);
  await p.getByRole('button',{name:'review recommendation',exact:true}).click();await p.getByRole('heading',{name:'synthetic product decision',exact:true}).waitFor();
  await p.goBack();await p.getByRole('heading',{name:'draft routine',exact:true}).waitFor();await p.getByRole('tab',{name:'evening',exact:true,selected:true}).waitFor();await p.waitForFunction(()=>scrollY===250&&document.activeElement?.hasAttribute('data-page-heading'));
  await p.goForward();await p.getByRole('heading',{name:'synthetic product decision',exact:true}).waitFor();await p.goBack();await p.getByRole('heading',{name:'draft routine',exact:true}).waitFor();
  await p.getByRole('button',{name:'back to draft',exact:true}).click();await p.waitForURL(portalOrigin+'/advisor/plans/'+draftId+'/routine');await p.waitForFunction(()=>document.activeElement?.id==='advisor-preview-open-plan');
  assert.deepEqual((await call(p,'advisor','plans','read_draft_v1',{draftId})).target,draft.target);
  pass('Exact safe preview retains shared renderer, evening/native Back/Forward/250px scroll and editor opener without care controls');

  setPhase('actual exact approval and independent synthetic first service receipt');
  await p.goto(portalOrigin+'/advisor/plans/'+draftId+'/review-publish');await p.getByRole('button',{name:'refresh publication checks',exact:true}).click();await p.getByText('first publication',{exact:true}).waitFor();await p.getByRole('button',{name:'approve this exact version',exact:true}).click();await p.getByText('revision approved',{exact:true}).waitFor();
  const gateFields={target:draft.target,publisher:{kind:'human',actorId:fixture.owner.id}};
  let gate=await call(p,'advisor','plans','read_advisor_gate_v1',gateFields);result.approvalId=gate.approval.id;
  assert.equal(await p.getByRole('button',{name:'publish first plan',exact:true}).isDisabled(),true);
  await call(p,'advisor','plans','publish_plan_v1',{requestId:randomUUID(),target:draft.target,approvalId:result.approvalId,firstServiceClaimId:null},409);
  assert.equal(careCaseSnapshot(fixture,clientId).publications.length,0);
  // Explicit ordinary non-UI setup: canonical quote and sent-claim, temporary real sessions closed.
  const claim=await prepareSyntheticClaim(fixture,stack,cases.client);result.quoteId=claim.quoteId;result.claimId=claim.claimId;
  assert.ok(claim.temporarySessionIds.every(id=>stack.issued.get(id).closed));
  gate=await call(p,'advisor','plans','read_advisor_gate_v1',gateFields);assert.equal(gate.approval.id,result.approvalId);
  const held=stack.hold('advisor_read');releases.push(held.release);await p.getByRole('button',{name:'refresh publication checks',exact:true}).click();await bounded(held.entered);
  await p.getByRole('button',{name:'open payment verification',exact:true}).click();await p.getByRole('heading',{name:'verify first service payment',exact:true}).waitFor();held.release();
  await p.getByRole('textbox',{name:'actual gross amount received'}).fill('100.00');await select(p,'receipt checked outside shelv','amount, recipient and transaction checked');await p.getByRole('button',{name:'confirm verified payment',exact:true}).click();
  await p.waitForFunction(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent==='publish first plan');return b&&!b.disabled;});
  gate=await call(p,'advisor','plans','read_advisor_gate_v1',gateFields);assert.equal(gate.approval.id,result.approvalId);
  const paid=careCaseSnapshot(fixture,clientId);assert.equal(paid.publications.length,0);assert.equal(paid.plan_review_schedule.length,0);assert.equal(paid.activations.length,0);
  assert.ok(paid.service_periods.every(r=>r.starts_on===null&&r.ends_on===null));assert.ok(paid.payment_confirmations.every(r=>r.service_start===null&&r.service_end===null));
  setPhase('deliberate actual App first publication');await p.getByRole('button',{name:'publish first plan',exact:true}).click();await p.getByRole('heading',{name:'publication committed',exact:true}).waitFor();
  const initial=careCaseSnapshot(fixture,clientId);assert.equal(initial.publications.length,1);assert.equal(initial.plan_events.length,1);assert.equal(initial.plan_deliveries.length,2);assert.equal(initial.activations.length,0);assert.equal(initial.service_periods.length,1);assert.equal(initial.plan_review_schedule.length,1);
  assert.equal(initial.service_periods[0].ends_on,initial.plan_review_schedule[0].month_one_on);
  const audit=await call(p,'advisor','care','read_advisor_publication_v2',{clientId,version:1});assert.equal(audit.schemaVersion,2);assert.equal(Date.parse(audit.reviewSchedule.firstPublicationAt),Date.parse(audit.plan.publishedAt));
  const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/Chicago',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(audit.plan.publishedAt)),part=n=>parts.find(x=>x.type===n).value;
  assert.equal(initial.service_periods[0].starts_on,part('year')+'-'+part('month')+'-'+part('day'));
  result.publishedAt=audit.plan.publishedAt;result.reviewSchedule=audit.reviewSchedule;
  pass('First exact approval survives actual synthetic service quote/claim and UI gross receipt; only deliberate UI publication starts service/review clocks and queues notifications');
  return {initial,draftId};
}
