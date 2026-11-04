// Real public-demo controller and local chrome state only. No browser or IO.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createMayaDemoController} from '../src/features/walkthrough/maya/controller.ts';
let create;
try{({createMayaChromeController:create}=await import('../src/app/maya-chrome.ts'));}
catch(error){if(error.code!=='ERR_MODULE_NOT_FOUND')throw error;}
function fixture(t){
 assert.equal(typeof create,'function','shared Maya chrome controller must exist');
 const demo=createMayaDemoController(),chrome=create(demo);t.after(()=>{chrome.dispose();demo.dispose();});return{demo,chrome};
}
test('contact opens only against the exact current rendered local state',t=>{
 const {chrome}=fixture(t),initial=chrome.getSnapshot();assert.equal(initial.opening,null);
 chrome.open(initial);assert.ok(chrome.getSnapshot().opening);chrome.close(chrome.getSnapshot());
 chrome.open(initial);assert.equal(chrome.getSnapshot().opening,null,'obsolete opener cannot adopt a later closed state');
});
test('an old closer never closes a newer contact opening',t=>{
 const {chrome}=fixture(t);chrome.open(chrome.getSnapshot());const old=chrome.getSnapshot();chrome.close(old);
 chrome.open(chrome.getSnapshot());const current=chrome.getSnapshot();chrome.close(old);assert.equal(chrome.getSnapshot(),current);assert.ok(current.opening);
});
test('ordinary plan navigation clears contact ownership before observers run or throw',t=>{
 const {demo,chrome}=fixture(t);chrome.open(chrome.getSnapshot());
 let seen;demo.subscribe(()=>{seen=chrome.getSnapshot();throw Error('local observer');});
 assert.throws(()=>demo.navigate({name:'plan',routine:'evening'}),/local observer/);
 assert.equal(seen.opening,null);assert.equal(chrome.getSnapshot().opening,null);
});
test('stage and same-generation view changes permanently retire an old opening',t=>{
 const {demo,chrome}=fixture(t);chrome.open(chrome.getSnapshot());const old=chrome.getSnapshot();
 demo.selectStage(3);assert.equal(chrome.getSnapshot().opening,null);chrome.open(old);assert.equal(chrome.getSnapshot().opening,null);
 chrome.open(chrome.getSnapshot());demo.receiveExample();assert.equal(chrome.getSnapshot().opening,null);
});
test('reset clears contact before session-retirement observers and a stale closer preserves the new opening',t=>{
 const {demo,chrome}=fixture(t);chrome.open(chrome.getSnapshot());const old=chrome.getSnapshot();let seen;
 demo.getPlanProps().session.subscribeInvalidation(()=>{seen=chrome.getSnapshot();throw Error('observer');});
 demo.reset();assert.equal(seen.opening,null);chrome.open(chrome.getSnapshot());const current=chrome.getSnapshot();chrome.close(old);assert.equal(chrome.getSnapshot(),current);
});
test('reentrant opening from a chrome observer cannot be erased by old cleanup',t=>{
 const {demo,chrome}=fixture(t);chrome.open(chrome.getSnapshot());const old=chrome.getSnapshot();let opened=false;
 chrome.subscribe(()=>{const state=chrome.getSnapshot();if(!opened&&state.opening===null&&!state.retired){opened=true;chrome.open(state);}});
 demo.navigate({name:'plan',routine:'evening'});assert.equal(opened,true);const current=chrome.getSnapshot();chrome.close(old);assert.equal(chrome.getSnapshot(),current);assert.ok(current.opening);
});
test('only a current callback can navigate back to the sample plan',t=>{
 const {demo,chrome}=fixture(t),initial=chrome.getSnapshot();demo.selectStage(4);chrome.showPlan(initial);assert.equal(demo.getSnapshot().page,'follow-up');
 chrome.showPlan(chrome.getSnapshot());assert.equal(demo.getSnapshot().page,'plan');assert.equal(demo.getSnapshot().stage,4);
});
test('disposal clears contact before observers and exposes no session, snapshot or answers',t=>{
 const {demo,chrome}=fixture(t);chrome.open(chrome.getSnapshot());let seen;chrome.subscribe(()=>{seen=chrome.getSnapshot();});
 chrome.dispose();assert.equal(seen.opening,null);assert.equal(seen.retired,true);
 assert.deepEqual(Object.keys(seen).sort(),['opening','retired','revision']);chrome.open(seen);chrome.showPlan(seen);assert.equal(chrome.getSnapshot(),seen);demo.dispose();
});
