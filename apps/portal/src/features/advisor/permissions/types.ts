import type { PlanCommand, PlanPolicyView } from '../../../../../../src/contracts/PortalRebuild.ts';
import type { OperationPort } from '../../../transport/session.ts';
export type OwnerPolicyCommand = Extract<PlanCommand, {
    action: 'read_policy_v1' | 'set_sami_approval_policy_v1' | 'request_status_v1';
}>;
export type Policy = Readonly<PlanPolicyView>;
export type OwnerPolicyResult = Policy | {
    readonly status: 'absent';
} | {
    readonly status: 'committed';
    readonly receipt: Policy;
};
export interface OwnerPolicyPort extends OperationPort<OwnerPolicyCommand, OwnerPolicyResult> {
    isCurrent(): boolean;
    dispose(): void;
}
export interface PolicyConfirmation {
    readonly base: Policy;
    readonly desired: boolean;
}
export interface PolicyIntent {
    readonly requestId: string;
    readonly expectedPolicyRevision: number;
    readonly desired: boolean;
}
export interface OwnerPolicyState {
    readonly phase: 'unread' | 'loading' | 'ready' | 'error' | 'denied' | 'ended';
    readonly current: Policy | null;
    readonly base: Policy | null;
    readonly desired: boolean | null;
    readonly writable: boolean;
    readonly writeState: 'idle' | 'confirming' | 'saving' | 'saved' | 'uncertain' | 'conflict' | 'absent';
    readonly confirmation: PolicyConfirmation | null;
    readonly pending: PolicyIntent | null;
    readonly message: string | null;
}
