import test, {before, after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright-core';

const site = path.resolve(fileURLToPath(new URL('../site/', import.meta.url)));
let browser;
before(async () => { browser = await chromium.launch({channel: 'chrome', headless: true, args: ['--no-proxy-server', '--disable-background-networking', '--disable-quic', '--host-resolver-rules=MAP * ~NOTFOUND']}); });
after(async () => { await browser?.close(); });

async function fixture(run, width = 390) {
  const context = await browser.newContext({viewport: {width, height: 720}, reducedMotion: 'reduce', serviceWorkers: 'block'});
  await context.setOffline(true);
  const external = [];
  await context.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.origin !== 'http://localhost' || route.request().method() !== 'GET') {external.push(url.href); return route.abort();}
    if (url.pathname === '/') return route.fulfill({contentType: 'text/html', body: '<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"><link rel="stylesheet" href="/advisor/workspace.css"><link rel="stylesheet" href="/features/payments/payments.css"><link rel="stylesheet" href="/features/checkins/checkins.css"><main><h1>Daily routine</h1><button id="opener">Product details</button><button id="other">Another product</button></main>'});
    const file = path.resolve(site, '.' + decodeURIComponent(url.pathname));
    if (!file.startsWith(site + path.sep)) return route.abort();
    try {return route.fulfill({contentType: file.endsWith('.css') ? 'text/css' : 'text/javascript', body: await fs.readFile(file)});} catch {return route.fulfill({status: 404, body: ''});}
  });
  const page = await context.newPage();
  page.setDefaultTimeout(3000);
  try {
    await page.goto('http://localhost/');
    const imported = await page.evaluate(async () => {
      try { window.dialogModule = await import('/ui/dialog.js'); return true; } catch { return false; }
    });
    assert.equal(imported, true, 'The shared dialog module must be available');
    await run(page);
    assert.deepEqual(external, [], 'The browser fixture denies all external traffic');
  } finally { await context.close(); }
}

test('shared dialog names its task, sets requested focus and restores focus once after native Escape', async () => fixture(async page => {
  await page.locator('#opener').focus();
  await page.evaluate(() => {
    window.closeCount = 0;
    window.modal = window.dialogModule.createPortalDialog({onClose: () => {window.closeCount++;}});
    window.modal.open({title: 'Record start', content: '<h2>Record start</h2><label for="start">Start date</label><input id="start" type="date"><button data-close>Cancel</button><button>Record start</button>', initialFocus: '#start'});
  });
  assert.equal(await page.getByRole('dialog', {name: 'Record start', exact: true}).count(), 1);
  assert.equal(await page.locator('#start').evaluate(el => el === document.activeElement), true);
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => window.closeCount === 1);
  assert.equal(await page.locator('#opener').evaluate(el => el === document.activeElement), true);
  assert.equal(await page.evaluate(() => window.closeCount), 1);
  await page.evaluate(() => {window.modal.close(); window.modal.dispose();});
  assert.equal(await page.evaluate(() => window.closeCount), 1, 'Repeated close and disposal do not repeat the completed close callback');
}));

test('replacing open dialog content retains its opener and keeps title text out of markup', async () => fixture(async page => {
  await page.locator('#opener').focus();
  await page.evaluate(() => {
    window.modal = window.dialogModule.createPortalDialog();
    window.modal.open({title: 'Product details', content: '<h2>Product details</h2><button id="ingredient">Niacinamide</button>'});
    document.querySelector('#ingredient').focus();
    const content = document.createElement('p'); content.textContent = 'Focused ingredient explanation';
    window.modal.open({title: '<img src=x onerror=alert(1)>', content, initialFocus: element => element.querySelector('h2')});
  });
  assert.equal(await page.getByRole('dialog', {name: '<img src=x onerror=alert(1)>', exact: true}).count(), 1);
  assert.equal(await page.locator('dialog img').count(), 0);
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#opener').evaluate(el => el === document.activeElement), true);
}));

test('dialog restores a stable page heading after the opening control was replaced', async () => fixture(async page => {
  await page.locator('#opener').focus();
  await page.evaluate(() => {
    window.modal = window.dialogModule.createPortalDialog();
    window.modal.open({title: 'Product details', content: '<p>Use one pump.</p>'});
    document.querySelector('#opener').remove();
  });
  await page.getByRole('button', {name: 'Close dialog', exact: true}).click();
  assert.equal(await page.getByRole('heading', {name: 'Daily routine'}).evaluate(el => el === document.activeElement), true);
}));

