import { useEffect, useState, useSyncExternalStore } from "react";
import { Panel } from "../../../shell/PortalShell.tsx";
import { Badge, Button, Field, Select, StatusNotice } from "../../../ui/index.ts";
// W3's exact pinned shared card is a dependency, never a local rendering copy.
import { UnpublishedDecisionCard } from "../../plan/index.ts";
import type { UnpublishedDecisionCardProps } from "../../plan/index.ts";
import type { AdvisorInlinePreviewController } from "./types.ts";

export function AdvisorInlinePreview({ controller }: { controller?: AdvisorInlinePreviewController }) {
  return controller ? <BoundInlinePreview controller={controller} /> : <Panel>
    <p className="advisor-muted">client preview · unpublished</p>
    <StatusNotice title="inline preview unavailable">open the full client preview to inspect the saved draft.</StatusNotice>
  </Panel>;
}
function BoundInlinePreview({ controller: c }: { controller: AdvisorInlinePreviewController }) {
  const s = useSyncExternalStore(c.subscribe, c.getSnapshot, c.getSnapshot);
  const [selection, setSelection] = useState<{ controller: AdvisorInlinePreviewController; id: string } | null>(null);
  useEffect(() => { if (s.phase === "idle" && s.source) void c.refresh(); }, [c, s.phase, s.source]);
  const decisions = s.record?.preview.content.decisions ?? [];
  const decisionId = selection?.controller === c && decisions.some(d => d.id === selection.id) ? selection.id : null;
  const card: UnpublishedDecisionCardProps | null = s.phase === "ready" && s.record ? {
    preview: s.record.preview, source: s.record.source, session: c.session, decisionId,
  } : null;
  const title = s.phase === "loading" ? "loading saved preview" : s.phase === "stale" ? "save changes to refresh the preview" :
    s.phase === "offline" ? "inline preview is offline" : s.phase === "denied" ? "inline preview unavailable with current access" :
    s.phase === "ended" ? "preview session ended" : s.phase === "unavailable" ? "inline preview unavailable" : "saved preview unavailable";
  const canRefresh = !["loading", "stale", "ended", "unavailable", "offline"].includes(s.phase);
  return <section aria-label="saved client preview" className="advisor-fields">
    <div className="advisor-actions"><p className="advisor-muted">client preview · unpublished</p>
      {s.source ? <Badge>saved r{s.source.contentRevision}</Badge> : null}</div>
    {card ? <>
      {decisions.length ? <Field label="decision to preview"><Select value={decisionId ?? ""} placeholder="select a decision"
        options={decisions.map((d, index) => ({ value: d.id, label: d.guidance.title || `decision ${index + 1} · ${d.kind.replaceAll("_", " ")}` }))}
        onValueChange={id => {
          const current = c.getSnapshot();
          if (current.phase === "ready" && current.record?.preview.content.decisions.some(d => d.id === id)) setSelection({ controller: c, id });
        }} /></Field> : null}
      <UnpublishedDecisionCard {...card} />
    </> : <StatusNotice tone={s.phase === "loading" ? "loading" : s.phase === "denied" || s.phase === "ended" ? "denied" : s.phase === "error" ? "error" : "neutral"}
      title={title}>{s.phase === "stale" ? "the preview uses saved content. your edits remain in the workbench." : null}</StatusNotice>}
    {s.phase === "offline" ? <Button variant="secondary" onClick={() => void c.checkConnection()}>check preview connection</Button> :
      <Button variant="secondary" busy={s.phase === "loading"} disabled={!canRefresh}
        onClick={() => void c.refresh()}>refresh saved preview</Button>}
    <p className="advisor-muted">preview only. no client actions run here.</p>
  </section>;
}
