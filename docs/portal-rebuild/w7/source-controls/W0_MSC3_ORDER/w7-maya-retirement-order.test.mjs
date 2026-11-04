import test from 'node:test';import assert from 'node:assert/strict';
import {createMayaDemoController} from '../src/features/walkthrough/maya/controller.ts';
import {createMayaChromeController} from '../src/app/maya-chrome.ts';
test('MSC3 contact closure precedes a later session observer after same-session navigation',t=>{
 const demo=createMayaDemoController(),chrome=createMayaChromeController(demo);t.after(()=>{chrome.dispose();demo.dispose();});
 const session=demo.getPlanProps().session;let rendered=chrome.getSnapshot(),seen=null;const order=[];
 chrome.subscribe(()=>{rendered=chrome.getSnapshot();if(rendered.opening===null)order.push('chrome-cleared');});
 session.subscribeInvalidation(()=>{seen=rendered.opening;order.push('later-session-observer');throw Error('local observer');});
 demo.navigate({name:'plan',routine:'evening'});assert.equal(demo.getPlanProps().session,session);
 chrome.open(chrome.getSnapshot());assert.ok(rendered.opening);order.length=0;
 demo.reset();console.log(JSON.stringify({order,observerSawOpen:seen!==null}));
 assert.equal(seen,null,'contact must clear and notify its view before later retirement observers');
 assert.equal(order[0],'chrome-cleared');
});
