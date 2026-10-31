import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {chromium} from 'playwright-core';
import {build} from 'esbuild';
import {parseRoute} from '../src/navigation/routes.ts';

const portal=fileURLToPath(new URL('../',import.meta.url)),repository=path.resolve(portal,'../..');
const built=path.join(repository,'.local-artifacts/portal-rebuild/foundation'),artifacts=path.join(repository,'.local-artifacts/portal-rebuild/w0-fixes/browser');
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

// Actual shared components/navigator, isolated at the HTTP boundary only.
async function probe(source,initial='/plan?routine=evening') {
  const result=await build({absWorkingDir:portal,stdin:{contents:source,loader:'tsx',resolveDir:portal},tsconfig:'tsconfig.frontend.json',bundle:true,format:'esm',write:false});
  const context=await browser.newContext({viewport:{width:1440,height:960},serviceWorkers:'block'}),errors=[],unexpected=[];
  await context.route('**/*',async route=>{
    const url=new URL(route.request().url());
    if(url.origin!==origin || route.request().method()!=='GET') {unexpected.push(url.pathname);return route.abort();}
    if(url.pathname==='/probe.js')return route.fulfill({body:result.outputFiles[0].text,contentType:'text/javascript'});
    if(!parseRoute(url.pathname+url.search)){unexpected.push(url.pathname);return route.abort();}
    return route.fulfill({body:'<!doctype html><html><body><div id="root"></div><script type="module" src="/probe.js"></script></body></html>',contentType:'text/html'});
  });
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto(origin+initial);await page.waitForFunction(()=>window.regression);
  return {page,async close(){await context.close();assert.deepEqual(errors,[]);assert.deepEqual(unexpected,[]);}};
}

test('direct/initial sheets and unusable or removed openers restore viable focus',async()=>{
  const source=`import {StrictMode,useState,useRef} from 'react';import {createRoot} from 'react-dom/client';
    import {OverlayProvider,Sheet} from './src/ui/overlay.tsx';
    function App(){const [open,setOpen]=useState(location.search.includes('initial')), [mode,setMode]=useState('normal');const restore=useRef(null);
      window.regression={open:()=>setOpen(true),mode:setMode};
      return <OverlayProvider><h1 id="heading" data-page-heading tabIndex={-1}>plan</h1>
        {mode!=='removed'&&<button key={mode.startsWith('replaced')?'replacement':'original'} id="opener" disabled={mode==='disabled'||mode==='replaced-disabled'} hidden={mode==='hidden'||mode==='replaced-hidden'} onClick={()=>setOpen(true)}>open</button>}
        <button id="restore" ref={restore} disabled={mode==='restore-disabled'} hidden={mode==='restore-hidden'}>restore</button>
        <Sheet open={open} onOpenChange={setOpen} title="focus regression" restoreFocusRef={mode.startsWith('restore-')?restore:undefined}><input aria-label="note"/></Sheet>
      </OverlayProvider>;}createRoot(document.getElementById('root')).render(<StrictMode><App/></StrictMode>);`;
  const records=[];
  for(const mode of ['initial','programmatic','removed','replaced','disabled','hidden','replaced-disabled','replaced-hidden','restore-disabled','restore-hidden','restore-valid']) {
    // Use a valid semantic route; initial-open selection is a test entry constant.
    const f=await probe(source.replace("location.search.includes('initial')",mode==='initial'?'true':'false'));
    try {
      const {page}=f;
      if(mode==='programmatic')await page.evaluate(()=>{document.activeElement?.blur();window.regression.open();});
      else if(mode!=='initial')await page.locator('#opener').click();
      await page.getByRole('dialog').waitFor();
      if(!['initial','programmatic'].includes(mode))await page.evaluate(mode=>window.regression.mode(mode),mode);
      await page.keyboard.press('Tab');assert.equal(await page.getByRole('dialog').locator(':focus').count(),1);
      await page.keyboard.press('Escape');await page.getByRole('dialog').waitFor({state:'hidden'});
      const expected=mode==='replaced'?'opener':mode==='restore-valid'?'restore':mode.startsWith('restore-')?'opener':'heading';
      await page.waitForFunction(expected=>document.activeElement?.id===expected,expected,{timeout:3000});
      records.push({mode,focused:await page.evaluate(()=>document.activeElement.id)});
    } finally {await f.close();}
  }
  await fs.writeFile(path.join(artifacts,'focus-regressions.json'),JSON.stringify(records,null,2));
});

