import type { ApplicationSession } from '../src/app/session.ts';
import { createOwnerPolicyPort } from '../src/features/advisor/permissions/port.ts';
import { createOwnerPolicyController } from '../src/features/advisor/permissions/controller.ts';
import type { OwnerPolicyCommand, Policy, OwnerPolicyState } from '../src/features/advisor/permissions/types.ts';
function readonlySurface(runtime: ApplicationSession, state: OwnerPolicyState, policy: Policy) {
    const c = createOwnerPolicyController(runtime), p = createOwnerPolicyPort(runtime);
    // @ts-expect-error current policy is a readonly server projection
    policy.revision = 99;
    // @ts-expect-error local controls cannot manufacture current server state
    state.current = policy;
    // @ts-expect-error writable is derived from actual runtime and policy owner
    state.writable = true;
    // @ts-expect-error no caller-owned authority flag
    createOwnerPolicyController({ runtime, isOwner: true });
    // @ts-expect-error no task-grant or source action on this finite seam
    const grant: OwnerPolicyCommand = { schemaVersion: 1, action: 'grant_task_v1' };
    // @ts-expect-error no injected positive operation port
    createOwnerPolicyPort(runtime, { execute: async () => policy });
    // @ts-expect-error confirmation is a separate exact snapshot, not a boolean
    c.confirmSave(true);
    void grant;
    void p;
}
void readonlySurface;
