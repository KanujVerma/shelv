import type { ApplicationSession } from './session.ts';
import { advisorCookieRequest, clientCookieRequest } from './retained.ts';
import { TransportError } from '../transport/session.ts';
import type { OperationOptions } from '../transport/session.ts';
import type { NotificationCommand, NotificationResult } from '../../../../src/contracts/PortalNotification.ts';
import { readNotificationCommand } from '../../../../src/contracts/PortalNotificationValidation.ts';
import { decodeNotificationResponse } from '../../../../src/contracts/PortalNotificationMapping.ts';
import { notificationCommandMaxBytes, notificationAccess, notificationErrorStatuses } from '../../../../src/contracts/PortalNotificationValues.ts';

export type NotificationRequest = {
  isCurrent(): boolean;
  execute(command: NotificationCommand, options?: OperationOptions): Promise<NotificationResult>;
  dispose(): void;
};

/** An actual retained session, bound once to its original actor and boundary.
 * Local relevance can only deny. The server owns target eligibility and rights. */
export function createNotificationRequest(runtime: ApplicationSession): NotificationRequest {
  const boundary = runtime.getSnapshot().boundary;
  const cookie = runtime.cookie, audience = cookie.audience, actor = cookie.identity?.ownerId;
  const epoch = cookie._epoch, generation = cookie.generation, serverGeneration = cookie._view?.generation;
  const lifetime = new AbortController();
  let disposed = false;
  const same = () => !disposed && !!boundary && runtime.getSnapshot().boundary === boundary &&
    cookie.audience === audience && cookie.identity?.role === audience && cookie.identity.ownerId === actor &&
    cookie._epoch === epoch && cookie.generation === generation && cookie._view?.generation === serverGeneration;
  const isCurrent = () => same() && boundary!.isCurrent() && same();
  const current = () => { if (!isCurrent()) throw new TransportError(401); };
  current();
  const request = (audience === 'client' ? clientCookieRequest : advisorCookieRequest)('notifications', cookie);
  return {
    isCurrent,
    dispose() { disposed = true; lifetime.abort(); },
    async execute(input, options = {}) {
      current();
      const callerSignal = options.signal, local = options.isApplicable;
      const signal = callerSignal ? AbortSignal.any([callerSignal,lifetime.signal]) : lifetime.signal;
      let command: NotificationCommand;
      try {
        const wire = JSON.stringify(input);
        if (typeof wire !== 'string') throw new TransportError(400);
        if (new TextEncoder().encode(wire).byteLength > notificationCommandMaxBytes) throw new TransportError(413);
        const value: unknown = JSON.parse(wire);
        const action = (value as { action?: unknown } | null)?.action;
        if (typeof action !== 'string' || notificationAccess(action, audience === 'client' ? 'client' : 'human') === 'DENY') throw new TransportError(403);
        command = readNotificationCommand(value);
      } catch (error) { current(); if (error instanceof TransportError) throw error; throw new TransportError(400); }
      current();
      const original = command.action === 'request_status_v1' ? command.original : command;
      const needsEdit = original.action === 'retry_failed_email_v1';
      if (audience === 'client' && needsEdit) throw new TransportError(403);
      const kind = command.action === 'mark_seen_v1' || command.action === 'retry_failed_email_v1' ? 'write' : 'read';
      const capabilities = () => cookie._view?.capabilities.view === true && (!needsEdit || cookie._view.capabilities.edit === true);
      const privateCurrent = () => { current(); if (!capabilities()) throw new TransportError(403, kind); if (cookie.status !== 'ready') throw new TransportError(503, kind); current(); };
      const applicable = () => {
        current(); if (!capabilities()) throw new TransportError(403, kind);
        if (signal.aborted) return false;
        let applies = true;
        try { applies = local === undefined || typeof local === 'function' && local() === true; } catch { applies = false; }
        current(); if (!capabilities()) throw new TransportError(403, kind);
        return applies && !signal.aborted;
      };
      if (!capabilities()) throw new TransportError(403, kind);
      let code: string | undefined, status: number | undefined;
      try {
        const value = await runtime.transport.bind<NotificationCommand, NotificationResult>({
          kind,
          invoke: async (value, opts) => {
            try { return await request(value, opts); }
            catch (error) {
              const e = error as { status?: unknown; code?: unknown };
              if (typeof e?.status === 'number' && typeof e.code === 'string' && notificationErrorStatuses[e.code] === e.status) { code = e.code; status = e.status; }
              throw error;
            }
          },
          decode(value) {
            privateCurrent();
            const outcome = decodeNotificationResponse(command, 200, value);
            if (outcome.state !== 'ok') throw new TransportError(outcome.status, kind);
            privateCurrent();
            return outcome.value;
          },
        }).execute(command, { signal, isApplicable: applicable });
        privateCurrent();
        if (!applicable() || signal.aborted) throw new TransportError(503, kind);
        privateCurrent();
        return value;
      } catch (error) {
        current();
        if (!capabilities()) throw new TransportError(403, kind);
        if (error instanceof TransportError) {
          const safeCode = status === error.status && code ? code : error.status === 401 ? 'session_ended' : error.status === 403 ? 'forbidden' : error.status === 503 ? kind === 'write' ? 'uncertain' : 'unavailable' : undefined;
          if (safeCode) Object.defineProperty(error, 'code', { value: safeCode });
          if (error.status === 503 && kind === 'write') Object.defineProperty(error, 'original', { value: readNotificationCommand(command) });
        }
        throw error;
      }
    },
  };
}
