import { createHash } from 'node:crypto';

// M03 acceptance assets. Importing this file acquires no resources.
// Public v1 descriptor is unchanged. Custody/execution authority stays with Parent.
const snapshots = ['baseline', 'after_seen', 'after_replay', 'after_owner_denial', 'after_session_denial', 'after_relogin'];
const protectedKeys = ['cases', 'publications', 'documents', 'entitlements', 'servicePeriods', 'schedule', 'publicationReceipts', 'planRequests', 'events', 'otherDeliveries', 'attempts', 'careHeads'];
const uuid = v => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(v);
const integer = v => Number.isSafeInteger(v) && v >= 0;
const instant = v => typeof v === 'string' && Number.isFinite(Date.parse(v));
const hash = v => typeof v === 'string' && /^[0-9a-f]{64}$/.test(v);
const keys = (v, names) => v !== null && typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === names.length && names.every(k => Object.hasOwn(v, k));
const stable = v => JSON.stringify(v, (_k, x) => x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.keys(x).sort().map(k => [k, x[k]])) : x);
const equal = (a, b) => stable(a) === stable(b);
const bindingOf = d => ({ ownerId: d.ownerId, projectId: d.projectId, sourceCommit: d.sourceCommit });
const hrefOf = t => `/history/versions/${t.publicationVersion}`;
function input(descriptor, scenario) {
  const demand = v => { if (!v) throw new TypeError('notification input unavailable or invalid'); };
  demand(keys(descriptor, ['schemaVersion', 'ownerId', 'projectId', 'fixtureDirectory', 'sourceCommit', 'endpoints', 'actors', 'privateDirectory', 'fingerprints']));
  demand(descriptor.schemaVersion === 1 && uuid(descriptor.ownerId) && /^[0-9a-f]{40}$/.test(descriptor.sourceCommit));
  demand(['projectId', 'fixtureDirectory', 'privateDirectory'].every(k => typeof descriptor[k] === 'string' && descriptor[k].length > 0));
  demand(descriptor.fixtureDirectory.startsWith('/') && descriptor.privateDirectory.startsWith(descriptor.fixtureDirectory + '/'));
  demand(keys(descriptor.endpoints, ['portal', 'supabase', 'mailpit']));
  for (const [k, endpoint] of Object.entries(descriptor.endpoints)) {
    const match = new RegExp(`^${k === 'mailpit' ? 'http' : 'https'}://127\\.0\\.0\\.1:([1-9][0-9]{0,4})$`).exec(endpoint);
    demand(match && Number(match[1]) <= 65535);
  }
  demand(new Set(Object.values(descriptor.endpoints)).size === 3);
  demand(keys(descriptor.fingerprints, ['source', 'config', 'images', 'processes', 'resources']) && Object.values(descriptor.fingerprints).every(v => typeof v === 'string' && v.length > 0));
  demand(keys(descriptor.actors, ['a', 'b']));
  for (const actor of Object.values(descriptor.actors)) demand(keys(actor, ['id', 'email', 'initialDisplayName']) && uuid(actor.id) && typeof actor.email === 'string' && /^[^\s@]+@[^\s@]+\.invalid$/.test(actor.email) && typeof actor.initialDisplayName === 'string');
  demand(descriptor.actors.a.id !== descriptor.actors.b.id);
  demand(keys(scenario, ['schemaVersion', 'a', 'b', 'privateMarkers']) && scenario.schemaVersion === 1);
  for (const k of ['a', 'b']) {
    const t = scenario[k];
    demand(keys(t, ['clientId', 'publicationVersion', 'notificationEventId', 'portalDeliveryId', 'publicationReceiptId', 'publishRequestId']));
    demand(t.clientId === descriptor.actors[k].id && integer(t.publicationVersion) && t.publicationVersion > 0);
    demand(['clientId', 'notificationEventId', 'portalDeliveryId', 'publicationReceiptId', 'publishRequestId'].every(f => uuid(t[f])));
  }
  demand(['notificationEventId', 'portalDeliveryId', 'publicationReceiptId', 'publishRequestId'].every(k => scenario.a[k] !== scenario.b[k]));
  demand(Array.isArray(scenario.privateMarkers) && scenario.privateMarkers.length > 0 && scenario.privateMarkers.length <= 32 && scenario.privateMarkers.every(v => typeof v === 'string' && v.length >= 8 && v.length <= 256));
}
function isWrite(c) {
  return keys(c, ['schemaVersion', 'action', 'requestId', 'deliveryId', 'expectedRevision']) && c.schemaVersion === 1 && c.action === 'mark_seen_v1' && uuid(c.requestId) && uuid(c.deliveryId) && integer(c.expectedRevision);
}
function isReceipt(r) {
  return keys(r, ['requestId', 'action', 'deliveryId', 'previousRevision', 'revision', 'recordedAt', 'effect']) && uuid(r.requestId) && r.action === 'mark_seen_v1' && uuid(r.deliveryId) && integer(r.previousRevision) && integer(r.revision) && instant(r.recordedAt) && ['seen', 'already_seen'].includes(r.effect);
}
function isPage(p) {
  return keys(p, ['schemaVersion', 'consistency', 'observedAt', 'cursor', 'items', 'nextCursor']) && p.schemaVersion === 1 && p.consistency === 'live_keyset' && instant(p.observedAt) &&
    [p.cursor, p.nextCursor].every(v => v === null || typeof v === 'string' && /^n:[0-9a-f-]{36}$/.test(v) && uuid(v.slice(2))) && Array.isArray(p.items) && p.items.length <= 50 && p.items.every(i =>
      keys(i, ['deliveryId', 'revision', 'seenAt', 'event', 'email']) && uuid(i.deliveryId) && integer(i.revision) && (i.seenAt === null || instant(i.seenAt)) &&
      keys(i.event, ['eventId', 'createdAt', 'source', 'destination']) && uuid(i.event.eventId) && instant(i.event.createdAt) &&
      keys(i.event.source, ['kind', 'publicationVersion']) && i.event.source.kind === 'publication' && integer(i.event.source.publicationVersion) && i.event.source.publicationVersion > 0 &&
      keys(i.event.destination, ['kind', 'version']) && i.event.destination.kind === 'plan_version' && i.event.destination.version === i.event.source.publicationVersion &&
      (i.email === null || keys(i.email, ['status', 'revision']) && ['queued', 'claimed', 'uncertain', 'accepted', 'delivered', 'failed', 'bounced'].includes(i.email.status) && integer(i.email.revision)));
}
const stateOf = s => ({ targets: s?.targets, journal: s?.journal, protectedState: s?.protectedState });

