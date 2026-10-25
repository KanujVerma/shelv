import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile, mkdir, mkdtemp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {dirname, extname, join, resolve, sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {Miniflare, convertV4MiniflareOptions} from 'miniflare';
import {createPreviewRequests} from '../../../site/advisor/fixtures.js';

// All URLs below are intercepted locally. Neither Chrome nor workerd contacts a provider.
// Catches shared owner/session state in the gateway, Vault or browser restore path, and
// a fail-open authorization mismatch. It does not test hosted provider RLS or email delivery.
const origin = 'https://portal.goshelv.com';
const providerOrigin = 'https://snojlbqovlawewwqbviz.supabase.co';
const runtimeRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const siteRoot = resolve(runtimeRoot, '../candidate/site');
const owners = [
  {id: '11111111-1111-4111-8111-111111111111', session: '22222222-2222-4222-8222-222222222222', email: 'owner-a@example.test', code: 'synthetic-owner-a-code', title: 'SYNTHETIC OWNER A PLAN', marker: 'PUBLIC_PLAN_CANARY_OWNER_A'},
  {id: '33333333-3333-4333-8333-333333333333', session: '44444444-4444-4444-8444-444444444444', email: 'owner-b@example.test', code: 'synthetic-owner-b-code', title: 'SYNTHETIC OWNER B PLAN', marker: 'PUBLIC_PLAN_CANARY_OWNER_B'}
];
const capabilities = {view: true, edit: false, publish: false, confirmPayments: false};
const credentialPattern = /synthetic-refresh|synthetic-signature|access_token|refresh_token/;
const mime: Record<string, string> = {'.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.html': 'text/html', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp'};

function token(index: number) {
  return [Buffer.from('{}').toString('base64url'), Buffer.from(JSON.stringify({iss: providerOrigin + '/auth/v1', sub: owners[index].id, session_id: owners[index].session, role: 'authenticated', is_anonymous: false, exp: Math.floor(Date.now() / 1000) + 3600})).toString('base64url'), 'synthetic-signature'].join('.');
}
function user(index: number) {
  return {id: owners[index].id, email: owners[index].email, is_anonymous: false, aud: 'authenticated', created_at: '2026-10-22T00:00:00Z', app_metadata: {}, user_metadata: {}};
}
function identityFromToken(raw: string | null) {
  const payload = raw?.replace(/^Bearer /, '').split('.')[1];
  assert.ok(payload, 'synthetic provider requires a caller identity');
  const claims = JSON.parse(Buffer.from(payload, 'base64url').toString());
  const index = owners.findIndex(owner => owner.id === claims.sub && owner.session === claims.session_id);
  assert.notEqual(index, -1, 'synthetic provider refuses an unrecognized owner/session pair');
  return index;
}

async function stack() {
  const artifactRoot = resolve(process.env.PORTAL_TWO_OWNER_ARTIFACT_DIR || join(tmpdir(), 'shelv-two-owner-tests'));
  await mkdir(artifactRoot, {recursive: true});
  const bundleDir = await mkdtemp(join(artifactRoot, 'two-owner-stack-'));
  // Build unchanged entry points to a private test directory; never touch dist or build-profile.
  await Promise.all([
    build({absWorkingDir: runtimeRoot, entryPoints: ['server/client-gateway.ts'], bundle: true, format: 'esm', platform: 'browser', target: 'es2022', outfile: join(bundleDir, 'gateway.mjs'), external: ['cloudflare:workers'], legalComments: 'none'}),
    build({absWorkingDir: runtimeRoot, entryPoints: ['workers/session-vault/index.ts'], bundle: true, format: 'esm', platform: 'browser', target: 'es2022', outfile: join(bundleDir, 'vault.mjs'), external: ['cloudflare:workers'], legalComments: 'none'})
  ]);
  const previews = owners.map(() => createPreviewRequests({scenario: 'unapproved'}));
  const challenges = new Map<number, string>();
  const mismatch = new Set<number>();
  const domainReads = [0, 0];
  let held: {index: number; entered: () => void; gate: Promise<void>} | null = null;
  const networkErrors: string[] = [];
  const outbound = async (request: any) => {
    const url = new URL(request.url);
    assert.equal(url.origin, providerOrigin, 'all provider traffic terminates in this local fixture');
    if (url.pathname === '/auth/v1/otp') {
      const body = await request.json();
      const index = owners.findIndex(owner => owner.email === body.email);
      assert.notEqual(index, -1);
      assert.equal(body.create_user, false);
      assert.equal(url.searchParams.get('redirect_to'), origin + '/?workspace=client');
      assert.equal(typeof body.code_challenge, 'string');
      challenges.set(index, body.code_challenge);
      return Response.json({});
    }
    if (url.pathname === '/auth/v1/token') {
      const body = await request.json();
      const index = owners.findIndex(owner => owner.code === body.auth_code || body.refresh_token === 'synthetic-refresh-' + owner.id);
      assert.notEqual(index, -1);
      if (body.auth_code) assert.equal(createHash('sha256').update(body.code_verifier).digest('base64url'), challenges.get(index), 'each synthetic code uses its own requested verifier');
      return Response.json({access_token: token(index), refresh_token: 'synthetic-refresh-' + owners[index].id, expires_in: 3600, token_type: 'bearer', user: user(index)});
    }
    const index = identityFromToken(request.headers.get('authorization'));
    if (url.pathname === '/auth/v1/user') return Response.json(user(index));
    if (url.pathname === '/auth/v1/logout') return new Response(null, {status: 204});
    if (url.pathname === '/rest/v1/rpc/concierge_client_session_context') {
      return Response.json({ownerId: owners[mismatch.has(index) ? 1 - index : index].id, providerSessionId: owners[index].session, role: 'client', sessionNotAfter: null, capabilities});
    }
    assert.equal(url.pathname, '/functions/v1/concierge-operations');
    const command = await request.json();
    assert.equal(command.action, 'client_read_v2');
    domainReads[index]++;
    if (held?.index === index) {
      const wait = held;
      held = null;
      wait.entered();
      await wait.gate;
    }
    // Fault applies only to this synthetic provider response, never to a production guard.
    const planIndex = process.env.PORTAL_TWO_OWNER_WRONG_PLAN === '1' && index === 0 ? 1 : index;
    const data = await previews[planIndex].core(command);
    data.plan.presentation.title = owners[planIndex].title;
    data.plan.presentation.summary = owners[planIndex].marker;
    data.plan.presentation.preparedBy = owners[planIndex].marker;
    return Response.json(data);
  };
  const assets = async (request: any) => {
    const path = new URL(request.url).pathname;
    if (path === '/portal-config.json') return Response.json({authUrl: providerOrigin, publishableKey: 'sb_publishable_synthetic', operationsUrl: providerOrigin + '/functions/v1/concierge-operations', clientSharedSessions: true, advisorSharedSessions: false});
    if (path === '/__synthetic_blank.html') return new Response('<h1>PUBLIC SYNTHETIC HISTORY PAGE</h1>', {headers: {'Content-Type': 'text/html'}});
    const file = resolve(siteRoot, '.' + decodeURIComponent(path.replace(/\/$/, '/index.html')));
    assert.ok(file.startsWith(siteRoot + sep));
    try { return new Response(await readFile(file), {headers: {'Content-Type': mime[extname(file)] || 'application/octet-stream'}}); }
    catch { return new Response('not found', {status: 404}); }
  };
  const config: any = {cf: false, logRequests: false, upstream: origin, workers: [
    {name: 'gateway', routes: ['portal.goshelv.com/*'], modules: true, modulesRoot: bundleDir, scriptPath: join(bundleDir, 'gateway.mjs'), compatibilityDate: '2026-10-20', compatibilityFlags: ['nodejs_compat'], bindings: {PORTAL_ORIGIN: origin, CLIENT_SHARED_SESSIONS: 'true'}, durableObjects: {ADVISOR_SESSIONS: {className: 'AdvisorSessionObject', scriptName: 'vault', useSQLite: true}}, serviceBindings: {ASSETS: assets}, outboundService: async () => { throw Error('unexpected gateway outbound'); }},
    {name: 'vault', modules: true, modulesRoot: bundleDir, scriptPath: join(bundleDir, 'vault.mjs'), compatibilityDate: '2026-10-20', compatibilityFlags: ['nodejs_compat'], bindings: {PORTAL_ORIGIN: origin, CLIENT_SHARED_SESSIONS: 'true', SUPABASE_PUBLIC_KEY: 'sb_publishable_synthetic', ADVISOR_SESSION_KEYS: JSON.stringify({active: 'synthetic', keys: {synthetic: Buffer.alloc(32, 41).toString('base64url')}}), SESSION_IDLE_SECONDS: '3600', SESSION_ABSOLUTE_SECONDS: '28800', SESSION_FLOW_SECONDS: '600', CLIENT_REMEMBER_IDLE_SECONDS: '604800', CLIENT_REMEMBER_ABSOLUTE_SECONDS: '2592000'}, durableObjects: {ADVISOR_SESSIONS: {className: 'AdvisorSessionObject', useSQLite: true}}, outboundService: outbound}
  ]};
  const mf = new Miniflare({...convertV4MiniflareOptions(config), telemetry: {enabled: false}});
  async function bind(context: any, index: number) {
    context.on('page', (page: any) => page.on('pageerror', (error: Error) => networkErrors.push(error.message)));
    await context.route('**/*', async (route: any) => {
      const request = route.request(), url = new URL(request.url());
      if (url.origin !== origin) {networkErrors.push('blocked external origin ' + url.origin); return route.abort();}
      try {
        const headers = await request.allHeaders();
        assert.equal(headers.authorization, undefined, 'browser does not receive or send provider tokens');
        headers['cf-connecting-ip'] = '192.0.2.' + (210 + index);
        if (url.pathname.startsWith('/api/client/') && !headers.origin) headers.origin = origin;
        const response = await mf.dispatchFetch(request.url(), {method: request.method(), headers, body: request.postDataBuffer() ?? undefined});
        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value: string, key: string) => responseHeaders[key] = value);
        await route.fulfill({status: response.status, headers: responseHeaders, body: Buffer.from(await response.arrayBuffer())});
      } catch (error: any) {networkErrors.push(error.message); await route.abort().catch(() => {});}
    });
  }
  function holdRead(index: number) {
    let enter!: () => void, release!: () => void;
    const entered = new Promise<void>(resolve => enter = resolve), gate = new Promise<void>(resolve => release = resolve);
    held = {index, entered: enter, gate};
    return {entered, release};
  }
  return {mf, bind, domainReads, networkErrors, holdRead, mismatch: (index: number) => mismatch.add(index)};
}

