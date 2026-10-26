import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright-core';

const site=path.resolve(fileURLToPath(new URL('../site/',import.meta.url)));
let browser;
before(async()=>{browser=await chromium.launch({channel:'chrome',headless:true,args:['--disable-background-networking','--no-proxy-server','--disable-quic','--host-resolver-rules=MAP * ~NOTFOUND']});});
after(async()=>browser?.close());
async function fixture(width,run){
 const context=await browser.newContext({viewport:{width,height:1000},serviceWorkers:'block',reducedMotion:'reduce'});await context.setOffline(true);
 const errors=[],egress=[],missing=[];
 await context.route('**/*',async route=>{const u=new URL(route.request().url());if(u.origin!=='http://localhost'||route.request().method()!=='GET'){egress.push(u.href);return route.abort();}if(u.pathname==='/service-basis')return route.fulfill({contentType:'text/html',body:'<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"><link rel="stylesheet" href="/advisor/workspace.css"><div id="root"></div>'});const file=path.resolve(site,'.'+decodeURIComponent(u.pathname));if(!file.startsWith(site+path.sep))return route.abort();try{return route.fulfill({body:await fs.readFile(file),contentType:path.extname(file)==='.js'?'text/javascript':path.extname(file)==='.css'?'text/css':'application/json'});}catch{missing.push(u.pathname);return route.fulfill({status:404,body:''});}});
 const page=await context.newPage();page.setDefaultTimeout(5000);page.on('pageerror',error=>errors.push(error.message));
 try{
  await page.goto('http://localhost/service-basis');
  await page.evaluate(async()=>{
   const {mountServicePanel}=await import('/features/service/index.js'),{createServicePreviewRequests}=await import('/features/service/fixtures.js'),{serviceCommand}=await import('/features/service/model.js');
   const clientId='10000000-0000-4000-8000-000000000001';
   const step={kind:'product',slot:'moisturizer',productId:'product-a',title:'Product A',product:{name:'Product A'},source:{kind:'baseline',publicationVersion:1,recommendationId:null},usage:{periods:['evening'],order:1,short:{morning:null,evening:'Original A'},instructions:['Original A instructions']}};
   window.view={plan:{version:1},activeRoutine:[step],routineHistory:[]};window.store=createServicePreviewRequests({clientId,clientView:window.view,now:'2026-10-26T12:00:00Z'});window.memory={pending:null,forms:new Map(),closed:false};window.commands=[];window.lose=false;window.coverageEnd='2026-11-01';
   window.send=(action,payload,client=false)=>(client?window.store.client:window.store.advisor)(serviceCommand(action,payload,{clientId,revision:window.store.read().revision,requestId:crypto.randomUUID()}));
   window.mount=()=>mountServicePanel(document.querySelector('#root'),{request:async command=>{if(command.action==='save_instruction_draft')window.commands.push(structuredClone(command));const result=await window.store.advisor(command);if(command.action==='save_instruction_draft'&&window.lose){window.lose=false;throw {status:503};}return result;},mode:'advisor',clientId,getClientView:()=>window.store.getClientView(),taskState:window.memory,servicePeriodEnd:window.coverageEnd,now:()=>new Date('2026-10-26T12:00:00Z')});
   window.remount=async kind=>{
    window.cleanup();
    if(kind==='product'){Object.assign(window.view.activeRoutine[0],{productId:'product-b',title:'Product B',product:{name:'Product B'},source:{kind:'activation',publicationVersion:1,recommendationId:'rec-b'},usage:{periods:['evening'],order:1,short:{morning:null,evening:'Original B'},instructions:['Distinct B instructions']}});window.store.updateClientView(window.view);}
    if(kind==='activation'){window.view.activeRoutine[0].source={kind:'activation',publicationVersion:1,recommendationId:'another-start'};window.store.updateClientView(window.view);}
    if(kind==='publication'){window.view.plan.version=2;window.store.updateClientView(window.view);}
    if(kind==='coverage')window.coverageEnd='2026-12-01';
    if(kind==='instruction'){const draft=await window.send('save_instruction_draft',{slot:'moisturizer',productId:'product-a',planVersion:1,baseInstructionVersion:0,usage:{periods:['evening'],order:1,short:{morning:null,evening:'New canonical A'},instructions:['New canonical A instructions']},reason:'Separately reviewed instructions',reviewId:null,effectiveOn:'2026-10-26'});await window.send('publish_instruction_revision',{draftId:draft.entityId});}
    window.cleanup=window.mount();
   };
   window.cleanup=window.mount();
  });
  await page.locator('.shelv-service[aria-busy="false"]').waitFor();await run(page);
  assert.deepEqual(errors,[]);assert.deepEqual(egress,[]);assert.deepEqual(missing,[]);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 }finally{await context.close();}
}
const open=async page=>{const summary=page.getByText('Revise instructions for an active product',{exact:true});if(!await summary.evaluate(element=>element.parentElement.open))await summary.click();};
const draft=async page=>{await open(page);await page.getByLabel('Instructions (one per line)',{exact:true}).fill('Specific directions drafted for Product A');await page.getByLabel('Reason for the change',{exact:true}).fill('Product A needs reduced frequency');};
const remount=async(page,kind)=>{await page.evaluate(kind=>window.remount(kind),kind);await page.locator('.shelv-service[aria-busy="false"]').waitFor();await open(page);};

