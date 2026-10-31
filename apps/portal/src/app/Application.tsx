import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { ReactNode } from "react";
import {
  NavigationProvider,
  RouteLink,
  usePortalNavigation,
} from "../navigation/react.tsx";
import { createPortalNavigator } from "../navigation/history.ts";
import { safeReturnPath } from "../navigation/routes.ts";
import type { PortalRoute } from "../navigation/routes.ts";
import { PageHeader, Panel } from "../shell/PortalShell.tsx";
import { Badge, Button, Field, Input, StatusNotice } from "../ui/index.ts";
import { ClientPlan } from "../features/plan/ClientPlan.tsx";
import { UnpublishedPlanPreview } from "../features/plan/UnpublishedPlanPreview.tsx";
import type {
  PlanNavigationPort,
  PlanSessionBoundary,
} from "../features/plan/types.ts";
import { AdvisorWorkspace } from "../features/advisor/AdvisorWorkspace.tsx";
import { createAdvisorController } from "../features/advisor/controller.ts";
import type { AdvisorController } from "../features/advisor/types.ts";
import { createClientPorts, createAdvisorPorts } from "./ports.ts";
import { createClientPlanController } from "./client-state.ts";
import { bindPreview, loadPreview } from "./preview.ts";
import type { PreviewRecord } from "./preview.ts";
import { createBrowserPreviewNavigation } from "./preview-navigation.ts";
import type { ApplicationSession } from "./session.ts";
import type { PreparedApplication } from "./bootstrap.ts";
import { ApplicationShell } from "./Shell.tsx";
import { PublicationAudit } from "./PublicationAudit.tsx";
import "./application.css";

export function UnavailableModule({
  title = "page unavailable",
}: {
  title?: string;
}) {
  return (
    <>
      <PageHeader title={title} />
      <StatusNotice title="this page is not connected yet">
        no action has been recorded.
      </StatusNotice>
    </>
  );
}
export function PublicEntry({ route }: { route: PortalRoute | null }) {
  return (
    <main className="app-entry">
      <span className="shelv-wordmark">shelv</span>
      <PageHeader
        title={
          route?.name === "maya" ? "Maya · fictional demo" : "page unavailable"
        }
      />
      <StatusNotice
        title={
          route?.name === "maya"
            ? "demo unavailable in this candidate"
            : "check the address"
        }
      >
        {route?.name === "maya"
          ? "the guided Maya demo remains separate. this first application slice does not include the five-stage tour."
          : "open your plan or advisor workspace to continue."}
      </StatusNotice>
      <div className="app-actions">
        <a className="shelv-button shelv-button-secondary" href="/plan">
          your plan
        </a>
        <a className="shelv-button shelv-button-ghost" href="/advisor/clients">
          advisor workspace
        </a>
      </div>
    </main>
  );
}
/** Startup is created once outside React, so StrictMode cannot exchange a PKCE
 * code twice. It uses only the retained cookie adapter's complete/restore. */
