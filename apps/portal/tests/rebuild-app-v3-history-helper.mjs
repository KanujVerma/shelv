// Source-only synthetic HTTP controls. No listener, browser, provider or live Auth.
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {createRequire} from 'node:module';
import {createApplicationSession} from '../src/app/session.ts';
import {view,page,owner,uid,receipt} from './rebuild-history-helper.mjs';
export {view,page,owner,uid,receipt};
export async function session(t,respond=c=>c.action==='read_client_plan_v3'?view():page()) {
 const calls=[];let reply=respond,now=Date.parse('2026-10-31T12:00:00Z');
 let login={signedIn:true,ownerId:owner,generation:1,csrf:'w0-synthetic-csrf',capabilities:{view:true,edit:false,publish:false,confirmPayments:false},idleExpiresAt:'2026-10-31T13:00:00Z',absoluteExpiresAt:'2026-10-31T14:00:00Z'};
 const runtime=createApplicationSession({audience:'client',now:()=>now,locks:{request:async(_n,_o,run)=>run()},fetcher:async(url,init)=>{
  if(url==='/api/client/session')return Response.json(login);
  if(url==='/api/client/logout')return Response.json({signedOut:true});
  assert.ok(['/api/client/reviews','/api/client/care','/api/client/plans'].includes(url),'unexpected synthetic endpoint '+url);
  assert.equal(init.credentials,'same-origin');assert.equal(init.cache,'no-store');assert.equal(init.redirect,'error');assert.equal(new Headers(init.headers).get('x-shelv-csrf'),login.csrf);
  const command=JSON.parse(init.body);calls.push({url,command,wire:init.body,signal:init.signal});const value=await reply(command,url);return value instanceof Response?value:Response.json(value);
 }});await runtime.restore();t.after(()=>runtime.dispose());
 return {runtime,calls,set:fn=>{reply=fn;},login:patch=>{login={...login,...patch};},expire:()=>{now=Date.parse('2026-10-31T15:00:00Z');}};
}
export async function renderer(){
 const result=await build({absWorkingDir:new URL('../',import.meta.url).pathname,tsconfig:'tsconfig.frontend.json',stdin:{contents:`export {createElement} from 'react'; export {renderToStaticMarkup} from 'react-dom/server'; export * from './src/app/Application.tsx'; export {OverlayProvider} from './src/ui/index.ts'; export {NavigationProvider} from './src/navigation/react.tsx';`,resolveDir:new URL('../',import.meta.url).pathname,loader:'tsx'},platform:'node',bundle:true,format:'cjs',write:false,loader:{'.css':'empty'}});
 const m={exports:{}};new Function('module','exports','require',result.outputFiles[0].text)(m,m.exports,createRequire(import.meta.url));return m.exports;
}
export function renderClient(m,f,route){
 const nav={getSnapshot:()=>route.name==='report-use'?'/plan/use':route.name==='product-use'?'/plan/products/cerave-pm/use':'/plan',subscribe:()=>()=>{},navigate(){},back(){},backDestination:()=>({name:'plan',routine:'morning'})};
 return m.renderToStaticMarkup(m.createElement(m.OverlayProvider,null,m.createElement(m.NavigationProvider,{navigator:nav},m.createElement(m.ClientContent,{...f,route,onSignOut(){}}))));
}
