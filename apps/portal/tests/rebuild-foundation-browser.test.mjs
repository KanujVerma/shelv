import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {chromium} from 'playwright-core';
import {parseRoute} from '../src/navigation/routes.ts';

const portal=fileURLToPath(new URL('../',import.meta.url)),repository=path.resolve(portal,'../..');
const built=path.join(repository,'.local-artifacts/portal-rebuild/foundation'),artifacts=path.join(repository,'.local-artifacts/portal-rebuild/w0/browser');
const origin='http://shelv-foundation.invalid';
let browser;
before(async()=>{
  execFileSync(process.execPath,['scripts/build-rebuild.mjs'],{cwd:portal});await fs.mkdir(artifacts,{recursive:true});
  browser=await chromium.launch({channel:'chrome',headless:process.env.PORTAL_TEST_HEADED!=='1',args:['--no-proxy-server','--disable-background-networking','--disable-quic','--host-resolver-rules=MAP * ~NOTFOUND']});
});
after(async()=>browser?.close());
async function setup(width=1440,height=960,initial='/plan?routine=evening') {
  const context=await browser.newContext({viewport:{width,height},serviceWorkers:'block'}),unexpected=[],errors=[];
  await context.route('**/*',async route=>{
    const request=route.request(),url=new URL(request.url());
    if(url.origin!==origin||request.method()!=='GET'||url.pathname.startsWith('/api/')) {unexpected.push(request.method()+' '+url.pathname);await route.abort();return;}
    const relative=url.pathname==='/__foundation'||parseRoute(url.pathname+url.search)?'index.html':url.pathname.slice(1);
    const file=path.resolve(built,relative),extension=path.extname(file);
    if(!file.startsWith(built+path.sep)||!['.html','.js','.css','.woff2','.woff'].includes(extension)){unexpected.push(url.pathname);await route.abort();return;}
    try {await route.fulfill({body:await fs.readFile(file),contentType:({'.html':'text/html','.js':'text/javascript','.css':'text/css','.woff2':'font/woff2','.woff':'font/woff'})[extension]});}
    catch {unexpected.push(url.pathname);await route.abort();}
  });
  const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
  await page.goto(origin+initial);await page.getByRole('heading',{name:'shared controls',exact:true}).waitFor();await page.evaluate(()=>document.fonts.ready);
  return {page,context,unexpected,errors,async close(){await context.close();assert.deepEqual(errors,[]);assert.deepEqual(unexpected,[]);}};
}

test('rendered desktop shell preserves native sidebar, navigation, contact and topbar geometry',async()=>{
  const f=await setup();try {
    const geometry=await f.page.evaluate(()=>{
      const rect=selector=>{const {x,y,width,height}=document.querySelector(selector).getBoundingClientRect();return{x,y,width,height};};
      return {sidebar:rect('[data-foundation=sidebar]'),topbar:rect('[data-foundation=topbar]'),content:rect('[data-foundation=content]'),heading:rect('h1'),contact:rect('[data-foundation=contact]'),identity:rect('[data-foundation=identity]'),nav:[...document.querySelectorAll('.shelv-nav-link')].map(e=>{const r=e.getBoundingClientRect();return{text:e.textContent,x:r.x,y:r.y,width:r.width,height:r.height};}),button:rect('.shelv-preview-button'),input:rect('#preview-name'),fonts:{body:getComputedStyle(document.body).fontFamily,title:getComputedStyle(document.querySelector('h1')).fontFamily},overflow:document.documentElement.scrollWidth>innerWidth};
    });
    await fs.writeFile(path.join(artifacts,'desktop-geometry.json'),JSON.stringify(geometry,null,2));await f.page.screenshot({path:path.join(artifacts,'desktop-1440.png')});
    assert.deepEqual(geometry.sidebar,{x:0,y:0,width:224,height:960});
    assert.deepEqual(geometry.topbar,{x:224,y:0,width:1216,height:80});assert.equal(geometry.heading.x,264);assert.equal(geometry.heading.y,104);assert.equal(geometry.contact.y,740);assert.equal(geometry.identity.y,910);
    assert.deepEqual(geometry.nav.map(x=>({y:x.y,height:x.height})),[{y:102,height:48},{y:162,height:48},{y:222,height:48},{y:282,height:48}]);
    assert.equal(geometry.button.width,204);assert.equal(geometry.button.height,48);assert.equal(geometry.input.width,480);assert.equal(geometry.input.height,48);assert.equal(geometry.overflow,false);
  } finally {await f.close();}
});

