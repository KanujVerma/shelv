import { useEffect, useState } from "react";
import type { AdvisorPublicationView } from "../../../../src/contracts/PortalRebuild.ts";
import type { OperationPort } from "../transport/session.ts";
import type { PlanCommand } from "../../../../src/contracts/PortalRebuild.ts";
import type { PlanSessionBoundary } from "../features/plan/types.ts";
import { Panel } from "../shell/PortalShell.tsx";
import { StatusNotice } from "../ui/index.ts";
/** Canonical advisor audit only. An ended client care window is displayed as
 * ended, never converted into a fabricated ClientPlanView entitlement. */
export function PublicationAudit({
  clientId,
  read,
  session,
}: {
  clientId: string;
  read: OperationPort<
    Extract<PlanCommand, { action: "read_advisor_publication_v1" }>,
    AdvisorPublicationView
  >;
  session: PlanSessionBoundary;
}) {
  const [view, setView] = useState<AdvisorPublicationView | null>(null),
    [failed, setFailed] = useState(false);
  useEffect(() => {
    const abort = new AbortController();
    setView(null);
    setFailed(false);
    void read
      .execute(
        {
          schemaVersion: 1,
          action: "read_advisor_publication_v1",
          clientId,
          version: null,
        },
        { signal: abort.signal },
      )
      .then(
        (result) => {
          if (!abort.signal.aborted && session.isCurrent()) setView(result);
        },
        () => {
          if (!abort.signal.aborted && session.isCurrent()) setFailed(true);
        },
      );
    return () => abort.abort();
  }, [clientId, read, session]);
  return failed ? (
    <StatusNotice tone="error" title="published record unavailable" />
  ) : !view ? (
    <StatusNotice
      tone="loading"
      title="reading the canonical published record"
    />
  ) : (
    <PublicationAuditRecord view={view} />
  );
}
export function PublicationAuditRecord({
  view,
}: {
  view: AdvisorPublicationView;
}) {
  return (
    <Panel>
      <h2>published plan record</h2>
      <dl className="advisor-record">
        <div>
          <dt>version</dt>
          <dd>{view.version}</dd>
        </div>
        <div>
          <dt>published</dt>
          <dd>{view.plan.publishedAt}</dd>
        </div>
        <div>
          <dt>client care access</dt>
          <dd>{view.clientAccess.care.replaceAll("_", " ")}</dd>
        </div>
        <div>
          <dt>next check-in</dt>
          <dd>{view.nextReviewOn ?? "not scheduled"}</dd>
        </div>
      </dl>
      <h3>{view.plan.content.title}</h3>
      {view.plan.content.summary ? <p>{view.plan.content.summary}</p> : null}
      <StatusNotice title="advisor audit read">
        this record does not grant client care access. full history and restore
        controls are not connected yet.
      </StatusNotice>
    </Panel>
  );
}
