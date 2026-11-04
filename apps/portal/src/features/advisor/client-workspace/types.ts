import type { ApplicationSession } from "../../../app/session.ts";
import type { OperationPort } from "../../../transport/session.ts";
import type { PlanDirectory } from "../../../../../../src/contracts/PortalRebuildMapping.ts";

/** W0 binds the actual runtime and one client at creation. Input cannot select one. */
export type AdvisorClientPlansReadPort = OperationPort<{ cursor: string | null; limit: number }, PlanDirectory>;
export interface AdvisorClientWorkspaceOptions {
  runtime: ApplicationSession;
  clientId: string;
  readPlans: AdvisorClientPlansReadPort;
}
export interface AdvisorClientWorkspaceDirectory {
  readonly nextCursor: string | null;
  readonly drafts: readonly Readonly<PlanDirectory["drafts"][number]>[];
  readonly publications: readonly Readonly<PlanDirectory["publications"][number]>[];
}
export interface AdvisorClientWorkspaceState {
  readonly clientId: string;
  readonly phase: "idle" | "loading" | "ready" | "error" | "denied" | "offline" | "ended";
  readonly directory: AdvisorClientWorkspaceDirectory | null;
  /** Only the successful loaded traversal ended. Never a live snapshot promise. */
  readonly complete: boolean;
  readonly filter: string;
}
export interface AdvisorClientWorkspaceController {
  getSnapshot(): AdvisorClientWorkspaceState;
  subscribe(listener: () => void): () => void;
  refresh(): Promise<void>;
  loadMore(): Promise<void>;
  retry(): Promise<void>;
  checkConnection(): Promise<void>;
  setFilter(value: string): void;
  dispose(): void;
}
export interface ClientWorkspaceProps {
  controller: AdvisorClientWorkspaceController;
  /** Trusted presentation from W0's actual client context; unknown stays unknown. */
  clientName?: string | null;
  onOpenDraft?: (draftId: string) => void;
  /** Supply only when an actual version-specific reader/navigation exists. */
  onOpenPublication?: (version: number) => void;
}
