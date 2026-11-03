import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {prepareSelfPurchase,selfPurchaseAcquisition} from '../src/features/plan/useEntry.ts';
const portal=new URL('../',import.meta.url);
const require=createRequire(new URL('package.json',portal));
const {build}=require('esbuild'),runtime=require('react/jsx-runtime'),original={jsx:runtime.jsx,jsxs:runtime.jsxs};
const {carePlan}=await import(new URL('tests/rebuild/care-fixture.mjs',portal));
let buttons=[],controls=[],textareas=[],render;
const text=value=>typeof value==='string'||typeof value==='number'?String(value):Array.isArray(value)?value.map(text).join(''):value?.props?text(value.props.children):'';
before(async()=>{
 for(const name of ['jsx','jsxs'])runtime[name]=(type,props,...rest)=>{if(type==='button')buttons.push({label:text(props.children),props});if(Array.isArray(props?.options))controls.push(props);if(type==='textarea')textareas.push(props);return original[name](type,props,...rest);};
 const result=await build({stdin:{contents:`
 import {createElement as h} from 'react';import {renderToStaticMarkup} from 'react-dom/server';
 import {ClientPlan} from './src/features/plan/ClientPlan.tsx';import {NavigationProvider} from './src/navigation/react.tsx';import {OverlayProvider} from './src/ui/overlay.tsx';import {buildRoute} from './src/navigation/routes.ts';
 export function render(props){const nav={getSnapshot:()=>buildRoute(props.navigation.route),subscribe:()=>()=>{},navigate:props.navigation.navigate,back:props.navigation.back,backDestination:()=>null};return renderToStaticMarkup(h(NavigationProvider,{navigator:nav},h(OverlayProvider,null,h(ClientPlan,props))));}`,loader:'tsx',resolveDir:portal.pathname},bundle:true,write:false,format:'cjs',platform:'node',packages:'external',loader:{'.css':'empty'},tsconfig:new URL('tsconfig.frontend.json',portal).pathname,plugins:process.env.W3_SELF_PURCHASE_OLD==='1'?[{name:'exact-pre-change-files',setup(builder){builder.onLoad({filter:/\/(?:ClientPlan|UseReport)\.tsx$/},args=>{const file=path.relative(new URL('../../',portal).pathname,args.path);const contents=execFileSync('git',['show','96bfe2428d32eacdef5f4c9e184af7b5ef39a95e:'+file],{cwd:new URL('../../',portal),encoding:'utf8'});return{contents,loader:'tsx',resolveDir:path.dirname(args.path)};});}}]:[]});
 const module={exports:{}};new Function('require','module','exports',result.outputFiles[0].text)(require,module,module.exports);render=module.exports.render;
});
after(()=>{Object.assign(runtime,original);});
// Real JSX elements and native callbacks are observed and returned unchanged.
// This checks the actual shared Select input, not hydrated Radix DOM or focus.
test('self-purchase passes self acquisition to the actual shared form without any operation',()=>{
 const view=carePlan(),memory=new Map(),operations=[],calls=[],navigation={route:{name:'recommendation',decisionId:'maya-card-treatments',routine:'morning'},navigate(route){this.route=route;},back(){}};
 const props={view,mode:'client',navigation,session:{key:'w3-source-test',isCurrent:()=>true,subscribeInvalidation:()=>()=>{},memory:{get:key=>memory.get(key),set:(key,value)=>memory.set(key,value),delete:key=>memory.delete(key)}},ports:{read:{execute:command=>operations.push(command)},decision:{execute:command=>operations.push(command)},care:{execute:command=>operations.push(command)}},onViewChange(){},onSelfPurchase(productId,decisionId){calls.push({productId,decisionId});navigation.route={name:'product-use',productId,routine:'morning'};}};
 buttons=[];render(props);const action=buttons.find(button=>button.label==='i’ll buy it myself');assert.ok(action);action.props.onClick({preventDefault(){},stopPropagation(){}});
 assert.deepEqual(calls,[{productId:'ordinary-azelaic-10',decisionId:'maya-card-treatments'}]);assert.deepEqual(operations,[]);
 buttons=[];controls=[];const html=render(props);const acquisition=controls.find(control=>control.options.some(option=>option.value==='self'));
 assert.ok(acquisition,'the actual shared acquisition Select is present');assert.equal(acquisition.value,'self','the selected acquisition reaches the shared Select');assert.match(html,/The Ordinary Azelaic Acid Suspension 10%/);assert.deepEqual(operations,[]);
});

