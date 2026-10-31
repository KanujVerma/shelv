import { buildRoute, parseRoute, parentRoute } from "../navigation/routes.ts";
import { restoreNavigationContext } from "../navigation/history.ts";
import type { PlanRoute } from "../features/plan/types.ts";
const planNames = new Set([
  "plan",
  "recommendation",
  "product",
  "product-evidence",
]);
import type { PortalNavigator } from "../navigation/history.ts";
/** The canonical navigator writes only its normal safe route/restore markers.
 * The opaque entry ID indexes plan cursors in session memory; no preview data
 * or internal product/evidence route is added to browser history or the URL. */
export function createBrowserPreviewNavigation(
  win: Window,
  navigator: PortalNavigator,
  draftId: string,
  isCurrent: () => boolean = () => true,
) {
  type Entry = { route: PlanRoute; depth: number };
  const outer = { name: "advisor-preview" as const, draftId };
  let initialParent = navigator.backDestination();
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
    },
    entryId = id(),
    version = 0;
  entries.set(entryId, entry);
  const isOuter = () => {
    const route = parseRoute(win.location.pathname + win.location.search);
    return route?.name === "advisor-preview" && route.draftId === draftId;
  };
  function emit(resetContext = false) {
    const token = ++version;
    listeners.forEach((fn) => fn());
    // The canonical navigator captures and restores every history traversal.
    // Only a local fallback with no traversal needs its own fresh context.
    if (resetContext)
      win.requestAnimationFrame(() => {
        if (token === version && listeners.size && isCurrent() && isOuter())
          restoreNavigationContext(
            { scrollY: 0, focusKey: null },
            win.document,
            win,
          );
      });
  }
  function pop() {
    if (!isCurrent() || !isOuter()) return;
    entryId = id();
    entry = entries.get(entryId) ?? {
      route: { name: "plan", routine: "morning" },
      depth: 0,
    };
    entries.set(entryId, entry);
    emit();
  }
  return {
    getSnapshot: () => {
      const current = id();
      if (isOuter() && current !== entryId) {
        entryId = current;
        const known = entries.get(current);
        if (known) entry = known;
        else {
          initialParent = navigator.backDestination();
          entry = {
            route: { name: "plan", routine: "morning" },
            depth: 0,
          };
          entries.set(current, entry);
        }
      }
      return entry.route;
    },
    subscribe(fn: () => void) {
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
      const route = parseRoute(buildRoute(input));
      if (!route || !planNames.has(route.name))
        throw Error("invalid_preview_route");
      const depth = entry.depth + 1;
      navigator.navigate(outer);
      entryId = id();
      entry = {
        route: route as PlanRoute,
        depth,
      };
      entries.set(entryId, entry);
      emit();
    },
    backDestination(): PlanRoute {
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
      if (entry.depth > 0) {
        navigator.back();
      } else {
        entry = {
          route: parentRoute(entry.route) as PlanRoute,
          depth: 0,
        };
        entries.set(entryId, entry);
        emit(true);
      }
    },
    exit() {
      if (
        initialParent.name === "advisor-editor" &&
        initialParent.draftId === draftId
      )
        win.history.go(-(entry.depth + 1));
      else
        navigator.navigate(
          { name: "advisor-editor", draftId, section: "sources" },
          { replace: true },
        );
    },
    dispose() {
      entry = {
        route: { name: "plan", routine: "morning" },
        depth: 0,
      };
      version++;
      win.removeEventListener("popstate", pop);
      listeners.clear();
      entries.clear();
    },
  };
}
