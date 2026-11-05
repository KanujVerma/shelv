import type { ApplicationSession } from './session.ts';
import { TransportError } from '../transport/session.ts';
import type { OperationPort } from '../transport/session.ts';
import { createClientPorts } from './ports.ts';
import { createClientReviewRequest } from './review-request.ts';
import { createClientPlanController } from './client-state.ts';
import { createClientGuidancePort } from '../features/plan/guidancePort.ts';
import { createHistoryController } from '../features/history/controller.ts';
import { createHistoryPort } from '../features/history/port.ts';
import type { PortalNavigator,NavigationRestorationTicket } from '../navigation/history.ts';
import type { PortalRoute } from '../navigation/routes.ts';
import type { HistoryNavigation } from '../features/history/types.ts';
import type { HistoryController } from '../features/history/types.ts';
import type { PlanSessionBoundary } from '../features/plan/types.ts';
import type { HistoryRestorationAnchor, HistoryRestorationResult, HistoryFilter } from '../features/history/restoration.ts';
export const deferClientHistoryRestoration=(route:PortalRoute)=>['history','history-new','history-event','history-version'].includes(route.name);
const safeNavigationId = (value: unknown): value is string => typeof value === 'string' && /^[a-zA-Z0-9_:.-]{1,160}$/.test(value);
/** App-owned UI lease. Feature results remain immutable; only the actual
 * after-commit onReady callback may queue this scope's viewport work. */
