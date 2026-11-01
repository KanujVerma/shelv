import test from 'node:test';import assert from 'node:assert/strict';
import {chFixture} from './rebuild-app-v3-history-ch-helper.mjs';
import {createHistoryRestorationScope} from '../src/app/client-composition.ts';
const version=(n=1)=>({name:'history-version',version:String(n)});
test('CH1 direct-first cached cursor returns the actual existing780/opener entry',async t=>{
 const f=await chFixture(t);assert.equal((await f.selected()).currentGuidance.mode,'historical_document');const c=f.cursor();f.listen(c);c.exit();await f.historyReady();const id=f.capture();f.navigator.navigate(version());assert.equal(f.cursor(),c);c.getSnapshot();c.exit();assert.equal(f.entry(),id);assert.deepEqual(f.context(),{scrollY:780,focusKey:'history-version-opener:publication:1'});assert.ok(f.calls.every(c=>['read_client_plan_v3','read_care_history_v1'].includes(c.command.action)));
});
test('true direct historical exit remains same-app fallback with no external traversal',async t=>{
 const f=await chFixture(t);await f.selected();const c=f.cursor();c.exit();assert.equal(f.w.win.location.pathname,'/history');assert.equal(f.w.entries.length,1);
});
test('interior product/evidence native Back/Forward preserves root opener exit',async t=>{
 const f=await chFixture(t,'/history'),doc=await f.selected();await f.historyReady();const id=f.capture(),productId=doc.plan.content.products[0].id;f.navigator.navigate(version());const c=f.cursor();f.listen(c);c.navigate({name:'product',productId,routine:'evening'});c.navigate({name:'product-evidence',productId,routine:'evening'});f.w.win.history.back();assert.equal(c.getSnapshot().name,'product');f.w.win.history.go(1);assert.equal(c.getSnapshot().name,'product-evidence');c.exit();assert.equal(f.entry(),id);assert.equal(f.context().scrollY,780);
});
test('another new root entry refreshes the same-version cached opener',async t=>{
 const f=await chFixture(t,'/history');await f.historyReady();const first=f.capture(220,'first-opener');f.navigator.navigate(version());const c=f.cursor();c.exit();assert.equal(f.entry(),first);f.navigator.navigate({name:'history'});await f.historyReady();const next=f.capture(780,'next-opener');f.navigator.navigate(version());c.exit();assert.equal(f.entry(),next);assert.notEqual(next,first);assert.deepEqual(f.context(),{scrollY:780,focusKey:'next-opener'});
});
test('a known older direct root retains its own absent predecessor after another root visit',async t=>{
 const f=await chFixture(t),c=f.cursor();f.listen(c);f.navigator.navigate({name:'history'});await f.historyReady();f.capture();f.navigator.navigate(version());c.getSnapshot();f.w.win.history.back();f.w.win.history.back();assert.equal(f.w.win.location.pathname,'/history/versions/1');c.getSnapshot();c.exit();assert.equal(f.w.win.location.pathname,'/history');assert.equal(f.w.entries.length,3);assert.equal(f.entry(),f.w.entries[0].state.shelvNavigation.entryId);
});
test('same-path route replacement uses its own actual inherited predecessor',async t=>{
 const f=await chFixture(t,'/history');await f.historyReady();const id=f.capture();f.navigator.navigate(version());const c=f.cursor(),first=f.entry();f.navigator.navigate(version(),{replace:true});assert.notEqual(f.entry(),first);c.exit();assert.equal(f.entry(),id);assert.equal(f.context().scrollY,780);
});
test('older-version and another-version roots each return to their actual opener',async t=>{
 const f=await chFixture(t,'/history');await f.selected(1);await f.selected(2);await f.historyReady();const id=f.capture();f.navigator.navigate(version(1));const first=f.entry(),c1=f.cursor(1);f.navigator.navigate(version(2));const c2=f.cursor(2);c2.exit();assert.equal(f.entry(),first);c1.exit();assert.equal(f.entry(),id);
});
test('reused cursor selects the new root on exit without an extra snapshot call',async t=>{
 const f=await chFixture(t),c=f.cursor();c.exit();await f.historyReady();const id=f.capture();f.navigator.navigate(version());c.exit();assert.equal(f.entry(),id);assert.equal(f.context().focusKey,'history-version-opener:publication:1');
});
test('new actual owner and disposed cursor cannot revive cached historical navigation',async t=>{
 const f=await chFixture(t),c=f.cursor();f.login({ownerId:'99999999-9999-4999-8999-999999999999'});await f.runtime.restore();assert.equal(f.boundary.isCurrent(),false);const id=f.entry(),count=f.w.entries.length;c.exit();c.navigate({name:'product',productId:'old-product',routine:'morning'});assert.equal(f.entry(),id);assert.equal(f.w.entries.length,count);c.dispose();c.exit();assert.equal(f.entry(),id);
});
test('current403 still retires actual private History/queued restoration without cursor preference revival',async t=>{
 const f=await chFixture(t,'/history');const scope=createHistoryRestorationScope({controller:f.connection.history,boundary:f.boundary,navigator:f.navigator,win:f.w.win}),off=scope.attach();t.after(off);const ready=await f.connection.history.restoration.restore(null).ready;scope.onReady(ready);f.fault(()=>Response.json({code:'forbidden'},{status:403}));await f.connection.history.load();f.flush();assert.deepEqual(f.effects,[]);assert.equal(f.connection.history.getSnapshot().phase,'denied');assert.equal(f.connection.history.getSnapshot().view,null);assert.deepEqual(f.connection.history.getSnapshot().pages,[]);assert.equal(f.boundary.isCurrent(),true);
});
