import type {
  AdvisorPublicationViewV2,
  DraftDependenciesView,
  UseHistoryPage,
  ProductRef,
  ReportedProductBody,
} from "../../../../../src/contracts/PortalCare.ts";
import type {
  AdvisorDependencyReview,
  AdvisorPlanIdentityDocument,
} from "./types.ts";

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
  family: "report" | "instruction" | "legacy_context" | "reported_products";
  message: string;
};
export function missingReportedProductsReader(
  publication: AdvisorPublicationViewV2 | null,
): MissingDependencyReader[] {
  return publication?.use.reportedProducts.nextCursor != null
    ? [
        {
          family: "reported_products",
          message:
            "more current reported products are unavailable to this advisor reader. complete current states are required before updating the draft basis; full history does not replace them.",
        },
      ]
    : [];
}

export function planIdentityDocument(
  plan: AdvisorPublicationViewV2["plan"],
): AdvisorPlanIdentityDocument {
  return {
    version: plan.version,
    documentSchemaVersion: plan.documentSchemaVersion,
    products: plan.content.products.map(
      ({ id, name, brand, variant, strength, sizeLabel }) => ({
        id,
        name,
        brand,
        variant,
        strength,
        sizeLabel,
      }),
    ),
    slots: [
      ...plan.content.routine
        .filter((step) => step.productId !== null)
        .map((step) => ({
          slotId: step.slotId,
          productIds: [step.productId!],
          label: [
            step.schedule.periods.join("/"),
            step.title || `slot ${step.slotId}`,
          ]
            .filter(Boolean)
            .join(": "),
        })),
      ...plan.content.decisions.map((decision) => ({
        slotId: decision.slotId,
        productIds: [
          ...new Set([
            ...decision.currentProductIds,
            ...decision.alternativeProductIds,
            ...(decision.primaryProductId ? [decision.primaryProductId] : []),
          ]),
        ],
        label: `${decision.kind.replaceAll("_", " ")} · slot ${decision.slotId}`,
      })),
    ],
  };
}
export const dependencyProductKey = (p: ProductRef): string =>
  JSON.stringify(
    p.kind === "plan_product"
      ? [
          p.kind,
          p.publication.version,
          p.publication.documentSchemaVersion,
          p.productId,
          p.slotId,
        ]
      : [p.kind, p.reportedProductId, p.version],
  );
