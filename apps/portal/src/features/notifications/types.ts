import type { NotificationInboxPage, NotificationDeliveryPage, NotificationEvent, NotificationWrite, NotificationWriteReceipt } from '../../../../../src/contracts/PortalNotification.ts';
import type { PlanCommand, PublishReceipt } from '../../../../../src/contracts/PortalRebuild.ts';
export type NotificationPhase = 'idle' | 'loading' | 'ready' | 'offline' | 'denied' | 'ended' | 'error';
export type NotificationMutation = 'idle' | 'saving' | 'uncertain' | 'unknown' | 'resolved' | 'conflict' | 'error';
export interface NotificationState {
  readonly phase: NotificationPhase;
  readonly audience: 'client' | 'advisor';
  readonly inbox: NotificationInboxPage | null;
  readonly deliveries: NotificationDeliveryPage | null;
  readonly selectedEvent: NotificationEvent | null;
  readonly loadingDeliveries: boolean;
  readonly canPreviousInbox: boolean;
  readonly canPreviousDeliveries: boolean;
  readonly canRetryEmail: boolean;
  /** Deny-only presentation. Execution independently rechecks the actual session. */
  readonly pendingRecovery: { readonly available: boolean; readonly reason: string | null };
  readonly mutation: NotificationMutation;
  readonly pending: NotificationWrite | null;
  readonly receipt: NotificationWriteReceipt | null;
  readonly checkingStatus: boolean;
  readonly confirmation: { readonly deliveryId: string; readonly revision: number } | null;
  readonly message: string | null;
  readonly missingInput: 'trusted_notification_event_reference' | null;
}
export interface NotificationController {
  getSnapshot(): NotificationState;
  subscribe(listener: () => void): () => void;
  loadInbox(): Promise<void>;
  nextInbox(): Promise<void>;
  previousInbox(): Promise<void>;
  openEvent(deliveryId: string): Promise<void>;
  /** Parent supplies the acknowledged original publication, never an editable UUID. */
  openPublication(command: Extract<PlanCommand, { action: 'publish_plan_v1' }>, receipt: PublishReceipt): Promise<void>;
  closeEvent(): void;
  loadDeliveries(): Promise<void>;
  nextDeliveries(): Promise<void>;
  previousDeliveries(): Promise<void>;
  markSeen(deliveryId: string): Promise<void>;
  prepareRetry(deliveryId: string): void;
  cancelRetry(): void;
  confirmRetry(): Promise<void>;
  checkStatus(): Promise<void>;
  retryExact(): Promise<void>;
  dispose(): void;
}
export interface NotificationViewProps {
  state: NotificationState;
  actions: NotificationController;
  screen?: 'inbox' | 'delivery-status';
}
