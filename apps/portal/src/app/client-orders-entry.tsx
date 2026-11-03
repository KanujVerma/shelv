import {useEffect, useSyncExternalStore} from 'react';
import type {ReactElement} from 'react';
import type {ApplicationSession} from './session.ts';
import type {PortalNavigationCore} from '../navigation/react.tsx';
import {buildRoute, parseRoute} from '../navigation/routes.ts';
import {createClientOrdersReadController} from '../features/orders/read/controller.ts';
import {ClientOrdersView} from '../features/orders/read/ClientOrdersView.tsx';
import type {ClientOrdersReadController, ClientOrdersRoute} from '../features/orders/read/types.ts';
import {Button, StatusNotice} from '../ui/index.ts';

type EntrySnapshot=Readonly<{
  phase:'idle'|'active'|'inactive'|'ended';
  controller:ClientOrdersReadController|null;
  route:ClientOrdersRoute|null;
}>;
export type ClientOrdersEntry=Readonly<{
  getSnapshot():EntrySnapshot;
  subscribe(listener:()=>void):()=>void;
  start():Promise<void>;
  stop():void;
  dispose():void;
}>;
type EntryActions=Readonly<{
  open(rendered:EntrySnapshot,id:string):void;
  back(rendered:EntrySnapshot):void;
  retry(rendered:EntrySnapshot):void;
}>;
type Owner={retire():void};
// Local lifetime arbitration only. Neither map supplies session or order rights.
const owners=new WeakMap<PortalNavigationCore,Owner>();
// Remember the last started entry across a recoverable stop/offline interval.
// A later entry must also supersede that inactive entry's rendered callbacks.
const lifetimes=new WeakMap<PortalNavigationCore,Owner>();
const entryActions=new WeakMap<ClientOrdersEntry,EntryActions>();
const idle:EntrySnapshot=Object.freeze({phase:'idle',controller:null,route:null});
const inactive:EntrySnapshot=Object.freeze({phase:'inactive',controller:null,route:null});
const ended:EntrySnapshot=Object.freeze({phase:'ended',controller:null,route:null});

/** Creation is inert. The real read-only consumer is created and loaded only
 * after start. A route is a deny-only relevance condition, never admission. */