test('tabs/select/field errors and guarded sheets work with keyboard and restore opener focus',async()=>{
  const f=await setup();try {
    const {page}=f;await page.getByRole('tab',{name:'morning',exact:true}).focus();await page.keyboard.press('ArrowRight');
    await page.getByRole('tab',{name:'evening',exact:true,selected:true}).waitFor();
    assert.equal(await page.getByRole('tab',{name:'evening',exact:true}).getAttribute('aria-selected'),'true');
    await page.getByRole('combobox',{name:'reported date'}).focus();await page.keyboard.press('Space');await page.getByRole('listbox').waitFor();await page.waitForFunction(()=>document.activeElement?.getAttribute('role')==='option');await page.keyboard.press('End');await page.waitForFunction(()=>document.activeElement?.textContent.includes('not sure'));await page.keyboard.press('Enter');
    assert.match(await page.getByRole('combobox',{name:'reported date'}).innerText(),/not sure/);
    await page.getByRole('button',{name:'toggle field error'}).click();assert.equal(await page.getByLabel('name',{exact:true}).getAttribute('aria-invalid'),'true');
    assert.match(await page.getByLabel('name',{exact:true}).getAttribute('aria-describedby'),/preview-name-error/);
    await page.getByRole('button',{name:'open sheet',exact:true}).click();await page.getByRole('dialog',{name:'product sheet specimen'}).waitFor();
    assert.deepEqual(await page.getByRole('dialog').boundingBox(),{x:904,y:72,width:536,height:888});
    assert.equal(await page.evaluate(()=>document.activeElement.id),'sheet-note');
    await page.getByLabel('preview note',{exact:true}).fill('synthetic unsent edit');
    await page.getByRole('button',{name:'guard unsent work'}).click();await page.keyboard.press('Escape');
    assert.equal(await page.getByRole('dialog').count(),1);assert.match(await page.getByRole('dialog').innerText(),/unsent preview text remains/);
    await page.getByRole('button',{name:'try second overlay'}).click();assert.equal(await page.getByRole('dialog').count(),1);
    await page.getByRole('button',{name:'turn off close guard'}).click();
    await page.getByRole('button',{name:'back to plan',exact:true}).focus();await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.id),'sheet-note');
    await page.keyboard.press('Shift+Tab');assert.equal(await page.getByRole('dialog').locator(':focus').count(),1);
    await page.screenshot({path:path.join(artifacts,'sheet-1440.png')});
    await page.keyboard.press('Escape');await page.getByRole('dialog').waitFor({state:'hidden'});await page.waitForFunction(()=>document.activeElement?.id==='preview-sheet-trigger');assert.equal(await page.evaluate(()=>document.activeElement.id),'preview-sheet-trigger');
    assert.equal(await page.getByLabel('notes',{exact:true}).inputValue(),'synthetic unsent edit');
    const storage=await page.evaluate(()=>({local:localStorage.length,session:sessionStorage.length}));assert.deepEqual(storage,{local:0,session:0});
  } finally {await f.close();}
});

test('Back/Forward, refresh and direct product entry retain product/routine context and unsent memory',async()=>{
  const f=await setup();try {
    const {page}=f;await page.getByLabel('notes',{exact:true}).fill('synthetic unsent note');
    await page.locator('#product-cerave').click();await page.waitForURL('**/plan/products/card%3Asynthetic-cerave?routine=evening');
    assert.match(await page.locator('.shelv-preview-route').innerText(),/product$/);
    await page.getByRole('button',{name:'back',exact:true}).click();await page.waitForURL('**/plan?routine=evening');
    await page.waitForFunction(()=>document.activeElement?.id==='product-cerave');
    assert.equal(await page.evaluate(()=>document.activeElement.id),'product-cerave');assert.equal(await page.getByLabel('notes',{exact:true}).inputValue(),'synthetic unsent note');
    await page.goForward();await page.waitForURL('**/plan/products/**');assert.match(await page.locator('.shelv-preview-route').innerText(),/product$/);
    await page.reload();await page.getByRole('heading',{name:'shared controls'}).waitFor();assert.equal(await page.getByLabel('notes',{exact:true}).inputValue(),'');
    await page.goto(origin+'/plan/products/card%3Asynthetic-cerave/evidence?routine=evening');await page.getByRole('heading',{name:'shared controls'}).waitFor();
    await page.getByRole('button',{name:'back',exact:true}).click();await page.waitForURL('**/plan/products/card%3Asynthetic-cerave?routine=evening');
  } finally {await f.close();}
});

test('narrow, 390px and 320px controls reflow without horizontal overflow or hidden modal actions',async()=>{
  const records=[];
  for(const width of [1280,390,320]) {
    const f=await setup(width,960);try {
      const {page}=f;
      if(width<700){await page.getByRole('button',{name:'menu',exact:true}).click();assert.equal(await page.getByRole('navigation').getByRole('link').count(),4);await page.keyboard.press('Escape');assert.equal(await page.getByRole('button',{name:'menu',exact:true}).getAttribute('aria-expanded'),'false');}
      records.push(await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,contactButtons:[...document.querySelectorAll('button')].filter(e=>e.textContent==='text shelv'&&e.getClientRects().length>0).length})));
      assert.equal(records.at(-1).scrollWidth,width);assert.equal(records.at(-1).contactButtons,1);
      await page.screenshot({path:path.join(artifacts,`foundation-${width}.png`),fullPage:true});
      await page.getByRole('button',{name:'open sheet',exact:true}).click();await page.getByRole('dialog').waitFor();
      const bounds=await page.getByRole('dialog').boundingBox();assert.ok(bounds.x>=0&&bounds.x+bounds.width<=width);await page.keyboard.press('Escape');await page.getByRole('dialog').waitFor({state:'hidden'});
      await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.locator('.shelv-spinner').first().evaluate(e=>getComputedStyle(e).animationName),'none');
    } finally {await f.close();}
  }
  await fs.writeFile(path.join(artifacts,'responsive-geometry.json'),JSON.stringify(records,null,2));
});
