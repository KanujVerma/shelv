import type { ApplicationSession } from "./session.ts";
import { advisorCookieRequest } from "./retained.ts";
import { TransportError } from "../transport/session.ts";
import type { GuidanceParentContextRequest } from "../features/advisor/guidance/types.ts";
import type {
  GuidanceReadSnapshot,
  GuidanceDraftView,
  AdvisorPublicationViewV3,
} from "../../../../src/contracts/PortalReview.ts";
import type { PlanPolicyView } from "../../../../src/contracts/PortalRebuild.ts";
import type { ConciergeAdvisorDirectory } from "../../../../src/contracts/ConciergePortal.ts";
import { readPlanCommand } from "../../../../src/contracts/PortalRebuildValidation.ts";
import { mapPlanResult } from "../../../../src/contracts/PortalRebuildMapping.ts";
import { buildConciergeRpc } from "../../../../supabase/functions/concierge-operations/commands.ts";
import { mapConciergeAdvisorDirectory } from "../../../../src/contracts/ConciergePortalMapping.ts";
import {
  readGuidanceCommand,
  readReviewCommand,
  reviewJsonBytes,
} from "../../../../src/contracts/PortalReviewValidation.ts";
import { sameCareValue } from "../../../../src/contracts/PortalCareValidation.ts";
import { createAdvisorGuidanceAdapters } from "../features/advisor/guidance/adapters.ts";

