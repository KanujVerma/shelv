import {useEffect,useState,useSyncExternalStore} from 'react';
import {createPortalNavigator} from '../navigation/history.ts';
import {NavigationProvider} from '../navigation/react.tsx';
import type {PortalNavigationCore} from '../navigation/react.tsx';
import {parseRoute} from '../navigation/routes.ts';
import {createMayaDemoController} from '../features/walkthrough/maya/controller.ts';
import {MayaWalkthrough} from '../features/walkthrough/maya/view.tsx';
import type {MayaStageNumber} from '../features/walkthrough/maya/model.ts';
import {PageHeader} from '../shell/PortalShell.tsx';
import {StatusNotice} from '../ui/index.ts';

const scopeBrand:unique symbol=Symbol('public-maya-application');
const owners=new WeakMap<Window,{dispose():void}>();

/** Public-route lifetime only. The existing controller owns all plan exploration
 * and sample data; the canonical navigator owns the five public stage URLs.
 * Neither session authority nor private plan routes enter this scope. */
export function createMayaApplicationScope(win:Window) {
  const initial=parseRoute(win.location.pathname+win.location.search);
  if(initial?.name!=='maya')throw new TypeError('Maya requires its public route');
  const navigator=createPortalNavigator(win,{scopeKey:'public-maya:'+crypto.randomUUID()});
  const controller=createMayaDemoController({initialStage:initial.stage});
  const listeners=new Set<()=>void>();
  const active=Object.freeze({controller});
  const ended=Object.freeze({controller:null});
  let disposed=false,snapshot:typeof active|typeof ended=active;
  let stopNavigation=()=>{},stopController=()=>{};
  function dispose() {
    if(disposed)return;
    disposed=true;
    snapshot=ended;
    if(owners.get(win)===scope)owners.delete(win);
    stopNavigation();
    stopController();
    navigator.dispose();
    controller.dispose();
    for(const fn of [...listeners]){try{fn();}catch{/* Local observers cannot retain the sample. */}}
    listeners.clear();
  }
  function currentRoute() {
    const path=win.location.pathname+win.location.search;
    const route=parseRoute(path);
    return navigator.getSnapshot()===path&&route?.name==='maya'?route:null;
  }
  stopNavigation=navigator.subscribe(()=>{
    if(disposed)return;
    const route=currentRoute();
    if(!route){dispose();return;}
    if(controller.getSnapshot().stage!==route.stage)controller.selectStage(route.stage);
  });
  stopController=controller.subscribe(()=>{
    if(disposed)return;
    const route=currentRoute();
    if(!route){dispose();return;}
    const stage=controller.getSnapshot().stage;
    if(route.stage!==stage)navigator.navigate({name:'maya',stage});
  });
  // Canonical subscribe deliberately supports StrictMode re-subscription. Bind
  // the exposed core to this App lifetime so a retired handle cannot restart
  // that navigator over a newer sample. All live operations still delegate.
  const navigation=Object.freeze({
    getSnapshot:navigator.getSnapshot,
    subscribe(listener){return disposed?()=>{}:navigator.subscribe(listener);},
    navigate(route,options){if(!disposed)navigator.navigate(route,options);},
    back(){if(!disposed)navigator.back();},
    backDestination(){return disposed?{name:'maya',stage:1}:navigator.backDestination();},
  } satisfies PortalNavigationCore);
  const scope=Object.freeze({
    [scopeBrand]:true as const,
    navigator:navigation,
    getSnapshot:()=>snapshot,
    subscribe(fn:()=>void){if(disposed)return()=>{};listeners.add(fn);return()=>{listeners.delete(fn);};},
    dispose,
  });
  const prior=owners.get(win);
  owners.set(win,scope);
  prior?.dispose();
  return scope;
}
export type MayaApplicationScope=ReturnType<typeof createMayaApplicationScope>;

/** This is also the actual shared-renderer SSR seam. OverlayProvider is supplied
 * by the existing main mount, exactly as for the connected application. */
export function MayaApplicationContent({scope}:{scope:MayaApplicationScope}) {
  const state=useSyncExternalStore(scope.subscribe,scope.getSnapshot,scope.getSnapshot);
  return state.controller?<NavigationProvider navigator={scope.navigator}>
    <MayaWalkthrough controller={state.controller}/>
  </NavigationProvider>:<StatusNotice title="page unavailable"/>;
}

export function MayaApplication({stage}:{stage:MayaStageNumber}) {
  const [scope,setScope]=useState<MayaApplicationScope|null>(null);
  // Create only after commit. StrictMode's setup/cleanup/setup receives a fresh
  // controller and navigator, never a memoized controller disposed by cleanup.
  useEffect(()=>{
    const next=createMayaApplicationScope(window);
    setScope(next);
    return()=>next.dispose();
  },[]);
  return scope?<MayaApplicationContent scope={scope}/>:<main className="app-entry">
    <span className="shelv-wordmark">shelv</span>
    <PageHeader title="Maya · fictional demo"/>
    <StatusNotice tone="loading" title={`loading sample · stage ${stage} of 5`}/>
  </main>;
}
