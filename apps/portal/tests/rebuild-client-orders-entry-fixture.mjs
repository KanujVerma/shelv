import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, appendFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {registerHooks, stripTypeScriptTypes} from 'node:module';
import {fileURLToPath, pathToFileURL} from 'node:url';
import path from 'node:path';

export const root=fileURLToPath(new URL('../../../',import.meta.url));
const resolve=p=>path.resolve(root,p);
export const evidence=resolve('.local-artifacts/portal-rebuild/current-orders-entry');
export const entryPath=resolve('apps/portal/src/app/client-orders-entry.tsx');
const manifest=process.env.CLIENT_ORDERS_ENTRY_INPUT_MANIFEST;
const receipt=process.env.CLIENT_ORDERS_ENTRY_RECEIPT;
if(receipt)assert.ok(resolve(receipt).startsWith(evidence+path.sep),'only own ignored receipts');
export const inputs=new Map();
if(manifest)for(const row of JSON.parse(readFileSync(manifest,'utf8'))){
  const input=resolve(row.input);
  assert.ok(input.startsWith(evidence+path.sep),'only own ignored source inputs');
  const bytes=readFileSync(input);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),row.sha256);
  inputs.set(resolve(row.path),bytes.toString('utf8'));
}
export const sourceText=p=>inputs.get(resolve(p))??readFileSync(resolve(p),'utf8');
function record(file,original,executed,projection){
  if(receipt)appendFileSync(receipt,JSON.stringify({path:path.relative(root,file),
    sourceSha256:createHash('sha256').update(original).digest('hex'),
    executedSha256:createHash('sha256').update(executed).digest('hex'),projection,
    ...(file===entryPath?{entryBodySha256:createHash('sha256').update(original.slice(original.indexOf('export function createClientOrdersEntry('),original.indexOf('/** React composition; excluded only by the pure lifecycle test loader. */'))).digest('hex')}:{}),
  })+'\n');
}

/** Pure lifecycle projection only: omit JSX and its three UI imports. No view,
 * hook, session, authority, transport, controller or navigator is substituted.
 * JSX rendering and effects require the separately granted SSR/compiler graph. */
