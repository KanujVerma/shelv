import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright-core';
const site=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../site');
const fixture=`<!doctype html><html><head><link rel="stylesheet" href="/style.css"><link rel="stylesheet" href="/advisor/workspace.css"><link rel="stylesheet" href="/walkthrough/guide.css"></head><body><div id="normal"></div><div id="viewer"></div><script type="module">
import {mountWalkthroughViewer} from '/walkthrough/viewer.js';
import {mountClientPortal} from '/client/view.js';
import {createApprovedAlexPresentation} from '/advisor/presentation-fixtures.js';
import {createSyntheticClientRequests} from '/preview/synthetic-requests.js';
const presentation=createApprovedAlexPresentation();presentation.title='Neutral visitor’s plan';
const local=createSyntheticClientRequests({identity:{clientId:'ef000000-0000-4000-8000-000000000003'},presentation});
window.otherCleanup=mountClientPortal(document.querySelector('#normal'),{request:local.core,mountFeature:()=>()=>{},onSignOut:()=>{},preview:true,manageHistory:false});
window.otherDialog=document.querySelector('dialog.client-dialog');
const snapshot={schemaVersion:1,caseId:'ef000000-0000-4000-8000-000000000001',versionId:'ef000000-0000-4000-8000-000000000002',presentation,stages:[{id:'overview',title:'Your routine',section:'plan',day:'2026-10-20',body:'Review the product directions.',messages:[]},{id:'next-step',title:'Review together',section:'plan',day:'2026-10-21',body:'Keep the current basics.',messages:[]}]};
window.holdAuthorization=false;window.authorizationPending=false;
window.viewerCleanup=mountWalkthroughViewer(document.querySelector('#viewer'),{snapshot,authorize:()=>{if(!window.holdAuthorization)return Promise.resolve(snapshot);window.authorizationPending=true;return new Promise((resolve,reject)=>{window.allowAuthorization=()=>{window.authorizationPending=false;resolve(snapshot)};window.denyAuthorization=()=>{window.authorizationPending=false;reject(Error('unavailable'))}})}});
</script></body></html>`;
test('focus recheck suspends only the owned modal until success and removes it on denial',async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true,args:['--disable-background-networking','--no-proxy-server','--disable-quic','--host-resolver-rules=MAP * ~NOTFOUND']});const context=await browser.newContext({viewport:{width:1440,height:1000},serviceWorkers:'block'});await context.setOffline(true);const errors=[],unexpected=[];
 await context.route('**/*',async route=>{const request=route.request(),url=new URL(request.url());if(url.origin!=='http://localhost'||request.method()!=='GET'){unexpected.push(url.pathname);return route.abort();}if(url.pathname==='/neutral-modal-fixture')return route.fulfill({body:fixture,contentType:'text/html'});const file=path.resolve(site,'.'+url.pathname);try{if(!file.startsWith(site+path.sep))return route.abort();await route.fulfill({body:await fs.readFile(file),contentType:({'.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.json':'application/json'})[path.extname(file)]||'application/octet-stream'});}catch{await route.fulfill({status:404,body:''});}});
 const page=await context.newPage();page.setDefaultTimeout(8000);page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto('http://localhost/neutral-modal-fixture');await page.locator('#viewer [data-plan-card]').first().waitFor();await page.locator('#normal [data-plan-card]').first().waitFor();await page.locator('#viewer [data-plan-card]').first().click();await page.locator('#viewer .client-product-page').waitFor();await page.locator('#viewer .product-ingredients summary').click();await page.locator('#viewer .inci-list [data-ingredient]').first().click();await page.locator('dialog.client-dialog[open]').waitFor();
  const baseline=await page.evaluate(()=>({otherMarkup:document.querySelector('#normal').innerHTML,otherDialogConnected:window.otherDialog.isConnected,otherDialogInert:window.otherDialog.inert,otherDialogOpen:window.otherDialog.open}));
  await page.evaluate(()=>{window.ownedDialog=document.querySelector('dialog.client-dialog[open]');window.holdAuthorization=true;window.dispatchEvent(new Event('focus'));});await page.waitForFunction(()=>window.authorizationPending&&document.querySelector('.walkthrough-shell').inert);
  assert.deepEqual(await page.evaluate(()=>({open:window.ownedDialog.open,inert:window.ownedDialog.inert})),{open:false,inert:true});
  await page.keyboard.press('Escape');await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>Boolean(document.activeElement.closest('#viewer')||document.activeElement===window.ownedDialog||window.ownedDialog.contains(document.activeElement))),false);assert.match(page.url(),/step=overview/);
  assert.deepEqual(await page.evaluate(()=>({otherMarkup:document.querySelector('#normal').innerHTML,otherDialogConnected:window.otherDialog.isConnected,otherDialogInert:window.otherDialog.inert,otherDialogOpen:window.otherDialog.open})),baseline);
  await page.evaluate(()=>{window.holdAuthorization=false;window.allowAuthorization();});await page.waitForFunction(()=>!document.querySelector('.walkthrough-shell').inert);assert.deepEqual(await page.evaluate(()=>({open:window.ownedDialog.open,inert:window.ownedDialog.inert})),{open:false,inert:false});
  await page.locator('#viewer .inci-list [data-ingredient]').first().click();await page.locator('dialog.client-dialog[open]').waitFor();await page.evaluate(()=>{window.holdAuthorization=true;window.dispatchEvent(new Event('focus'));});await page.waitForFunction(()=>window.authorizationPending&&document.querySelector('.walkthrough-shell').inert);assert.equal(await page.evaluate(()=>window.ownedDialog.open),false);await page.keyboard.press('Escape');await page.evaluate(()=>window.denyAuthorization());await page.locator('#viewer').getByText('This walkthrough is unavailable.').waitFor();
  assert.equal(await page.evaluate(()=>window.ownedDialog.isConnected),false);assert.deepEqual(await page.evaluate(()=>({otherMarkup:document.querySelector('#normal').innerHTML,otherDialogConnected:window.otherDialog.isConnected,otherDialogInert:window.otherDialog.inert,otherDialogOpen:window.otherDialog.open})),baseline);assert.equal(await page.locator('dialog.client-dialog').count(),1);assert.deepEqual(errors,[]);assert.deepEqual(unexpected,[]);
 }finally{await context.close();await browser.close();}
});
