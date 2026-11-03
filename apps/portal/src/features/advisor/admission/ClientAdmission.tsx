import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Button, Dialog, Field, Input, StatusNotice } from "../../../ui/index.ts";
import type { AdvisorAdmissionController } from "./types.ts";

/** The actual controller, capability read and runtime are composed by W0. */
export function ClientAdmission({ controller: c, onOpenClient, onAdmitted }: {
  controller: AdvisorAdmissionController;
  onOpenClient?: (clientId: string) => void;
  onAdmitted?: () => void;
}) {
  const s = useSyncExternalStore(c.subscribe, c.getSnapshot, c.getSnapshot);
  const [openFor, setOpenFor] = useState<AdvisorAdmissionController | null>(null);
  const open = openFor === c;
  const reported = useRef<{ controller: AdvisorAdmissionController; requestId: string } | null>(null);
  useEffect(() => { void c.refreshCapabilities(); }, [c]);
  useEffect(() => {
    const receipt = c.getSnapshot().receipt;
    if (!receipt || receipt !== s.receipt ||
      (reported.current?.controller === c && reported.current.requestId === receipt.requestId)) return;
    reported.current = { controller: c, requestId: receipt.requestId };
    onAdmitted?.();
  }, [c, s.receipt, onAdmitted]);
  if (s.phase === "ended") return <StatusNotice tone="denied" title="client admission session ended" />;
  if (s.phase === "offline") return <StatusNotice tone="warning" title="client admission is offline" action={
    <Button variant="secondary" onClick={() => void c.checkConnection()}>check admission connection</Button>
  }>the original add is kept for this session.</StatusNotice>;
  if (s.canAddClient !== true) return s.phase === "loading"
    ? <StatusNotice tone="loading" title="checking client admission access" />
    : <StatusNotice tone={s.phase === "denied" ? "denied" : "neutral"} title="client admission unavailable" action={
      <Button variant="ghost" busy={s.busy !== null} onClick={() => void c.refreshCapabilities()}>check admission access</Button>
    } />;
  const busy = s.busy !== null;
  return <>
    <Button onClick={() => setOpenFor(c)}>{s.pending ? "resume client add" : "add client"}</Button>
    <Dialog open={open} onOpenChange={(value) => { if (!busy) setOpenFor(value ? c : null); }}
      canClose={() => !busy} title={s.receipt ? "client record ready" : "add a client"}
      description="review the exact name and sign-in email. this is separate from creating a plan draft.">
      <div className="advisor-fields">
        {s.message ? <StatusNotice tone={s.pending ? "uncertain" : "neutral"} title={s.message} /> : null}
        {s.receipt ? <>
          <h2>{s.receipt.status === "already_admitted" ? "client already admitted" : "client added"}</h2>
          <p>{s.receipt.displayName} · {s.receipt.email}</p>
          <p>no email was sent. share the ordinary portal link through your agreed contact method.</p>
          <Field label="ordinary portal link"><Input value={s.receipt.portalUrl} readOnly /></Field>
          <div className="advisor-actions">
            {onOpenClient ? <Button onClick={() => {
              const current = c.getSnapshot().receipt;
              if (current && current.requestId === s.receipt?.requestId) onOpenClient(current.clientId);
            }}>open client</Button> : null}
            <Button variant="secondary" onClick={() => c.addAnother()}>add another client</Button>
          </div>
        </> : s.pending ? <>
          <h2>original add needs confirmation</h2>
          <p>{s.pending.displayName} · {s.pending.email}</p>
          <p>check the original result or retry the same add. closing keeps it for this session and does not cancel the add.</p>
          <div className="advisor-actions">
            <Button variant="secondary" busy={s.busy === "status"} disabled={busy}
              onClick={() => void c.checkStatus()}>check original add status</Button>
            <Button busy={s.busy === "add"} disabled={busy}
              onClick={() => void c.retry()}>retry same add</Button>
          </div>
        </> : s.confirmation ? <>
          <h2>confirm the intended client</h2>
          <p>{s.confirmation.displayName} · {s.confirmation.email}</p>
          <p>an existing admitted client keeps their existing record. adding a client sends no email and does not publish a plan.</p>
          <div className="advisor-actions">
            <Button variant="secondary" disabled={busy} onClick={() => c.backToFields()}>back to details</Button>
            <Button busy={s.busy === "add"} disabled={busy} onClick={() => void c.confirm()}>confirm add client</Button>
          </div>
        </> : <>
          <Field label="client name"><Input autoComplete="name" value={s.fields.displayName} disabled={busy}
            onChange={(event) => c.editFields({ displayName: event.target.value })} /></Field>
          <Field label="sign-in email"><Input type="email" autoComplete="email" value={s.fields.email} disabled={busy}
            onChange={(event) => c.editFields({ email: event.target.value })} /></Field>
          <Button disabled={busy} onClick={() => c.prepare()}>review client details</Button>
        </>}
      </div>
    </Dialog>
  </>;
}
