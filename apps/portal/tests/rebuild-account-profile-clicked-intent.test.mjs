import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture,controllerApi,requestApi,initial} from './rebuild-account-profile-fixture.mjs';

test('SYNTHETIC clicked original must not be replaced by reentrant deny-only applicability callback before capture',async t=>{
 const f=await fixture(t),{createAccountProfileController}=await controllerApi();
 let c,armed=false;
 c=createAccountProfileController(f.runtime,{isApplicable:()=>{
  if(armed){armed=false;c.setDisplayName('Newer Callback Edit');}
  return true;
 }});t.after(()=>c.dispose());
 await c.load();c.editDisplayName();c.setDisplayName('Clicked Original');
 const clicked=c.getSnapshot().draft;armed=true;
 await c.save();
 const writes=f.calls.filter(x=>x.command.action==='set_account_display_name_v1');
 console.log('CALLBACK_INTENT',JSON.stringify({clicked:clicked.displayName,writes:writes.map(x=>x.command),draft:c.getSnapshot().draft,writeState:c.getSnapshot().writeState}));
 assert.ok(writes.every(x=>x.command.displayName===clicked.displayName),'a local relevance callback must not select a different name for the deliberate click');
 assert.equal(c.getSnapshot().draft?.displayName,'Newer Callback Edit','a newer callback edit must remain unsent');
});
