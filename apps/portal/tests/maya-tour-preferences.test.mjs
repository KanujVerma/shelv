import test from 'node:test';
import assert from 'node:assert/strict';
import {createMayaTourPreferences} from '../site/walkthrough/tour-preferences.js';

function surface({hash='#access=opaque&unknown=keep',blocked=false}={}){
 const values={local:new Map(),session:new Map()};
 const storage=kind=>({getItem(key){if(blocked)throw Error('blocked');return values[kind].get(key)??null;},setItem(key,value){if(blocked)throw Error('blocked');values[kind].set(key,String(value));},removeItem(key){if(blocked)throw Error('blocked');values[kind].delete(key);}});
 const window={localStorage:storage('local'),sessionStorage:storage('session'),location:{pathname:'/maya/',search:'?guided=1',hash},history:{state:{unrelated:'keep'},replaceState(state,unused,url){this.state=state;window.location.hash=new URL(url,'http://localhost').hash;}}};
 return {window,values};
}

test('a first visitor sees welcome once, then only an active same-tab history entry resumes',()=>{
 const {window,values}=surface();
 const first=createMayaTourPreferences({window});assert.equal(first.initialMode(),'welcome');first.markSeen();
 assert.equal(createMayaTourPreferences({window}).initialMode(),'closed');first.begin();
 assert.equal(createMayaTourPreferences({window}).initialMode(),'resume');
 window.history.state={unrelated:'new history entry'};assert.equal(createMayaTourPreferences({window}).initialMode(),'closed');
 assert.deepEqual([...values.local.values()],['1']);assert.deepEqual([...values.session.values()],['1']);
});

test('exit removes only tour fragment and history markers and cannot reopen by restoring an old history entry',()=>{
 const {window,values}=surface({hash:'#access=opaque&step=daily-routine&explore=1&tour=1&unknown=keep'});
 const prefs=createMayaTourPreferences({window});prefs.markSeen();prefs.begin();const activeHistory=structuredClone(window.history.state);
 prefs.end();assert.equal(window.location.hash,'#access=opaque&unknown=keep');assert.deepEqual(window.history.state,{unrelated:'keep'});assert.equal(values.session.size,0);
 window.history.state=activeHistory;assert.equal(createMayaTourPreferences({window}).initialMode(),'closed');
 prefs.begin();assert.equal(createMayaTourPreferences({window}).initialMode(),'resume');
});

test('denied storage permits the first welcome and keeps dismissal in memory for this document',()=>{
 const {window}=surface({blocked:true});const prefs=createMayaTourPreferences({window});assert.equal(prefs.initialMode(),'welcome');
 assert.doesNotThrow(()=>{prefs.markSeen();prefs.begin();prefs.end();});assert.equal(prefs.initialMode(),'closed');
});

test('malformed and primitive history state never prevents closing the tour',()=>{
 const {window}=surface({hash:'#step=one&access=x&extra=a%20b'});window.history.state='opaque history';
 const prefs=createMayaTourPreferences({window});prefs.begin();prefs.end();assert.equal(window.location.hash,'#access=x&extra=a+b');
});
