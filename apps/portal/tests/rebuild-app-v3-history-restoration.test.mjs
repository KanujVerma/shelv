// Finite source/actual SSR/controller and plain navigator only. No DOM/browser.
import test from 'node:test';import assert from 'node:assert/strict';
import {writeFile,mkdir} from 'node:fs/promises';
import {createPortalNavigator} from '../src/navigation/history.ts';
import {createClientComposition} from '../src/app/client-composition.ts';
import {fixture,row,uid} from './rebuild-history-restoration-helper.mjs';
import {virtualNavigationWindow} from './rebuild-app-v3-history-helper.mjs';
const api=await import('../src/app/client-composition.ts');
const area=new URL('../../../.local-artifacts/portal-rebuild/w0-v3-history-restoration/',import.meta.url);await mkdir(area,{recursive:true});

test('canonical pre-data frame is a retained cross-owner diagnostic, not restoration acceptance',async()=>{
 const f=virtualNavigationWindow('/plan'),events=[];f.win.scrollTo=({top})=>{events.push({type:'scroll',top});f.win.scrollY=top;};f.win.document.querySelector=()=>({focus(){events.push({type:'focus'});}});
 const navigator=createPortalNavigator(f.win,{scopeKey:'pre-data-diagnostic'}),stop=navigator.subscribe(()=>{});
 navigator.navigate({name:'history'});await f.settle();assert.ok(events.length>0);
 await writeFile(new URL('canonical-pre-data-diagnostic.json',area),JSON.stringify({historyReady:false,events,path:f.win.location.pathname,source:'actual canonical navigator, plain objects only'},null,2));stop();navigator.dispose();
});
test('App restoration scope defers until exact committed W4 result and refuses old deferred work',async t=>{
 assert.equal(typeof api.createHistoryRestorationScope,'function');const f=await fixture(t),c=createClientComposition(f.runtime);t.after(()=>c.dispose());const w=virtualNavigationWindow(),navigator=createPortalNavigator(w.win,{scopeKey:f.runtime.getSnapshot().boundary.key}),stop=navigator.subscribe(()=>{});t.after(()=>{stop();navigator.dispose();});
 const frames=[],events=[];w.win.requestAnimationFrame=fn=>{frames.push(fn);return frames.length;};w.win.scrollTo=({top})=>events.push(['scroll',top]);w.win.document.getElementById=id=>({focus:()=>events.push(['focus',id])});
 const scope=api.createHistoryRestorationScope({controller:c.history,boundary:f.runtime.getSnapshot().boundary,navigator,win:w.win});const cleanup=scope.attach();
 const attempt=c.history.restoration.restore(null),result=await attempt.ready;assert.equal(events.length,0);scope.onReady(result);assert.equal(events.length,0);cleanup();for(const frame of frames.splice(0))frame();assert.equal(events.length,0);
});
test('App source scope restores real filtered multipage extent through composed generation-aware Session',async t=>{
 assert.equal(typeof api.createHistoryRestorationScope,'function');const f=await fixture(t,{count:4}),first=createClientComposition(f.runtime);await f.all(first.history);first.history.restoration.setFilter('checkins');const anchor={kind:'entry',entryKey:'report:'+row(3).event.id};first.history.restoration.capture(anchor);first.dispose();f.data({salt:40000});
 const next=createClientComposition(f.runtime);t.after(()=>next.dispose());const result=await next.history.restoration.restore(null).ready;assert.equal(result.state,'restored');assert.equal(next.history.getSnapshot().pages.length,4);assert.equal(next.history.getSnapshot().timeline.filter,'checkins');assert.ok(result.anchorId.endsWith(row(3).event.id));
});
test('App scope cannot restore an unmarked or foreign navigation entry',async t=>{
 const f=await fixture(t),c=createClientComposition(f.runtime);t.after(()=>c.dispose());const w=virtualNavigationWindow(),frames=[];w.win.requestAnimationFrame=fn=>{frames.push(fn);return frames.length;};const navigator=createPortalNavigator(w.win,{scopeKey:'foreign-entry'});
 const scope=api.createHistoryRestorationScope({controller:c.history,boundary:f.runtime.getSnapshot().boundary,navigator,win:w.win}),stop=scope.attach();t.after(()=>{stop();navigator.dispose();});const result=await c.history.restoration.restore(null).ready;scope.onReady(result);assert.equal(frames.length,0);
});