export function dependencyProductRefs(
  review: Pick<AdvisorDependencyReview, "publication" | "history">,
): ProductRef[] {
  const refs = new Map<string, ProductRef>(),
    add = (p: ProductRef | null | undefined) => {
      if (p) refs.set(dependencyProductKey(p), p);
    };
  const use = (
    e:
      | NonNullable<
          AdvisorPublicationViewV2["use"]["planProducts"][number]["latestEvent"]
        >
      | import("../../../../../src/contracts/PortalCare.ts").AttributedUseEvent
      | null,
  ) => {
    if (!e) return;
    add(e.product);
    add(
      e.amendment &&
        ("replacement" in e.amendment
          ? e.amendment.replacement.product
          : e.amendment.product),
    );
  };
  if (review.publication)
    for (const row of [
      ...review.publication.use.planProducts,
      ...review.publication.use.reportedProducts.items,
    ]) {
      add(row.product);
      use(row.latestEvent);
      if (row.identity) {
        add(row.identity.target.subject);
        add(row.identity.target.comparedWith);
      }
    }
  for (const entry of review.history) {
    if (entry.kind === "use") use(entry.event);
    else if (entry.kind === "amendment")
      add(entry.amendment.replacement.product);
    else if (entry.kind === "identity") {
      add(entry.event.target.subject);
      add(entry.event.target.comparedWith);
    } else {
      add(entry.event.product);
      use(entry.event.initialUse);
    }
  }
  return [...refs.values()];
}
export type DependencyProductIdentity = {
  resolved: boolean;
  label: string;
  details: string[];
  reason?: string;
};
export function dependencyProductIdentity(
  product: ProductRef,
  review: AdvisorDependencyReview | null,
): DependencyProductIdentity {
  const unresolved = (reason: string): DependencyProductIdentity => ({
    resolved: false,
    details: [],
    reason,
    label:
      product.kind === "plan_product"
        ? `unresolved plan product ${product.productId} · plan version ${product.publication.version} · document format ${product.publication.documentSchemaVersion}${product.slotId === null ? "" : ` · slot ${product.slotId}`}`
        : `unresolved client-reported product ${product.reportedProductId} · description version ${product.version}`,
  });
  if (!review) return unresolved("the exact product identity is unavailable.");
  if (product.kind === "plan_product") {
    const document =
      review.documents?.[product.publication.version] ??
      (review.publication?.plan.version === product.publication.version
        ? planIdentityDocument(review.publication.plan)
        : undefined);
    if (!document)
      return unresolved(
        "the original plan identity could not be read in this context. no current product name has been substituted.",
      );
    if (
      document.version !== product.publication.version ||
      document.documentSchemaVersion !==
        product.publication.documentSchemaVersion
    )
      return unresolved(
        "the referenced document format or version does not match the available plan.",
      );
    const p = document.products.find((p) => p.id === product.productId);
    if (!p)
      return unresolved(
        "this exact product is absent from the referenced plan.",
      );
    const slot =
      product.slotId === null
        ? null
        : document.slots.find(
            (s) =>
              s.slotId === product.slotId &&
              s.productIds.includes(product.productId),
          );
    if (product.slotId !== null && !slot)
      return unresolved(
        "this exact product and slot are absent from the referenced plan.",
      );
    const descriptor = [
      p.brand,
      p.variant,
      p.strength.state === "known" ? p.strength.value : null,
      p.sizeLabel,
    ].filter((v): v is string => !!v);
    const duplicate = document.products.some(
      (other) =>
        other.id !== p.id &&
        other.name === p.name &&
        other.brand === p.brand &&
        other.variant === p.variant &&
        JSON.stringify(other.strength) === JSON.stringify(p.strength) &&
        other.sizeLabel === p.sizeLabel,
    );
    return {
      resolved: true,
      label: [
        p.name,
        ...descriptor.filter((v) => !p.name.includes(v)),
        `plan version ${document.version}`,
        slot?.label,
        duplicate ? `reference ${p.id}` : null,
      ]
        .filter(Boolean)
        .join(" · "),
      details: [],
    };
  }
  const descriptors = new Map<
    string,
    {
      ref: Extract<ProductRef, { kind: "client_reported_product" }>;
      descriptor: ReportedProductBody;
    }
  >();
  for (const row of review.publication?.use.reportedProducts.items ?? [])
    descriptors.set(dependencyProductKey(row.product), {
      ref: row.product,
      descriptor: row.descriptor,
    });
  for (const entry of review.history)
    if (entry.kind === "reported_product")
      descriptors.set(dependencyProductKey(entry.event.product), {
        ref: entry.event.product,
        descriptor: entry.event.descriptor,
      });
  const found = descriptors.get(dependencyProductKey(product));
  if (!found)
    return unresolved(
      "this exact reported-product description is unavailable; another description version has not been substituted.",
    );
  const d = found.descriptor,
    duplicate = [...descriptors.entries()].some(
      ([key, x]) =>
        key !== dependencyProductKey(product) && x.descriptor.name === d.name,
    );
  return {
    resolved: true,
    label:
      d.name +
      (duplicate
        ? ` · description version ${product.version} · reference ${product.reportedProductId}`
        : ""),
    details: [`description version ${product.version}`],
  };
}
export function dependencyUnavailable(
  review: AdvisorDependencyReview,
): string[] {
  const unavailable = [
    ...(review.view ? missingDependencyReaders(review.view) : []).map(
      (x) => x.message,
    ),
    ...missingReportedProductsReader(review.publication).map((x) => x.message),
  ];
  if (
    review.view?.current.legacyBasis.publicationVersion === null &&
    review.view.current.useHead !== 0
  )
    unavailable.push(
      "current use has no available publication context. updating the basis is blocked.",
    );
  if (
    dependencyProductRefs(review).some(
      (ref) => !dependencyProductIdentity(ref, review).resolved,
    )
  )
    unavailable.push(
      "some referenced product identities are unavailable. review their exact plan or product description before updating the draft basis.",
    );
  return unavailable;
}
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
