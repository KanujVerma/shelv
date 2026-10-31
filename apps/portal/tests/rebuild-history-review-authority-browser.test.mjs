// Actual module Chrome regression; execution requires a fresh explicit sole grant.
// Finite synthetic HTTP facts, real retained cookie/factory/Root/controller/React.
import {before,after,test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';import path from 'node:path';
import {start,stop,setup,server,guidance,current,cursor,artifacts} from './rebuild-history-browser-harness.mjs';
before(start);after(stop);
const snapshot=f=>f.page.evaluate(()=>window.__historyHarness.snapshot());
const ready=f=>f.page.waitForFunction(()=>window.__historyHarness.snapshot().phase==='ready');
const note=f=>f.page.getByLabel('anything else to discuss? (optional)',{exact:true});
function gate(){let resolve;return {promise:new Promise(r=>resolve=r),resolve:v=>resolve(v)};}
async function fixture(t,options){const f=await setup({...options,caseName:t.name});f.caseKey=t.name.replace(/[^a-zA-Z0-9]+/g,'-');t.after(()=>f.close());return f;}
async function restore(f){await f.page.getByRole('button',{name:'check connection',exact:true}).click();await f.page.getByLabel('connection state',{exact:true}).getByText('ready',{exact:true}).waitFor();}
async function observe(f,label){f.observations??=[];const x=await f.page.evaluate(()=>{const h=window.__historyHarness,r=h.runtime,b=r.getSnapshot().boundary;return {state:h.snapshot(),main:document.querySelector('main')?.innerText,session:{key:b?.key,current:b?.isCurrent(),status:r.cookie.status,owner:r.cookie.identity?.ownerId,generation:r.cookie.generation,epoch:r.cookie._epoch}};});f.observations.push({label,...x,calls:structuredClone(f.calls)});await fs.writeFile(path.join(artifacts,f.caseKey+'-observations.json'),JSON.stringify(f.observations,null,2));await f.page.screenshot({path:path.join(artifacts,f.caseKey+'-'+f.observations.length+'.png'),fullPage:true});return x;}
async function confirmedOriginalStillNeedsReview(f){
 // The existing UI prioritizes the independent review notice over the receipt
 // notice. Wait for the real receipt, then verify its badge and current gate.
 await f.page.waitForFunction(()=>{const s=window.__historyHarness.snapshot();return s.mutation==='confirmed'&&s.pending===null;});
 await observe(f,'immutable receipt resolved while current review remains separate');
 assert.equal((await snapshot(f)).needsReview,true);
 await f.page.getByText('recorded',{exact:true}).waitFor();
 await f.page.getByText('review the current record',{exact:true}).waitFor();
}
async function freshWriteRequiresReview(f,original){
 await f.page.getByRole('button',{name:'back to history',exact:true}).click();await ready(f);await f.page.getByRole('button',{name:'send an update',exact:true}).click();await note(f).fill('RH2_FRESH_B_AFTER_SEPARATE_REVIEW');
 assert.equal((await snapshot(f)).needsReview,true);assert.equal(await f.page.getByRole('button',{name:'send update',exact:true}).isDisabled(),true);assert.equal(f.calls.filter(x=>x.command.action==='submit_goal_report_v1').length,1);
 await observe(f,'new intent remains blocked before deliberate review');
 await f.page.getByRole('button',{name:'i’ve reviewed this record',exact:true}).click();await f.page.waitForFunction(()=>!window.__historyHarness.snapshot().needsReview);await f.page.getByRole('button',{name:'send update',exact:true}).click();await f.page.getByText('update recorded',{exact:true}).waitFor();
 const writes=f.calls.filter(x=>x.command.action==='submit_goal_report_v1');assert.equal(writes.length,2);assert.notEqual(writes[1].command.requestId,original.requestId);assert.equal(writes[1].command.expectedReportRevision,1);assert.equal(f.model.writes.length,2);await observe(f,'fresh UUID only after deliberate review');
}
for(const operation of ['write','status'])for(const deny of [false,true])test(`RH2 ${operation} receipt across read-only/active return full403 ${deny} cannot clear current review`,async t=>{
 const held=gate(),entered=gate();t.after(()=>held.resolve());const model=server([guidance()]);let first=true,denyRead=false,holdStatus=false;
 const f=await fixture(t,{screen:'update',model,respond:async c=>{
  if(c.action==='submit_goal_report_v1'&&first){first=false;const result=model.respond(c);if(operation==='write'){entered.resolve();await held.promise;return result;}return {status:503,json:{code:'unavailable'}};}
  if(c.action==='request_status_v1'&&holdStatus){holdStatus=false;entered.resolve();await held.promise;return model.respond(c);}
  if(c.action==='read_care_history_v1'&&denyRead)return {status:403,json:{code:'forbidden'}};
 }});
 await f.page.locator('form').waitFor();await note(f).fill('RH2_ORIGINAL_HELD_'+operation);await f.page.getByRole('button',{name:'send update',exact:true}).click();
 if(operation==='status'){await f.page.getByText('update result uncertain',{exact:true}).waitFor();await restore(f);holdStatus=true;await f.page.getByRole('button',{name:'check update status',exact:true}).click();}
 await entered.promise;const original=(await snapshot(f)).pending,wire=f.calls.find(x=>x.command.action==='submit_goal_report_v1').wire;
 denyRead=deny;await f.page.getByRole('button',{name:'back to history',exact:true}).click();
 if(deny){await f.page.getByText('record access denied',{exact:true}).waitFor();await observe(f,'current full history denied');denyRead=false;model.plan.access='read_only';await f.page.getByRole('button',{name:'retry current record',exact:true}).click();}
 else{await ready(f);model.plan.access='read_only';await f.page.evaluate(()=>window.__historyHarness.load());}
 await f.page.getByText('read-only record',{exact:true}).waitFor();model.plan.access='active';await f.page.evaluate(()=>window.__historyHarness.load());await ready(f);await f.page.getByRole('button',{name:'send an update',exact:true}).click();await f.page.getByRole('heading',{name:'current fetched record',exact:true}).waitFor();assert.equal((await snapshot(f)).needsReview,true);await observe(f,'active basis displayed before receipt');
 const action=operation==='write'?'submit_goal_report_v1':'request_status_v1',response=f.page.waitForResponse(r=>r.url().endsWith('/api/client/reviews')&&r.request().postDataJSON().action===action);held.resolve();await (await response).finished();
 if(deny){assert.deepEqual((await snapshot(f)).pending,original);assert.equal(JSON.stringify((await snapshot(f)).pending),wire);await f.page.getByRole('button',{name:'check update status',exact:true}).click();}
 await confirmedOriginalStillNeedsReview(f);const s=await snapshot(f);assert.equal(s.pending,null);assert.equal(s.receipt.requestId,original.requestId);assert.equal(s.needsReview,true);assert.equal(s.intent.body.publication.version,original.body.publication.version);await observe(f,'receipt confirms only original A');await freshWriteRequiresReview(f,original);
});
for(const denial of ['full','continuation'])for(const version of [1,2])test(`RH2 new positive status after ${denial}403 preserves publication${version} review and cannot authorize fresh UUID`,async t=>{
 const model=server([guidance()]);let deny=false,first=true;
 const f=await fixture(t,{screen:'update',model,respond(c){if(c.action==='submit_goal_report_v1'&&first){first=false;model.respond(c);return {status:503,json:{code:'unavailable'}};}if(c.action==='read_care_history_v1'){if(deny&&(denial==='full'||c.cursor))return {status:403,json:{code:'forbidden'}};return {json:{...model.history(c),nextCursor:cursor(1)}};}}});
 await f.page.locator('form').waitFor();await note(f).fill('RH2_ORIGINAL_POSITIVE_STATUS');await f.page.getByRole('button',{name:'send update',exact:true}).click();await f.page.getByText('update result uncertain',{exact:true}).waitFor();await restore(f);const original=(await snapshot(f)).pending,wire=f.calls.find(x=>x.command.action==='submit_goal_report_v1').wire;
 deny=denial==='full';await f.page.getByRole('button',{name:'back to history',exact:true}).click();if(denial==='continuation'){await ready(f);deny=true;await f.page.getByRole('button',{name:'load more activity',exact:true}).click();}
 await f.page.getByText('record access denied',{exact:true}).waitFor();await observe(f,'denied projection with exact A retained');deny=false;model.plan.access='read_only';await f.page.getByRole('button',{name:'retry current record',exact:true}).click();await f.page.getByText('read-only record',{exact:true}).waitFor();
 const active=current(version);active.currentGuidance.snapshot.reportHead=1;model.plan=active;await f.page.evaluate(()=>window.__historyHarness.load());await ready(f);await f.page.getByRole('button',{name:'send an update',exact:true}).click();await f.page.getByRole('heading',{name:'current fetched record',exact:true}).waitFor();assert.equal(JSON.stringify((await snapshot(f)).pending),wire);await observe(f,'current basis displayed before deliberate status READ');
 const before=f.calls.length;await f.page.getByRole('button',{name:'check update status',exact:true}).click();await confirmedOriginalStillNeedsReview(f);const s=await snapshot(f);assert.equal(s.pending,null);assert.equal(s.receipt.requestId,original.requestId);assert.equal(s.needsReview,true);assert.equal(s.intent.body.publication.version,1);assert.deepEqual(f.calls.slice(before).map(x=>x.command.action),['request_status_v1']);await observe(f,'positive status preserves current review');await freshWriteRequiresReview(f,original);
});