export type AdvisorGuidanceContextRequest = GuidanceParentContextRequest & {
  snapshot: GuidanceReadSnapshot;
};
/** Actual read projections, never an all-actions grant or a Plan approval. */
export interface AdvisorGuidanceContext {
  readonly request: AdvisorGuidanceContextRequest;
  readonly actorId: string;
  readonly policy: PlanPolicyView;
  readonly capabilities: ConciergeAdvisorDirectory["capabilities"];
  readonly client: ConciergeAdvisorDirectory["clients"][number];
  readonly draft: GuidanceDraftView;
  readonly publication: AdvisorPublicationViewV3;
}
export interface AdvisorGuidanceContextPort {
  read(
    request: AdvisorGuidanceContextRequest,
    options?: { signal?: AbortSignal },
  ): Promise<AdvisorGuidanceContext>;
  isCurrent(context: AdvisorGuidanceContext): boolean;
  invalidate(): void;
  dispose(): void;
}
function freeze<T>(value: T): T {
  if (value && typeof value === "object") {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}
function requireContext(value: unknown, status = 409): asserts value {
  if (!value) throw new TransportError(status);
}
const required = [
  "read_policy_v1",
  "fresh_guidance_draft",
  "current_publication",
  "current_session_capabilities",
];

/** Dedicated per-controller composition. Only existing fixed READ channels.
 * No new RPC, caller transport/credential argument, or fabricated care-plan target.
 * The backend remains authoritative and rechecks writes after waits. */
export function createAdvisorGuidanceContext(
  runtime: ApplicationSession,
): AdvisorGuidanceContextPort {
  const boundary = runtime.getSnapshot().boundary,
    owner = runtime.cookie.identity?.ownerId,
    epoch = runtime.cookie._epoch,
    generation = runtime.cookie.generation,
    csrf = runtime.cookie._view?.csrf;
  const deadline = Math.min(
    Date.parse(runtime.cookie._view?.idleExpiresAt ?? ""),
    Date.parse(runtime.cookie._view?.absoluteExpiresAt ?? ""),
  );
  const clock = () => runtime.cookie.now?.() ?? Date.now();
  let disposed = false,
    sequence = 0;
  const issued = new WeakMap<
    AdvisorGuidanceContext,
    { sequence: number; capabilities: string }
  >();
  const cookieCaps = () =>
    JSON.stringify(runtime.cookie._view?.capabilities ?? null);
  const live = () =>
    !disposed &&
    !!boundary &&
    boundary.isCurrent() &&
    runtime.getSnapshot().boundary === boundary &&
    runtime.cookie.audience === "advisor" &&
    runtime.cookie.identity?.role === "advisor" &&
    runtime.cookie.identity.ownerId === owner &&
    runtime.cookie._epoch === epoch &&
    runtime.cookie.generation === generation &&
    runtime.cookie._view?.csrf === csrf &&
    clock() < deadline;
  const guard = (expected?: number, caps?: string) => {
    if (!live()) throw new TransportError(401);
    if (
      (expected !== undefined && expected !== sequence) ||
      (caps !== undefined && caps !== cookieCaps())
    )
      throw new TransportError(409);
  };
  guard();
  const raw = createAdvisorGuidanceAdapters(runtime);
  const today = () =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Chicago",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(clock()));
  function parse(
    input: AdvisorGuidanceContextRequest,
  ): AdvisorGuidanceContextRequest {
    try {
      requireContext(reviewJsonBytes(input) <= 500000, 400);
      requireContext(
        Object.keys(input).sort().join(",") ===
          [
            "boundaryKey",
            "selection",
            "target",
            "publisher",
            "scope",
            "required",
            "snapshot",
          ]
            .sort()
            .join(","),
        400,
      );
      requireContext(
        sameCareValue(input.required, required) &&
          input.boundaryKey === boundary!.key,
        400,
      );
      const approve = readGuidanceCommand({
        schemaVersion: 1,
        action: "approve_guidance_v1",
        requestId: owner,
        target: input.target,
        publisher: input.publisher,
        scope: input.scope,
      });
      requireContext(approve.action === "approve_guidance_v1", 400);
      const pub = readReviewCommand({
        schemaVersion: 1,
        action: "read_advisor_publication_v3",
        clientId: input.selection.clientId,
        version: input.selection.publicationVersion,
      });
      requireContext(pub.action === "read_advisor_publication_v3", 400);
      requireContext(
        Object.keys(input.selection).sort().join(",") ===
          "clientId,draftId,kind,publicationVersion",
        400,
      );
      requireContext(
        input.selection.draftId === approve.target.draftId &&
          input.selection.kind === approve.target.kind &&
          pub.clientId === approve.target.clientId,
        400,
      );
      requireContext(approve.publisher.actorId === owner, 403);
      const snap = readReviewCommand({
        schemaVersion: 1,
        action: "read_advisor_instruction_manifest_v1",
        clientId: pub.clientId,
        snapshot: input.snapshot,
        cursor: null,
        limit: 1,
      });
      requireContext(
        snap.action === "read_advisor_instruction_manifest_v1",
        400,
      );
      return freeze(
        structuredClone({
          ...input,
          target: approve.target,
          publisher: approve.publisher,
          scope: approve.scope,
          snapshot: snap.snapshot,
        }),
      );
    } catch (error) {
      if (error instanceof TransportError) throw error;
      throw new TransportError(400);
    }
  }
  return {
    async read(input, options = {}) {
      guard();
      if (runtime.cookie.status !== "ready") throw new TransportError(503);
      const request = parse(input),
        own = ++sequence,
        caps = cookieCaps();
      const check = () => {
        guard(own, caps);
        if (options.signal?.aborted) throw new TransportError(503);
        requireContext(request.snapshot.asOfDay === today());
      };
      check();
      async function policy() {
        check();
        const command = readPlanCommand({
            schemaVersion: 1,
            action: "read_policy_v1",
          }),
          invoke = advisorCookieRequest("plans", runtime.cookie);
        const result = await runtime.transport
          .bind({
            kind: "read",
            decode: (v) => mapPlanResult(v, command),
            invoke: async (value, opts) => {
              check();
              return invoke(value, opts);
            },
          })
          .execute(command, options);
        check();
        requireContext("ownerActorId" in result);
        return result as PlanPolicyView;
      }
      async function directory() {
        check();
        const command = { action: "advisor_list" } as const;
        buildConciergeRpc(command, owner!);
        const invoke = advisorCookieRequest("operations", runtime.cookie);
        const result = await runtime.transport
          .bind({
            kind: "read",
            decode: mapConciergeAdvisorDirectory,
            invoke: async (value, opts) => {
              check();
              return invoke(value, opts);
            },
          })
          .execute(command, options);
        check();
        const matches = result.clients.filter(
          (c) => c.clientId === request.selection.clientId,
        );
        requireContext(
          matches.length === 1 && matches[0]!.enrollmentStatus !== "revoked",
          403,
        );
        requireContext(
          result.capabilities.view && result.capabilities.edit,
          403,
        );
        return { capabilities: result.capabilities, client: matches[0]! };
      }
      try {
        const firstPolicy = await policy();
        check();
        const firstDirectory = await directory();
        check();
        const value = await raw.guidance.execute(
          {
            schemaVersion: 1,
            action: "read_guidance_draft_v1",
            draftId: request.target.draftId,
          },
          options,
        );
        check();
        requireContext("target" in value && "body" in value);
        const draft = value as GuidanceDraftView;
        requireContext(
          sameCareValue(draft.target, request.target) &&
            draft.body.kind === request.target.kind &&
            sameCareValue(draft.body.publication, request.snapshot.publication),
        );
        const view = await raw.review.execute(
          {
            schemaVersion: 1,
            action: "read_advisor_publication_v3",
            clientId: request.selection.clientId,
            version: request.selection.publicationVersion,
          },
          options,
        );
        check();
        requireContext("currentGuidance" in view && "clientId" in view);
        const publication = view as AdvisorPublicationViewV3;
        requireContext(
          publication.clientId === request.target.clientId &&
            sameCareValue(
              publication.currentGuidance.snapshot,
              request.snapshot,
            ) &&
            sameCareValue(
              request.snapshot.publication,
              request.snapshot.currentPublication,
            ) &&
            request.snapshot.asOfDay === today(),
        );
        requireContext(
          firstDirectory.client.publishedVersion ===
            request.snapshot.currentPublication.version,
        );
        // Multi-channel reads are not a transaction. Detect changes observed during
        // the composition, then leave the final live write fence to the backend.
        const finalDraft = await raw.guidance.execute(
          {
            schemaVersion: 1,
            action: "read_guidance_draft_v1",
            draftId: request.target.draftId,
          },
          options,
        );
        check();
        requireContext(sameCareValue(draft, finalDraft));
        const finalView = await raw.review.execute(
          {
            schemaVersion: 1,
            action: "read_advisor_publication_v3",
            clientId: request.selection.clientId,
            version: request.selection.publicationVersion,
          },
          options,
        );
        check();
        requireContext(sameCareValue(publication, finalView));
        const finalPolicy = await policy();
        check();
        const finalDirectory = await directory();
        check();
        requireContext(
          sameCareValue(firstPolicy, finalPolicy) &&
            sameCareValue(firstDirectory, finalDirectory),
        );
        const result = freeze({
          request,
          actorId: owner!,
          policy: finalPolicy,
          ...finalDirectory,
          draft,
          publication,
        });
        check();
        issued.set(result, { sequence: own, capabilities: caps });
        return result;
      } catch (error) {
        check();
        if (error instanceof TransportError) throw error;
        throw new TransportError(503);
      }
    },
    isCurrent(context) {
      const captured = issued.get(context);
      return (
        !!captured &&
        live() &&
        captured.sequence === sequence &&
        captured.capabilities === cookieCaps() &&
        runtime.cookie.status === "ready" &&
        context.request.snapshot.asOfDay === today()
      );
    },
    invalidate() {
      sequence++;
    },
    dispose() {
      disposed = true;
      sequence++;
      raw.dispose();
    },
  };
}
