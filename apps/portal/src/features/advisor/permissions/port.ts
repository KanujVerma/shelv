import type { ApplicationSession } from '../../../app/session.ts';
import { createAdvisorPolicyRequest } from '../../../app/advisor-policy-request.ts';
import { TransportError } from '../../../transport/session.ts';
import { readPlanCommand } from '../../../../../../src/contracts/PortalRebuildValidation.ts';
import { mapPlanResult } from '../../../../../../src/contracts/PortalRebuildMapping.ts';
import type { OwnerPolicyCommand, OwnerPolicyPort, OwnerPolicyResult, Policy } from './types.ts';
export function policyResult(value: unknown): Policy {
    const result = mapPlanResult(value, { schemaVersion: 1, action: 'read_policy_v1' });
    if (!('ownerActorId' in result))
        throw new TransportError(503);
    return Object.freeze({ ...result });
}
/** No positive authority/data port injection. Actual runtime, retained raw seam,
 * and canonical Root parser/mapper are the only production path. */
export function createOwnerPolicyPort(runtime: ApplicationSession): OwnerPolicyPort {
    const boundary = runtime.getSnapshot().boundary, raw = createAdvisorPolicyRequest(runtime);
    let disposed = false, policy: Policy | null = null, readSequence = 0;
    const current = () => !disposed && !!boundary && runtime.getSnapshot().boundary === boundary && boundary.isCurrent();
    const guard = () => { if (!current())
        throw new TransportError(401); };
    return {
        isCurrent: current,
        async execute(input, options) {
            guard();
            let command: OwnerPolicyCommand;
            try {
                const parsed = readPlanCommand(input);
                if (parsed.action !== 'read_policy_v1' && parsed.action !== 'set_sami_approval_policy_v1' && parsed.action !== 'request_status_v1')
                    throw new TransportError(403);
                command = Object.freeze(parsed);
            }
            catch (error) {
                if (error instanceof TransportError)
                    throw error;
                throw new TransportError(400);
            }
            guard();
            const write = command.action === 'set_sami_approval_policy_v1', reading = command.action === 'read_policy_v1';
            const sequence = reading ? ++readSequence : readSequence;
            // Starting a current read retires its old owner basis. A late A
            // failure cannot clear a newer B read because B owns its sequence.
            if (reading) policy = null;
            const basis = policy;
            const permitted = () => {
                guard();
                return (!reading || sequence === readSequence) && runtime.cookie._view?.capabilities.view === true && (!write || runtime.cookie._view?.capabilities.publish === true && !!basis && policy === basis && basis.ownerActorId === runtime.cookie.identity?.ownerId);
            };
            if (!permitted())
                throw new TransportError(403, write ? 'write' : 'read');
            const applicable = () => {
                if (!permitted())
                    return false;
                let applies = true;
                try {
                    applies = options?.isApplicable === undefined || options.isApplicable() === true;
                }
                catch {
                    applies = false;
                }
                return permitted() && applies;
            };
            try {
                const value = await raw.execute(command, { ...options, isApplicable: applicable });
                guard();
                if (!applicable())
                    throw new TransportError(503, write ? 'write' : 'read');
                const mapped = mapPlanResult(value, command);
                let result: OwnerPolicyResult;
                if ('status' in mapped) {
                    result = mapped.status === 'absent' ? Object.freeze({ status: 'absent' }) : Object.freeze({ status: 'committed', receipt: policyResult(mapped.receipt) });
                }
                else
                    result = policyResult(mapped);
                guard();
                if (!applicable())
                    throw new TransportError(503, write ? 'write' : 'read');
                if (!('status' in result))
                    policy = result;
                return result;
            }
            catch (error) {
                guard();
                if (error instanceof TransportError && error.status === 403 && sequence === readSequence && policy === basis) policy = null;
                if (error instanceof TransportError)
                    throw error;
                throw new TransportError(503, write ? 'write' : 'read');
            }
        },
        dispose() { if (disposed)
            return; disposed = true; policy = null; },
    };
}
