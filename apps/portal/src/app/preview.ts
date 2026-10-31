import type { DraftView } from "../../../../src/contracts/PortalRebuild.ts";
import type { PlanPreview } from "../../../../src/contracts/PortalRebuildMapping.ts";
import { readUnpublishedPreview } from "../features/plan/preview.ts";
import type { PlanPreviewSource } from "../features/plan/preview.ts";
export interface PreviewRecord {
  preview: PlanPreview;
  source: PlanPreviewSource;
  sessionKey: string;
}
/** The null-target wire response has no draft/revision identity. Bind it to the
 * captured command and the actual nested DraftView, never to null alone. */
export function bindPreview(
  preview: PlanPreview,
  draft: DraftView,
  request: Omit<PlanPreviewSource, "target">,
  sessionKey: string,
): PreviewRecord {
  if (
    draft.draft.id !== request.draftId ||
    draft.draft.contentRevision !== request.contentRevision ||
    draft.draft.assignmentRevision !== request.assignmentRevision
  )
    throw Error("stale_preview");
  const source: PlanPreviewSource = {
    draftId: draft.draft.id,
    contentRevision: draft.draft.contentRevision,
    assignmentRevision: draft.draft.assignmentRevision,
    target: draft.target,
  };
  const decoded = readUnpublishedPreview(preview, source);
  return { preview: decoded.preview, source: decoded.source, sessionKey };
}

import type { AdvisorPorts } from "../features/advisor/types.ts";
import type { PlanSessionBoundary } from "../features/plan/types.ts";
import { mapPlanResult } from "../../../../src/contracts/PortalRebuildMapping.ts";
/** Refresh/direct entry never reuses a receipt or invents draft identity. A
 * second read rejects a concurrent source-basis change, including unassigned. */
export async function loadPreview(
  plans: AdvisorPorts["plans"],
  draftId: string,
  session: PlanSessionBoundary,
  options?: { signal?: AbortSignal },
): Promise<PreviewRecord> {
  const read = {
    schemaVersion: 1 as const,
    action: "read_draft_v1" as const,
    draftId,
  };
  const draft = mapPlanResult(
    await plans.execute(read, options),
    read,
  ) as DraftView;
  const request = {
    draftId: draft.draft.id,
    contentRevision: draft.draft.contentRevision,
    assignmentRevision: draft.draft.assignmentRevision,
  };
  const command = {
    schemaVersion: 1 as const,
    action: "preview_draft_v1" as const,
    ...request,
  };
  const preview = mapPlanResult(
    await plans.execute(command, options),
    command,
  ) as PlanPreview;
  const latest = mapPlanResult(
    await plans.execute(read, options),
    read,
  ) as DraftView;
  if (
    !session.isCurrent() ||
    options?.signal?.aborted ||
    JSON.stringify(latest) !== JSON.stringify(draft)
  )
    throw Error("stale_preview");
  return bindPreview(preview, draft, request, session.key);
}
