import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { entryFixture } from './rebuild-notifications-entry-fixture.mjs';

// Actual React SSR and actual native anchor callbacks on the existing plain
// Window fixture. This is source/finite HTTP proof, not a mounted browser.
// The JSX observer retains real React elements, hooks, providers and handlers.
// It changes no session, authority, currentness, operation or Vault method.
const portal = fileURLToPath(new URL('..', import.meta.url));
const require = createRequire(import.meta.url);
let compiled;
async function source() {
  if (compiled) return compiled;
  const { build } = await import('esbuild');
  const jsxRuntime = require.resolve('react/jsx-runtime');
  const result = await build({
    absWorkingDir: portal, tsconfig: 'tsconfig.frontend.json',
    stdin: { contents: `
export {ApplicationShell} from './src/app/Shell.tsx';
export {PortalShell} from './src/shell/PortalShell.tsx';
export {PortalApplication,PublicEntry} from './src/app/Application.tsx';
export {NavigationProvider} from './src/navigation/react.tsx';
export {RouteLink} from './src/navigation/react.tsx';
export {createPortalNavigator} from './src/navigation/history.ts';
export {OverlayProvider} from './src/ui/overlay.tsx';
export {createElement} from 'react';
export {renderToString} from 'react-dom/server';
export {anchors} from 'client-inbox-jsx-observer';`, resolveDir: portal, loader: 'tsx' },
    bundle: true, platform: 'node', format: 'cjs', write: false,
    loader: { '.css': 'empty' }, metafile: true,
    plugins: [{ name: 'observe-real-anchor-props', setup(b) {
      b.onResolve({ filter: /^(react\/jsx-runtime|client-inbox-jsx-observer)$/ }, () => ({ path: 'jsx', namespace: 'client-inbox-jsx' }));
      b.onLoad({ filter: /.*/, namespace: 'client-inbox-jsx' }, () => ({
        contents: `import {jsx as realJsx,jsxs as realJsxs,Fragment} from ${JSON.stringify(jsxRuntime)};
export {Fragment};export const anchors=[];
export function jsx(type,props,key){if(type==='a')anchors.push(props);return realJsx(type,props,key);}
export function jsxs(type,props,key){if(type==='a')anchors.push(props);return realJsxs(type,props,key);}`,
        resolveDir: portal, loader: 'js',
      }));
    } }],
  });
  const module = { exports: {} };
  new Function('module', 'exports', 'require', result.outputFiles[0].text)(module, module.exports, require);
  compiled = module.exports;
  return compiled;
}
function click(patch = {}) {
  return { button: 0, metaKey: false, ctrlKey: false, altKey: false, shiftKey: false,
    defaultPrevented: false, preventDefault() { this.defaultPrevented = true; }, stopPropagation() {}, ...patch };
}
function render(api, navigator, element) {
  api.anchors.length = 0;
  const html = api.renderToString(api.createElement(api.OverlayProvider, null,
    api.createElement(api.NavigationProvider, { navigator }, element)));
  return { html, links: api.anchors.filter(a => a.href === '/notifications') };
}
function shell(api, f, props = {}, navigator = f.navigation) {
  return render(api, navigator, api.createElement(api.ApplicationShell,
    { audience: 'client', onSignOut() {}, ...props }, api.createElement('p', null, 'account content')));
}
function bell(view) {
  assert.equal(view.links.length, 1, 'one client notification link is rendered');
  assert.equal(typeof view.links[0].onClick, 'function');
  return view.links[0];
}
function activate(link, event = click()) {
  link.onClickCapture?.(event);
  if (!event.defaultPrevented) link.onClick(event);
  return event;
}

