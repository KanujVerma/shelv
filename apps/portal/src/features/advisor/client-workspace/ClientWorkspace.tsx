import { useEffect, useSyncExternalStore } from "react";
import { PageHeader, Panel } from "../../../shell/PortalShell.tsx";
import { Badge, Button, Field, Input, StatusNotice } from "../../../ui/index.ts";
import type { ClientWorkspaceProps } from "./types.ts";
import "../advisor.css";

/** Bounded plan-record entry. Context/care/history/service are separately composed by W0. */
export function ClientWorkspace({ controller: c, clientName, onOpenDraft, onOpenPublication }: ClientWorkspaceProps) {
  const s = useSyncExternalStore(c.subscribe, c.getSnapshot, c.getSnapshot);
  useEffect(() => { void c.refresh(); }, [c]);
  const unavailable = s.phase === "ended" || s.phase === "offline" || s.phase === "denied";
  const title = unavailable ? "client workspace" : clientName?.trim() || "client workspace";
  if (unavailable) return <div className="advisor-view">
    <PageHeader title={title} />
    <StatusNotice tone={s.phase === "offline" ? "warning" : "denied"}
      title={s.phase === "ended" ? "client workspace session ended" : s.phase === "offline" ? "client workspace is offline" : "client plans unavailable with current access"}
      action={s.phase === "ended" ? null : <Button variant="secondary" onClick={() => void (s.phase === "offline" ? c.checkConnection() : c.refresh())}>
        {s.phase === "offline" ? "check connection" : "retry client plans"}
      </Button>} />
  </div>;
  const query = s.filter.trim().toLowerCase(), directory = s.directory;
  const drafts = directory?.drafts.filter(row => `${row.state} draft ${row.id}`.toLowerCase().includes(query)) ?? [];
  const publications = directory?.publications.filter(row => `published version ${row.version}`.includes(query)) ?? [];
  const rows = drafts.length + publications.length, busy = s.phase === "loading";
  return <div className="advisor-view">
    <PageHeader title={title} action={<Button variant="secondary" onClick={() => void c.refresh()}>refresh client plans</Button>} />
    <Panel>
      <h2>plan records</h2>
      {s.phase === "idle" ? <StatusNotice title="client plan records have not been loaded" action={<Button onClick={() => void c.refresh()}>load client plans</Button>} /> : null}
      {busy ? <StatusNotice tone="loading" title={directory ? "refreshing client plan records" : "loading client plan records"} /> : null}
      {s.phase === "error" ? <StatusNotice tone="error" title="could not load client plan records" action={<Button variant="secondary" onClick={() => void c.retry()}>retry client plans</Button>}>
        {directory ? "loaded records may be out of date. retry or refresh to check for changes." : "retry or refresh to check the client plan records."}
      </StatusNotice> : null}
      {busy && directory ? <p>loaded records may be out of date while this read completes.</p> : null}
      {directory ? <>
        <Field label="filter loaded plan records"><Input value={s.filter} onChange={event => c.setFilter(event.target.value)} /></Field>
        {query && rows === 0 ? <StatusNotice tone="empty" title="no matches in the loaded plan records" action={<Button variant="ghost" onClick={() => c.setFilter("")}>clear filter</Button>}>
          {directory.nextCursor ? "more records may be available on later pages." : null}
        </StatusNotice> : null}
        <div className="advisor-directory">
          {drafts.map(row => <div className="advisor-directory-row" key={row.id}>
            <strong>{row.state} draft</strong><Badge>{row.state}</Badge><span>saved {row.savedAt}</span>
            {onOpenDraft ? <Button variant="secondary" disabled={s.phase !== "ready"} onClick={() => {
              const current = c.getSnapshot();
              if (current.phase === "ready" && current.directory?.drafts.some(draft => draft.id === row.id && draft.clientId === current.clientId)) onOpenDraft(row.id);
            }}>open draft</Button> : <span>saved revision {row.contentRevision}</span>}
          </div>)}
          {publications.map(row => <div className="advisor-directory-row" key={row.version}>
            <strong>published version {row.version}</strong><Badge>published</Badge><span>published {row.publishedAt}</span>
            {onOpenPublication ? <Button variant="secondary" disabled={s.phase !== "ready"} onClick={() => {
              const current = c.getSnapshot();
              if (current.phase === "ready" && current.directory?.publications.some(publication => publication.version === row.version && publication.clientId === current.clientId)) onOpenPublication(row.version);
            }}>read version {row.version}</Button> : <span>version reader unavailable</span>}
          </div>)}
        </div>
        {s.phase === "ready" && s.complete && !directory.drafts.some(row => row.state === "working") ? <StatusNotice tone="empty" title="no working draft in the loaded record">refresh to check for changes.</StatusNotice> : null}
        {directory.nextCursor ? <Button variant="secondary" busy={busy} disabled={s.phase !== "ready"} onClick={() => void c.loadMore()}>load more plan records</Button> : null}
      </> : null}
    </Panel>
  </div>;
}
