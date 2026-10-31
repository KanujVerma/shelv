import type { ApplicationSession } from './session.ts';
import { TransportError } from '../transport/session.ts';
import { createClientPorts } from './ports.ts';
import { createClientReviewRequest } from './review-request.ts';
import { createClientPlanController } from './client-state.ts';
import { createClientGuidancePort } from '../features/plan/guidancePort.ts';
import { createHistoryController } from '../features/history/controller.ts';
import { createHistoryPort } from '../features/history/port.ts';

/** Actual client activation seam. Creation starts no request: the selected page
 * owns its reads. Preview/demo never construct this connection. */
export function createClientComposition(runtime: ApplicationSession) {
  const boundary = runtime.getSnapshot().boundary;
  if (!boundary?.isCurrent() || runtime.cookie.audience !== 'client' || runtime.cookie.identity?.role !== 'client')
    throw new TransportError(401);
  const request = createClientReviewRequest(runtime);
  const ports = {
    ...createClientPorts(runtime, { care: true }),
    review: createClientGuidancePort({ request, session: boundary, mode: 'client' }),
  };
  const controller = createClientPlanController(boundary, ports, { readVersion: 3 });
  const history = createHistoryController({ session: boundary, mode: 'client', port: createHistoryPort(runtime, request) });
  return { ports, controller, history, dispose() { controller.dispose(); history.dispose(); } };
}
export type ClientComposition = ReturnType<typeof createClientComposition>;
