import test from 'node:test';import assert from 'node:assert/strict';
import {detailsFixture} from './rebuild-account-details-custody-fixture.mjs';
test('actual disposed details callback cannot adopt replacement entry controllers',async t=>{
 const f=await detailsFixture(t),a=f.entry.getSnapshot(),details=f.details();details.open();assert.ok(a.profile.getSnapshot().draft);details.dispose();f.entry.stop();await f.entry.start();const b=f.entry.getSnapshot();assert.notEqual(b.profile,a.profile);assert.notEqual(b.contact,a.contact);details.open();assert.equal(details.getSnapshot(),null);assert.equal(b.profile.getSnapshot().draft,null);assert.equal(b.contact.getSnapshot().draft,null);
});
test('actual disposed details callback cannot edit its still-active original controllers',async t=>{
 const f=await detailsFixture(t),s=f.entry.getSnapshot(),details=f.details();details.dispose();details.open();assert.equal(details.getSnapshot(),null);assert.equal(s.profile.getSnapshot().draft,null);assert.equal(s.contact.getSnapshot().draft,null);
});
test('actual old creation-bound helper cannot adopt controllers even if its cleanup was late',async t=>{
 const f=await detailsFixture(t),details=f.details();f.entry.stop();await f.entry.start();details.open();assert.equal(details.getSnapshot(),null);assert.equal(f.entry.getSnapshot().profile.getSnapshot().draft,null);const next=f.details();next.open();assert.ok(next.getSnapshot());assert.ok(f.entry.getSnapshot().profile.getSnapshot().draft);next.dispose();
});
test('opening actual details preserves a newer contact review created by a profile observer',async t=>{
 const f=await detailsFixture(t),s=f.entry.getSnapshot(),details=f.details();let fired=false,newer=null;
 const stop=s.profile.subscribe(()=>{if(!fired&&s.profile.getSnapshot().draft){fired=true;s.contact.editEmail();s.contact.setEmail('Newer@Example.test');assert.equal(s.contact.reviewEmail(),true);newer=s.contact.getSnapshot().review;}});t.after(stop);details.open();assert.equal(fired,true);assert.ok(newer);assert.equal(s.contact.getSnapshot().review,newer);assert.equal(s.contact.getSnapshot().draft,newer);
});
test('opening actual details leaves an already reviewed email unchanged',async t=>{
 const f=await detailsFixture(t),s=f.entry.getSnapshot();s.contact.editEmail();s.contact.setEmail('Existing@Example.test');assert.equal(s.contact.reviewEmail(),true);const reviewed=s.contact.getSnapshot().review;const details=f.details();details.open();assert.equal(s.contact.getSnapshot().review,reviewed);assert.equal(s.contact.getSnapshot().draft,reviewed);
});
test('old actual Close cannot discard a newer review or close its activation',async t=>{
 const f=await detailsFixture(t),s=f.entry.getSnapshot(),details=f.details();details.open();const captured=details.capture();s.contact.setEmail('Keep@Example.test');assert.equal(s.contact.reviewEmail(),true);const newer=s.contact.getSnapshot().review;details.close(captured);assert.ok(details.getSnapshot());assert.equal(s.contact.getSnapshot().review,newer);
});
test('actual current Close discards only captured unsent drafts with no command',async t=>{
 const f=await detailsFixture(t),s=f.entry.getSnapshot(),details=f.details();details.open();const before=f.calls.length;details.close(details.capture());assert.equal(details.getSnapshot(),null);assert.equal(s.profile.getSnapshot().draft,null);assert.equal(s.contact.getSnapshot().draft,null);assert.equal(f.calls.length,before);
});
test('actual newer dialog opened by name-discard observer survives old Close',async t=>{
 const f=await detailsFixture(t),s=f.entry.getSnapshot(),details=f.details();details.open();const captured=details.capture();let reopened=false,newer=null;
 const stop=s.profile.subscribe(()=>{if(!reopened&&!s.profile.getSnapshot().draft){reopened=true;details.open();s.contact.setEmail('KeepNewDialog@Example.test');newer=s.contact.getSnapshot().draft;}});t.after(stop);details.close(captured);assert.equal(reopened,true);assert.ok(details.getSnapshot());assert.ok(s.profile.getSnapshot().draft);assert.equal(s.contact.getSnapshot().draft,newer);
});
