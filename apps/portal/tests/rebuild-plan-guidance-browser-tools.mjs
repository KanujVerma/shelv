import assert from 'node:assert/strict';import fs from 'node:fs/promises';
import {openGrantedGuidanceBrowser,browserArtifacts} from './rebuild-plan-guidance-browser.mjs';import {GuidanceHttpFixture} from './rebuild-plan-guidance-browser-fixture.mjs';
export async function setupBrowser(t,server=new GuidanceHttpFixture(),options={}){const f=await openGrantedGuidanceBrowser({view:server.view,respond:(...args)=>server.respond(...args),sessionReply:()=>server.login,...options});t.after(async()=>{const name=t.name.replace(/[^a-zA-Z0-9]+/g,'-').slice(0,100);try{await f.page.screenshot({path:browserArtifacts+'/'+name+'.png',fullPage:!(/120000|2550/.test(t.name))});await fs.writeFile(browserArtifacts+'/'+name+'.json',JSON.stringify({calls:f.calls,view:server.view,text:await f.page.locator('body').innerText()},null,2));}finally{server.release();await f.close();}});return {...f,server};}
export const treatmentRoute='/plan/recommendations/maya-card-treatments?routine=evening';
export async function choiceReady(f){await f.page.getByRole('button',{name:'approve product',exact:true}).waitFor();await f.page.waitForFunction(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent==='approve product');return b&&!b.disabled;});}
export async function navigate(f,route){await f.page.evaluate(r=>window.__guidanceHarness.navigator.navigate(r),route);}
export async function restore(f){await f.page.evaluate(()=>window.__guidanceHarness.runtime.restore());}
export async function applyView(f){await f.page.evaluate(v=>window.__guidanceHarness.setView(v),structuredClone(f.server.view));}
export async function select(page,name,label){await page.getByRole('combobox',{name,exact:true}).click();await page.getByRole('option',{name:label,exact:true}).click();}
export async function noOverflow(page){assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true);}
