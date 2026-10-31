import type { ApplicationSession } from './session.ts';
import { TransportError } from '../transport/session.ts';
import type { OperationPort } from '../transport/session.ts';
import { createClientPorts } from './ports.ts';
import { createClientReviewRequest } from './review-request.ts';
import { createClientPlanController } from './client-state.ts';
import { createClientGuidancePort } from '../features/plan/guidancePort.ts';
import { createHistoryController } from '../features/history/controller.ts';
import { createHistoryPort } from '../features/history/port.ts';
import type { PortalNavigator } from '../navigation/history.ts';
import type { HistoryNavigation } from '../features/history/types.ts';
import type { HistoryController } from '../features/history/types.ts';
import type { PlanSessionBoundary } from '../features/plan/types.ts';
import type { HistoryRestorationAnchor, HistoryRestorationResult, HistoryFilter } from '../features/history/restoration.ts';
import { restoreNavigationContext } from '../navigation/history.ts';

const historyPositionKey = 'app.history.positions.v1';
const safeNavigationId = (value: unknown): value is string => typeof value === 'string' && /^[a-zA-Z0-9_:.-]{1,160}$/.test(value);
type HistoryPosition = { path: string; scrollY: number; focusKey: string | null };
/** App-owned UI lease. Feature results remain immutable; only the actual
 * after-commit onReady callback may queue this scope's viewport work. */
export function createHistoryRestorationScope({controller,boundary,navigator,win}: {
  controller: HistoryController; boundary: PlanSessionBoundary; navigator: PortalNavigator; win: Window;
}) {
  const path = navigator.getSnapshot();
  const marker = () => {
    const value = (win.history.state as {shelvNavigation?:{scopeKey?:unknown;entryId?:unknown;restore?:{scrollY?:unknown;focusKey?:unknown}}}|null)?.shelvNavigation;
    return value?.scopeKey === boundary.key && safeNavigationId(value.entryId) ? value : null;
  };
  const entryId = marker()?.entryId;
  let disposed = false;
  type Owner = {frames:Set<number>};
  let owner: Owner | null = null;
  const current = () => !disposed && !!owner && safeNavigationId(entryId) && boundary.isCurrent() && navigator.getSnapshot() === path && marker()?.entryId === entryId;
  const positions = () => boundary.memory.get<Record<string,HistoryPosition>>(historyPositionKey) ?? {};
  function capturePosition() {
    if (!current() || !safeNavigationId(entryId)) return;
    const id = win.document.activeElement?.id;
    boundary.memory.set(historyPositionKey,{...positions(),[entryId]:{path,scrollY:Math.max(0,win.scrollY),focusKey:safeNavigationId(id)?id:null}});
  }
  const saved = safeNavigationId(entryId) ? positions()[entryId] : undefined;
  const initial = marker()?.restore;
  const position: HistoryPosition | null = saved?.path === path ? saved : initial && typeof initial.scrollY === 'number' && Number.isFinite(initial.scrollY) && initial.scrollY >= 0 && (initial.focusKey === null || safeNavigationId(initial.focusKey)) ? {path,scrollY:initial.scrollY,focusKey:initial.focusKey} : null;
  return {
    attach() {
      if(disposed)return () => {};
      const captured:Owner={frames:new Set()};owner=captured;
      return () => {
        captured.frames.forEach(id=>win.cancelAnimationFrame?.(id));captured.frames.clear();
        if(owner===captured)owner=null;
      };
    },
    capturePosition,
    capture(anchor:HistoryRestorationAnchor|null=null) {
      if(!current())return null;
      const point=controller.restoration?.capture(anchor)??null;
      capturePosition();return point;
    },
    setFilter(filter:HistoryFilter) {
      if(!current())return;
      capturePosition();controller.restoration?.setFilter(filter);
    },
    onReady(result:HistoryRestorationResult) {
      const captured=owner;
      if(!captured||!current()||!controller.restoration?.isCurrent(result))return;
      const frame=win.requestAnimationFrame(()=>{
        captured.frames.delete(frame);
        if(owner!==captured||!current()||!controller.restoration?.isCurrent(result))return;
        const exact=result.state==='restored'&&position;
        const focusKey=exact?(result.anchorId??position.focusKey):null;
        // The source witness proves an anchor should exist, not DOM geometry.
        // Missing actual committed content takes the ordinary heading fallback.
        const available=focusKey===null||!!win.document.getElementById(focusKey);
        restoreNavigationContext(exact&&available?{scrollY:position.scrollY,focusKey}:{scrollY:0,focusKey:null},win.document,win);
      });
      captured.frames.add(frame);
    },
    retire() { disposed=true;owner=null; },
  };
}

export function createHistoryNavigation(navigator: Pick<PortalNavigator, 'navigate'|'back'>): HistoryNavigation {
  return {
    openUpdate: () => navigator.navigate({ name: 'history-new' }),
    back: () => navigator.back(),
    openVersion(version) {
      if (!Number.isSafeInteger(version) || version < 1) throw new TypeError('invalid version');
      navigator.navigate({ name: 'history-version', version: String(version) });
    },
  };
}

/** Actual client activation seam. Creation starts no request: the selected page
 * owns its reads. Preview/demo never construct this connection. */
export function createClientComposition(runtime: ApplicationSession) {
  const boundary = runtime.getSnapshot().boundary;
  if (!boundary?.isCurrent() || runtime.cookie.audience !== 'client' || runtime.cookie.identity?.role !== 'client')
    throw new TransportError(401);
  let disposed = false;
  const current = () => {
    if (disposed || runtime.getSnapshot().boundary !== boundary || !boundary.isCurrent()) throw new TransportError(401);
  };
  function owned<I,O>(port: OperationPort<I,O>): OperationPort<I,O> {
    return {async execute(input,options) {
      current();
      try { const result=await port.execute(input,options); current(); return result; }
      catch(error) { current(); throw error; }
    }};
  }
  const request = owned(createClientReviewRequest(runtime));
  const retained = createClientPorts(runtime, { care: true });
  const ports = {
    read: owned(retained.read),
    decision: owned(retained.decision),
    care: retained.care ? owned(retained.care) : undefined,
    review: owned(createClientGuidancePort({ request, session: boundary, mode: 'client' })),
  };
  const controller = createClientPlanController(boundary, ports, { readVersion: 3 });
  const history = createHistoryController({ session: boundary, mode: 'client', port: createHistoryPort(runtime, request) });
  const versions = new Set<ReturnType<typeof createClientPlanController>>();
  return { ports, controller, history,
    createVersionController(version: number) {
      current();
      if (!Number.isSafeInteger(version) || version < 1) throw new TypeError('invalid version');
      const selected = createClientPlanController(boundary, ports, { readVersion: 3, version });
      versions.add(selected);
      return {...selected,dispose(){selected.dispose();versions.delete(selected);}};
    },
    dispose() { if(disposed)return; disposed=true; controller.dispose(); history.dispose(); versions.forEach(c => c.dispose()); versions.clear(); },
  };
}
export type ClientComposition = ReturnType<typeof createClientComposition>;
