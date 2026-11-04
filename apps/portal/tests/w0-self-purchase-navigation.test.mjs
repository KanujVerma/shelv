// Actual client runtime/controller/review read and canonical navigation with
// closed synthetic HTTP. No order, decision, payment or use write is performed.
import test from 'node:test';
import assert from 'node:assert/strict';
import {session,view,virtualNavigationWindow} from './rebuild-app-v3-history-helper.mjs';
import {createClientComposition} from '../src/app/client-composition.ts';
import {createPortalNavigator} from '../src/navigation/history.ts';
import {buildRoute} from '../src/navigation/routes.ts';
let create;try{({createSelfPurchaseNavigation:create}=await import('../src/app/self-purchase-navigation.ts'));}catch(e){if(e.code!=='ERR_MODULE_NOT_FOUND')throw e;}
const product='ordinary-azelaic-10',decision='maya-card-treatments';
async function setup(t){
 const f=await session(t),connection=createClientComposition(f.runtime),boundary=f.runtime.getSnapshot().boundary;
 t.after(()=>connection.dispose());await connection.controller.refresh();
 const {win}=virtualNavigationWindow(buildRoute({name:'recommendation',decisionId:decision,routine:'evening'}));
 const navigation=createPortalNavigator(win,{scopeKey:boundary.key});t.after(()=>navigation.dispose());
 assert.equal(typeof create,'function','actual self-purchase navigation composition must exist');
 const callback=()=>create(f.runtime,connection.controller,boundary,navigation);
 return {...f,connection,boundary,navigation,callback};
}
test('self purchase navigates to exact actual-use form, preserving routine and performing no writes',async t=>{
 const f=await setup(t),before=f.calls.length,run=f.callback();assert.equal(typeof run,'function');run(product,decision);
 assert.equal(f.navigation.getSnapshot(),buildRoute({name:'product-use',productId:product,routine:'evening'}));assert.equal(f.calls.length,before);
});
test('a replacement canonical read retires an old callback even with the same product',async t=>{
 const f=await setup(t),run=f.callback(),path=f.navigation.getSnapshot();await f.connection.controller.refresh();run(product,decision);assert.equal(f.navigation.getSnapshot(),path);
});
test('an offline but lifetime-current real cookie cannot navigate from the old render',async t=>{
 const f=await setup(t),run=f.callback(),path=f.navigation.getSnapshot();f.runtime.cookie.status='offline';assert.equal(f.boundary.isCurrent(),true);
 run(product,decision);assert.equal(f.navigation.getSnapshot(),path);
});
test('actual owner/session replacement retires the callback',async t=>{
 const f=await setup(t),run=f.callback(),path=f.navigation.getSnapshot();f.login({ownerId:'99999999-9999-4999-8999-999999999999',generation:2,csrf:'replacement'});await f.runtime.restore();run(product,decision);assert.equal(f.navigation.getSnapshot(),path);
});
test('caller retargeting or mutation of a returned plan cannot add a new route intent',async t=>{
 const f=await setup(t),run=f.callback(),path=f.navigation.getSnapshot();run('cerave-pm',decision);run(product,'unknown');assert.equal(f.navigation.getSnapshot(),path);
 f.connection.controller.getSnapshot().view.plan.content.decisions.find(d=>d.id===decision).primaryProductId='cerave-pm';run('cerave-pm',decision);run(product,decision);assert.equal(f.navigation.getSnapshot(),path);
});
test('read-only data and denied reads expose no live callback',async t=>{
 const f=await setup(t);f.set(()=>({...view(),access:'read_only'}));await f.connection.controller.refresh();assert.equal(f.callback(),undefined);
 f.set(()=>Response.json({code:'forbidden'},{status:403}));await f.connection.controller.refresh();assert.equal(f.callback(),undefined);
});
