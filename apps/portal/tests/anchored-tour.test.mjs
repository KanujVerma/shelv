import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright-core';
const site=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../site'),artifacts=process.env.MAYA_TOUR_UI_ARTIFACTS;
const fixture=`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"><link rel="stylesheet" href="/advisor/workspace.css"><link rel="stylesheet" href="/walkthrough/tour.css"><style>#portal{max-width:900px;margin:auto;padding:90px 20px 150px}#anchor{margin:60px 0 100px;min-height:150px}.spacer{height:300px}#owned{padding:30px!important;max-height:85vh;overflow:auto}#owned-target{padding:30px;min-height:130px}#unrelated{display:none}</style></head><body><main id="portal"><button id="replay" class="quiet">View tour</button><section id="anchor" data-tour-target="overview" class="advisor-panel"><h2>Plan overview</h2><button id="portal-control" class="quiet">Real portal action</button></section><div class="spacer"></div><section id="bottom" data-tour-target="bottom" class="advisor-panel"><h2>Last portal section</h2></section></main><div id="host"></div><dialog id="owned"><h2>Owned portal dialog</h2><div id="owned-target" data-tour-target="detail" class="advisor-panel"><button class="quiet" id="owned-action">Real detail action</button></div></dialog><dialog id="unrelated">Unrelated dialog</dialog><script type="module">
import {createAnchoredTour} from '/walkthrough/anchored-tour.js';
window.events=[];window.portalActions=0;document.querySelector('#portal-control').onclick=()=>window.portalActions++;document.querySelector('#owned-action').onclick=()=>window.portalActions++;
const callbacks=Object.fromEntries(['Start','Next','Back','Exit','Replay','Finish'].map(key=>['on'+key,()=>window.events.push(key)]));
window.tour=createAnchoredTour({root:document.querySelector('#host'),intro:{title:'Welcome to Shelv',body:['We build a plan around your existing routine.','Explore our sample client’s care.'],meta:'Fictional sample · About four minutes',primaryLabel:'Start tour',secondaryLabel:'Explore on my own'},...callbacks,endLinks:[{label:'More about Shelv',href:'https://example.com/shelv'}]});
window.step=(target='anchor',extra={})=>window.tour.showStep({index:0,total:7,stage:{title:'Why we keep a product',body:'We keep useful basics and explain each proposed change.'},target:document.getElementById(target),interaction:{label:'Try the portal action',onInvoke:()=>document.querySelector('#portal-control').click()},...extra});
window.ready=true;
</script></body></html>`;
let browser;
before(async()=>{if(artifacts)await fs.mkdir(artifacts,{recursive:true});browser=await chromium.launch({channel:'chrome',headless:process.env.PORTAL_TEST_HEADED!=='1',args:['--disable-background-networking','--no-proxy-server','--disable-quic','--host-resolver-rules=MAP * ~NOTFOUND']});});
after(async()=>browser?.close());
async function run(width,callback){const context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block',reducedMotion:'reduce'});await context.setOffline(true);const errors=[],unexpected=[];await context.route('**/*',async route=>{const request=route.request(),url=new URL(request.url());if(url.origin!=='http://localhost'||request.method()!=='GET'){unexpected.push(url.pathname);return route.abort();}if(url.pathname==='/tour-fixture')return route.fulfill({contentType:'text/html',body:fixture});const file=path.resolve(site,'.'+url.pathname);try{if(!file.startsWith(site+path.sep))return route.abort();await route.fulfill({body:await fs.readFile(file),contentType:path.extname(file)==='.js'?'text/javascript':'text/css'});}catch{await route.fulfill({status:404,body:''});}});const page=await context.newPage();page.setDefaultTimeout(8000);page.on('pageerror',error=>errors.push(error.message));try{await page.goto('http://localhost/tour-fixture');await page.waitForFunction(()=>window.ready);await callback(page);assert.deepEqual(errors,[]);assert.deepEqual(unexpected,[]);}finally{await context.close();}}
const rect=async(page,selector)=>page.locator(selector).evaluate(e=>{const r=e.getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,width:r.width,height:r.height};});

test('welcome has keyboard focus and exit callbacks remove every owned tour layer',()=>run(390,async page=>{
 await page.locator('#replay').focus();await page.evaluate(()=>tour.showWelcome());await page.getByRole('dialog',{name:'Welcome to Shelv'}).waitFor();if(artifacts)await page.screenshot({path:path.join(artifacts,'welcome-390.png')});assert.equal(await page.evaluate(()=>document.activeElement.closest('.maya-tour-welcome')!==null),true);
 await page.getByRole('button',{name:'Start tour',exact:true}).click();assert.deepEqual(await page.evaluate(()=>events),['Start']);
 await page.evaluate(()=>step());await page.keyboard.press('Escape');assert.equal(await page.locator('.maya-tour-popover,.maya-tour-highlight,.maya-tour-welcome').count(),0);assert.equal(await page.evaluate(()=>tour.active),false);assert.deepEqual(await page.evaluate(()=>events),['Start','Exit']);assert.equal(await page.locator('#replay').evaluate(e=>e===document.activeElement),true);
 await page.evaluate(()=>tour.showWelcome());await page.getByRole('button',{name:'Explore on my own',exact:true}).click();assert.equal(await page.evaluate(()=>tour.active),false);
 await page.evaluate(()=>step());await page.getByRole('button',{name:'Close tour',exact:true}).click();assert.equal(await page.locator('.maya-tour-popover,.maya-tour-highlight,.maya-tour-welcome').count(),0);
}));
for(const width of [320,390,768,1440])test(`anchored controls remain visible and target stays clear at ${width}px`,()=>run(width,async page=>{
 await page.evaluate(()=>step());await page.locator('.maya-tour-popover[data-positioned="true"]').waitFor();
 const popup=await rect(page,'.maya-tour-popover'),target=await rect(page,'.maya-tour-highlight');assert.ok(popup.left>=8&&popup.right<=width-8&&popup.top>=8&&popup.bottom<=892,JSON.stringify(popup));assert.ok(target.width>0&&target.height>0);
 assert.ok(popup.bottom<=target.top||popup.top>=target.bottom||popup.right<=target.left||popup.left>=target.right,JSON.stringify({popup,target}));
 if(width<600)assert.ok(target.bottom<=popup.top-8);
 assert.equal(await page.locator('.maya-tour-pointer').isVisible(),true);if(artifacts)await page.screenshot({path:path.join(artifacts,`anchored-${width}.png`)});
 for(const bounds of await page.locator('.maya-tour-popover button').evaluateAll(nodes=>nodes.map(e=>({width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height}))))assert.ok(bounds.width>=44&&bounds.height>=44,JSON.stringify(bounds));
 await page.getByRole('button',{name:'Try the portal action',exact:true}).click();assert.equal(await page.evaluate(()=>portalActions),1);
 await page.getByRole('button',{name:'Next',exact:true}).click();assert.deepEqual(await page.evaluate(()=>events),['Next']);
 await page.evaluate(()=>step('bottom',{index:6,last:true,interaction:null}));await page.locator('.maya-tour-popover[data-positioned="true"]').waitFor();
 assert.equal(await page.locator('.maya-tour-popover').getByRole('link',{name:'More about Shelv',exact:true}).count(),1);const bottom=await rect(page,'.maya-tour-highlight'),last=await rect(page,'.maya-tour-popover');assert.ok(last.bottom<=892&&last.left>=8&&last.right<=width-8);if(width<600)assert.ok(bottom.bottom<=last.top-8,JSON.stringify({bottom,last}));
 await page.getByRole('button',{name:'Back',exact:true}).click();await page.getByRole('button',{name:'Finish tour',exact:true}).click();assert.equal(await page.locator('.maya-tour-popover,.maya-tour-highlight').count(),0);assert.equal(await page.evaluate(()=>tour.active),false);assert.deepEqual(await page.evaluate(()=>events),['Next','Back','Finish']);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
}));

test('popover follows a replacement anchor, repositions on resize, and leaves portal controls usable',()=>run(1440,async page=>{
 await page.evaluate(()=>step());await page.locator('.maya-tour-popover[data-positioned="true"]').waitFor();
 await page.evaluate(()=>{const old=document.querySelector('#anchor'),replacement=old.cloneNode(true);replacement.style.marginTop='160px';replacement.querySelector('#portal-control').onclick=()=>window.portalActions++;old.replaceWith(replacement);});
 await page.waitForFunction(()=>document.querySelector('.maya-tour-highlight').getBoundingClientRect().top>250);await page.setViewportSize({width:390,height:900});
 await page.waitForFunction(()=>document.querySelector('.maya-tour-popover').getBoundingClientRect().right<=382);await page.evaluate(()=>tour.suspend(true));assert.equal(await page.locator('.maya-tour-popover').isVisible(),false);await page.evaluate(()=>tour.suspend(false));assert.equal(await page.locator('.maya-tour-popover').isVisible(),true);
 await page.evaluate(()=>tour.exit());assert.equal(await page.locator('.maya-tour-popover,.maya-tour-highlight,.maya-tour-clearance').count(),0);await page.locator('#portal-control').click();assert.equal(await page.evaluate(()=>portalActions),1);
 await page.evaluate(()=>tour.dispose());assert.equal(await page.locator('.anchored-tour-root').count(),0);
}));

test('callout enters only its target’s owned modal and generic finish is dismissible',()=>run(390,async page=>{
 await page.evaluate(()=>{document.querySelector('#owned').showModal();step('owned-target',{interaction:{label:'Try detail',onInvoke:()=>document.querySelector('#owned-action').click()}});});
 const popup=page.locator('#owned .maya-tour-popover');await popup.waitFor();if(artifacts)await page.screenshot({path:path.join(artifacts,'owned-dialog-390.png')});await page.getByRole('button',{name:'Try detail',exact:true}).click();assert.equal(await page.evaluate(()=>portalActions),1);assert.equal(await page.locator('#unrelated .maya-tour-popover').count(),0);
 await page.keyboard.press('Escape');assert.equal(await page.locator('.maya-tour-popover,.maya-tour-highlight').count(),0);assert.equal(await page.locator('#owned').evaluate(e=>e.open),true);
 await page.evaluate(()=>{document.querySelector('#owned').close();tour.showFinish();});await page.getByRole('dialog',{name:'You’ve seen how Shelv works'}).waitFor();await page.getByRole('button',{name:'Replay tour',exact:true}).click();assert.equal(await page.evaluate(()=>events.at(-1)),'Replay');await page.evaluate(()=>tour.showFinish());await page.getByRole('button',{name:'Explore the sample',exact:true}).click();assert.equal(await page.evaluate(()=>tour.active),false);
}));

test('suspended welcome cannot be cancelled until the caller restores interaction',()=>run(390,async page=>{
 await page.evaluate(()=>{tour.showWelcome();tour.suspend(true);});await page.keyboard.press('Escape');assert.equal(await page.locator('.maya-tour-welcome').evaluate(e=>e.open),true);assert.equal(await page.evaluate(()=>tour.active),true);
 await page.evaluate(()=>tour.suspend(false));await page.keyboard.press('Escape');assert.equal(await page.locator('.maya-tour-welcome').count(),0);
}));

test('shared panel, heading and control appearance survives the compact callout layout',()=>run(390,async page=>{
 await page.evaluate(()=>{const primary=document.createElement('button');primary.id='reference-primary';primary.className='solid';primary.textContent='Shared primary';document.querySelector('#portal').append(primary);step();});
 const style=async(selector,keys)=>page.locator(selector).first().evaluate((element,properties)=>{const computed=getComputedStyle(element);return Object.fromEntries(properties.map(key=>[key,computed[key]]));},keys);
 const typography=['fontFamily','fontSize','fontWeight','lineHeight','letterSpacing'];
 assert.deepEqual(await style('.maya-tour-popover h2',typography),await style('#anchor h2',typography));
 assert.equal((await style('.maya-tour-popover',['outlineColor'])).outlineColor,(await style('#reference-primary',['backgroundColor'])).backgroundColor);
 const panel=['backgroundColor','borderRadius','borderTopColor','borderTopWidth','paddingTop','paddingRight','paddingBottom','paddingLeft'];assert.deepEqual(await style('.maya-tour-popover',panel),await style('#anchor',panel));
 const controls=[...typography,'backgroundColor','color','borderRadius','borderTopColor','borderTopWidth'];assert.deepEqual(await style('.maya-tour-popover .solid',controls),await style('#reference-primary',controls));assert.deepEqual(await style('.maya-tour-controls .quiet',controls),await style('#portal-control',controls));
}));

test('a tall tablet callout falls back to a sheet when no side fits around its target',()=>run(768,async page=>{
 await page.evaluate(()=>{const target=document.querySelector('#anchor');Object.assign(target.style,{position:'absolute',left:'238px',top:'478px',width:'467px',height:'44px',minHeight:'0',margin:'0'});step('anchor',{index:4,stage:{title:'Help between reviews',body:'We give a useful personal reply and keep the conclusions ready for the next review. '.repeat(4),messages:[{speaker:'Maya',text:'Can I ask about my routine? '.repeat(3)},{speaker:'Shelv',text:'We can review the plan together and explain the next step. '.repeat(4)}]},interaction:null});});
 await page.locator('.maya-tour-popover[data-positioned="true"]').waitFor();assert.equal(await page.locator('.maya-tour-highlight').isVisible(),true);const popup=await rect(page,'.maya-tour-popover'),target=await rect(page,'#anchor');assert.ok(target.top>=8&&target.bottom<=popup.top-8,JSON.stringify({popup,target}));
}));

test('anonymous heading replacement keeps nested-detail tour controls inside the exact owned modal',()=>run(390,async page=>{
 await page.evaluate(()=>{const dialog=document.querySelector('#owned');dialog.showModal();tour.showStep({index:1,total:7,stage:{title:'Product reasoning',body:'We explain the products in your plan.'},target:dialog.querySelector('h2'),interaction:null});window.unrelatedBefore=document.querySelector('#unrelated').outerHTML;dialog.innerHTML='<h2>Full ingredients</h2><button class="quiet">AVOBENZONE</button>';});
 await page.waitForFunction(()=>Boolean(document.querySelector('#owned .maya-tour-popover')));assert.equal(await page.locator('#owned').evaluate(dialog=>dialog.open),true);assert.equal(await page.locator('#owned>h2').evaluate(element=>element.classList.contains('maya-tour-target')),true);
 await page.evaluate(()=>{document.querySelector('#owned').innerHTML='<h2>AVOBENZONE</h2><p>Ingredient details</p>';});await page.waitForFunction(()=>Boolean(document.querySelector('#owned .maya-tour-popover')));await page.locator('#owned .maya-tour-popover').getByRole('button',{name:'Next',exact:true}).click();assert.equal(await page.evaluate(()=>events.at(-1)),'Next');
 await page.evaluate(()=>{document.querySelector('#owned').innerHTML='<p>Details without a heading</p>';});await page.waitForFunction(()=>Boolean(document.querySelector('#owned .maya-tour-popover')));assert.equal(await page.locator('#owned').evaluate(dialog=>dialog.classList.contains('maya-tour-target')),true);assert.equal(await page.locator('#unrelated').evaluate(element=>element.outerHTML),await page.evaluate(()=>unrelatedBefore));
 await page.locator('#owned .maya-tour-popover').getByRole('button',{name:'Exit tour',exact:true}).click();assert.equal(await page.locator('.maya-tour-popover,.maya-tour-target,.maya-tour-highlight').count(),0);
}));
