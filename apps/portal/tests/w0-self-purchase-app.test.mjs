// Real shared App/renderer/host callbacks with actual cookie/controller and
// closed synthetic HTTP. SSR is not a mounted keyboard/DOM acceptance test.
import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {sourceModule} from './rebuild-maya-five-stage-build.mjs';
import {session,virtualNavigationWindow,view} from './rebuild-app-v3-history-helper.mjs';
import {carePlan} from './rebuild/care-fixture.mjs';
import {createClientPorts} from '../src/app/ports.ts';
import {createClientPlanController} from '../src/app/client-state.ts';
import {createClientComposition} from '../src/app/client-composition.ts';
import {createPortalNavigator} from '../src/navigation/history.ts';
import {buildRoute,parseRoute} from '../src/navigation/routes.ts';
const require=createRequire(import.meta.url),jsx=require('react/jsx-runtime'),original={jsx:jsx.jsx,jsxs:jsx.jsxs};
let buttons=[],controls=[];
const text=v=>typeof v==='string'?v:Array.isArray(v)?v.map(text).join(''):v?.props?text(v.props.children):'';
for(const name of ['jsx','jsxs'])jsx[name]=(type,props,...rest)=>{if(type==='button')buttons.push({label:text(props.children),props});if(Array.isArray(props?.options))controls.push(props);return original[name](type,props,...rest);};
after(()=>Object.assign(jsx,original));
const {exports:api}=await sourceModule('tests/rebuild/app-ssr-entry.tsx');
const product='ordinary-azelaic-10',decision='maya-card-treatments';
async function setup(t,v3=false){
 const f=await session(t,()=>v3?view():carePlan()),boundary=f.runtime.getSnapshot().boundary;
 const composition=v3?createClientComposition(f.runtime):null,ports=composition?.ports??createClientPorts(f.runtime,{care:true});
 const controller=composition?.controller??createClientPlanController(boundary,ports,{readVersion:2});await controller.refresh();
 const {win}=virtualNavigationWindow(buildRoute({name:'recommendation',decisionId:decision,routine:'evening'}));
 const navigation=createPortalNavigator(win,{scopeKey:boundary.key});t.after(()=>{composition?.dispose();controller.dispose();navigation.dispose();});
 return {...f,boundary,controller,ports,navigation};
}
function render(f){
 buttons=[];controls=[];
 return api.renderToStaticMarkup(api.createElement(api.OverlayProvider,null,api.createElement(api.NavigationProvider,{navigator:f.navigation},
  api.createElement(api.ClientContent,{runtime:f.runtime,controller:f.controller,ports:f.ports,boundary:f.boundary,route:parseRoute(f.navigation.getSnapshot()),onSignOut(){}}))));
}
test('actual App self-purchase enters the matching shared form with self acquisition and no writes',async t=>{
 const f=await setup(t);render(f);const action=buttons.find(x=>x.label==='i’ll buy it myself');assert.ok(action,'actual App must supply its self-purchase callback');assert.equal(!!action.props.disabled,false);
 const before=f.calls.length;action.props.onClick({preventDefault(){},stopPropagation(){}});
 assert.equal(f.navigation.getSnapshot(),buildRoute({name:'product-use',productId:product,routine:'evening'}));const html=render(f);
 assert.equal(controls.find(x=>x.options.some(o=>o.value==='self'))?.value,'self');assert.match(html,/The Ordinary Azelaic Acid Suspension 10%/);assert.equal(f.calls.length,before);
});
test('actual V3 App supplies the same callback while retaining the independent guidance-ready UI gate',async t=>{
 const f=await setup(t,true);render(f);assert.ok(buttons.some(x=>x.label==='i’ll buy it myself'));
 assert.deepEqual(f.calls.map(x=>x.command.action),['read_client_plan_v3']);
});
test('an old actual host callback cannot navigate while its real session is offline',async t=>{
 const f=await setup(t);render(f);const action=buttons.find(x=>x.label==='i’ll buy it myself');assert.ok(action);const path=f.navigation.getSnapshot(),before=f.calls.length;
 f.runtime.cookie.status='offline';assert.equal(f.boundary.isCurrent(),true);action.props.onClick({preventDefault(){},stopPropagation(){}});
 assert.equal(f.navigation.getSnapshot(),path);assert.equal(f.calls.length,before);
});
