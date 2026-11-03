import { useState } from "react";
import { Button, Dialog, StatusNotice } from "../../ui/index.ts";
import type { AdvisorController, AdvisorState } from "./types.ts";

/** Deliberate presentation of the existing service-only quote operation.
 * The controller and canonical payments backend own the operation and checks. */
export function FirstServiceQuote({ controller: c, state: s }: {
  controller: AdvisorController;
  state: AdvisorState;
}) {
  const [intent, setIntent] = useState<{ controller: AdvisorController; basis: string } | null>(null);
  const basisOf = (state: AdvisorState) => JSON.stringify({
    actor: c.permissions.actorId,
    view: c.permissions.view,
    finance: c.permissions.confirmPayments,
    target: state.view?.target,
    client: state.context?.clientId,
    revision: state.context?.payments.revision,
    publication: state.context?.publication,
  });
  const basis = basisOf(s), context = s.context;
  const open = intent !== null && intent.controller === c && intent.basis === basis && c.canIssueFirstServiceQuote();
  if (context?.publication !== "first") return null;
  const quote = context.payments.quotes.find((q) =>
    q.publicationVersion === 0 && q.status === "payable",
  );
  const client = s.clients?.clients.find((value) => value.clientId === context.clientId);
  return <section className="advisor-fields" aria-label="first service quote">
    <h3>first service quote</h3>
    {quote ? (
      <p>quote {quote.id} · {new Intl.NumberFormat("en-US", {
        style: "currency", currency: "USD",
      }).format(quote.totalCents / 100)} · awaiting verified payment</p>
    ) : context.payments.service.status === "pending_publication" ? (
      <p>payment verified. the first plan still needs deliberate publication.</p>
    ) : (
      <>
        <p>$100.00 for the first monthly service. products are separate.</p>
        {!c.hasIssueQuote || !c.permissions.confirmPayments ? <StatusNotice title="quote preparation unavailable">this action is unavailable with your current access.</StatusNotice> : null}
        <Button variant="secondary" disabled={!c.canIssueFirstServiceQuote()}
          onClick={() => setIntent({ controller: c, basis })}>
          issue first service quote
        </Button>
      </>
    )}
    <p className="advisor-muted">issuing a quote does not verify payment or publish the plan.</p>
    <Dialog open={open} onOpenChange={(value) => { if (!value) setIntent(null); }}
      title="issue first service quote"
      description="confirm the intended client and service amount before issuing.">
      <p>{client?.displayName ?? context.clientId} · $100.00 · service only</p>
      <p>the service starts with the first publication, after payment verification and approval.</p>
      <div className="advisor-actions">
        <Button variant="secondary" onClick={() => setIntent(null)}>cancel</Button>
        <Button onClick={() => {
          if (intent?.controller !== c || intent.basis !== basisOf(c.getSnapshot()) || !c.canIssueFirstServiceQuote()) return;
          setIntent(null);
          void c.issueFirstServiceQuote();
        }}>issue this service quote</Button>
      </div>
    </Dialog>
  </section>;
}
