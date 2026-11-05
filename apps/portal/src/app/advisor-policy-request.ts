import type { ApplicationSession } from './session.ts';
import { advisorCookieRequest } from './retained.ts';
import { TransportError } from '../transport/session.ts';
import type { OperationPort, OperationOptions } from '../transport/session.ts';
/** Creation-bound raw seam for the three existing Plan policy commands only.
 * Retained cookie transport owns the two real lease acquisitions and CSRF. */
export function createAdvisorPolicyRequest(runtime: ApplicationSession): OperationPort<unknown, unknown> {
    const boundary = runtime.getSnapshot().boundary;
    const current = () => {
        if (!boundary || runtime.getSnapshot().boundary !== boundary || !boundary.isCurrent() || runtime.cookie.audience !== 'advisor' || runtime.cookie.identity?.role !== 'advisor')
            throw new TransportError(401);
    };
    current();
    return { async execute(input, options?: OperationOptions) {
            current();
            let command: {
                schemaVersion: 1;
                action: string;
            };
            try {
                const wire = JSON.stringify(input);
                if (typeof wire !== 'string')
                    throw new TransportError(400);
                if (new TextEncoder().encode(wire).length > 500000)
                    throw new TransportError(413);
                const value: unknown = JSON.parse(wire);
                if (!value || typeof value !== 'object' || Array.isArray(value) || !('schemaVersion' in value) || value.schemaVersion !== 1 || !('action' in value) || typeof value.action !== 'string')
                    throw new TransportError(400);
                if (!['read_policy_v1', 'set_sami_approval_policy_v1', 'request_status_v1'].includes(value.action))
                    throw new TransportError(403);
                command = Object.freeze({ ...value, schemaVersion: 1, action: value.action });
            }
            catch (error) {
                if (error instanceof TransportError)
                    throw error;
                throw new TransportError(400);
            }
            // Reentrant serialization may retire the captured session.
            current();
            const kind = command.action === 'set_sami_approval_policy_v1' ? 'write' : 'read';
            const applicable = () => {
                current();
                const caps = runtime.cookie._view?.capabilities;
                if (caps?.view !== true || kind === 'write' && caps.publish !== true)
                    return false;
                let applies = true;
                try {
                    applies = options?.isApplicable === undefined || options.isApplicable() === true;
                }
                catch {
                    applies = false;
                }
                current();
                return applies && runtime.cookie._view?.capabilities.view === true && (kind !== 'write' || runtime.cookie._view?.capabilities.publish === true);
            };
            if (runtime.cookie._view?.capabilities.view !== true || kind === 'write' && runtime.cookie._view?.capabilities.publish !== true)
                throw new TransportError(403, kind);
            const request = advisorCookieRequest('plans', runtime.cookie);
            try {
                const value = await runtime.transport.bind({ kind, decode: value => value, invoke: (value, opts) => request(value, opts) }).execute(command, { ...options, isApplicable: applicable });
                current();
                return value;
            }
            catch (error) {
                current();
                throw error;
            }
        } };
}
