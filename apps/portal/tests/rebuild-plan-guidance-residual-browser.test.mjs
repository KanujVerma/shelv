// Prepared only in the R2 source round. A fresh explicit serial Chrome grant
// and W3_GUIDANCE_CONTEXT_BROWSER_ENTRY=1 are required before execution.
import test,{after} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';
import {setupBrowser,treatmentRoute} from './rebuild-plan-guidance-browser-tools.mjs';
import {GuidanceHttpFixture} from './rebuild-plan-guidance-browser-fixture.mjs';
import {browserArtifacts,closeGuidanceBrowsers,ownBrowserInventory} from './rebuild-plan-guidance-browser.mjs';
after(async()=>{await closeGuidanceBrowsers();await fs.writeFile(browserArtifacts+'/residual-inventory.json',JSON.stringify(ownBrowserInventory(),null,2));});
const retry=f=>f.page.getByRole('button',{name:'retry current guidance',exact:true}).first();
function delivery(f){return f.page.waitForResponse(r=>r.request().method()==='POST'&&r.request().postDataJSON()?.action==='read_client_plan_v3');}
async function settled(f,response){await(await response).finished();await f.page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));}
async function unavailable(t){const server=new GuidanceHttpFixture(),remove=server.override('read_client_instruction_v1',()=>({status:403,json:{code:'forbidden'}})),f=await setupBrowser(t,server,{route:treatmentRoute});await f.page.getByText('current directions unavailable',{exact:true}).first().waitFor();return{...f,remove};}
for(const callback of ['remove','replace'])test('R2-2 rendered retry cannot deliver through '+callback+'d callback',async t=>{
 const f=await unavailable(t),held=f.server.hold('read_client_plan_v3');await retry(f).click();await held.entered;const response=delivery(f);await f.page.evaluate(kind=>{const h=window.__guidanceHarness;if(kind==='remove')h.setCallbackEnabled(false);else h.replaceViewCallback();},callback);await f.page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(resolve)));held.release();await settled(f,response);assert.equal(await f.page.evaluate(()=>window.__guidanceHarness.applied.length),0);assert.equal(await f.page.evaluate(()=>window.__guidanceHarness.callbackIds.filter(id=>id===0).length),0);assert.equal(f.server.writes.length,0);
});
test('R2-2 rendered newer retry retains loading ownership after obsolete error/finally',async t=>{
 const f=await unavailable(t);let release,entered;const oldBody=new Promise(r=>release=r),oldEntered=new Promise(r=>entered=r);f.server.override('read_client_plan_v3',async()=>{entered();await oldBody;return{status:403,json:{code:'forbidden'}};},{once:true});t.after(()=>release());await retry(f).click();await oldEntered;await f.page.evaluate(()=>window.__guidanceHarness.replaceViewCallback());await f.page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(resolve)));assert.equal(await retry(f).isDisabled(),false);const current=f.server.hold('read_client_plan_v3');await retry(f).click();await current.entered;const oldResponse=delivery(f);release();await settled(f,oldResponse);assert.equal(await retry(f).isDisabled(),true);assert.equal(await f.page.evaluate(()=>window.__guidanceHarness.applied.length),0);f.remove();const next=delivery(f);current.release();await settled(f,next);await f.page.getByText('synthetic current directions 3',{exact:true}).waitFor();assert.equal(await f.page.evaluate(()=>{const h=window.__guidanceHarness;return h.applied.length===1&&h.callbackIds[0]===1&&h.applied[0]===h.controller.getSnapshot().view;}),true);assert.equal(f.server.writes.length,0);
});
// R2-1 is separately covered through the unchanged public subscription source
// probe. Ordinary React/App reachability has not been established or fabricated.
