import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture,controllerApi} from './rebuild-account-profile-fixture.mjs';

for(const scenario of [
 {kind:'write',target:10,change:'suspend'},
 {kind:'write',target:11,change:'suspend'},
 {kind:'write',target:11,change:'view'},
 {kind:'write',target:11,change:'dispose'},
 {kind:'read',target:11,change:'suspend'},
])test('SYNTHETIC actual '+scenario.change+' at '+scenario.kind+' canonical return callback '+scenario.target+' cannot consume retired work or report success',async t=>{
 const f=await fixture(t),{createAccountProfileController}=await controllerApi();let c,armed=false,count=0,fired=false,atChange=null,stack=null;
 c=createAccountProfileController(f.runtime,{isApplicable:()=>{
  if(armed&&f.calls.length===(scenario.kind==='read'?2:3)&&++count===scenario.target){
   armed=false;fired=true;stack=new Error('source callback position only').stack;
   if(scenario.change==='suspend')f.runtime.cookie.suspend();
   if(scenario.change==='view')f.runtime.cookie._view.capabilities.view=false;
   if(scenario.change==='dispose')c.dispose();
   atChange=c.getSnapshot();
  }
  return true;
 }});t.after(()=>c.dispose());
 await c.load();c.editDisplayName();c.setDisplayName('Clicked READY Name');const clicked=c.getSnapshot().draft;
 armed=true;const result=await (scenario.kind==='read'?c.readCurrent():c.save());armed=false;
 const after=c.getSnapshot();
 console.log('READY_RETURN',JSON.stringify({scenario,count,fired,result,status:f.runtime.cookie.status,atChange,after,stack}));
 assert.equal(fired,true,'the actual callback ran');assert.equal(after.current,null);
 assert.notEqual(after.writeState,'saved','retirement cannot become current saved completion');
 assert.equal(result,false,'an operation retired by the actual callback must not return success');
 if(scenario.change==='suspend')assert.equal(after.draft,clicked,'the actual clicked unsent draft must survive the retired completion');
});
test('SYNTHETIC ordinary ready completion still acknowledges, rereads and closes only the actual clicked draft',async t=>{
 const f=await fixture(t),{createAccountProfileController}=await controllerApi(),c=createAccountProfileController(f.runtime);t.after(()=>c.dispose());
 await c.load();c.editDisplayName();c.setDisplayName('Clicked READY Name');assert.equal(await c.save(),true);const s=c.getSnapshot();
 assert.equal(s.writeState,'saved');assert.equal(s.draft,null);assert.equal(s.current.displayName,'Clicked READY Name');assert.equal(f.runtime.cookie.status,'ready');
});
