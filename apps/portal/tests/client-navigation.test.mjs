import test from 'node:test';import assert from 'node:assert/strict';
import {defaultPlanTab,readClientLocation,clientLocationHref} from '../site/client/navigation.js';
const view=(kind,choice=null,received=false)=>({plan:{presentation:{categoryCards:[{recommendationId:'choice',kind}]},itemStates:[{recommendationId:'choice',choice,received,startedOn:null}]},activeRoutine:[{kind:'product'}]});
test('state-aware entry respects optional future choices and actual unstarted receipts',()=>{
 assert.equal(defaultPlanTab(view('optional_alternative')),'routine');assert.equal(defaultPlanTab(view('finish_then_replace')),'routine');assert.equal(defaultPlanTab(view('replace')),'recommendations');assert.equal(defaultPlanTab(view('replace','approved')),'routine');assert.equal(defaultPlanTab(view('optional_alternative','approved',true)),'recommendations');assert.equal(defaultPlanTab({plan:null,routine:[]}),'recommendations');
});
test('explicit navigable destinations survive reload URLs without replacing unrelated context',()=>{
 const url=new URL('http://localhost/maya/?guided=1#visitor=one'),target={section:'product',planTab:'routine',productRef:'step:moisturizer'};const href=clientLocationHref(url,target);assert.match(href,/guided=1/);assert.match(href,/#visitor=one$/);assert.deepEqual(readClientLocation(new URL(href,url)),target);assert.equal(readClientLocation(new URL('http://localhost/?clientView=unknown')),null);assert.notEqual(readClientLocation(new URL('http://localhost/?clientView=routine&product=untrusted%2Fpath')).section,'product');
});
