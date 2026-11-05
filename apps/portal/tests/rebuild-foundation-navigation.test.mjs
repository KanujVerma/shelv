import test from 'node:test';
import assert from 'node:assert/strict';
import {buildRoute, parseRoute, parentRoute, safeReturnPath, CLIENT_NAVIGATION} from '../src/navigation/routes.ts';
import {createPortalNavigator, restoreNavigationContext} from '../src/navigation/history.ts';

test('all semantic routes roundtrip encoded identities and safe routine selection', () => {
  const cases = [
    {name:'plan',routine:'evening'}, {name:'recommendation',decisionId:'decision:one',routine:'morning'},
    ...['product','product-evidence','product-use'].map(name=>({name,productId:'card:cerave-pm',routine:'evening'})),
    {name:'history'}, {name:'history-new'}, {name:'history-event',eventId:'event:one'}, {name:'history-version',version:'v2'},
    {name:'orders'}, {name:'order',orderId:'quote:one'}, {name:'account'}, {name:'account-service'}, {name:'account-cancel'},
    {name:'notifications'}, {name:'advisor-clients'}, {name:'advisor-client',clientId:'client:one'}, {name:'advisor-client',clientId:'client:one',task:'draft'}, {name:'advisor-plans'},
    {name:'advisor-editor',draftId:'draft:one',section:'review-publish'}, {name:'advisor-preview',draftId:'draft:one'},
    {name:'advisor-review',reportId:'report:one'}, {name:'advisor-permissions'}, {name:'maya',stage:2},
  ];
  for (const route of cases) assert.deepEqual(parseRoute(buildRoute(route)),route);
  assert.deepEqual(CLIENT_NAVIGATION.map(x=>x.label),['your plan','check-ins & history','orders','account']);
});

test('untrusted deep links cannot become auth returns, credentials or cross-audience routes',()=>{
  for(const path of ['//evil.test/plan','https://evil.test/plan','/plan?token=secret','/plan?routine=night','/plan?routine=morning&routine=evening','/plan/products/a%2Fb','/plan/products/%ZZ','/plan#access_token=x','/plan\\evil','/advisor/plans/a/unknown','/maya?stage=9','/plan/products/other/../cerave','/plan/products/other/%2e%2e/cerave']) assert.equal(parseRoute(path),null,path);
  assert.equal(safeReturnPath('/advisor/clients','client'),null);
  assert.equal(safeReturnPath('/plan','advisor'),null);
  assert.equal(safeReturnPath('/plan/products/card%3Aone?routine=evening','client'),'/plan/products/card%3Aone?routine=evening');
  assert.equal(safeReturnPath('/maya','client'),null);
  assert.throws(()=>buildRoute({name:'product',productId:'../secret',routine:'morning'}));
  assert.throws(()=>buildRoute({name:'history-event',eventId:'new'}));
});

test('retained client URL aliases map explicitly, with identified products kept bound',()=>{
  assert.deepEqual(parseRoute('/?workspace=client&clientView=routine&product=card%3Acerave'),{name:'product',productId:'card:cerave',routine:'morning'});
  assert.deepEqual(parseRoute('/?workspace=client&clientView=checkins'),{name:'history'});
  assert.deepEqual(parseRoute('/?workspace=advisor'),{name:'advisor-clients'});
  assert.deepEqual(parseRoute('/?workspace=advisor&advisorClient=client%3Aone&advisorTask=draft'),{name:'advisor-client',clientId:'client:one',task:'draft'});
  assert.equal(parseRoute('/?workspace=client&ownerId=other'),null);
  assert.deepEqual(parentRoute({name:'product-evidence',productId:'card:cerave',routine:'evening'}),{name:'product',productId:'card:cerave',routine:'evening'});
});

function fakeBrowser(initial='/plan?routine=evening') {
  const entries=[{url:initial,state:null}];let cursor=0,backCalls=0;
  const listeners=new Set();
  const win={location:{pathname:'/plan',search:'?routine=evening'},history:{get state(){return entries[cursor].state;},replaceState(state,_,url){entries[cursor]={state,url};setUrl(url);},pushState(state,_,url){entries.splice(++cursor);entries[cursor]={state,url};setUrl(url);},back(){backCalls++;cursor--;setUrl(entries[cursor].url);listeners.forEach(f=>f());}},addEventListener(_,f){listeners.add(f);},removeEventListener(_,f){listeners.delete(f);},scrollY:360,scrollTo(){},requestAnimationFrame(f){f();},document:{activeElement:{id:'product-cerave'},getElementById(){return null;},querySelector(){return null;}}};
  function setUrl(url){const u=new URL(url,'https://portal.invalid');win.location.pathname=u.pathname;win.location.search=u.search;}
  return {win,entries,get backCalls(){return backCalls;}};
}