export function createClientOrdersEntry(runtime:ApplicationSession,navigation:PortalNavigationCore):ClientOrdersEntry{
  const boundary=runtime.getSnapshot().boundary,actor=runtime.cookie.identity?.ownerId,
    epoch=runtime.cookie._epoch,generation=runtime.cookie.generation,
    serverGeneration=runtime.cookie._view?.generation,csrf=runtime.cookie._view?.csrf;
  const listeners=new Set<()=>void>();
  let snapshot:EntrySnapshot=idle,controller:ClientOrdersReadController|null=null;
  let disposed=false,superseded=false,running=false,checking=false,sequence=0;
  let cleanups:(()=>void)[]=[],initialRead:Promise<void>|null=null;
  const owner:Owner={retire(){superseded=true;retire(ended);}};

  function cleanup(fn:()=>void){try{fn();}catch{/* Complete remaining own cleanup. */}}
  function same(){
    const cookie=runtime.cookie;
    // Normal restore replaces _view even for this unchanged session. Bind the
    // entry to actual session scalars; the controller binds each read's view.
    return !disposed&&!superseded&&boundary!==null&&runtime.getSnapshot().boundary===boundary&&
      cookie.audience==='client'&&cookie.identity?.role==='client'&&cookie.identity.ownerId===actor&&
      cookie._epoch===epoch&&cookie.generation===generation&&cookie._view?.generation===serverGeneration&&
      cookie._view?.csrf===csrf;
  }
  function lifetime(){
    if(checking||!same())return false;
    let valid=false;checking=true;
    try{valid=boundary!.isCurrent();}catch{/* An unavailable actual boundary cannot admit a view. */}
    finally{checking=false;}
    return valid&&same();
  }
  function ready(){return runtime.cookie.status==='ready'&&runtime.cookie._view?.capabilities.view===true;}
  function route():{path:string;route:ClientOrdersRoute}|null{
    const path=navigation.getSnapshot(),parsed=parseRoute(path);
    if(!parsed||(parsed.name!=='orders'&&parsed.name!=='order')||buildRoute(parsed)!==path)return null;
    const value:ClientOrdersRoute=parsed.name==='order'?{name:'order',orderId:parsed.orderId}:{name:'orders'};
    return {path,route:Object.freeze(value)};
  }
  function applicable(){
    if(!running||owners.get(navigation)!==owner||!lifetime()||!ready()||!route())return false;
    return running&&owners.get(navigation)===owner&&same()&&ready();
  }
  function emit(expected:EntrySnapshot){
    for(const listener of [...listeners]){
      if(snapshot!==expected)break;
      if(listeners.has(listener))cleanup(listener);
    }
  }
  function retire(next:EntrySnapshot){
    const old=controller,detach=cleanups,
      changed=snapshot.phase!==next.phase||snapshot.controller!==null||snapshot.route!==null;
    // Stable within one inactive state, unique after an intervening lifetime.
    // A shared singleton would let an old retry adopt a later inactive state.
    const published=changed?Object.freeze({...next}):snapshot;
    // Clear the published projection/ownership before aborts, unsubscribes or
    // observers can synchronously inspect it or start a replacement lifetime.
    sequence++;running=false;controller=null;cleanups=[];initialRead=null;snapshot=published;
    if(owners.get(navigation)===owner)owners.delete(navigation);
    if(next.phase==='ended'&&lifetimes.get(navigation)===owner)lifetimes.delete(navigation);
    for(const stop of detach)cleanup(stop);
    if(old)cleanup(()=>old.dispose());
    if(changed&&snapshot===published)emit(published);
  }
  function reconcile(){
    if(!running||checking)return;
    const token=sequence,captured=controller,currentRoute=route(),valid=applicable();
    if(token!==sequence||controller!==captured||!running)return;
    if(!valid){retire(same()?inactive:ended);return;}
    if(currentRoute&&snapshot.route&&buildRoute(snapshot.route)!==currentRoute.path){
      snapshot=Object.freeze({phase:'active',controller:captured,route:currentRoute.route});emit(snapshot);
    }
  }
  function attach(stop:()=>void,token:number){
    if(sequence===token&&running)cleanups.push(stop);else cleanup(stop);
  }
  function start():Promise<void>{
    if(running){reconcile();if(running)return initialRead??Promise.resolve();}
    if(disposed||superseded)return Promise.resolve();
    const token=++sequence;
    if(!lifetime()){
      if(sequence===token)retire(ended);
      return Promise.resolve();
    }
    if(sequence!==token)return Promise.resolve();
    // Even a first start that is temporarily offline or on another route owns
    // an inactive callback lifetime. A later entry must supersede it as well.
    const previous=lifetimes.get(navigation);lifetimes.set(navigation,owner);
    if(previous!==owner)previous?.retire();
    if(sequence!==token||lifetimes.get(navigation)!==owner||!lifetime()){
      if(sequence===token)retire(ended);
      return Promise.resolve();
    }
    const selected=route();
    if(!selected||!ready()){if(sequence===token)retire(inactive);return Promise.resolve();}
    running=true;owners.set(navigation,owner);
    if(sequence!==token||!applicable()){if(sequence===token)reconcile();return Promise.resolve();}
    attach(navigation.subscribe(reconcile),token);
    if(sequence!==token||!applicable()){if(sequence===token)reconcile();return Promise.resolve();}
    attach(runtime.subscribe(reconcile),token);
    attach(boundary!.subscribeInvalidation(reconcile),token);
    if(sequence!==token||!applicable()){if(sequence===token)reconcile();return Promise.resolve();}
    const next=createClientOrdersReadController(runtime,{isApplicable:applicable});
    if(sequence!==token||!applicable()){cleanup(()=>next.dispose());if(sequence===token)reconcile();return Promise.resolve();}
    controller=next;
    // The initial promise is installed before notifying. A reentrant start
    // shares it, and an old completion has no entry state/finally to overwrite.
    const read=Promise.resolve().then(async()=>{
      if(sequence===token&&controller===next&&applicable())await next.load();
    });
    initialRead=read;
    const currentRoute=route();
    if(sequence!==token||!currentRoute||!applicable()){if(sequence===token)reconcile();return read;}
    snapshot=Object.freeze({phase:'active',controller:next,route:currentRoute.route});emit(snapshot);
    return read;
  }
  function owns(rendered:EntrySnapshot){
    if(snapshot!==rendered||rendered.controller===null||controller!==rendered.controller||!rendered.route)return false;
    const path=buildRoute(rendered.route),valid=applicable();
    return valid&&snapshot===rendered&&controller===rendered.controller&&navigation.getSnapshot()===path&&
      running&&owners.get(navigation)===owner&&same()&&ready();
  }
  const entry:ClientOrdersEntry=Object.freeze({
    getSnapshot(){if(checking)return inactive;reconcile();return snapshot;},
    subscribe(listener:()=>void){if(disposed)return()=>{};listeners.add(listener);return()=>{listeners.delete(listener);};},
    start,
    stop(){if(!disposed&&!superseded)retire(idle);},
    dispose(){if(disposed)return;disposed=true;retire(ended);listeners.clear();},
  });
  entryActions.set(entry,Object.freeze({
    open(rendered:EntrySnapshot,id:string){
      if(!owns(rendered))return;
      const captured=rendered.controller!,state=captured.getSnapshot();
      if(state.phase!=='ready'||!state.view||state.view.purchases.filter(p=>p.id===id).length!==1)return;
      if(!owns(rendered)||captured.getSnapshot()!==state||!owns(rendered))return;
      navigation.navigate({name:'order',orderId:id});
    },
    back(rendered:EntrySnapshot){
      if(!owns(rendered)||rendered.route?.name!=='order')return;
      const destination=navigation.backDestination();
      if(!owns(rendered))return;
      // A real Orders predecessor keeps saved context. Foreign parents never
      // redirect this explicitly labelled action to clinical/account routes.
      if(destination.name==='orders')navigation.back();
      else navigation.navigate({name:'orders'});
    },
    retry(rendered:EntrySnapshot){
      if(snapshot!==rendered||disposed||superseded||!lifetime()||!ready()||!route()||snapshot!==rendered)return;
      void start();
    },
  }));
  return entry;
}

/** React composition; excluded only by the pure lifecycle test loader. */
export function ClientOrdersEntryView({entry}:{entry:ClientOrdersEntry}):ReactElement|null{
  const state=useSyncExternalStore(entry.subscribe,entry.getSnapshot,entry.getSnapshot);
  useEffect(()=>{void entry.start();return()=>entry.stop();},[entry]);
  const actions=entryActions.get(entry);
  if(state.controller&&state.route)return <ClientOrdersView controller={state.controller} route={state.route}
    onOpenPurchase={id=>actions?.open(state,id)} onBack={()=>actions?.back(state)}/>;
  if(state.phase==='inactive')return <StatusNotice tone="uncertain" title="orders are unavailable"
    action={<Button variant="secondary" onClick={()=>actions?.retry(state)}>try again</Button>}/>;
  return <StatusNotice tone={state.phase==='ended'?'denied':'loading'}
    title={state.phase==='ended'?'this orders view is closed':'loading orders'}/>;
}