/** Later execution only: caller owns an actual Playwright-compatible page and
 * ordinary UI relogin. This module never launches a browser, server, fixture,
 * Auth session, SDK or DB client, installs routes, or supplies successful data.
 * captureCanonical(label) returns {observations: <SQL snapshot>, errors: []}.
 */
export async function observeNotificationInboxMilestone({ page, descriptor, notificationScenario: scenario, relogin, captureCanonical }) {
  descriptor = structuredClone(descriptor); scenario = structuredClone(scenario);
  input(descriptor, scenario);
  if (!page || typeof relogin !== 'function' || typeof captureCanonical !== 'function') throw new TypeError('caller-owned page, ordinary relogin and canonical capture required');
  const observations = { classification: 'OBSERVATIONS_ONLY', binding: bindingOf(descriptor), requests: [], views: [], logouts: [] };
  const canonical = [], errors = [], origin = descriptor.endpoints.portal;
  let phase = 'baseline', session = null;
  function demand(v, reason) { if (!v) throw new Error(reason); }
  async function checkpoint(label) {
    phase = label;
    const result = await captureCanonical(label);
    if (!keys(result, ['observations', 'errors']) || !Array.isArray(result.errors) || result.errors.length || result.observations?.label !== label || !equal(result.observations?.binding, observations.binding)) throw new Error('canonical capture refused');
    canonical.push(result.observations);
  }
  // Refuse an unavailable baseline BEFORE touching the supplied page.
  await checkpoint('baseline');
  async function sameOrigin() { demand(new URL(page.url()).origin === origin, 'page origin changed'); }
  async function readSession(expected) {
    await sameOrigin();
    const value = await page.evaluate(async () => {
      const r = await fetch('/api/client/session', { credentials: 'same-origin', cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(15000) });
      const s = await r.json();
      return { status: r.status, signedIn: s.signedIn === true, ownerId: s.signedIn === true ? s.ownerId : null };
    });
    demand(value.status === 200 && (expected === null ? value.signedIn === false && value.ownerId === null : value.signedIn === true && value.ownerId === expected), 'ordinary session observation mismatch');
    session = value;
  }
  async function record(label, response, target) {
    const request = response.request(), headers = await request.allHeaders(), responseHeaders = await response.allHeaders();
    const rawCookie = (headers.cookie ?? '').split(';').map(v => v.trim()).find(v => v.startsWith('__Host-shelv_client='));
    const command = request.postDataJSON();
    const raw = await response.text();
    const leak = scenario.privateMarkers.some(m => raw.includes(m));
    let body = null;
    if (!leak && Buffer.byteLength(raw) <= 100000) { try { body = JSON.parse(raw); } catch { /* Remains a refused projection. */ } }
    const safeProjection = response.status() === 200
      ? isPage(body) || isReceipt(body) || keys(body, ['status', 'receipt']) && body.status === 'committed' && isReceipt(body.receipt)
      : keys(body, ['code']) && typeof body.code === 'string' && body.code.length <= 80;
    if (!safeProjection) body = null;
    const result = { label, actorId: target.clientId, sessionOwnerId: session?.ownerId ?? null,
      sessionIdentityDigest: rawCookie ? createHash('sha256').update(rawCookie).digest('hex') : null,
      method: request.method(), url: request.url(), origin: headers.origin ?? null,
      csrfPresent: typeof headers['x-shelv-csrf'] === 'string' && headers['x-shelv-csrf'].length > 0,
      authorizationPresent: Object.keys(headers).some(k => k.toLowerCase() === 'authorization'),
      noStore: /(?:^|,)\s*no-store(?:,|$)/i.test(responseHeaders['cache-control'] ?? ''), command, status: response.status(), body };
    observations.requests.push(result);
    demand(!leak && body !== null, 'private or malformed notification response');
    demand(result.method === 'POST' && result.url === `${origin}/api/client/notifications` && result.origin === origin && result.csrfPresent && !result.authorizationPresent && result.noStore, 'notification HTTP boundary refused');
    return result;
  }
  async function action(label, target, actionName, trigger) {
    phase = label; await sameOrigin();
    const waiting = page.waitForResponse(r => {
      if (r.url() !== `${origin}/api/client/notifications` || r.request().method() !== 'POST') return false;
      try { return r.request().postDataJSON()?.action === actionName; } catch { return false; }
    }, { timeout: 15000 });
    // Join the waiter even if the action fails; no dangling promise/resource.
    const results = await Promise.allSettled([waiting, Promise.resolve().then(trigger)]);
    demand(results.every(r => r.status === 'fulfilled'), 'browser action or response unavailable');
    return record(label, results[0].value, target);
  }
  const rowFor = t => page.locator('.notification-row').filter({ has: page.locator(`a[href="${hrefOf(t)}"]`) });
  async function captureView(label, target, observedItem = null) {
    await sameOrigin();
    const rows = page.locator('.notification-row'), row = rowFor(target);
    const text = await page.locator('body').innerHTML();
    const count = await row.count(), link = count === 1 ? await row.getByRole('link', { name: 'open update', exact: true }).getAttribute('href') : null;
    observations.views.push({ label, url: page.url(), ownDeliveryId: count === 1 ? observedItem?.deliveryId ?? null : null, href: link,
      seen: count === 1 && await row.getByText('seen', { exact: true }).count() === 1,
      privateLeak: scenario.privateMarkers.some(m => text.includes(m)),
      // IDs are not in UI: owner isolation is also checked against actual wire
      // rows. Distinct-version other-owner links provide an additional UI check.
      otherOwnerVisible: scenario.a.publicationVersion !== scenario.b.publicationVersion && await rows.locator(`a[href="${hrefOf(target === scenario.a ? scenario.b : scenario.a)}"]`).count() > 0,
      historicalVisible: label === 'destination' && await page.getByText('historical plan', { exact: true }).count() > 0,
      notificationRows: await rows.count() });
    demand(!observations.views.at(-1).privateLeak, 'private marker visible');
  }
  async function findInbox(label, target, trigger) {
    await readSession(target.clientId);
    let result = await action(label, target, 'list_inbox_v1', trigger);
    const cursors = new Set();
    // A live keyset page is never asserted to be a complete immutable inbox.
    for (let n = 0; n < 10; n++) {
      demand(result.status === 200 && isPage(result.body), 'inbox unavailable');
      if (result.body.items.some(i => i.deliveryId === target.portalDeliveryId && i.event.eventId === target.notificationEventId)) {
        // Labels select the actual page containing the producer's delivery.
        result.label = label;
        await rowFor(target).waitFor({ state: 'visible', timeout: 15000 });
        await captureView(label, target, result.body.items.find(i => i.deliveryId === target.portalDeliveryId)); return result;
      }
      const next = result.body.nextCursor;
      demand(next && !cursors.has(next), 'target absent from bounded inbox scan'); cursors.add(next);
      result.label = `${label}:scan:${n}`;
      result = await action(label, target, 'list_inbox_v1', () => page.getByRole('button', { name: 'next page', exact: true }).click());
    }
    throw new Error('bounded inbox scan exhausted');
  }
  async function post(label, target, command) {
    await readSession(label === 'signedout_denial' ? null : target.clientId);
    return action(label, target, command.action, () => page.evaluate(async cmd => {
      const control = await fetch('/api/client/session', { credentials: 'same-origin', cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(15000) });
      const s = await control.json();
      if (control.status !== 200 || typeof s.csrf !== 'string' || !s.csrf) throw new Error('actual csrf unavailable');
      // Cookie comes from the browser. Only the fresh real CSRF control is used.
      const response = await fetch('/api/client/notifications', { method: 'POST', credentials: 'same-origin', cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(15000),
        headers: { 'content-type': 'application/json', 'x-shelv-csrf': s.csrf }, body: JSON.stringify(cmd) });
      await response.arrayBuffer();
    }, command));
  }
  async function logout() {
    await sameOrigin();
    const waiting = page.waitForResponse(r => r.url() === `${origin}/api/client/logout` && r.request().method() === 'POST', { timeout: 15000 });
    const results = await Promise.allSettled([waiting, Promise.resolve().then(() => page.getByRole('button', { name: 'sign out', exact: true }).click())]);
    demand(results.every(r => r.status === 'fulfilled') && results[0].value.status() === 200, 'ordinary logout unavailable');
    const headers = await results[0].value.request().allHeaders();
    observations.logouts.push({ actorId: session?.ownerId ?? null, status: results[0].value.status(), url: results[0].value.url(), origin: headers.origin ?? null,
      csrfPresent: !!headers['x-shelv-csrf'], authorizationPresent: Object.keys(headers).some(k => k.toLowerCase() === 'authorization') });
    await page.locator('.notification-row').first().waitFor({ state: 'detached', timeout: 15000 });
    await readSession(null);
  }
  try {
    await sameOrigin();
    await readSession(scenario.a.clientId);
    await page.goto(`${origin}/plan`, { waitUntil: 'domcontentloaded' });
    const first = await findInbox('inbox_a', scenario.a, () => page.getByRole('link', { name: 'notifications', exact: true }).click());
    demand(first.body.items.find(i => i.deliveryId === scenario.a.portalDeliveryId).seenAt === null, 'M04 delivery must start unseen');
    phase = 'destination';
    const destinationWaiting = page.waitForResponse(r => {
      if (r.url() !== `${origin}/api/client/reviews` || r.request().method() !== 'POST') return false;
      try { const c = r.request().postDataJSON(); return c.action === 'read_client_plan_v3' && c.version === scenario.a.publicationVersion; } catch { return false; }
    }, { timeout: 15000 });
    const destinationResults = await Promise.allSettled([destinationWaiting, rowFor(scenario.a).getByRole('link', { name: 'open update', exact: true }).click()]);
    demand(destinationResults.every(r => r.status === 'fulfilled'), 'historical V3 request unavailable');
    const destinationResponse = destinationResults[0].value, destinationRequest = destinationResponse.request();
    const destinationHeaders = await destinationRequest.allHeaders(), destinationResponseHeaders = await destinationResponse.allHeaders();
    const destinationText = await destinationResponse.text();
    let destinationBody = null;
    try { destinationBody = JSON.parse(destinationText); } catch { /* Safe metadata only. */ }
    observations.destinationRead = { method: destinationRequest.method(), url: destinationRequest.url(), origin: destinationHeaders.origin ?? null,
      csrfPresent: !!destinationHeaders['x-shelv-csrf'], authorizationPresent: Object.keys(destinationHeaders).some(k => k.toLowerCase() === 'authorization'),
      noStore: /(?:^|,)\s*no-store(?:,|$)/i.test(destinationResponseHeaders['cache-control'] ?? ''), command: destinationRequest.postDataJSON(),
      status: destinationResponse.status(), schemaVersion: destinationBody?.schemaVersion ?? null, publicationVersion: destinationBody?.plan?.version ?? null,
      privateLeak: scenario.privateMarkers.some(m => destinationText.includes(m)) };
    demand(observations.destinationRead.status === 200 && observations.destinationRead.schemaVersion === 3 && observations.destinationRead.publicationVersion === scenario.a.publicationVersion && !observations.destinationRead.privateLeak, 'historical V3 observation refused');
    await page.getByText('historical plan', { exact: true }).waitFor({ state: 'visible', timeout: 15000 });
    await captureView('destination', scenario.a);
    await findInbox('return_to_inbox', scenario.a, () => page.getByRole('link', { name: 'notifications', exact: true }).click());
    const seen = await action('seen', scenario.a, 'mark_seen_v1', () => rowFor(scenario.a).getByRole('button', { name: 'mark seen', exact: true }).click());
    demand(seen.status === 200 && isWrite(seen.command) && isReceipt(seen.body), 'seen result unavailable');
    await rowFor(scenario.a).getByText('seen', { exact: true }).waitFor({ state: 'visible', timeout: 15000 });
    await checkpoint('after_seen');
    await findInbox('refresh', scenario.a, () => page.reload({ waitUntil: 'domcontentloaded' }));
    await post('replay', scenario.a, seen.command);
    await post('status', scenario.a, { schemaVersion: 1, action: 'request_status_v1', original: seen.command });
    await checkpoint('after_replay');
    await logout();
    await relogin({ page, actor: 'b', returnTo: '/plan' });
    await sameOrigin();
    await page.goto(`${origin}/plan`, { waitUntil: 'domcontentloaded' });
    await findInbox('inbox_b', scenario.b, () => page.getByRole('link', { name: 'notifications', exact: true }).click());
    const freshCommand = async () => ({ ...seen.command, requestId: await page.evaluate(() => crypto.randomUUID()) });
    await post('owner_denial', scenario.b, await freshCommand());
    await post('owner_status_denial', scenario.b, { schemaVersion: 1, action: 'request_status_v1', original: seen.command });
    await post('private_event_denial', scenario.b, { schemaVersion: 1, action: 'read_event_deliveries_v1', eventId: scenario.a.notificationEventId, cursor: null, limit: 50 });
    await checkpoint('after_owner_denial');
    await logout();
    await captureView('signedout', scenario.b);
    await post('signedout_denial', scenario.b, await freshCommand());
    await checkpoint('after_session_denial');
    await relogin({ page, actor: 'a', returnTo: '/plan' });
    await sameOrigin();
    await page.goto(`${origin}/plan`, { waitUntil: 'domcontentloaded' });
    await findInbox('relogin', scenario.a, () => page.getByRole('link', { name: 'notifications', exact: true }).click());
    await checkpoint('after_relogin');
  } catch {
    // No raw response/credential/DOM/exception text in the public handoff.
    errors.push(`phase_refused:${phase}`);
  }
  return { classification: 'OBSERVATIONS_ONLY', observations, canonical, errors };
}

