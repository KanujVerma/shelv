import {useEffect, useMemo, useRef, useState, useSyncExternalStore} from 'react';
import type {PortalRoute} from '../navigation/routes.ts';
import {RouteLink, usePortalNavigation} from '../navigation/react.tsx';
import type {PlanNavigationPort, PlanSessionBoundary} from '../features/plan/types.ts';
import type {HistoryController, ReportIntent} from '../features/history/types.ts';
import {ClientHistory} from '../features/history/History.tsx';
import {Timeline} from '../features/history/Timeline.tsx';
import {historyKey} from '../features/history/model.ts';
import {ClientPlan} from '../features/plan/ClientPlan.tsx';
import {Button, StatusNotice} from '../ui/index.ts';
import {PageHeader} from '../shell/PortalShell.tsx';
import {ApplicationShell} from './Shell.tsx';
import {createHistoryNavigation} from './client-composition.ts';
import type {ClientComposition} from './client-composition.ts';
import {createBrowserHistoricalNavigation} from './preview-navigation.ts';

export function ClientHistoryContent({connection,boundary,route,win,onSignOut}:{
  connection:ClientComposition; boundary:PlanSessionBoundary; route:PortalRoute; win?:Window; onSignOut():void;
}) {
  const {navigator}=usePortalNavigation();
  const controller=connection.history;
  const state=useSyncExternalStore(controller.subscribe,controller.getSnapshot,controller.getSnapshot);
  const navigation=useMemo(()=>createHistoryNavigation(navigator),[navigator]);
  const version=route.name==='history-version'?Number(route.version):null;
  useEffect(()=>{
    if(route.name==='history-new'&&controller.getSnapshot().version!==null)void controller.load(null);
  },[controller,route.name]);
  const scoped=useMemo<HistoryController>(()=>({...controller,load(selected){
    if(selected===null && version!==null){navigator.navigate({name:'history'});return Promise.resolve();}
    return controller.load(selected===undefined?version:selected);
  }}),[controller,version,navigator]);
  return <ApplicationShell audience="client" onSignOut={onSignOut} readOnly={state.view?.access!=='active'}>
    {route.name==='history-version'&&win&&state.phase!=='denied'&&state.phase!=='ended'?<HistoricalPlan key={route.version} connection={connection} boundary={boundary} version={Number(route.version)} win={win}/>:null}
    {route.name==='history-event'?<HistoryEntry controller={controller} boundary={boundary} eventId={route.eventId}/>:<ClientHistory controller={scoped} screen={route.name==='history-new'?'update':'history'} navigation={navigation}/>}
  </ApplicationShell>;
}

function HistoryEntry({controller,boundary,eventId}:{controller:HistoryController;boundary:PlanSessionBoundary;eventId:string}) {
  const {navigator}=usePortalNavigation();
  const state=useSyncExternalStore(controller.subscribe,controller.getSnapshot,controller.getSnapshot);
  const scope=useRef<object>({});
  useEffect(()=>{scope.current={};void controller.load(null);return()=>{scope.current={};};},[controller,eventId]);
  const entries=state.pages.flatMap(p=>p.entries).filter(e=>{const key=historyKey(e);return key===eventId||key.slice(key.indexOf(':')+1)===eventId;});
  const ready=state.phase==='ready';
  const writable=ready&&!state.readError&&!state.loadingMore&&state.version===null&&state.view?.access==='active'&&state.view.currentGuidance?.mode==='current_document'&&!state.pending;
  const correct=async(event:Extract<ReportIntent,{kind:'amendment'}>['original'])=>{
    const token=scope.current;await controller.startAmendment(event);
    const current=controller.getSnapshot();
    if(scope.current===token&&boundary.isCurrent()&&current.phase==='ready'&&current.intent?.kind==='amendment'&&current.intent.original.id===event.id)navigator.navigate({name:'history-new'});
  };
  return <>
    <PageHeader title="history entry" action={<Button id="history-entry-back" variant="ghost" onClick={()=>navigator.back()}>back to history</Button>}/>
    {ready?<>
      <Timeline entries={entries} filter="all" labels={{}} onAmend={writable?event=>void correct(event):undefined} onVersion={createHistoryNavigation(navigator).openVersion}/>
      {!entries.length?<StatusNotice title={state.pages.at(-1)?.nextCursor?'entry not in the loaded record':'history entry unavailable'}>open your history or continue through the recorded activity.</StatusNotice>:null}
      {state.readError?<StatusNotice tone="error" title="history is incomplete"/>:state.pages.at(-1)?.nextCursor?<Button id="history-entry-more" variant="secondary" busy={state.loadingMore} onClick={()=>void controller.loadMore()}>load more activity</Button>:null}
    </>:state.phase==='idle'||state.phase==='loading'?<StatusNotice tone="loading" title="loading your record"/>:<StatusNotice tone={state.phase==='denied'?'denied':'error'} title="history entry unavailable" action={<Button variant="secondary" onClick={()=>void controller.load(null)}>retry current record</Button>}/>}
    <RouteLink id="history-entry-all" route={{name:'history'}}>all history</RouteLink>
  </>;
}

function HistoricalPlan({connection,boundary,version,win}:{connection:ClientComposition;boundary:PlanSessionBoundary;version:number;win:Window}) {
  const {navigator}=usePortalNavigation();
  const [controller,setController]=useState<ReturnType<ClientComposition['createVersionController']>|null>(null);
  useEffect(()=>{const c=connection.createVersionController(version);setController(c);void c.refresh();return()=>c.dispose();},[connection,version]);
  const cursor=useMemo(()=>{
    const key='history-navigation:'+version;
    const prior=boundary.memory.get<ReturnType<typeof createBrowserHistoricalNavigation>>(key);
    if(prior)return prior;
    const next=createBrowserHistoricalNavigation(win,navigator,version,()=>boundary.isCurrent());
    boundary.subscribeInvalidation(()=>next.dispose());boundary.memory.set(key,next);return next;
  },[win,navigator,version,boundary]);
  const route=useSyncExternalStore(cursor.subscribe,cursor.getSnapshot,cursor.getSnapshot);
  const navigation:PlanNavigationPort={route,navigate:cursor.navigate,back:cursor.back,backDestination:cursor.backDestination};
  return <>
    <Button id="history-version-back" variant="ghost" onClick={()=>cursor.exit()}>back to history</Button>
    {controller?<HistoricalPlanContent controller={controller} boundary={boundary} ports={connection.ports} navigation={navigation}/>:<StatusNotice tone="loading" title="loading plan version"/>}
  </>;
}
export function HistoricalPlanContent({controller,boundary,ports,navigation}:{controller:ReturnType<ClientComposition['createVersionController']>;boundary:PlanSessionBoundary;ports:ClientComposition['ports'];navigation:PlanNavigationPort}) {
  const state=useSyncExternalStore(controller.subscribe,controller.getSnapshot,controller.getSnapshot);
  if(!state.view)return <StatusNotice tone={state.error?'error':'loading'} title={state.error?'plan version unavailable':'loading plan version'} action={state.error?<Button variant="secondary" onClick={()=>void controller.refresh()}>retry plan version</Button>:undefined}/>;
  return <ClientPlan session={boundary} mode="historical" view={state.view} ports={ports} navigation={navigation} onViewChange={controller.acceptFrom(state.view)}/>;
}
