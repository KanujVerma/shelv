import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import {ClientPlan} from '../../src/features/plan/index.ts';
import {OverlayProvider} from '../../src/ui/index.ts';
import {NavigationProvider} from '../../src/navigation/react.tsx';
import {createPortalNavigator} from '../../src/navigation/history.ts';
import {PortalShell} from '../../src/shell/PortalShell.tsx';
import '../../src/ui/foundation.css';
import '../../src/shell/shell.css';
import {mayaPlan} from './plan-fixture.mjs';

const harness=window.__planHarness={calls:[],reads:[],network:[],current:true,status:0,delay:false,mode:'client',memory:new Map(),listeners:new Set()};
let view=mayaPlan(),pending;
let demoView=mayaPlan();
const demoPorts={mode:'public-demo',read:{async execute(){return structuredClone(demoView);}},decision:{async execute(command){harness.demoCalls=(harness.demoCalls??0)+1;demoView={...demoView,decisionRevision:demoView.decisionRevision+1,decisions:[{decisionId:command.decisionId,choice:command.choice,reason:command.reason}]};}}};
const navigator=createPortalNavigator(window,{scopeKey:'synthetic-owner:1'});
const session={key:'synthetic-owner:1',isCurrent:()=>harness.current,memory:{get:key=>harness.memory.get(key),set:(key,value)=>harness.memory.set(key,value),delete:key=>harness.memory.delete(key)},subscribeInvalidation:fn=>{harness.listeners.add(fn);return()=>harness.listeners.delete(fn);}};
const ports={read:{async execute(command){harness.reads.push(command);if(harness.readStatus)throw {status:harness.readStatus};const result=structuredClone(harness.readView??view);if(harness.readDelay)await new Promise(resolve=>harness.resolveRead=()=>{resolve();return new Promise(done=>setTimeout(done,30));});return result;}},decision:{async execute(command){harness.calls.push(structuredClone(command));if(harness.delay)await new Promise(resolve=>pending=resolve);if(harness.status)throw {status:harness.status};view={...view,decisionRevision:view.decisionRevision+1,decisions:[...view.decisions.filter(d=>d.decisionId!==command.decisionId),{decisionId:command.decisionId,choice:command.choice,reason:command.reason}]};}}};
harness.navigator=navigator;harness.applied=[];harness.getView=()=>structuredClone(view);
function App(){const [state,setState]=useState({view,mode:'client',epoch:1,demo:false,scoped:false,planRoute:{name:'plan',routine:'morning'}});harness.set=(next)=>{view=next.view??view;setState(s=>({...s,...next,view}));};harness.resolve=()=>pending?.();harness.invalidate=()=>{harness.current=false;harness.memory.clear();harness.listeners.forEach(fn=>fn());};harness.replace=()=>{harness.current=true;harness.memory.clear();setState(s=>({...s,epoch:s.epoch+1,view:mayaPlan()}));};
return <NavigationProvider navigator={navigator}><OverlayProvider><PortalShell identity="Maya" mode={state.mode} contact={{onContact:()=>{},availability:'service'}}><ClientPlan key={state.epoch} view={state.view} mode={state.mode} session={session} navigation={state.scoped?{route:state.planRoute,navigate:route=>setState(s=>({...s,planRoute:route})),back:()=>setState(s=>({...s,planRoute:{name:'plan',routine:'morning'}}))}:undefined} ports={ports} demoPorts={state.demo?demoPorts:undefined} onViewChange={next=>{harness.applied.push(structuredClone(next));view=next;setState(s=>({...s,view:next}));}} onRecordUse={productId=>{harness.useProduct=productId;}} onSelfPurchase={(productId,decisionId)=>{harness.purchaseContext={productId,decisionId};}} onExport={()=>{harness.exported=true;}} /></PortalShell></OverlayProvider></NavigationProvider>;}
createRoot(document.getElementById('root')).render(<React.StrictMode><App/></React.StrictMode>);
