import { buildRoute, parseRoute, parentRoute } from "../navigation/routes.ts";
import { restoreNavigationContext } from "../navigation/history.ts";
import type { PlanRoute } from "../features/plan/types.ts";
import type { PortalRoute } from "../navigation/routes.ts";
const planNames = new Set([
  "plan",
  "recommendation",
  "product",
  "product-evidence",
]);
import type { PortalNavigationCore } from "../navigation/react.tsx";
/** The canonical navigator writes only its normal safe route/restore markers.
 * The opaque entry ID indexes plan cursors in session memory; no preview data
 * or internal product/evidence route is added to browser history or the URL. */
export function createBrowserPreviewNavigation(
  win: Window,
  navigator: PortalNavigationCore,
  draftId: string,
  isCurrent: () => boolean = () => true,
) {
  return createBrowserPlanNavigation(win, navigator, {name:'advisor-preview',draftId}, isCurrent);
}
export function createBrowserHistoricalNavigation(
  win: Window, navigator: PortalNavigationCore, version: number, isCurrent: () => boolean,
) {
  return createBrowserPlanNavigation(win, navigator, {name:'history-version',version:String(version)}, isCurrent);
}
function createBrowserPlanNavigation(
  win: Window,
  navigator: PortalNavigationCore,
  outer: {name:'advisor-preview';draftId:string}|{name:'history-version';version:string},
  isCurrent: () => boolean,
) {
  type Opener = {parent:PortalRoute;predecessor:string|null};
  type Entry = { route: PlanRoute; depth: number; opener:Opener };
  const opener = ():Opener => {
    const predecessor=(win.history.state as {shelvNavigation?:{predecessor?:{entryId?:unknown}}}|null)?.shelvNavigation?.predecessor?.entryId;
    return {parent:navigator.backDestination(),predecessor:typeof predecessor==='string'?predecessor:null};
  };
  const entries = new Map<string, Entry>(),
    listeners = new Set<() => void>();
  const id = () => {
    const value = (
      win.history.state as { shelvNavigation?: { entryId?: unknown } } | null
    )?.shelvNavigation?.entryId;
    return typeof value === "string" ? value : "";
  };
  let entry: Entry = {
      route: { name: "plan", routine: "morning" },
      depth: 0,
      opener:opener(),
    },
    entryId = id(),
    version = 0,
    disposed = false;
  const live = () => !disposed && isCurrent();
  entries.set(entryId, entry);
  const isOuter = () => {
    const route = parseRoute(win.location.pathname + win.location.search);
    return !!route && buildRoute(route) === buildRoute(outer);
  };
  function selectCurrentEntry() {
    if(!live()||!isOuter())return;
    const current=id();if(current===entryId)return;
    entryId=current;
    entry=entries.get(current)??{route:{name:'plan',routine:'morning'},depth:0,opener:opener()};
    entries.set(current,entry);
  }
  function emit(resetContext = false) {
    const token = ++version;
    listeners.forEach((fn) => fn());
    // The canonical navigator captures and restores every history traversal.
    // Only a local fallback with no traversal needs its own fresh context.
    if (resetContext)
      win.requestAnimationFrame(() => {
        if (token === version && listeners.size && live() && isOuter())
          restoreNavigationContext(
            { scrollY: 0, focusKey: null },
            win.document,
            win,
          );
      });
  }
  function pop() {
    if (!live() || !isOuter()) return;
    selectCurrentEntry();
    emit();
  }
  return {
    getSnapshot: () => {
      if (!live()) return entry.route;
      selectCurrentEntry();
      return entry.route;
    },
    subscribe(fn: () => void) {
      if (!live()) return () => {};
      selectCurrentEntry();
      if (!listeners.size) win.addEventListener("popstate", pop);
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
        if (!listeners.size) {
          version++;
          win.removeEventListener("popstate", pop);
        }
      };
    },
    navigate(input: PlanRoute) {
      if (!live()) return;
      selectCurrentEntry();
      const route = parseRoute(buildRoute(input));
      if (!route || !planNames.has(route.name))
        throw Error("invalid_preview_route");
      const previous=entry,depth = previous.depth + 1;
      navigator.navigate(outer);
      entryId = id();
      entry = {
        route: route as PlanRoute,
        depth,
        opener:previous.opener,
      };
      entries.set(entryId, entry);
      emit();
    },
    backDestination(): PlanRoute {
      selectCurrentEntry();
      if (entry.depth > 0) {
        const predecessor = (
          win.history.state as {
            shelvNavigation?: { predecessor?: { entryId?: string } };
          } | null
        )?.shelvNavigation?.predecessor?.entryId;
        const previous = predecessor ? entries.get(predecessor) : null;
        if (previous) return previous.route;
      }
      return parentRoute(entry.route) as PlanRoute;
    },
    back() {
      if (!live()) return;
      selectCurrentEntry();
      if(outer.name==='history-version'&&entry.depth===0){navigator.back();return;}
      if (entry.depth > 0) {
        navigator.back();
      } else {
        entry = {
          route: parentRoute(entry.route) as PlanRoute,
          depth: 0,
          opener:entry.opener,
        };
        entries.set(entryId, entry);
        emit(true);
      }
    },
    exit() {
      if (!live()) return;
      selectCurrentEntry();
      const {parent,predecessor}=entry.opener;
      if (outer.name === 'history-version') {
        if(predecessor&&parent.name.startsWith('history'))win.history.go(-(entry.depth+1));
        else navigator.navigate({name:'history'},{replace:true});
        return;
      }
      if (
        parent.name === "advisor-editor" &&
        parent.draftId === outer.draftId
      )
        win.history.go(-(entry.depth + 1));
      else
        navigator.navigate(
          { name: "advisor-editor", draftId:outer.draftId, section: "sources" },
          { replace: true },
        );
    },
    dispose() {
      disposed = true;
      entry = {
        route: { name: "plan", routine: "morning" },
        depth: 0,
        opener:entry.opener,
      };
      version++;
      win.removeEventListener("popstate", pop);
      listeners.clear();
      entries.clear();
    },
  };
}
