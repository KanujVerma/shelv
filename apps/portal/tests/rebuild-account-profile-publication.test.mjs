import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture,controllerApi} from './rebuild-account-profile-fixture.mjs';

for(const target of [1,2,3,4])test('SYNTHETIC actual post-capture publication callback '+target+' preserves newer draft identity',async t=>{
 const f=await fixture(t),{createAccountProfileController}=await controllerApi();let c,armed=false,count=0,newer=null;
 c=createAccountProfileController(f.runtime,{isApplicable:()=>{
  const original=f.runtime.getSnapshot().boundary?.memory.get('account.profile.original.v1')?.pending;
  if(armed&&original&&++count===target){armed=false;c.setDisplayName('Newer Publication Edit');newer=c.getSnapshot().draft;}
  return true;
 }});t.after(()=>c.dispose());
 await c.load();c.editDisplayName();c.setDisplayName('Clicked Original');const clicked=c.getSnapshot().draft;
 const h=f.hold();armed=true;const saving=c.save();await h.entered;armed=false;const beforeAck=c.getSnapshot();h.resolve();await saving;
 const after=c.getSnapshot(),writes=f.calls.filter(x=>x.command.action==='set_account_display_name_v1');
 console.log('PUBLICATION',JSON.stringify({target,count,clicked:clicked.displayName,newer:newer?.displayName,beforeAckDraft:beforeAck.draft?.displayName,wireNames:writes.map(x=>x.command.displayName),finalDraft:after.draft?.displayName??null,writeState:after.writeState}));
 assert.ok(newer,'actual reentrant edit ran');assert.notEqual(newer,clicked);assert.ok(writes.every(x=>x.command.displayName===clicked.displayName));
 assert.equal(beforeAck.draft,newer,'publication must not overwrite a newer draft before acknowledgement');
 assert.equal(after.draft,newer,'canonical completion must preserve the exact newer unsent draft');assert.notEqual(after.writeState,'saved');
});
