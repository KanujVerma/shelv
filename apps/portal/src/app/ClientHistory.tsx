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
import {createHistoryNavigation,createHistoryRestorationScope} from './client-composition.ts';
import type {ClientComposition,AppHistoryRestorationScope} from './client-composition.ts';
const noRestorationReady=()=>{};
import {createBrowserHistoricalNavigation} from './preview-navigation.ts';

export function ClientHistoryContent({connection,boundary,route,win,onSignOut}:{
  connection:ClientComposition; boundary:PlanSessionBoundary; route:PortalRoute; win?:Window; onSignOut():void;
}) {
  const {navigator}=usePortalNavigation();
  const controller=connection.history;
  const state=useSyncExternalStore(controller.subscribe,controller.getSnapshot,controller.getSnapshot);
  const entrySnapshot=()=>JSON.stringify([navigator.getSnapshot(),win?(win.history.state as {shelvNavigation?:{entryId?:unknown}}|null)?.shelvNavigation?.entryId??null:null]);
  const entry=useSyncExternalStore(navigator.subscribe,entrySnapshot,entrySnapshot);
  const filter=state.timeline?.filter??'all';
  const appScope=useMemo(()=>win?createHistoryRestorationScope({controller,boundary,navigator,win,waitForDocument:route.name==='history-version'}):null,[controller,boundary,navigator,win,entry,filter,route.name]);
  const currentScope=useRef(appScope);
  if(currentScope.current!==appScope){currentScope.current?.retire();currentScope.current=appScope;}
  useEffect(()=>appScope?.attach(),[appScope]);
  const navigation=useMemo(()=>createHistoryNavigation(navigator,appScope??undefined),[navigator,appScope]);
  const version=route.name==='history-version'?Number(route.version):null;
  const restoration=useMemo(()=>({version,onReady:appScope?.onReady??noRestorationReady}),[version,appScope]);
  useEffect(()=>{
    if(route.name==='history-new'&&controller.getSnapshot().version!==null)void controller.load(null);
  },[controller,route.name]);
  const scoped=useMemo<HistoryController>(()=>({...controller,load(selected){
    if(appScope&&!appScope.isCurrent())return Promise.resolve();
    if(selected===null && version!==null){appScope?.capturePosition();navigator.navigate({name:'history'});return Promise.resolve();}
    return controller.load(selected===undefined?version:selected);
  }}),[controller,version,navigator,appScope]);
  return <ApplicationShell audience="client" onSignOut={onSignOut} readOnly={state.view?.access!=='active'}>
    {route.name==='history-version'&&win&&state.phase!=='denied'&&state.phase!=='ended'?<HistoricalPlan key={route.version} connection={connection} boundary={boundary} version={Number(route.version)} win={win} appScope={appScope}/>:null}
    {route.name==='history-event'?<HistoryEntry controller={controller} boundary={boundary} eventId={route.eventId} appScope={appScope}/>:<ClientHistory controller={scoped} screen={route.name==='history-new'?'update':'history'} navigation={navigation} filter={filter} onFilterChange={appScope?.setFilter} restoration={route.name==='history-new'?undefined:restoration}/>}
  </ApplicationShell>;
}

