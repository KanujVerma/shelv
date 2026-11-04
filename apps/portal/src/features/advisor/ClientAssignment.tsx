import { Button, Field, Select, StatusNotice } from "../../ui/index.ts";
import type { AdvisorController, AdvisorState } from "./types.ts";

/** One read-feedback composition for the directory and its assignment consumer. */
export function ClientDirectoryFeedback({ controller: c, state: s }: {
  controller: AdvisorController; state: AdvisorState;
}) {
  if (s.clientsRead === "loading") return <StatusNotice tone="loading"
    title={s.clients ? "refreshing clients" : "loading clients"} />;
  if (s.clientsRead === "error") return <StatusNotice tone="error" title="could not load clients" action={
    <Button variant="secondary" onClick={() => void c.loadClients()}>retry clients</Button>
  }>{s.clients ? "the loaded directory is retained. retry to check for changes." : null}</StatusNotice>;
  if (s.clientsRead === "denied") return <StatusNotice tone="denied" title="client directory unavailable with current access" action={
    <Button variant="secondary" onClick={() => void c.loadClients()}>retry clients</Button>
  } />;
  return null;
}
export async function confirmClientAssignment(c: AdvisorController, clientId: string, onAssigned: () => void) {
  const before = c.getSnapshot(), actor = c.permissions.actorId;
  if (before.ended || before.clientsRead !== "ready" || !c.permissions.assign || before.busy || before.pending ||
    !before.view || !before.clients?.clients.some((row) => row.clientId === clientId && row.enrollmentStatus === "active")) return;
  const draftId = before.view.draft.id;
  await c.assign(clientId);
  const after = c.getSnapshot();
  if (!after.ended && c.permissions.actorId === actor && !after.busy && !after.pending && !after.notice &&
    after.view?.draft.id === draftId && after.view.draft.clientId === clientId) onAssigned();
}
export function ClientAssignment({ controller: c, state: s, selectedClient, onSelect, onAssigned }: {
  controller: AdvisorController; state: AdvisorState; selectedClient: string;
  onSelect(value: string): void; onAssigned(): void;
}) {
  if (s.ended || !c.permissions.view || !c.permissions.assign)
    return <StatusNotice tone="denied" title="client assignment unavailable with current access" />;
  const rows = s.clients?.clients.filter((row) => row.enrollmentStatus === "active") ?? [];
  const loaded = s.clientsRead === "ready", selected = loaded ? rows.find((row) => row.clientId === selectedClient) : null;
  const busy = s.busy || s.pending !== null;
  return <div className="advisor-fields">
    <ClientDirectoryFeedback controller={c} state={s} />
    {s.clientsRead === "idle" ? <Button variant="secondary" onClick={() => void c.loadClients()}>load clients</Button> : null}
    {loaded && rows.length === 0 ? <StatusNotice tone="empty" title="no active clients available for assignment" /> : null}
    <Field label="admitted client"><Select value={selected?.clientId ?? ""}
      placeholder="select a client" disabled={busy || !loaded}
      options={rows.map((row) => ({ value: row.clientId, label: row.displayName }))} onValueChange={onSelect} /></Field>
    {selected ? <p>{selected.displayName} · {selected.clientId}</p> : null}
    <Button disabled={!selected || busy} onClick={() => void confirmClientAssignment(c, selectedClient, onAssigned)}>
      confirm intended client
    </Button>
  </div>;
}
