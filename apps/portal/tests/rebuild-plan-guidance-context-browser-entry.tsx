// Synthetic context inputs only; uses the actual session/raw ports/controller and renderer.
// A fresh explicit serial Chrome grant remains required.
import React,{useState,useSyncExternalStore,useCallback} from 'react';
import {createRoot} from 'react-dom/client';
import {ClientPlan,UnpublishedPlanPreview,createClientGuidancePort} from '../src/features/plan/index.ts';
import type {PlanPreview} from '../../../src/contracts/PortalRebuildMapping.ts';
import type {PlanRoute} from '../src/features/plan/types.ts';
import {parseRoute} from '../src/navigation/routes.ts';
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
const createReview=()=>createClientGuidancePort({request:createClientReviewRequest(runtime),session,mode:'client'});
const harness={runtime,controller,navigator,applied:[] as ClientPlanReadView[],ports,previewCalls:0,callbackIds:[] as number[],replaceReviewSource:()=>{},replaceViewCallback:()=>{},setCallbackEnabled:(_value:boolean)=>{},rerender:()=>{},setUnpublished:(_value:boolean)=>{},setReviewEnabled:(_value:boolean)=>{},setView:(view:ClientPlanReadView)=>controller.accept(view),setMode:(_mode:PresentationMode)=>{}};
Object.assign(window,{__guidanceHarness:harness});
function App(){const {view}=useSyncExternalStore(controller.subscribe,controller.getSnapshot,controller.getSnapshot),[mode,setMode]=useState<PresentationMode>((window as Window&{__guidanceInitialMode?:PresentationMode}).__guidanceInitialMode??'client'),[unpublished,setUnpublished]=useState(false),[reviewEnabled,setReviewEnabled]=useState((window as Window&{__guidanceInitialReviewEnabled?:boolean}).__guidanceInitialReviewEnabled??true);const [reviewSource,setReviewSource]=useState(ports.review),[callbackRevision,setCallbackRevision]=useState(0),[callbackEnabled,setCallbackEnabled]=useState(true),[,rerender]=useState(0);const apply=useCallback((fetched:ClientPlanReadView)=>{harness.callbackIds.push(callbackRevision);harness.applied.push(fetched);controller.accept(fetched);},[callbackRevision]);harness.replaceReviewSource=()=>setReviewSource(createReview());harness.replaceViewCallback=()=>setCallbackRevision(n=>n+1);harness.setCallbackEnabled=setCallbackEnabled;harness.rerender=()=>rerender(n=>n+1);harness.setMode=setMode;harness.setUnpublished=setUnpublished;harness.setReviewEnabled=setReviewEnabled;
 const currentPath=useSyncExternalStore(navigator.subscribe,navigator.getSnapshot,navigator.getSnapshot);
 if(!view)return <StatusNotice title="session changed">sign in again to view your plan.</StatusNotice>;
 const route=(parseRoute(currentPath)??{name:'plan',routine:'morning'}) as PlanRoute;
 const preview:PlanPreview={mode:'advisor-preview',published:false,target:null,content:view.plan!.content,issues:[]};
 const malicious={mode:'client' as const,kind:'published',view,ports,demoPorts:{...ports,mode:'public-demo' as const},onViewChange:()=>harness.previewCalls++,onRecordUse:()=>harness.previewCalls++,onExport:()=>harness.previewCalls++,onSendUpdate:()=>harness.previewCalls++,onHistory:()=>harness.previewCalls++,onSelfPurchase:()=>harness.previewCalls++};
 return <NavigationProvider navigator={navigator}><OverlayProvider><PortalShell identity="Maya" mode={mode} status={<Badge>synthetic source test</Badge>} contact={{onContact:()=>{},availability:'service'}}>{unpublished?<UnpublishedPlanPreview preview={preview} source={{draftId:'33333333-3333-4333-8333-000000000999',contentRevision:1,assignmentRevision:0,target:null}} session={session!} navigation={{route,navigate:r=>navigator.navigate(r),back:()=>navigator.back(),backDestination:()=>navigator.backDestination() as PlanRoute|null}} {...malicious}/>:<ClientPlan view={view} session={session!} mode={mode} ports={{...ports,review:reviewEnabled?reviewSource:undefined}} onViewChange={callbackEnabled?apply:undefined}/>}</PortalShell></OverlayProvider></NavigationProvider>;
}
const element=document.getElementById('root');if(!element)throw Error('root required');createRoot(element).render(<React.StrictMode><App/></React.StrictMode>);
