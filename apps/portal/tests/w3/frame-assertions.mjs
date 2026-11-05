import assert from 'node:assert/strict';
import {buildRoute} from '../../src/navigation/routes.ts';

// Assertion exports only. W7 owns the Page, build/host, data fixture, network
// policy, capture artifacts and fresh execution packet. Import opens nothing.
// These functions supply no Auth, server, grant, currentness or success facade.
const treatment='ordinary-azelaic-10',moisturizer='cerave-pm';
const stageIds=['meet-maya','meaningful-decision','daily-use','follow-up','next-step'];

function checkedOrigin(value){
  const url=new URL(value);
  assert.ok(['http:','https:'].includes(url.protocol));
  assert.equal(url.username+url.password+url.search+url.hash,'');
  assert.ok(['127.0.0.1','[::1]','localhost','shelv-app.invalid','shelv-w3-frames.invalid'].includes(url.hostname),'only an admitted local/synthetic origin');
  return url.origin;
}
async function open(page,origin,route){
  const path=typeof route==='string'?route:buildRoute(route);
  assert.ok(path.startsWith('/')&&!path.startsWith('//'));
  const url=new URL(path,origin);assert.equal(url.origin,origin);
  await page.goto(url.href);
}
async function settled(page){
  await page.evaluate(async()=>{await document.fonts.ready;});
  await page.waitForFunction(()=>![...document.querySelectorAll('.shelv-notice-title')].some(el=>el.textContent==='checking current directions'));
  assert.equal(await page.getByText('current directions unavailable',{exact:true}).count(),0);
}
async function noOverflow(page){
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true,'no horizontal page overflow');
}
async function images(page,ids){
  for(const id of ids){
    const image=page.locator(`[data-product-photo="${id}"] img`).first();
    await image.waitFor({state:'visible'});
    await image.evaluate(image=>image.decode());
    assert.equal(await image.evaluate(image=>image.naturalWidth>0&&image.naturalHeight>0),true,'available source image delivered for '+id);
  }
}
async function record(page,capture,code,details={},imageIds=[]){
  assert.equal(typeof capture,'function','W7 must supply the actual capture writer');
  await settled(page);await noOverflow(page);await images(page,imageIds);
  const geometry=await page.evaluate(()=>{
    const bounds=el=>{if(!el)return null;const r=el.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height};};
    return {viewport:{width:innerWidth,height:innerHeight},
      routine:bounds(document.querySelector('.plan-routine')),useForm:bounds(document.querySelector('.plan-use-form')),
      evidence:bounds(document.querySelector('.plan-evidence-main')),dialog:bounds(document.querySelector('[role="dialog"]')),
      clientShell:bounds(document.querySelector('.shelv-shell')),guide:bounds(document.querySelector('.maya-guide-rail')),
      images:[...document.querySelectorAll('[data-product-photo]')].filter(el=>el.getBoundingClientRect().width>0).map(el=>({productId:el.getAttribute('data-product-photo'),slot:bounds(el),image:bounds(el.querySelector('img'))}))};
  });
  await capture({code,page,scope:'FRONTEND_RENDER_ONLY',geometry,...details});
}
async function select(page,label,value){
  await page.getByRole('combobox',{name:label,exact:true}).click();
  await page.getByRole('option',{name:value,exact:true}).click();
}

/** Current V3 client frontend with W7's declared synthetic read fixture. The
 * actual Root application/ports must run; no test entry or injected callbacks.
 * This neither submits care nor accepts Auth/persistence/permissions. */
