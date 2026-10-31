import { useEffect, useState, useSyncExternalStore } from "react";
import { UseFacts } from "../../plan/UseFacts.tsx";
import {
  Badge,
  Button,
  Field,
  Select,
  Textarea,
  SaveStatus,
  StatusNotice,
} from "../../../ui/index.ts";
import type { AdvisorGuidanceNavigation } from "./types.ts";
import type {
  AdvisorGuidanceController,
  AdvisorGuidanceState,
} from "./controller.ts";
import type {
  GuidanceBody,
  PrivateNoteSubject,
  ReviewInputRef,
} from "../../../../../../src/contracts/PortalReview.ts";
import { instructionScopes } from "../../../../../../src/contracts/PortalReviewMapping.ts";
import { sameCareValue } from "../../../../../../src/contracts/PortalCareValidation.ts";
import { GuidanceBodyEditor, GuidanceBodyText } from "./GuidanceEditor.tsx";
import { GuidanceHistoryEntry, occurred } from "./HistoryEntries.tsx";
import { guidanceHistoryKey } from "./evidence.ts";
import { ConversationComposer } from "./ConversationComposer.tsx";
import { newReviewBody, newReplyBody, newInstructionBody } from "./drafts.ts";
import "./guidance.css";

function PrivatePreparation({
  controller,
  state,
}: {
  controller: AdvisorGuidanceController;
  state: AdvisorGuidanceState;
}) {
  const [note, setNote] = useState(""),
    [subjectKey, setSubjectKey] = useState("");
  const subjects = new Map<string, PrivateNoteSubject>();
  for (const entry of state.history.entries) {
    const subject: PrivateNoteSubject | null =
      entry.kind === "report"
        ? { kind: entry.event.kind, id: entry.event.id }
        : entry.kind === "report_amendment"
          ? { kind: entry.original.kind, id: entry.original.id }
          : entry.kind === "conversation"
            ? { kind: "conversation", id: entry.event.id }
            : entry.kind === "guidance" &&
                entry.guidance.record.kind === "review"
              ? { kind: "review", id: entry.guidance.record.id }
              : entry.kind === "legacy_review"
                ? { kind: "review", id: entry.review.id }
                : null;
    if (subject) subjects.set(`${subject.kind}:${subject.id}`, subject);
  }
  return (
    <section
      className="shelv-panel advisor-guidance-private advisor-guidance-fields"
      aria-label="private advisor notes"
    >
      <h2>private advisor notes</h2>
      <p>excluded from client history, notifications and plan exports.</p>
      <Field label="attach private note to">
        <Select
          value={subjectKey}
          placeholder="select a report or conversation"
          disabled={!controller.can("private_note")}
          options={[...subjects].map(([value, s]) => ({
            value,
            label: `${s.kind.replaceAll("_", " ")} · ${s.id}`,
          }))}
          onValueChange={setSubjectKey}
        />
      </Field>
      <Field label="private working note">
        <Textarea
          value={note}
          disabled={!controller.can("private_note")}
          onChange={(e) => setNote(e.target.value)}
        />
      </Field>
      <Button
        variant="secondary"
        disabled={
          !controller.can("private_note") ||
          !note.trim() ||
          !subjects.has(subjectKey)
        }
        onClick={() => {
          const subject = subjects.get(subjectKey);
          if (subject) void controller.savePrivateNote(subject, note);
        }}
      >
        save private note
      </Button>
    </section>
  );
}
function CurrentInformation({
  controller,
  state,
}: {
  controller: AdvisorGuidanceController;
  state: AdvisorGuidanceState;
}) {
  const publication = state.publication,
    snapshot = publication?.currentGuidance.snapshot;
  return (
    <section
      className="shelv-panel advisor-guidance-fields"
      aria-label="current information"
    >
      <h2>current information</h2>
      {snapshot ? (
        <>
          <p>
            publication {snapshot.publication.version} · current publication{" "}
            {snapshot.currentPublication.version} · as of {snapshot.asOfDay}
          </p>
          <p>
            use {snapshot.useHead} · reports {snapshot.reportHead} ·
            instructions {snapshot.instructionHead}
          </p>
          <details>
            <summary>guidance identity</summary>
            <p>{snapshot.manifestHash}</p>
          </details>
          <p>
            {publication!.currentGuidance.mode === "historical_document"
              ? "historical plan document; current instructions for that publication"
              : "current plan document"}
          </p>
        </>
      ) : (
        <p>current publication unavailable</p>
      )}
      <Button
        variant="secondary"
        busy={state.busy.includes("publication")}
        onClick={() => void controller.refreshPublication()}
      >
        refresh current publication
      </Button>
      {publication ? (
        <>
          <h3>current reported use</h3>
          {publication.use.planProducts.map((use) => (
            <section key={JSON.stringify(use.product)}>
              <h4>
                {publication.plan.content.products.find(
                  (p) => p.id === use.product.productId,
                )?.name || "product name not recorded"}
              </h4>
              <p>
                product {use.product.productId} · publication{" "}
                {use.product.publication.version}
              </p>
              <UseFacts use={use} />
            </section>
          ))}
          <h3>reported products</h3>
          {state.reported.items.map((item) => (
            <div
              key={`${item.product.reportedProductId}:${item.product.version}`}
            >
              <p>
                {item.descriptor.name} · descriptor {item.product.version}
              </p>
              <p>
                {item.state.replaceAll("_", " ")} · original Start{" "}
                {item.originalStart.state === "known"
                  ? item.originalStart.value
                  : "not known"}
              </p>
              <UseFacts use={item} />
              {item.contradiction ? (
                <p>reported use conflicts with earlier information</p>
              ) : null}
            </div>
          ))}
          {state.reported.items.length === 0 ? (
            <p>no reported products in the loaded current projection</p>
          ) : null}
          <p>
            {state.reported.complete
              ? "all current reported products loaded"
              : "current reported products are incomplete"}
          </p>
          {state.reported.error ? (
            <p role="alert">{state.reported.error}</p>
          ) : null}
          {state.reported.nextCursor ? (
            <Button
              variant="secondary"
              busy={state.busy.includes("reported")}
              onClick={() => void controller.loadMoreReportedProducts()}
            >
              load more current products
            </Button>
          ) : null}
          <h3>published instructions</h3>
          <p>
            {state.instructions.complete
              ? "all applicable directions loaded"
              : "applicable directions are incomplete"}
          </p>
          {state.instructions.error ? (
            <p role="alert">{state.instructions.error}</p>
          ) : null}
          {state.instructions.details.map((detail) => (
            <details key={detail.item.instructionId}>
              <summary>
                {detail.item.scope.slotId} ·{" "}
                {detail.item.scope.productId ?? "nonproduct step"} · revision{" "}
                {detail.item.version}
              </summary>
              <p>
                published by {detail.publishedBy} · {detail.publishedAt}
              </p>
              <p>
                effective {detail.item.effectiveOn} ·{" "}
                {detail.item.basisStatus.replaceAll("_", " ")}
              </p>
              <p>
                original Start:{" "}
                {detail.item.originalStart?.state === "known"
                  ? detail.item.originalStart.value
                  : detail.item.originalStart
                    ? "not known"
                    : "nonproduct step"}
              </p>
              {detail.content.format === "authored_schedule" ? (
                <GuidanceBodyText body={detail.content.body} />
              ) : (
                <>
                  <p>{detail.content.revision.reason}</p>
                  {detail.content.revision.usage.instructions.map(
                    (line, index) => (
                      <p key={index}>{line}</p>
                    ),
                  )}
                </>
              )}
            </details>
          ))}
          {!state.instructions.complete ? (
            <Button
              variant="secondary"
              busy={state.busy.includes("instructions")}
              onClick={() => void controller.loadInstructions()}
            >
              {state.instructions.pages.length
                ? "continue loading instructions"
                : "load applicable instructions"}
            </Button>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
function DraftReview({
  controller,
  state,
}: {
  controller: AdvisorGuidanceController;
  state: AdvisorGuidanceState;
}) {
  const draft = state.draft;
  return (
    <section
      className="shelv-panel advisor-guidance-fields"
      aria-label="exact guidance review"
    >
      <h2>review & publish</h2>
      {draft ? (
        <>
          <p>
            {draft.target.kind} · publication {draft.body.publication.version} ·
            revision {draft.target.revision}
          </p>
          <details>
            <summary>exact content and basis</summary>
            <p>draft {draft.target.draftId}</p>
            <p>content {draft.target.contentHash}</p>
            <p>basis {draft.target.basisHash}</p>
          </details>
          <p>
            {draft.needsRebase
              ? "current information changed. update the basis after reviewing it."
              : "captured and current basis match"}
          </p>
          <p>
            {draft.review
              ? `reviewed by ${draft.review.reviewedBy} · ${draft.review.reviewedAt}`
              : "human review not recorded"}
          </p>
          <p>
            {draft.approval
              ? `approval ${draft.approval.id} · ${draft.approval.scope} · publisher ${draft.approval.publisher.actorId} · policy revision ${draft.approval.policyRevision}`
              : "exact approval not recorded"}
          </p>
          {draft.issues.length ? (
            <ul aria-label="draft readiness issues">
              {draft.issues.map((issue, index) => (
                <li key={index}>
                  {issue.path.replace("body.", "").replaceAll("_", " ")}:{" "}
                  {issue.code.replaceAll("_", " ")}
                </li>
              ))}
            </ul>
          ) : null}
        </>
      ) : (
        <p>select or create a guidance draft first</p>
      )}
      {!state.evidenceComplete ? (
        <ul aria-label="review information needed">
          {state.evidenceReasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      ) : (
        <p>
          the complete current reports, products and applicable directions are
          loaded.
        </p>
      )}
      <label>
        <input
          type="checkbox"
          checked={state.acknowledged}
          disabled={!state.evidenceComplete || state.dirty || !!state.pending}
          onChange={(e) => controller.acknowledgeEvidence(e.target.checked)}
        />
        i reviewed the loaded current information for this exact draft
      </label>
      <div className="advisor-guidance-actions">
        <Button
          variant="secondary"
          disabled={!controller.can("rebase")}
          onClick={() => void controller.rebase()}
        >
          update draft basis
        </Button>
        <Button
          variant="secondary"
          disabled={!controller.can("review")}
          onClick={() => void controller.review()}
        >
          record exact human review
        </Button>
      </div>
      <p>
        {state.missing.find((m) => m.kind === "guidance_authority")?.reason}
      </p>
      <Button
        variant="secondary"
        disabled={!controller.can("approve")}
        onClick={() => void controller.approve()}
      >
        approve exact {draft?.target.kind ?? "guidance"}
      </Button>
      <Button
        disabled={!controller.can("publish")}
        onClick={() => void controller.publish()}
      >
        publish {draft?.target.kind ?? "guidance"}
      </Button>
      {draft?.approval ? (
        <Button
          variant="secondary"
          disabled={!controller.can("revoke")}
          onClick={() => void controller.revoke()}
        >
          revoke this approval
        </Button>
      ) : null}
      {draft?.body.kind === "review" ? (
        <p>publishing a no-change review does not create a new plan version.</p>
      ) : null}
    </section>
  );
}
function ConflictComparison({
  controller,
  state,
}: {
  controller: AdvisorGuidanceController;
  state: AdvisorGuidanceState;
}) {
  if (!state.conflict) return null;
  return (
    <section
      className="shelv-panel advisor-guidance-fields"
      aria-label="draft conflict"
    >
      <h2>compare before saving</h2>
      <p>your unsent text is preserved.</p>
      {state.conflict.base ? (
        <details>
          <summary>original saved draft</summary>
          <GuidanceBodyText body={state.conflict.base.body} />
        </details>
      ) : null}
      {state.body ? (
        <details open>
          <summary>your unsent draft</summary>
          <GuidanceBodyText body={state.body} />
        </details>
      ) : null}
      {state.conflict.latest ? (
        <details open>
          <summary>
            latest saved revision {state.conflict.latest.target.revision}
          </summary>
          <GuidanceBodyText body={state.conflict.latest.body} />
        </details>
      ) : null}
      <Button
        variant="secondary"
        busy={state.busy.includes("draft")}
        onClick={() => void controller.refreshAfterConflict()}
      >
        load latest draft for comparison
      </Button>
      <Button
        variant="secondary"
        disabled={state.conflict.state !== "current_displayed"}
        onClick={() => controller.acceptLatestRevision()}
      >
        use this latest revision for my next save
      </Button>
    </section>
  );
}
export function AdvisorGuidanceWorkspace({
  controller,
  navigation,
  clientLabel,
}: {
  controller: AdvisorGuidanceController;
  navigation: AdvisorGuidanceNavigation;
  clientLabel?: string;
}) {
  const state = useSyncExternalStore(
      controller.subscribe,
      controller.getSnapshot,
      controller.getSnapshot,
    ),
    selection = navigation.selection;
  useEffect(() => {
    if (!sameCareValue(controller.getSnapshot().selection, selection))
      void controller.open(selection);
  }, [
    controller,
    selection.clientId,
    selection.publicationVersion,
    selection.draftId,
    selection.kind,
  ]);
  if (state.ended)
    return (
      <StatusNotice
        tone="denied"
        title="your session has ended. sign in again."
      />
    );
  if (!sameCareValue(state.selection, selection))
    return <StatusNotice tone="loading" title="loading the selected client" />;
  const publication = state.publication,
    editorDisabled = !controller.canEditBody();
  const prepare = (body: GuidanceBody) => {
    controller.startDraft(body);
    const next = controller.getSnapshot().selection;
    if (next) navigation.onSelect(next);
  };
  const references: ReviewInputRef[] =
    state.history.entries.flatMap<ReviewInputRef>((entry) =>
      entry.kind === "report"
        ? [{ kind: entry.event.kind, id: entry.event.id }]
        : entry.kind === "conversation"
          ? [{ kind: "conversation" as const, id: entry.event.id }]
          : [],
    );
  const uniqueRefs = references.filter(
    (ref, index) =>
      references.findIndex((r) => sameCareValue(r, ref)) === index,
  );
  return (
    <div className="advisor-view advisor-guidance" data-design-frame="500:846">
      <header className="advisor-guidance-fields">
        <Button variant="ghost" onClick={navigation.onBack}>
          back to client
        </Button>
        <h1>
          {clientLabel ?? `client ${selection.clientId}`} · review a check-in
        </h1>
        <p className="advisor-guidance-meta">
          publication{" "}
          {publication?.plan.version ??
            selection.publicationVersion ??
            "unavailable"}{" "}
          ·{" "}
          {state.privateDenied
            ? "private information unavailable"
            : "advisor workspace"}
        </p>
      </header>
      {state.connection !== "ready" ? (
        <StatusNotice
          tone="warning"
          title="connection unavailable"
          action={
            <Button
              variant="secondary"
              busy={state.busy.includes("connection")}
              onClick={() => void controller.checkConnection()}
            >
              check connection
            </Button>
          }
        >
          your loaded information is retained. restore the connection, then
          retry the original read.
        </StatusNotice>
      ) : null}
      {state.notice ? (
        <StatusNotice
          tone={
            state.pending
              ? "uncertain"
              : state.privateDenied
                ? "denied"
                : "neutral"
          }
          title={state.notice}
        />
      ) : null}
      {state.pending ? (
        <section
          className="shelv-panel advisor-guidance-fields"
          aria-label="unresolved request"
        >
          <h2>
            request{" "}
            {state.pending.state === "sending"
              ? "in progress"
              : "result uncertain"}
          </h2>
          <p>
            {state.pending.action.replaceAll("_", " ")} ·{" "}
            {state.pending.requestId}
          </p>
          <div className="advisor-guidance-actions">
            <Button
              variant="secondary"
              disabled={state.pending.state !== "uncertain"}
              busy={state.busy.includes("status")}
              onClick={() => void controller.checkStatus()}
            >
              check original request status
            </Button>
            <Button
              variant="secondary"
              disabled={state.pending.state !== "uncertain"}
              busy={state.busy.includes("write")}
              onClick={() => void controller.retry()}
            >
              retry the same request
            </Button>
          </div>
        </section>
      ) : null}
      <div className="advisor-guidance-columns">
        <main className="advisor-guidance-fields">
          <section className="shelv-panel advisor-guidance-fields">
            <Badge tone="active">client-visible after publication</Badge>
            <h2>
              {state.body ? `${state.body.kind} draft` : "prepare guidance"}
            </h2>
            {state.body ? (
              <GuidanceBodyEditor
                body={state.body}
                disabled={editorDisabled}
                onChange={controller.editBody}
              />
            ) : (
              <p>
                select an actual report or instruction below to prepare
                guidance.
              </p>
            )}
            <div className="advisor-guidance-actions">
              <Button
                variant="secondary"
                disabled={!controller.can(state.draft ? "save" : "create")}
                busy={state.busy.includes("write")}
                onClick={() =>
                  void (state.draft ? controller.save() : controller.create())
                }
              >
                save draft
              </Button>
              <SaveStatus state={state.saveState} />
              {state.draft && !selection.draftId ? (
                <Button
                  variant="secondary"
                  onClick={() =>
                    navigation.onSelect({
                      ...selection,
                      draftId: state.draft!.target.draftId,
                      kind: state.draft!.target.kind,
                    })
                  }
                >
                  open saved guidance draft
                </Button>
              ) : null}
              {selection.draftId ? (
                <Button
                  variant="ghost"
                  busy={state.busy.includes("draft")}
                  onClick={() => void controller.refreshDraft()}
                >
                  refresh saved draft
                </Button>
              ) : null}
            </div>
            {state.draft && !state.draftCurrent ? (
              <p>
                refresh the saved draft before reviewing its current authority.
              </p>
            ) : null}
          </section>
          <ConflictComparison controller={controller} state={state} />
          <section
            className="shelv-panel advisor-guidance-fields"
            aria-label="care history"
          >
            <h2>care history</h2>
            <div className="advisor-guidance-actions">
              <Button
                variant="secondary"
                busy={state.busy.includes("history")}
                onClick={() => void controller.refreshHistory()}
              >
                refresh care history
              </Button>
              <Badge tone={state.history.complete ? "active" : "pending"}>
                {state.history.complete
                  ? "complete loaded history"
                  : "history incomplete"}
              </Badge>
            </div>
            {state.history.error ? (
              <StatusNotice tone="warning" title={state.history.error} />
            ) : null}
            {state.history.entries.map((entry) => (
              <GuidanceHistoryEntry
                key={guidanceHistoryKey(entry)}
                entry={entry}
              />
            ))}
            {!state.history.entries.length ? (
              <p>
                {state.privateDenied
                  ? "private care history is unavailable with current access."
                  : "no care history has been loaded."}
              </p>
            ) : null}
            {state.history.nextCursor ? (
              <Button
                variant="secondary"
                busy={state.busy.includes("history")}
                onClick={() => void controller.loadMoreHistory()}
              >
                load more care history
              </Button>
            ) : null}
            {publication && controller.canEditBody() && uniqueRefs.length ? (
              <div className="advisor-guidance-fields">
                <h3>prepare from a recorded report</h3>
                {uniqueRefs.map((ref) => (
                  <div
                    key={`${ref.kind}:${ref.id}`}
                    className="advisor-guidance-actions"
                  >
                    <span>
                      {ref.kind.replaceAll("_", " ")} · {ref.id}
                    </span>
                    <Button
                      variant="secondary"
                      disabled={!!state.pending}
                      onClick={() => prepare(newReviewBody(publication, [ref]))}
                    >
                      prepare review
                    </Button>
                    {ref.kind === "goal_report" ||
                    ref.kind === "legacy_report" ? (
                      <Button
                        variant="ghost"
                        disabled={!!state.pending}
                        onClick={() => prepare(newReplyBody(publication, ref))}
                      >
                        prepare client-visible reply
                      </Button>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}
          </section>
          {publication &&
          controller.canEditBody() &&
          state.instructions.complete ? (
            <section className="shelv-panel advisor-guidance-fields">
              <h2>prepare an instruction change</h2>
              {instructionScopes(publication).map((scope) => {
                const detail =
                  state.instructions.details.find((d) =>
                    sameCareValue(d.item.scope, scope),
                  ) ?? null;
                const body = newInstructionBody(publication, scope, detail);
                return (
                  <div
                    key={JSON.stringify([scope.slotId, scope.productId])}
                    className="advisor-guidance-actions"
                  >
                    <span>
                      {scope.slotId} · {scope.productId ?? "nonproduct step"}
                    </span>
                    <Button
                      variant="secondary"
                      disabled={!body || !!state.pending}
                      onClick={() => {
                        if (body) prepare(body);
                      }}
                    >
                      prepare instruction
                    </Button>
                  </div>
                );
              })}
              {instructionScopes(publication).length === 0 ? (
                <p>
                  there are no authored instruction scopes in this publication.
                </p>
              ) : null}
            </section>
          ) : null}
          {publication &&
          !state.privateDenied &&
          state.history.complete &&
          controller.canEditBody() ? (
            <section className="shelv-panel">
              <ConversationComposer
                key={`${selection.clientId}:${publication.plan.version}`}
                controller={controller}
                publication={publication.currentGuidance.snapshot.publication}
                disabled={!controller.can("conversation")}
              />
            </section>
          ) : null}
        </main>
        <aside className="advisor-guidance-fields">
          {!state.privateDenied &&
          state.history.complete &&
          controller.canEditBody() ? (
            <PrivatePreparation
              key={`${selection.clientId}:${selection.draftId ?? "new"}`}
              controller={controller}
              state={state}
            />
          ) : null}
          <DraftReview controller={controller} state={state} />
          <CurrentInformation controller={controller} state={state} />
          <section className="shelv-panel advisor-guidance-fields">
            <h2>published guidance</h2>
            {publication?.latestPublicReview ? (
              <>
                <p>{publication.latestPublicReview.conclusion}</p>
                <p>{publication.latestPublicReview.rationale}</p>
                <p>{publication.latestPublicReview.nextStep}</p>
                <p>
                  {occurred(publication.latestPublicReview.occurredOn)} ·
                  published {publication.latestPublicReview.publishedAt}
                </p>
              </>
            ) : (
              <p>no published review summary available</p>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