export function createHistoryRestorationScope({controller,boundary,navigator,win,waitForDocument=false}: {
  controller: HistoryController; boundary: PlanSessionBoundary; navigator: PortalNavigator; win: Window; waitForDocument?:boolean;
}) {
  const path = navigator.getSnapshot();
  const marker = () => {
    const value = (win.history.state as {shelvNavigation?:{scopeKey?:unknown;entryId?:unknown;restore?:{scrollY?:unknown;focusKey?:unknown}}}|null)?.shelvNavigation;
    return value?.scopeKey === boundary.key && safeNavigationId(value.entryId) ? value : null;
  };
  const entryId = marker()?.entryId;
  let disposed = false;
  type Owner = {ticket:NavigationRestorationTicket|null;work:number;documentReady:boolean;documentAvailable:boolean;pending:{result:HistoryRestorationResult;work:number}|null};
  let owner: Owner | null = null;
  const current = () => !disposed && !!owner && safeNavigationId(entryId) && boundary.isCurrent() && navigator.getSnapshot() === path && marker()?.entryId === entryId;
  function capturePosition() {
    if (!current() || !safeNavigationId(entryId)) return;
    owner!.work++;
    const state=controller.getSnapshot();
    if(state.phase!=='ready'||state.timeline?.restoring||state.loadingMore||state.readError)return;
    if(owner!.ticket)navigator.restoration.cancel(owner!.ticket);
    navigator.restoration.capture();
  }
  function onReady(result:HistoryRestorationResult) {
    const captured=owner;
    if(!captured?.ticket||!current()||!navigator.restoration.isCurrent(captured.ticket)||!controller.restoration?.isCurrent(result))return;
    const work=++captured.work;
    if(!captured.documentReady){captured.pending={result,work};return;}
    const saved=navigator.restoration.read(captured.ticket);
    const available=(!result.anchorId||!!win.document.getElementById(result.anchorId))&&(!saved?.focusKey||!!win.document.getElementById(saved.focusKey));
    const exact=result.state==='restored'&&!!saved&&captured.documentAvailable&&available;
    navigator.restoration.complete(captured.ticket,exact?'saved':'fallback',()=>owner===captured&&captured.work===work&&current()&&(!exact||captured.documentAvailable)&&controller.restoration?.isCurrent(result)===true);
  }
  return {
    isCurrent:current,
    begin(){if(current()){owner!.work++;owner!.pending=null;owner!.ticket=navigator.restoration.begin();}},
    attach() {
      if(disposed)return () => {};
      const captured:Owner={ticket:null,work:0,documentReady:!waitForDocument,documentAvailable:true,pending:null};owner=captured;
      captured.ticket=navigator.restoration?.begin()??null;
      const stop=boundary.subscribeInvalidation(()=>{if(owner===captured){if(captured.ticket)navigator.restoration.cancel(captured.ticket);owner=null;}});
      return () => {
        stop();
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
    onReady,
    documentCommitted(available:boolean) {
      if(!owner||!current())return;
      owner.documentReady=true;owner.documentAvailable=available;
      const pending=owner.pending;owner.pending=null;if(pending&&pending.work===owner.work)onReady(pending.result);
    },
    retire() { disposed=true;owner=null; },
  };
}

export type AppHistoryRestorationScope = ReturnType<typeof createHistoryRestorationScope>;
/** Fresh C05 data owner; publishing data is separate from the view's committed
 * onReady. Pending original commands and amendments remain feature-owned. */
export function createHistoryUpdateReader(controller:HistoryController,scope:AppHistoryRestorationScope,onData:(result:HistoryRestorationResult)=>void) {
  let disposed=false,retired=false,admitted=false,job:Promise<void>|null=null,attempt:ReturnType<NonNullable<HistoryController['restoration']>['restore']>|null=null;
  let predecessorCancellation:ReturnType<HistoryController['getSnapshot']>|null=null;
  const current=()=>{if(disposed||retired)return false;if(!scope.isCurrent()){retired=true;admitted=false;return false;}return true;};
  // Admission belongs to this reader/entry, not to a pending-reference-bound
  // viewport witness. The feature still owns every private projection/action.
  const observe=()=>{
    const state=controller.getSnapshot();
    if(state.phase==='idle'&&!state.timeline?.restoring){
      const prior=predecessorCancellation;predecessorCancellation=null;
      // Only the first synchronous predecessor cancellation may preserve these
      // exact public references. A context replacement clears its own pages.
      if(!prior||state.pages!==prior.pages||state.view!==prior.view||state.intent!==prior.intent||state.pending!==prior.pending){retired=true;admitted=false;}
    }
    if(state.phase==='ended'||!scope.isCurrent()){retired=true;admitted=false;}
    if(state.phase==='denied')admitted=false;
  };
  const stop=controller.subscribe(observe);
  // The shared update screen invokes this on ready/mount. Only a deliberate
  // new-update action on the underlying controller may replace a final intent.
  const startReport=()=>{if(current()&&!controller.getSnapshot().intent)controller.startReport();};
  const dataReady=(result:HistoryRestorationResult)=>{
    const state=controller.getSnapshot();
    // Current error witnesses are applicable, not successful data. W4 owns
    // the declared reconstruction extent; an ordinary next cursor is valid.
    return result.state!=='unavailable'&&!!result.basis&&!(result.state==='fallback'&&result.reason==='page_read_failed')&&
      state.phase==='ready'&&!state.readError&&!state.loadingMore&&!state.timeline?.restoring&&state.view!==null&&state.pages.length>0;
  };
  return {
    isAdmitted(){if(admitted)observe();return admitted&&current();},
    startReport,
    read():Promise<void> {
      if(!current()||!controller.restoration)return Promise.resolve();
      if(job)return job;
      let complete!:()=>void,fail!:(error:unknown)=>void;
      const pending=new Promise<void>((resolve,reject)=>{complete=resolve;fail=reject;});
      // Publish the real job before any synchronous notification can reenter.
      job=pending;
      try{
        scope.begin();
        if(!current()){if(job===pending)job=null;complete();return pending;}
        const api=controller.restoration,prior=controller.getSnapshot();
        predecessorCancellation=!attempt&&prior.phase==='loading'&&prior.timeline?.restoring?prior:null;
        let owned:ReturnType<typeof api.restore>;
        try{owned=api.restore(null);}finally{predecessorCancellation=null;}
        attempt=owned;
        if(!current())owned.cancel();
        const owns=()=>current()&&attempt===owned;
        void owned.ready.then(result=>{
          if(!owns()||!api.isCurrent(result)||!dataReady(result))return;
          startReport();
          if(owns()&&api.isCurrent(result)&&dataReady(result)){admitted=true;onData(result);}
        }).then(()=>{if(job===pending)job=null;complete();},error=>{if(job===pending)job=null;fail(error);});
      }catch(error){predecessorCancellation=null;if(job===pending)job=null;fail(error);}
      return pending;
    },
    dispose(){disposed=true;admitted=false;stop();attempt?.cancel();attempt=null;job=null;},
  };
}
export function createHistoryNavigation(navigator: Pick<PortalNavigator, 'navigate'|'back'>, scope?: AppHistoryRestorationScope): HistoryNavigation {
  const current=()=>!scope||scope.isCurrent();
  const capture=()=>scope?.capturePosition();
  return {
    openUpdate() {if(current()){capture();navigator.navigate({ name: 'history-new' });}},
    back() {if(current()){capture();navigator.back();}},
    openVersion(version) {
      if(!current())return;
      if (!Number.isSafeInteger(version) || version < 1) throw new TypeError('invalid version');
      capture();
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
