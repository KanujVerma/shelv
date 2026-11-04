import test from 'node:test';
import assert from 'node:assert/strict';
import {entryFixture} from './rebuild-notifications-entry-fixture.mjs';

test('a stopped old inbox entry must not retire a newer owner of the same live advisor route',async t=>{
 const f=await entryFixture(t,{audience:'advisor',initialPath:'/advisor/notifications'});
 const old=f.create(),current=f.create();t.after(()=>{old.dispose();current.dispose();});
 for(let n=0;n<3;n++)f.reply('list_inbox_v1',f.page());
 await old.start();old.stop();await current.start();
 assert.equal(current.getSnapshot().phase,'active');
 assert.equal(f.runtime.cookie.status,'ready');
 await old.start();
 assert.equal(f.runtime.cookie.status,'ready');
 assert.equal(current.getSnapshot().phase,'active','stale stopped entry cannot retire the newer live inbox');
 assert.equal(old.getSnapshot().controller,null);
});