test('a dialog opened without a focused control returns to the page heading', async () => fixture(async page => {
  await page.evaluate(() => {
    window.modal = window.dialogModule.createPortalDialog();
    window.modal.open({title: 'Plan history', content: '<p>No earlier versions.</p>'});
    window.modal.close();
  });
  assert.equal(await page.getByRole('heading', {name: 'Daily routine'}).evaluate(el => el === document.activeElement), true, await page.evaluate(() => document.activeElement.outerHTML));
}));

test('a rapid close and reopen does not let a queued close dismiss or unlock the new dialog', async () => fixture(async page => {
  await page.locator('#opener').focus();
  await page.evaluate(() => {
    window.closeCount = 0;
    window.modal = window.dialogModule.createPortalDialog({onClose: () => {window.closeCount++;}});
    window.modal.open({title: 'First', content: '<p>First task</p>'});
    window.modal.close();
    window.modal.open({title: 'Second', content: '<p>Second task</p>', trigger: document.querySelector('#other')});
  });
  await page.getByRole('dialog', {name: 'Second', exact: true}).waitFor();
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  assert.equal(await page.locator('dialog').evaluate(el => el.open), true);
  assert.equal(await page.evaluate(() => window.closeCount), 1);
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => window.closeCount === 2);
  assert.equal(await page.locator('#other').evaluate(el => el === document.activeElement), true);
  assert.equal(await page.evaluate(() => window.closeCount), 2);
}));

test('an unsaved-work guard can prevent programmatic, dismiss and Escape closure', async () => fixture(async page => {
  await page.evaluate(() => {
    window.allowClose = false;
    window.modal = window.dialogModule.createPortalDialog({canClose: () => window.allowClose});
    window.modal.open({title: 'Edit notes', content: '<label>Notes<textarea>Unsaved notes</textarea></label>'});
    window.modal.close();
  });
  assert.equal(await page.locator('dialog').evaluate(el => el.open), true);
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('dialog').evaluate(el => el.open), true);
  await page.getByRole('button', {name: 'Close dialog', exact: true}).click();
  assert.equal(await page.locator('dialog').evaluate(el => el.open), true);
  await page.evaluate(() => {window.allowClose = true;});
  await page.keyboard.press('Escape');
  await page.locator('dialog[open]').waitFor({state: 'hidden'});
}));

test('long dialog content remains scrollable and keyboard-contained at 320px with reduced motion', async () => fixture(async page => {
  await page.evaluate(() => {
    window.modal = window.dialogModule.createPortalDialog();
    window.modal.open({title: 'Application instructions', content: '<h2>Application instructions</h2><button id="first">First action</button>' + '<p>Use a pea-sized amount on dry skin. Avoid the eye area.</p>'.repeat(35) + '<button id="last">Last action</button>'});
  });
  assert.equal(await page.locator('dialog').evaluate(el => el.scrollHeight > el.clientHeight && getComputedStyle(el).overflowY === 'auto'), true);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.locator('#last').focus(); await page.keyboard.press('Tab');
  assert.equal(await page.locator('dialog').evaluate(el => el.contains(document.activeElement)), true);
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => document.documentElement.style.overflow === '');
  assert.equal(await page.evaluate(() => document.documentElement.style.overflow), '');
}, 320));

test('primary and quiet feature action aliases share accessible geometry and brand tokens', async () => fixture(async page => {
  await page.evaluate(() => {
    document.body.insertAdjacentHTML('beforeend', '<div class="portal"><button class="solid" id="solid">Save</button><button class="quiet" id="quiet">Cancel</button><section class="shelv-payments"><button class="payment-button primary" id="payment">Confirm payment</button></section><section class="shelv-checkins"><button class="checkin-button primary" id="checkin">Send check-in</button></section></div>');
  });
  const values = await page.evaluate(() => ['solid', 'quiet', 'payment', 'checkin'].map(id => { const style = getComputedStyle(document.getElementById(id)); return {height: parseFloat(style.minHeight), radius: style.borderRadius, font: parseFloat(style.fontSize), background: style.backgroundColor}; }));
  assert.ok(values.every(value => value.height >= 44 && value.font >= 14), 'Principal actions remain readable and touchable');
  assert.equal(values[0].background, values[2].background);
  assert.equal(values[0].background, values[3].background);
  assert.equal(new Set(values.map(value => value.radius)).size, 1, 'Feature buttons use the shared action shape');
}, 320));
