import {buildRoute, parseRoute, parentRoute} from './routes.ts';
import type {PortalRoute} from './routes.ts';

export interface NavigationRestore {scrollY: number; focusKey: string | null}
interface Marker {version: 1; scopeKey: string; entryId: string; predecessor: {entryId: string; path: string} | null; restore: NavigationRestore}
const safeKey=(v: unknown): v is string=>typeof v==='string' && /^[a-zA-Z0-9_:.-]{1,160}$/.test(v);
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
  let sequence=0,listening=false,restorationVersion=0;
  const currentPath=()=>win.location.pathname+win.location.search;
  let snapshot=currentPath();
  const makeMarker=(predecessor: Marker['predecessor']=null): Marker=>({version:1,scopeKey,entryId:`${scopeKey}:${Date.now()}:${++sequence}`,predecessor,restore:{scrollY:0,focusKey:null}});
  function start() {
    if (!marker(win.history.state,scopeKey)) win.history.replaceState({shelvNavigation:makeMarker()},'',currentPath());
    if (!listening) {win.addEventListener('popstate',pop);listening=true;}
    snapshot=currentPath();
  }
  function emit() {snapshot=currentPath();listeners.forEach(fn=>fn());}
  function pop() {
    emit();const saved=marker(win.history.state,scopeKey),version=++restorationVersion;
    win.requestAnimationFrame(()=>{if(version===restorationVersion)restoreNavigationContext(saved?.restore ?? {scrollY:0,focusKey:null},win.document,win);});
  }
  function navigate(route: PortalRoute, {replace=false}: {replace?: boolean}={}) {
    start();
    const path=buildRoute(route),current=marker(win.history.state,scopeKey) ?? makeMarker();
    const activeId=win.document.activeElement?.id;
    current.restore={scrollY:Math.max(0,win.scrollY),focusKey:safeKey(activeId)?activeId:null};
    win.history.replaceState({shelvNavigation:current},'',currentPath());
    const next=makeMarker(replace ? current.predecessor : {entryId:current.entryId,path:currentPath()});
    win.history[replace?'replaceState':'pushState']({shelvNavigation:next},'',path);emit();
    const version=++restorationVersion;
    win.requestAnimationFrame(()=>{if(version===restorationVersion)restoreNavigationContext(next.restore,win.document,win);});
  }
  return {
    navigate,
    back() {
      start();
      const saved=marker(win.history.state,scopeKey);
      if (saved?.predecessor) {win.history.back();return;}
      const current=parseRoute(currentPath());
      navigate(current ? parentRoute(current) : {name:'plan',routine:'morning'},{replace:true});
    },
    getSnapshot:()=>snapshot,
    subscribe(listener: ()=>void) {start();listeners.add(listener);return()=>{listeners.delete(listener);if(!listeners.size){win.removeEventListener('popstate',pop);listening=false;}};},
    dispose() {win.removeEventListener('popstate',pop);listening=false;restorationVersion++;listeners.clear();},
  };
}
export type PortalNavigator = ReturnType<typeof createPortalNavigator>;
