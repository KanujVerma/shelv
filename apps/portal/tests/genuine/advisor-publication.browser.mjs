import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { isAbsolute, relative, resolve } from 'node:path';

// Source contract inspected at actual Root, not this checkout's prepared INPUT
// ancestry. Descriptor/caller custody is reviewed by Parent; a JSON descriptor
// and this module cannot grant resources or certify genuine observations.
const sourceContractCommit = '004c7a3a145f472f79c2bb6860ebf917798527b8';
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const phases = new Set(['prepare', 'approve', 'missing-approval', 'missing-payment', 'wrong-client', 'wrong-revision', 'stale-cas', 'verify-payment', 'publish', 'replay', 'client', 'other-client', 'viewer', 'signed-out']);
const negativePhases = new Set(['missing-approval', 'missing-payment', 'wrong-client', 'wrong-revision', 'stale-cas', 'viewer', 'other-client', 'signed-out']);
function id(value) { assert.equal(typeof value, 'string'); assert.match(value, uuid); return value; }
function integer(value, min = 0) { assert.ok(Number.isSafeInteger(value) && value >= min); return value; }
function record(value) { assert.ok(value && typeof value === 'object' && !Array.isArray(value)); return value; }
function instant(value) { assert.equal(typeof value, 'string'); assert.match(value, /^\d{4}-\d\d-\d\dT/); assert.ok(Number.isFinite(Date.parse(value))); return value; }
function exactlyOne(value, label) { assert.ok(Array.isArray(value), label); assert.equal(value.length, 1, label); return value[0]; }
function publicOnly(value) {
  if (!value || typeof value !== 'object') return;
  for (const [key, item] of Object.entries(value)) {
    assert.doesNotMatch(key, /password|secret|(^|_)(access|refresh)_?token|authorization|cookie|csrf|service.?role|api.?key/i, 'public descriptor contains credential field');
    publicOnly(item);
  }
}
function endpoint(value, protocol) {
  assert.equal(typeof value, 'string');
  assert.match(value, new RegExp(`^${protocol}://127\\.0\\.0\\.1:[1-9][0-9]{0,4}$`));
  const url = new URL(value);
  assert.equal(url.origin, value);
  assert.ok(Number(url.port) > 0 && Number(url.port) <= 65535);
  return value;
}
function descriptorOf(value) {
  publicOnly(value); record(value); assert.equal(value.schemaVersion, 1);
  id(value.ownerId); assert.match(value.sourceCommit, /^[a-f0-9]{40}$/);
  assert.match(value.projectId, /^[a-z0-9][a-z0-9_-]{2,100}$/);
  assert.ok(isAbsolute(value.fixtureDirectory) && resolve(value.fixtureDirectory) === value.fixtureDirectory);
  assert.ok(isAbsolute(value.privateDirectory) && resolve(value.privateDirectory) === value.privateDirectory);
  const child = relative(value.fixtureDirectory, value.privateDirectory);
  assert.ok(child && child !== '..' && !child.startsWith('../') && !isAbsolute(child));
  endpoint(value.endpoints?.portal, 'https'); endpoint(value.endpoints?.supabase, 'https'); endpoint(value.endpoints?.mailpit, 'http');
  const actors = ['a', 'b', 'advisor', 'viewer'].map(key => {
    const actor = record(value.actors?.[key]); id(actor.id);
    assert.match(actor.email, /^[^\s@]+@[^\s@]+\.invalid$/i, 'only synthetic recipients');
    return actor;
  });
  assert.equal(new Set(actors.map(a => a.id)).size, actors.length, 'distinct actual actor IDs required');
  const s = record(value.publicationScenario);
  assert.equal(s.clientId, value.actors.a.id);
  for (const key of ['quoteId', 'claimId', 'paymentOptionId']) id(s[key]);
  assert.ok(typeof s.publicMarker === 'string' && s.publicMarker.includes('SYNTHETIC') && s.publicMarker.length >= 12);
  assert.ok(typeof s.privateMarker === 'string' && s.privateMarker.includes('SYNTHETIC') && s.privateMarker.length >= 12 && s.privateMarker !== s.publicMarker);
  assert.equal(s.content?.schemaVersion, 1); assert.equal(s.content.title, s.publicMarker);
  assert.ok(s.content.context?.facts.some(f => f.visibility === 'advisor_only' && f.text === s.privateMarker));
  assert.ok(s.content.context.facts.every(f => Array.isArray(f.sources) && f.sources.length === 0), 'source ingestion is outside M04');
  // Freeze public input across async page callbacks; this is data, not authority.
  return structuredClone(value);
}
function targetOf(target, descriptor) {
  record(target); id(target.draftId); assert.equal(target.clientId, descriptor.actors.a.id);
  integer(target.contentRevision); integer(target.assignmentRevision);
  assert.match(target.contentHash, /^[a-f0-9]{64}$/);
  return target;
}
function publicationOf(publication, descriptor, needsReceipt = false) {
  record(publication); id(publication.draftId);
  targetOf(publication.target, descriptor); assert.equal(publication.target.draftId, publication.draftId);
  if (needsReceipt) {
    const r = record(publication.receipt), c = record(publication.command);
    id(publication.approvalId); id(r.requestId); id(r.publicationReceiptId); id(r.notificationEventId);
    assert.deepEqual(r.target, publication.target); assert.equal(r.kind, 'care_plan');
    assert.equal(r.publicationVersion, 1); instant(r.publishedAt);
    assert.equal(r.firstServiceStarted, true); assert.equal(r.instructionId, null); assert.equal(r.reviewId, null);
    assert.deepEqual(c, { schemaVersion: 1, action: 'publish_plan_v1', requestId: r.requestId, target: r.target, approvalId: publication.approvalId, firstServiceClaimId: descriptor.publicationScenario.claimId });
  }
  return publication;
}
function dayAt(instantValue) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(instantValue));
}
function addDays(day, count) { const d = new Date(day + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + count); return d.toISOString().slice(0, 10); }
function addMonths(day, count) {
  const [y, m, n] = day.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + count, 1, 12));
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(n, last)); return d.toISOString().slice(0, 10);
}
function snapshotOf(s, descriptor, publication) {
  record(s); assert.equal(s.schemaVersion, 1); assert.equal(s.clientId, descriptor.actors.a.id);
  assert.equal(s.draftId, publication.draftId); integer(s.caseRevision); integer(s.publishedVersion); integer(s.actualStarts);
  for (const key of ['publications', 'documents', 'receipts', 'events', 'deliveries', 'entitlements', 'requests', 'approvals', 'servicePeriods', 'reviewSchedules']) assert.ok(Array.isArray(s[key]), key);
  const d = record(s.draft); assert.equal(d.id, publication.draftId); assert.equal(d.clientId, descriptor.actors.a.id);
  assert.equal(d.contentRevision, publication.target.contentRevision); assert.equal(d.assignmentRevision, publication.target.assignmentRevision);
  assert.deepEqual(d.target, publication.target);
  assert.equal(s.expectedDocument?.title, descriptor.publicationScenario.publicMarker);
  assert.ok(!JSON.stringify(s.expectedDocument).includes(descriptor.publicationScenario.privateMarker));
}