test('product Back uses a valid scoped predecessor and restores the original routine/focus marker',()=>{
  const b=fakeBrowser(),nav=createPortalNavigator(b.win,{scopeKey:'session-a'});
  nav.navigate({name:'product',productId:'card:cerave',routine:'evening'});
  assert.equal(b.entries[0].state.shelvNavigation.restore.focusKey,'product-cerave');
  assert.equal(b.entries[0].state.shelvNavigation.restore.scrollY,360);
  assert.equal(JSON.stringify(b.entries).includes('draft'),false);
  nav.back();assert.equal(b.backCalls,1);assert.equal(nav.getSnapshot(),'/plan?routine=evening');nav.dispose();
});

test('direct entry and prior-session history fall back to a product-specific parent',()=>{
  const b=fakeBrowser();b.win.location.pathname='/plan/products/card%3Acerave/evidence';
  const nav=createPortalNavigator(b.win,{scopeKey:'new-session'});nav.back();
  assert.equal(b.backCalls,0);assert.equal(nav.getSnapshot(),'/plan/products/card%3Acerave?routine=evening');nav.dispose();
});

test('focus restoration chooses a replacement opener or surviving heading without moving scroll',()=>{
  const calls=[];const heading={focus:options=>calls.push(['heading',options])};
  const doc={getElementById:key=>key==='product-cerave'?{focus:options=>calls.push(['opener',options])}:null,querySelector:()=>heading};
  const viewport={scrollTo:options=>calls.push(['scroll',options])};
  restoreNavigationContext({focusKey:'product-cerave',scrollY:360},doc,viewport);
  assert.deepEqual(calls,[['opener',{preventScroll:true}],['scroll',{top:360,left:0,behavior:'instant'}]]);
  calls.length=0;restoreNavigationContext({focusKey:'removed',scrollY:0},doc,viewport);
  assert.equal(calls[0][0],'heading');
});

test('history subscriptions survive React strict effect cleanup and re-subscription',()=>{
  const b=fakeBrowser(),nav=createPortalNavigator(b.win,{scopeKey:'strict-replay'});
  const first=nav.subscribe(()=>{});first();nav.dispose();
  let updates=0;const second=nav.subscribe(()=>updates++);
  nav.navigate({name:'product',productId:'card:cerave',routine:'evening'});nav.back();
  assert.equal(updates,2);assert.equal(nav.getSnapshot(),'/plan?routine=evening');second();nav.dispose();
});

test('Back destination is a read-only prediction of the validated recommendation or product predecessor',()=>{
  const b=fakeBrowser(),nav=createPortalNavigator(b.win,{scopeKey:'back-prediction'});
  const recommendation={name:'recommendation',decisionId:'card:one',routine:'evening'};
  nav.navigate(recommendation);nav.navigate({name:'product-evidence',productId:'product:one',routine:'evening'});
  const before=JSON.stringify(b.entries);assert.deepEqual(nav.backDestination(),recommendation);
  assert.equal(JSON.stringify(b.entries),before);assert.equal(b.backCalls,0);
  nav.back();assert.deepEqual(parseRoute(nav.getSnapshot()),recommendation);nav.dispose();
});
test('direct and foreign-scope Back destinations use the same scoped parent without initializing history',()=>{
  for(const state of [null,{shelvNavigation:{version:1,scopeKey:'foreign',entryId:'foreign:1',predecessor:{entryId:'foreign:0',path:'/orders'},restore:{scrollY:0,focusKey:null}}}]){
    const b=fakeBrowser();b.win.location.pathname='/plan/products/product%3Aone/evidence';b.entries[0].state=state;
    const nav=createPortalNavigator(b.win,{scopeKey:'current'}),expected={name:'product',productId:'product:one',routine:'evening'},before=JSON.stringify(b.entries);
    assert.deepEqual(nav.backDestination(),expected);assert.equal(JSON.stringify(b.entries),before);assert.equal(b.backCalls,0);
    nav.back();assert.deepEqual(parseRoute(nav.getSnapshot()),expected);assert.equal(b.backCalls,0);nav.dispose();
  }
});
