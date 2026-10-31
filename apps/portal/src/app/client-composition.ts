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