/** Pure consistency oracle. Supplied observations never confer authenticity,
 * currentness, resource custody, acceptance or release authority. */
export function evaluateNotificationInboxEvidence({ descriptor, notificationScenario: scenario, observations, canonical }) {
  input(descriptor, scenario);
  const issues = new Set(), check = (id, ok) => { if (!ok) issues.add(id); };
  const binding = bindingOf(descriptor), a = scenario.a, b = scenario.b;
  const requests = observations?.requests ?? [], views = observations?.views ?? [];
  const req = label => requests.find(r => r.label === label), view = label => views.find(v => v.label === label);
  check('binding', observations?.classification === 'OBSERVATIONS_ONLY' && equal(observations.binding, binding));
  const canon = Array.isArray(canonical) ? canonical : [];
  check('canonical_missing', canon.length === snapshots.length && snapshots.every(l => canon.filter(s => s.label === l).length === 1));
  const snap = label => canon.find(s => s.label === label);
  for (const s of canon) {
    check('binding', equal(s.binding, binding));
    check('canonical_shape', instant(s.observedAt) && Array.isArray(s.targets) && s.targets.length === 2 && Array.isArray(s.journal) && keys(s.protectedState, protectedKeys) && Object.values(s.protectedState).every(hash));
    for (const t of [a, b]) {
      const r = s.targets?.find(x => x.clientId === t.clientId), e = r?.event, d = r?.delivery, p = r?.publicationReceipt, receipt = p?.receipt;
      check('publication_relationship', !!r && r.entitled === true && r.publicationRequestMatches === true &&
        r.publication?.client_id === t.clientId && r.publication.version === t.publicationVersion && instant(r.publication.published_at) &&
        e?.id === t.notificationEventId && e.client_id === t.clientId && e.publication_version === t.publicationVersion && e.kind === 'plan_published' && e.source_kind === 'publication' && e.source_id === null && e.source_version === null &&
        d?.id === t.portalDeliveryId && d.event_id === e.id && d.recipient_id === t.clientId && d.channel === 'portal' && integer(d.revision) &&
        p?.id === t.publicationReceiptId && p.client_id === t.clientId && p.version === t.publicationVersion && p.event_id === e.id && p.request_id === t.publishRequestId &&
        receipt?.requestId === t.publishRequestId && receipt.publicationReceiptId === p.id && receipt.publicationVersion === t.publicationVersion && receipt.notificationEventId === e.id);
    }
  }
  const baseline = snap('baseline');
  for (const s of canon) check('protected_state', equal(s.protectedState, baseline?.protectedState));
  for (const r of requests) {
    check('http_boundary', r.method === 'POST' && r.url === `${descriptor.endpoints.portal}/api/client/notifications` && r.origin === descriptor.endpoints.portal && r.csrfPresent === true && r.authorizationPresent === false && r.noStore === true);
    const c = r.command, body = r.body;
    check('private_projection', !scenario.privateMarkers.some(m => stable(body)?.includes(m)) && Buffer.byteLength(JSON.stringify(body ?? null)) <= 100000);
    if (r.status === 200) {
      check('http_identity', r.sessionOwnerId === r.actorId && [a.clientId, b.clientId].includes(r.actorId) && hash(r.sessionIdentityDigest));
      if (c?.action === 'list_inbox_v1') {
        check('private_projection', isPage(body));
        check('inbox_ownership', isPage(body) && body.items.every(i => {
          const t = r.actorId === a.clientId ? a : b;
          return i.deliveryId === t.portalDeliveryId && i.event.eventId === t.notificationEventId && i.event.source.publicationVersion === t.publicationVersion;
        }));
        check('list_binding', keys(c, ['schemaVersion', 'action', 'cursor', 'limit']) && c.schemaVersion === 1 && integer(c.limit) && c.limit > 0 && c.limit <= 50 && isPage(body) && body.cursor === c.cursor && body.items.length <= c.limit);
        check('inbox_order', isPage(body) && body.items.every((i, n) => i.deliveryId > (n === 0 ? body.cursor?.slice(2) ?? '' : body.items[n - 1].deliveryId)) && (body.nextCursor === null || body.nextCursor > (body.cursor ?? '') && body.nextCursor.slice(2) >= (body.items.at(-1)?.deliveryId ?? '')));
      } else if (c?.action === 'mark_seen_v1') check('private_projection', isWrite(c) && isReceipt(body));
      else check('private_projection', keys(c, ['schemaVersion', 'action', 'original']) && c.schemaVersion === 1 && c.action === 'request_status_v1' && isWrite(c.original) && keys(body, ['status', 'receipt']) && body.status === 'committed' && isReceipt(body.receipt));
    } else check('private_projection', keys(body, ['code']) && typeof body.code === 'string');
  }
  const seen = req('seen'), cmd = seen?.command, receipt = seen?.body;
  const before = baseline?.targets?.find(t => t.clientId === a.clientId)?.delivery;
  const after = snap('after_seen')?.targets?.find(t => t.clientId === a.clientId)?.delivery;
  const withoutSeen = d => d ? Object.fromEntries(Object.entries(d).filter(([k]) => !['revision', 'seen_at', 'updated_at'].includes(k))) : null;
  check('seen_effect', seen?.status === 200 && seen.actorId === a.clientId && isWrite(cmd) && cmd.deliveryId === a.portalDeliveryId && cmd.expectedRevision === before?.revision && before?.seen_at === null &&
    isReceipt(receipt) && receipt.requestId === cmd.requestId && receipt.deliveryId === cmd.deliveryId && receipt.previousRevision === before.revision && receipt.revision === before.revision + 1 && receipt.effect === 'seen' &&
    after?.revision === receipt.revision && instant(after.seen_at) && Date.parse(after.seen_at) === Date.parse(receipt.recordedAt) && equal(withoutSeen(before), withoutSeen(after)));
  const afterSeen = snap('after_seen');
  const added = afterSeen?.journal?.filter(j => !baseline?.journal?.some(old => equal(j, old))) ?? [];
  check('journal_binding', added.length === 1 && baseline?.journal?.every(old => afterSeen?.journal?.some(j => equal(j, old))) && added[0]?.actor_id === a.clientId && added[0]?.request_id === cmd?.requestId && added[0]?.delivery_id === a.portalDeliveryId && added[0]?.event_id === a.notificationEventId && equal(added[0]?.command, cmd) && equal(added[0]?.result, receipt) && added[0]?.fingerprintMatches === true);
  check('seen_other_owner', equal(baseline?.targets?.find(t => t.clientId === b.clientId), afterSeen?.targets?.find(t => t.clientId === b.clientId)));
  const sameSeenSession=r=>r?.actorId===a.clientId&&r?.sessionOwnerId===a.clientId&&hash(r?.sessionIdentityDigest)&&r.sessionIdentityDigest===seen?.sessionIdentityDigest;
  const sameBSession=r=>r?.actorId===b.clientId&&r?.sessionOwnerId===b.clientId&&hash(r?.sessionIdentityDigest)&&r.sessionIdentityDigest===req('inbox_b')?.sessionIdentityDigest;
  check('replay_effects', sameSeenSession(req('replay')) && req('replay')?.status === 200 && equal(req('replay')?.command, cmd) && equal(req('replay')?.body, receipt) && equal(stateOf(snap('after_replay')), stateOf(afterSeen)));
  check('status_binding', sameSeenSession(req('status')) && req('status')?.status === 200 && equal(req('status')?.command?.original, cmd) && equal(req('status')?.body, { status: 'committed', receipt }));
  const denied = (label, status) => req(label)?.status === status && req(label)?.body?.code === (status === 401 ? 'session_ended' : 'not_found') && req(label)?.actorId === b.clientId;
  check('owner_denial', denied('owner_denial', 404) && sameBSession(req('owner_denial')) && isWrite(req('owner_denial')?.command) && req('owner_denial').command.deliveryId === a.portalDeliveryId && req('owner_denial').command.requestId !== cmd?.requestId && denied('owner_status_denial', 404) && sameBSession(req('owner_status_denial')) && equal(req('owner_status_denial')?.command, {schemaVersion:1,action:'request_status_v1',original:cmd}));
  check('private_event_denial', req('private_event_denial')?.status === 403 && req('private_event_denial')?.body?.code === 'action_forbidden' && sameBSession(req('private_event_denial')) && equal(req('private_event_denial')?.command, { schemaVersion: 1, action: 'read_event_deliveries_v1', eventId: a.notificationEventId, cursor: null, limit: 50 }));
  check('owner_denial_effects', equal(stateOf(snap('after_owner_denial')), stateOf(snap('after_replay'))));
  check('session_denial', denied('signedout_denial', 401) && req('signedout_denial')?.sessionOwnerId === null && isWrite(req('signedout_denial')?.command) && req('signedout_denial').command.deliveryId === a.portalDeliveryId);
  check('session_denial_effects', equal(stateOf(snap('after_session_denial')), stateOf(snap('after_owner_denial'))));
  for (const label of ['inbox_a', 'refresh', 'relogin', 'inbox_b']) {
    const r = req(label), t = label === 'inbox_b' ? b : a, seenExpected = label === 'refresh' || label === 'relogin';
    check('visible_list', r?.status === 200 && r.actorId === t.clientId && isPage(r.body) && r.body.items.some(i => i.deliveryId === t.portalDeliveryId && (seenExpected ? instant(i.seenAt) && i.revision === after?.revision : i.seenAt === null)));
    check('private_ui', view(label)?.privateLeak === false && view(label)?.otherOwnerVisible === false && view(label)?.ownDeliveryId === t.portalDeliveryId && view(label)?.seen === seenExpected && view(label)?.href === hrefOf(t));
  }
  check('safe_destination', view('destination')?.url === `${descriptor.endpoints.portal}${hrefOf(a)}` && view('destination')?.historicalVisible === true && view('destination')?.privateLeak === false);
  const destination = observations?.destinationRead;
  check('destination_http', destination?.method === 'POST' && destination.url === `${descriptor.endpoints.portal}/api/client/reviews` && destination.origin === descriptor.endpoints.portal && destination.csrfPresent === true && destination.authorizationPresent === false && destination.noStore === true && destination.status === 200 && destination.schemaVersion === 3 && destination.publicationVersion === a.publicationVersion && destination.privateLeak === false && equal(destination.command, { schemaVersion: 1, action: 'read_client_plan_v3', version: a.publicationVersion }));
  check('relogin_persistence', req('relogin')?.sessionOwnerId === a.clientId && hash(req('relogin')?.sessionIdentityDigest) && req('relogin').sessionIdentityDigest !== req('inbox_a')?.sessionIdentityDigest && view('relogin')?.seen === true && equal(stateOf(snap('after_relogin')), stateOf(snap('after_session_denial'))));
  check('signedout_private_ui', view('signedout')?.notificationRows === 0 && view('signedout')?.privateLeak === false);
  check('ordinary_logout', observations?.logouts?.length === 2 && observations.logouts.every((r, i) => r.actorId === (i === 0 ? a.clientId : b.clientId) && r.status === 200 && r.url === `${descriptor.endpoints.portal}/api/client/logout` && r.origin === descriptor.endpoints.portal && r.csrfPresent === true && r.authorizationPresent === false));
  return { classification: 'OBSERVATIONS_ONLY', acceptance: 'NOT_EVALUATED', issues: [...issues].sort() };
}