export async function captureClientFrames({page,origin,capture}){
  origin=checkedOrigin(origin);
  await open(page,origin,{name:'plan',routine:'morning'});
  await page.getByRole('heading',{name:'your current routine',exact:true}).waitFor();
  assert.match(await page.locator('[data-plan-routine]').innerText(),/water rinse/i);
  assert.equal(await page.locator('[data-plan-routine] [data-product-id="cerave-hydrating-cleanser"]').count(),0,'no invented morning cleanser');
  assert.equal(await page.locator(`[data-plan-routine] [data-product-id="${treatment}"]`).count(),0,'unstarted proposal stays separate');
  await record(page,capture,'C01',{},[moisturizer]);

  await page.getByRole('tab',{name:'evening',exact:true}).click();
  await page.locator('[data-plan-routine] [data-product-id="cerave-hydrating-cleanser"]').waitFor();
  assert.match(await page.locator('[data-plan-routine]').innerText(),/if wearing makeup/i);
  await record(page,capture,'C01E',{},[moisturizer]);

  const opener=page.getByRole('button',{name:/^details for CeraVe PM/});
  await opener.focus();await page.keyboard.press('Enter');
  const sheet=page.getByRole('dialog');await sheet.waitFor();
  assert.match(await sheet.innerText(),/CeraVe PM/);
  await record(page,capture,'C03',{},[moisturizer]);
  await sheet.getByRole('button',{name:'ingredients & evidence',exact:true}).click();
  await page.getByRole('heading',{level:1,name:/^CeraVe PM.*ingredients & reasoning/}).waitFor();
  assert.doesNotMatch(await page.getByRole('heading',{level:1}).innerText(),/azelaic/i);
  await record(page,capture,'C03D');
  await page.getByRole('button',{name:'back to product',exact:true}).click();
  await sheet.waitFor();
  await sheet.getByRole('button',{name:'record a change in use',exact:true}).click();
  await page.getByRole('heading',{level:1,name:/^record a change.*CeraVe PM/}).waitFor();
  assert.match(await page.getByRole('combobox',{name:'what changed?',exact:true}).innerText(),/paused/);
  await record(page,capture,'C07C',{},[moisturizer]);

  await page.getByRole('button',{name:'back to product',exact:true}).click();
  await sheet.waitFor();await page.keyboard.press('Escape');
  await sheet.waitFor({state:'hidden'});
  await page.waitForFunction(()=>document.activeElement?.id==='plan-product-cerave-pm');
  assert.equal(await page.getByRole('tab',{name:'evening',exact:true}).getAttribute('aria-selected'),'true');
  const proposal=page.locator(`.plan-proposal:has([data-product-photo="${treatment}"])`);
  await proposal.getByRole('button',{name:'review recommendation',exact:true}).click();
  await page.getByRole('heading',{level:1,name:'review a recommendation',exact:true}).waitFor();
  await record(page,capture,'C02',{},[treatment]);
  await page.getByRole('button',{name:'directions, ingredients & sources',exact:true}).click();
  await page.getByRole('heading',{level:1,name:'directions & evidence',exact:true}).waitFor();
  assert.match(await page.locator('[data-plan-evidence]').innerText(),/patch test/i);
  assert.match(await page.locator('[data-plan-evidence]').innerText(),/10%/);
  await record(page,capture,'C02D');

  await open(page,origin,{name:'product-use',productId:treatment,routine:'evening'});
  await page.getByRole('heading',{level:1,name:'record actual use',exact:true}).waitFor();
  for(const name of ['yes','no','not sure'])await page.getByRole('button',{name,exact:true}).waitFor();
  await record(page,capture,'C07',{},[treatment]);
}

/** Source3's real Root callback remains required. Missing callback is a failed
 * acceptance assertion, never replaced with a fixture navigation function. */
export async function verifySelfPurchaseAndDraftRecovery({page,origin}){
  origin=checkedOrigin(origin);
  await open(page,origin,{name:'recommendation',decisionId:'maya-card-treatments',routine:'evening'});
  const self=page.getByRole('button',{name:'i’ll buy it myself',exact:true});
  await self.waitFor();await self.focus();await page.keyboard.press('Enter');
  await page.getByRole('heading',{level:1,name:'record actual use',exact:true}).waitFor();
  assert.match(await page.getByRole('combobox',{name:'how did you get it?',exact:true}).innerText(),/i bought it myself/);
  await select(page,'what changed?','using differently');
  const note='W3_FICTIONAL_UNSENT_NOTE';
  await page.getByRole('textbox',{name:'how are you using it differently?',exact:true}).fill(note);
  await page.getByRole('button',{name:'back',exact:true}).click();
  await page.getByRole('heading',{level:1,name:'review a recommendation',exact:true}).waitFor();
  await page.goForward();
  assert.equal(await page.getByRole('textbox',{name:'how are you using it differently?',exact:true}).inputValue(),note);
  assert.equal(page.url().includes(note),false);
  assert.equal((await page.evaluate(()=>JSON.stringify(history.state))).includes(note),false);
  await noOverflow(page);
}

/** Actual public Root Maya. No client-session/API fixture is used here. W7's
 * host must refuse unexpected calls; this observer additionally asserts none. */
