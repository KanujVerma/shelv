import test from 'node:test';import assert from 'node:assert/strict';
import {fixture,controllerApi} from './rebuild-account-profile-fixture.mjs';
for(const kind of ['read','write'])for(const scenario of [{target:11,persistent:false},{target:1,persistent:false},{target:11,persistent:true}])test(`R5 SYNTHETIC ${kind} denied callback${scenario.target} persistent=${scenario.persistent} releases completed operation`,async t=>{
 const f=await fixture(t),{createAccountProfileController}=await controllerApi();let armed=false,count=0,fired=false,denied=false,stack=null;
 const c=createAccountProfileController(f.runtime,{isApplicable:()=>{
  if(denied)return false;
  if(armed&&f.calls.length===(kind==='read'?2:3)&&++count===scenario.target){armed=false;fired=true;denied=scenario.persistent;stack=new Error('callback locator only').stack;return false;}
  return true;
 }});t.after(()=>c.dispose());
 await c.load();c.editDisplayName();c.setDisplayName('Finished Operation Draft');const clicked=c.getSnapshot().draft;armed=true;
 const result=await(kind==='read'?c.readCurrent():c.save());armed=false;const after=c.getSnapshot();
 const egress=f.calls.length;const retryResult=await c.save();const repeated=c.getSnapshot();
 console.log('FINALIZATION',JSON.stringify({kind,scenario,count,fired,result,status:f.runtime.cookie.status,after,retryResult,repeated,egress,egressAfter:f.calls.length,stack}));
 assert.equal(fired,true);assert.equal(result,false);assert.equal(after.current,null);assert.notEqual(after.writeState,'saved');
 if(!scenario.persistent)assert.equal(after.draft,clicked);
 assert.equal(after.busy,false,'the completed promise must retire only its own active operation');
 if(kind==='write'&&!scenario.persistent)assert.equal(after.acknowledgement?.displayName,'Finished Operation Draft');
});
test('R5 SYNTHETIC explicit read recovers the stranded transient guard state without resending acknowledged write',async t=>{
 const f=await fixture(t),{createAccountProfileController}=await controllerApi();let armed=false,count=0;
 const c=createAccountProfileController(f.runtime,{isApplicable:()=>{if(armed&&f.calls.length===3&&++count===11){armed=false;return false;}return true;}});t.after(()=>c.dispose());
 await c.load();c.editDisplayName();c.setDisplayName('Recover Only With Read');armed=true;assert.equal(await c.save(),false);armed=false;
 const before=c.getSnapshot(),writes=f.calls.filter(x=>x.command.action==='set_account_display_name_v1').length;
 assert.equal(await c.readCurrent(),true);assert.equal(c.getSnapshot().busy,false);assert.equal(c.getSnapshot().acknowledgement,before.acknowledgement);assert.equal(c.getSnapshot().draft,before.draft);assert.equal(f.calls.filter(x=>x.command.action==='set_account_display_name_v1').length,writes);
});

test('Parent SYNTHETIC completed-operation cleanup cannot retire a newer read started by its observer',async t=>{
 const f=await fixture(t),{createAccountProfileController}=await controllerApi();let armed=false,count=0,fired=false,held=null,reading=null,starting=false;
 const c=createAccountProfileController(f.runtime,{isApplicable:()=>{if(armed&&f.calls.length===3&&++count===11){armed=false;fired=true;held=f.hold();return false;}return true;}});t.after(()=>{held?.resolve();c.dispose();});
 await c.load();c.editDisplayName();c.setDisplayName('New Reader Preserves Draft');const clicked=c.getSnapshot().draft;
 const stop=c.subscribe(()=>{const s=c.getSnapshot();if(fired&&!s.busy&&!starting){starting=true;reading=c.readCurrent();}});t.after(stop);
 armed=true;assert.equal(await c.save(),false);assert.equal(fired,true);assert.equal(starting,true);assert.ok(reading);
 await held.entered;assert.equal(c.getSnapshot().busy,true,'new pending read still owns its operation');
 const ack=c.getSnapshot().acknowledgement;held.resolve();assert.equal(await reading,true);assert.equal(c.getSnapshot().busy,false);
 assert.equal(c.getSnapshot().draft,clicked);assert.equal(c.getSnapshot().acknowledgement,ack);
 assert.equal(f.calls.filter(x=>x.command.action==='set_account_display_name_v1').length,1);
});
test('Parent SYNTHETIC disposal from completed-operation cleanup remains terminal',async t=>{
 const f=await fixture(t),{createAccountProfileController}=await controllerApi();let armed=false,count=0,fired=false,disposed=false;
 const c=createAccountProfileController(f.runtime,{isApplicable:()=>{if(armed&&f.calls.length===3&&++count===11){armed=false;fired=true;return false;}return true;}});t.after(()=>c.dispose());
 await c.load();c.editDisplayName();c.setDisplayName('Private Cleanup Draft');
 const stop=c.subscribe(()=>{if(fired&&!c.getSnapshot().busy){disposed=true;c.dispose();}});t.after(stop);
 armed=true;assert.equal(await c.save(),false);assert.equal(fired,true);assert.equal(disposed,true);
 const s=c.getSnapshot();assert.equal(s.phase,'ended');for(const key of ['current','draft','pending','acknowledgement'])assert.equal(s[key],null);
});
