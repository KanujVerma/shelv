// Actual startup/runtime/routes and finite closed HTTP only. No browser or Auth.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {build} from '../node_modules/esbuild/lib/main.js';
import {prepareApplication} from '../src/app/bootstrap.ts';
import {parseRoute, buildRoute, safeReturnPath, parentRoute} from '../src/navigation/routes.ts';
import {portalReturnPath} from '../site/auth/navigation-return.js';
import {entryFixture,gate} from './rebuild-notifications-entry-fixture.mjs';
import {accountFixture} from './rebuild-account-entry-fixture.mjs';

const bundle=await build({absWorkingDir:new URL('../',import.meta.url).pathname,
 stdin:{contents:"export {startPortalApplication} from './src/app/start.tsx';",resolveDir:new URL('../',import.meta.url).pathname,loader:'tsx'},
 tsconfig:'tsconfig.frontend.json',platform:'node',format:'cjs',bundle:true,write:false,loader:{'.css':'empty'}});
function startup(path,{signedIn=true}={}){
 const calls=[],module={exports:{}};
 runInNewContext(bundle.outputFiles[0].text,{module,exports:module.exports,require:createRequire(import.meta.url),
  URL,URLSearchParams,AbortController,crypto,Response,FormData,Blob,ReadableStream,TextEncoder,TextDecoder,
  MessageChannel,setTimeout,clearTimeout,queueMicrotask,process,
  navigator:{locks:{request:async(_,o,run)=>run(o.signal)}},
  fetch:async(url)=>{calls.push(url);assert.ok(['/api/client/session','/api/advisor/session'].includes(url),'closed session endpoint');
   return signedIn?Response.json({signedIn:true,ownerId:'40000000-0000-4000-8000-000000000099',generation:1,
    capabilities:{view:true,edit:false,publish:false,confirmPayments:false},csrf:'SYNTHETIC-startup',
    idleExpiresAt:new Date(Date.now()+600000).toISOString(),absoluteExpiresAt:new Date(Date.now()+3600000).toISOString()}):Response.json({signedIn:false},{status:401});}});
 const location={href:'https://portal.invalid'+path,pathname:path,search:''};let content;
 const win={location,history:{replaceState(_,__,next){const u=new URL(next,'https://portal.invalid');Object.assign(location,{href:u.href,pathname:u.pathname,search:u.search});}},
  document:{visibilityState:'visible',addEventListener(){},removeEventListener(){}},addEventListener(){},removeEventListener(){}};
 const stop=module.exports.startPortalApplication({},win,(_,node)=>{content=node;return()=>{};});
 return {calls,content,stop};
}
test('advisor notifications has a strict audience-preserving route and parent',()=>{
 const route={name:'advisor-notifications'};
 assert.deepEqual(parseRoute('/advisor/notifications'),route);
 assert.equal(buildRoute(route),'/advisor/notifications');
 assert.deepEqual(parentRoute(route),{name:'advisor-clients'});
 assert.equal(prepareApplication({href:'https://portal.invalid/advisor/notifications'},{replaceState(){}}).audience,'advisor');
});
for(const [path,audience] of [['/advisor/notifications','advisor'],['/notifications','client']]){
 test(`fresh ${path} startup restores only the actual ${audience} cookie endpoint`,async()=>{
  const f=startup(path);try{
   assert.ok(f.content.props.runtime,'actual authenticated application constructed');
   await f.content.props.startup;
   assert.equal(f.content.props.runtime.cookie.audience,audience);
   assert.equal(f.content.props.runtime.cookie.status,'ready');
   assert.deepEqual(f.calls,[`/api/${audience}/session`]);
  }finally{f.stop();}
 });
}
test('signed-out advisor notification startup retains advisor recovery without a client restore',async()=>{
 const f=startup('/advisor/notifications',{signedIn:false});try{
  assert.ok(f.content.props.runtime);
  await assert.rejects(f.content.props.startup,e=>e.status===401);
  assert.equal(f.content.props.runtime.cookie.audience,'advisor');
  assert.deepEqual(f.calls,['/api/advisor/session']);
 }finally{f.stop();}
});
test('advisor return paths canonicalize the ambiguous legacy URL and deny client cross-audience returns',()=>{
 assert.equal(safeReturnPath('/notifications','advisor'),'/advisor/notifications');
 assert.equal(portalReturnPath('/notifications','advisor'),'/advisor/notifications');
 assert.equal(safeReturnPath('/advisor/notifications','advisor'),'/advisor/notifications');
 assert.equal(safeReturnPath('/advisor/notifications','client'),null);
 assert.equal(safeReturnPath('/notifications','client'),'/notifications');
 for(const path of ['/advisor/notifications?audience=client','/advisor/notifications?clientId=foreign','/advisor/notifications/other','//foreign.invalid/advisor/notifications']){
  assert.equal(parseRoute(path),null,path);
 }
});
test('actual advisor notifications entry reads its canonical deep link through the retained fixed channel',async t=>{
 const f=await entryFixture(t,{audience:'advisor',initialPath:'/advisor/notifications'}),entry=f.create();t.after(()=>entry.dispose());
 f.reply('list_inbox_v1',f.page());await entry.start();
 assert.equal(entry.getSnapshot().phase,'active');
 assert.equal(entry.getSnapshot().controller.getSnapshot().phase,'ready');
 assert.equal(f.commands.length,1);assert.equal(f.commands[0].action,'list_inbox_v1');
});
test('actual advisor application selects the inert inbox view and audience-preserving shared bell',async t=>{
 const f=await accountFixture(t,{audience:'advisor',initialPath:'/advisor/notifications'});
 const html=f.applicationHtml();assert.match(html,/loading notifications/);
 assert.equal((html.match(/href="\/advisor\/notifications"/g)??[]).length,1);
 assert.doesNotMatch(html,/href="\/notifications"/);assert.equal(f.commands.length,0);
});
test('advisor inbox callback scrubbing precedes audience selection and retains no invalid token',()=>{
 const location={href:'https://portal.invalid/advisor/notifications#access_token=SYNTHETIC-private'};
 const result=prepareApplication(location,{replaceState(_,__,path){location.href='https://portal.invalid'+path;}});
 assert.equal(location.href,'https://portal.invalid/advisor/notifications');
 assert.equal(result.audience,'advisor');assert.equal(result.callback.error,true);assert.equal(result.callback.code,null);
 assert.doesNotMatch(JSON.stringify(result),/SYNTHETIC-private/);
});
test('a client runtime cannot activate the advisor inbox entry from its URL',async t=>{
 const f=await entryFixture(t,{initialPath:'/advisor/notifications'}),entry=f.create();t.after(()=>entry.dispose());
 await entry.start();assert.equal(entry.getSnapshot().phase,'inactive');assert.equal(f.commands.length,0);
});
test('advisor route departure retires the actual held inbox read before it can return private rows',async t=>{
 const f=await entryFixture(t,{audience:'advisor',initialPath:'/advisor/notifications'}),entry=f.create(),held=gate();t.after(()=>entry.dispose());
 f.reply('list_inbox_v1',f.page(),200,held);const loading=entry.start();await held.entered;
 f.navigation.navigate({name:'advisor-clients'});assert.equal(entry.getSnapshot().controller,null);
 held.release();await loading;assert.equal(entry.getSnapshot().phase,'inactive');assert.equal(entry.getSnapshot().controller,null);
});
test('the actual client application refuses an advisor inbox URL without a notification read',async t=>{
 const f=await accountFixture(t,{initialPath:'/advisor/notifications'});
 assert.doesNotMatch(f.applicationHtml(),/loading notifications/);assert.equal(f.commands.length,0);
});
