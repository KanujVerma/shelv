import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';
import { build } from '../node_modules/esbuild/lib/main.js';
const root = fileURLToPath(new URL('../../../', import.meta.url)), evidence = path.join(root, '.local-artifacts/w2-notifications-entry');
// Optional test-only immutable source projection. No runtime operation, return,
// authority, session or clock method is replaced by this compiler binding.
export async function inputProjection() {
  const file = process.env.NOTIFICATIONS_ENTRY_INPUT_MANIFEST;
  if (!file) return [];
  const entries = JSON.parse(await readFile(file, 'utf8')), sources = new Map();
  for (const entry of entries) {
    const target = path.resolve(root, entry.path), source = path.resolve(root, entry.input);
    assert.ok(source.startsWith(evidence + path.sep));
    const bytes = await readFile(source);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), entry.sha256);
    sources.set(target, { contents: bytes.toString('utf8'), loader: target.endsWith('.tsx') ? 'tsx' : target.endsWith('.ts') ? 'ts' : 'js' });
  }
  return [{ name: 'exact-notification-source-inputs', setup(b) {
    b.onResolve({ filter: /^\./ }, args => { const target = path.resolve(path.dirname(args.importer), args.path); return sources.has(target) ? { path: target } : null; });
    b.onLoad({ filter: /\.[cm]?[jt]sx?$/ }, args => sources.get(args.path) ?? null);
  } }];
}
let compiled;
async function source() {
  if (compiled) return compiled;
  await mkdir(evidence, { recursive: true });
  const result = await build({ absWorkingDir: root, stdin: { contents: `
export {createNotificationsEntry,NotificationsEntryView} from './apps/portal/src/app/notifications-entry.tsx';
export {createAdvisorPublicationNotifications} from './apps/portal/src/app/advisor-notifications.ts';
export {createAdvisorPorts} from './apps/portal/src/app/ports.ts';
export {createAdvisorController} from './apps/portal/src/features/advisor/controller.ts';
export {AdvisorWorkspaceNotifications} from './apps/portal/src/app/AdvisorWorkspaceNotifications.tsx';
export {NavigationProvider} from './apps/portal/src/navigation/react.tsx';
export {OverlayProvider} from './apps/portal/src/ui/overlay.tsx';
export {createApplicationSession} from './apps/portal/src/app/session.ts';
export {createPortalNavigator} from './apps/portal/src/navigation/history.ts';
export {default as clientGateway,advisorGateway} from './apps/portal/session-integration/runtime/server/gateway.ts';
export {ClientProvider} from './apps/portal/session-integration/runtime/server/client-upstream.ts';
export {SupabaseProvider} from './apps/portal/session-integration/runtime/server/upstream.ts';
export {SessionVault} from './apps/portal/session-integration/runtime/server/session-vault.ts';
export {CredentialEnvelope} from './apps/portal/session-integration/runtime/server/credential-envelope.ts';
export {createNotificationPorts} from './supabase/functions/concierge-notifications/runtime.ts';
export {handleNotificationRequest} from './supabase/functions/concierge-notifications/handler.ts';
export {readNotificationCommand} from './src/contracts/PortalNotificationValidation.ts';
export {createElement} from 'react';export {renderToString} from 'react-dom/server';`,
    resolveDir: root, loader: 'tsx' }, bundle: true, platform: 'node', format: 'esm', write: false,
    outdir: path.join(evidence, 'absent-output'), metafile: true,
    banner: { js: "import { createRequire as sourceRequire } from 'node:module'; const require = sourceRequire(import.meta.url);" },
    tsconfig: 'apps/portal/tsconfig.frontend.json', plugins: await inputProjection(),
    alias: { react: path.resolve(root, 'apps/portal/node_modules/react'), 'react-dom': path.resolve(root, 'apps/portal/node_modules/react-dom') },
  });
  const file = path.join(evidence, `entry-source-${crypto.randomUUID()}.mjs`);
  await writeFile(file, result.outputFiles.find(x => x.path.endsWith('.js')).contents, { flag: 'wx' });
  await writeFile(file + '.inputs.json', JSON.stringify(result.metafile.inputs, null, 2), { flag: 'wx' });
  compiled = await import(pathToFileURL(file).href); return compiled;
}
export const id = n => `40000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
export const at = '2026-11-02T12:00:00Z';
export const event = { eventId: id(1), createdAt: at, source: { kind: 'publication', publicationVersion: 3 }, destination: { kind: 'plan_version', version: 3 } };
export const item = { deliveryId: id(2), revision: 4, seenAt: null, event, email: { status: 'failed', revision: 2 } };
export const page = (revision = 4, seenAt = null) => ({ schemaVersion: 1, consistency: 'live_keyset', observedAt: at, cursor: null, items: [{ ...item, revision, seenAt }], nextCursor: null });
export const receipt = c => ({ requestId: c.requestId, action: c.action, deliveryId: c.deliveryId, previousRevision: c.expectedRevision, revision: c.expectedRevision + 1, recordedAt: at, effect: c.action === 'mark_seen_v1' ? 'seen' : 'retry_queued' });
export function gate() { let enter, release; return { entered: new Promise(r => enter = r), promise: new Promise(r => release = r), enter: () => enter(), release: () => release() }; }
function virtualWindow(initial) {
  const entries = [{ url: initial, state: null }], listeners = new Map(); let index = 0;
  const location = { pathname: initial, search: '' };
  const setUrl = url => { const u = new URL(url, 'https://portal.synthetic.invalid'); location.pathname = u.pathname; location.search = u.search; };
  return { location, document: { activeElement: null, getElementById: () => null, querySelector: () => null }, scrollY: 0,
    scrollTo() {}, requestAnimationFrame: fn => queueMicrotask(fn),
    addEventListener(n, f) { if (!listeners.has(n)) listeners.set(n, new Set()); listeners.get(n).add(f); },
    removeEventListener(n, f) { listeners.get(n)?.delete(f); },
    history: { scrollRestoration: 'auto', get state() { return entries[index].state; },
      replaceState(state, _title, url) { entries[index] = { state, url }; setUrl(url); },
      pushState(state, _title, url) { entries.splice(++index); entries[index] = { state, url }; setUrl(url); },
      back() { this.go(-1); }, go(delta) { assert.ok(index + delta >= 0 && index + delta < entries.length); index += delta; setUrl(entries[index].url); for (const f of listeners.get('popstate') ?? []) f(); } } };
}
export async function entryFixture(t, { audience = 'client', edit = false, serial = false, initialPath = '/notifications', restore = true } = {}) {
  const api = await source(), commands = [], steps = [], planSteps = [], planCommands = [], events = [], queuedWaits = [];
  const origin = 'https://portal.goshelv.com', upstream = 'https://snojlbqovlawewwqbviz.supabase.co';
  const owner = id(90), providerSession = id(91); let now = Date.now(), record = null, contextPatch = {}, queued = 0;
  let login = { signedIn: true, ownerId: owner, generation: 1, csrf: 'SYNTHETIC-entry', capabilities: { view: true, edit, publish: false, confirmPayments: false }, idleExpiresAt: '2099-01-01', absoluteExpiresAt: '2099-01-02' };
  const token = [Buffer.from('{}').toString('base64url'), Buffer.from(JSON.stringify({ sub: owner, session_id: providerSession, jti: crypto.randomUUID(), exp: Math.floor(now / 1000) + 3600 })).toString('base64url'), 'synthetic'].join('.');
  const ports = api.createNotificationPorts({ supabaseUrl: upstream, publicKey: 'sb_publishable_synthetic', allowedOrigins: [origin], fetch: async (input, init) => {
    const u = new URL(String(input)); assert.equal(u.origin, upstream);
    if (u.pathname === '/auth/v1/user') return Response.json({ id: serial ? owner : login.ownerId, is_anonymous: false });
    assert.equal(u.pathname, '/rest/v1/rpc/concierge_notification_command_v1');
    const c = api.readNotificationCommand(JSON.parse(init.body).p_command), step = steps.shift();
    assert.ok(step, 'unexpected Root RPC ' + c.action); assert.equal(c.action, step.action); commands.push(c); events.push(c.action + ':start');
    if (step.hold) { step.hold.enter(); await step.hold.promise; }
    events.push(c.action + ':end'); return Response.json(typeof step.body === 'function' ? step.body(c) : step.body, { status: step.status });
  } });
  let vault, gateway, env;
  if (serial) {
    const provider = new (audience === 'client' ? api.ClientProvider : api.SupabaseProvider)('sb_publishable_synthetic', async (input, init) => {
      const u = new URL(String(input)); assert.equal(u.origin, upstream);
      if (u.pathname === `/rest/v1/rpc/concierge_${audience}_session_context`) return Response.json({ ownerId: owner, providerSessionId: providerSession, role: audience, sessionNotAfter: null, capabilities: login.capabilities, ...contextPatch });
      assert.equal(u.pathname, '/functions/v1/concierge-notifications'); return api.handleNotificationRequest(new Request(u, init), ports);
    }, 12000, true);
    vault = new api.SessionVault({ read: () => record, write: r => { record = r; } }, new api.CredentialEnvelope(JSON.stringify({ active: 'synthetic', keys: { synthetic: Buffer.alloc(32, 29).toString('base64url') } }), 'entry-synthetic'), provider, { now: () => now, idleMs: 3600000, absoluteMs: 28800000, recheckContext: true, policyAudience: audience });
    await vault.initialize({ access_token: token, refresh_token: 'SYNTHETIC-refresh', expires_at: now / 1000 + 3600, user: { id: owner }, providerSessionId: providerSession }, 'SYNTHETIC');
    env = { PORTAL_ORIGIN: origin, CLIENT_SHARED_SESSIONS: 'true', ASSETS: { fetch: async () => { throw Error('unexpected asset'); } }, ADVISOR_SESSIONS: { getByName: () => ({ invoke: async command => {
      try {
        if (command.type === 'session.view') return { ok: true, value: await vault.view() };
        if (command.type === 'session.execute') { queued++; for (const w of queuedWaits) if (queued >= w.n) w.resolve(); return { ok: true, value: await vault.execute(command.csrf, (c, k) => provider.perform(c, k, command.operation)) }; }
        if (command.type === 'session.logout-context') return { ok: true, value: vault.logoutContext() };
        if (command.type === 'session.logout') return { ok: true, value: await vault.logout(command.csrf) };
        throw Error('unexpected Vault command');
      } catch (e) { return { ok: false, error: { status: e.status ?? 503, code: e.code ?? 'unavailable' } }; }
    } }) } }; gateway = audience === 'client' ? api.clientGateway : api.advisorGateway;
  }
  const runtime = api.createApplicationSession({ audience, now: () => now, locks: { request: async (_n, _o, run) => run() }, fetcher: async (input, init) => {
    const u = new URL(String(input), origin); assert.ok([`/api/${audience}/session`, `/api/${audience}/notifications`, `/api/${audience}/logout`, ...(audience === 'advisor' && !serial ? ['/api/advisor/plans'] : [])].includes(u.pathname));
    if (serial) { const headers = new Headers(init?.headers); headers.set('Origin', origin); headers.set('Sec-Fetch-Site', 'same-origin'); headers.set('Cookie', `__Host-shelv_${audience}=${'a'.repeat(43)}`); return gateway.fetch(new Request(u, { ...init, headers }), env); }
    if (u.pathname === `/api/${audience}/session`) return Response.json(login);
    if (u.pathname === `/api/${audience}/logout`) return Response.json({ signedOut: true });
    if (u.pathname === '/api/advisor/plans') {
      const command = JSON.parse(init.body), step = planSteps.shift();
      assert.ok(step, 'unexpected plan request'); assert.equal(command.action, step.action); planCommands.push(command);
      return Response.json(step.body, { status: step.status });
    }
    return api.handleNotificationRequest(new Request('https://edge.synthetic.invalid', { method: 'POST', headers: { authorization: 'Bearer SYNTHETIC', 'content-type': 'application/json', Origin: origin }, body: init.body, signal: init.signal }), ports);
  } });
  if (restore) await runtime.restore();
  const win = virtualWindow(initialPath), navigation = api.createPortalNavigator(win, { scopeKey: runtime.getSnapshot().boundary?.key ?? 'startup' });
  t.after(() => { navigation.dispose(); runtime.dispose(); });
  return { runtime, navigation, win, commands, events, page, item, receipt, create: () => api.createNotificationsEntry(runtime, navigation),
    createPublication: (controller, options) => api.createAdvisorPublicationNotifications(runtime, navigation, controller, options),
    advisor() { const adapter = api.createAdvisorPorts(runtime), controller = api.createAdvisorController({ session: runtime.getSnapshot().boundary, permissions: adapter.permissions, ports: adapter.ports }); t.after(() => { controller.dispose(); adapter.dispose(); }); return controller; },
    replyPlan(action, body, status = 200) { planSteps.push({ action, body, status }); }, planCommands,
    workspaceHtml: (controller, route = { name: 'advisor-plans' }) => api.renderToString(api.createElement(api.OverlayProvider, null, api.createElement(api.NavigationProvider, { navigator: navigation }, api.createElement(api.AdvisorWorkspaceNotifications, { runtime, controller, navigation: { route, navigate: next => navigation.navigate(next) } })))),
    html: entry => api.renderToString(api.createElement(api.NotificationsEntryView, { entry })),
    reply(action, body, status = 200, hold = null) { steps.push({ action, body, status, hold }); },
    login(patch) { login = { ...login, ...patch }; }, context(patch) { contextPatch = patch; }, now(value) { now = value; }, record: () => record,
    whenQueued(n) { return queued >= n ? Promise.resolve() : new Promise(resolve => queuedWaits.push({ n, resolve })); }, queued: () => queued,
  };
}
