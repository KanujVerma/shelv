import type {HistoryFilter,HistoryTimelineState,HistoryRestorationController,HistoryRestorationProps} from './restoration.ts';
import type { ClientCareHistoryPage, ClientCareHistoryEntry, ClientPlanViewV3, GoalReportBody, ReportEvent, ReportReplacement, ReviewCommand, ReportWriteReceipt, ReportNoopReceipt, PortalReviewOutcome, ReviewResult } from '../../../../../src/contracts/PortalReview.ts';
import type { Known } from '../../../../../src/contracts/PortalRebuild.ts';
import type { PlanSessionBoundary } from '../plan/types.ts';
import type { OperationPort } from '../../transport/session.ts';
import type { PresentationMode } from '../../navigation/routes.ts';
/** Deliberately narrower than Review's complete client allowlist. No advisor or decision operations. */
export type HistoryCommand = Extract<ReviewCommand, {
    action: 'submit_goal_report_v1' | 'amend_report_v1' | 'read_care_history_v1' | 'read_client_plan_v3' | 'request_status_v1';
}>;
export type ReportCommand = Extract<HistoryCommand, {
    action: 'submit_goal_report_v1' | 'amend_report_v1';
}>;
export type HistoryOutcome = PortalReviewOutcome<ReviewResult>;
export type HistoryPort = OperationPort<HistoryCommand, HistoryOutcome>;
export type HistorySession = PlanSessionBoundary;
export type ReportReceipt = ReportWriteReceipt | ReportNoopReceipt;
export type ReportIntent = {
    kind: 'new';
    body: GoalReportBody;
    occurredOn: Known<string>;
} | {
    kind: 'amendment';
    original: ReportEvent;
    expectedAmendmentHeadId: string | null;
    retainedPhotoIds: string[];
    replacement: ReportReplacement;
    occurredOn: Known<string>;
    reason: string;
};
export interface HistoryContext {
    session: HistorySession;
    mode: PresentationMode;
    port?: HistoryPort;
}
export type MutationState = 'idle' | 'saving' | 'uncertain' | 'conflict' | 'confirmed' | 'no_observation' | 'denied';
export interface HistoryState {
    timeline?:HistoryTimelineState;
    phase: 'idle' | 'loading' | 'ready' | 'error' | 'denied' | 'ended';
    view: ClientPlanViewV3 | null;
    amendmentView: ClientPlanViewV3 | null;
    pages: readonly ClientCareHistoryPage[];
    version: number | null;
    loadingMore: boolean;
    checkingStatus: boolean;
    readError: boolean;
    intent: ReportIntent | null;
    mutation: MutationState;
    pending: ReportCommand | null;
    receipt: ReportReceipt | null;
    needsReview: boolean;
    error: string | null;
}
/** Enclosing App owns routes, Back, focus/scroll restoration, download and historical renderer. */
export interface HistoryNavigation {
    openUpdate(): void;
    back(): void;
    openVersion?(version: number): void;
}
export interface HistoryProps {
    filter?:HistoryFilter;
    onFilterChange?:(filter:HistoryFilter)=>void;
    restoration?:HistoryRestorationProps;
    controller: HistoryController;
    screen: 'history' | 'update';
    navigation: HistoryNavigation;
    onExport?: () => void;
    onContact?: () => void;
    /** Resolve only actual immutable public identities. Returning null leaves an honest identifier. */
    actorLabel?: (actorId: string) => string | null;
    goalLabel?: (goalId: string, publication: GoalReportBody['publication']) => string | null;
    productLabel?: (product: import('../../../../../src/contracts/PortalCare.ts').ProductRef) => string | null;
}
export interface HistoryController {
    restoration?:HistoryRestorationController;
    getSnapshot(): HistoryState;
    subscribe(listener: () => void): () => void;
    setContext(context: HistoryContext): void;
    load(version?: number | null): Promise<void>;
    loadMore(): Promise<void>;
    startReport(): void;
    startAmendment(event: ReportEvent): Promise<void>;
    edit(intent: ReportIntent): void;
    submit(): Promise<void>;
    retryExact(): Promise<void>;
    checkStatus(): Promise<void>;
    reviewCurrent(): Promise<void>;
    dispose(): void;
}
export type HistoryEntry = ClientCareHistoryEntry;
/** Integration request only: no uploader or fabricated completed photo is exposed. */
export interface HistoryPhotoIntegrationRequest {
    purpose: 'goal_report_photo';
    requires: 'authorized_completed_storage';
    available: false;
}
export const historyPhotoIntegrationRequest: HistoryPhotoIntegrationRequest = { purpose: 'goal_report_photo', requires: 'authorized_completed_storage', available: false };