export function PortalApplication({
  runtime,
  startup,
  win,
}: {
  runtime: ApplicationSession;
  startup: Promise<unknown>;
  win: Window;
}) {
  const state = useSyncExternalStore(
    runtime.subscribe,
    runtime.getSnapshot,
    runtime.getSnapshot,
  );
  const [starting, setStarting] = useState(true),
    [error, setError] = useState<number | null>(null);
  useEffect(() => {
    let active = true;
    void startup.then(
      () => {
        if (active) setStarting(false);
      },
      (e) => {
        if (active) {
          setError((e as { status?: number })?.status ?? 401);
          setStarting(false);
        }
      },
    );
    return () => {
      active = false;
    };
  }, [startup]);
  const boundary = state.boundary;
  if (boundary)
    return (
      <ConnectedApplication
        key={boundary.key}
        runtime={runtime}
        boundary={boundary}
        win={win}
      />
    );
  return (
    <main className="app-entry">
      <span className="shelv-wordmark">shelv</span>
      <PageHeader
        title={
          runtime.cookie.audience === "advisor" ? "advisor sign in" : "sign in"
        }
      />
      {starting ? (
        <StatusNotice tone="loading" title="checking your session" />
      ) : (
        <SignIn runtime={runtime} win={win} error={error} onError={setError} />
      )}
    </main>
  );
}
function SignIn({
  runtime,
  win,
  error,
  onError,
}: {
  runtime: ApplicationSession;
  win: Window;
  error: number | null;
  onError(value: number | null): void;
}) {
  const [email, setEmail] = useState(""),
    [remember, setRemember] = useState(false),
    [busy, setBusy] = useState(false),
    [sent, setSent] = useState(false);
  const retry = async () => {
    setBusy(true);
    onError(null);
    try {
      await runtime.restore();
    } catch (e) {
      onError((e as { status?: number })?.status ?? 503);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Panel>
      {error ? (
        <StatusNotice
          tone={error === 503 ? "uncertain" : "denied"}
          title={
            error === 503
              ? "session could not be verified"
              : error === 403
                ? "access unavailable"
                : "sign-in link unavailable"
          }
        >
          {error === 503
            ? "check your connection, then try again."
            : "request a new link in this browser. an invitation and current access are required."}
        </StatusNotice>
      ) : null}
      <form
        className="app-stack"
        onSubmit={(event) => {
          event.preventDefault();
          setBusy(true);
          onError(null);
          setSent(false);
          const returnTo =
            safeReturnPath(
              win.location.pathname + win.location.search,
              runtime.cookie.audience,
            ) ??
            (runtime.cookie.audience === "advisor"
              ? "/advisor/clients"
              : "/plan");
          void runtime
            .sendLink(email, win.location.origin + returnTo, remember)
            .then(
              () => setSent(true),
              (e) => onError((e as { status?: number })?.status ?? 503),
            )
            .finally(() => setBusy(false));
        }}
      >
        <Field label="email" id="portal-email">
          <Input
            id="portal-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            maxLength={320}
          />
        </Field>
        <label className="app-check">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />
          remember me on this browser
        </label>
        <Button type="submit" disabled={busy}>
          send sign-in link
        </Button>
      </form>
      {sent ? (
        <StatusNotice title="check your email">
          if your account has access, a sign-in link has been requested. open it
          in this browser.
        </StatusNotice>
      ) : null}
      <Button variant="ghost" disabled={busy} onClick={() => void retry()}>
        check session again
      </Button>
    </Panel>
  );
}
function ConnectedApplication({
  runtime,
  boundary,
  win,
}: {
  runtime: ApplicationSession;
  boundary: PlanSessionBoundary;
  win: Window;
}) {
  const navigator = useMemo(
    () => createPortalNavigator(win, { scopeKey: boundary.key }),
    [win, boundary.key],
  );
  useEffect(() => () => navigator.dispose(), [navigator]);
  return (
    <NavigationProvider navigator={navigator}>
      <ConnectedRoute runtime={runtime} boundary={boundary} win={win} />
    </NavigationProvider>
  );
}
function ConnectedRoute({
  runtime,
  boundary,
  win,
}: {
  runtime: ApplicationSession;
  boundary: PlanSessionBoundary;
  win: Window;
}) {
  const { route } = usePortalNavigation(),
    state = useSyncExternalStore(
      runtime.subscribe,
      runtime.getSnapshot,
      runtime.getSnapshot,
    );
  const audience = runtime.cookie.audience;
  const signOut = () => {
    void runtime.signOut().catch(() => {
      /* retained cookie ending marker remains; recovery uses sign in */
    });
  };
  if (
    !route ||
    route.name === "maya" ||
    route.name.startsWith("advisor-") !== (audience === "advisor")
  )
    return (
      <ApplicationShell audience={audience} onSignOut={signOut}>
        <UnavailableModule />
        <RouteLink
          route={
            audience === "advisor"
              ? { name: "advisor-clients" }
              : { name: "plan", routine: "morning" }
          }
        >
          return to workspace
        </RouteLink>
      </ApplicationShell>
    );
  return (
    <>
      {state.status === "offline" ? (
        <div className="app-offline">
          <StatusNotice
            tone="uncertain"
            title="connection unavailable"
            action={
              <Button
                variant="secondary"
                onClick={() => void runtime.restore().catch(() => {})}
              >
                check connection
              </Button>
            }
          >
            unconfirmed work stays in this session. check its status before
            retrying.
          </StatusNotice>
        </div>
      ) : null}
      {audience === "advisor" ? (
        <AdvisorApplication
          runtime={runtime}
          boundary={boundary}
          route={route}
          win={win}
          onSignOut={signOut}
        />
      ) : (
        <ClientApplication
          runtime={runtime}
          boundary={boundary}
          route={route}
          onSignOut={signOut}
        />
      )}
    </>
  );
}
function ClientApplication({
  runtime,
  boundary,
  route,
  onSignOut,
}: {
  runtime: ApplicationSession;
  boundary: PlanSessionBoundary;
  route: PortalRoute;
  onSignOut(): void;
}) {
  const ports = useMemo(() => createClientPorts(runtime, { care: true }), [runtime]);
  const [controller, setController] = useState<ReturnType<
    typeof createClientPlanController
  > | null>(null);
  useEffect(() => {
    const c = createClientPlanController(boundary, ports, { readVersion: 2 });
    setController(c);
    void c.refresh();
    return () => c.dispose();
  }, [boundary, ports]);
  return controller ? (
    <ClientContent
      controller={controller}
      ports={ports}
      boundary={boundary}
      route={route}
      onSignOut={onSignOut}
    />
  ) : (
    <ApplicationShell audience="client" onSignOut={onSignOut}>
      <StatusNotice tone="loading" title="loading your plan" />
    </ApplicationShell>
  );
}
export function ClientContent({
  controller,
  ports,
  boundary,
  route,
  onSignOut,
}: {
  controller: ReturnType<typeof createClientPlanController>;
  ports: ReturnType<typeof createClientPorts>;
  boundary: PlanSessionBoundary;
  route: PortalRoute;
  onSignOut(): void;
}) {
  const state = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot,
  );
  const supported = [
    "plan",
    "recommendation",
    "product",
    "product-evidence",
    "product-use",
    "report-use",
  ].includes(route.name);
  const careRoute = route.name === "product-use" || route.name === "report-use";
  let content: ReactNode;
  if (!supported)
    content = (
      <UnavailableModule
        title={
          route.name.startsWith("history")
            ? "check-ins & history"
            : route.name.startsWith("account")
              ? "account"
              : route.name === "orders" || route.name === "order"
                ? "orders"
                : "notifications"
        }
      />
    );
  else if (state.error && !state.view)
    content = (
      <>
        <PageHeader title={careRoute ? "record actual use" : "your plan"} />
        <StatusNotice
          tone={state.error === 403 ? "denied" : "error"}
          title={
            state.error === 403 ? "plan access unavailable" : "plan unavailable"
          }
          action={
            <Button
              variant="secondary"
              onClick={() => void controller.refresh()}
            >
              try again
            </Button>
          }
        >
          your private plan could not be read. no changes were recorded.
        </StatusNotice>
      </>
    );
  else if (!state.view)
    content = <StatusNotice tone="loading" title="loading your plan" />;
  else if (careRoute && state.view.schemaVersion !== 2)
    content = <UnavailableModule title="record actual use" />;
  else
    content = (
      <>
        {state.error ? (
          <StatusNotice tone="uncertain" title="refresh unavailable">
            the last confirmed view is shown.
          </StatusNotice>
        ) : null}
        <ClientPlan
          session={boundary}
          mode="client"
          view={state.view}
          ports={ports}
          onViewChange={controller.accept}
        />
      </>
    );
  return (
    <ApplicationShell
      audience="client"
      onSignOut={onSignOut}
      readOnly={state.view?.access !== "active"}
    >
      {content}
    </ApplicationShell>
  );
}
function AdvisorApplication({
  runtime,
  boundary,
  route,
  win,
  onSignOut,
}: {
  runtime: ApplicationSession;
  boundary: PlanSessionBoundary;
  route: PortalRoute;
  win: Window;
  onSignOut(): void;
}) {
  const { navigator } = usePortalNavigation();
  const [connection, setConnection] = useState<{
    adapter: ReturnType<typeof createAdvisorPorts>;
    controller: AdvisorController;
  } | null>(null);
  useEffect(() => {
    const adapter = createAdvisorPorts(runtime, { care: true });
    const controller = createAdvisorController({
      session: boundary,
      permissions: adapter.permissions,
      ports: adapter.ports,
      onPreview(preview, draft) {
        if (!boundary.isCurrent()) return;
        const record = bindPreview(
          preview,
          draft,
          {
            draftId: draft.draft.id,
            contentRevision: draft.draft.contentRevision,
            assignmentRevision: draft.draft.assignmentRevision,
          },
          boundary.key,
        );
        boundary.memory.set("preview:" + draft.draft.id, record);
        navigator.navigate({
          name: "advisor-preview",
          draftId: draft.draft.id,
        });
      },
    });
    setConnection({ adapter, controller });
    return () => {
      controller.dispose();
      adapter.dispose();
    };
  }, [runtime, boundary, navigator]);
  let content: ReactNode = (
    <StatusNotice tone="loading" title="loading advisor workspace" />
  );
  if (connection) {
    if (route.name === "advisor-preview")
      content = (
        <AdvisorPreview
          key={route.draftId}
          draftId={route.draftId}
          connection={connection}
          boundary={boundary}
          win={win}
        />
      );
    else if (
      route.name === "advisor-clients" ||
      route.name === "advisor-plans" ||
      route.name === "advisor-editor"
    )
      content = (
        <AdvisorWorkspace
          controller={connection.controller}
          navigation={{
            route:
              route.name === "advisor-editor" ? route : { name: route.name },
            navigate: (next) => navigator.navigate(next),
          }}
          onOpenClient={(clientId) =>
            navigator.navigate({ name: "advisor-client", clientId })
          }
        />
      );
    else if (route.name === "advisor-client")
      content = (
        <AdvisorClientRecovery
          clientId={route.clientId}
          controller={connection.controller}
          publication={connection.adapter.publication}
          adapterCare={connection.adapter.care}
          boundary={boundary}
        />
      );
    else
      content = (
        <UnavailableModule
          title={
            route.name === "advisor-permissions"
              ? "permissions"
              : "advisor page unavailable"
          }
        />
      );
  }
  return (
    <ApplicationShell
      audience="advisor"
      onSignOut={onSignOut}
      preview={route.name === "advisor-preview"}
    >
      {content}
    </ApplicationShell>
  );
}
function AdvisorClientRecovery({
  clientId,
  controller,
  publication,
  adapterCare,
  boundary,
}: {
  clientId: string;
  controller: AdvisorController;
  publication: ReturnType<typeof createAdvisorPorts>["publication"];
  adapterCare: ReturnType<typeof createAdvisorPorts>["care"];
  boundary: PlanSessionBoundary;
}) {
  const [audit, setAudit] = useState(false);
  const state = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot,
  );
  useEffect(() => {
    void controller.loadClients();
    void controller.loadDirectory();
  }, [controller]);
  const client = state.clients?.clients.find((c) => c.clientId === clientId),
    drafts =
      state.directory?.drafts.filter((d) => d.clientId === clientId) ?? [];
  return (
    <>
      <PageHeader title={client?.displayName ?? "client workspace"} />
      {state.notice ? (
        <StatusNotice tone="error" title={state.notice.title} />
      ) : null}
      {drafts.map((d) => (
        <RouteLink
          key={d.id}
          route={{ name: "advisor-editor", draftId: d.id, section: "sources" }}
        >
          open draft
        </RouteLink>
      ))}
      {state.clients && state.directory && !drafts.length ? (
        <StatusNotice title="no draft found">
          open plans to create and deliberately assign an unassigned draft.
        </StatusNotice>
      ) : null}
      <RouteLink route={{ name: "advisor-plans" }}>open plans</RouteLink>
      {client && client.publishedVersion > 0 ? (
        <Button variant="secondary" onClick={() => setAudit(true)}>
          read current publication
        </Button>
      ) : null}
      {audit ? (
        <PublicationAudit
          key={clientId}
          clientId={clientId}
          read={publication}
          care={adapterCare}
          session={boundary}
        />
      ) : null}
    </>
  );
}
function AdvisorPreview({
  draftId,
  connection,
  boundary,
  win,
}: {
  draftId: string;
  connection: {
    adapter: ReturnType<typeof createAdvisorPorts>;
    controller: AdvisorController;
  };
  boundary: PlanSessionBoundary;
  win: Window;
}) {
  const { navigator } = usePortalNavigation(),
    [record, setRecord] = useState<PreviewRecord | null>(null),
    [error, setError] = useState(false),
    sequence = useRef(0);
  const cursor = useMemo(() => {
    const key = "preview-navigation:" + draftId,
      prior =
        boundary.memory.get<ReturnType<typeof createBrowserPreviewNavigation>>(
          key,
        );
    if (prior) return prior;
    const next = createBrowserPreviewNavigation(win, navigator, draftId, () =>
      boundary.isCurrent(),
    );
    boundary.subscribeInvalidation(() => next.dispose());
    boundary.memory.set(key, next);
    return next;
  }, [win, navigator, draftId, boundary]);
  const route = useSyncExternalStore(
    cursor.subscribe,
    cursor.getSnapshot,
    cursor.getSnapshot,
  );
  useEffect(() => {
    const token = ++sequence.current,
      abort = new AbortController();
    // Cached callback previews may render only after a fresh same-basis read.
    void loadPreview(connection.adapter.ports.plans, draftId, boundary, {
      signal: abort.signal,
    }).then(
      (current) => {
        if (
          boundary.isCurrent() &&
          sequence.current === token &&
          !abort.signal.aborted
        ) {
          boundary.memory.set("preview:" + draftId, current);
          setRecord(current);
        }
      },
      () => {
        if (sequence.current === token && !abort.signal.aborted) setError(true);
      },
    );
    return () => {
      sequence.current++;
      abort.abort();
    };
  }, [draftId, connection, boundary, cursor]);
  const navigation: PlanNavigationPort = {
    route,
    navigate: cursor.navigate,
    back: () => cursor.back(),
    backDestination: cursor.backDestination,
  };
  const back = () => cursor.exit();
  return (
    <>
      <div className="app-actions">
        <Button variant="ghost" onClick={back}>
          back to draft
        </Button>
        <Badge>unpublished preview</Badge>
      </div>
      {error ? (
        <StatusNotice tone="error" title="preview unavailable">
          return to the draft and request a current preview.
        </StatusNotice>
      ) : !record ? (
        <StatusNotice tone="loading" title="loading current draft preview" />
      ) : (
        <UnpublishedPlanPreview
          preview={record.preview}
          source={record.source}
          session={boundary}
          navigation={navigation}
        />
      )}
    </>
  );
}
