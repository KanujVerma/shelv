import type {
  AdvisorPublicationViewV2,
  DraftDependenciesView,
  UseHistoryPage,
} from "../../../../../src/contracts/PortalCare.ts";

export function assertDependencyHistoryClient(
  page: UseHistoryPage,
  clientId: string,
) {
  for (const entry of page.entries) {
    if (entry.kind !== "amendment" && entry.event.reportedBy !== clientId)
      throw Error("wrong_client_report");
    if (
      entry.kind === "reported_product" &&
      entry.event.initialUse &&
      entry.event.initialUse.reportedBy !== clientId
    )
      throw Error("wrong_client_report");
  }
}
export function assertDependencyUseClient(
  view: AdvisorPublicationViewV2,
  clientId: string,
) {
  if (view.clientId !== clientId) throw Error("wrong_client_publication");
  for (const use of [
    ...view.use.planProducts,
    ...view.use.reportedProducts.items,
  ]) {
    if (
      (use.latestEvent && use.latestEvent.reportedBy !== clientId) ||
      (use.identity && use.identity.reportedBy !== clientId)
    )
      throw Error("wrong_client_report");
  }
}

/** Requirements for future readers, not invented Report/Guidance wire DTOs. */
export type MissingDependencyReader = {
  family: "report" | "instruction" | "legacy_context";
  message: string;
};
export function missingDependencyReaders(
  view: DraftDependenciesView,
): MissingDependencyReader[] {
  const { captured: a, current: b } = view,
    missing: MissingDependencyReader[] = [];
  if (a.reportHead !== b.reportHead)
    missing.push({
      family: "report",
      message:
        "changed client reports are unavailable here. review their content before updating the draft basis.",
    });
  if (a.instructionHead !== b.instructionHead)
    missing.push({
      family: "instruction",
      message:
        "changed instructions are unavailable here. review their content before updating the draft basis.",
    });
  // The retained manifest also covers intake/baselines. A hash and the public
  // use overlay cannot establish which of those private facts changed.
  if (
    a.legacyBasisManifestHash !== b.legacyBasisManifestHash ||
    a.legacyBasis.publicationVersion !== b.legacyBasis.publicationVersion ||
    a.legacyBasis.useRevision !== b.legacyBasis.useRevision
  )
    missing.push({
      family: "legacy_context",
      message:
        "the publication, intake or baseline changed. its complete current context is unavailable here; updating the basis is blocked.",
    });
  if (JSON.stringify(a.references) !== JSON.stringify(b.references))
    missing.push({
      family: "report",
      message:
        "linked client information changed. its complete content is unavailable here; updating the basis is blocked.",
    });
  return missing;
}
