import assert from 'node:assert/strict';import fs from 'node:fs/promises';
import {openGrantedGuidanceBrowser,browserArtifacts} from './rebuild-plan-guidance-browser.mjs';import {GuidanceHttpFixture} from './rebuild-plan-guidance-browser-fixture.mjs';
import {createBudgetDiagnostics,budget2550TestName} from './rebuild-plan-guidance-diagnostics.mjs';
import {manifestBasis,manifestInstance,manifestAccepted} from './rebuild-plan-guidance-manifest-observation.ts';
export async function setupBrowser(t,server=new GuidanceHttpFixture(),options={}){
 const budgetDiagnostics=createBudgetDiagnostics({testName:t.name,directory:process.env.W3_BUDGET_DIAGNOSTICS_DIR});let f;
 const teardown=async hook=>{const name=t.name.replace(/[^a-zA-Z0-9]+/g,'-').slice(0,100);let artifactError,closeError;
  if(budgetDiagnostics)await budgetDiagnostics.captureTerminal(f?.page,{outcome:hook.passed?'pass':'fail',error:hook.error});
  try{if(f){await f.page.screenshot({path:browserArtifacts+'/'+name+'.png',fullPage:!(/120000|2550/.test(t.name))});await fs.writeFile(browserArtifacts+'/'+name+'.json',JSON.stringify({calls:f.calls,view:server.view,text:await f.page.locator('body').innerText()},null,2));}}
  catch(error){artifactError=error;throw error;}
  finally{server.release();try{if(f)await f.close();}catch(error){closeError=error;throw error;}finally{if(budgetDiagnostics){budgetDiagnostics.closed(closeError??artifactError);await budgetDiagnostics.persist();}}}
 };
 // Opted setup failures still get a terminal diagnostic, without changing default hook order.
 if(budgetDiagnostics)t.after(teardown);
 f=await openGrantedGuidanceBrowser({view:server.view,respond:(...args)=>server.respond(...args),sessionReply:()=>server.login,...options,budgetDiagnostics,observeManifest:options.observeManifest===true&&t.name===budget2550TestName});
 if(!budgetDiagnostics)t.after(teardown);return {...f,server};
}
export const treatmentRoute='/plan/recommendations/maya-card-treatments?routine=evening';
export async function choiceReady(f){await f.page.getByRole('button',{name:'approve product',exact:true}).waitFor();await f.page.waitForFunction(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent==='approve product');return b&&!b.disabled;});}
export async function navigate(f,route){await f.page.evaluate(r=>window.__guidanceHarness.navigator.navigate(r),route);}
export async function restore(f){await f.page.evaluate(()=>window.__guidanceHarness.runtime.restore());}
export async function applyView(f){await f.page.evaluate(v=>window.__guidanceHarness.setView(v),structuredClone(f.server.view));}
export async function select(page,name,label){await page.getByRole('combobox',{name,exact:true}).click();await page.getByRole('option',{name:label,exact:true}).click();}
export async function noOverflow(page){assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true);}

/** Test precondition only. Uses actual committed store summaries, never network counts. */
export async function waitForAcceptedManifest(f){
 if(!f.observeManifest)throw Error('accepted manifest wait requires the observer build');
 const first=await f.page.waitForFunction('window.__guidanceHarness?.manifestObservation??false');
 const basis=manifestBasis(await first.jsonValue());await first.dispose();
 const owner=await f.page.waitForFunction('('+manifestInstance.toString()+')(window.__guidanceHarness.manifestObservation,'+JSON.stringify(basis)+')');
 const captured=await owner.jsonValue();await owner.dispose();
 const accepted=await f.page.waitForFunction('('+manifestAccepted.toString()+')(window.__guidanceHarness.manifestObservation,'+JSON.stringify(captured)+')');
 const summary=await accepted.jsonValue();await accepted.dispose();return summary;
}