let hooked=false;
export async function lifecycleAPI(){
  if(!hooked){
    hooked=true;
    registerHooks({
      resolve(specifier,context,next){
        if(specifier.startsWith('.')&&context.parentURL?.startsWith('file:')){
          const target=fileURLToPath(new URL(specifier,context.parentURL));
          if(inputs.has(target))return {url:pathToFileURL(target).href,shortCircuit:true};
        }
        return next(specifier,context);
      },
      load(url,context,next){
        if(!url.startsWith('file:'))return next(url,context);
        const file=fileURLToPath(url);
        if(file!==entryPath&&!inputs.has(file)){
          const result=next(url,context);
          if(file.startsWith(root+path.sep)&&/\.[cm]?[jt]sx?$/.test(file)){
            const original=sourceText(file),actual=result.source==null?original:typeof result.source==='string'?result.source:Buffer.from(result.source).toString('utf8');
            record(file,original,actual,'actual-node-source');
          }
          return result;
        }
        let source=sourceText(file);
        const original=source;
        if(file===entryPath){
          const marker='/** React composition; excluded only by the pure lifecycle test loader. */';
          assert.equal(source.split(marker).length,2,'one exact UI boundary');
          source=source.split(marker)[0]
            .replace("import {useEffect, useSyncExternalStore} from 'react';\n",'')
            .replace("import {ClientOrdersView} from '../features/orders/read/ClientOrdersView.tsx';\n",'')
            .replace("import {Button, StatusNotice} from '../ui/index.ts';\n",'');
          source+='\nexport const lifecycleTestActions=entryActions;\n';
        }
        const executed=stripTypeScriptTypes(source,{mode:'strip',sourceUrl:url});
        record(file,original,executed,file===entryPath?'pure-entry-prefix-and-test-only-private-actions':'exact-pinned-input-types-erased');
        return {format:'module',shortCircuit:true,source:executed};
      },
    });
  }
  return import(pathToFileURL(entryPath).href);
}
export const purchaseId='33333333-3333-4333-8333-333333333333';
export const actor='11111111-1111-4111-8111-111111111111';
export function recordedView(revision=17){
  return {schemaVersion:1,revision,purchases:[{id:purchaseId,quoteId:null,recommendationId:null,
    retailer:'Recorded Retailer',seller:'Recorded Seller',productId:'recorded-product',productName:'Recorded Product',
    quantity:1,unitPriceCents:1234,taxCents:123,shippingCents:450,purchasedOn:'2026-10-29',deliveredOn:null,
    policy:{checkedOn:'2026-10-28',url:'https://example.com/saved-policy',summary:'Recorded conditions',openedAllowed:null,
      finalSale:false,returnBy:null,shipBy:null,returnCostCents:250},recordedAt:'2026-10-30T12:00:00Z',recordedBy:actor}],returns:[]};
}
export function gate(){let enter,release;return {entered:new Promise(r=>enter=r),wait:new Promise(r=>release=r),enter:()=>enter(),release:()=>release()};}
/** Node Window model only. Actual canonical navigator owns all URL/history work. */
export function nodeWindow(initial='/orders'){
  const entries=[{url:initial,state:null}],listeners=new Map();let index=0;
  const location={pathname:'',search:''};
  const set=url=>{const u=new URL(url,'https://portal.synthetic.invalid');location.pathname=u.pathname;location.search=u.search;};set(initial);
  return {location,document:{activeElement:null,getElementById:()=>null,querySelector:()=>null},scrollY:0,
    scrollTo(){},requestAnimationFrame(fn){queueMicrotask(fn);},
    addEventListener(name,fn){if(!listeners.has(name))listeners.set(name,new Set());listeners.get(name).add(fn);},
    removeEventListener(name,fn){listeners.get(name)?.delete(fn);},
    history:{scrollRestoration:'auto',get state(){return entries[index].state;},
      replaceState(state,_title,url){entries[index]={state,url};set(url);},
      pushState(state,_title,url){entries.splice(++index);entries[index]={state,url};set(url);},
      back(){this.go(-1);},go(delta){assert.ok(index+delta>=0&&index+delta<entries.length);index+=delta;set(entries[index].url);for(const fn of listeners.get('popstate')??[])fn();}},
  };
}
export async function entryFixture(t,{initial='/orders',restore=true,audience='client',allowOrders=true}={}){
  const api=await lifecycleAPI();
  const {createApplicationSession}=await import('../src/app/session.ts');
  const {createPortalNavigator}=await import('../src/navigation/history.ts');
  const broadcast=globalThis.BroadcastChannel,fetch=globalThis.fetch;
  globalThis.BroadcastChannel=undefined;globalThis.fetch=()=>{throw Error('unexpected global network');};
  t.after(()=>{globalThis.BroadcastChannel=broadcast;globalThis.fetch=fetch;});
  const calls=[];let response=()=>Response.json(recordedView()),now=Date.parse('2026-11-02T12:00:00Z');
  let login={signedIn:true,ownerId:actor,generation:1,csrf:'SYNTHETIC-orders-entry',
    capabilities:{view:true,edit:false,publish:false,confirmPayments:false},idleExpiresAt:'2099-01-01',absoluteExpiresAt:'2099-01-02'};
  const runtime=createApplicationSession({audience,now:()=>now,locks:{request:async(_n,_o,run)=>run()},fetcher:async(url,init)=>{
    calls.push({url,init});assert.equal(init.credentials,'same-origin');assert.equal(init.cache,'no-store');assert.equal(init.redirect,'error');
    if(url===`/api/${audience}/session`)return Response.json(login);
    if(url===`/api/${audience}/logout`)return Response.json({signedOut:true});
    assert.equal(url,'/api/client/client-orders');assert.equal(allowOrders,true,'unregistered context cannot egress');
    assert.equal(init.method,'POST');assert.equal(new Headers(init.headers).get('X-Shelv-CSRF'),login.csrf);
    assert.deepEqual(JSON.parse(init.body),{schemaVersion:1,action:'read_client_orders_v1'});return response(init);
  }});
  if(restore)await runtime.restore();
  const win=nodeWindow(initial),navigation=createPortalNavigator(win,{scopeKey:runtime.getSnapshot().boundary?.key??'startup'});
  t.after(()=>{navigation.dispose();runtime.dispose();});
  return {api,runtime,win,navigation,calls,create:()=>api.createClientOrdersEntry(runtime,navigation),
    actions:entry=>api.lifecycleTestActions.get(entry),login(patch){login={...login,...patch};},
    response(fn){response=fn;},now(value){now=value;}};
}

