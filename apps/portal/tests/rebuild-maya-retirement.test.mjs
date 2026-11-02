import test from 'node:test';
import assert from 'node:assert/strict';
import {sourceModule} from './rebuild-maya-five-stage-build.mjs';

const {exports:demo}=await sourceModule('tests/rebuild-maya-five-stage-ssr.ts');
const {exports:app}=await sourceModule('tests/rebuild-maya-application-ssr.ts');
function populated(){
  const c=demo.createMayaDemoController({initialStage:3});
  c.reportExample('started-unknown');
  const session=c.getPlanProps().session;
  session.memory.set('unsent','synthetic visitor draft');
  return {c,session};
}
function summary(c){const s=c.getSnapshot();return {stage:s.stage,guide:s.guide,reports:s.exampleReports.length,revision:s.view.use?.revision??0};}
const emptyEnded={stage:1,guide:'exited',reports:0,revision:0};

test('ordinary disposal clears sample state and retires exact session memory',()=>{
  const {c,session}=populated();
  c.dispose();c.dispose();
  assert.deepEqual(summary(c),emptyEnded);
  assert.equal(session.isCurrent(),false);
  assert.equal(session.memory.get('unsent'),undefined);
  assert.doesNotMatch(demo.renderMaya(c),/1 sample use report/);
});

test('throwing invalidation observers see cleared state and cannot skip later cleanup or observers',()=>{
  const {c,session}=populated(),observed=[];
  session.subscribeInvalidation(()=>{observed.push({state:summary(c),current:session.isCurrent(),memory:session.memory.get('unsent')});throw Error('synthetic observer failure');});
  session.subscribeInvalidation(()=>observed.push({second:true,state:summary(c)}));
  assert.doesNotThrow(()=>c.dispose());
  assert.deepEqual(observed,[{state:emptyEnded,current:false,memory:undefined},{second:true,state:emptyEnded}]);
  assert.deepEqual(summary(c),emptyEnded);
  assert.doesNotThrow(()=>c.dispose());
  assert.equal(observed.length,2);
  assert.doesNotMatch(demo.renderMaya(c),/1 sample use report/);
});

test('reset publishes the fresh context before invalidation callbacks even when one throws',()=>{
  const {c,session}=populated(),observed=[];
  session.subscribeInvalidation(()=>{observed.push(summary(c));throw Error('synthetic reset observer failure');});
  session.subscribeInvalidation(()=>observed.push(summary(c)));
  assert.doesNotThrow(()=>c.reset());
  const expected={stage:1,guide:'open',reports:0,revision:0};
  assert.deepEqual(observed,[expected,expected]);
  assert.equal(session.isCurrent(),false);
  assert.equal(session.memory.get('unsent'),undefined);
  assert.equal(c.getPlanProps().session.isCurrent(),true);
  c.dispose();
});

test('reentrant disposal during reset cannot republish retired reports or a ready lease',()=>{
  const {c,session}=populated();
  session.subscribeInvalidation(()=>c.dispose());
  assert.doesNotThrow(()=>c.reset());
  assert.deepEqual(summary(c),emptyEnded);
  assert.equal(c.getPlanProps().session.isCurrent(),false);
});

test('a deliberate action on the fresh reset context survives the old observer handoff',()=>{
  const {c,session}=populated();
  session.subscribeInvalidation(()=>c.reportExample('started-known'));
  c.reset();
  assert.equal(session.isCurrent(),false);
  assert.equal(c.getPlanProps().session.isCurrent(),true);
  assert.equal(c.getSnapshot().exampleReports.length,1);
  assert.deepEqual(c.getSnapshot().exampleReports[0].occurredOn,{state:'known',value:'2026-11-03'});
  c.dispose();
});

function windowModel(){
  const events=new Map(),frames=[];
  const location={href:'',pathname:'',search:''};
  const setPath=value=>{const u=new URL(value,'https://portal.invalid');Object.assign(location,{href:u.href,pathname:u.pathname,search:u.search});};
  setPath(app.buildRoute({name:'maya',stage:3}));
  let state=null;
  const win={location,scrollY:0,document:{activeElement:null,getElementById:()=>null,querySelector:()=>null},scrollTo(){},
    requestAnimationFrame(fn){frames.push(fn);return frames.length;},
    addEventListener(name,fn){if(!events.has(name))events.set(name,new Set());events.get(name).add(fn);},
    removeEventListener(name,fn){events.get(name)?.delete(fn);},
    history:{scrollRestoration:'auto',get state(){return state;},replaceState(next,_,value){state=next;setPath(value);},pushState(next,_,value){state=next;setPath(value);},back(){}},
  };
  return {win,count:()=>[...events.values()].reduce((n,x)=>n+x.size,0),flush(){while(frames.length)frames.shift()();}};
}
test('actual App replacement completes and returns a usable scope after a local observer throws',()=>{
  const model=windowModel(),first=app.createMayaApplicationScope(model.win);
  const old=first.getSnapshot().controller;
  old.reportExample('started-unknown');
  const session=old.getPlanProps().session;
  session.subscribeInvalidation(()=>{throw Error('synthetic replacement observer failure');});
  let replacement;
  try{
    assert.doesNotThrow(()=>{replacement=app.createMayaApplicationScope(model.win);});
    assert.equal(first.getSnapshot().controller,null);
    assert.equal(session.isCurrent(),false);
    assert.deepEqual(summary(old),emptyEnded);
    assert.equal(replacement.getSnapshot().controller.getPlanProps().session.isCurrent(),true);
    assert.match(app.renderMayaApplication(replacement),/fictional staged sample/);
  }finally{
    replacement?.dispose();
    first.dispose();
    model.flush();
  }
  assert.equal(model.count(),0);
});
