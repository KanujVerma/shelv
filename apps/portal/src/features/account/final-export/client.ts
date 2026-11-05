import type {ApplicationSession} from '../../../app/session.ts';
import {TransportError} from '../../../transport/session.ts';

/** Captures the actual client boundary. Local relevance may only deny it. */
export function captureFinalExportClient(runtime: ApplicationSession) {
  const boundary = runtime.getSnapshot().boundary;
  const cookie = runtime.cookie;
  const owner = cookie.identity?.ownerId;
  const generation = cookie.generation;
  const epoch = cookie._epoch;
  const serverGeneration = cookie._view?.generation;
  const same = () => boundary !== null && owner !== undefined &&
    runtime.getSnapshot().boundary === boundary && cookie.audience === 'client' &&
    cookie.identity?.role === 'client' && cookie.identity.ownerId === owner &&
    cookie.generation === generation && cookie._epoch === epoch &&
    cookie._view?.generation === serverGeneration;
  function assertCurrent() {
    if (!same() || !boundary?.isCurrent() || !same()) throw new TransportError(401);
  }
  function assertReady() {
    assertCurrent();
    if (cookie.status !== 'ready' || runtime.getSnapshot().status !== 'ready') throw new TransportError(503);
    assertCurrent();
  }
  return {boundary, assertCurrent, assertReady};
}
