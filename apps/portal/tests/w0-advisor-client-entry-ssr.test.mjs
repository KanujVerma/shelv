// Actual shared feature/App view and native host handlers, finite HTTP only.
import test,{after} from 'node:test';import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {sourceModule} from './rebuild-maya-five-stage-build.mjs';
import {createApplicationSession} from '../src/app/session.ts';
import {createAdvisorPorts} from '../src/app/ports.ts';
import {createAdvisorClientEntry} from '../src/app/advisor-client-entry.ts';
import {createPortalNavigator} from '../src/navigation/history.ts';
import {buildRoute} from '../src/navigation/routes.ts';
import {virtualNavigationWindow} from './rebuild-app-v3-history-helper.mjs';
import {ids,stamp} from './rebuild/advisor-fixture.mjs';
const require=createRequire(import.meta.url),jsx=require('react/jsx-runtime'),original={jsx:jsx.jsx,jsxs:jsx.jsxs};let buttons=[];
const text=v=>typeof v==='string'?v:Array.isArray(v)?v.map(text).join(''):v?.props?text(v.props.children):'';
for(const k of ['jsx','jsxs'])jsx[k]=(type,props,...rest)=>{if(type==='button')buttons.push({label:text(props.children),props});return original[k](type,props,...rest);};after(()=>Object.assign(jsx,original));
const {exports:api}=await sourceModule('tests/w0-advisor-client-entry-ssr.ts');
async function setup(t){
 const bc=globalThis.BroadcastChannel;globalThis.BroadcastChannel=undefined;t.after(()=>{globalThis.BroadcastChannel=bc;});const calls=[];let reply=c=>({drafts:[],publications:[],nextCursor:'d:'+ids.draft});
 const runtime=createApplicationSession({audience:'advisor',locks:{request:async(_n,_o,run)=>run()},fetcher:async(url,init)=>{
  if(url==='/api/advisor/session')return Response.json({signedIn:true,ownerId:ids.actor,generation:1,csrf:'scoped-SSR',capabilities:{view:true,edit:true,publish:false,confirmPayments:false},idleExpiresAt:'2099-01-01T00:00:00Z',absoluteExpiresAt:'2099-01-02T00:00:00Z'});
  assert.equal(url,'/api/advisor/plans');const command=JSON.parse(init.body);assert.equal(command.clientId,ids.client);assert.equal(command.action,'list_plans_v1');calls.push(command);return Response.json(reply(command));
 }});await runtime.restore();t.after(()=>runtime.dispose());const boundary=runtime.getSnapshot().boundary;
 const {win}=virtualNavigationWindow(buildRoute({name:'advisor-client',clientId:ids.client})),navigation=createPortalNavigator(win,{scopeKey:boundary.key});t.after(()=>navigation.dispose());
 const entry=createAdvisorClientEntry(runtime,navigation,ids.client),adapter=createAdvisorPorts(runtime,{care:true});t.after(()=>{entry.dispose();adapter.dispose();});
 const props={runtime,clientId:ids.client,boundary,entry,publication:adapter.publication,adapterCare:adapter.care};
 const render=component=>{buttons=[];return api.renderToStaticMarkup(api.createElement(api.OverlayProvider,null,api.createElement(api.NavigationProvider,{navigator:navigation},api.createElement(component,props))));};
 return {calls,entry,navigation,render,set(fn){reply=fn;}};
}
test('actual client App construction/SSR remains inert and names its scoped loading state',async t=>{
 const f=await setup(t),html=f.render(api.AdvisorClientApplication);assert.match(html,/loading client workspace/);assert.equal(f.calls.length,0);
});
test('an empty first scoped page never claims no draft and later rows open the exact editor',async t=>{
 const f=await setup(t);f.entry.start();const c=f.entry.getSnapshot().controller;await c.refresh();let html=f.render(api.AdvisorClientEntryView);
 assert.match(html,/load more plan records/);assert.doesNotMatch(html,/no working draft|no draft found/);
 f.set(()=>({drafts:[{id:ids.draft,clientId:ids.client,state:'working',contentRevision:1,assignmentRevision:1,savedAt:stamp}],publications:[],nextCursor:null}));await c.loadMore();html=f.render(api.AdvisorClientEntryView);assert.match(html,/working draft/);const before=f.calls.length;
 buttons.find(x=>x.label==='open draft').props.onClick();assert.equal(f.navigation.getSnapshot(),buildRoute({name:'advisor-editor',draftId:ids.draft,section:'sources'}));assert.equal(f.calls.length,before);
});
test('only successful complete scoped traversal displays loaded-record absence',async t=>{
 const f=await setup(t);f.set(()=>({drafts:[],publications:[],nextCursor:null}));f.entry.start();await f.entry.getSnapshot().controller.refresh();const html=f.render(api.AdvisorClientEntryView);
 assert.match(html,/no working draft in the loaded record/);assert.match(html,/refresh to check for changes/);assert.doesNotMatch(html,/no draft found/);
});
