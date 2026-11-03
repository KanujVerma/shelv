import { useEffect, useLayoutEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Button, Dialog, Field, StatusNotice, Textarea } from "../../ui/index.ts";
import { prepareAgentImportComparison } from "./agent-import.ts";
import type { AdvisorController } from "./types.ts";

type Owner = { controller: AdvisorController; scope: string; alive: boolean; attempt: number };
type Form = { owner: Owner; raw: string; busy: boolean; failed: boolean };
const empty = (owner: Owner): Form => ({ owner, raw: "", busy: false, failed: false });

/** Local pasted input only. Actual compare/apply and authority remain in c. */
export function AgentImportDialog({ controller: c, open, onOpenChange }: {
  controller: AdvisorController; open: boolean; onOpenChange(open: boolean): void;
}) {
  const s = useSyncExternalStore(c.subscribe, c.getSnapshot, c.getSnapshot);
  const scope = `${s.view?.draft.id ?? ""}:${c.permissions.actorId}`;
  const owner = useMemo<Owner>(() => ({ controller: c, scope, alive: false, attempt: 0 }), [c, scope]);
  const [stored, setForm] = useState<Form>(() => empty(owner));
  const form = stored.owner === owner ? stored : empty(owner);
  const editable = !s.ended && c.permissions.view && c.permissions.edit && s.view?.draft.state === "working";
  useLayoutEffect(() => {
    owner.alive = true;
    setForm(empty(owner));
    return () => { owner.alive = false; owner.attempt++; };
  }, [owner]);
  useEffect(() => {
    if (!open || !editable) { owner.attempt++; setForm(empty(owner)); }
  }, [open, editable, owner]);
  async function compare() {
    if (!editable || form.busy || !form.raw.trim()) return;
    const raw = form.raw, attempt = ++owner.attempt;
    setForm({ owner, raw, busy: true, failed: false });
    const prepared = await prepareAgentImportComparison(c, raw);
    if (!owner.alive || owner.attempt !== attempt) return;
    setForm(prepared ? empty(owner) : { owner, raw, busy: false, failed: true });
    if (prepared) onOpenChange(false);
  }
  return <Dialog open={open && editable} canClose={() => !form.busy}
    onOpenChange={value => {
      if (form.busy) return;
      owner.attempt++; setForm(empty(owner)); onOpenChange(value);
    }} title="import agent draft"
    description="compare structured plan content before applying it. closing discards this pasted import; your manual draft stays here.">
    <div className="advisor-fields">
      {form.busy ? <StatusNotice tone="loading" title="preparing import comparison" /> : null}
      {form.failed ? <StatusNotice tone="error" title="comparison unavailable">
        the pasted import is kept here. check its plan fields or retry the comparison.
      </StatusNotice> : null}
      <Field label="plan JSON"><Textarea rows={10} value={form.raw} disabled={form.busy}
        onChange={event => setForm({ owner, raw: event.target.value, busy: false, failed: false })} /></Field>
      <Button busy={form.busy} disabled={!form.raw.trim() || form.busy || s.busy || !!s.pending}
        onClick={() => void compare()}>compare import</Button>
    </div>
  </Dialog>;
}
