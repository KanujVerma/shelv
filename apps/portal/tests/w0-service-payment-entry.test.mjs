// Source/finite HTTP only: actual ApplicationSession, registered payments,
// production adapter and consumer. Navigation below is a closed local fixture.
import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture,view,deferred,quoteId,optionId} from './w5-orders-service-payments-helper.mjs';
const source=()=>import('../src/app/service-payment-entry.ts');
function navigation(initial='/account/service'){
 let path=initial;const listeners=new Set();
 return {getSnapshot:()=>path,subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);},
  go(next){path=next;for(const fn of [...listeners])fn();}};
}
async function setup(t,path){const f=await fixture(t),api=await source(),nav=navigation(path);return {...f,nav,entry:api.createServicePaymentEntry(f.runtime,nav),api};}
test('constructing the Account service entry is inert',async t=>{
 const f=await setup(t);assert.equal(f.entry.getSnapshot().phase,'idle');assert.equal(f.calls.length,0);f.entry.dispose();
});
test('prepublication service entry reads actual payments without clinical or service-history reads',async t=>{
 const f=await setup(t);await f.entry.start();
 assert.equal(f.entry.getSnapshot().phase,'active');assert.deepEqual(f.entry.getSnapshot().controller.getSnapshot().view,view());
 assert.deepEqual(f.calls.map(x=>x.command),[{schemaVersion:2,action:'client_read'}]);f.entry.dispose();
});
test('Account and Orders paths cannot activate the service payment entry',async t=>{
 for(const path of ['/account','/orders','/account/cancel']){const f=await setup(t,path);await f.entry.start();assert.equal(f.entry.getSnapshot().phase,'inactive');assert.equal(f.calls.length,0);f.entry.dispose();}
});
test('reentrant and concurrent starts share one read',async t=>{
 const f=await setup(t);const unsubscribe=f.entry.subscribe(()=>{void f.entry.start();});
 await Promise.all([f.entry.start(),f.entry.start()]);assert.equal(f.calls.length,1);unsubscribe();f.entry.dispose();
});
test('route departure clears the controller before a held financial read returns',async t=>{
 const f=await setup(t),hold=deferred(),started=deferred();t.after(()=>hold.release());
 f.setReadReply(async()=>{started.release();await hold.promise;return Response.json(view());});
 const pending=f.entry.start();await started.promise;const child=f.entry.getSnapshot().controller;
 f.nav.go('/orders');assert.equal(f.entry.getSnapshot().controller,null);hold.release();await pending;
 assert.equal(f.entry.getSnapshot().phase,'inactive');assert.equal(child.getSnapshot().view,null);f.entry.dispose();
});
test('replacement entry retires the old controller and old callbacks cannot dispatch',async t=>{
 const f=await setup(t);await f.entry.start();const old=f.entry.getSnapshot().controller,rendered=old.getSnapshot();
 const next=f.api.createServicePaymentEntry(f.runtime,f.nav);await next.start();
 assert.equal(f.entry.getSnapshot().phase,'ended');assert.equal(f.entry.getSnapshot().controller,null);
 const before=f.calls.length;await old.claim(rendered,quoteId,optionId,true);assert.equal(f.calls.length,before);next.dispose();f.entry.dispose();
});
test('a previously stopped entry cannot reclaim a replacement lifetime',async t=>{
 const f=await setup(t);await f.entry.start();f.entry.stop();
 const next=f.api.createServicePaymentEntry(f.runtime,f.nav);await next.start();const before=f.calls.length;
 await f.entry.start();assert.equal(f.calls.length,before);assert.equal(f.entry.getSnapshot().phase,'ended');
 assert.equal(next.getSnapshot().phase,'active');next.dispose();f.entry.dispose();
});
test('actual owner replacement clears existing financial state',async t=>{
 const f=await setup(t);await f.entry.start();
 f.setLogin({ownerId:'99999999-9999-4999-8999-999999999999',generation:2,csrf:'replacement'});await f.runtime.restore();
 assert.equal(f.entry.getSnapshot().phase,'ended');assert.equal(f.entry.getSnapshot().controller,null);f.entry.dispose();
});
test('an uncertain claim survives route disposal, with no automatic replay on return',async t=>{
 const f=await setup(t);await f.entry.start();f.setReply(()=>Response.json({code:'uncertain'},{status:503}));
 const old=f.entry.getSnapshot().controller;await old.claim(old.getSnapshot(),quoteId,optionId,true);
 const command=old.getSnapshot().pending;assert.ok(command);f.entry.stop();f.nav.go('/orders');f.nav.go('/account/service');
 const next=f.api.createServicePaymentEntry(f.runtime,f.nav);await f.runtime.restore();await next.start();
 assert.deepEqual(next.getSnapshot().controller.getSnapshot().pending,command);
 assert.equal(f.calls.filter(x=>x.command.action==='submit_claim').length,1);next.dispose();f.entry.dispose();
});
test('actual Application deep link mounts service before publication, with inert SSR',async t=>{
 const {accountFixture}=await import('./rebuild-account-entry-fixture.mjs');
 const f=await accountFixture(t,{initialPath:'/account/service'});
 const html=f.api.renderToString(f.api.createElement(f.api.OverlayProvider,null,
  f.api.createElement(f.api.PortalApplication,{runtime:f.runtime,startup:Promise.resolve(),win:f.win})));
 assert.match(html,/loading service payment/);assert.doesNotMatch(html,/this page is not connected yet|loading your plan/);
 assert.equal(f.commands.length,0);assert.equal(f.accountCommands.length,0);
});