export async function captureMayaGuide({page,origin,capture}){
  origin=checkedOrigin(origin);
  const api=[],foreign=[],onRequest=request=>{const url=new URL(request.url());if(url.pathname.startsWith('/api/'))api.push(request.method()+' '+url.pathname);if(url.origin!==origin)foreign.push(request.method()+' '+url.origin+url.pathname);};
  page.on('request',onRequest);
  try{
    await open(page,origin,{name:'maya',stage:1});
    const shell=page.locator('.maya-client-canvas .shelv-shell[data-mode="public-demo"]');
    await shell.waitFor();assert.equal(await shell.count(),1,'one actual shared client shell');
    assert.equal(await page.locator('.maya-guide-rail .shelv-shell').count(),0,'guide outside the shell');
    const menu=page.getByRole('button',{name:'menu',exact:true});
    if(await menu.isVisible())await menu.click();
    const links=shell.locator('.shelv-nav-link');assert.equal(await links.count(),4);
    for(let i=1;i<4;i++){
      const link=links.nth(i);assert.equal(await link.getAttribute('aria-disabled'),'true');assert.equal(await link.getAttribute('href'),null);
      await link.focus();await page.keyboard.press('Enter');assert.equal(new URL(page.url()).pathname,'/maya');
    }
    assert.equal(new URL(await links.first().getAttribute('href'),origin).pathname,'/maya');
    await links.first().click();assert.equal(new URL(page.url()).pathname,'/maya');
    await page.getByRole('button',{name:'reset demo',exact:true}).click();
    for(let stage=1;stage<=5;stage++){
      await page.locator(`[data-maya-stage="${stageIds[stage-1]}"]`).waitFor();
      await page.getByText(`stage ${stage} of 5`,{exact:true}).waitFor();
      const heading=page.locator('#maya-guide-heading');
      const style=await heading.evaluate(el=>{const s=getComputedStyle(el);return{family:s.fontFamily,size:s.fontSize,line:s.lineHeight,weight:s.fontWeight};});
      assert.match(style.family,/Instrument Serif/);assert.equal(style.size,'34px');assert.equal(style.line,'39px');assert.equal(style.weight,'400');
      if(stage>1)assert.equal(await heading.evaluate(el=>el===document.activeElement),true,'guide stage focus');
      await record(page,capture,'D01',{stage,variant:'guided'},stage===5?[]:stage===2?[treatment]:[moisturizer]);
      await page.getByRole('button',{name:stage<5?'next':'finish guide',exact:true}).focus();await page.keyboard.press('Enter');
    }
    await page.locator('.maya-guide-rail').waitFor({state:'hidden'});
    await page.getByRole('button',{name:'view tour',exact:true}).click();
    await page.locator('[data-maya-stage="next-step"] .maya-guide-rail').waitFor();
    await page.getByRole('button',{name:'replay guide',exact:true}).click();
    await page.locator('[data-maya-stage="meet-maya"]').waitFor();
    await page.getByRole('button',{name:'next',exact:true}).click();
    await page.getByRole('button',{name:'text shelv',exact:true}).first().click();
    const contact=page.getByRole('dialog');await contact.waitFor();assert.match(await contact.innerText(),/fictional|sample/i);
    await page.goBack();await page.locator('[data-maya-stage="meet-maya"]').waitFor();await contact.waitFor({state:'hidden'});
    await page.goForward();await page.locator('[data-maya-stage="meaningful-decision"]').waitFor();await contact.waitFor({state:'hidden'});
    await page.getByRole('button',{name:'explore on my own',exact:true}).click();
    await page.locator('.maya-guide-rail').waitFor({state:'hidden'});
    await page.getByRole('button',{name:'view tour',exact:true}).click();
    await page.locator('[data-maya-stage="meaningful-decision"] .maya-guide-rail').waitFor();
    await page.getByRole('button',{name:'exit guide',exact:true}).click();await page.locator('.maya-guide-rail').waitFor({state:'hidden'});
    await page.getByRole('button',{name:'reset demo',exact:true}).click();
    await page.locator('[data-maya-stage="meet-maya"] .maya-guide-rail').waitFor();await contact.waitFor({state:'hidden'});
    assert.equal(new URL(page.url()).pathname,'/maya');assert.deepEqual(api,[],'public Maya makes no API request');assert.deepEqual(foreign,[],'public Maya uses only its packaged same-origin resources');
  }finally{page.off('request',onRequest);}
}