let compiled;
/** Full source JSX/actual Application graph. Authored for Parent's later own
 * dependency/heavy custody; never invoked by the builtin lifecycle suites. */
export async function ssrAPI(){
  if(compiled)return compiled;
  const {build}=await import('../node_modules/esbuild/lib/main.js');
  const {createRequire}=await import('node:module');
  const result=await build({absWorkingDir:root,tsconfig:'apps/portal/tsconfig.frontend.json',
    stdin:{resolveDir:root,loader:'tsx',contents:`
      import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';
      import {PortalApplication} from './apps/portal/src/app/Application.tsx';
      import {ClientOrdersEntryView} from './apps/portal/src/app/client-orders-entry.tsx';
      import {OverlayProvider} from './apps/portal/src/ui/index.ts';
      export {createClientOrdersEntry} from './apps/portal/src/app/client-orders-entry.tsx';
      export const application=(props)=>renderToStaticMarkup(<OverlayProvider><PortalApplication {...props}/></OverlayProvider>);
      export const entry=(entry)=>renderToStaticMarkup(<OverlayProvider><ClientOrdersEntryView entry={entry}/></OverlayProvider>);`},
    bundle:true,write:false,format:'cjs',platform:'node',loader:{'.css':'empty'},metafile:true,
    alias:{react:resolve('apps/portal/node_modules/react'),'react-dom':resolve('apps/portal/node_modules/react-dom')},
    plugins:[{name:'owned-exact-source-inputs',setup(b){
      b.onResolve({filter:/^\./},args=>{const target=path.resolve(path.dirname(args.importer),args.path);return inputs.has(target)?{path:target}:null;});
      b.onLoad({filter:/\.[cm]?[jt]sx?$/},args=>inputs.has(args.path)?{contents:inputs.get(args.path),loader:args.path.endsWith('.tsx')?'tsx':args.path.endsWith('.ts')?'ts':'js'}:null);
    }}]});
  const module={exports:{}};
  new Function('module','exports','require',result.outputFiles[0].text)(module,module.exports,createRequire(import.meta.url));
  compiled=module.exports;return compiled;
}

/** Current registered candidate source, with native finite HTTP only. This is
 * a successor to the original constructor projection, never a registry patch. */
