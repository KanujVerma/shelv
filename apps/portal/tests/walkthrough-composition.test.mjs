import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright-core';
const site=path.resolve(fileURLToPath(new URL('../site/',import.meta.url))),origin='http://localhost';
const html=`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"><link rel="stylesheet" href="/advisor/workspace.css"><link rel="stylesheet" href="/advisor/presentation-editor.css"><div id="preview-banner" hidden></div><div id="portal-root"></div><script type="module">
import {mountClientPortal} from '/client/view.js';
import {createApprovedAlexPresentation} from '/advisor/presentation-fixtures.js';
import {createSyntheticClientRequests} from '/preview/synthetic-requests.js';
const fixture=createSyntheticClientRequests({identity:{clientId:'ec000000-0000-4000-8000-000000000001'},presentation:createApprovedAlexPresentation()});
window.readyCount=0;window.features=[];window.beforeHistory=history.length;
window.cleanup=mountClientPortal(document.querySelector('#portal-root'),{request:fixture.core,preview:true,serviceEnabled:true,manageHistory:false,showSampleDisclosure:false,now:()=>new Date('2026-10-25T12:00:00Z'),onReady:control=>{window.readyCount++;window.control=control;},mountFeature:async(kind,root,options)=>{window.features.push({kind,disclosure:options.showSampleDisclosure,day:options.now().toISOString().slice(0,10)});root.textContent=kind+' ready';return ()=>{};}});
</script>`;
async function fixture(width,run){const browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-proxy-server','--disable-background-networking','--host-resolver-rules=MAP * ~NOTFOUND']});const context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block'});await context.setOffline(true);const errors=[],blocked=[];
 await context.route('**/*',async route=>{const u=new URL(route.request().url());if(u.origin!==origin||route.request().method()!=='GET'){blocked.push(u.pathname);return route.abort();}if(u.pathname==='/hooks')return route.fulfill({body:html,contentType:'text/html'});const file=path.resolve(site,'.'+u.pathname);if(!file.startsWith(site+path.sep))return route.abort();try{await route.fulfill({body:await fs.readFile(file),contentType:({'.js':'text/javascript','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp'})[path.extname(file)]||'text/plain'});}catch{await route.fulfill({status:404,body:''});}});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));try{await page.goto(origin+'/hooks');assert.deepEqual(errors,[]);await Promise.race([page.waitForFunction(()=>window.control),new Promise((_,reject)=>page.once('pageerror',reject))]);await run(page);assert.deepEqual(errors,[]);assert.deepEqual(blocked,[]);}finally{await browser.close();}}
for(const width of [320,768])test(`shared portal navigation hooks preserve cleanup and guide clock at ${width}px`,()=>fixture(width,async page=>{
 await page.evaluate(()=>window.control.navigate('routine'));await page.locator('.client-daily-grid').waitFor();
 await page.evaluate(()=>window.cleanup.navigate('service'));await page.getByText('service ready',{exact:true}).waitFor();
 assert.deepEqual(await page.evaluate(()=>window.features.at(-1)),{kind:'service',disclosure:false,day:'2026-10-25'});
 await page.evaluate(()=>window.cleanup.navigate('plan'));await page.locator('[data-presentation-card]').first().waitFor();
 const hash=await page.evaluate(()=>location.hash);await page.locator('.wordmark').click();await page.locator('[data-presentation-card]').first().waitFor();assert.equal(await page.evaluate(()=>location.hash),hash,'Brand navigation preserves guide capability fragment');
 assert.equal(await page.evaluate(()=>window.readyCount),1,'onReady fires once per mount');assert.equal(await page.evaluate(()=>history.length===window.beforeHistory),true,'Story navigation owns history when requested');
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,JSON.stringify(await page.evaluate(()=>[...document.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().right>innerWidth+1).slice(0,6).map(e=>[e.tagName,e.className,e.getBoundingClientRect().width]))));
 await page.evaluate(()=>window.cleanup());assert.equal(await page.locator('#portal-root').innerText(),'');assert.equal(await page.locator('dialog').count(),0);
}));