test('actual client Application renders one shared bell with a native URL and no invented count; SSR stays inert', async t => {
  const api = await source(), f = await entryFixture(t, { initialPath: '/notifications' });
  api.anchors.length = 0;
  const html = api.renderToString(api.createElement(api.OverlayProvider, null,
    api.createElement(api.PortalApplication, { runtime: f.runtime, startup: Promise.resolve(), win: f.win })));
  const links = api.anchors.filter(a => a.href === '/notifications');
  assert.equal(links.length, 1);
  assert.equal(links[0]['aria-current'], 'page');
  assert.equal(api.anchors.filter(a => a['aria-current'] === 'page').length, 1,
    'the inbox does not also label your plan as the current page');
  assert.equal(links[0]['data-slot'], 'button');
  assert.match(html, /lucide-bell/);
  assert.match(html, />notifications<\/a>/);
  assert.match(html, /loading notifications/);
  assert.doesNotMatch(html, /loading your plan|unread|notification-count|this page is not connected yet/);
  assert.equal(f.win.history.state, null);
  assert.equal(f.commands.length, 0);
});

test('actual client Shell link navigates with its provider navigator and Back restores the original routine and context marker', async t => {
  const api = await source(), f = await entryFixture(t, { initialPath: '/plan?routine=evening' });
  f.win.document.activeElement = { id: 'portal-notifications' };
  f.win.scrollY = 360;
  const link = bell(shell(api, f));
  assert.equal(f.win.history.state, null, 'render does not subscribe to navigation');
  assert.equal(activate(link).defaultPrevented, true);
  assert.equal(f.navigation.getSnapshot(), '/notifications');
  assert.deepEqual(f.navigation.backDestination(), { name: 'plan', routine: 'evening' });
  f.navigation.back();
  assert.equal(f.navigation.getSnapshot(), '/plan?routine=evening');
  assert.equal(f.win.history.state.shelvNavigation.restore.focusKey, 'portal-notifications');
  assert.equal(f.win.history.state.shelvNavigation.restore.scrollY, 360);
  f.win.history.go(1);
  assert.equal(f.navigation.getSnapshot(), '/notifications');
  assert.equal(f.commands.length, 0, 'navigation itself performs no feature request');
});

test('the actual bell callback preserves native modified/nonprimary clicks and earlier cancellation', async t => {
  const api = await source(), f = await entryFixture(t, { initialPath: '/account' });
  const link = bell(shell(api, f));
  for (const patch of [{ metaKey: true }, { ctrlKey: true }, { altKey: true }, { shiftKey: true }, { button: 1 }, { defaultPrevented: true }]) {
    const event = click(patch);
    link.onClick(event);
    assert.equal(event.defaultPrevented, patch.defaultPrevented === true);
    assert.equal(f.navigation.getSnapshot(), '/account');
    assert.equal(f.win.history.state, null);
  }
  assert.equal(link.href, '/notifications');
  assert.equal(f.commands.length, 0);
});

test('the unchanged shared RouteLink keeps native target and download behavior for notifications', async t => {
  const api = await source(), f = await entryFixture(t, { initialPath: '/account' });
  for (const props of [{ target: '_blank' }, { download: 'notification-link' }]) {
    const link = bell(render(api, f.navigation, api.createElement(api.RouteLink,
      { route: { name: 'notifications' }, ...props }, 'notifications')));
    const event = activate(link);
    assert.equal(event.defaultPrevented, false);
    assert.equal(f.navigation.getSnapshot(), '/account');
    assert.equal(f.win.history.state, null);
  }
});

test('care read-only presentation does not disable notification navigation or create clinical EDIT authority', async t => {
  const api = await source(), f = await entryFixture(t, { initialPath: '/account', edit: false, serial: true });
  const link = bell(shell(api, f, { readOnly: true }));
  assert.equal(link['aria-disabled'], undefined);
  activate(link);
  assert.equal(f.navigation.getSnapshot(), '/notifications');
  const entry = f.create(); t.after(() => entry.dispose());
  f.reply('list_inbox_v1', f.page()); await entry.start();
  assert.equal(entry.getSnapshot().controller.getSnapshot().phase, 'ready');
  assert.equal(f.runtime.cookie._view.capabilities.edit, false);
  assert.equal(f.commands.length, 1);
  assert.equal(f.commands[0].action, 'list_inbox_v1');
  assert.equal('clientId' in f.commands[0], false);
});