/** Pure relationship/deduplication oracle over caller-supplied READ ONLY rows.
 * Even complete synthetic inputs return OBSERVATIONS_ONLY, never acceptance. */
export function assertPublicationOracle({ descriptor: input, publication, before, after, replay, denials = [] }) {
  const descriptor = descriptorOf(input), p = publicationOf(publication, descriptor, true);
  for (const s of [before, after, replay]) snapshotOf(s, descriptor, p);
  const clientId = descriptor.actors.a.id, actorId = descriptor.actors.advisor.id, scenario = descriptor.publicationScenario, r = p.receipt;
  assert.equal(before.publishedVersion, 0); assert.equal(before.draft.state, 'working');
  for (const key of ['publications', 'documents', 'receipts', 'events', 'deliveries', 'entitlements', 'requests', 'reviewSchedules']) assert.equal(before[key].length, 0, `prepublication ${key}`);
  assert.equal(before.actualStarts, 0); assert.equal(after.actualStarts, 0);
  assert.equal(after.publishedVersion, 1); assert.equal(after.caseRevision, before.caseRevision + 1); assert.equal(after.draft.state, 'published');
  assert.deepEqual(after.expectedDocument, before.expectedDocument);
  const payment = record(after.payment);
  assert.deepEqual(payment, before.payment, 'publication must not create or change payment proof');
  assert.equal(payment.quoteId, scenario.quoteId); assert.equal(payment.quoteClientId, clientId);
  assert.equal(payment.publicationVersion, 0); assert.equal(payment.quoteStatus, 'settled');
  assert.equal(payment.claimId, scenario.claimId); assert.equal(payment.claimClientId, clientId);
  assert.equal(payment.claimQuoteId, scenario.quoteId); assert.equal(payment.claimStatus, 'confirmed'); assert.equal(payment.paymentOptionId, scenario.paymentOptionId);
  assert.equal(payment.confirmedBy, actorId); assert.equal(payment.confirmationClientId, clientId); assert.equal(payment.confirmationQuoteId, scenario.quoteId);
  instant(payment.confirmedAt); assert.ok(Date.parse(payment.confirmedAt) <= Date.parse(r.publishedAt));
  for (const [key, expected] of Object.entries({ serviceCents: 10000, productCents: 0, totalCents: 10000, confirmedServiceCents: 10000, confirmedProductCents: 0, confirmedTotalCents: 10000 })) assert.equal(payment[key], expected, key);
  const approval = exactlyOne(after.approvals.filter(a => a.id === p.approvalId), 'exact approval');
  assert.deepEqual(approval.target, r.target); assert.equal(approval.scope, 'care_plan.publish');
  assert.deepEqual(approval.publisher, { kind: 'human', actorId }); assert.equal(approval.approvedBy, actorId); assert.equal(approval.revoked, false);
  instant(approval.approvedAt); assert.ok(Date.parse(approval.approvedAt) <= Date.parse(r.publishedAt));
  assert.deepEqual(after.approvals, before.approvals, 'publish never manufactures approval');
  const pub = exactlyOne(after.publications, 'canonical publication');
  assert.deepEqual(pub, { clientId, version: 1, publishedAt: r.publishedAt, publishedBy: actorId, documentSchemaVersion: 3 });
  const doc = exactlyOne(after.documents, 'immutable document');
  assert.equal(doc.clientId, clientId); assert.equal(doc.version, 1); assert.equal(doc.approvalId, p.approvalId); assert.equal(doc.receiptId, r.publicationReceiptId);
  assert.deepEqual(doc.document, before.expectedDocument, 'complete immutable positive projection');
  assert.ok(!JSON.stringify(doc.document).includes(scenario.privateMarker));
  const stored = exactlyOne(after.receipts, 'one publication receipt');
  assert.deepEqual(stored, { id: r.publicationReceiptId, approvalId: p.approvalId, clientId, version: 1, actorId, requestId: r.requestId, firstServiceClaimId: scenario.claimId, eventId: r.notificationEventId, receipt: r });
  assert.deepEqual(exactlyOne(after.events, 'one publication event'), { id: r.notificationEventId, clientId, publicationVersion: 1, kind: 'plan_published', sourceKind: 'publication' });
  assert.equal(after.deliveries.length, 2, 'one email and one portal delivery');
  assert.equal(new Set(after.deliveries.map(d => id(d.id))).size, 2);
  for (const channel of ['email', 'portal']) {
    const d = exactlyOne(after.deliveries.filter(d => d.channel === channel), channel);
    assert.equal(d.eventId, r.notificationEventId); assert.equal(d.recipientId, clientId);
    assert.equal(d.status, 'queued'); assert.equal(d.revision, 0); assert.equal(d.attempts, 0); assert.equal(d.seenAt, null);
  }
  const day = dayAt(r.publishedAt);
  assert.deepEqual(exactlyOne(after.entitlements, 'entitlement'), { clientId, version: 1, claimId: scenario.claimId, startsOn: day });
  assert.deepEqual(exactlyOne(before.servicePeriods, 'pending paid service'), { claimId: scenario.claimId, clientId, startsOn: null, endsOn: null });
  assert.deepEqual(exactlyOne(after.servicePeriods, 'one service clock'), { claimId: scenario.claimId, clientId, startsOn: day, endsOn: addMonths(day, 1) });
  assert.deepEqual(exactlyOne(after.reviewSchedules, 'one review schedule'), { clientId, firstPublicationAt: r.publishedAt, twoWeekOn: addDays(day, 14), monthOneOn: addMonths(day, 1), monthTwoOn: addMonths(day, 2), monthThreeOn: addMonths(day, 3) });
  assert.deepEqual(exactlyOne(after.requests, 'one canonical request'), { actorId, requestId: r.requestId, command: p.command, result: r });
  assert.deepEqual(replay, after, 'exact retry must preserve all persisted observations');
  assert.ok(Array.isArray(denials));
  for (const d of denials) { assert.ok(negativePhases.has(d.phase)); assert.deepEqual(d.after, d.before, `denied ${d.phase} persisted effects`); }
  const portal = after.deliveries.find(d => d.channel === 'portal');
  return {
    status: 'OBSERVATIONS_ONLY', genuineAcceptance: 'NOT_ASSESSED', sourceContractCommit,
    scenario: { clientId, publicationVersion: 1, notificationEventId: r.notificationEventId, portalDeliveryId: portal.id, publicationReceiptId: r.publicationReceiptId, publishRequestId: r.requestId },
    snapshot: { clientId, version: 1, receiptId: doc.receiptId },
    receipt: structuredClone(r), target: structuredClone(p.target),
    event: structuredClone(after.events[0]), deliveries: structuredClone(after.deliveries),
    negativeSqlPhases: denials.map(d => d.phase),
    queryProof: { kind: 'CALLER_SUPPLIED_READ_ONLY_OBSERVATIONS', before: structuredClone(before), after: structuredClone(after), replay: structuredClone(replay), denials: structuredClone(denials) },
  };
}

