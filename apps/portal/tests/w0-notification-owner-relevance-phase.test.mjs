import test from 'node:test';
import assert from 'node:assert/strict';
import {entryFixture,ownerSource} from './w0-notification-owner-fixture.mjs';
const {createNotificationViewLease}=await ownerSource();
test('reentrant phase observation cannot appear ready while its relevance check will deny',async t=>{
 const f=await entryFixture(t);let checkingDenial=false,nestedPhase=null,lease;
 lease=createNotificationViewLease(f.runtime,{isApplicable(){
  if(checkingDenial){nestedPhase=lease.controller.getSnapshot().phase;return false;}
  return true;
 }});t.after(()=>lease.dispose());assert.equal(lease.start(),true);
 f.reply('list_inbox_v1',f.page());await lease.controller.loadInbox();
 assert.equal(lease.controller.getSnapshot().phase,'ready');checkingDenial=true;
 const outer=lease.controller.getSnapshot();assert.equal(outer.phase,'ended');
 assert.notEqual(nestedPhase,'ready','phase-only nested read must not bypass the pending deny-only relevance check');
});
