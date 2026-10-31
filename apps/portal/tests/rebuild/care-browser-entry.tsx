import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import {ClientPlan} from '../../src/features/plan/index.ts';
import {createApplicationSession} from '../../src/app/session.ts';
import {createClientCarePort} from '../../src/app/care-ports.ts';
import {createClientPorts} from '../../src/app/ports.ts';
import {createPortalNavigator} from '../../src/navigation/history.ts';
import {NavigationProvider} from '../../src/navigation/react.tsx';
import {OverlayProvider} from '../../src/ui/index.ts';
import {PortalShell} from '../../src/shell/PortalShell.tsx';
import '../../src/ui/foundation.css';import '../../src/shell/shell.css';
const runtime=createApplicationSession({audience:'client'});await runtime.restore();
const h=window.__careHarness={runtime,applied:[],navigator:createPortalNavigator(window,{scopeKey:runtime.getSnapshot().boundary.key})};
const ports={...createClientPorts(runtime),care:createClientCarePort(runtime)};
const initial=await ports.care.execute({schemaVersion:1,action:'read_client_plan_v2',version:null});
function App(){const [view,setView]=useState(initial),[mode,setMode]=useState('client');h.setView=setView;h.setMode=setMode;return <NavigationProvider navigator={h.navigator}><OverlayProvider><PortalShell identity="Maya" mode={mode} contact={{onContact:()=>{},availability:'service'}}><ClientPlan view={view} mode={mode} session={runtime.getSnapshot().boundary} ports={ports} onViewChange={v=>{h.applied.push(v);setView(v);}}/></PortalShell></OverlayProvider></NavigationProvider>;}
createRoot(document.getElementById('root')).render(<React.StrictMode><App/></React.StrictMode>);
