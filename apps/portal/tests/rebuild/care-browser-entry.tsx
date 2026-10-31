import React,{useState,useSyncExternalStore} from 'react';
import {createRoot} from 'react-dom/client';
import {ClientPlan} from '../../src/features/plan/index.ts';
import {createApplicationSession} from '../../src/app/session.ts';
import {createClientCarePort} from '../../src/app/care-ports.ts';
import {createClientPlanController} from '../../src/app/client-state.ts';
import {createClientPorts} from '../../src/app/ports.ts';
import {createPortalNavigator} from '../../src/navigation/history.ts';
import {NavigationProvider} from '../../src/navigation/react.tsx';
import {OverlayProvider,StatusNotice,Badge} from '../../src/ui/index.ts';
import {PortalShell} from '../../src/shell/PortalShell.tsx';
import '../../src/ui/foundation.css';import '../../src/shell/shell.css';
const runtime=createApplicationSession({audience:'client'});await runtime.restore();
const h=window.__careHarness={runtime,applied:[],navigator:createPortalNavigator(window,{scopeKey:runtime.getSnapshot().boundary.key})};
const ports={...createClientPorts(runtime),care:createClientCarePort(runtime)};
const initial=await ports.care.execute({schemaVersion:1,action:'read_client_plan_v2',version:null});
const controller=createClientPlanController(runtime.getSnapshot().boundary,ports);controller.accept(initial);
function App(){const {view}=useSyncExternalStore(controller.subscribe,controller.getSnapshot,controller.getSnapshot),[mode,setMode]=useState('client'),[careEnabled,setCareEnabled]=useState(true);h.setView=v=>controller.accept(v);h.setMode=setMode;h.setCareEnabled=setCareEnabled;if(!view||!runtime.getSnapshot().boundary)return <StatusNotice title="session changed">sign in again to view your plan.</StatusNotice>;return <NavigationProvider navigator={h.navigator}><OverlayProvider><PortalShell identity="Maya" mode={mode} status={<Badge className="shelv-mode-badge">synthetic test</Badge>} contact={{onContact:()=>{},availability:'service'}}><ClientPlan view={view} mode={mode} session={runtime.getSnapshot().boundary} ports={careEnabled?ports:{read:ports.read,decision:ports.decision}} onViewChange={v=>{h.applied.push(v);controller.accept(v);}}/></PortalShell></OverlayProvider></NavigationProvider>;}
createRoot(document.getElementById('root')).render(<React.StrictMode><App/></React.StrictMode>);