export function defineRegisteredEntryTests(){
  test('registered source: one initial complete read survives list/detail/Back without care calls',async t=>{
    const f=await entryFixture(t,{allowOrders:true}),e=f.create();t.after(()=>e.dispose());
    await e.start();const s=e.getSnapshot(),c=s.controller;assert.equal(c.getSnapshot().view.revision,17);
    f.actions(e).open(s,purchaseId);assert.equal(f.navigation.getSnapshot(),'/orders/'+purchaseId);
    assert.equal(e.getSnapshot().controller,c);f.actions(e).back(e.getSnapshot());
    assert.equal(f.navigation.getSnapshot(),'/orders');assert.equal(f.calls.length,2);
  });
  for(const status of [200,401,403,503])test('registered source: old held HTTP'+status+' cannot overwrite or end newer lifetime',async t=>{
    const h=gate();t.after(()=>h.release());let n=0;
    const f=await entryFixture(t,{allowOrders:true}),a=f.create();t.after(()=>a.dispose());
    f.response(async()=>{if(++n===1){h.enter();await h.wait;return Response.json(status===200?recordedView(1):{message:'unavailable'},{status});}return Response.json(recordedView(19));});
    const old=a.start();await h.entered;a.stop();const b=f.create();t.after(()=>b.dispose());await b.start();const s=b.getSnapshot();
    h.release();await old;a.dispose();assert.equal(b.getSnapshot(),s);assert.equal(s.controller.getSnapshot().view.revision,19);assert.equal(f.runtime.cookie.status,'ready');
  });
  test('registered source: stale rendered callback cannot adopt a new equal-valued controller after stop/start',async t=>{
    const f=await entryFixture(t,{allowOrders:true}),e=f.create();t.after(()=>e.dispose());await e.start();const rendered=e.getSnapshot();
    e.stop();await e.start();assert.notEqual(e.getSnapshot().controller,rendered.controller);f.actions(e).open(rendered,purchaseId);
    assert.equal(f.navigation.getSnapshot(),'/orders');assert.equal(e.getSnapshot().controller.getSnapshot().view.revision,17);
  });
  for(const loss of ['offline','view','route','dispose'])test('registered source: loaded '+loss+' clears before private snapshot/callback',async t=>{
    const f=await entryFixture(t,{allowOrders:true}),e=f.create();t.after(()=>e.dispose());await e.start();const rendered=e.getSnapshot(),c=rendered.controller;
    assert.ok(c.getSnapshot().view);
    if(loss==='offline')f.runtime.cookie.suspend();
    if(loss==='view')f.runtime.cookie._view.capabilities.view=false;
    if(loss==='route')f.navigation.navigate({name:'account'});
    if(loss==='dispose')e.dispose();
    assert.equal(e.getSnapshot().controller,null);assert.equal(c.getSnapshot().view,null);const path=f.navigation.getSnapshot();
    f.actions(e).open(rendered,purchaseId);assert.equal(f.navigation.getSnapshot(),path);
  });
}

let serverCompiled;
/** Actual gateway/Vault/provider graph over a closed native Fetch transcript.
 * Requires separately granted esbuild custody. Auth/RPC/store are synthetic;
 * no server, socket, database, successful port or authority stub is created. */
