import {buildRoute, parseRoute, parentRoute} from './routes.ts';
import type {PortalRoute} from './routes.ts';

export interface NavigationRestore {scrollY: number; focusKey: string | null}
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
): void {
  const target=(value.focusKey && safeKey(value.focusKey) ? doc.getElementById(value.focusKey) : null) ?? doc.querySelector<HTMLElement>('[data-page-heading]');
  if (target instanceof Object && 'focus' in target) (target as HTMLElement).focus({preventScroll:true});
  viewport.scrollTo({top:Math.max(0,value.scrollY),left:0,behavior:'instant'});
}
/** History contains navigation metadata only. Drafts and answers belong to session memory. */
export function createPortalNavigator(win: Window, {scopeKey}: {scopeKey: string}) {
  if (!safeKey(scopeKey)) throw new TypeError('invalid navigation scope');
  const listeners=new Set<()=>void>();
  const contexts=new Map<string,NavigationRestore>(),owner={};
  let sequence=0,listening=false,restorationVersion=0,restoring=false,current: Marker|null=null;
  const currentPath=()=>win.location.pathname+win.location.search;
  let snapshot=currentPath();
  const makeMarker=(predecessor: Marker['predecessor']=null): Marker=>({version:1,scopeKey,entryId:`${scopeKey}:${Date.now()}:${++sequence}`,predecessor,restore:{scrollY:0,focusKey:null}});
  function start() {
    if (listening) return;
    current=marker(win.history.state,scopeKey) ?? makeMarker();
    win.history.replaceState({shelvNavigation:current},'',currentPath());
    const previous=scrollOwners.get(win)?.previous ?? win.history.scrollRestoration;
    scrollOwners.set(win,{owner,previous});win.history.scrollRestoration='manual';
    win.addEventListener('popstate',pop);win.addEventListener('scroll',capture,{passive:true});win.addEventListener('focusin',capture);listening=true;
    snapshot=currentPath();
  }
  function capture() {
    if (!current || restoring || scrollOwners.get(win)?.owner!==owner) return;
    const activeId=win.document.activeElement?.id;
    current.restore={scrollY:Math.max(0,win.scrollY),focusKey:safeKey(activeId)?activeId:null};
    contexts.set(current.entryId,current.restore);
    // At popstate the URL/state already belongs to the destination, while the
    // DOM/viewport still belongs to the outgoing entry. Keep that in memory.
    if (marker(win.history.state,scopeKey)?.entryId===current.entryId)
      win.history.replaceState({shelvNavigation:current},'',currentPath());
  }
  function stop() {
    capture();restorationVersion++;restoring=false;
    win.removeEventListener('popstate',pop);win.removeEventListener('scroll',capture);win.removeEventListener('focusin',capture);listening=false;
    const ownership=scrollOwners.get(win);
    if (ownership?.owner===owner) {win.history.scrollRestoration=ownership.previous;scrollOwners.delete(win);}
  }
  function emit() {snapshot=currentPath();listeners.forEach(fn=>fn());}
  function restore(saved: Marker) {
    const version=++restorationVersion;restoring=true;emit();
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
    start();
    const path=buildRoute(route);capture();
    const saved=current!;
    current=makeMarker(replace ? saved.predecessor : {entryId:saved.entryId,path:currentPath()});
    win.history[replace?'replaceState':'pushState']({shelvNavigation:current},'',path);restore(current);
  }
  return {
    navigate,
    back() {
      start();
      const saved=marker(win.history.state,scopeKey);
      if (saved?.predecessor) {capture();win.history.back();return;}
      const current=parseRoute(currentPath());
      navigate(current ? parentRoute(current) : {name:'plan',routine:'morning'},{replace:true});
    },
    getSnapshot:()=>snapshot,
    subscribe(listener: ()=>void) {start();listeners.add(listener);return()=>{listeners.delete(listener);if(!listeners.size)stop();};},
    dispose() {stop();contexts.clear();listeners.clear();},
  };
}
export type PortalNavigator = ReturnType<typeof createPortalNavigator>;