function HistoryEntry({controller,boundary,eventId,appScope}:{controller:HistoryController;boundary:PlanSessionBoundary;eventId:string;appScope:AppHistoryRestorationScope|null}) {
  const {navigator}=usePortalNavigation();
  const state=useSyncExternalStore(controller.subscribe,controller.getSnapshot,controller.getSnapshot);
  const scope=useRef({controller,boundary,eventId,appScope,active:true});
  if(scope.current.controller!==controller||scope.current.boundary!==boundary||scope.current.eventId!==eventId||scope.current.appScope!==appScope)
    {scope.current.active=false;scope.current={controller,boundary,eventId,appScope,active:true};}
  const renderedScope=scope.current;
  const permitted=()=>scope.current===renderedScope&&renderedScope.active&&boundary.isCurrent()&&(!appScope||appScope.isCurrent());
  useEffect(()=>{if(scope.current===renderedScope)renderedScope.active=true;return()=>{renderedScope.active=false;};},[renderedScope]);
  useEffect(()=>{const attempt=controller.restoration?.restore(null);if(!attempt)void controller.load(null);return()=>attempt?.cancel();},[controller,eventId,appScope]);
  useEffect(()=>{const result=state.timeline?.result;if(result)appScope?.onReady(result);},[appScope,state.timeline?.result]);
  const entries=state.pages.flatMap(p=>p.entries).filter(e=>{const key=historyKey(e);return key===eventId||key.slice(key.indexOf(':')+1)===eventId;});
  const ready=state.phase==='ready';
  const writable=ready&&!state.timeline?.restoring&&!state.readError&&!state.loadingMore&&state.version===null&&state.view?.access==='active'&&state.view.currentGuidance?.mode==='current_document'&&!state.pending;
  const navigation=useMemo(()=>createHistoryNavigation(navigator,appScope??undefined),[navigator,appScope]);
  const correct=async(event:Extract<ReportIntent,{kind:'amendment'}>['original'],anchor?:import('../features/history/restoration.ts').HistoryRestorationAnchor)=>{
    if(!permitted())return;
    appScope?.capture(anchor??null);
    const token=scope.current;await controller.startAmendment(event);
    const current=controller.getSnapshot();
    if(scope.current===token&&permitted()&&current.phase==='ready'&&current.intent?.kind==='amendment'&&current.intent.original.id===event.id)navigation.openUpdate();
  };
  return <>
    <PageHeader title="history entry" action={<Button id="history-entry-back" variant="ghost" onClick={navigation.back}>back to history</Button>}/>
    {ready?<>
      <Timeline entries={entries} filter="all" labels={{}} onAmend={writable?(event,anchor)=>void correct(event,anchor):undefined} onVersion={(version,anchor)=>{if(!permitted())return;appScope?.capture(anchor??null);navigation.openVersion?.(version);}}/>
      {!entries.length?<StatusNotice title={state.pages.at(-1)?.nextCursor?'entry not in the loaded record':'history entry unavailable'}>open your history or continue through the recorded activity.</StatusNotice>:null}
      {state.readError?<StatusNotice tone="error" title="history is incomplete"/>:state.pages.at(-1)?.nextCursor?<Button id="history-entry-more" variant="secondary" busy={state.loadingMore} onClick={()=>{if(permitted())void controller.loadMore();}}>load more activity</Button>:null}
    </>:state.phase==='idle'||state.phase==='loading'?<StatusNotice tone="loading" title="loading your record"/>:<StatusNotice tone={state.phase==='denied'?'denied':'error'} title="history entry unavailable" action={<Button variant="secondary" onClick={()=>{if(permitted())void controller.load(null);}}>retry current record</Button>}/>}
    <RouteLink id="history-entry-all" route={{name:'history'}} onClick={event=>{if(!permitted()){event.preventDefault();return;}appScope?.capture(entries[0]?{kind:'entry',entryKey:historyKey(entries[0])}:null);}}>all history</RouteLink>
  </>;
}

function HistoricalPlan({connection,boundary,version,win,appScope}:{connection:ClientComposition;boundary:PlanSessionBoundary;version:number;win:Window;appScope:AppHistoryRestorationScope|null}) {
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
  const permitted=()=>boundary.isCurrent()&&(!appScope||appScope.isCurrent());
  const navigation=useMemo<PlanNavigationPort>(()=>({route,navigate:next=>{if(permitted()){appScope?.capturePosition();cursor.navigate(next);}},back:()=>{if(permitted()){appScope?.capturePosition();cursor.back();}},backDestination:cursor.backDestination}),[route,cursor,boundary,appScope]);
  return <>
    <Button id="history-version-back" variant="ghost" onClick={()=>{if(permitted()){appScope?.capturePosition();cursor.exit();}}}>back to history</Button>
    {controller?<HistoricalPlanContent controller={controller} boundary={boundary} ports={connection.ports} navigation={navigation} onCommitted={appScope?.documentCommitted}/>:<StatusNotice tone="loading" title="loading plan version"/>}
  </>;
}
export function HistoricalPlanContent({controller,boundary,ports,navigation,onCommitted}:{controller:ReturnType<ClientComposition['createVersionController']>;boundary:PlanSessionBoundary;ports:ClientComposition['ports'];navigation:PlanNavigationPort;onCommitted?:(available:boolean)=>void}) {
  const state=useSyncExternalStore(controller.subscribe,controller.getSnapshot,controller.getSnapshot);
  useEffect(()=>{if(state.view||state.error!==null)onCommitted?.(!!state.view?.plan&&state.error===null);},[state.view,state.error,onCommitted]);
  if(!state.view)return <StatusNotice tone={state.error?'error':'loading'} title={state.error?'plan version unavailable':'loading plan version'} action={state.error?<Button variant="secondary" onClick={()=>void controller.refresh()}>retry plan version</Button>:undefined}/>;
  return <ClientPlan session={boundary} mode="historical" view={state.view} ports={ports} navigation={navigation} onViewChange={controller.acceptFrom(state.view)}/>;
}
