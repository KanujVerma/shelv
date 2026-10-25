import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright-core';
import {validatePresentation,publicPresentation} from '../site/advisor/presentation-model.js';
import {intakeAuthoringValue,planAuthoringValue} from '../site/advisor/authoring.js';
import {presentationRoutineMarkup} from '../site/client/presentation-renderer.js';
const empty=()=>({schemaVersion:2,consultationSections:[],baselineRoutine:[],currentProductsStatus:'none'});
const plan=()=>({...empty(),title:'Synthetic client plan',summary:'',preparedBy:'Kanuj',preparedOn:null,sources:[],categoryCards:[],routineGuides:[]});
test('browser validator distinguishes explicit no-products from missing, unknown and contradictory baseline',()=>{
 assert.deepEqual(validatePresentation(empty(),{kind:'intake',baseline:[]}),[]);for(const value of [undefined,'unknown','recorded']){const p=empty();if(value===undefined)delete p.currentProductsStatus;else p.currentProductsStatus=value;assert.ok(validatePresentation(p,{kind:'intake'}).length);}
 assert.deepEqual(JSON.parse(JSON.stringify(publicPresentation(plan()))),plan());
});
test('authoring propagates founder-confirmed original baseline without inferring it for an unreviewed client',()=>{
 assert.equal(intakeAuthoringValue({client:{routine:[]}}).currentProductsStatus,undefined);
 const p=planAuthoringValue({intake:{version:1,presentation:empty()},client:{routine:[]}},'Synthetic Client');assert.equal(p.currentProductsStatus,'none');assert.deepEqual(p.baselineRoutine,[]);
});
test('client empty routine is clear and disappears as soon as an actual active step exists',()=>{
 const view={schemaVersion:2,plan:{version:1,presentation:plan(),recommendations:[],itemStates:[]},history:[],routine:[],routineHistory:[],activeRoutine:[]};assert.match(presentationRoutineMarkup(view),/No products started yet/);
 view.activeRoutine=[{id:'started',kind:'instruction',title:'Actual reviewed instruction',productId:null,product:null,slot:null,usage:{periods:['morning'],order:1,short:{morning:null,evening:null},instructions:['Actual reviewed instruction']}}];const html=presentationRoutineMarkup(view);assert.doesNotMatch(html,/No products started yet/);assert.match(html,/Actual reviewed instruction/);
});
test('new follow-up authoring uses actual started product and directions with a source-bound context',()=>{
 const product={id:'actual-a',name:'Actual A',brand:null,variant:null,sizeLabel:'',productUrl:null,imageUrl:null,reference:null,displayPrice:null},usage={periods:['evening'],order:1,short:{morning:null,evening:'Actual directions'},instructions:['Actual directions']},source={kind:'activation',publicationVersion:1,recommendationId:'first-a'};
 const view={intake:{version:1,presentation:empty()},client:{plan:{version:1,presentation:plan()},routine:[{slot:'moisturizer',productId:'actual-a'}],activeRoutine:[{id:'first-a',kind:'product',slot:'moisturizer',productId:'actual-a',product,title:'Actual A',usage,source,guides:[]}]}};
 const p=planAuthoringValue(view,'Synthetic');assert.equal(p.currentProductsStatus,'recorded');assert.equal(p.baselineRoutine[0].productId,'actual-a');assert.deepEqual(p.baselineRoutine[0].usage,usage);assert.deepEqual(p.routineBasis,{products:[{slot:'moisturizer',productId:'actual-a',source}]});assert.deepEqual(validatePresentation(p),[]);
});
const site=fileURLToPath(new URL('../site/',import.meta.url)),artifacts=fileURLToPath(new URL('../../../.local-artifacts/no-current-products/browser/',import.meta.url));
let browser;before(async()=>{await fs.mkdir(artifacts,{recursive:true});browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-proxy-server','--disable-background-networking','--disable-quic','--host-resolver-rules=MAP * ~NOTFOUND']});});after(async()=>browser?.close());
async function fixture(width,run,{time=null}={}){
 const context=await browser.newContext({viewport:{width,height:1000},timezoneId:'America/Chicago',serviceWorkers:'block',reducedMotion:'reduce'});await context.setOffline(true);const errors=[],external=[];
 await context.route('**/*',async route=>{const request=route.request(),u=new URL(request.url());if(u.origin!=='http://localhost'||request.method()!=='GET'){external.push(request.url());return route.abort();}if(u.pathname==='/none-harness')return route.fulfill({contentType:'text/html',body:'<!doctype html><html><head><meta name=viewport content="width=device-width,initial-scale=1"></head><body><main id="test-root"></main></body></html>'});const file=path.resolve(site,'.'+u.pathname);assert.ok(file.startsWith(site));return route.fulfill({body:await fs.readFile(file),contentType:file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'application/octet-stream'});});
 const page=await context.newPage();page.setDefaultTimeout(3000);page.on('pageerror',e=>errors.push(e.message));if(time)await page.clock.install({time:new Date(time)});await page.goto('http://localhost/none-harness');
 try{await run(page);assert.deepEqual(errors,[]);assert.deepEqual(external,[]);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);}catch(error){await page.screenshot({path:path.join(artifacts,`failure-${width}.png`),fullPage:true});throw error;}finally{await context.close();}
}
for(const width of [320,390,1440])test(`founder explicitly confirms no current products, saves and reopens at ${width}px`,()=>fixture(width,async page=>{
 await page.evaluate(async()=>{
  const {mountAdvisorWorkspace}=await import('/advisor/workspace.js');for(const href of ['/style.css','/advisor/workspace.css','/advisor/presentation-editor.css']){const link=document.createElement('link');link.rel='stylesheet';link.href=href;document.head.append(link);}
  const clientId='10000000-0000-4000-8000-000000000001',directory={capabilities:{view:true,edit:true,publish:true,confirmPayments:true},clients:[{clientId,displayName:'Synthetic None Client',enrollmentStatus:'active',revision:0,publishedVersion:0,hasDraft:false}]};
  const view={client:{schemaVersion:2,revision:0,plan:null,history:[],orderProposal:{kind:'proposal',currency:'USD',items:[],subtotalCents:0,payable:false,shippingAndTaxConfirmed:false},routine:[],routineHistory:[],activeRoutine:[]},intake:null,draft:null,meetingNotes:[]};window.intents=[];
  const request=async command=>{if(command.action==='advisor_list')return structuredClone(directory);if(command.action==='advisor_read_v2')return structuredClone(view);if(command.action==='save_intake_v2'){window.intents.push(structuredClone(command));view.intake={version:1,goal:command.goal,note:command.note,presentation:command.presentation};view.client.revision=1;return {revision:1,publishedVersion:0,operation:'save_intake_v2'};}throw Error('Unexpected fixture action '+command.action);};
  window.dispose=mountAdvisorWorkspace(document.querySelector('#test-root'),{request,mountFeature:async()=>()=>{},onSignOut:()=>{},initialDirectory:directory});
 });
 await page.getByRole('button',{name:/Synthetic None Client/}).click();await page.locator('#intake-goal').fill('Build a routine after our consultation.');await page.locator('#save-intake').click();assert.equal(await page.evaluate(()=>window.intents.length),0,'Unreviewed empty cannot be saved');
 await page.getByLabel(/^Current products at consultation/).selectOption('none');await page.locator('#save-intake').click();await page.getByText('Consultation notes saved.',{exact:true}).waitFor();
 assert.equal(await page.getByLabel(/^Current products at consultation/).inputValue(),'none');assert.equal(await page.getByLabel(/^Current products at consultation/).isDisabled(),true);const [saved]=await page.evaluate(()=>window.intents);assert.deepEqual(saved.baseline,[]);assert.deepEqual(saved.presentation.baselineRoutine,[]);assert.equal(saved.presentation.currentProductsStatus,'none');
 await page.screenshot({path:path.join(artifacts,`confirmed-none-${width}.png`),fullPage:true});
 await page.locator('#open-draft').click();await page.locator('[data-action="categoryCards.add"]').click();assert.equal(await page.locator('[data-field="categoryCards.0.kind"]').inputValue(),'addition');assert.equal(await page.locator('[data-field="categoryCards.0.comparisons"]').count(),0);
}));

test('Start defaults to device-local day after UTC midnight and submits the actual chosen past date',()=>fixture(390,async page=>{
 const f=JSON.parse(await fs.readFile(new URL('../../../tests/fixtures/concierge-presentation.json',import.meta.url),'utf8')),p=f.presentation,c=p.categoryCards[0];p.baselineRoutine=[];p.currentProductsStatus='none';p.categoryCards=[c];p.routineGuides=[];c.kind='addition';c.currentProduct=null;c.comparisons=[];c.proposedProduct.imageUrl=null;c.proposedProduct.displayPrice={cents:1399,currency:'USD',sourceUrl:null,checkedOn:null,illustrative:true};
 await page.evaluate(async p=>{
  const {mountClientPortal}=await import('/client/view.js');for(const href of ['/style.css','/advisor/workspace.css']){const link=document.createElement('link');link.rel='stylesheet';link.href=href;document.head.append(link);}
  const c=p.categoryCards[0],view={schemaVersion:2,revision:0,plan:{version:1,presentation:p,recommendations:[{id:c.recommendationId,slot:c.slot,currentProductId:null,proposedProductId:c.proposedProduct.id,priceCents:1399,currency:'USD',rationale:c.reasons[0].body}],itemStates:[{recommendationId:c.recommendationId,choice:'approved',reason:null,received:true,startedOn:null}]},history:[],routine:[],routineHistory:[],activeRoutine:[],orderProposal:{kind:'proposal',currency:'USD',items:[],subtotalCents:0,payable:false,shippingAndTaxConfirmed:false}};window.intents=[];
  const request=async command=>{if(command.action==='client_read_v2')return structuredClone(view);window.intents.push(structuredClone(command));view.revision=1;return {revision:1,publishedVersion:1,operation:command.action};};window.dispose=mountClientPortal(document.querySelector('#test-root'),{request,mountFeature:async()=>()=>{},onSignOut:()=>{},preview:true});
 },p);
 const input=page.locator('input[name=startedOn]');await input.waitFor();assert.equal(await input.getAttribute('max'),'2026-10-24');assert.equal(await input.inputValue(),'2026-10-24');await input.fill('2026-10-23');await page.getByRole('button',{name:'Record start',exact:true}).click();await page.waitForFunction(()=>window.intents.length===1);assert.equal((await page.evaluate(()=>window.intents))[0].startedOn,'2026-10-23');
},{time:'2026-10-25T01:30:00Z'}));

test('synthetic preview follows the same empty-intake and actual-current follow-up boundary',async()=>{
 const {createPreviewRequests}=await import('../site/advisor/fixtures.js'),fixture=createPreviewRequests(),clientId='00000000-0000-4000-8000-000000000002';let revision=0;
 const write=async(action,payload={})=>{const r=await fixture.core({action,clientId,requestId:crypto.randomUUID(),expectedRevision:revision,...payload});revision=r.revision;return r;};
 await write('save_intake_v2',{goal:'Synthetic consultation',note:'PRIVATE',baseline:[],presentation:empty()});
 const f=JSON.parse(await fs.readFile(new URL('../../../tests/fixtures/concierge-presentation.json',import.meta.url),'utf8')),p=f.presentation,c=p.categoryCards[0];p.baselineRoutine=[];p.currentProductsStatus='none';p.categoryCards=[c];p.routineGuides=[];c.kind='addition';c.currentProduct=null;c.comparisons=[];c.proposedProduct.displayPrice={cents:1399,currency:'USD',sourceUrl:null,checkedOn:null,illustrative:true};
 const draft=async presentation=>{const {deriveRecommendations}=await import('../site/advisor/presentation-model.js');return write('save_draft_v2',{intakeVersion:1,recommendations:deriveRecommendations(presentation),advisorNote:'',presentation});};
 await draft(p);await write('publish_v2');await write('decide',{version:1,recommendationId:c.recommendationId,choice:'approved',reason:''});await write('receive',{version:1,recommendationId:c.recommendationId});assert.deepEqual(fixture.readClientView(clientId).activeRoutine,[]);await write('start',{version:1,recommendationId:c.recommendationId,startedOn:'2026-10-23'});
 const view=await fixture.core({action:'advisor_read_v2',clientId}),follow=planAuthoringValue(view,'Synthetic');assert.equal(follow.baselineRoutine[0].productId,'replacement');assert.equal(follow.routineBasis.products[0].source.kind,'activation');await draft(follow);await write('publish_v2');const current=fixture.readClientView(clientId);assert.equal(current.activeRoutine.length,1);assert.equal(current.activeRoutine[0].productId,'replacement');assert.deepEqual(current.history[0].presentation.baselineRoutine,[]);
});

test('routine basis uses the same ASCII category order as SQL for valid mixed-case custom slots',()=>{
 const product={id:'actual',name:'Actual',brand:null,variant:null,sizeLabel:'',productUrl:null,imageUrl:null,reference:null,displayPrice:null},usage={periods:['evening'],order:1,short:{morning:null,evening:null},instructions:['Actual directions']},source={kind:'activation',publicationVersion:1,recommendationId:'first'};
 const activeRoutine=['alpha','Beta'].map((slot,index)=>({id:'step-'+index,kind:'product',slot,productId:product.id,product,title:product.name,usage,source,guides:[]}));
 const p=planAuthoringValue({intake:{presentation:empty()},client:{plan:{presentation:plan()},activeRoutine}},'Synthetic');assert.deepEqual(p.routineBasis.products.map(b=>b.slot),['Beta','alpha']);
});

test('founder can deliberately rebuild a stale draft from the actual current routine without reusing old comparisons',()=>fixture(390,async page=>{
 await page.evaluate(async()=>{
  const {mountAdvisorWorkspace}=await import('/advisor/workspace.js');for(const href of ['/style.css','/advisor/workspace.css','/advisor/presentation-editor.css']){const link=document.createElement('link');link.rel='stylesheet';link.href=href;document.head.append(link);}
  const clientId='10000000-0000-4000-8000-000000000001',p={schemaVersion:2,currentProductsStatus:'none',routineBasis:{products:[]},title:'Old saved draft',summary:'',preparedBy:'Kanuj',preparedOn:null,sources:[],consultationSections:[],baselineRoutine:[],categoryCards:[],routineGuides:[]},product={id:'actual-a',name:'Actual A',brand:null,variant:null,sizeLabel:'',productUrl:null,imageUrl:null,reference:null,displayPrice:null},usage={periods:['evening'],order:1,short:{morning:null,evening:'Actual A directions'},instructions:['Actual A directions']},source={kind:'activation',publicationVersion:1,recommendationId:'first-a'};
  const view={client:{schemaVersion:2,revision:7,plan:{version:1,presentation:p,recommendations:[],itemStates:[]},history:[],routine:[{slot:'moisturizer',productId:'actual-a'}],routineHistory:[],activeRoutine:[{id:'first-a',kind:'product',slot:'moisturizer',productId:'actual-a',product,title:'Actual A',usage,source,guides:[]}],orderProposal:{kind:'proposal',currency:'USD',items:[],subtotalCents:0,payable:false,shippingAndTaxConfirmed:false}},intake:{version:1,goal:'Goal',note:'',presentation:{schemaVersion:2,consultationSections:[],baselineRoutine:[],currentProductsStatus:'none'}},draft:{intakeVersion:1,recommendations:[],advisorNote:'Private preserved',presentation:p},meetingNotes:[]},directory={capabilities:{view:true,edit:true,publish:true,confirmPayments:true},clients:[{clientId,displayName:'Synthetic Stale Client',enrollmentStatus:'active',revision:7,publishedVersion:1,hasDraft:true}]};window.intents=[];
  const request=async command=>{if(command.action==='advisor_list')return structuredClone(directory);if(command.action==='advisor_read_v2')return structuredClone(view);if(command.action==='save_draft_v2'){window.intents.push(structuredClone(command));return {revision:8,publishedVersion:1,operation:command.action};}throw Error('Unexpected '+command.action);};mountAdvisorWorkspace(document.querySelector('#test-root'),{request,mountFeature:async()=>()=>{},onSignOut:()=>{},initialDirectory:directory});
 });
 await page.getByRole('button',{name:/Synthetic Stale Client/}).click();await page.locator('#open-draft').click();page.once('dialog',dialog=>dialog.accept());await page.getByRole('button',{name:'Use current routine',exact:true}).click();assert.equal(await page.locator('[data-field="baselineRoutine.0.product.name"]').inputValue(),'Actual A');assert.equal(await page.locator('#draft-private-note').inputValue(),'Private preserved');await page.locator('#save-draft').click();await page.waitForFunction(()=>window.intents.length===1);const saved=(await page.evaluate(()=>window.intents))[0];assert.equal(saved.presentation.routineBasis.products[0].productId,'actual-a');assert.deepEqual(saved.recommendations,[]);assert.equal(saved.presentation.baselineRoutine[0].usage.instructions[0],'Actual A directions');
}));
