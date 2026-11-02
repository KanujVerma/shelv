import test from 'node:test';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {entryFixture} from './rebuild-notifications-entry-fixture.mjs';
const observations=[];
async function replaced(t){
 const f=await entryFixture(t),a=f.create();t.after(()=>a.dispose());f.reply('list_inbox_v1',f.page());await a.start();const c=a.getSnapshot().controller;
 c.subscribe(()=>{if(c.getSnapshot().phase==='ended')f.navigation.navigate({name:'account'});});
 const b=f.create();t.after(()=>b.dispose());const seen=[];b.subscribe(()=>{seen.push(b.getSnapshot().phase);});
 await b.start();assert.equal(f.navigation.getSnapshot(),'/account');assert.equal(f.commands.length,1);
 return {f,a,b,seen};
}
test('replacement start publishes inactive after predecessor retirement changes the actual route', async t=>{
 const {b,seen}=await replaced(t);const notifiedBeforeRead=[...seen];const phaseAfterRead=b.getSnapshot().phase;
 observations.push({case:'startup-route-exit',notifiedBeforeRead,phaseAfterRead,notifiedAfterRead:[...seen]});
 assert.deepEqual(notifiedBeforeRead,['inactive']);assert.equal(phaseAfterRead,'inactive');
});
test('returning to notifications can start the replacement without needing an earlier snapshot read',async t=>{
 const {f,b,seen}=await replaced(t);const before=[...seen];
 f.navigation.navigate({name:'notifications'});f.reply('list_inbox_v1',f.page(27));await b.start();await b.start();
 const snapshot=b.getSnapshot();observations.push({case:'route-return',notifiedBeforeReturn:before,phase:snapshot.phase,hasController:snapshot.controller!==null,commandCount:f.commands.length});
 assert.ok(snapshot.controller,'replacement entry must not be stuck running with no controller');assert.equal(snapshot.controller.getSnapshot().inbox.items[0].revision,27);assert.equal(f.commands.length,2);
});
test.after(async()=>{if(process.env.ENTRY_OBSERVATIONS)await writeFile(process.env.ENTRY_OBSERVATIONS,JSON.stringify(observations,null,2),{flag:'wx'});});
test('predecessor retirement may install C without B retiring C or its navigator',async t=>{
 const f=await entryFixture(t),a=f.create();t.after(()=>a.dispose());f.reply('list_inbox_v1',f.page());await a.start();
 let c,loading;
 const original=a.getSnapshot().controller;
 original.subscribe(()=>{if(original.getSnapshot().phase==='ended'&&!c){c=f.create();f.reply('list_inbox_v1',f.page(31));loading=c.start();}});
 const b=f.create();t.after(()=>b.dispose());await b.start();assert.ok(c);t.after(()=>c.dispose());await loading;
 assert.equal(b.getSnapshot().phase,'ended');assert.equal(b.getSnapshot().controller,null);
 assert.equal(c.getSnapshot().phase,'active');assert.equal(c.getSnapshot().controller.getSnapshot().inbox.items[0].revision,31);assert.equal(f.commands.length,2);
 await b.start();b.stop();b.dispose();assert.equal(c.getSnapshot().phase,'active');assert.equal(f.navigation.getSnapshot(),'/notifications');
 f.navigation.navigate({name:'account'});assert.equal(c.getSnapshot().controller,null);
});
test('replacement start emits ended if actual boundary ends during predecessor retirement',async t=>{
 const f=await entryFixture(t),a=f.create();t.after(()=>a.dispose());f.reply('list_inbox_v1',f.page());await a.start();
 const original=a.getSnapshot().controller;
 original.subscribe(()=>{if(original.getSnapshot().phase==='ended')f.runtime.cookie._end();});
 const b=f.create(),seen=[];t.after(()=>b.dispose());b.subscribe(()=>{seen.push(b.getSnapshot().phase);});await b.start();
 assert.deepEqual(seen,['ended']);assert.equal(b.getSnapshot().controller,null);assert.equal(f.commands.length,1);assert.equal(f.runtime.getSnapshot().boundary,null);
});
