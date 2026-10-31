// Prepared actual-module Chrome regression. Run only under a new explicit grant.
// HTTP DTO/fault delivery is synthetic; retained cookie/factory/Root/controller/UI are real.
import {before,after,test} from 'node:test';import assert from 'node:assert/strict';
import {start,stop,setup,server,guidance,current,cursor} from './rebuild-history-browser-harness.mjs';
before(start);after(stop);
async function fixture(t,options){const f=await setup({...options,caseName:t.name});t.after(()=>f.close());return f;}
const snapshot=f=>f.page.evaluate(()=>window.__historyHarness.snapshot());
async function restore(f){await f.page.getByRole('button',{name:'check connection',exact:true}).click();await f.page.getByLabel('connection state',{exact:true}).getByText('ready',{exact:true}).waitFor();}
function gate(){let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};}
for(const pending of [false,true])test(`RH1 current continuation403 retires private display while exact pending ${pending} and cookie remain current`,async t=>{
  const model=server([guidance()]);let deny=true;
  const f=await fixture(t,{screen:'update',model,respond(c){if(c.action==='submit_goal_report_v1'&&deny){model.respond(c);return {status:503,json:{code:'unavailable'}};}if(c.action==='read_care_history_v1')return c.cursor&&deny?{status:403,json:{code:'forbidden'}}:{json:{...model.history(c),nextCursor:cursor(1)}};}});
  await f.page.locator('form').waitFor();await f.page.getByLabel('anything else to discuss? (optional)',{exact:true}).fill('RH1_PRIVATE_UNSENT_NOTE');
  if(pending){await f.page.getByRole('button',{name:'send update',exact:true}).click();await f.page.getByText('update result uncertain',{exact:true}).waitFor();await restore(f);}
  const original=(await snapshot(f)).pending,wire=pending?f.calls.find(c=>c.command.action==='submit_goal_report_v1').wire:null;
  await f.page.getByRole('button',{name:'back to history',exact:true}).click();await f.page.waitForFunction(()=>window.__historyHarness.snapshot().phase==='ready');
  await f.page.getByRole('button',{name:'load more activity',exact:true}).click();await f.page.getByText('record access denied',{exact:true}).waitFor();
  const s=await snapshot(f);assert.equal(s.view,null);assert.deepEqual(s.pages,[]);assert.equal(s.amendmentView,null);assert.deepEqual(s.pending,original);if(pending)assert.equal(JSON.stringify(s.pending),wire);
  const text=await f.page.locator('main').innerText();assert.equal(text.includes('keep the plan unchanged'),false);assert.equal(text.includes('RH1_PRIVATE_UNSENT_NOTE'),false);assert.equal(await f.page.getByLabel('connection state',{exact:true}).innerText(),'ready');
  deny=false;await f.page.getByRole('button',{name:'retry current record',exact:true}).click();await f.page.waitForFunction(()=>window.__historyHarness.snapshot().phase==='ready');await f.page.getByRole('button',{name:'send an update',exact:true}).click();
  if(pending){await f.page.getByRole('button',{name:'retry exact update',exact:true}).click();await f.page.getByText('update recorded',{exact:true}).waitFor();assert.equal(f.calls.filter(c=>c.command.action==='submit_goal_report_v1').at(-1).wire,wire);}else{await f.page.getByRole('button',{name:'i’ve reviewed this record',exact:true}).click();await f.page.waitForFunction(()=>!window.__historyHarness.snapshot().needsReview);assert.equal(await f.page.getByLabel('anything else to discuss? (optional)',{exact:true}).inputValue(),'RH1_PRIVATE_UNSENT_NOTE');}
});
test('RH1 obsolete continuation403 cannot deny a newer held current read or release its token',async t=>{
  const old=gate(),entered=gate(),newRead=gate(),newEntered=gate();let holdNew=false;const model=server([guidance()]);
  const f=await fixture(t,{model,respond:async c=>{if(c.action==='read_care_history_v1'&&c.cursor){entered.resolve();await old.promise;return {status:403,json:{code:'forbidden'}};}if(c.action==='read_client_plan_v3'&&holdNew){holdNew=false;newEntered.resolve();await newRead.promise;}if(c.action==='read_care_history_v1')return {json:{...model.history(c),nextCursor:cursor(1)}};}});
  await f.page.waitForFunction(()=>window.__historyHarness.snapshot().phase==='ready');await f.page.getByRole('button',{name:'load more activity',exact:true}).click();await entered.promise;holdNew=true;await f.page.evaluate(()=>{void window.__historyHarness.load();});await newEntered.promise;old.resolve();
  assert.equal((await snapshot(f)).phase,'loading');assert.equal((await snapshot(f)).readError,false);assert.equal(await f.page.getByText('record access denied',{exact:true}).count(),0);newRead.resolve();await f.page.waitForFunction(()=>window.__historyHarness.snapshot().phase==='ready');assert.equal(await f.page.getByRole('heading',{name:'keep the plan unchanged',exact:true}).count(),1);
});
test('RH1 a retry click may recheck displayed data but cannot acknowledge a new undisplayed basis and write together',async t=>{
  const model=server([guidance()]);let deny=true,changeAtReview=false;
  const f=await fixture(t,{screen:'update',model,respond(c){if(c.action==='submit_goal_report_v1'&&deny){model.respond(c);return {status:503,json:{code:'unavailable'}};}if(c.action==='read_client_plan_v3'&&changeAtReview){changeAtReview=false;const next=current(2);next.currentGuidance.snapshot.reportHead=1;next.plan.content.title='NEWLY_DISCOVERED_RH1_BASIS';model.plan=next;}if(c.action==='read_care_history_v1')return c.cursor&&deny?{status:403,json:{code:'forbidden'}}:{json:{...model.history(c),nextCursor:cursor(1)}};}});
  await f.page.locator('form').waitFor();await f.page.getByLabel('anything else to discuss? (optional)',{exact:true}).fill('RH1_EXACT_ORIGINAL');await f.page.getByRole('button',{name:'send update',exact:true}).click();await f.page.getByText('update result uncertain',{exact:true}).waitFor();const wire=f.calls.find(c=>c.command.action==='submit_goal_report_v1').wire;await restore(f);
  await f.page.getByRole('button',{name:'back to history',exact:true}).click();await f.page.waitForFunction(()=>window.__historyHarness.snapshot().phase==='ready');await f.page.getByRole('button',{name:'load more activity',exact:true}).click();await f.page.getByText('record access denied',{exact:true}).waitFor();deny=false;
  await f.page.getByRole('button',{name:'retry current record',exact:true}).click();await f.page.waitForFunction(()=>window.__historyHarness.snapshot().phase==='ready');await f.page.getByRole('button',{name:'send an update',exact:true}).click();changeAtReview=true;
  await f.page.getByRole('button',{name:'retry exact update',exact:true}).click();await f.page.getByText('NEWLY_DISCOVERED_RH1_BASIS',{exact:true}).waitFor();assert.equal(f.calls.filter(c=>c.command.action==='submit_goal_report_v1').length,1);assert.equal((await snapshot(f)).needsReview,true);
  await f.page.getByRole('button',{name:'retry exact update',exact:true}).click();await f.page.getByText('update recorded',{exact:true}).waitFor();assert.equal(f.calls.filter(c=>c.command.action==='submit_goal_report_v1').at(-1).wire,wire);
});
