import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright-core';
const site=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../site'),out=path.resolve(process.env.WALKTHROUGH_UI_ARTIFACTS||path.join(os.tmpdir(),'shelv-ui-reuse'));
const serviceFixture=`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"><link rel="stylesheet" href="/advisor/workspace.css"><link rel="stylesheet" href="/features/service/service.css"></head><body><main class="advisor-tab-content"><section id="reference-panel" class="advisor-panel"><h2>Shared portal controls</h2><button id="reference-primary" class="solid">Shared primary</button><button id="reference-secondary" class="quiet">Shared secondary</button><form><label>Shared input<input id="reference-input" type="date"></label><label>Shared text<textarea id="reference-textarea"></textarea></label><label>Shared select<select id="reference-select"><option>Text</option></select></label></form></section></main><main id="service-host" class="advisor-tab-content"></main><script type="module">
import {createApprovedAlexPresentation} from '/advisor/presentation-fixtures.js';
import {createSyntheticClientRequests} from '/preview/synthetic-requests.js';
import {createServicePreviewRequests} from '/features/service/fixtures.js';
import {mountServicePanel} from '/features/service/index.js';
const clientId='ef000000-0000-4000-8000-000000000009',presentation=createApprovedAlexPresentation();presentation.title='Neutral visitor’s plan';const plan=createSyntheticClientRequests({identity:{clientId},presentation});const requests=createServicePreviewRequests({clientId,clientView:plan.read(),now:'2026-10-25T18:00:00Z'});
mountServicePanel(document.querySelector('#service-host'),{clientId,mode:'advisor',request:requests.advisor,clientView:plan.read(),getClientView:requests.getClientView,now:()=>new Date('2026-10-25T18:00:00Z')});
</script></body></html>`;
let browser;
before(async()=>{await fs.mkdir(out,{recursive:true});browser=await chromium.launch({channel:'chrome',headless:process.env.PORTAL_TEST_HEADED!=='1',args:['--disable-background-networking','--no-proxy-server','--disable-quic','--host-resolver-rules=MAP * ~NOTFOUND']});});
after(async()=>browser?.close());
async function fixture(width,url,run){const context=await browser.newContext({viewport:{width,height:1000},serviceWorkers:'block'});await context.setOffline(true);const errors=[],unexpected=[];await context.route('**/*',async route=>{const request=route.request(),u=new URL(request.url());if(u.origin!=='http://localhost'||request.method()!=='GET'){unexpected.push(u.pathname);return route.abort();}if(u.pathname==='/neutral-service-ui')return route.fulfill({contentType:'text/html',body:serviceFixture});const file=path.resolve(site,'.'+u.pathname+(u.pathname.endsWith('/')?'index.html':''));try{if(!file.startsWith(site+path.sep))return route.abort();await route.fulfill({body:await fs.readFile(file),contentType:({'.js':'text/javascript','.html':'text/html','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.json':'application/json'})[path.extname(file)]||'application/octet-stream'});}catch{await route.fulfill({status:404,body:''});}});const page=await context.newPage();page.setDefaultTimeout(8000);page.on('pageerror',e=>errors.push(e.message));try{await page.goto('http://localhost'+url);await run(page);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);assert.deepEqual(unexpected,[]);}finally{await context.close();}}
async function appearance(page,selector,properties){return page.locator(selector).first().evaluate((e,keys)=>{const s=getComputedStyle(e);return Object.fromEntries(keys.map(k=>[k,s[k]]));},properties);}
const typography=['fontFamily','fontSize','fontWeight','lineHeight','letterSpacing'],buttonStyle=[...typography,'borderRadius','backgroundColor','color','borderTopColor','borderTopWidth'],panelStyle=['backgroundColor','color','borderRadius','borderTopColor','borderTopWidth','paddingTop','paddingRight','paddingBottom','paddingLeft'],fieldStyle=[...typography,'borderRadius','backgroundColor','color','borderTopColor','borderTopWidth','paddingTop','paddingRight','paddingBottom','paddingLeft'];
for(const width of [320,390,768,1440]){
 test(`welcome and anchored callouts reuse portal typography, buttons and panels at ${width}px`,async()=>fixture(width,'/maya/?guided=1',async page=>{
  await page.locator('[data-presentation-card] h2').first().waitFor();const welcome=page.getByRole('dialog',{name:'See how Shelv works'}),guide=page.locator('.maya-tour-popover');await welcome.waitFor();
  await page.evaluate(()=>{const ref=document.createElement('section');ref.id='reference-panel';ref.className='advisor-panel';const heading=document.createElement('h2');heading.id='reference-portal-heading';heading.textContent='Shared portal heading';ref.append(heading);document.body.append(ref);});
  const portalHeading=await appearance(page,'#reference-portal-heading',typography),welcomeHeading=await appearance(page,'.maya-tour-welcome h2',typography);assert.deepEqual(welcomeHeading,portalHeading);assert.equal(welcomeHeading.fontFamily,(await appearance(page,'[data-presentation-card] h2',['fontFamily'])).fontFamily);
  const portalPrimary=await appearance(page,'[data-approve].solid',buttonStyle),welcomePrimary=await appearance(page,'.maya-tour-dialog-controls .solid',buttonStyle);assert.deepEqual(welcomePrimary,portalPrimary);
  const portalSecondary=await appearance(page,'.plan-actions summary.quiet',buttonStyle),welcomeSecondary=await appearance(page,'.maya-tour-dialog-controls .quiet',buttonStyle);assert.deepEqual(welcomeSecondary,portalSecondary);
  for(const rect of await welcome.locator('button').evaluateAll(es=>es.map(e=>({width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height}))))assert.ok(rect.width>=44&&rect.height>=44);
  await page.screenshot({path:path.join(out,`guide-welcome-${width}.png`)});await welcome.getByRole('button',{name:'Start tour',exact:true}).click();await guide.waitFor();
  const heading=await appearance(page,'.maya-tour-popover h2',typography);assert.deepEqual(heading,portalHeading);
  const primary=await appearance(page,'.maya-tour-controls .solid',buttonStyle);assert.deepEqual(primary,portalPrimary);
  const secondary=await appearance(page,'.maya-tour-controls .quiet:not(:disabled)',buttonStyle);assert.deepEqual(secondary,portalSecondary);
  const panel=await appearance(page,'.maya-tour-popover',panelStyle),sharedPanel=await appearance(page,'#reference-panel',panelStyle);assert.deepEqual(panel,sharedPanel);
  for(const rect of await guide.locator('button').evaluateAll(es=>es.map(e=>({width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height}))))assert.ok(rect.width>=44&&rect.height>=44);
  await page.locator('#reference-panel').evaluate(e=>e.remove());await page.screenshot({path:path.join(out,`guide-${width}.png`)});
  await page.evaluate(()=>{const p=new URLSearchParams(location.hash.slice(1));p.set('step','between-reviews');location.hash=p.toString();});await page.locator('.maya-tour-message').first().waitFor();assert.equal(await page.locator('.maya-tour-message').count(),2);
  await page.screenshot({path:path.join(out,`guide-message-${width}.png`)});await fs.writeFile(path.join(out,`guide-${width}-styles.json`),JSON.stringify({welcomeHeading,heading,portalHeading,welcomePrimary,primary,portalPrimary,welcomeSecondary,secondary,portalSecondary,panel,sharedPanel},null,2)+'\n');
 }));
 test(`service reuses shared panels, form controls and buttons at ${width}px`,async()=>fixture(width,'/neutral-service-ui',async page=>{
  await page.locator('.shelv-service[aria-busy=false]').waitFor();await page.getByText('Record a conversation review',{exact:true}).click();const form=page.locator('.service-form').first();await form.locator('textarea').first().waitFor();
  const panel=await appearance(page,'.service-card',panelStyle),sharedPanel=await appearance(page,'#reference-panel',panelStyle);assert.deepEqual(panel,sharedPanel);
  const primary=await appearance(page,'.service-form button.solid',buttonStyle),sharedPrimary=await appearance(page,'#reference-primary',buttonStyle);assert.deepEqual(primary,sharedPrimary);
  const secondary=await appearance(page,'.service-toolbar button.quiet',buttonStyle),sharedSecondary=await appearance(page,'#reference-secondary',buttonStyle);assert.deepEqual(secondary,sharedSecondary);
  const fields={};for(const [actual,reference] of [['.service-form input[type=date]','#reference-input'],['.service-form textarea','#reference-textarea'],['.service-form select','#reference-select']]){const current=await appearance(page,actual,fieldStyle),shared=await appearance(page,reference,fieldStyle);assert.deepEqual(current,shared);fields[reference]={current,shared};}
  for(const rect of await page.locator('.shelv-service button:visible,.shelv-service summary:visible,.service-form input:visible,.service-form select:visible,.service-form textarea:visible').evaluateAll(es=>es.map(e=>({width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height}))))assert.ok(rect.width>=44&&rect.height>=44,JSON.stringify(rect));
  await page.getByText('Revise instructions for an active product',{exact:true}).click();assert.ok(await page.locator('.service-form input[type=checkbox]').first().evaluate(e=>e.closest('label').getBoundingClientRect().height>=44));
  await form.scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,`service-${width}.png`)});await fs.writeFile(path.join(out,`service-${width}-styles.json`),JSON.stringify({panel,sharedPanel,primary,sharedPrimary,secondary,sharedSecondary,fields},null,2)+'\n');
 }));
}
