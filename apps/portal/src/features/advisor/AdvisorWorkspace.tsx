import { useEffect, useState, useSyncExternalStore } from "react";
import type {
  PlanContent,
  SectionId,
} from "../../../../../src/contracts/PortalRebuild.ts";
import { planSections } from "../../../../../src/contracts/PortalRebuild.ts";
import type { PortalRoute, EditorSection } from "../../navigation/routes.ts";
import { PageHeader, Panel } from "../../shell/PortalShell.tsx";
import {
  Badge,
  Button,
  Dialog,
  Field,
  Input,
  Select,
  SaveStatus,
  StatusNotice,
  Textarea,
  Icon,
} from "../../ui/index.ts";
import {
  Disclosure,
  AdvisorFields,
  ContextFields,
  DecisionsFields,
  FollowUpFields,
  RoutineFields,
  SourcesFields,
} from "./fields.tsx";
import {
  contentDiff,
  exactApproval,
  paymentReady,
  reviewed,
  sectionLabels,
  sameContent,
} from "./model.ts";
import type { AdvisorController, AdvisorState } from "./types.ts";
import "./advisor.css";

export type AdvisorRoute =
  | Extract<PortalRoute, { name: "advisor-editor" }>
  | { name: "advisor-clients" }
  | { name: "advisor-plans" };
export interface AdvisorNavigationPort {
  route: AdvisorRoute;
  navigate(route: AdvisorRoute): void;
}
export interface AdvisorWorkspaceProps {
  controller: AdvisorController;
  navigation: AdvisorNavigationPort;
  onOpenClient?: (clientId: string) => void;
}
const editorSections: readonly {
  section: EditorSection;
  id: SectionId | null;
  label: string;
}[] = [
  { section: "sources", id: "sources", label: "sources" },
  { section: "client-context", id: "context", label: "client context" },
  { section: "decisions", id: "decisions", label: "decisions" },
  { section: "routine", id: "routine", label: "routine" },
  { section: "follow-up", id: "follow_up", label: "follow-up" },
  { section: "review-publish", id: null, label: "review & publish" },
];
const money = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    cents / 100,
  );
const clientName = (s: AdvisorState, id: string | null) =>
  id
    ? (s.clients?.clients.find((c) => c.clientId === id)?.displayName ?? id)
    : "not assigned";