test('advisor, preview and shared public/demo/historical shells receive no private notification link', async t => {
  const api = await source(), f = await entryFixture(t, { initialPath: '/account' });
  for (const props of [{ audience: 'advisor' }, { audience: 'advisor', preview: true }, { preview: true }]) {
    assert.equal(shell(api, f, props).links.length, 0);
  }
  for (const mode of ['public-demo', 'advisor-preview', 'private-walkthrough', 'historical']) {
    const view = render(api, f.navigation, api.createElement(api.PortalShell,
      { identity: 'fictional visitor', mode, contact: { onContact() {}, availability: 'administration' } }, 'sample content'));
    assert.equal(view.links.length, 0, mode);
  }
  const demo = render(api, f.navigation, api.createElement(api.PublicEntry, { route: { name: 'maya', stage: 2 } }));
  assert.equal(demo.links.length, 0);
  assert.equal(f.commands.length, 0);
});

test('a captured old bell cannot navigate through a disposed navigator or adopt a replacement owner', async t => {
  const api = await source(), f = await entryFixture(t, { initialPath: '/account' });
  const old = bell(shell(api, f));
  f.navigation.dispose();
  const next = api.createPortalNavigator(f.win, { scopeKey: 'replacement-navigation-owner' });
  const stop = next.subscribe(() => {}); t.after(() => { stop(); next.dispose(); });
  const current = bell(shell(api, f, {}, next));
  const before = JSON.stringify(f.win.history.state);
  activate(old);
  assert.equal(next.getSnapshot(), '/account');
  assert.equal(JSON.stringify(f.win.history.state), before);
  activate(current);
  assert.equal(next.getSnapshot(), '/notifications');
  assert.equal(f.commands.length, 0);
});

test('client bell reaches the existing real inbox entry through serial cookie/gateway/Vault/Root codecs without a clinical read', async t => {
  const api = await source(), f = await entryFixture(t, { initialPath: '/account', serial: true });
  activate(bell(shell(api, f)));
  const entry = f.create(); t.after(() => entry.dispose());
  assert.equal(f.commands.length, 0, 'entry construction is inert');
  assert.match(f.html(entry), /loading notifications/);
  assert.equal(f.commands.length, 0, 'SSR starts no request');
  f.reply('list_inbox_v1', f.page()); await entry.start(); await entry.start();
  assert.equal(f.queued(), 1);
  assert.equal(f.commands.length, 1);
  assert.equal(f.commands[0].action, 'list_inbox_v1');
  assert.match(f.html(entry), /your plan is ready|plan published/);
  assert.match(f.html(entry), /mark seen/);
  f.navigation.back();
  assert.equal(f.navigation.getSnapshot(), '/account');
  assert.equal(entry.getSnapshot().controller, null, 'actual route exit retires the inbox');
});

test('a finite unavailable notification channel renders recovery without inventing inbox success or a count', async t => {
  const api = await source(), f = await entryFixture(t, { initialPath: '/account', serial: true });
  activate(bell(shell(api, f)));
  const entry = f.create(); t.after(() => entry.dispose());
  f.reply('list_inbox_v1', { message: 'concierge_unavailable' }, 503); await entry.start();
  assert.equal(f.commands.length, 1);
  assert.equal(entry.getSnapshot().controller.getSnapshot().inbox, null);
  assert.match(f.html(entry), /could not load notifications|notifications are unavailable while offline/);
  assert.doesNotMatch(f.html(entry), /mark seen|plan published|unread/);
});

test('a bell supplies no authority after the actual cookie session ends', async t => {
  const api = await source(), f = await entryFixture(t, { initialPath: '/account', serial: true });
  const link = bell(shell(api, f)), entry = f.create(); t.after(() => entry.dispose());
  await f.runtime.signOut();
  activate(link); await entry.start();
  assert.equal(entry.getSnapshot().phase, 'ended');
  assert.equal(entry.getSnapshot().controller, null);
  assert.equal(f.commands.length, 0);
  assert.match(f.html(entry), /session has ended/);
});
