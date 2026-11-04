import { useEffect, useLayoutEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Button, Dialog, Field, StatusNotice, Textarea } from "../../ui/index.ts";
import { prepareAgentImportComparison } from "./agent-import.ts";
import type { AdvisorController } from "./types.ts";

type Owner = { alive: boolean; attempt: number };
type Form = { owner: Owner; raw: string; open: boolean; busy: boolean; failed: boolean };
const empty = (owner: Owner): Form => ({ owner, raw: "", open: false, busy: false, failed: false });

/** Kept in the workbench, so closing a view or changing editor sections does
 * not discard the pasted proposal. Actual comparison remains in c. */
export function useAgentImportForm(c: AdvisorController, active: boolean) {
  const s = useSyncExternalStore(c.subscribe, c.getSnapshot, c.getSnapshot);
  const scope = `${s.view?.draft.id ?? ""}:${c.permissions.actorId}`;
  const owner = useMemo<Owner>(() => ({ alive: false, attempt: 0 }), [c, scope]);
  const [stored, setForm] = useState<Form>(() => empty(owner));
  const form = stored.owner === owner ? stored : empty(owner);
  const editable = !s.ended && !s.receipt && c.permissions.view && c.permissions.edit && s.view?.draft.state === "working";
  useLayoutEffect(() => {
    owner.alive = true; setForm(empty(owner));
    return () => { owner.alive = false; owner.attempt++; };
  }, [owner]);
  useEffect(() => {
    if (!editable) { owner.attempt++; setForm(empty(owner)); }
  }, [editable, owner]);
  useEffect(() => {
    if (!active) setForm(prior => prior.owner === owner && prior.open ? { ...prior, open: false } : prior);
  }, [active, owner]);
  const show = () => {
    if (owner.alive && editable) setForm(prior => ({ ...(prior.owner === owner ? prior : empty(owner)), open: true }));
  };
  const dismiss = () => {
    if (owner.alive) setForm(prior => prior.owner === owner ? { ...prior, open: false } : prior);
  };
  const clear = () => {
    if (!owner.alive || form.busy) return;
    owner.attempt++; setForm({ ...empty(owner), open: form.open });
  };
  async function compare() {
    if (!owner.alive || !editable || form.busy || !form.raw.trim() || s.busy || s.pending) return;
    const raw = form.raw, attempt = ++owner.attempt;
    // A comparison is a read. Keep the original background-editing flow and
    // retain input independently of the dismissed dialog.
    setForm({ owner, raw, open: false, busy: true, failed: false });
    const prepared = await prepareAgentImportComparison(c, raw);
    if (!owner.alive || owner.attempt !== attempt) return;
    setForm(prior => {
      if (!owner.alive || prior.owner !== owner) return prior;
      return prepared ? empty(owner) : { ...prior, raw, busy: false, failed: true };
    });
  }
  return { ...form, editable, working: s.busy || !!s.pending, show, dismiss, clear, compare,
    change(raw: string) { if (owner.alive && editable && !form.busy) setForm({ ...form, raw, failed: false }); } };
}
type ImportForm = ReturnType<typeof useAgentImportForm>;

export function AgentImportNotice({ form }: { form: ImportForm }) {
  if (!form.editable || form.open || (!form.busy && !form.failed)) return null;
  return <StatusNotice tone={form.busy ? "loading" : "warning"}
    title={form.busy ? "preparing import comparison" : "pasted import kept for review"}
    action={<Button variant="secondary" onClick={form.show}>review pasted import</Button>}>
    {form.busy ? "you can keep editing while the comparison is prepared." : "check the import or retry its comparison. your manual draft is retained."}
  </StatusNotice>;
}
export function AgentImportDialog({ form }: { form: ImportForm }) {
  return <Dialog open={form.open && form.editable} onOpenChange={value => value ? form.show() : form.dismiss()}
    title="import agent draft" description="compare structured plan content before applying it. the pasted import stays here until you clear it or change drafts.">
    <div className="advisor-fields">
      {form.busy ? <StatusNotice tone="loading" title="preparing import comparison" /> : null}
      {form.failed ? <StatusNotice tone="warning" title="pasted import kept for review">check its plan fields or retry the comparison.</StatusNotice> : null}
      <Field label="plan JSON"><Textarea rows={10} value={form.raw} disabled={form.busy}
        onChange={event => form.change(event.target.value)} /></Field>
      <div className="advisor-actions">
        <Button busy={form.busy} disabled={!form.raw.trim() || form.busy || form.working}
          onClick={() => void form.compare()}>compare import</Button>
        <Button variant="ghost" disabled={!form.raw || form.busy} onClick={form.clear}>clear pasted import</Button>
      </div>
    </div>
  </Dialog>;
}
