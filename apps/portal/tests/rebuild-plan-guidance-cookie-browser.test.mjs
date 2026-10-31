import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {setupBrowser,navigate,select} from './rebuild-plan-guidance-browser-tools.mjs';
import {GuidanceHttpFixture} from './rebuild-plan-guidance-browser-fixture.mjs';
import {browserArtifacts,closeGuidanceBrowsers,ownBrowserInventory} from './rebuild-plan-guidance-browser.mjs';
after(async()=>{await closeGuidanceBrowsers();await fs.writeFile(browserArtifacts+'/cookie-observer-inventory.json',JSON.stringify(ownBrowserInventory(),null,2));});
test('T1 eight actual routine context cancellations keep the cookie ready and factual Stop independently reportable',async t=>{
 const server=new GuidanceHttpFixture(),f=await setupBrowser(t,server),states=[];await f.page.getByText('synthetic current directions 2',{exact:true}).first().waitFor();await f.page.evaluate(()=>{window.__cookieOriginal=window.__guidanceHarness.controller.getSnapshot().view;});
 // Fixed schedule, not retry-until-failure. Every read uses ordinary global
 // browser fetch and the existing finite interceptor, with no body substitute.
 for(let round=0;round<8;round++){
  await f.page.evaluate(()=>{const h=window.__guidanceHarness;h.setView({...window.__cookieOriginal,access:'read_only'});});await f.page.getByText('read-only plan',{exact:true}).first().waitFor();
  await f.page.evaluate(()=>window.__guidanceHarness.setView(window.__cookieOriginal));await f.page.getByText('read-only plan',{exact:true}).first().waitFor({state:'hidden'});
  states.push(await f.page.evaluate(()=>({cookie:window.__guidanceHarness.runtime.cookie.status,sameView:window.__guidanceHarness.controller.getSnapshot().view===window.__cookieOriginal})));
 }
 await fs.writeFile(browserArtifacts+'/T1-global-fetch-contexts.json',JSON.stringify({states,calls:f.calls},null,2));assert.ok(states.every(s=>s.cookie==='ready'&&s.sameView),JSON.stringify(states));
 await f.page.getByText('synthetic current directions 2',{exact:true}).first().waitFor();await navigate(f,{name:'product-use',productId:'cerave-pm',routine:'evening'});await select(f.page,'what changed?','stopped');await f.page.getByRole('button',{name:'record change',exact:true}).click();await f.page.getByText('use report recorded',{exact:true}).waitFor();
 assert.deepEqual(server.writes.map(c=>c.action),['report_product_use_v1']);assert.equal(server.writes[0].expectedUseRevision,0);assert.equal(server.writes[0].change.kind,'stopped');assert.equal(server.view.actualUse.length,0);assert.ok(f.calls.filter(c=>c.command.action.startsWith('read_client_plan')).every(c=>c.command.action==='read_client_plan_v3'));assert.equal(await f.page.evaluate(()=>{const h=window.__guidanceHarness;return h.applied.at(-1)===h.controller.getSnapshot().view;}),true);
});
