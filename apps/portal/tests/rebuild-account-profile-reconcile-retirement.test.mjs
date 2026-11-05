import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture,controllerApi} from './rebuild-account-profile-fixture.mjs';
for(const target of [1,2])test('SYNTHETIC actual snapshot reconciliation disposal callback '+target+' stays terminal with pending original',async t=>{
 const f=await fixture(t),{createAccountProfileController}=await controllerApi();let c,armed=false,count=0,disposed=false;
 c=createAccountProfileController(f.runtime,{isApplicable:()=>{if(armed&&++count===target){armed=false;disposed=true;c.dispose();}return true;}});t.after(()=>c.dispose());
 await c.load();c.editDisplayName();c.setDisplayName('Private Uncertain Draft');f.reply({code:'unavailable'},503);await c.save();await c.readCurrent();
 const before=c.getSnapshot();assert.ok(before.pending);assert.ok(before.current);assert.ok(before.draft);
 const egress=f.calls.length;armed=true;const state=c.getSnapshot();armed=false;
 console.log('RECONCILE_RETIREMENT',JSON.stringify({target,count,disposed,egressBefore:egress,egressAfter:f.calls.length,state}));
 assert.equal(disposed,true);assert.equal(f.calls.length,egress);assert.equal(state.phase,'ended');assert.equal(state.current,null);assert.equal(state.draft,null);assert.equal(state.pending,null);assert.equal(state.acknowledgement,null);
});
test('SYNTHETIC ordinary disposal clears private snapshot while exact original remains boundary-owned',async t=>{const f=await fixture(t),{createAccountProfileController}=await controllerApi(),c=createAccountProfileController(f.runtime);t.after(()=>c.dispose());await c.load();c.editDisplayName();c.setDisplayName('Private Ordinary');f.reply({code:'unavailable'},503);await c.save();await c.readCurrent();assert.ok(c.getSnapshot().pending);c.dispose();const s=c.getSnapshot();assert.equal(s.phase,'ended');for(const key of ['current','draft','pending','acknowledgement'])assert.equal(s[key],null);assert.ok(f.runtime.getSnapshot().boundary.memory.get('account.profile.original.v1').pending);});
test('SYNTHETIC decoration disposal without pending original does not resurrect private state',async t=>{const f=await fixture(t),{createAccountProfileController}=await controllerApi();let c,armed=false,count=0;c=createAccountProfileController(f.runtime,{isApplicable:()=>{if(armed&&++count===2){armed=false;c.dispose();}return true;}});t.after(()=>c.dispose());await c.load();c.editDisplayName();c.setDisplayName('No Pending Private');armed=true;const s=c.getSnapshot();armed=false;assert.equal(count,2);assert.equal(s.phase,'ended');for(const key of ['current','draft','pending','acknowledgement'])assert.equal(s[key],null);});
