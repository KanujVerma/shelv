import {buildRoute, parseRoute, parentRoute} from './routes.ts';
import type {PortalRoute} from './routes.ts';

export interface NavigationRestore {scrollY: number; focusKey: string | null}
declare const restorationTicketBrand: unique symbol;
/** Opaque identity only; context is read from the owning live navigator. */
export interface NavigationRestorationTicket {readonly [restorationTicketBrand]: true}
export type NavigationRestorationMode = 'saved'|'fallback';
export interface DeferredNavigationRestoration {
  begin(): NavigationRestorationTicket|null;
  getSnapshot(): NavigationRestorationTicket|null;
  read(ticket: NavigationRestorationTicket): Readonly<NavigationRestore>|null;
  isCurrent(ticket: NavigationRestorationTicket): boolean;
  complete(ticket: NavigationRestorationTicket, mode: NavigationRestorationMode, isCurrent:()=>boolean): boolean;
  cancel(ticket: NavigationRestorationTicket): void;
  /** Explicit current UI action. Pending data still suppresses capture. */
  capture(): void;
}
interface Marker {version: 1; scopeKey: string; entryId: string; predecessor: {entryId: string; path: string} | null; restore: NavigationRestore}
const safeKey=(v: unknown): v is string=>typeof v==='string' && /^[a-zA-Z0-9_:.-]{1,160}$/.test(v);
// Only the active navigator may restore the window or release its original mode.
const scrollOwners=new WeakMap<Window,{owner: object; previous: ScrollRestoration}>();
function marker(state: unknown, scope: string): Marker | null {
  const v=(state as {shelvNavigation?: Marker} | null)?.shelvNavigation;
  return v?.version===1 && v.scopeKey===scope && safeKey(v.entryId) && Number.isFinite(v.restore?.scrollY) && v.restore.scrollY>=0 && (v.restore.focusKey===null || safeKey(v.restore.focusKey)) && (!v.predecessor || safeKey(v.predecessor.entryId) && !!parseRoute(v.predecessor.path)) ? v : null;
}
export function restoreNavigationContext(
  value: NavigationRestore,
  doc: Pick<Document,'getElementById'|'querySelector'>,
  viewport: Pick<Window,'scrollTo'>,
  isCurrent: ()=>boolean = ()=>true,
): void {
  if(!isCurrent())return;
  const target=(value.focusKey && safeKey(value.focusKey) ? doc.getElementById(value.focusKey) : null) ?? doc.querySelector<HTMLElement>('[data-page-heading]');
  if (target instanceof Object && 'focus' in target) (target as HTMLElement).focus({preventScroll:true});
  if(!isCurrent())return;
  viewport.scrollTo({top:Math.max(0,value.scrollY),left:0,behavior:'instant'});
}
/** History contains navigation metadata only. Drafts and answers belong to session memory. */
export function createPortalNavigator(win: Window, {scopeKey,deferRestoration}: {scopeKey: string;deferRestoration?:(route:PortalRoute)=>boolean}) {
  if (!safeKey(scopeKey)) throw new TypeError('invalid navigation scope');
  const listeners=new Set<()=>void>();
  const contexts=new Map<string,NavigationRestore>(),owner={};
  let sequence=0,listening=false,restorationVersion=0,restoring=false,preserveOnLeave=false,current: Marker|null=null,disposed=false;
  type Ticket = {token:NavigationRestorationTicket;version:number;entryId:string;path:string;marker:string;context:Readonly<NavigationRestore>;completion:number};
  let pending:Ticket|null=null;
  const currentPath=()=>win.location.pathname+win.location.search;
  let snapshot=currentPath();
  const makeMarker=(predecessor: Marker['predecessor']=null): Marker=>({version:1,scopeKey,entryId:`${scopeKey}:${Date.now()}:${++sequence}`,predecessor,restore:{scrollY:0,focusKey:null}});
  const fingerprint=(value:Marker)=>JSON.stringify(value);
  const deferred=()=>{const route=parseRoute(currentPath());return !!route&&deferRestoration?.(route)===true;};
  function valid(ticket:Ticket):boolean {
    const actual=marker(win.history.state,scopeKey);
    return pending===ticket&&listening&&!disposed&&scrollOwners.get(win)?.owner===owner&&ticket.version===restorationVersion&&current?.entryId===ticket.entryId&&currentPath()===ticket.path&&!!actual&&actual.entryId===ticket.entryId&&fingerprint(actual)===ticket.marker;
  }
  function allowed(ticket:Ticket,guard:()=>boolean):boolean {
    if(!valid(ticket))return false;
    try{if(!guard())return false;}catch{return false;}
    return valid(ticket);
  }
  function newTicket(saved:Marker,version:number) {
    const context=Object.freeze({...contexts.get(saved.entryId)??saved.restore});
    // Native traversal can capture an outgoing entry only in contexts. Preserve
    // that actual canonical value if the pending owner later unmounts/disposes.
    saved.restore={...context};contexts.set(saved.entryId,saved.restore);
    win.history.replaceState({shelvNavigation:saved},'',currentPath());
    pending={token:Object.freeze({}) as NavigationRestorationTicket,version,entryId:saved.entryId,path:currentPath(),marker:fingerprint(saved),context,completion:0};
  }
  function cancelTicket(ticket:NavigationRestorationTicket) {
    if(pending?.token!==ticket||!valid(pending))return;
    pending=null;restorationVersion++;restoring=false;preserveOnLeave=true;
  }
  function start(subscription=false) {
    if (listening) return;
    if(disposed&&!subscription)return;
    disposed=false;
    current=marker(win.history.state,scopeKey) ?? makeMarker();
    win.history.replaceState({shelvNavigation:current},'',currentPath());
    const previous=scrollOwners.get(win)?.previous ?? win.history.scrollRestoration;
    scrollOwners.set(win,{owner,previous});win.history.scrollRestoration='manual';
    win.addEventListener('popstate',pop);win.addEventListener('scroll',captureEvent,{passive:true});win.addEventListener('focusin',captureEvent);listening=true;
    snapshot=currentPath();
    if(deferred()){restoring=true;preserveOnLeave=false;newTicket(current,++restorationVersion);}
  }
  function capture(deliberate=false) {
    if (!current || restoring || !deliberate&&preserveOnLeave || scrollOwners.get(win)?.owner!==owner) return;
    preserveOnLeave=false;
    const activeId=win.document.activeElement?.id;
    current.restore={scrollY:Math.max(0,win.scrollY),focusKey:safeKey(activeId)?activeId:null};
    contexts.set(current.entryId,current.restore);
    // At popstate the URL/state already belongs to the destination, while the
    // DOM/viewport still belongs to the outgoing entry. Keep that in memory.
    if (marker(win.history.state,scopeKey)?.entryId===current.entryId)
      win.history.replaceState({shelvNavigation:current},'',currentPath());
  }
  function captureEvent(){capture(true);}
  function stop() {
    capture();restorationVersion++;pending=null;restoring=false;
    win.removeEventListener('popstate',pop);win.removeEventListener('scroll',captureEvent);win.removeEventListener('focusin',captureEvent);listening=false;
    const ownership=scrollOwners.get(win);
    if (ownership?.owner===owner) {win.history.scrollRestoration=ownership.previous;scrollOwners.delete(win);}
  }
  function emit() {snapshot=currentPath();[...listeners].forEach(fn=>fn());}
  function restore(saved: Marker) {
    const version=++restorationVersion;pending=null;restoring=true;preserveOnLeave=false;
    const path=currentPath();
    if(deferred())newTicket(saved,version);
    const ticket=pending;
    emit();
    // Subscribers may synchronously replace the route, owner or ticket.
    if(version!==restorationVersion||!listening||scrollOwners.get(win)?.owner!==owner||currentPath()!==path||marker(win.history.state,scopeKey)?.entryId!==saved.entryId)return;
    if(ticket)return;
    win.requestAnimationFrame(()=>{
      if(version!==restorationVersion || !listening || scrollOwners.get(win)?.owner!==owner || marker(win.history.state,scopeKey)?.entryId!==saved.entryId) return;
      restoreNavigationContext(contexts.get(saved.entryId) ?? saved.restore,win.document,win);restoring=false;
    });
  }
  function pop() {
    capture();current=marker(win.history.state,scopeKey) ?? makeMarker();
    // Foreign-session entries receive fresh context and no predecessor.
    win.history.replaceState({shelvNavigation:current},'',currentPath());restore(current);
  }
  function navigate(route: PortalRoute, {replace=false}: {replace?: boolean}={}) {
    if(disposed)return;
    start();
    if(!listening||scrollOwners.get(win)?.owner!==owner)return;
    const path=buildRoute(route);capture();
    const saved=current!;
    current=makeMarker(replace ? saved.predecessor : {entryId:saved.entryId,path:currentPath()});
    win.history[replace?'replaceState':'pushState']({shelvNavigation:current},'',path);restore(current);
  }
  function backTarget(): {route:PortalRoute;predecessor:boolean} {
    const saved=marker(win.history.state,scopeKey);
    if(saved?.predecessor) return {route:parseRoute(saved.predecessor.path)!,predecessor:true};
    const route=parseRoute(currentPath());
    return {route:route?parentRoute(route):{name:'plan',routine:'morning'},predecessor:false};
  }
  return {
    restoration: {
      begin(){
        if(!listening||disposed||scrollOwners.get(win)?.owner!==owner||!deferred())return null;
        if(pending&&valid(pending))return pending.token;
        const actual=marker(win.history.state,scopeKey);
        if(!actual||current?.entryId!==actual.entryId)return null;
        const version=++restorationVersion;restoring=true;preserveOnLeave=false;newTicket(actual,version);
        const ticket=pending as Ticket|null;emit();
        return ticket&&valid(ticket)?ticket.token:null;
      },
      getSnapshot:()=>pending&&valid(pending)?pending.token:null,
      read(ticket){return pending?.token===ticket&&valid(pending)?pending.context:null;},
      isCurrent(ticket){return pending?.token===ticket&&valid(pending);},
      complete(ticket,mode,guard){
        if(mode!=='saved'&&mode!=='fallback')throw new TypeError('invalid restoration mode');
        const captured=pending;
        if(!captured||captured.token!==ticket||!allowed(captured,guard))return false;
        const completion=++captured.completion;
        win.requestAnimationFrame(()=>{
          if(!valid(captured)||captured.completion!==completion)return;
          // A replacement App source may already be waiting on this same entry.
          // Retire this work, not the entry-owned ticket or its saved context.
          if(!allowed(captured,guard))return;
          restoreNavigationContext(mode==='saved'?captured.context:{scrollY:0,focusKey:null},win.document,win,()=>captured.completion===completion&&allowed(captured,guard));
          if(captured.completion===completion&&allowed(captured,guard)){pending=null;restoring=false;preserveOnLeave=false;}
        });
        return true;
      },
      cancel:cancelTicket,
      capture(){if(listening&&!disposed&&scrollOwners.get(win)?.owner===owner&&currentPath()===snapshot&&marker(win.history.state,scopeKey)?.entryId===current?.entryId)capture(true);},
    } satisfies DeferredNavigationRestoration,
    navigate,
    /** Predict Back without starting navigation, mutating history or restoring focus. */
    backDestination:()=>backTarget().route,
    back() {
      if(disposed)return;
      start();
      if(!listening||scrollOwners.get(win)?.owner!==owner)return;
      const destination=backTarget();
      if (destination.predecessor) {capture();win.history.back();return;}
      navigate(destination.route,{replace:true});
    },
    getSnapshot:()=>snapshot,
    subscribe(listener: ()=>void) {
      start(true);let active=true;const subscription=()=>{if(active)listener();};listeners.add(subscription);
      return()=>{if(!active)return;active=false;listeners.delete(subscription);if(!listeners.size)stop();};
    },
    dispose() {stop();disposed=true;contexts.clear();listeners.clear();},
  };
}
export type PortalNavigator = ReturnType<typeof createPortalNavigator>;
