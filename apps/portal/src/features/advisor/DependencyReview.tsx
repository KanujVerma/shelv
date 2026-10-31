import type { Known } from "../../../../../src/contracts/PortalRebuild.ts";
import type {
  AttributedUseEvent,
  EffectiveUse,
  ProductRef,
  UseChange,
  UseHistoryEntry,
} from "../../../../../src/contracts/PortalCare.ts";
import { Panel } from "../../shell/PortalShell.tsx";
import { Button, Field, Select, StatusNotice } from "../../ui/index.ts";
import { useLabels } from "../plan/UseFacts.tsx";
import { Disclosure } from "./fields.tsx";
import type { AdvisorController, AdvisorState } from "./types.ts";

const known = (value: Known<string>) =>
  value.state === "known" ? value.value : "not known";
function Change({ change }: { change: UseChange }) {
  return (
    <>
      <p>
        {change.kind === "different"
          ? "using differently"
          : change.kind.replaceAll("_", " ")}
      </p>
      {"details" in change && change.details ? <p>{change.details}</p> : null}
      {change.kind === "different" ? (
        <>
          <p>frequency: {known(change.frequency)}</p>
          <p>amount: {known(change.amount)}</p>
        </>
      ) : null}
    </>
  );
}
function correctionActor(
  actor: string,
  original: Pick<AttributedUseEvent, "reportedBy" | "recordedBy"> | undefined,
  clientId: string,
) {
  if (actor === clientId) return "correction by client";
  return original &&
    original.recordedBy !== original.reportedBy &&
    actor !== original.recordedBy
    ? "correction by another advisor"
    : "correction by advisor";
}
function productName(product: ProductRef, state: AdvisorState) {
  const publication = state.dependencies?.publication;
  if (product.kind === "plan_product")
    return (
      (publication?.version === product.publication.version
        ? publication.plan.content.products.find(
            (p) => p.id === product.productId,
          )?.name
        : null) ?? `product in plan version ${product.publication.version}`
    );
  return reportedName(product, state);
}
function reportedName(
  product: Extract<ProductRef, { kind: "client_reported_product" }>,
  state: AdvisorState,
) {
  const entry = state.dependencies?.history.find(
    (e) =>
      e.kind === "reported_product" &&
      e.event.product.reportedProductId === product.reportedProductId &&
      e.event.product.version === product.version,
  );
  if (entry?.kind === "reported_product") return entry.event.descriptor.name;
  return (
    state.dependencies?.publication?.use.reportedProducts.items.find(
      (p) =>
        p.product.reportedProductId === product.reportedProductId &&
        p.product.version === product.version,
    )?.descriptor.name ?? "client-reported product"
  );
}
function OriginalUse({
  event,
  state,
}: {
  event: AttributedUseEvent;
  state: AdvisorState;
}) {
  return (
    <>
      <h4>{productName(event.product, state)} · original report</h4>
      <Change change={event.change} />
      <p>
        reported by client
        {event.recordedBy !== event.reportedBy ? " · recorded by advisor" : ""}{" "}
        · {event.channel.replaceAll("_", " ")} ·{" "}
        {event.occurredOn.state === "known"
          ? `occurred ${event.occurredOn.value}`
          : "occurred date not known"}{" "}
        · recorded {event.recordedAt}
      </p>
      <p>acquisition: {event.acquisition.replaceAll("_", " ")}</p>
      {event.amendment ? (
        <>
          <h4>current correction</h4>
          <p>{event.amendment.reason}</p>
          <p>{productName(event.amendment.replacement.product, state)}</p>
          <Change change={event.amendment.replacement.change} />
          <p>
            {correctionActor(
              event.amendment.amendedBy,
              event,
              state.view!.draft.clientId!,
            )}{" "}
            · corrected occurred date{" "}
            {known(event.amendment.replacement.occurredOn)} · recorded{" "}
            {event.amendment.amendedAt}
          </p>
        </>
      ) : null}
    </>
  );
}
function CurrentUse({
  use,
  state,
}: {
  use: EffectiveUse;
  state: AdvisorState;
}) {
  const event = use.latestEvent;
  return (
    <section>
      <h3>
        {productName(use.product, state)} · {useLabels[use.state]}
      </h3>
      {use.contradiction ? (
        <StatusNotice
          tone="warning"
          title="product or reports need clarification"
        >
          current use and identity are unresolved. published guidance remains
          separate.
        </StatusNotice>
      ) : null}
      {use.identity ? (
        <p>
          client-reported product match:{" "}
          {use.identity.match.replaceAll("_", " ")}. this does not verify the
          formula.
        </p>
      ) : null}
      <p>reported original start: {known(use.originalStart)}</p>
      {event ? (
        <p>
          reported by client
          {event.recordedBy !== event.reportedBy
            ? " · recorded by advisor"
            : ""}{" "}
          · {event.channel.replaceAll("_", " ")} · occurred date{" "}
          {known(event.occurredOn)} · recorded {event.recordedAt}
        </p>
      ) : null}
      {event?.amendment ? (
        <p>
          {correctionActor(
            event.amendment.amendedBy,
            event,
            state.view!.draft.clientId!,
          )}{" "}
          · corrected occurred date {known(event.amendment.occurredOn)} ·
          recorded {event.amendment.amendedAt}
        </p>
      ) : null}
    </section>
  );
}
function HistoryEntry({
  entry,
  state,
}: {
  entry: UseHistoryEntry;
  state: AdvisorState;
}) {
  if (entry.kind === "use")
    return <OriginalUse event={entry.event} state={state} />;
  if (entry.kind === "identity") {
    const e = entry.event;
    return (
      <>
        <h4>{productName(e.target.subject, state)} · identity report</h4>
        <p>product match: {e.answer.match.replaceAll("_", " ")}</p>
        {e.answer.reportedName ? <p>{e.answer.reportedName}</p> : null}
        <p>
          variant: {known(e.answer.variant)} · strength:{" "}
          {known(e.answer.strength)}
        </p>
        <p>
          reported by client
          {e.recordedBy !== e.reportedBy ? " · recorded by advisor" : ""} ·{" "}
          {e.channel.replaceAll("_", " ")} · occurred date {known(e.occurredOn)}{" "}
          · recorded {e.recordedAt}
        </p>
        <p>a reported match does not verify the formula.</p>
      </>
    );
  }
  if (entry.kind === "reported_product") {
    const e = entry.event,
      d = e.descriptor;
    return (
      <>
        <h4>
          {d.name} ·{" "}
          {e.previousVersion === null
            ? "reported product"
            : "product description correction"}
        </h4>
        <p>
          brand: {known(d.brand)} · variant: {known(d.variant)} · strength:{" "}
          {known(d.strength)} · size: {known(d.sizeLabel)}
        </p>
        <p>
          reported by client
          {e.recordedBy !== e.reportedBy ? " · recorded by advisor" : ""} ·{" "}
          {e.channel.replaceAll("_", " ")} · occurred date {known(e.occurredOn)}{" "}
          · recorded {e.recordedAt}
        </p>
        {e.reason ? <p>{e.reason}</p> : null}
        {e.initialUse ? (
          <OriginalUse event={e.initialUse} state={state} />
        ) : null}
      </>
    );
  }
  const a = entry.amendment;
  const original = state.dependencies?.history
    .flatMap((e) =>
      e.kind === "use"
        ? [e.event]
        : e.kind === "reported_product" && e.event.initialUse
          ? [e.event.initialUse]
          : [],
    )
    .find((e) => e.eventId === a.eventId);
  return (
    <>
      <h4>
        reported-use correction · {productName(a.replacement.product, state)}
      </h4>
      <p>{a.reason}</p>
      <Change change={a.replacement.change} />
      <p>
        {correctionActor(a.amendedBy, original, state.view!.draft.clientId!)} ·
        occurred date {known(a.replacement.occurredOn)} · recorded {a.amendedAt}
      </p>
    </>
  );
}