/** Caller owns ordinary login, real page, runtime, custody, tracing and SQL.
 * Call one phase at a time, taking READ ONLY snapshots around each negative,
 * before/after publish, and after exact replay. This function acquires nothing. */
export async function runModule({ page, descriptor: input, phase, publication = null }) {
  const descriptor = descriptorOf(input);
  assert.ok(phases.has(phase), 'unknown M04 phase');
  const origin = descriptor.endpoints.portal, s = descriptor.publicationScenario;
  assert.equal(new URL(page.url()).origin, origin, 'caller page must already belong to the reviewed portal');
  assert.equal(typeof page.evaluate, 'function');
  if (phase !== 'prepare' && phase !== 'signed-out') publicationOf(publication, descriptor, ['replay', 'client', 'other-client'].includes(phase));
  const observations = [];
  let p = publication ? structuredClone(publication) : null;
  const emit = () => ({ status: 'OBSERVATIONS_ONLY', genuineAcceptance: 'NOT_ASSESSED', phase, sourceContractCommit, fixture: { ownerId: descriptor.ownerId, projectId: descriptor.projectId, sourceCommit: descriptor.sourceCommit }, publication: p, observations });
  // This executes in the actual page. Session CSRF stays inside the page; no
  // provider token, cookie, Vault handle, actor flag, or caller URL is accepted.
  async function http(audience, family, command) {
    assert.ok(audience === 'advisor' || audience === 'client');
    assert.ok(family === 'plans' || family === 'payments');
    assert.equal(new URL(page.url()).origin, origin);
    const response = await page.evaluate(async ({ origin, audience, family, command }) => {
      if (location.origin !== origin) throw Error('M04 page origin changed');
      const sessionResponse = await fetch(`/api/${audience}/session`, { cache: 'no-store', redirect: 'error' });
      if (sessionResponse.status !== 200) {
        return { stage: 'session', status: sessionResponse.status, cacheControl: sessionResponse.headers.get('cache-control'), bodyOmitted: true };
      }
      const session = await sessionResponse.json();
      if (typeof session.csrf !== 'string' || !session.csrf) throw Error('actual session has no CSRF');
      const response = await fetch(`/api/${audience}/${family}`, {
        method: 'POST', redirect: 'error', cache: 'no-store',
        headers: { 'content-type': 'application/json', 'x-shelv-csrf': session.csrf }, body: JSON.stringify(command),
      });
      return { stage: 'command', status: response.status, cacheControl: response.headers.get('cache-control'), body: await response.json() };
    }, { origin, audience, family, command });
    observations.push({ kind: 'http', audience, family, command: structuredClone(command), ...response });
    return response;
  }
  function ok(response) {
    assert.equal(response.stage, 'command'); assert.equal(response.status, 200);
    assert.match(response.cacheControl ?? '', /no-store/i); return record(response.body);
  }
  function deny(response, status, codes = null) {
    assert.equal(response.status, status, `expected genuine ${status} refusal`);
    if (Object.hasOwn(response, 'body')) assert.ok(!JSON.stringify(response.body).includes(s.privateMarker));
    if (codes) assert.ok(codes.includes(response.body?.code), 'actual denial code');
  }
  async function navigate(path) {
    assert.equal(new URL(page.url()).origin, origin);
    await page.goto(origin + path);
    assert.equal(new URL(page.url()).origin, origin);
  }
  async function captureUi(action, click, family = 'plans') {
    const pending = page.waitForResponse(response => {
      const url = new URL(response.url());
      if (url.origin !== origin || url.pathname !== `/api/advisor/${family}`) return false;
      const request = response.request();
      if (request.method() !== 'POST') return false;
      try { return request.postDataJSON()?.action === action; } catch { return false; }
    }, { timeout: 15000 });
    const [response] = await Promise.all([pending, click()]);
    const command = response.request().postDataJSON();
    const observed = { kind: 'http', stage: 'command', audience: 'advisor', family, command, status: response.status(), cacheControl: response.headers()['cache-control'] ?? null, body: await response.json() };
    observations.push(observed); ok(observed); return observed;
  }
  const button = name => page.getByRole('button', { name, exact: true });
  const planRead = async () => ok(await http('advisor', 'plans', { schemaVersion: 1, action: 'read_draft_v1', draftId: p.draftId }));
  const gateRead = async () => {
    const gate = ok(await http('advisor', 'plans', { schemaVersion: 1, action: 'read_advisor_gate_v1', target: p.target, publisher: { kind: 'human', actorId: descriptor.actors.advisor.id } }));
    assert.equal(gate.capabilities?.actorId, descriptor.actors.advisor.id);
    assert.equal(gate.policy?.ownerActorId, descriptor.actors.advisor.id, 'M04 uses the actual Parent-enrolled owner human');
    return gate;
  };
  const publishCommand = (approvalId = p.approvalId) => ({ schemaVersion: 1, action: 'publish_plan_v1', requestId: randomUUID(), target: p.target, approvalId: id(approvalId), firstServiceClaimId: s.claimId });
  try {
    if (phase === 'prepare') {
      await navigate('/advisor/plans');
      const created = await captureUi('create_draft_v1', () => button('new plan').click());
      const draft = record(created.body.draft); id(draft.id); assert.equal(draft.clientId, null);
      p = { draftId: draft.id };
      await page.waitForURL(origin + `/advisor/plans/${p.draftId}/client-context`);
      await button('import agent draft').click();
      await page.getByRole('textbox', { name: 'plan JSON', exact: true }).fill(JSON.stringify(s.content));
      await button('compare import').click();
      await captureUi('apply_import_v1', () => button('apply compared import').click());
      await button('assign client').click();
      await page.getByRole('combobox', { name: 'admitted client' }).click();
      await page.getByRole('option', { name: descriptor.actors.a.initialDisplayName, exact: true }).click();
      await captureUi('assign_draft_v1', () => button('confirm intended client').click());
      for (const section of ['sources', 'client-context', 'decisions', 'routine', 'follow-up']) {
        await navigate(`/advisor/plans/${p.draftId}/${section}`);
        await captureUi('review_section_v1', () => button('mark section reviewed').click());
        await button('section reviewed').waitFor();
      }
      const view = await planRead(); p.target = view.target; targetOf(p.target, descriptor);
      assert.equal(view.draft.clientId, s.clientId); assert.deepEqual(view.draft.content, s.content);
      assert.equal(view.sections.length, 5); assert.ok(view.sections.every(section => section.reviewed)); assert.deepEqual(view.issues, []);
      await page.reload();
      const reread = await planRead(); assert.deepEqual(reread, view);
    } else if (phase === 'approve') {
      await navigate(`/advisor/plans/${p.draftId}/review-publish`);
      await button('refresh publication checks').click();
      const gate = await gateRead(); assert.equal(gate.clientId, s.clientId); assert.deepEqual(gate.target, p.target); assert.equal(gate.approval, null);
      const approval = await captureUi('approve_publication_v1', () => button('approve this exact version').click());
      assert.equal(approval.body.approvedBy, descriptor.actors.advisor.id);
      assert.deepEqual(approval.command.target, p.target); assert.deepEqual((await gateRead()).approval.id, approval.body.id);
      p.approvalId = id(approval.body.id);
      await page.getByText('revision approved', { exact: true }).waitFor();
      assert.equal(await button('publish first plan').isDisabled(), true);
    } else if (['missing-approval', 'missing-payment', 'wrong-client', 'wrong-revision', 'stale-cas'].includes(phase)) {
      const before = await planRead(); assert.deepEqual(before.target, p.target);
      let command;
      if (phase === 'stale-cas') command = { schemaVersion: 1, action: 'save_draft_v1', requestId: randomUUID(), draftId: p.draftId, expectedContentRevision: p.target.contentRevision + 1, expectedAssignmentRevision: p.target.assignmentRevision, kind: 'care_plan', content: s.content };
      else {
        command = publishCommand(phase === 'missing-approval' ? randomUUID() : p.approvalId);
        if (phase === 'missing-payment') command.firstServiceClaimId = null;
        if (phase === 'wrong-client') command.target = { ...p.target, clientId: descriptor.actors.b.id };
        if (phase === 'wrong-revision') command.target = { ...p.target, contentRevision: p.target.contentRevision + 1 };
      }
      deny(await http('advisor', 'plans', command), 409, [phase === 'missing-payment' ? 'payment_required' : phase === 'stale-cas' ? 'revision_conflict' : 'approval_conflict']);
      assert.deepEqual(await planRead(), before, 'negative preserves actual canonical draft/readiness');
      observations.push({ kind: 'sql-required', phase, requestId: command.requestId, note: 'Parent must compare actual READ ONLY before/after snapshots; draft reread alone is insufficient.' });
    } else if (phase === 'verify-payment') {
      const before = await gateRead(); assert.equal(before.approval?.id, p.approvalId);
      const finances = ok(await http('advisor', 'payments', { schemaVersion: 2, action: 'advisor_read', clientId: s.clientId }));
      const claim = exactlyOne(finances.claims.filter(c => c.id === s.claimId), 'actual submitted claim');
      assert.equal(claim.status, 'submitted_unverified'); assert.equal(claim.quoteId, s.quoteId); assert.equal(claim.paymentOptionId, s.paymentOptionId);
      const quote = exactlyOne(finances.quotes.filter(q => q.id === s.quoteId), 'actual canonical quote');
      assert.equal(quote.publicationVersion, 0); assert.equal(quote.serviceCents, 10000); assert.equal(quote.productTotalCents, 0); assert.equal(quote.totalCents, 10000);
      await navigate(`/advisor/plans/${p.draftId}/review-publish`);
      await button('open payment verification').click();
      await page.getByRole('heading', { name: 'verify first service payment', exact: true }).waitFor();
      await page.getByRole('textbox', { name: 'actual gross amount received', exact: true }).fill('100.00');
      await page.getByRole('combobox', { name: 'receipt checked outside shelv' }).click();
      await page.getByRole('option', { name: 'amount, recipient and transaction checked', exact: true }).click();
      const confirmed = await captureUi('confirm_payment', () => button('confirm verified payment').click(), 'payments');
      assert.equal(confirmed.command.schemaVersion, 2); assert.equal(confirmed.command.claimId, s.claimId);
      assert.equal(confirmed.command.quoteId, s.quoteId); assert.equal(confirmed.command.paymentOptionId, s.paymentOptionId); assert.equal(confirmed.command.receiptVerified, true);
      const after = await gateRead(); assert.deepEqual(after.target, before.target); assert.deepEqual(after.approval, before.approval, 'payment-only bookkeeping preserves exact approval');
      observations.push({ kind: 'synthetic-receipt-only', claimId: s.claimId, realMoneyProof: false });
    } else if (phase === 'publish') {
      id(p.approvalId);
      await navigate(`/advisor/plans/${p.draftId}/review-publish`);
      await button('refresh publication checks').click();
      const gate = await gateRead(); assert.deepEqual(gate.target, p.target); assert.equal(gate.approval?.id, p.approvalId);
      await page.waitForFunction(() => {
        const control = [...document.querySelectorAll('button')].find(b => b.textContent?.trim() === 'publish first plan');
        return control && !control.disabled;
      }, undefined, { timeout: 15000 });
      const committed = await captureUi('publish_plan_v1', () => button('publish first plan').click());
      p.command = committed.command; p.receipt = committed.body; publicationOf(p, descriptor, true);
      await page.getByRole('heading', { name: 'publication committed', exact: true }).waitFor();
      await page.getByText(p.receipt.publicationReceiptId, { exact: true }).waitFor();
    } else if (phase === 'replay') {
      const retried = ok(await http('advisor', 'plans', p.command)); assert.deepEqual(retried, p.receipt);
      const status = ok(await http('advisor', 'plans', { schemaVersion: 1, action: 'request_status_v1', requestId: p.command.requestId }));
      assert.equal(status.status, 'committed'); assert.deepEqual(status.receipt, p.receipt);
      const audit = ok(await http('advisor', 'plans', { schemaVersion: 1, action: 'read_advisor_publication_v1', clientId: s.clientId, version: 1 }));
      assert.equal(audit.version, 1); assert.equal(audit.plan.publishedAt, p.receipt.publishedAt);
      assert.ok(!JSON.stringify(audit.plan).includes(s.privateMarker));
    } else if (phase === 'client') {
      await navigate('/plan');
      await page.getByRole('heading', { name: 'your current routine', exact: true }).waitFor();
      const read = async version => ok(await http('client', 'plans', { schemaVersion: 1, action: 'read_client_plan_v1', version }));
      const current = await read(null);
      assert.equal(current.access, 'active'); assert.equal(current.plan?.version, 1); assert.equal(current.plan.publishedAt, p.receipt.publishedAt);
      assert.equal(current.plan.content.title, s.publicMarker); assert.deepEqual(current.actualUse, []);
      assert.ok(!JSON.stringify(current).includes(s.privateMarker));
      const visible = await page.locator('body').innerText(); assert.ok(visible.includes(s.publicMarker)); assert.ok(!visible.includes(s.privateMarker));
      await page.reload(); await page.getByRole('heading', { name: 'your current routine', exact: true }).waitFor(); assert.deepEqual(await read(null), current);
      await navigate('/history/versions/1'); await page.getByText('historical plan', { exact: true }).waitFor();
      const historical = await read(1); assert.deepEqual(historical.plan, current.plan);
      assert.ok(!(await page.locator('body').innerText()).includes(s.privateMarker));
      await page.reload(); await page.getByText('historical plan', { exact: true }).waitFor(); assert.deepEqual((await read(1)).plan, current.plan);
      observations.push({ kind: 'client-publication', current, historical });
    } else if (phase === 'other-client') {
      await navigate('/plan'); await page.getByText('your plan is being prepared', { exact: true }).waitFor();
      const own = ok(await http('client', 'plans', { schemaVersion: 1, action: 'read_client_plan_v1', version: null }));
      assert.equal(own.access, 'preparation'); assert.equal(own.plan, null);
      assert.ok(!JSON.stringify(own).includes(s.publicMarker)); assert.ok(!(await page.locator('body').innerText()).includes(s.publicMarker));
      deny(await http('client', 'plans', { schemaVersion: 1, action: 'read_client_plan_v1', version: null, clientId: s.clientId }), 400);
      deny(await http('client', 'plans', { schemaVersion: 1, action: 'publish_plan_v1', requestId: randomUUID(), target: p.target, approvalId: p.approvalId, firstServiceClaimId: s.claimId }), 403);
    } else if (phase === 'viewer') {
      id(p.approvalId); await navigate('/advisor/clients');
      await page.getByRole('heading', { name: 'clients', exact: true }).waitFor();
      assert.equal(await button('new plan').count(), 0);
      deny(await http('advisor', 'plans', publishCommand()), 403);
    } else if (phase === 'signed-out') {
      deny(await http('client', 'plans', { schemaVersion: 1, action: 'read_client_plan_v1', version: null }), 401);
    }
    return emit();
  } catch (error) {
    // Preserve actual partial observations on failure; do not convert uncertainty
    // into a receipt, retry a business write, clean up, or close caller resources.
    if (error && typeof error === 'object') error.m04Observations = emit();
    throw error;
  }
}
