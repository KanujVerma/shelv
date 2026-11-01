// Source, real shared SSR callbacks and a plain Window model only. No DOM.
import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import {sourceModule} from './rebuild-maya-five-stage-build.mjs';
const require=createRequire(import.meta.url),jsx=require('react/jsx-runtime');
const original={jsx:jsx.jsx,jsxs:jsx.jsxs};
const text=v=>typeof v==='string'||typeof v==='number'?String(v):Array.isArray(v)?v.map(text).join(''):v?.props?text(v.props.children):'';
let buttons=[];
for(const key of ['jsx','jsxs'])jsx[key]=(type,props,...rest)=>{
  if(type==='button')buttons.push({label:text(props.children),props});
  return original[key](type,props,...rest);
};
after(()=>Object.assign(jsx,original));
const {exports:api,inputs}=await sourceModule('tests/rebuild-maya-application-ssr.ts');
function windowModel(path='/maya') {
  const entries=[{path,state:null}],events=new Map(),frames=[];let index=0;
  const location={href:'https://portal.invalid'+path,pathname:'',search:''};
  function setPath(path){const u=new URL(path,'https://portal.invalid');Object.assign(location,{href:u.href,pathname:u.pathname,search:u.search});}
  setPath(path);
  const win={location,scrollY:0,document:{activeElement:null,getElementById:()=>null,querySelector:()=>null},
    scrollTo(){},requestAnimationFrame:fn=>frames.push(fn),
    addEventListener(name,fn){if(!events.has(name))events.set(name,new Set());events.get(name).add(fn);},
    removeEventListener(name,fn){events.get(name)?.delete(fn);},
    history:{scrollRestoration:'auto',get state(){return entries[index].state;},
      replaceState(state,_,path){entries[index]={path,state};setPath(path);},
      pushState(state,_,path){entries.splice(++index);entries[index]={path,state};setPath(path);},
      back(){this.go(-1);},go(delta){assert.ok(entries[index+delta]);index+=delta;setPath(entries[index].path);for(const fn of [...events.get('popstate')??[]])fn();}},
  };
  return {win,entries,events,flush(){while(frames.length)frames.shift()();},listenerCount(){return [...events.values()].reduce((n,set)=>n+set.size,0);}};
}
function fixture(t,stage=1) {
  const model=windowModel(api.buildRoute({name:'maya',stage})),scope=api.createMayaApplicationScope(model.win);
  t.after(scope.dispose);return {...model,scope,controller:scope.getSnapshot().controller};
}
function render(scope){buttons=[];return api.renderMayaApplication(scope);}
function button(label){const found=buttons.filter(b=>b.label===label);assert.equal(found.length,1,label);assert.equal(found[0].props['data-slot'],'button');return found[0].props;}
function click(label){const p=button(label);assert.equal(!!p.disabled,false);p.onClick({defaultPrevented:false,preventDefault(){this.defaultPrevented=true;},stopPropagation(){}});}
const stages=[[1,'meet-maya','start with Maya’s priorities'],[2,'meaningful-decision','review a recommendation'],[3,'daily-use','try sample use states'],[4,'follow-up','sample follow-up'],[5,'next-step','a plan with follow-through']];
function target(f,stage){
  const s=f.controller.getSnapshot(),definition=stages[stage-1];
  assert.equal(s.stage,stage);assert.equal(f.win.location.pathname+f.win.location.search,api.buildRoute({name:'maya',stage}));
  const html=render(f.scope);assert.match(html,new RegExp('data-maya-stage="'+definition[1]+'"'));assert.ok(html.includes(definition[2]));
  assert.match(html,/fictional staged sample/);return html;
}
for(const [stage] of stages)test('actual public startup and shared composition select stage '+stage,t=>{
  const model=windowModel(api.buildRoute({name:'maya',stage}));let mounted=0,unmounted=0;
  const stop=api.startPortalApplication({},model.win,(_,node)=>{
    mounted++;assert.deepEqual(node.props.route,{name:'maya',stage});
    assert.equal('runtime' in node.props,false);assert.equal('startup' in node.props,false);
    const html=api.renderToStaticMarkup(api.createElement(api.StrictMode,null,node));
    assert.match(html,/Maya · fictional demo/);assert.match(html,new RegExp('loading sample · stage '+stage+' of 5'));
    assert.doesNotMatch(html,/unavailable|sign in|five-stage tour/);return()=>unmounted++;
  });
  stop();assert.equal(mounted,1);assert.equal(unmounted,1);assert.equal(model.listenerCount(),0);
  const f=fixture(t,stage);target(f,stage);assert.equal(f.controller.getPlanProps().ports,undefined);
});
test('ordinary guide Next/Back writes canonical URLs, and native traversal restores all distinct stages',t=>{
  const f=fixture(t);target(f,1);assert.equal(button('back').disabled,true);
  for(let stage=2;stage<=5;stage++){click('next');target(f,stage);}
  assert.equal(f.entries.length,5);
  for(let stage=4;stage>=1;stage--){f.win.history.go(-1);target(f,stage);}
  for(let stage=2;stage<=5;stage++){f.win.history.go(1);target(f,stage);}
  for(let stage=4;stage>=1;stage--){click('back');target(f,stage);}
  f.flush();assert.equal(f.controller.getSnapshot().stage,1);
});
for(const [stage] of stages)for(const [action,launcher] of [['exit guide','view tour'],['explore on my own','view tour'],['hide guide','show guide']])test('App stage '+stage+' '+action+' retains its public URL and reopens its own content',t=>{
  const f=fixture(t,stage);target(f,stage);const before=f.entries.length;
  click(action);assert.doesNotMatch(render(f.scope),/<aside class="maya-guide-rail"/);
  assert.equal(f.entries.length,before);click(launcher);target(f,stage);assert.equal(f.entries.length,before);
});
test('real product/evidence exploration stays in Maya and MF1 reopen restores selected stage',t=>{
  const f=fixture(t,4);target(f,4);click('explore on my own');render(f.scope);click('CeraVe PM details');
  assert.equal(f.controller.getSnapshot().route.productId,'cerave-pm');render(f.scope);click('azelaic directions & evidence');
  assert.match(render(f.scope),/Patch test first/);click('back to product');assert.equal(f.controller.getSnapshot().route.productId,'cerave-pm');
  render(f.scope);click('view tour');target(f,4);assert.equal(f.entries.length,1);
  assert.deepEqual(f.controller.getSnapshot().route,{name:'plan',routine:'morning'});
});
test('real demo choice/use/receipt remain isolated through history, finish/replay/reset and unavailable form',async t=>{
  const f=fixture(t,2),other=fixture(t,3);target(f,2);click('decide later');await new Promise(setImmediate);
  assert.equal(f.controller.getSnapshot().view.decisions[0].choice,'deferred');render(f.scope);click('next');target(f,3);
  click('try sample receipt');assert.deepEqual(f.controller.getSnapshot().exampleReports,[]);
  render(f.scope);click('try sample start · date unknown');render(f.scope);click('try sample stop · date unknown');
  assert.deepEqual(f.controller.getSnapshot().view.actualUse,[]);assert.equal(f.controller.getSnapshot().exampleReports[0].occurredOn.state,'unknown');
  render(f.scope);click('back');assert.match(target(f,2),/reset demo to try choices/);assert.doesNotMatch(render(f.scope),/>approve product</);
  f.controller.navigate({name:'product-use',productId:'cerave-pm',routine:'morning'});assert.match(render(f.scope),/use reporting unavailable/);
  f.controller.selectStage(5);target(f,5);click('finish guide');assert.equal(f.controller.getSnapshot().guide,'exploring');
  render(f.scope);click('view tour');target(f,5);const before=f.controller.getSnapshot().exampleReports;
  click('replay guide');target(f,1);assert.deepEqual(f.controller.getSnapshot().exampleReports,before);
  f.controller.selectStage(5);render(f.scope);const old=f.controller.getPlanProps();old.session.memory.set('sample','only this demo');click('reset demo');target(f,1);
  assert.equal(old.session.isCurrent(),false);assert.equal(old.session.memory.get('sample'),undefined);
  assert.deepEqual(f.controller.getSnapshot().exampleReports,[]);assert.deepEqual(f.controller.getSnapshot().view.decisions,[]);
  assert.deepEqual(other.controller.getSnapshot().exampleReports,[]);assert.equal(other.controller.getSnapshot().stage,3);
  assert.equal(JSON.stringify(f.win.history.state).includes('sample'),false);
});
test('route retirement clears memory and captured actions/ports cannot revive a private or disposed scope',async t=>{
  const f=fixture(t,3);target(f,3);const next=button('next').onClick,old=f.controller.getPlanProps();old.session.memory.set('sample','retire');
  f.controller.reportExample('started-unknown');f.scope.navigator.navigate({name:'plan',routine:'morning'});
  assert.equal(f.scope.getSnapshot().controller,null);assert.equal(old.session.isCurrent(),false);assert.equal(old.session.memory.get('sample'),undefined);
  assert.throws(()=>next({}),{status:403});await assert.rejects(old.demoPorts.read.execute({schemaVersion:1,action:'read_client_plan_v1',version:null}),{status:403});
  assert.deepEqual(f.controller.getSnapshot().exampleReports,[]);f.flush();assert.equal(f.listenerCount(),0);assert.equal(f.win.history.scrollRestoration,'auto');
  f.scope.navigator.navigate({name:'maya',stage:4});assert.equal(f.scope.getSnapshot().controller,null);
});
test('strict setup/cleanup/setup obtains fresh lifetimes and rejects stale late choice completion',async()=>{
  const model=windowModel('/maya?stage=2'),first=api.createMayaApplicationScope(model.win),c=first.getSnapshot().controller;
  const old=c.getPlanProps(),read=await old.demoPorts.read.execute({schemaVersion:1,action:'read_client_plan_v1',version:null});first.dispose();first.dispose();
  assert.equal(model.listenerCount(),0);const second=api.createMayaApplicationScope(model.win);try{
    assert.notEqual(second.getSnapshot().controller,c);const before=second.getSnapshot().controller.getSnapshot();old.onViewChange(read);model.flush();
    assert.equal(second.getSnapshot().controller.getSnapshot(),before);assert.equal(old.session.isCurrent(),false);assert.equal(model.listenerCount(),3);
  }finally{second.dispose();}assert.equal(model.listenerCount(),0);
});
test('replacement public App lifetime on the same Window retires the old sample',()=>{
  const model=windowModel('/maya'),a=api.createMayaApplicationScope(model.win),c=a.getSnapshot().controller;
  const b=api.createMayaApplicationScope(model.win);try{assert.equal(a.getSnapshot().controller,null);assert.equal(c.getPlanProps().session.isCurrent(),false);a.dispose();assert.equal(b.getSnapshot().controller.getPlanProps().session.isCurrent(),true);}finally{a.dispose();b.dispose();}
});
test('reentrant retirement cannot reclaim a newer public App lifetime',()=>{
  const model=windowModel('/maya?stage=4'),a=api.createMayaApplicationScope(model.win);let replacement;
  a.subscribe(()=>{replacement=api.createMayaApplicationScope(model.win);});
  const superseded=api.createMayaApplicationScope(model.win);
  try{assert.equal(a.getSnapshot().controller,null);assert.equal(superseded.getSnapshot().controller,null);assert.ok(replacement.getSnapshot().controller);superseded.dispose();assert.equal(replacement.getSnapshot().controller.getSnapshot().stage,4);}finally{a.dispose();superseded.dispose();replacement?.dispose();}
  assert.equal(model.listenerCount(),0);
});
test('reentrant stage observer may replace the scope without a stale navigation continuation',t=>{
  const f=fixture(t),old=f.controller.getPlanProps();let replacement;
  f.controller.subscribe(()=>{if(f.controller.getSnapshot().stage===2&&!replacement)replacement=api.createMayaApplicationScope(f.win);});
  f.controller.next();t.after(()=>replacement?.dispose());
  assert.equal(f.scope.getSnapshot().controller,null);assert.equal(old.session.isCurrent(),false);
  assert.equal(replacement.getSnapshot().controller.getSnapshot().stage,2);assert.equal(f.win.location.search,'?stage=2');
  f.scope.dispose();assert.equal(replacement.getSnapshot().controller.getPlanProps().session.isCurrent(),true);
});
test('captured public navigation subscriptions cannot restart a retired navigator over its replacement',()=>{
  const model=windowModel('/maya'),a=api.createMayaApplicationScope(model.win),old=a.navigator;a.dispose();
  const b=api.createMayaApplicationScope(model.win),before=model.win.location.href;let stop=()=>{};
  try{stop=old.subscribe(()=>{});old.navigate({name:'maya',stage:5});assert.equal(model.win.location.href,before);assert.equal(b.getSnapshot().controller.getSnapshot().stage,1);assert.equal(model.listenerCount(),3);}finally{stop();a.dispose();b.dispose();}
});
test('all public actions run with network/cookie/storage/session-coordination traps',async t=>{
  const saved=new Map(),effects=[];const deny=name=>()=>{effects.push(name);throw Error('forbidden public effect '+name);};
  for(const name of ['fetch','XMLHttpRequest','WebSocket','localStorage','sessionStorage','indexedDB','caches','navigator']){
    saved.set(name,Object.getOwnPropertyDescriptor(globalThis,name));Object.defineProperty(globalThis,name,{configurable:true,get:name==='navigator'?()=>({locks:{request:deny('auth coordination')}}):name==='fetch'?()=>deny(name):deny(name)});
  }
  try{const f=fixture(t,2);Object.defineProperty(f.win.document,'cookie',{get:deny('cookie read'),set:deny('cookie write')});const stop=api.startPortalApplication({},f.win,(_,node)=>{api.renderToStaticMarkup(node);return()=>{};});stop();render(f.scope);click('decide later');await new Promise(setImmediate);f.controller.next();f.controller.receiveExample();f.controller.reportExample('started-unknown');f.controller.reportExample('stopped-unknown');f.controller.selectStage(4);f.controller.exit();f.controller.reopen();f.controller.replay();f.controller.reset();render(f.scope);f.scope.dispose();assert.deepEqual(effects,[]);}finally{for(const [name,descriptor] of saved)if(descriptor)Object.defineProperty(globalThis,name,descriptor);else delete globalThis[name];}
});
test('unknown public addresses retain their recovery and the source composition uses actual shared modules',()=>{
  for(const path of ['/unknown','/maya?stage=0','/maya?stage=6','/maya?stage=2&client=private']){
    assert.equal(api.parseRoute(path),null);assert.match(api.renderToStaticMarkup(api.createElement(api.PublicEntry,{route:null})),/check the address/);
  }
  for(const file of ['app/start.tsx','app/MayaApplication.tsx','features/walkthrough/maya/view.tsx','features/walkthrough/maya/controller.ts','features/plan/ClientPlan.tsx','ui/overlay.tsx','navigation/history.ts'])assert.ok(inputs.some(p=>p.endsWith(file)),file);
  const app=readFileSync(new URL('../src/app/MayaApplication.tsx',import.meta.url),'utf8');
  assert.match(app,/useEffect\(\(\)=>\{\s*const next=createMayaApplicationScope\(window\)/);assert.match(app,/return\(\)=>next\.dispose\(\)/);
  assert.doesNotMatch(app,/createApplicationSession|createClientPorts|createSessionTransport|localStorage|sessionStorage|fetch\(/);
});
