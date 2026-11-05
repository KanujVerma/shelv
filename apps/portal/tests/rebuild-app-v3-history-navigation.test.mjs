// Actual navigator/cursor on plain objects, no DOM/browser implementation.
import test from 'node:test';import assert from 'node:assert/strict';
import {createPortalNavigator} from '../src/navigation/history.ts';
import {createBrowserHistoricalNavigation} from '../src/app/preview-navigation.ts';
import {virtualNavigationWindow} from './rebuild-app-v3-history-helper.mjs';
import {buildRoute,parseRoute,safeReturnPath} from '../src/navigation/routes.ts';
test('historical interior uses safe URL and canonical nonzero Forward scroll; exit restores exact History opener',async()=>{
 const f=virtualNavigationWindow(),outer=createPortalNavigator(f.win,{scopeKey:'synthetic-navigation'}),stop=outer.subscribe(()=>{});outer.navigate({name:'history-version',version:'1'});await f.settle();const cursor=createBrowserHistoricalNavigation(f.win,outer,1,()=>true),unsub=cursor.subscribe(()=>{});
 try{cursor.navigate({name:'product',productId:'cerave-pm',routine:'evening'});await f.settle();f.win.scrollY=250;f.win.document.activeElement.id='product-opener';f.fire('scroll');cursor.navigate({name:'product-evidence',productId:'cerave-pm',routine:'evening'});await f.settle();f.win.scrollY=650;f.fire('scroll');f.win.history.back();await f.settle();assert.equal(cursor.getSnapshot().name,'product');assert.equal(f.win.scrollY,250);f.win.history.go(1);await f.settle();assert.equal(cursor.getSnapshot().name,'product-evidence');assert.equal(f.win.scrollY,650);assert.equal(f.win.location.pathname,'/history/versions/1');assert.ok(!JSON.stringify(f.entries).includes('cerave-pm'));cursor.exit();await f.settle();assert.equal(f.win.location.pathname,'/history');assert.equal(f.win.history.state.shelvNavigation.restore.focusKey,'history-version-opener');}
 finally{unsub();cursor.dispose();stop();outer.dispose();}
});
test('direct historical entry has same-app parent fallback and cannot leave the service',async()=>{
 const f=virtualNavigationWindow('/history/versions/1'),outer=createPortalNavigator(f.win,{scopeKey:'direct-history'}),stop=outer.subscribe(()=>{}),cursor=createBrowserHistoricalNavigation(f.win,outer,1,()=>true),unsub=cursor.subscribe(()=>{});
 try{cursor.exit();await f.settle();assert.equal(f.win.location.pathname,'/history');}finally{unsub();cursor.dispose();stop();outer.dispose();}
});
test('History direct links and auth returns preserve identifiers only and reject private query/hash/authority',()=>{
 for(const route of [{name:'history'},{name:'history-new'},{name:'history-event',eventId:'report-17'},{name:'history-version',version:'2'}]){const url=buildRoute(route);assert.deepEqual(parseRoute(url),route);assert.equal(safeReturnPath(url,'client'),url);}
 for(const url of ['/history/new?notes=PRIVATE','/history?cursor=secret','/history?clientId=other','/history/versions/2#token=secret'])assert.equal(safeReturnPath(url,'client'),null);
});
test('disposed historical cursor cannot restart canonical navigation through an old callback',async()=>{
 const f=virtualNavigationWindow(),outer=createPortalNavigator(f.win,{scopeKey:'retired-history'}),stop=outer.subscribe(()=>{});outer.navigate({name:'history-version',version:'1'});await f.settle();const cursor=createBrowserHistoricalNavigation(f.win,outer,1,()=>true),unsub=cursor.subscribe(()=>{});const before=f.entries.length;cursor.dispose();cursor.navigate({name:'product',productId:'old-private-selection',routine:'evening'});assert.equal(f.entries.length,before);unsub();stop();outer.dispose();
});
