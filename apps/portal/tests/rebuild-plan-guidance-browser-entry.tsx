// Prepared source only. A later fresh coordinator grant is required for Chrome.
import React,{useState,useSyncExternalStore} from 'react';
import {createRoot} from 'react-dom/client';
import {ClientPlan,createClientGuidancePort} from '../src/features/plan/index.ts';
import type {ClientPlanReadView} from '../src/features/plan/types.ts';
import type {PresentationMode} from '../src/navigation/routes.ts';
import {createApplicationSession} from '../src/app/session.ts';
import {createClientReviewRequest} from '../src/app/review-request.ts';
import {createClientPlanController} from '../src/app/client-state.ts';
import {createClientPorts} from '../src/app/ports.ts';
import {createPortalNavigator} from '../src/navigation/history.ts';
import {NavigationProvider} from '../src/navigation/react.tsx';
import {OverlayProvider,StatusNotice,Badge} from '../src/ui/index.ts';
import {PortalShell} from '../src/shell/PortalShell.tsx';
import '../src/ui/foundation.css';import '../src/shell/shell.css';
const runtime=createApplicationSession({audience:'client'});await runtime.restore();
const session=runtime.getSnapshot().boundary;if(!session)throw Error('synthetic session required');
const ports={...createClientPorts(runtime,{care:true}),review:createClientGuidancePort({request:createClientReviewRequest(runtime),session,mode:'client'})};
const controller=createClientPlanController(session,ports,{readVersion:3});await controller.refresh();
const navigator=createPortalNavigator(window,{scopeKey:session.key});
const harness={runtime,controller,navigator,applied:[] as ClientPlanReadView[],setView:(view:ClientPlanReadView)=>controller.accept(view),setMode:(_mode:PresentationMode)=>{}};
Object.assign(window,{__guidanceHarness:harness});
function App(){const {view}=useSyncExternalStore(controller.subscribe,controller.getSnapshot,controller.getSnapshot),[mode,setMode]=useState<PresentationMode>('client');harness.setMode=setMode;
 if(!view)return <StatusNotice title="session changed">sign in again to view your plan.</StatusNotice>;
 return <NavigationProvider navigator={navigator}><OverlayProvider><PortalShell identity="Maya" mode={mode} status={<Badge>synthetic source test</Badge>} contact={{onContact:()=>{},availability:'service'}}><ClientPlan view={view} session={session!} mode={mode} ports={ports} onViewChange={fetched=>{harness.applied.push(fetched);controller.accept(fetched);}}/></PortalShell></OverlayProvider></NavigationProvider>;
}
const element=document.getElementById('root');if(!element)throw Error('root required');createRoot(element).render(<React.StrictMode><App/></React.StrictMode>);