test('native Back/Forward preserves nonzero scroll and distinct focus repeatedly within session scope',async()=>{
  const f=await probe(`import {StrictMode,useMemo,useEffect,useState} from 'react';import {createRoot} from 'react-dom/client';
    import {createPortalNavigator} from './src/navigation/history.ts';import {NavigationProvider,usePortalNavigation} from './src/navigation/react.tsx';
    function View(){const {route}=usePortalNavigation();return <main style={{height:4000}}><h1 id={route.name+'-heading'} tabIndex={-1} data-page-heading>{route.name}</h1><button id={route.name+'-focus'}>focus</button></main>;}
    function App(){const [scope,setScope]=useState('synthetic-session-a');const nav=useMemo(()=>createPortalNavigator(window,{scopeKey:scope}),[scope]);useEffect(()=>()=>nav.dispose(),[nav]);
      window.regression={nav,scope:setScope,unmount:()=>root.unmount()};return <NavigationProvider navigator={nav}><View/></NavigationProvider>;}
    const root=createRoot(document.getElementById('root'));root.render(<StrictMode><App/></StrictMode>);`);
  try {
    const {page}=f,records=[];
    async function position(id,y){await page.evaluate(({id,y})=>{document.getElementById(id).focus({preventScroll:true});scrollTo(0,y);},{id,y});await page.waitForFunction(y=>scrollY===y,y);}
    async function restored(path,id,y){await page.waitForURL(origin+path);try{await page.waitForFunction(({id,y})=>document.activeElement?.id===id&&scrollY===y,{id,y},{timeout:3000});}catch(error){error.message+=JSON.stringify(await page.evaluate(()=>({path:location.pathname+location.search,y:scrollY,focus:document.activeElement.id,marker:history.state})));throw error;}records.push(await page.evaluate(()=>({path:location.pathname+location.search,y:scrollY,focus:document.activeElement.id})));}
    await position('plan-focus',600);
    await page.evaluate(()=>window.regression.nav.navigate({name:'product',productId:'card:one',routine:'evening'}));
    await page.waitForURL('**/plan/products/**');await page.waitForFunction(()=>scrollY===0);
    for(let round=0;round<2;round++) {
      await position('product-focus',400+round*50);
      // Focus/scroll events settle before using native history controls.
      await page.waitForTimeout(40);
      if(round===0)await page.evaluate(()=>window.regression.nav.back());else await page.goBack();
      await restored('/plan?routine=evening','plan-focus',600+round*50);
      await position('plan-focus',650+round*50);await page.waitForTimeout(40);
      await page.goForward();await restored('/plan/products/card%3Aone?routine=evening','product-focus',400+round*50);
    }
    assert.equal(await page.evaluate(()=>history.scrollRestoration),'manual');
    // Pending old-scope restore must be cancelled on teardown/replacement.
    await page.evaluate(()=>{window.regression.nav.navigate({name:'product-use',productId:'card:one',routine:'evening'});window.regression.scope('synthetic-session-b');});
    await page.waitForFunction(()=>history.state.shelvNavigation.scopeKey==='synthetic-session-b');
    await page.goBack();await restored('/plan/products/card%3Aone?routine=evening','product-heading',0);
    assert.deepEqual(await page.evaluate(()=>({local:localStorage.length,session:sessionStorage.length})),{local:0,session:0});
    await page.evaluate(()=>{window.regression.nav.navigate({name:'product-use',productId:'card:one',routine:'evening'});window.regression.unmount();document.body.style.height='4000px';scrollTo(0,333);});
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    assert.equal(await page.evaluate(()=>scrollY),333);assert.equal(await page.evaluate(()=>history.scrollRestoration),'auto');
    await fs.writeFile(path.join(artifacts,'history-regressions.json'),JSON.stringify(records,null,2));
  } finally {await f.close();}
});

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