async function login(page: any, index: number) {
  await page.goto(origin + '/?workspace=client');
  await page.locator('#login-email').fill(owners[index].email);
  await page.locator('#remember-device').check();
  await page.getByRole('button', {name: 'Send sign-in link'}).click();
  await page.getByText(/on its way/).waitFor();
  await page.goto(origin + '/?workspace=client&code=' + owners[index].code);
  await assertPlan(page, index);
  assert.equal(new URL(page.url()).searchParams.has('code'), false);
}
async function assertPlan(page: any, index: number) {
  await page.locator('header h1').waitFor();
  assert.equal(await page.locator('header h1').innerText(), owners[index].title);
  let body = await page.locator('body').innerText();
  assert.ok(body.includes(owners[index].marker));
  assert.ok(!body.includes(owners[1 - index].marker), 'other owner plan marker is absent');
  assert.ok(!body.includes(owners[1 - index].title), 'other owner plan title is absent');
  await page.locator('#client-profile').click();
  body = await page.locator('dialog[open]').innerText();
  assert.ok(body.includes(owners[index].marker), 'plan body belongs to the signed-in owner');
  assert.ok(!body.includes(owners[1 - index].marker));
  await page.keyboard.press('Escape');
}
async function sessionView(page: any) {
  return page.evaluate(async () => {
    const response = await fetch('/api/client/session');
    return {status: response.status, body: await response.json()};
  });
}
async function operation(page: any, command: any, csrf?: string) {
  return page.evaluate(async ({body, knownCsrf}: any) => {
    const session = knownCsrf ? {csrf: knownCsrf} : await (await fetch('/api/client/session')).json();
    const response = await fetch('/api/client/operations', {method: 'POST', headers: {'Content-Type': 'application/json', 'X-Shelv-CSRF': session.csrf}, body: JSON.stringify(body)});
    return {status: response.status, body: await response.text(), cache: response.headers.get('cache-control')};
  }, {body: command, knownCsrf: csrf});
}
async function assertSignedOut(page: any) {
  await page.locator('#login-email').waitFor();
  assert.equal(await page.locator('.client-portal,dialog').count(), 0);
  const body = await page.locator('body').innerText();
  for (const owner of owners) {assert.ok(!body.includes(owner.title)); assert.ok(!body.includes(owner.marker));}
}
async function noBrowserCredentials(context: any) {
  for (const page of context.pages()) {
    const storage = await page.evaluate(() => ({local: {...localStorage}, session: {...sessionStorage}, cookie: document.cookie}));
    assert.doesNotMatch(JSON.stringify(storage), credentialPattern);
    assert.ok(!storage.cookie.includes('__Host-shelv_client='), 'authentication cookie is HttpOnly');
  }
}