for(const width of [320,390,1440])for(const kind of ['product','activation','publication','instruction']){
 test(`instruction draft cannot rebind after ${kind} changes at ${width}px`,()=>fixture(width,async page=>{
  await draft(page);await remount(page,kind);
  assert.equal(await page.getByLabel('Instructions (one per line)',{exact:true}).inputValue(),'Specific directions drafted for Product A');
  assert.equal(await page.getByRole('button',{name:'Save instruction draft',exact:true}).isDisabled(),true,'Changed authoring basis must block saving old directions');
  assert.equal((await page.evaluate(()=>window.commands)).length,0);
  await page.getByRole('button',{name:'Start a new instruction draft',exact:true}).click();await open(page);
  assert.notEqual(await page.getByLabel('Instructions (one per line)',{exact:true}).inputValue(),'Specific directions drafted for Product A');assert.equal(await page.getByLabel('Reason for the change',{exact:true}).inputValue(),'');
  await page.getByLabel('Instructions (one per line)',{exact:true}).fill('New directions reviewed against the current product');await page.getByLabel('Reason for the change',{exact:true}).fill('Explicitly reviewed current context');await page.getByRole('button',{name:'Save instruction draft',exact:true}).click();await page.locator('.shelv-service[aria-busy="false"]').waitFor();
  const command=(await page.evaluate(()=>window.commands))[0];assert.equal(command.productId,kind==='product'?'product-b':'product-a');assert.deepEqual(command.usage.instructions,['New directions reviewed against the current product']);assert.equal(command.planVersion,kind==='publication'?2:1);assert.equal(command.baseInstructionVersion,kind==='instruction'?1:0);
 }));
}
test('an unchanged instruction basis restores and saves the original product draft',()=>fixture(390,async page=>{
 await draft(page);await remount(page);assert.equal(await page.getByRole('button',{name:'Save instruction draft',exact:true}).isDisabled(),false);await page.getByRole('button',{name:'Save instruction draft',exact:true}).click();await page.locator('.shelv-service[aria-busy="false"]').waitFor();const commands=await page.evaluate(()=>window.commands);assert.equal(commands[0].productId,'product-a');assert.deepEqual(commands[0].usage.instructions,['Specific directions drafted for Product A']);
}));
test('an uncertain instruction command stays exact when its active product changes',()=>fixture(390,async page=>{
 await draft(page);await page.evaluate(()=>window.lose=true);await page.getByRole('button',{name:'Save instruction draft',exact:true}).click();await page.getByRole('button',{name:'Retry same submission',exact:true}).waitFor();await remount(page,'product');await page.getByRole('button',{name:'Retry same submission',exact:true}).click();await page.locator('.shelv-service[aria-busy="false"]').waitFor();const commands=await page.evaluate(()=>window.commands);assert.equal(commands.length,2);assert.deepEqual(commands[1],commands[0]);assert.equal(commands[0].productId,'product-a');
}));
test('a return event draft cannot silently adopt a later canonical case status',()=>fixture(390,async page=>{
 await page.evaluate(async()=>{const purchase=await window.send('record_purchase',{quoteId:null,recommendationId:null,retailer:'Neutral shop',seller:'Neutral seller',productId:'product-a',productName:'Product A',quantity:1,unitPriceCents:1000,taxCents:0,shippingCents:0,purchasedOn:'2026-10-25',deliveredOn:null,policy:{checkedOn:'2026-10-25',url:'https://example.com/returns',summary:'Unopened returns after review',openedAllowed:false,finalSale:false,returnBy:null,shipBy:null,returnCostCents:0},orderReference:'synthetic-order',receiptReference:'synthetic-receipt',termsDisclosed:true});const result=await window.send('request_return',{purchaseId:purchase.entityId,quantity:1,reason:'Unused item',condition:'unopened'},true);window.returnId=result.entityId;await window.remount();});await page.locator('.shelv-service[aria-busy="false"]').waitFor();
 await page.getByLabel('Client-visible instructions or outcome',{exact:true}).fill('Text prepared for the requested return');
 await page.evaluate(async()=>{await window.send('record_return_event',{returnId:window.returnId,status:'reviewing',note:'Another advisor started review',expectedRefundCents:null,retailerRefundCents:null,clientRepaidCents:null,privateReference:'',policyCheckedOn:null});await window.remount();});await page.locator('.shelv-service[aria-busy="false"]').waitFor();
 assert.equal(await page.getByLabel('Client-visible instructions or outcome',{exact:true}).inputValue(),'Text prepared for the requested return');assert.equal(await page.getByRole('button',{name:'Record return event',exact:true}).isDisabled(),true);
 await page.getByRole('button',{name:'Start a new return event',exact:true}).click();assert.equal(await page.getByLabel('Client-visible instructions or outcome',{exact:true}).inputValue(),'');
}));
test('a cancellation draft requires review when the paid support end changes',()=>fixture(390,async page=>{
 await page.getByText('Record cancellation',{exact:true}).click();await page.getByLabel('Reason or agreed handoff',{exact:true}).fill('Original agreed handoff');await page.getByLabel('I confirmed this support end with the client',{exact:true}).check();
 await page.evaluate(()=>window.remount('coverage'));await page.locator('.shelv-service[aria-busy="false"]').waitFor();await page.getByText('Record cancellation',{exact:true}).click();
 assert.equal(await page.getByLabel('Reason or agreed handoff',{exact:true}).inputValue(),'Original agreed handoff');assert.equal(await page.getByRole('button',{name:'Record cancellation and stop renewals',exact:true}).isDisabled(),true);assert.equal(await page.getByLabel('I confirmed this support end with the client',{exact:true}).isChecked(),false);
 await page.getByRole('button',{name:'Start a new cancellation draft',exact:true}).click();assert.equal(await page.getByLabel('Confirmed support end (exclusive date)',{exact:true}).inputValue(),'2026-12-01');assert.equal(await page.getByLabel('Reason or agreed handoff',{exact:true}).inputValue(),'');
}));
