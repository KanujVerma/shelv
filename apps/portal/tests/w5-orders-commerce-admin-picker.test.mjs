import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture,load,client,draftId,line,publication,deferred} from './w5-orders-commerce-admin-helper.mjs';
const {createProductQuoteAdminController}=await load('apps/portal/src/features/orders/admin/controller.ts');
async function setup(t){const f=await fixture(t),c=createProductQuoteAdminController({runtime:f.runtime,clientId:client,request:f.request});t.after(()=>c.dispose());await c.refresh();await c.openDraft(draftId);assert.equal(typeof c.chooseProduct,'function','missing bound published-product picker');return {...f,c};}
const candidate=()=>({selection:{publication,decisionId:'another-decision',productId:'another-product'},identity:{...line().identity,name:'Synthetic Published Option'}});
test('explicit picker applies exact published selection/identity locally without an operation',async t=>{
 const f=await setup(t),before=f.calls.length,data=candidate();assert.equal(await f.c.chooseProduct('line-a',async id=>{assert.equal(id,'line-a');return data;}),true);const selected=f.c.getSnapshot().preparation.lines[0];assert.deepEqual(selected.selection,{state:'known',value:data.selection});assert.equal(selected.identity.name,'Synthetic Published Option');assert.equal(f.calls.length,before);data.identity.name='caller mutation';assert.equal(selected.identity.name,'Synthetic Published Option');assert.equal(f.c.getSnapshot().dirty,true);
});
test('cancel, private/draft selectors and different publication cannot fabricate a product',async t=>{
 const f=await setup(t),original=f.c.getSnapshot().preparation.lines[0];for(const result of [null,{...candidate(),draftId},{...candidate(),selection:{...candidate().selection,publication:{version:0,documentSchemaVersion:3}}},{...candidate(),selection:{...candidate().selection,publication:{...publication,version:2}}}]){assert.equal(await f.c.chooseProduct('line-a',async()=>result),false);assert.deepEqual(f.c.getSnapshot().preparation.lines[0],original);}
});
test('local line revision changing during picker invalidates the returned option',async t=>{
 const f=await setup(t),wait=deferred();const pending=f.c.chooseProduct('line-a',()=>wait.promise);f.c.setLine({...line(),retailer:{state:'known',value:'new checked retailer'}});wait.release(candidate());assert.equal(await pending,false);assert.equal(f.c.getSnapshot().preparation.lines[0].retailer.value,'new checked retailer');assert.equal(f.c.getSnapshot().preparation.lines[0].selection.value.productId,'product-a');
});
test('offline and actual owner retirement prevent late picker application',async t=>{
 const f=await setup(t),wait=deferred();const pending=f.c.chooseProduct('line-a',()=>wait.promise);f.runtime.cookie.suspend();wait.release(candidate());assert.equal(await pending,false);assert.equal(f.c.getSnapshot().preparation.lines[0].selection.value.productId,'product-a');await f.runtime.restore();await f.c.refresh();const second=deferred(),other=f.c.chooseProduct('line-a',()=>second.promise);f.setLogin({signedIn:false});await f.runtime.restore();second.release(candidate());assert.equal(await other,false);assert.equal(f.c.getSnapshot().loaded,null);assert.deepEqual(f.c.getSnapshot().preparation.lines,[]);
});
test('draft refresh and missing callback or missing line keep picker unavailable',async t=>{
 const f=await setup(t);assert.equal(await f.c.chooseProduct('line-a'),false);let called=0;assert.equal(await f.c.chooseProduct('absent',async()=>{called++;return candidate();}),false);assert.equal(called,0);const wait=deferred(),pending=f.c.chooseProduct('line-a',()=>wait.promise);await f.c.refresh();wait.release(candidate());assert.equal(await pending,false);assert.equal(f.c.getSnapshot().preparation.lines[0].selection.value.productId,'product-a');
});
test('picker cannot report success after its local state observer suspends the owner',async t=>{
 const f=await setup(t);let suspended=false;const stop=f.c.subscribe(()=>{if(!suspended&&f.c.getSnapshot().dirty){suspended=true;f.runtime.cookie.suspend();}});t.after(stop);assert.equal(await f.c.chooseProduct('line-a',async()=>candidate()),false);assert.equal(f.c.getSnapshot().phase,'offline');assert.equal(f.calls.every(call=>call.command.action.startsWith('read_')),true);
});
