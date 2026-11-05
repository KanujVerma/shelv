import type {
  Approval,
  DraftView,
  ExactTarget,
  PlanContent,
  SectionId,
} from "../../../../../src/contracts/PortalRebuild.ts";
import { planSections } from "../../../../../src/contracts/PortalRebuild.ts";
import type { AdvisorGateContext, AdvisorPayments } from "./types.ts";

export function sameTarget(
  a: ExactTarget | null | undefined,
  b: ExactTarget | null | undefined,
): boolean {
  return (
    !!a &&
    !!b &&
    a.draftId === b.draftId &&
    a.clientId === b.clientId &&
    a.contentRevision === b.contentRevision &&
    a.assignmentRevision === b.assignmentRevision &&
    a.contentHash === b.contentHash
  );
}
export const sameContent = (a: PlanContent | null, b: PlanContent | null) =>
  JSON.stringify(a) === JSON.stringify(b);
export function sameDraft(a: DraftView, b: DraftView): boolean {
  return (
    a.draft.id === b.draft.id &&
    a.draft.clientId === b.draft.clientId &&
    a.draft.contentRevision === b.draft.contentRevision &&
    a.draft.assignmentRevision === b.draft.assignmentRevision &&
    a.draft.contentHash === b.draft.contentHash
  );
}
/** Finite wire shape and internally consistent identity are separate checks. */
export function assertDraft(view: DraftView): DraftView {
  const d = view.draft,
    expected = d.clientId
      ? {
          draftId: d.id,
          clientId: d.clientId,
          contentRevision: d.contentRevision,
          assignmentRevision: d.assignmentRevision,
          contentHash: d.contentHash,
        }
      : null;
  if (expected ? !sameTarget(expected, view.target) : view.target !== null)
    throw Error("invalid_draft_target");
  if (
    new Set(view.sections.map((s) => s.sectionId)).size !== view.sections.length
  )
    throw Error("invalid_sections");
  return view;
}
export function exactApproval(
  approval: Approval | null | undefined,
  target: ExactTarget | null,
  actorId: string,
): boolean {
  return (
    !!approval &&
    sameTarget(approval, target) &&
    approval.scope === "care_plan.publish" &&
    approval.revokedAt === null &&
    approval.publicationReceiptId === null &&
    approval.publisher.kind === "human" &&
    approval.publisher.actorId === actorId
  );
}
export function reviewed(view: DraftView): boolean {
  return planSections.every((id) =>
    view.sections.some((s) => s.sectionId === id && s.reviewed),
  );
}
/** Match the applicable persisted quote/claim, never a submitted screenshot or product-only receipt. */
export function firstServiceClaim(payments: AdvisorPayments) {
  return (
    payments.claims.find((c) => {
      const q = payments.quotes.find(
        (q) => q.id === c.quoteId && q.version === c.quoteVersion,
      );
      return (
        c.status === "confirmed" &&
        !!q &&
        q.status !== "superseded" &&
        q.publicationVersion === 0 &&
        q.serviceCents > 0 &&
        c.serviceCents === q.serviceCents &&
        c.productCents === q.productTotalCents &&
        c.totalCents === q.totalCents &&
        c.shippingAddressVersion === q.shippingAddressVersion
      );
    }) ?? null
  );
}
export function paymentReady(context: AdvisorGateContext | null): boolean {
  return (
    !!context &&
    (context.publication === "first"
      ? context.payments.service.status === "pending_publication" &&
        !!firstServiceClaim(context.payments)
      : context.publication === "later" && context.coverage === "active")
  );
}
export const sectionLabels: Record<SectionId, string> = {
  sources: "sources",
  context: "client context",
  decisions: "decisions",
  routine: "routine",
  follow_up: "follow-up",
};
/** Plain values for the explicit compare screen; never interprets source text as code or instructions. */
export function contentDiff(
  base: PlanContent,
  proposed: PlanContent,
): { path: string; before: unknown; after: unknown }[] {
  const result: { path: string; before: unknown; after: unknown }[] = [];
  for (const key of Object.keys(proposed) as (keyof PlanContent)[])
    if (JSON.stringify(base[key]) !== JSON.stringify(proposed[key]))
      result.push({ path: key, before: base[key], after: proposed[key] });
  return result;
}
