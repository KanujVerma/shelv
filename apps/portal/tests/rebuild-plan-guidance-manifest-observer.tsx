// Included only by the audited budget observer build, inside the existing provider.
import {useLayoutEffect} from 'react';
import {useGuidance} from '../src/features/plan/Guidance.tsx';
import {usePortalNavigation} from '../src/navigation/react.tsx';
import {createManifestObservation} from './rebuild-plan-guidance-manifest-observation.ts';
import type {ClientPlanReadView,PlanSessionBoundary} from '../src/features/plan/types.ts';
type Harness={controller:{getSnapshot():{view:ClientPlanReadView|null}};runtime:{getSnapshot():{boundary:PlanSessionBoundary|null}};navigator:{getSnapshot():string}};
const stores=new WeakMap<Harness,ReturnType<typeof createManifestObservation>>();
function storeFor(harness:Harness){
 let store=stores.get(harness);if(!store){store=createManifestObservation(()=>({view:harness.controller.getSnapshot().view,session:harness.runtime.getSnapshot().boundary,scope:harness.navigator.getSnapshot()}),summary=>console.debug('W3_MANIFEST_OBSERVATION '+JSON.stringify(summary)));stores.set(harness,store);Object.defineProperty(harness,'manifestObservation',{get:()=>store!.read(),enumerable:false,configurable:false});}return store;
}
export function ManifestObservationDescendant(){
 const context=useGuidance(),{path}=usePortalNavigation();
 useLayoutEffect(()=>{
  const harness=(window as Window&{__guidanceHarness?:Harness}).__guidanceHarness;if(!context||!harness)return;
  const store=storeFor(harness),stop=store.commit(context,path);
  const clicked=(event:MouseEvent)=>{const target=event.target;if(target instanceof Element&&target.closest('button')?.textContent==='published guidance & details')console.debug('W3_MANIFEST_CLICK '+JSON.stringify(Object.freeze({...store.read(),eventAtMs:performance.now()})));};
  document.addEventListener('click',clicked,{capture:true});return()=>{document.removeEventListener('click',clicked,{capture:true});stop();};
 },[context?.hydrator,context?.props.view,context?.props.session,context?.props.mode,context?.props.view.currentGuidance?.snapshot,path]);
 return null;
}
