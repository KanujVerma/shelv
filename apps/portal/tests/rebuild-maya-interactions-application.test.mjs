// Actual public App/controller/shared SSR callbacks over the canonical navigator
// and a finite Window model. No mounted React, DOM or browser claim.
import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {sourceModule} from './rebuild-maya-five-stage-build.mjs';
const require=createRequire(import.meta.url),jsx=require('react/jsx-runtime'),original={jsx:jsx.jsx,jsxs:jsx.jsxs};
let buttons=[],fields=[],forms=[];
const text=v=>typeof v==='string'||typeof v==='number'?String(v):Array.isArray(v)?v.map(text).join(''):v?.props?text(v.props.children):'';
for(const key of ['jsx','jsxs'])jsx[key]=(type,props,...rest)=>{
  if(type==='button')buttons.push({label:text(props.children),props});
  if(type==='form')forms.push(props);
  if(typeof type==='function'&&type.name==='Field')fields.push(props);
  return original[key](type,props,...rest);
};
after(()=>Object.assign(jsx,original));
const {exports:api}=await sourceModule('tests/rebuild-maya-application-ssr.ts');
function windowModel(path){
  const entries=[{path,state:null}],events=new Map(),frames=[];let index=0;
  const location={href:'https://portal.invalid'+path,pathname:'',search:''};
  const setPath=p=>{const u=new URL(p,'https://portal.invalid');Object.assign(location,{href:u.href,pathname:u.pathname,search:u.search});};setPath(path);
  const win={location,scrollY:0,document:{activeElement:null,getElementById:()=>null,querySelector:()=>null},scrollTo(){},requestAnimationFrame:fn=>frames.push(fn),
    addEventListener(n,fn){if(!events.has(n))events.set(n,new Set());events.get(n).add(fn);},removeEventListener(n,fn){events.get(n)?.delete(fn);},
    history:{scrollRestoration:'auto',get state(){return entries[index].state;},replaceState(state,_,path){entries[index]={path,state};setPath(path);},pushState(state,_,path){entries.splice(++index);entries[index]={path,state};setPath(path);},back(){this.go(-1);},go(delta){assert.ok(entries[index+delta]);index+=delta;setPath(entries[index].path);for(const fn of [...events.get('popstate')??[]])fn();}},
  };
  return {win,entries,events,flush(){while(frames.length)frames.shift()();}};
}
function fixture(t,stage=3){const m=windowModel(api.buildRoute({name:'maya',stage})),scope=api.createMayaApplicationScope(m.win);t.after(scope.dispose);return {...m,scope,c:scope.getSnapshot().controller};}
function render(f){buttons=[];fields=[];forms=[];return api.renderMayaApplication(f.scope);}
function button(label){const b=buttons.filter(b=>b.label===label);assert.equal(b.length,1,label);assert.equal(b[0].props['data-slot'],'button');return b[0].props;}
function click(f,label){render(f);const b=button(label);assert.equal(!!b.disabled,false);b.onClick({defaultPrevented:false,preventDefault(){this.defaultPrevented=true;},stopPropagation(){}});}
function edit(f,label,value){render(f);const p=fields.find(f=>f.label===label).children.props;(p.onValueChange??(v=>p.onChange({target:{value:v}})))(value);}
function submit(f){render(f);assert.equal(forms.length,1);forms[0].onSubmit({preventDefault(){}});}
const path=f=>f.win.location.pathname+f.win.location.search;

test('actual public App shared use and post-follow-up choices survive canonical Back/Forward without real writes',t=>{
  const f=fixture(t,3);click(f,'try sample use form');click(f,'yes');edit(f,'what changed?','started_earlier');edit(f,'when did this happen?','unknown');edit(f,'how did you get it?','self');submit(f);
  assert.equal(f.c.getSnapshot().view.use.planProducts.find(s=>s.product.productId==='ordinary-azelaic-10').state,'using');
  assert.deepEqual(f.c.getSnapshot().view.actualUse,[]);assert.equal(f.c.getPlanProps().ports,undefined);assert.equal(path(f),'/maya?stage=3');
  click(f,'next');assert.match(render(f),/sample follow-up/);click(f,'back');click(f,'back');assert.equal(path(f),'/maya?stage=2');
  for(const [label,want] of [['approve product','approved'],['decide later','deferred'],['decline','declined']]){click(f,label);assert.equal(f.c.getSnapshot().view.decisions[0].choice,want);assert.match(render(f),/demo choice updated/);}
  const memory=structuredClone(f.c.getSnapshot().exampleReports);f.win.history.go(-1);assert.equal(f.c.getSnapshot().stage,3);f.win.history.go(1);assert.equal(f.c.getSnapshot().stage,2);assert.deepEqual(f.c.getSnapshot().exampleReports,memory);
  for(const stage of [4,5]){f.c.selectStage(stage);click(f,'exit guide');click(f,'view tour');assert.equal(f.c.getSnapshot().stage,stage);assert.match(render(f),stage===4?/sample follow-up/:/a plan with follow-through/);}
  click(f,'replay guide');assert.equal(path(f),'/maya');assert.deepEqual(f.c.getSnapshot().exampleReports,memory);click(f,'reset demo');assert.deepEqual(f.c.getSnapshot().exampleReports,[]);assert.deepEqual(f.c.getSnapshot().view.decisions,[]);
  assert.equal(JSON.stringify(f.win.history.state).includes('self'),false);f.flush();
});
test('actual public scope retains unsent form input in memory and rejects old callbacks on replacement',t=>{
  const f=fixture(t,3);f.c.navigate({name:'product',productId:'cerave-pm',routine:'evening'});f.c.navigate({name:'product-use',productId:'cerave-pm',routine:'evening'});
  click(f,'yes');edit(f,'what changed?','different');edit(f,'how are you using it differently?','unsent sample only');click(f,'back to product');
  f.c.navigate({name:'product-use',productId:'cerave-pm',routine:'evening'});render(f);assert.equal(fields.find(f=>f.label==='how are you using it differently?').children.props.value,'unsent sample only');
  const oldSubmit=forms[0].onSubmit,old=f.c.getPlanProps();const replacement=api.createMayaApplicationScope(f.win);t.after(replacement.dispose);
  const newController=replacement.getSnapshot().controller,before=newController.getSnapshot();oldSubmit({preventDefault(){}});old.onViewChange(old.view);
  assert.equal(old.session.isCurrent(),false);assert.equal(newController.getSnapshot(),before);assert.deepEqual(newController.getSnapshot().exampleReports,[]);assert.equal(f.scope.getSnapshot().controller,null);
});
test('actual public route departure disposes submitted and unsent memory without touching another Window',t=>{
  const f=fixture(t,3),other=fixture(t,4);click(f,'try sample use form');click(f,'yes');edit(f,'what changed?','started_earlier');edit(f,'when did this happen?','unknown');submit(f);
  const old=f.c.getPlanProps(),otherBefore=other.c.getSnapshot();f.scope.navigator.navigate({name:'plan',routine:'morning'});
  assert.equal(f.scope.getSnapshot().controller,null);assert.equal(old.session.isCurrent(),false);assert.deepEqual(f.c.getSnapshot().exampleReports,[]);assert.equal(other.c.getSnapshot(),otherBefore);
  assert.throws(()=>old.demoInteractions.use.report({}),{status:403});f.flush();
});
