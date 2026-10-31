import { Badge } from "../../../ui/index.ts";
import { GuidanceBodyText } from "./GuidanceEditor.tsx";
import type {
  AdvisorCareHistoryEntry,
  ConversationBody,
  ReportEvent,
  ReportReplacement,
} from "../../../../../../src/contracts/PortalReview.ts";
import type {
  Known,
  SourceLocation,
} from "../../../../../../src/contracts/PortalRebuild.ts";
import type {
  UseReplacement,
  AttributedUseEvent,
  ProductRef,
} from "../../../../../../src/contracts/PortalCare.ts";
import { guidanceHistoryKey } from "./evidence.ts";
export const occurred = (value: Known<string>) =>
  value.state === "known" ? value.value : "occurred date not known";
function Sources({ sources }: { sources: SourceLocation[] }) {
  return sources.length ? (
    <ul aria-label="private source references">
      {sources.map((source, index) => (
        <li key={index}>
          {source.sourceId} · version {source.sourceVersion} ·{" "}
          {source.locator.kind === "whole"
            ? "whole source"
            : source.locator.kind === "page"
              ? `page ${source.locator.page}`
              : source.locator.kind === "text"
                ? `text ${source.locator.start} to ${source.locator.end}`
                : `time ${source.locator.startMs} to ${source.locator.endMs} ms`}
        </li>
      ))}
    </ul>
  ) : (
    <p className="advisor-guidance-meta">no source location recorded</p>
  );
}
export function ConversationText({ body }: { body: ConversationBody }) {
  return (
    <div className="advisor-guidance-fields">
      <p>
        {body.channel.replaceAll("_", " ")} · {occurred(body.occurredOn)} ·
        publication {body.publication.version}
      </p>
      {(
        [
          { label: "client-reported facts", facts: body.clientReported },
          { label: "advisor conclusions", facts: body.advisorConclusions },
          { label: "agent proposals", facts: body.agentProposals },
        ] as const
      ).map((group) => (
        <section key={group.label}>
          <h3>{group.label}</h3>
          {group.facts.length ? (
            group.facts.map((fact) => (
              <div key={fact.id}>
                <p>{fact.text}</p>
                <p className="advisor-guidance-meta">
                  fact {fact.id}
                  {"proposedBy" in fact
                    ? ` · proposed by ${fact.proposedBy.state === "known" ? fact.proposedBy.value : "not recorded"}`
                    : ""}
                </p>
                <Sources sources={fact.sources} />
              </div>
            ))
          ) : (
            <p>none recorded</p>
          )}
        </section>
      ))}
      {body.contradictions.length ? (
        <section>
          <h3>unresolved contradictions</h3>
          {body.contradictions.map((conflict, index) => (
            <div key={index}>
              <p>
                {conflict.left.kind.replaceAll("_", " ")} {conflict.left.id} /{" "}
                {conflict.right.kind.replaceAll("_", " ")} {conflict.right.id}
              </p>
              <p>{conflict.note}</p>
            </div>
          ))}
        </section>
      ) : null}
    </div>
  );
}
export function ReportText({
  report,
}: {
  report: ReportEvent | ReportReplacement;
}) {
  return (
    <div className="advisor-guidance-fields">
      {report.kind === "goal_report" ? (
        <>
          <p>publication {report.body.publication.version}</p>
          {report.body.answers.map((answer) => (
            <p key={answer.goalId}>
              goal {answer.goalId}: {answer.change.replaceAll("_", " ")}
            </p>
          ))}
          {report.body.answers.length === 0 ? (
            <p>goal answers not recorded</p>
          ) : null}
          <p>comfort: {report.body.comfort ?? "not recorded"}</p>
          <p>notes: {report.body.notes ?? "not recorded"}</p>
          {report.body.actualUseEventIds.map((id) => (
            <p key={id}>reported use event {id}</p>
          ))}
        </>
      ) : (
        <>
          <p>comfort: {report.body.comfort}</p>
          <p>consistency: {report.body.consistency}</p>
          <p>changes: {report.body.changes || "none recorded"}</p>
        </>
      )}
      {report.body.photoIds.length ? (
        <p>
          {report.body.photoIds.length} photo references recorded. photo viewing
          is unavailable here.
        </p>
      ) : (
        <p className="advisor-guidance-meta">no photos attached</p>
      )}
    </div>
  );
}
function productLabel(product: ProductRef) {
  return product.kind === "plan_product"
    ? `product ${product.productId} · publication ${product.publication.version} · ${product.slotId ?? "no slot"}`
    : `reported product ${product.reportedProductId} · descriptor version ${product.version}`;
}
function UseText({ event }: { event: UseReplacement }) {
  return (
    <div>
      <p>{productLabel(event.product)}</p>
      <p>
        {event.change.kind.replaceAll("_", " ")} · {occurred(event.occurredOn)}{" "}
        · acquisition {event.acquisition}
      </p>
      {event.change.kind === "different" ? (
        <>
          <p>
            frequency:{" "}
            {event.change.frequency.state === "known"
              ? event.change.frequency.value
              : "not known"}
          </p>
          <p>
            amount:{" "}
            {event.change.amount.state === "known"
              ? event.change.amount.value
              : "not known"}
          </p>
          <p>{event.change.details}</p>
        </>
      ) : "details" in event.change ? (
        <p>{event.change.details ?? "details not recorded"}</p>
      ) : null}
      <p>
        source publication: {event.sourcePublication?.version ?? "not recorded"}
      </p>
    </div>
  );
}
function AttributedUse({ event }: { event: AttributedUseEvent }) {
  return (
    <>
      <UseText event={event} />
      <p className="advisor-guidance-meta">
        reported by {event.reportedBy} · recorded by {event.recordedBy} ·{" "}
        {event.recordedAt} · {event.channel.replaceAll("_", " ")}
      </p>
      {event.amendment ? (
        <section>
          <h4>correction by {event.amendment.amendedBy}</h4>
          <p>
            {event.amendment.amendedAt} · {event.amendment.reason}
          </p>
          <UseText event={event.amendment.replacement} />
        </section>
      ) : null}
    </>
  );
}
export function GuidanceHistoryEntry({
  entry,
}: {
  entry: AdvisorCareHistoryEntry;
}) {
  let body;
  switch (entry.kind) {
    case "report":
      body = (
        <>
          <h3>original {entry.event.kind.replaceAll("_", " ")}</h3>
          <p>
            {occurred(entry.event.occurredOn)} · {entry.event.channel}
          </p>
          <ReportText report={entry.event} />
          <p className="advisor-guidance-meta">
            reported by {entry.event.reportedBy} · recorded by{" "}
            {entry.event.recordedBy} · {entry.event.recordedAt}
          </p>
        </>
      );
      break;
    case "report_amendment":
      body = (
        <>
          <h3>report correction</h3>
          <details>
            <summary>original report</summary>
            <ReportText report={entry.original} />
            <p>
              reported by {entry.original.reportedBy} · recorded by{" "}
              {entry.original.recordedBy} · {entry.original.recordedAt}
            </p>
          </details>
          <h4>amended report</h4>
          <ReportText report={entry.amendment.replacement} />
          <p>
            {occurred(entry.amendment.occurredOn)} · {entry.amendment.reason}
          </p>
          <p>
            amended by {entry.amendment.amendedBy} ·{" "}
            {entry.amendment.recordedAt}
          </p>
          {entry.amendment.attention ? (
            <p>
              dependent review {entry.amendment.attention.priorReview.id} ·{" "}
              {entry.amendment.attention.state} · resolved by{" "}
              {entry.amendment.attention.resolvedBy?.id ?? "not resolved"}
            </p>
          ) : null}
        </>
      );
      break;
    case "review_attention":
      body = (
        <>
          <Badge
            tone={entry.attention.state === "unresolved" ? "pending" : "active"}
          >
            {entry.attention.state === "unresolved"
              ? "review needs attention"
              : "review attention resolved"}
          </Badge>
          <h3>dependent published review {entry.attention.priorReview.id}</h3>
          <p>
            report {entry.event.id} · correction {entry.amendmentId}
          </p>
          <p>
            relationship {entry.attention.id} · event {entry.eventId}
          </p>
          <p>
            resolved by {entry.attention.resolvedBy?.id ?? "not resolved"} ·{" "}
            {entry.recordedAt}
          </p>
        </>
      );
      break;
    case "conversation":
      body = (
        <>
          <Badge>private conversation record</Badge>
          <ConversationText body={entry.event.body} />
          <p>
            reported by {entry.event.reportedBy} · recorded by{" "}
            {entry.event.recordedBy} · {entry.event.recordedAt}
          </p>
        </>
      );
      break;
    case "private_note":
      body = (
        <>
          <Badge tone="pending">private advisor note</Badge>
          <p>{entry.note.note}</p>
          <p>
            recorded by {entry.note.recordedBy} · {entry.note.recordedAt}
          </p>
          <p>
            attached to {entry.note.reviewEvent.kind.replaceAll("_", " ")}{" "}
            {entry.note.reviewEvent.id}
          </p>
        </>
      );
      break;
    case "legacy_review_note":
      body = (
        <>
          <Badge tone="pending">private legacy review note</Badge>
          <p>{entry.note || "empty note"}</p>
          <p>
            review {entry.reviewId} · note author and time were not recorded
          </p>
        </>
      );
      break;
    case "guidance":
      body = (
        <>
          <Badge tone="active">published {entry.guidance.record.kind}</Badge>
          <GuidanceBodyText body={entry.guidance.body} />
          <p>
            published by {entry.guidance.publishedBy} ·{" "}
            {entry.guidance.publishedAt}
          </p>
          {entry.guidance.originalStart ? (
            <p>
              original Start:{" "}
              {entry.guidance.originalStart.state === "known"
                ? entry.guidance.originalStart.value
                : "not known"}
            </p>
          ) : null}
        </>
      );
      break;
    case "publication":
      body = (
        <>
          <h3>plan publication {entry.publication.version}</h3>
          <p>
            published by {entry.recordedBy} · {entry.publishedAt}
          </p>
        </>
      );
      break;
    case "legacy_review":
      body = (
        <>
          <h3>legacy review</h3>
          <p>{entry.review.summary}</p>
          <p>reported use: {entry.review.reportedUse}</p>
          <p>decision: {entry.review.decision}</p>
          <p>
            {entry.review.channel} · {entry.review.occurredOn} · next review{" "}
            {entry.review.nextReviewOn ?? "not set"}
          </p>
          <p>
            recorded by {entry.review.authorLabel} ({entry.review.authorId}) ·{" "}
            {entry.review.recordedAt}
          </p>
          <p>publication not recorded</p>
        </>
      );
      break;
    case "legacy_instruction": {
      const revision = entry.revision;
      body = (
        <>
          <h3>legacy instruction</h3>
          <p>
            {revision.slot} · {revision.productId} · revision {revision.version}{" "}
            · plan {revision.planVersion}
          </p>
          <p>
            {revision.usage.periods.join(", ")} · order {revision.usage.order}
          </p>
          <p>
            {revision.usage.short.morning ?? "morning summary not recorded"}
          </p>
          <p>
            {revision.usage.short.evening ?? "evening summary not recorded"}
          </p>
          <ul>
            {revision.usage.instructions.map((text, index) => (
              <li key={index}>{text}</li>
            ))}
          </ul>
          <p>
            {revision.reason} · effective {revision.effectiveOn}
          </p>
          <p>original Start: {revision.originalStartedOn ?? "not known"}</p>
          <p>
            source publication {revision.source.publicationVersion} ·{" "}
            {revision.source.kind}
          </p>
          <p>
            authored by {revision.authorId} · {revision.createdAt}
          </p>
        </>
      );
      break;
    }
    case "legacy_reply":
      body = (
        <>
          <h3>legacy reply</h3>
          <p>{entry.reply}</p>
          <p>report {entry.report.id} · publication not recorded</p>
          <p>
            recorded by {entry.recordedBy} · {entry.recordedAt}
          </p>
        </>
      );
      break;
    case "use":
      body = (
        <>
          <h3>reported use</h3>
          <AttributedUse event={entry.event} />
        </>
      );
      break;
    case "amendment":
      body = (
        <>
          <h3>use correction</h3>
          <UseText event={entry.amendment.replacement} />
          <p>{entry.amendment.reason}</p>
          <p>
            amended by {entry.amendment.amendedBy} · {entry.amendment.amendedAt}
          </p>
        </>
      );
      break;
    case "identity":
      body = (
        <>
          <h3>product identity report</h3>
          <p>{productLabel(entry.event.target.subject)}</p>
          <p>
            {entry.event.answer.match.replaceAll("_", " ")} ·{" "}
            {entry.event.answer.reportedName ?? "name not recorded"}
          </p>
          <p>
            variant:{" "}
            {entry.event.answer.variant.state === "known"
              ? entry.event.answer.variant.value
              : "not known"}
          </p>
          <p>
            strength:{" "}
            {entry.event.answer.strength.state === "known"
              ? entry.event.answer.strength.value
              : "not known"}
          </p>
          <p>
            {occurred(entry.event.occurredOn)} · reported by{" "}
            {entry.event.reportedBy} · recorded by {entry.event.recordedBy} ·{" "}
            {entry.event.recordedAt} · {entry.event.channel}
          </p>
        </>
      );
      break;
    case "reported_product":
      body = (
        <>
          <h3>
            reported product · descriptor version {entry.event.product.version}
          </h3>
          <p>{entry.event.descriptor.name}</p>
          <p>
            brand:{" "}
            {entry.event.descriptor.brand.state === "known"
              ? entry.event.descriptor.brand.value
              : "not known"}
          </p>
          <p>
            variant:{" "}
            {entry.event.descriptor.variant.state === "known"
              ? entry.event.descriptor.variant.value
              : "not known"}
          </p>
          <p>
            strength:{" "}
            {entry.event.descriptor.strength.state === "known"
              ? entry.event.descriptor.strength.value
              : "not known"}
          </p>
          <p>
            size:{" "}
            {entry.event.descriptor.sizeLabel.state === "known"
              ? entry.event.descriptor.sizeLabel.value
              : "not known"}
          </p>
          <p>{entry.event.reason ?? "original descriptor"}</p>
          <p>
            {occurred(entry.event.occurredOn)} · reported by{" "}
            {entry.event.reportedBy} · recorded by {entry.event.recordedBy} ·{" "}
            {entry.event.recordedAt} · {entry.event.channel}
          </p>
          {entry.event.initialUse ? (
            <AttributedUse event={entry.event.initialUse} />
          ) : null}
        </>
      );
      break;
  }
  return (
    <article
      className="advisor-guidance-history-entry"
      data-event-key={guidanceHistoryKey(entry)}
    >
      {body}
    </article>
  );
}
