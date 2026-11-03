import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture,controllerApi} from './rebuild-account-profile-fixture.mjs';

test('SYNTHETIC disposal during saving publication remains terminal with no private snapshot',async t=>{
 const f=await fixture(t),{createAccountProfileController}=await controllerApi();let c,armed=false,count=0,disposed=false;
 c=createAccountProfileController(f.runtime,{isApplicable:()=>{
  const pending=f.runtime.getSnapshot().boundary?.memory.get('account.profile.original.v1')?.pending;
  if(armed&&pending&&++count===3){armed=false;disposed=true;c.dispose();}
  return true;
 }});t.after(()=>c.dispose());
 await c.load();c.editDisplayName();c.setDisplayName('Private Clicked Draft');armed=true;await c.save();armed=false;
 const state=c.getSnapshot(),writes=f.calls.filter(x=>x.command.action==='set_account_display_name_v1');
 console.log('RETIREMENT',JSON.stringify({disposed,writes:writes.length,state}));
 assert.equal(disposed,true);assert.equal(writes.length,0);assert.equal(state.phase,'ended');assert.equal(state.current,null);assert.equal(state.draft,null);assert.equal(state.pending,null);assert.equal(state.acknowledgement,null);
});
