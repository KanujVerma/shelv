import type { ApplicationSession } from "../../../app/session.ts";
import type { PreviewRecord } from "../../../app/preview.ts";
import type { OperationPort } from "../../../transport/session.ts";
import type { PlanPreviewSource } from "../../plan/preview.ts";
import type { PlanSessionBoundary } from "../../plan/types.ts";
import type { AdvisorController } from "../types.ts";

export type AdvisorInlinePreviewRead = OperationPort<Readonly<Record<string, never>>, PreviewRecord>;
export interface AdvisorInlinePreviewOptions {
  runtime: ApplicationSession;
  advisor: AdvisorController;
  draftId: string;
  read?: AdvisorInlinePreviewRead;
}
export interface AdvisorInlinePreviewState {
  readonly phase: "idle" | "loading" | "ready" | "stale" | "unavailable" | "error" | "denied" | "offline" | "ended";
  readonly source: PlanPreviewSource | null;
  readonly record: PreviewRecord | null;
}
export interface AdvisorInlinePreviewController {
  /** Actual captured session; presentation cannot grant its validity. */
  readonly session: PlanSessionBoundary;
  getSnapshot(): AdvisorInlinePreviewState;
  subscribe(listener: () => void): () => void;
  refresh(): Promise<void>;
  checkConnection(): Promise<void>;
  dispose(): void;
}