function fixture(){
 const view=carePlan(),memory=new Map(),operations=[],calls=[];
 const navigation={route:{name:'recommendation',decisionId:'maya-card-treatments',routine:'morning'},navigate(route){this.route=route;},back(){}};
 let live=true;
 const props={view,mode:'client',navigation,session:{key:'w3-entry-test',isCurrent:()=>live,subscribeInvalidation:()=>()=>{},memory:{get:key=>memory.get(key),set:(key,value)=>memory.set(key,value),delete:key=>memory.delete(key)}},ports:{read:{execute:command=>operations.push(command)},decision:{execute:command=>operations.push(command)},care:{execute:command=>operations.push(command)}},onViewChange(){},onSelfPurchase(productId,decisionId){calls.push({productId,decisionId});navigation.route={name:'product-use',productId,routine:'morning'};}};
 return {props,memory,operations,calls,end(){live=false;memory.clear();}};
}
function show(props){buttons=[];controls=[];textareas=[];return render(props);}
function acquisition(){return controls.find(control=>control.options.some(option=>option.value==='self'));}
function chooseSelf(props){show(props);const button=buttons.find(button=>button.label==='i’ll buy it myself');assert.ok(button);button.props.onClick({preventDefault(){},stopPropagation(){}});}

test('an unsent actual-use form survives a later self-purchase entry unchanged',()=>{
 const f=fixture(),props=f.props;props.navigation.route={name:'product-use',productId:'ordinary-azelaic-10',routine:'morning'};
 show(props);controls.find(control=>control.options.some(option=>option.value==='different')).onValueChange('different');
 show(props);assert.equal(textareas.length,1);textareas[0].onChange({target:{value:'retained actual use note'}});
 const original=f.memory.get('care-use:w3-entry-test:ordinary-azelaic-10');assert.equal(original.form.details,'retained actual use note');
 props.navigation.route={name:'recommendation',decisionId:'maya-card-treatments',routine:'morning'};chooseSelf(props);
 assert.equal(f.memory.get('care-use:w3-entry-test:ordinary-azelaic-10'),original);
 show(props);assert.equal(acquisition().value,'unknown');assert.equal(textareas[0].value,'retained actual use note');assert.deepEqual(f.operations,[]);
});

test('entry is bound to the exact product and publication',()=>{
 const f=fixture(),props=f.props;assert.equal(prepareSelfPurchase(props,'ordinary-azelaic-10','maya-card-treatments'),true);
 const treatment=props.view.use.planProducts.find(row=>row.product.productId==='ordinary-azelaic-10').product;
 assert.equal(selfPurchaseAcquisition(props,treatment),'self');
 assert.equal(selfPurchaseAcquisition(props,props.view.use.planProducts.find(row=>row.product.productId==='cerave-pm').product),null);
 assert.equal(selfPurchaseAcquisition(props,{...treatment,publication:{...treatment.publication,version:2}}),null);
 assert.equal(selfPurchaseAcquisition(props,{...treatment,publication:{...treatment.publication,documentSchemaVersion:2}}),null);
 const next=structuredClone(props.view);next.plan.version=2;next.use.planProducts.forEach(row=>row.product.publication.version=2);props.view=next;
 assert.equal(selfPurchaseAcquisition(props,{...treatment,publication:{...treatment.publication,version:2}}),null);
 assert.deepEqual(f.operations,[]);
});

for(const mode of ['advisor-preview','historical','private-walkthrough','public-demo'])test(mode+' cannot stage a live self-purchase entry',()=>{
 const f=fixture();f.props.mode=mode;assert.equal(prepareSelfPurchase(f.props,'ordinary-azelaic-10','maya-card-treatments'),false);assert.equal(f.memory.size,0);assert.deepEqual(f.operations,[]);
});

test('read-only, mismatched decisions and a retired session do not seed or navigate',()=>{
 const f=fixture();f.props.view.access='read_only';assert.equal(prepareSelfPurchase(f.props,'ordinary-azelaic-10','maya-card-treatments'),false);
 f.props.view.access='active';assert.equal(prepareSelfPurchase(f.props,'cerave-pm','maya-card-treatments'),false);assert.equal(prepareSelfPurchase(f.props,'ordinary-azelaic-10','unknown'),false);assert.equal(f.memory.size,0);
 show(f.props);const captured=buttons.find(button=>button.label==='i’ll buy it myself').props.onClick;f.end();captured({preventDefault(){},stopPropagation(){}});
 assert.equal(f.memory.size,0);assert.deepEqual(f.calls,[]);assert.deepEqual(f.operations,[]);
});

test('retirement during a navigation-memory read cannot return the old acquisition',()=>{
 const f=fixture(),props=f.props;assert.equal(prepareSelfPurchase(props,'ordinary-azelaic-10','maya-card-treatments'),true);
 const product=props.view.use.planProducts.find(row=>row.product.productId==='ordinary-azelaic-10').product;
 const read=props.session.memory.get;props.session.memory.get=key=>{const entry=read(key);f.end();return entry;};
 assert.equal(selfPurchaseAcquisition(props,product),null);
});