export function AdvisorWorkspace({
  controller: c,
  navigation,
  onOpenClient,
}: AdvisorWorkspaceProps) {
  const s = useSyncExternalStore(c.subscribe, c.getSnapshot, c.getSnapshot),
    route = navigation.route;
  const [search, setSearch] = useState(""),
    [filter, setFilter] = useState("all"),
    [importOpen, setImportOpen] = useState(false),
    [raw, setRaw] = useState(""),
    [assignOpen, setAssignOpen] = useState(false),
    [client, setClient] = useState(""),
    [paymentOpen, setPaymentOpen] = useState(false);
  useEffect(() => {
    void (async () => {
      if (route.name === "advisor-editor") await c.open(route.draftId);
      await c.loadClients();
      if (route.name === "advisor-plans") await c.loadDirectory();
    })();
  }, [c, route.name, route.name === "advisor-editor" ? route.draftId : null]);
  useEffect(() => {
    if (s.ended) {
      setRaw("");
      setImportOpen(false);
      setAssignOpen(false);
      setClient("");
      setPaymentOpen(false);
      setSearch("");
    }
  }, [s.ended]);
  useEffect(() => {
    if (
      s.save !== "idle" ||
      s.pending ||
      s.busy ||
      s.notice ||
      s.comparison ||
      s.needsComparison ||
      !c.dirty()
    )
      return;
    const timer = setTimeout(() => void c.save(), 900);
    return () => clearTimeout(timer);
  }, [
    c,
    s.local,
    s.save,
    s.busy,
    s.pending,
    s.notice,
    s.comparison,
    s.needsComparison,
  ]);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (c.dirty() || c.getSnapshot().pending) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [c]);
  if (s.ended)
    return (
      <StatusNotice tone="denied" title="session changed">
        sign in again to reopen your private work.
      </StatusNotice>
    );
  if (!c.permissions.view)
    return <StatusNotice tone="denied" title="advisor access unavailable" />;
  const go = (section: EditorSection) => {
    if (s.view)
      navigation.navigate({
        name: "advisor-editor",
        draftId: s.view.draft.id,
        section,
      });
  };
  const canAct = !!s.view && !s.busy && !s.pending && !c.dirty() && !s.receipt;
  const notice = s.notice ? (
    <StatusNotice
      tone={
        s.notice.kind === "denied"
          ? "denied"
          : s.notice.kind === "uncertain"
            ? "uncertain"
            : s.notice.kind === "conflict"
              ? "warning"
              : "error"
      }
      title={s.notice.title}
      action={
        s.pending ? (
          <div className="advisor-actions">
            <Button variant="secondary" onClick={() => void c.reconcile()}>
              check request status
            </Button>
            {
              <Button variant="secondary" onClick={() => void c.retry()}>
                retry same request
              </Button>
            }
          </div>
        ) : s.notice.kind === "conflict" && s.local ? (
          <Button variant="secondary" onClick={() => void c.compareLocal()}>
            compare my work
          </Button>
        ) : null
      }
    >
      {s.notice.kind === "uncertain"
        ? "your changes stay here. do not submit a different request until this result is known."
        : s.notice.kind === "conflict"
          ? "your manual changes are retained. compare them with the latest saved draft."
          : null}
    </StatusNotice>
  ) : null;
  if (route.name === "advisor-clients")
    return (
      <div className="advisor-view">
        <PageHeader title="clients" />
        <Field label="find a client">
          <Input
            placeholder="search by name or client identity"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Field>
        {notice}
        <Panel>
          <div className="advisor-directory">
            {s.clients?.clients
              .filter((client) =>
                (client.displayName + " " + client.clientId)
                  .toLowerCase()
                  .includes(search.toLowerCase()),
              )
              .map((client) => (
                <div className="advisor-directory-row" key={client.clientId}>
                  <strong>{client.displayName}</strong>
                  <span>{client.enrollmentStatus}</span>
                  <span>
                    {client.publishedVersion
                      ? `published version ${client.publishedVersion}`
                      : client.hasDraft
                        ? "draft in preparation"
                        : "no published plan"}
                  </span>
                  {onOpenClient ? (
                    <Button
                      variant="secondary"
                      onClick={() => onOpenClient(client.clientId)}
                    >
                      open
                    </Button>
                  ) : null}
                </div>
              )) ?? <p>loading clients</p>}
            {s.clients && !s.clients.clients.length ? (
              <p>no clients available</p>
            ) : null}
          </div>
        </Panel>
        <p className="advisor-muted">unassigned drafts live in plans.</p>
      </div>
    );
  if (route.name === "advisor-plans")
    return (
      <div className="advisor-view">
        <PageHeader
          title="plans"
          description="draft first. assign a client when you’re ready."
          action={
            c.permissions.edit ? (
              <Button
                busy={s.busy}
                disabled={!!s.pending || c.dirty()}
                onClick={async () => {
                  await c.create();
                  const view = c.getSnapshot().view;
                  if (
                    view &&
                    !c.getSnapshot().pending &&
                    !c.getSnapshot().notice
                  )
                    navigation.navigate({
                      name: "advisor-editor",
                      draftId: view.draft.id,
                      section: "client-context",
                    });
                }}
              >
                new plan
              </Button>
            ) : undefined
          }
        />
        {notice}
        <div className="advisor-search">
          <Field label="find a plan">
            <Input
              placeholder="search by plan or client identity"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Field>
          <ChoiceFilter value={filter} onChange={setFilter} />
        </div>
        <Panel>
          <div className="advisor-directory" data-advisor-directory>
            <div className="advisor-directory-row advisor-muted">
              <span>plan</span>
              <span>client</span>
              <span>state</span>
              <span>updated</span>
            </div>
            {s.directory?.drafts
              .filter(
                (d) =>
                  (filter !== "unassigned" || !d.clientId) &&
                  (d.id + " " + clientName(s, d.clientId))
                    .toLowerCase()
                    .includes(search.toLowerCase()),
              )
              .map((d) => (
                <div className="advisor-directory-row" key={d.id}>
                  <Button
                    variant="ghost"
                    onClick={() =>
                      navigation.navigate({
                        name: "advisor-editor",
                        draftId: d.id,
                        section: "client-context",
                      })
                    }
                  >
                    care plan · {d.id.slice(0, 8)}
                  </Button>
                  <span>{clientName(s, d.clientId)}</span>
                  <Badge>{d.state === "working" ? "draft" : d.state}</Badge>
                  <span>{d.savedAt}</span>
                </div>
              ))}
            {filter === "all"
              ? s.directory?.publications
                  .filter((p) =>
                    (p.clientId + " " + clientName(s, p.clientId))
                      .toLowerCase()
                      .includes(search.toLowerCase()),
                  )
                  .map((p) => (
                    <div
                      className="advisor-directory-row"
                      key={`${p.clientId}:${p.version}`}
                    >
                      <strong>published version {p.version}</strong>
                      <span>{clientName(s, p.clientId)}</span>
                      <Badge tone="active">published</Badge>
                      <span>{p.publishedAt}</span>
                    </div>
                  ))
              : null}
            {s.directory &&
            !s.directory.drafts.length &&
            !s.directory.publications.length ? (
              <p>no plans yet. create an unassigned draft to begin.</p>
            ) : null}
            {!s.directory ? <p>loading plans</p> : null}
          </div>
          {s.directory?.nextCursor ? (
            <Button
              variant="secondary"
              onClick={() => void c.loadDirectory(s.directory!.nextCursor)}
            >
              next plans
            </Button>
          ) : null}
        </Panel>
        <StatusNotice title="one template. your advice.">
          manual and agent edits fill the same fields. published versions stay
          separate.
        </StatusNotice>
      </div>
    );
  if (!s.view || !s.local)
    return (
      <div className="advisor-view">
        {notice ?? (
          <StatusNotice tone="loading" title="loading private draft" />
        )}
        <Button variant="secondary" onClick={() => void c.open(route.draftId)}>
          retry draft
        </Button>
      </div>
    );
  const view = s.view,
    local = s.local,
    section = editorSections.find((v) => v.section === route.section)!,
    activeReview = section.id
      ? view.sections.find((v) => v.sectionId === section.id)
      : null;
  if (s.receipt)
    return (
      <div className="advisor-view" data-advisor-receipt>
        <PageHeader
          title="plan published"
          description={`${clientName(s, s.receipt.target.clientId)} · version ${s.receipt.publicationVersion}`}
        />
        <div className="advisor-gate-grid">
          <Panel>
            <h2>publication committed</h2>
            <dl className="advisor-record">
              <div>
                <dt>published</dt>
                <dd>{s.receipt.publishedAt}</dd>
              </div>
              <div>
                <dt>client</dt>
                <dd>{clientName(s, s.receipt.target.clientId)}</dd>
              </div>
              <div>
                <dt>draft revision</dt>
                <dd>
                  r{s.receipt.target.contentRevision} · assignment{" "}
                  {s.receipt.target.assignmentRevision}
                </dd>
              </div>
              <div>
                <dt>receipt</dt>
                <dd>{s.receipt.publicationReceiptId}</dd>
              </div>
            </dl>
          </Panel>
          <StatusNotice title="notification queued">
            email and the portal indicator have a durable event. delivery has
            not been confirmed.
          </StatusNotice>
        </div>
        <StatusNotice
          tone="success"
          title={
            s.receipt.firstServiceStarted
              ? "the service clock started with this publication"
              : "the original service clock is unchanged"
          }
        >
          notification delivery does not republish the plan or restart coverage.
        </StatusNotice>
        <Button
          variant="secondary"
          onClick={() => navigation.navigate({ name: "advisor-plans" })}
        >
          back to plans
        </Button>
      </div>
    );
  if (paymentOpen)
    return (
      <div className="advisor-view">
        {notice}
        <PaymentVerification
          controller={c}
          state={s}
          onBack={() => setPaymentOpen(false)}
          onConfirmed={() => setPaymentOpen(false)}
        />
      </div>
    );
  if (route.section === "review-publish")
    return (
      <div className="advisor-view">
        {notice}
        <PublicationChecks
          controller={c}
          state={s}
          onBack={() => go("decisions")}
          onPayment={() => setPaymentOpen(true)}
          onSection={go}
        />
      </div>
    );
  const update = (content: PlanContent) => c.edit(() => content);
  return (
    <div className="advisor-view advisor-editor">
      <div className="advisor-editor-heading">
        <h1 data-page-heading tabIndex={-1}>
          {local.title || "untitled plan"}
        </h1>
        <div className="advisor-actions">
          {c.permissions.edit ? (
            <Button
              variant="secondary"
              disabled={s.busy || !!s.pending}
              onClick={() => setImportOpen(true)}
            >
              import agent draft
            </Button>
          ) : null}
          {c.hasPreview ? (
            <Button
              variant="secondary"
              disabled={!canAct}
              onClick={() => void c.preview()}
            >
              client preview
            </Button>
          ) : null}
        </div>
      </div>
      <div className="advisor-meta">
        <Badge>draft r{view.draft.contentRevision}</Badge>
        <span>{clientName(s, view.draft.clientId)}</span>
        {c.permissions.assign && !view.draft.clientId ? (
          <Button
            variant="ghost"
            disabled={!canAct}
            onClick={() => {
              setClient("");
              setAssignOpen(true);
            }}
          >
            assign client
          </Button>
        ) : null}
        <Badge tone="pending">
          {c.dirty()
            ? "changes need review"
            : `${view.sections.filter((v) => v.reviewed).length} of ${planSections.length} sections reviewed`}
        </Badge>
      </div>
      {notice}
      {s.comparison ? <ImportComparison state={s} controller={c} /> : null}
      <div className="advisor-editor-grid">
        <nav className="advisor-checklist" aria-label="plan sections">
          {editorSections.map((item) => (
            <Button
              key={item.section}
              variant="ghost"
              aria-current={route.section === item.section ? "step" : undefined}
              onClick={() => go(item.section)}
            >
              {item.id &&
              view.sections.some(
                (s) => s.sectionId === item.id && s.reviewed,
              ) &&
              !c.dirty() ? (
                <Icon name="check" size="small" />
              ) : null}
              {item.label}
            </Button>
          ))}
        </nav>
        <div className="advisor-fields" data-advisor-editor-form>
          <div className="advisor-section-heading">
            <h2>{section.label}</h2>
            <Button
              variant="ghost"
              disabled={!canAct}
              onClick={() => void c.validate()}
            >
              validate draft
            </Button>
          </div>
          <AdvisorFields
            disabled={
              !c.permissions.edit ||
              !!s.receipt ||
              view.draft.state !== "working" ||
              (!!s.pending && s.pending.action !== "save_draft_v1")
            }
          >
            {route.section === "client-context" ? (
              <ContextFields content={local} onChange={update} />
            ) : route.section === "sources" ? (
              <SourcesFields content={local} onChange={update} />
            ) : route.section === "decisions" ? (
              <DecisionsFields content={local} onChange={update} />
            ) : route.section === "routine" ? (
              <RoutineFields content={local} onChange={update} />
            ) : (
              <FollowUpFields content={local} onChange={update} />
            )}
          </AdvisorFields>
          {c.permissions.review && section.id ? (
            <Button
              disabled={!c.canReview() || activeReview?.reviewed}
              onClick={() => void c.review(section.id!)}
            >
              {activeReview?.reviewed && !c.dirty()
                ? "section reviewed"
                : "mark section reviewed"}
            </Button>
          ) : null}
        </div>
        <aside>
          <Panel>
            <p className="advisor-muted">client preview · unpublished</p>
            <h2>review the exact saved draft</h2>
            <p>
              private facts and source locations are excluded from the client
              preview.
            </p>
            {c.hasPreview ? (
              <Button
                variant="secondary"
                disabled={!canAct}
                onClick={() => void c.preview()}
              >
                open client preview
              </Button>
            ) : null}
            <p className="advisor-muted">
              preview only. no client actions run here.
            </p>
          </Panel>
          {view.issues.length ? (
            <div className="advisor-readiness">
              <h3>needs attention</h3>
              {view.issues.map((issue, i) => (
                <p key={i}>
                  {sectionLabels[issue.section]} · {issue.path} ·{" "}
                  {issue.code.replaceAll("_", " ")}
                </p>
              ))}
            </div>
          ) : null}
        </aside>
      </div>
      <footer className="advisor-footer">
        <SaveStatus state={s.save} />
        <div className="advisor-actions">
          <Button
            variant="secondary"
            busy={s.busy && s.pending?.action === "save_draft_v1"}
            disabled={
              !c.permissions.edit ||
              !!s.pending ||
              !c.dirty() ||
              s.needsComparison ||
              s.notice?.kind === "conflict"
            }
            onClick={() => void c.save()}
          >
            save draft
          </Button>
          <Button onClick={() => go("review-publish")}>review & publish</Button>
        </div>
      </footer>
      <Dialog
        open={importOpen}
        onOpenChange={(open) => {
          setImportOpen(open);
          if (!open) setRaw("");
        }}
        title="import agent draft"
        description="compare structured plan content before applying it. manual work is retained."
      >
        <div className="advisor-fields">
          <Field label="plan JSON">
            <Textarea
              rows={10}
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
            />
          </Field>
          <Button
            disabled={!raw || s.busy}
            onClick={async () => {
              const value = raw;
              setRaw("");
              setImportOpen(false);
              await c.compareImport(value);
            }}
          >
            compare import
          </Button>
        </div>
      </Dialog>
      <Dialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        title="assign an existing client"
        description="check the intended recipient before assigning this private draft."
      >
        <div className="advisor-fields">
          <Field label="admitted client">
            <Select
              value={client}
              placeholder="select a client"
              options={(s.clients?.clients ?? [])
                .filter((v) => v.enrollmentStatus === "active")
                .map((v) => ({ value: v.clientId, label: v.displayName }))}
              onValueChange={setClient}
            />
          </Field>
          {client ? (
            <p>
              {clientName(s, client)} · {client}
            </p>
          ) : null}
          <Button
            disabled={!client || s.busy}
            onClick={async () => {
              await c.assign(client);
              if (c.getSnapshot().view?.draft.clientId === client)
                setAssignOpen(false);
            }}
          >
            confirm intended client
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
function ChoiceFilter({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="advisor-actions">
      {[
        { value: "all", label: "all plans" },
        { value: "unassigned", label: "unassigned" },
      ].map((v) => (
        <Button
          key={v.value}
          variant="secondary"
          aria-pressed={value === v.value}
          onClick={() => onChange(v.value)}
        >
          {v.label}
        </Button>
      ))}
    </div>
  );
}
function ImportComparison({
  state: s,
  controller: c,
}: {
  state: AdvisorState;
  controller: AdvisorController;
}) {
  const comparison = s.comparison!;
  return (
    <Panel>
      <h2>compare before applying</h2>
      {comparison.stale ? (
        <StatusNotice tone="warning" title="comparison is stale">
          review the latest version and compare again. no content has been
          replaced.
        </StatusNotice>
      ) : null}
      <div className="advisor-diff">
        {c.dirty() ? (
          <div>
            <h3>your unsaved manual work</h3>
            <pre>{JSON.stringify(s.local, null, 2)}</pre>
          </div>
        ) : null}
        <div>
          <h3>base version</h3>
          <p>
            r{comparison.baseContentRevision} · assignment{" "}
            {comparison.baseAssignmentRevision}
          </p>
          {s.view ? (
            <pre>{JSON.stringify(s.view.draft.content, null, 2)}</pre>
          ) : null}
        </div>
        <div>
          <h3>latest saved version</h3>
          <p>
            r{comparison.latest.draft.contentRevision} · assignment{" "}
            {comparison.latest.draft.assignmentRevision}
          </p>
          <pre>{JSON.stringify(comparison.latest.draft.content, null, 2)}</pre>
        </div>
        <div>
          <h3>proposed content</h3>
          <pre>{JSON.stringify(comparison.proposed, null, 2)}</pre>
        </div>
      </div>
      <div>
        {contentDiff(comparison.latest.draft.content, comparison.proposed).map(
          (d) => (
            <p key={d.path}>{d.path} changed</p>
          ),
        )}
      </div>
      <p className="advisor-muted">
        changed sections need human review. a valid import is not approval.
      </p>
      <div className="advisor-actions">
        <Button
          disabled={
            comparison.stale ||
            s.busy ||
            !!s.pending ||
            (c.dirty() && !sameContent(s.local, comparison.proposed))
          }
          onClick={() => void c.applyImport()}
        >
          apply compared import
        </Button>
        {comparison.stale ? (
          <Button variant="secondary" onClick={() => void c.rebaseComparison()}>
            use latest as comparison base
          </Button>
        ) : null}
      </div>
    </Panel>
  );
}
function PublicationChecks({
  controller: c,
  state: s,
  onBack,
  onPayment,
  onSection,
}: {
  controller: AdvisorController;
  state: AdvisorState;
  onBack: () => void;
  onPayment: () => void;
  onSection: (section: EditorSection) => void;
}) {
  const v = s.view!,
    target = v.target,
    context = s.context,
    approval = exactApproval(context?.approval, target, c.permissions.actorId),
    complete = !c.dirty() && reviewed(v) && !v.issues.length,
    payment = paymentReady(context),
    first = context?.publication === "first";
  return (
    <>
      <PageHeader
        title="review & publish"
        description={`${clientName(s, v.draft.clientId)} · ${v.draft.content.title || "untitled plan"} · draft r${v.draft.contentRevision}`}
      />
      <div className="advisor-gate-grid">
        <div className="advisor-fields">
          <Panel>
            <h2>the exact version the client will receive</h2>
            <dl className="advisor-record">
              <div>
                <dt>client</dt>
                <dd>{clientName(s, v.draft.clientId)}</dd>
              </div>
              <div>
                <dt>draft revision</dt>
                <dd>
                  r{v.draft.contentRevision} · assignment{" "}
                  {v.draft.assignmentRevision} ·{" "}
                  {complete ? "all required sections reviewed" : "needs review"}
                </dd>
              </div>
              <div>
                <dt>approval</dt>
                <dd>
                  {approval
                    ? "approval matches this client and revision"
                    : "exact human approval required"}
                </dd>
              </div>
              <div>
                <dt>plan version</dt>
                <dd>
                  {context?.publication === "first"
                    ? "first publication"
                    : context?.publication === "later"
                      ? "updated plan"
                      : "publication basis not confirmed"}
                </dd>
              </div>
              <div>
                <dt>notifications</dt>
                <dd>email + portal indicator queued after publication</dd>
              </div>
            </dl>
            <Disclosure title="exact content identity">
              <p className="advisor-muted">
                {target?.contentHash ?? "no assigned target"}
              </p>
              <p>{target?.clientId}</p>
            </Disclosure>
            {c.hasPreview ? (
              <Button
                variant="secondary"
                disabled={!s.view || c.dirty() || s.busy || !!s.pending}
                onClick={() => void c.preview()}
              >
                open client preview
              </Button>
            ) : null}
          </Panel>
          {v.issues.length ? (
            <StatusNotice tone="warning" title="draft needs attention">
              {v.issues.map((i, index) => (
                <p key={index}>
                  {sectionLabels[i.section]} · {i.path} ·{" "}
                  {i.code.replaceAll("_", " ")}
                </p>
              ))}
            </StatusNotice>
          ) : null}
          <StatusNotice
            title={
              first
                ? "the service clock has not started"
                : "service dates come from the published record"
            }
          >
            {first
              ? "first publication begins the paid service period and review schedule. a failed email does not undo publication or restart the clock."
              : "later publication does not reset the original service clock or actual product start dates."}
          </StatusNotice>
        </div>
        <aside className="advisor-fields">
          <StatusNotice
            tone={target ? "success" : "warning"}
            title={target ? "client assigned" : "client not assigned"}
          >
            {clientName(s, v.draft.clientId)}
          </StatusNotice>
          <StatusNotice
            tone={approval && complete ? "success" : "warning"}
            title={approval ? "revision approved" : "revision not approved"}
          >
            {complete
              ? "required sections reviewed"
              : "human section review required"}
          </StatusNotice>
          <StatusNotice
            tone={payment ? "success" : "warning"}
            title={first ? "first service payment" : "current service coverage"}
          >
            {payment
              ? "verified applicable state recorded"
              : "not confirmed; publication is blocked"}
          </StatusNotice>
          <Button
            variant="secondary"
            busy={s.busy}
            onClick={() => void c.refreshContext()}
          >
            refresh publication checks
          </Button>
          {c.permissions.approve ? (
            <Button
              variant="secondary"
              disabled={!c.canApprove() || approval}
              onClick={() => void c.approve()}
            >
              approve this exact version
            </Button>
          ) : null}
          <Button
            disabled={!c.canPublish()}
            busy={s.busy && s.pending?.action === "publish_plan_v1"}
            onClick={() => void c.publish()}
          >
            {first ? "publish first plan" : "publish plan"}
          </Button>
          <p className="advisor-muted">
            publishing is a deliberate action. payment verification alone does
            not publish.
          </p>
          {first && c.permissions.confirmPayments && c.hasPayments ? (
            <Button
              variant="secondary"
              disabled={!context || s.busy || !!s.pending}
              onClick={onPayment}
            >
              open payment verification
            </Button>
          ) : null}
          <Button variant="secondary" onClick={onBack}>
            back to draft
          </Button>
          <nav className="advisor-review-links" aria-label="review sections">
            {editorSections
              .filter((v) => v.id)
              .map((item) => (
                <Button
                  key={item.section}
                  variant="ghost"
                  onClick={() => onSection(item.section)}
                >
                  {item.label}
                </Button>
              ))}
          </nav>
        </aside>
      </div>
    </>
  );
}
function PaymentVerification({
  controller: c,
  state: s,
  onBack,
  onConfirmed,
}: {
  controller: AdvisorController;
  state: AdvisorState;
  onBack: () => void;
  onConfirmed: () => void;
}) {
  const [gross, setGross] = useState(""),
    [checked, setChecked] = useState(false),
    context = s.context;
  const claims =
    context?.payments.claims.filter(
      (claim) =>
        claim.status === "submitted_unverified" &&
        context.payments.quotes.some(
          (q) =>
            q.id === claim.quoteId &&
            q.version === claim.quoteVersion &&
            q.status === "payable" &&
            q.publicationVersion === 0 &&
            q.serviceCents > 0,
        ),
    ) ?? [];
  const v2Payments =
    context && "schemaVersion" in context.payments ? context.payments : null;
  const [claimId, setClaimId] = useState(claims[0]?.id ?? ""),
    claim = claims.find((c) => c.id === claimId),
    quote = context?.payments.quotes.find(
      (q) => q.id === claim?.quoteId && q.version === claim.quoteVersion,
    );
  return (
    <>
      <PageHeader title="verify first service payment" />
      <div className="advisor-gate-grid">
        <Panel>
          <Badge tone="pending">claim is not verified</Badge>
          <h2>
            {clientName(s, context?.clientId ?? null)} · first service payment
          </h2>
          {claims.length > 1 ? (
            <Field label="payment claim">
              <Select
                value={claimId}
                options={claims.map((c) => ({ value: c.id, label: c.id }))}
                onValueChange={setClaimId}
              />
            </Field>
          ) : null}
          {quote && claim ? (
            <>
              <dl className="advisor-record">
                <div>
                  <dt>quote total</dt>
                  <dd>{money(quote.totalCents)}</dd>
                </div>
                <div>
                  <dt>service</dt>
                  <dd>{money(quote.serviceCents)}</dd>
                </div>
                <div>
                  <dt>product costs</dt>
                  <dd>{money(quote.productTotalCents)}</dd>
                </div>
                <div>
                  <dt>method & recipient</dt>
                  <dd>
                    {v2Payments &&
                    v2Payments.quotes.find((q) => q.id === quote.id)
                      ?.contractVersion === 2
                      ? v2Payments.quotes
                          .find((q) => q.id === quote.id)
                          ?.paymentOptions.filter(
                            (o) =>
                              o.id ===
                              v2Payments.claims.find((v) => v.id === claim.id)
                                ?.paymentOptionId,
                          )
                          .map((o) => (
                            <span key={o.id}>
                              {o.recipient.method.replaceAll("_", " ")} ·{" "}
                              {o.recipient.name} ·{" "}
                              {"email" in o.recipient
                                ? o.recipient.email
                                : "cashtag" in o.recipient
                                  ? o.recipient.cashtag
                                  : o.recipient.phone}{" "}
                              · version {o.recipientVersion}
                            </span>
                          ))
                      : "use the frozen method and recipient on this legacy quote"}
                  </dd>
                </div>
                <div>
                  <dt>actual receipt</dt>
                  <dd>check the receiving account outside shelv</dd>
                </div>
              </dl>
              <Field label="actual gross amount received">
                <Input
                  inputMode="decimal"
                  value={gross}
                  onChange={(e) => setGross(e.target.value)}
                />
              </Field>
              <Field label="receipt checked outside shelv">
                <Select
                  value={checked ? "yes" : "no"}
                  options={[
                    { value: "no", label: "not yet checked" },
                    {
                      value: "yes",
                      label: "amount, recipient and transaction checked",
                    },
                  ]}
                  onValueChange={(v) => setChecked(v === "yes")}
                />
              </Field>
              <p>
                confirm only after checking the actual amount, recipient and
                transaction. a screenshot alone is not receipt verification.
              </p>
              <Button
                disabled={
                  !checked ||
                  !/^\d+(?:\.\d{1,2})?$/.test(gross) ||
                  Math.round(Number(gross) * 100) !== quote.totalCents ||
                  !!s.pending ||
                  s.busy
                }
                onClick={async () => {
                  await c.confirmPayment(claim.id, gross, checked);
                  if (
                    c
                      .getSnapshot()
                      .context?.payments.claims.some(
                        (v) => v.id === claim.id && v.status === "confirmed",
                      ) &&
                    !c.getSnapshot().pending
                  )
                    onConfirmed();
                }}
              >
                confirm verified payment
              </Button>
            </>
          ) : (
            <StatusNotice title="no applicable unverified claim available" />
          )}
        </Panel>
        <aside>
          <StatusNotice tone="warning" title="this does not publish the plan">
            verification only satisfies the payment gate. the approved revision
            still needs a deliberate publication action.
          </StatusNotice>
          <Button variant="secondary" onClick={onBack}>
            back to publication checks
          </Button>
        </aside>
      </div>
    </>
  );
}