export function DependencyReview({
  controller: c,
  state: s,
}: {
  controller: AdvisorController;
  state: AdvisorState;
}) {
  if (!c.hasDependencies) return null;
  if (!s.view?.target)
    return (
      <StatusNotice title="client information will be available after assignment">
        prepare this draft without creating a client account. assign the
        intended client before reviewing their reports.
      </StatusNotice>
    );
  const current = c.dependencyReviewCurrent(),
    r = current ? s.dependencies : null,
    pending = s.pending?.action === "rebase_draft_dependencies_v1";
  const available = current && r?.status === "ready",
    changed = r?.view?.needsRebase;
  return (
    <Panel>
      <h2>current client information</h2>
      <StatusNotice
        tone={available && !changed ? "success" : "warning"}
        title={
          pending
            ? "draft basis update awaiting confirmation"
            : changed
              ? "current client information changed"
              : available
                ? "draft basis is current"
                : r?.status === "loading"
                  ? "reading current client information"
                  : "current client information not confirmed"
        }
      >
        {changed
          ? "review the current reports and corrections before updating this draft. saving text does not accept these changes."
          : "publication requires confirmed current information and reviewed sections."}
      </StatusNotice>
      {r?.publication ? (
        <>
          <p>
            client care access:{" "}
            {r.publication.clientAccess.care.replaceAll("_", " ")}. this advisor
            read does not grant the client access.
          </p>
          {r.publication.use.planProducts.map((use) => (
            <CurrentUse key={use.product.productId} use={use} state={s} />
          ))}
          {r.publication.use.reportedProducts.items.map((use) => (
            <CurrentUse
              key={use.product.reportedProductId}
              use={use}
              state={s}
            />
          ))}
        </>
      ) : null}
      {r?.history.length ? (
        <Disclosure title="reports, product identity & corrections">
          {r.history.map((entry, index) => (
            <section key={index}>
              <HistoryEntry entry={entry} state={s} />
            </section>
          ))}
        </Disclosure>
      ) : available ? (
        <p>no use reports in this history.</p>
      ) : null}
      {r?.unavailable.map((message) => (
        <p role="status" key={message}>
          {message}
        </p>
      ))}
      {r?.nextCursor ? (
        <>
          <p>more reports need review before updating the draft basis.</p>
          <Button
            variant="secondary"
            disabled={!current || s.busy || !!s.pending}
            onClick={() => void c.loadDependencyHistory()}
          >
            load more client reports
          </Button>
        </>
      ) : null}
      <Button
        variant="secondary"
        disabled={s.busy || !!s.pending || c.dirty() || r?.status === "loading"}
        onClick={() => void c.inspectDependencies()}
      >
        refresh current client information
      </Button>
      {changed && c.permissions.edit ? (
        <>
          <Field label="review current reports and corrections">
            <Select
              value={r?.acknowledged && current ? "reviewed" : "not_reviewed"}
              disabled={
                !available ||
                !!r?.nextCursor ||
                s.busy ||
                !!s.pending ||
                c.dirty()
              }
              options={[
                { value: "not_reviewed", label: "not yet reviewed" },
                {
                  value: "reviewed",
                  label: "i reviewed this current information",
                },
              ]}
              onValueChange={(v) => c.acknowledgeDependencies(v === "reviewed")}
            />
          </Field>
          <p>
            updating the basis keeps the draft text. review the affected
            sections again and approve the exact new version before publishing.
          </p>
          <Button
            disabled={!c.canRebaseDependencies()}
            busy={s.busy && pending}
            onClick={() => void c.rebaseDependencies()}
          >
            update draft basis
          </Button>
        </>
      ) : null}
    </Panel>
  );
}