test('two authenticated clients keep distinct rendered plans through reload, context reopen, browser history and one-client logout', {timeout: 90000}, async () => {
  const f = await stack();
  let browser: any;
  const contexts: any[] = [];
  try {
    const {chromium} = await import(new URL('../../../node_modules/playwright-core/index.mjs', import.meta.url).href);
    browser = await chromium.launch({channel: 'chrome', headless: true});
    const pair = await Promise.all(owners.map(async (_, index) => {
      const context = await browser.newContext({serviceWorkers: 'block'}); contexts.push(context);
      await f.bind(context, index);
      const page = await context.newPage(); page.setDefaultTimeout(8000);
      await login(page, index);
      return {context, page};
    }));
    const views = await Promise.all(pair.map(({page}) => sessionView(page)));
    assert.deepEqual(views.map(view => view.status), [200, 200]);
    assert.deepEqual(views.map(view => view.body.ownerId), [owners[0].id, owners[1].id]);
    const cookies = await Promise.all(pair.map(async ({context}) => (await context.cookies()).find((cookie: any) => cookie.name === '__Host-shelv_client')));
    assert.ok(cookies.every(cookie => cookie?.httpOnly && cookie.secure && cookie.expires > Date.now() / 1000));
    assert.notEqual(cookies[0].value, cookies[1].value, 'each browser context has its own opaque session');
    await Promise.all(pair.map(async ({page}, index) => {await page.reload(); await assertPlan(page, index);}));
    await Promise.all(pair.map(({context}) => noBrowserCredentials(context)));

    // This is a context reopen using each own storageState, not a Chrome process restart.
    const states = await Promise.all(pair.map(({context}) => context.storageState()));
    await Promise.all(pair.map(({context}) => context.close()));
    const returned = await Promise.all(states.map(async (state, index) => {
      const context = await browser.newContext({storageState: state, serviceWorkers: 'block'}); contexts.push(context);
      await f.bind(context, index); const page = await context.newPage(); page.setDefaultTimeout(8000);
      await page.goto(origin + '/'); await assertPlan(page, index); return {context, page};
    }));
    const a = returned[0].page, b = returned[1].page;
    await a.goto(origin + '/__synthetic_blank.html');
    await a.goBack(); await assertPlan(a, 0);
    await a.goForward(); assert.equal(await a.locator('h1').innerText(), 'PUBLIC SYNTHETIC HISTORY PAGE');
    await a.goBack(); await assertPlan(a, 0); await assertPlan(b, 1);

    const before = [...f.domainReads];
    for (const [page, other] of [[a, 1], [b, 0]] as const) {
      const denied = await operation(page, {action: 'client_read_v2', clientId: owners[other].id});
      assert.equal(denied.status, 400);
      assert.deepEqual(JSON.parse(denied.body), {code: 'invalid_request'});
      assert.match(denied.cache, /private, no-store/);
    }
    assert.deepEqual(f.domainReads, before, 'cross-owner selector attempts never dispatch a domain read');

    await a.locator('#client-signout').click(); await assertSignedOut(a);
    const ended = await sessionView(a); assert.equal(ended.status, 401); assert.equal(ended.body.code, 'session_ended');
    await a.reload(); await assertSignedOut(a);
    await b.reload(); await assertPlan(b, 1);
    assert.equal((await sessionView(b)).body.ownerId, owners[1].id);
    await Promise.all(returned.map(({context}) => noBrowserCredentials(context)));
    assert.deepEqual(f.networkErrors, []);
  } finally {
    try {
      await Promise.all(contexts.map(context => context.close().catch(() => {})));
      await browser?.close();
    } finally {await f.mf.dispose();}
  }
});

