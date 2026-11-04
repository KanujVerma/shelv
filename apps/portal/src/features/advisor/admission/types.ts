import type { AdmissionCommand, AdmissionReceipt } from "../../../../../../src/contracts/ConciergeAdmission.ts";
import type { ApplicationSession } from "../../../app/session.ts";
import type { OperationPort } from "../../../transport/session.ts";
export type AddClientCommand = Extract<AdmissionCommand, { action: "add_client" }>;
export type AdvisorAdmissionStatus =
  | { requestId: string; status: "pending"; client: null }
  | { requestId: string; status: "ready"; client: AdmissionReceipt };
/** Fixed existing wire operations. W0 owns actual authenticated decoding/binding. */
export interface AdvisorAdmissionPorts {
  capabilities: OperationPort<Extract<AdmissionCommand, { action: "capabilities" }>, { canAddClient: boolean }>;
  add: OperationPort<AddClientCommand, AdmissionReceipt>;
  status: OperationPort<Extract<AdmissionCommand, { action: "admission_status" }>, AdvisorAdmissionStatus>;
}
export interface AdvisorAdmissionOptions {
  runtime: ApplicationSession;
  ports: AdvisorAdmissionPorts;
}
export interface AdmissionFields { email: string; displayName: string }
export interface AdvisorAdmissionState {
  readonly phase: "idle" | "loading" | "ready" | "denied" | "error" | "offline" | "ended";
  readonly canAddClient: boolean | null;
  readonly fields: Readonly<AdmissionFields>;
  readonly confirmation: Readonly<AddClientCommand> | null;
  readonly pending: Readonly<AddClientCommand> | null;
  readonly recovery: "unresolved" | "rejected_no_intent" | null;
  readonly receipt: Readonly<AdmissionReceipt> | null;
  readonly busy: "capabilities" | "add" | "status" | "connection" | null;
  readonly message: string | null;
}
export interface AdvisorAdmissionController {
  getSnapshot(): AdvisorAdmissionState;
  subscribe(listener: () => void): () => void;
  refreshCapabilities(): Promise<void>;
  checkConnection(): Promise<void>;
  editFields(patch: Partial<AdmissionFields>): void;
  prepare(): void;
  backToFields(): void;
  confirm(): Promise<void>;
  checkStatus(): Promise<void>;
  retry(): Promise<void>;
  correctDetails(): void;
  addAnother(): void;
  dispose(): void;
}