export async function connectedEntryFixture(t){
  if(!serverCompiled){
    const {build}=await import('../node_modules/esbuild/lib/main.js');
    const {createRequire}=await import('node:module');
    const server='apps/portal/session-integration/runtime/server/';
    const result=await build({absWorkingDir:root,tsconfig:'apps/portal/tsconfig.frontend.json',stdin:{resolveDir:root,loader:'ts',contents:`
      export {default as gateway} from './${server}gateway.ts';
      export {PORTAL_ORIGIN,SUPABASE_ORIGIN} from './${server}policy.ts';
      export {ClientProvider} from './${server}client-upstream.ts';
      export {SessionVault} from './${server}session-vault.ts';
      export {CredentialEnvelope} from './${server}credential-envelope.ts';`},bundle:true,write:false,platform:'node',format:'cjs',metafile:true,
      plugins:[{name:'exact-input-source',setup(b){
        b.onResolve({filter:/^\./},args=>{
          const p=path.resolve(path.dirname(args.importer||path.join(root,'stdin.ts')),args.path);
          const found=[p,p+'.ts',p+'.js'].find(p=>inputs.has(p));return found?{path:found}:null;
        });
        b.onLoad({filter:/\.[jt]s$/},args=>inputs.has(args.path)?{contents:inputs.get(args.path),loader:args.path.endsWith('.ts')?'ts':'js'}:null);
      }}]});
    const module={exports:{}};new Function('module','exports','require',result.outputFiles[0].text)(module,module.exports,createRequire(import.meta.url));serverCompiled=module.exports;
  }
  const {gateway,PORTAL_ORIGIN,SUPABASE_ORIGIN,ClientProvider,SessionVault,CredentialEnvelope}=serverCompiled;
  const api=await lifecycleAPI(),{createApplicationSession}=await import('../src/app/session.ts'),{createPortalNavigator}=await import('../src/navigation/history.ts');
  const broadcast=globalThis.BroadcastChannel,fetch=globalThis.fetch;
  globalThis.BroadcastChannel=undefined;globalThis.fetch=()=>{throw Error('unexpected global network');};
  t.after(()=>{globalThis.BroadcastChannel=broadcast;globalThis.fetch=fetch;});
  const sessionId='22222222-2222-4222-8222-222222222222',expires=Math.floor(Date.now()/1000)+3600;
  const token=[Buffer.from('{}').toString('base64url'),Buffer.from(JSON.stringify({sub:actor,session_id:sessionId,role:'authenticated',exp:expires})).toString('base64url'),'synthetic'].join('.');
  const credentials={access_token:token,refresh_token:'SYNTHETIC-refresh',expires_at:expires,user:{id:actor},providerSessionId:sessionId};
  const upstream=[],requests=[],commands=[];let orders=()=>Response.json(recordedView()),context=()=>Response.json({ownerId:actor,providerSessionId:sessionId,role:'client',sessionNotAfter:null,capabilities:{view:true,edit:false,publish:false,confirmPayments:false}});
  const provider=new ClientProvider('sb_publishable_synthetic',async(input,init)=>{
    const url=new URL(String(input));assert.equal(url.origin,SUPABASE_ORIGIN);assert.equal(new Headers(init.headers).get('authorization'),'Bearer '+token);assert.equal(init.cache,'no-store');
    const body=init.body===undefined?null:JSON.parse(String(init.body));upstream.push({path:url.pathname,body});
    if(url.pathname==='/auth/v1/user')return Response.json({id:actor,is_anonymous:false});
    if(url.pathname==='/rest/v1/rpc/concierge_client_session_context'){assert.deepEqual(body,{});return context();}
    if(url.pathname==='/rest/v1/rpc/concierge_client_orders_read_v1'){assert.deepEqual(body,{p_command:{schemaVersion:1,action:'read_client_orders_v1'}});return orders();}
    throw Error('unexpected upstream '+url.pathname);
  },12000,true);
  let record=null;
  const vault=new SessionVault({read:()=>record,write:value=>{record=value;}},new CredentialEnvelope(JSON.stringify({active:'synthetic',keys:{synthetic:Buffer.alloc(32,17).toString('base64url')}}),'orders-entry-synthetic'),provider,{now:()=>Date.now(),idleMs:3600000,absoluteMs:28800000,recheckContext:true,policyAudience:'client'});
  await vault.initialize(credentials,'synthetic');
  // Host Durable Object dispatch serializes the actual Vault calls. This is a
  // finite host seam, not replacement session/currentness/producer success.
  let queue=Promise.resolve();
  const env={PORTAL_ORIGIN,CLIENT_SHARED_SESSIONS:'true',ASSETS:{fetch(){throw Error('unexpected assets');}},ADVISOR_SESSIONS:{getByName:()=>({invoke(command){
    const run=queue.then(async()=>{commands.push(command);try{
      if(command.type==='session.view')return {ok:true,value:await vault.view()};
      if(command.type==='session.execute')return {ok:true,value:await vault.execute(command.csrf,(c,k)=>provider.perform(c,k,command.operation))};
      if(command.type==='session.logout-context')return {ok:true,value:vault.logoutContext()};
      if(command.type==='session.logout')return {ok:true,value:await vault.logout(command.csrf)};
      throw Error('unexpected Vault command');
    }catch(e){return {ok:false,error:{status:e.status??503,code:e.code??'unavailable'}};}});queue=run.then(()=>{},()=>{});return run;
  }})}};
  const runtime=createApplicationSession({audience:'client',locks:{request:async(_n,_o,run)=>run()},fetcher:async(input,init)=>{
    const headers=new Headers(init.headers);headers.set('origin',PORTAL_ORIGIN);headers.set('sec-fetch-site','same-origin');headers.set('cookie','__Host-shelv_client='+'a'.repeat(43));
    requests.push({url:String(input),body:init.body});return gateway.fetch(new Request(new URL(String(input),PORTAL_ORIGIN),{...init,headers}),env);
  }});
  await runtime.restore();const win=nodeWindow(),navigation=createPortalNavigator(win,{scopeKey:runtime.getSnapshot().boundary?.key??'startup'});
  t.after(()=>{navigation.dispose();runtime.dispose();});
  return {runtime,navigation,requests,upstream,commands,record:()=>record,create:()=>api.createClientOrdersEntry(runtime,navigation),actions:e=>api.lifecycleTestActions.get(e),orders(fn){orders=fn;},context(fn){context=fn;}};
}
