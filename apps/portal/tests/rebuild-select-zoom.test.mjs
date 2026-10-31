// Actual shared Radix Select. Only finite static browser responses are intercepted.
import test, {before, after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {build} from 'esbuild';
import {chromium} from 'playwright-core';

const portal=path.resolve(import.meta.dirname,'..'),origin='http://shelv-select.invalid';
const phase=process.env.SHELV_SELECT_ZOOM_PHASE??'current';
assert.match(phase,/^[a-z0-9-]+$/);
const artifacts=path.resolve(portal,'../../.local-artifacts/portal-rebuild/shared-select-zoom',phase);
let browser,outputs;
before(async()=>{
  await fs.mkdir(artifacts,{recursive:true});
  const source=`import {StrictMode,useState} from 'react';import{createRoot}from'react-dom/client';
    import{Select,Field,Button}from'./src/ui/primitives.tsx';import{OverlayProvider,Sheet}from'./src/ui/overlay.tsx';import'./src/ui/foundation.css';
    function App(){const[value,setValue]=useState('using'),[open,setOpen]=useState(false);const inside=new URL(location.href).searchParams.has('sheet');
      const field=<Field label="what changed?"><Select value={value} onValueChange={setValue} options={[{value:'using',label:'using'},{value:'paused',label:'paused'},{value:'stopped',label:'stopped'}]}/></Field>;
      return <OverlayProvider><main style={{padding:32,maxWidth:420,margin:'0 auto',minHeight:1800}}><h1>shared select</h1>
      <Button id="open-sheet" onClick={()=>setOpen(true)}>open choice sheet</Button><div style={{marginTop:120}}>{!inside&&field}</div><output aria-label="chosen value">{value}</output>
      <Sheet open={open} onOpenChange={setOpen} title="choice sheet">{inside&&field}</Sheet></main></OverlayProvider>}
    createRoot(document.getElementById('root')).render(<StrictMode><App/></StrictMode>);`;
  const retained=process.env.SHELV_SELECT_RETAINED_REF;
  if(retained)assert.match(retained,/^[a-f0-9]{40}$/);
  const plugins=retained?[{name:'retained-shared-select-input',setup(builder){builder.onLoad({filter:/[/\\]src[/\\]ui[/\\](primitives\.tsx|foundation\.css)$/},async args=>{
    const relative='apps/portal/src/ui/'+path.basename(args.path),contents=execFileSync('git',['show',retained+':'+relative],{cwd:path.resolve(portal,'../..'),encoding:'utf8'});
    return{contents,loader:relative.endsWith('.tsx')?'tsx':'css',resolveDir:path.dirname(args.path)};
  });}}]:[];
  const result=await build({absWorkingDir:portal,stdin:{contents:source,loader:'tsx',resolveDir:portal},tsconfig:'tsconfig.frontend.json',bundle:true,format:'esm',outdir:path.join(artifacts,'bundle'),entryNames:'select',assetNames:'assets/[name]-[hash]',loader:{'.woff2':'file','.woff':'file'},plugins,write:false});
  outputs=new Map(result.outputFiles.map(f=>['/'+path.relative(path.join(artifacts,'bundle'),f.path).split(path.sep).join('/'),Buffer.from(f.contents)]));
  browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-proxy-server','--disable-background-networking','--disable-quic','--host-resolver-rules=MAP * ~NOTFOUND']});
});
after(async()=>browser?.close());

for(const sample of [
  {width:320,html:2},{width:390,html:2},
  ...[1440,1280,390,320].map(width=>({width,html:1})),
  {width:390,html:1.5},{width:390,html:0.8},{width:390,body:2},
  {width:390,html:1.25,body:1.2},{width:320,html:2,scroll:200},
  {width:390,html:1,sheet:true},{width:320,html:2,sheet:true},
]){
  const name=Object.entries(sample).map(([k,v])=>k+'-'+v).join('-');
  test('shared select pointer/keyboard and focus '+name,async()=>{
    const context=await browser.newContext({viewport:{width:sample.width,height:960},serviceWorkers:'block'}),errors=[],unexpected=[];
    let page;
    try{
      await context.route('**/*',async route=>{
        const request=route.request(),url=new URL(request.url());
        if(url.origin!==origin||request.method()!=='GET'){unexpected.push(request.method()+' '+url.pathname);return route.abort();}
        if(url.pathname==='/')return route.fulfill({contentType:'text/html',body:'<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"/><link rel="stylesheet" href="/select.css"/></head><body><div id="root"></div><script type="module" src="/select.js"></script></body></html>'});
        const bytes=outputs.get(url.pathname);if(!bytes){unexpected.push(url.pathname);return route.abort();}
        return route.fulfill({body:bytes,contentType:url.pathname.endsWith('.css')?'text/css':url.pathname.endsWith('.js')?'text/javascript':'font/woff2'});
      });
      page=await context.newPage();page.setDefaultTimeout(5000);page.on('pageerror',e=>errors.push(e.message));
      await page.goto(origin+'/?'+(sample.sheet?'sheet=1':''),{waitUntil:'domcontentloaded'});await page.getByRole('heading',{name:'shared select',exact:true}).waitFor();await page.evaluate(()=>document.fonts.ready);
      await page.evaluate(s=>{document.documentElement.style.zoom=String(s.html??1);document.body.style.zoom=String(s.body??1);},sample);
      if(sample.sheet)await page.getByRole('button',{name:'open choice sheet'}).click();
      if(sample.scroll)await page.evaluate(y=>scrollTo(0,y),sample.scroll);
      const trigger=page.getByRole('combobox',{name:'what changed?',exact:true});await trigger.click();
      const stopped=page.getByRole('option',{name:'stopped',exact:true});await stopped.waitFor();
      const observation=await page.evaluate(()=>{
        const trigger=document.querySelector('[data-slot=select-trigger]'),option=[...document.querySelectorAll('[role=option]')].find(e=>e.textContent==='stopped'),wrapper=document.querySelector('[data-radix-popper-content-wrapper]');
        return{viewport:{width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth},trigger:trigger.getBoundingClientRect().toJSON(),option:option.getBoundingClientRect().toJSON(),wrapper:wrapper.getBoundingClientRect().toJSON(),css:wrapper.getAttribute('style')};
      });
      await fs.writeFile(path.join(artifacts,name+'.json'),JSON.stringify(observation,null,2)+'\n');await page.screenshot({path:path.join(artifacts,name+'.png')});
      const r=observation.option,v=observation.viewport;
      assert.ok(r.x>=-1&&r.y>=-1&&r.right<=v.width+1&&r.bottom<=v.height+1,JSON.stringify(observation));
      assert.equal(v.scrollWidth,v.width,'popup must not expand the document');
      assert.ok(Math.abs(observation.wrapper.width-observation.trigger.width)<=2,'popup width tracks actual trigger');
      await stopped.click({timeout:3000});await page.waitForFunction(()=>document.querySelector('output').textContent==='stopped');
      await trigger.focus();await page.keyboard.press('Space');await page.getByRole('listbox').waitFor();await page.waitForFunction(()=>document.activeElement?.getAttribute('role')==='option');
      await page.keyboard.press('Home');await page.waitForFunction(()=>document.activeElement?.getAttribute('role')==='option'&&document.activeElement.textContent==='using');await page.keyboard.press('Enter');await page.waitForFunction(()=>document.querySelector('output').textContent==='using');
      await page.waitForFunction(()=>document.activeElement?.getAttribute('role')==='combobox');
      await page.keyboard.press('Space');await page.getByRole('listbox').waitFor();await page.keyboard.press('Escape');await page.getByRole('listbox').waitFor({state:'hidden'});
      await page.waitForFunction(()=>document.activeElement?.getAttribute('role')==='combobox');
      if(sample.sheet){await page.keyboard.press('Escape');await page.getByRole('dialog').waitFor({state:'hidden'});await page.waitForFunction(()=>document.activeElement?.id==='open-sheet');}
    }finally{
      await context.close();assert.deepEqual(errors,[]);assert.deepEqual(unexpected,[]);
    }
  });
}
