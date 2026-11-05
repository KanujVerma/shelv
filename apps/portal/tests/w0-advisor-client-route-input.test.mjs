// Actual advisor entry render and native session; closed finite HTTP only.
// This catches constructor validation escaping during a malformed deep link.
import test from 'node:test';
import assert from 'node:assert/strict';
import {sourceModule} from './rebuild-maya-five-stage-build.mjs';
import {createApplicationSession} from '../src/app/session.ts';
import {createAdvisorPorts} from '../src/app/ports.ts';
import {createPortalNavigator} from '../src/navigation/history.ts';
import {parseRoute} from '../src/navigation/routes.ts';
import {virtualNavigationWindow} from './rebuild-app-v3-history-helper.mjs';
import {ids} from './rebuild/advisor-fixture.mjs';
const {exports:api}=await sourceModule('tests/w0-advisor-client-entry-ssr.ts');
async function render(t,clientId){
 const bc=globalThis.BroadcastChannel;globalThis.BroadcastChannel=undefined;t.after(()=>{globalThis.BroadcastChannel=bc;});
 const calls=[];
 const runtime=createApplicationSession({audience:'advisor',locks:{request:async(_n,_o,run)=>run()},fetcher:async(url)=>{
  calls.push(url);assert.equal(url,'/api/advisor/session');
  return Response.json({signedIn:true,ownerId:ids.actor,generation:1,csrf:'synthetic-route-input',capabilities:{view:true,edit:true,publish:false,confirmPayments:false},idleExpiresAt:'2099-01-01T00:00:00Z',absoluteExpiresAt:'2099-01-02T00:00:00Z'});
 }});await runtime.restore();t.after(()=>runtime.dispose());
 const boundary=runtime.getSnapshot().boundary;
 const {win}=virtualNavigationWindow('/advisor/clients/'+clientId),navigation=createPortalNavigator(win,{scopeKey:boundary.key});t.after(()=>navigation.dispose());
 assert.deepEqual(parseRoute(navigation.getSnapshot()),{name:'advisor-client',clientId});
 const adapter=createAdvisorPorts(runtime,{care:true});t.after(()=>adapter.dispose());
 const props={runtime,clientId,boundary,publication:adapter.publication,adapterCare:adapter.care};
 return {runtime,calls,html:()=>api.renderToStaticMarkup(api.createElement(api.OverlayProvider,null,api.createElement(api.NavigationProvider,{navigator:navigation},api.createElement(api.AdvisorClientApplication,props))))};
}
test('malformed advisor-client deep link renders recovery without a scoped read or constructor crash',async t=>{
 const f=await render(t,'not-a-client');let html;
 assert.doesNotThrow(()=>{html=f.html();});
 assert.match(html,/client workspace unavailable/);assert.match(html,/href="\/advisor\/plans"/);
 assert.doesNotMatch(html,/loading client workspace/);assert.deepEqual(f.calls,['/api/advisor/session']);assert.equal(f.runtime.cookie.status,'ready');
});
test('valid client UUID retains the inert scoped workspace loading render',async t=>{
 const f=await render(t,ids.client.toUpperCase()),html=f.html();
 assert.match(html,/loading client workspace/);assert.doesNotMatch(html,/client workspace unavailable/);
 assert.deepEqual(f.calls,['/api/advisor/session']);assert.equal(f.runtime.cookie.status,'ready');
});
