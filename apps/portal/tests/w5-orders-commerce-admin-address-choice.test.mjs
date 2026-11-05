import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture,load,client,other,draftId,deferred} from './w5-orders-commerce-admin-helper.mjs';
const {createProductQuoteAdminController}=await load('apps/portal/src/features/orders/admin/controller.ts');
const view=()=>({clientId:client,paymentRevision:11,shippingAddress:{version:3,address:{recipientName:'Synthetic Client',line1:'3 Synthetic Street',line2:'',city:'Synthetic City',region:'WI',postalCode:'55555',countryCode:'US'}}});
async function setup(t){const f=await fixture(t),c=createProductQuoteAdminController({runtime:f.runtime,clientId:client,request:f.request});t.after(()=>c.dispose());await c.refresh();await c.openDraft(draftId);assert.equal(typeof c.chooseShippingAddress,'function','missing explicit local address choice');return {...f,c};}
test('explicit confirmed version changes only local draft and keeps unrelated partial fields',async t=>{
 const f=await setup(t),before=f.calls.length;f.c.setHeaderInputs({...f.c.getSnapshot().inputs.header,taxAmount:'2.',taxCheckedOn:''});assert.equal(await f.c.chooseShippingAddress(async()=>view()),true);const s=f.c.getSnapshot();assert.equal(s.preparation.body.shippingAddressVersion.value,3);assert.equal(s.inputs.header.taxAmount,'2.');assert.ok(s.inputErrors.header);assert.equal(s.dirty,true);assert.equal(s.reviewed,false);assert.equal(f.calls.length,before);
});
test('wrong client, stale revision, malformed and cancelled address choices do not replace draft',async t=>{
 const f=await setup(t);for(const value of [null,{...view(),clientId:other},{...view(),paymentRevision:12},{...view(),shippingAddress:null},{...view(),shippingAddress:{version:3,address:{...view().shippingAddress.address,privateReference:'invalid'}}}]){assert.equal(await f.c.chooseShippingAddress(async()=>value),false);assert.equal(f.c.getSnapshot().preparation.body.shippingAddressVersion.value,2);}
});
test('unknown new draft address stays unknown until deliberate coherent choice',async t=>{
 const f=await setup(t);assert.equal(f.c.newDraft(),true);assert.deepEqual(f.c.getSnapshot().preparation.body.shippingAddressVersion,{state:'unknown'});assert.equal(await f.c.chooseShippingAddress(),false);assert.equal(await f.c.chooseShippingAddress(async()=>view()),true);assert.equal(f.c.getSnapshot().preparation.body.shippingAddressVersion.value,3);assert.equal(f.c.getSnapshot().loaded,null);assert.equal(f.calls.every(x=>x.command.action.startsWith('read_')),true);
});
test('refresh or owner retirement while address picker is open rejects late result',async t=>{
 const f=await setup(t),first=deferred();const pending=f.c.chooseShippingAddress(()=>first.promise);await f.c.refresh();first.release(view());assert.equal(await pending,false);assert.equal(f.c.getSnapshot().preparation.body.shippingAddressVersion.value,2);const second=deferred(),other=f.c.chooseShippingAddress(()=>second.promise);f.setLogin({signedIn:false});await f.runtime.restore();second.release(view());assert.equal(await other,false);assert.equal(f.c.getSnapshot().loaded,null);
});
test('local raw edit and exact draft identity changes invalidate an open address choice',async t=>{
 const f=await setup(t),first=deferred(),pending=f.c.chooseShippingAddress(()=>first.promise);
 f.c.setHeaderInputs({...f.c.getSnapshot().inputs.header,taxAmount:'1.'});first.release(view());assert.equal(await pending,false);assert.equal(f.c.getSnapshot().preparation.body.shippingAddressVersion.value,2);
 await f.c.refresh();f.c.useLatest();
 const g=await setup(t),second=deferred(),other=g.c.chooseShippingAddress(()=>second.promise);assert.equal(g.c.newDraft(),true);second.release(view());assert.equal(await other,false);assert.deepEqual(g.c.getSnapshot().preparation.body.shippingAddressVersion,{state:'unknown'});
});
test('positive confirmed version is required and cancellation preserves unknown',async t=>{
 const f=await setup(t);assert.equal(f.c.newDraft(),true);
 for(const value of [null,{...view(),shippingAddress:{...view().shippingAddress,version:0}},{...view(),shippingAddress:{...view().shippingAddress,version:-1}},{...view(),shippingAddress:{...view().shippingAddress,address:{...view().shippingAddress.address,countryCode:'us'}}}]){
  assert.equal(await f.c.chooseShippingAddress(async()=>value),false);assert.deepEqual(f.c.getSnapshot().preparation.body.shippingAddressVersion,{state:'unknown'});
 }
});
test('post-choice observers cannot turn retired context into success',async t=>{
 const f=await setup(t);let suspended=false;const stop=f.c.subscribe(()=>{if(!suspended&&f.c.getSnapshot().preparation.body.shippingAddressVersion.value===3){suspended=true;f.runtime.cookie.suspend();}});t.after(stop);
 assert.equal(await f.c.chooseShippingAddress(async()=>view()),false);assert.equal(f.runtime.cookie.status,'offline');
});
test('an observer changing local fields during result application invalidates success',async t=>{
 const f=await setup(t);let changed=false;const stop=f.c.subscribe(()=>{if(!changed&&f.c.getSnapshot().preparation.body.shippingAddressVersion.value===3){changed=true;f.c.setHeaderInputs({...f.c.getSnapshot().inputs.header,note:'newer edit'});}});t.after(stop);
 assert.equal(await f.c.chooseShippingAddress(async()=>view()),false);assert.equal(f.c.getSnapshot().inputs.header.note,'newer edit');
});