test('a provider owner mismatch revokes only its client and suppresses a held plan reply after logout', {timeout: 90000}, async () => {
  const f = await stack();
  let browser: any;
  const contexts: any[] = [];
  let release: (() => void) | undefined;
  try {
    const {chromium} = await import(new URL('../../../node_modules/playwright-core/index.mjs', import.meta.url).href);
    browser = await chromium.launch({channel: 'chrome', headless: true});
    const pair = await Promise.all(owners.map(async (_, index) => {
      const context = await browser.newContext({serviceWorkers: 'block'}); contexts.push(context); await f.bind(context, index);
      const page = await context.newPage(); page.setDefaultTimeout(8000); await login(page, index); return page;
    }));
    const [a, b] = pair;
    const prior = await sessionView(b);
    const readsBeforeMismatch = f.domainReads[1];
    f.mismatch(1);
    const denied = await operation(b, {action: 'client_read_v2'}, prior.body.csrf);
    assert.equal(denied.status, 403);
    assert.deepEqual(JSON.parse(denied.body), {code: 'forbidden'});
    assert.equal(f.domainReads[1], readsBeforeMismatch, 'mismatched authorization cannot reach the domain');
    for (const owner of owners) assert.ok(!denied.body.includes(owner.marker));
    await b.reload(); await assertSignedOut(b);
    const ended = await sessionView(b); assert.equal(ended.status, 401); assert.equal(ended.body.code, 'session_ended');
    await a.reload(); await assertPlan(a, 0);

    const hold = f.holdRead(0); release = hold.release;
    const pending = operation(a, {action: 'client_read_v2'});
    await hold.entered;
    await a.locator('#client-signout').click(); await assertSignedOut(a);
    release(); release = undefined;
    const late = await pending;
    assert.equal(late.status, 401);
    assert.deepEqual(JSON.parse(late.body), {code: 'session_ended'});
    for (const owner of owners) assert.ok(!late.body.includes(owner.marker));
    await a.reload(); await assertSignedOut(a);
    await Promise.all(contexts.map(context => noBrowserCredentials(context)));
    assert.deepEqual(f.networkErrors, []);
  } finally {
    try {
      release?.();
      await Promise.all(contexts.map(context => context.close().catch(() => {})));
      await browser?.close();
    } finally {await f.mf.dispose();}
  }
});
