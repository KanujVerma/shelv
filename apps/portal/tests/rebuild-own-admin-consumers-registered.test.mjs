// CURRENT physical registry, native finite HTTP only. No constructor projection,
// successful OperationPort, Auth/Vault substitute, SQL or browser acceptance.
import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture as profileFixture,controllerApi,initial} from './rebuild-account-profile-fixture.mjs';
import {actual as contactFixture,contact} from './rebuild-account-contact-fixture.mjs';
import {actual as ordersFixture,recordedView,defineSyntheticOrdersTests} from './rebuild-client-orders-fixture.mjs';
import {createAccountContactController} from '../src/features/account/contact/controller.ts';
import {createClientOrdersReadController} from '../src/features/orders/read/controller.ts';

test('CURRENT registered profile controller reads, saves exact name and rereads with VIEW only',async t=>{
  const f=await profileFixture(t,{physical:true});
  const {createAccountProfileController}=await controllerApi({physical:true});
  const c=createAccountProfileController(f.runtime);t.after(()=>c.dispose());
  assert.equal(Object.hasOwn(f.runtime.cookie.actions,'account-profile'),true);
  assert.equal(f.runtime.cookie._view.capabilities.edit,false);
  await c.load();assert.deepEqual(c.getSnapshot().current,initial());
  c.editDisplayName();c.setDisplayName('  Exact Registered Name  ');
  await c.save();assert.equal(c.getSnapshot().writeState,'saved');
  assert.equal(c.getSnapshot().current.displayName,'  Exact Registered Name  ');
  assert.deepEqual(f.calls.map(call=>call.command.action),['read_account_profile_v1','set_account_display_name_v1','read_account_profile_v1']);
  f.runtime.cookie.suspend();assert.equal(c.getSnapshot().current,null);
});

test('CURRENT registered contact controller exposes canonical read and refuses to infer pending email',async t=>{
  const f=await contactFixture(t),c=createAccountContactController(f.runtime);t.after(()=>c.dispose());
  assert.equal(Object.hasOwn(f.runtime.cookie.actions,'account-contact'),true);
  assert.equal(await c.load(),true);assert.deepEqual(c.getSnapshot().current,contact);
  assert.deepEqual(c.getSnapshot().current.pendingEmail,{state:'unknown'});
  assert.deepEqual(f.calls.map(call=>call.url),['/api/client/session','/api/client/account-contact']);
  f.runtime.cookie._end();assert.equal(c.getSnapshot().current,null);
});

test('CURRENT registered Orders controller reads the complete recorded collection without a channel projection',async t=>{
  const f=await ordersFixture(t,{allowOrders:true}),c=createClientOrdersReadController(f.runtime);t.after(()=>c.dispose());
  assert.equal(Object.hasOwn(f.runtime.cookie.actions,'client-orders'),true);
  await c.load();assert.equal(c.getSnapshot().phase,'ready');
  assert.deepEqual(c.getSnapshot().view,recordedView());
  assert.deepEqual(f.calls.map(call=>call.url),['/api/client/session','/api/client/client-orders']);
});

// The original 37-case function retains its legacy SYNTHETIC test titles and
// assertions verbatim. Here it runs against CURRENT physical registration;
// no source loader, actions assignment or historical constructor is selected.
defineSyntheticOrdersTests();
