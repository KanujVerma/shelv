import { useEffect, useLayoutEffect, useState, useSyncExternalStore } from 'react';
import type { ApplicationSession } from './session.ts';
import type { PortalNavigationCore } from '../navigation/react.tsx';
import { buildRoute, parseRoute } from '../navigation/routes.ts';
import { createAccountProfileController, AccountProfile } from '../features/account/profile/index.ts';
import { createAccountContactController, AccountContact } from '../features/account/contact/index.ts';
import { PageHeader, Panel } from '../shell/PortalShell.tsx';
import { Button, Dialog, StatusNotice } from '../ui/index.ts';

type Profile = ReturnType<typeof createAccountProfileController>;
type Contact = ReturnType<typeof createAccountContactController>;
type Snapshot = Readonly<{
  phase: 'idle' | 'active' | 'inactive' | 'ended';
  profile: Profile | null;
  contact: Contact | null;
}>;
export type AccountEntry = Readonly<{
  getSnapshot(): Snapshot;
  subscribe(listener: () => void): () => void;
  start(): Promise<void>;
  stop(): void;
  dispose(): void;
}>;
type Owner = { retire(): void };
const owners = new WeakMap<PortalNavigationCore, Owner>();
const idle: Snapshot = Object.freeze({ phase: 'idle', profile: null, contact: null });
const inactive: Snapshot = Object.freeze({ phase: 'inactive', profile: null, contact: null });
const ended: Snapshot = Object.freeze({ phase: 'ended', profile: null, contact: null });
const accountPath = buildRoute({ name: 'account' });

/** Account uses the actual own-client session, independently of care access.
 * Construction and SSR are inert. Route relevance can deny, never grant rights. */
export function createAccountEntry(runtime: ApplicationSession, navigation: PortalNavigationCore): AccountEntry {
  const boundary = runtime.getSnapshot().boundary;
  const actor = runtime.cookie.identity?.ownerId;
  const epoch = runtime.cookie._epoch, generation = runtime.cookie.generation;
  const serverGeneration = runtime.cookie._view?.generation;
  const listeners = new Set<() => void>();
  let snapshot: Snapshot = idle;
  let disposed = false, superseded = false, running = false, sequence = 0;
  let profile: Profile | null = null, contact: Contact | null = null;
  let cleanups: (() => void)[] = [];
  let initialRead: Promise<void> | null = null;
  const owner: Owner = { retire() { superseded = true; retire(ended); } };
  function same() {
    return !disposed && !superseded && boundary !== null &&
      runtime.getSnapshot().boundary === boundary && runtime.cookie.audience === 'client' &&
      runtime.cookie.identity?.role === 'client' && runtime.cookie.identity.ownerId === actor &&
      runtime.cookie._epoch === epoch && runtime.cookie.generation === generation &&
      runtime.cookie._view?.generation === serverGeneration;
  }
  function lifetime() {
    if (!same()) return false;
    const valid = boundary!.isCurrent();
    return valid && same();
  }
  function onRoute() {
    const path = navigation.getSnapshot();
    return path === accountPath && parseRoute(path)?.name === 'account';
  }
  function applicable() {
    return running && owners.get(navigation) === owner && lifetime() && onRoute() &&
      running && owners.get(navigation) === owner && same();
  }
  function emit(expected: Snapshot) {
    for (const listener of [...listeners]) {
      if (snapshot !== expected) break;
      if (listeners.has(listener)) { try { listener(); } catch { /* Local observer only. */ } }
    }
  }
  function retire(next: Snapshot) {
    const oldProfile = profile, oldContact = contact, detach = cleanups;
    const changed = snapshot !== next;
    // Clear both domains before unsubscribe, disposal, abort or observer callbacks.
    sequence++; running = false; profile = null; contact = null;
    cleanups = []; initialRead = null; snapshot = next;
    if (owners.get(navigation) === owner) owners.delete(navigation);
    for (const stop of detach) { try { stop(); } catch { /* Finish own cleanup. */ } }
    try { oldProfile?.dispose(); } catch { /* The other domain must still retire. */ }
    try { oldContact?.dispose(); } catch { /* Already detached and cleared. */ }
    if (changed && snapshot === next) emit(next);
  }
  function reconcile() {
    if (!running) return;
    const token = sequence, p = profile, c = contact;
    const valid = applicable();
    if (token !== sequence || p !== profile || c !== contact || !running) return;
    if (!valid) {
      const next = same() ? inactive : ended;
      if (token === sequence) retire(next);
      return;
    }
    const profileEnded = p?.getSnapshot().phase === 'ended';
    if (token !== sequence || p !== profile || c !== contact || !running) return;
    const contactEnded = c?.getSnapshot().phase === 'ended';
    if (token !== sequence || p !== profile || c !== contact || !running) return;
    if (profileEnded || contactEnded) { superseded = true; retire(ended); }
  }
  function attach(stop: () => void, token: number) {
    if (sequence === token && running) cleanups.push(stop);
    else { try { stop(); } catch { /* Retired subscription. */ } }
  }
  function still(token: number) {
    return sequence === token && applicable() && sequence === token && running;
  }
  function start(): Promise<void> {
    if (running) { reconcile(); if (running) return initialRead ?? Promise.resolve(); }
    if (disposed || superseded) return Promise.resolve();
    const token = ++sequence;
    if (!lifetime() || sequence !== token) {
      if (sequence === token) retire(ended);
      return Promise.resolve();
    }
    if (!onRoute()) { if (sequence === token) retire(inactive); return Promise.resolve(); }
    const previous = owners.get(navigation);
    running = true; owners.set(navigation, owner);
    if (previous !== owner) previous?.retire();
    if (!still(token)) {
      if (sequence === token) {
        const next = same() ? inactive : ended;
        if (sequence === token) retire(next);
      }
      return Promise.resolve();
    }
    attach(navigation.subscribe(reconcile), token);
    if (!still(token)) { reconcile(); return Promise.resolve(); }
    attach(runtime.subscribe(reconcile), token);
    attach(boundary!.subscribeInvalidation(reconcile), token);
    if (!still(token)) { reconcile(); return Promise.resolve(); }
    const p = createAccountProfileController(runtime, { isApplicable: applicable });
    if (!still(token)) { p.dispose(); reconcile(); return Promise.resolve(); }
    profile = p;
    const c = createAccountContactController(runtime, { isApplicable: applicable });
    if (!still(token)) { c.dispose(); reconcile(); return Promise.resolve(); }
    contact = c;
    attach(p.subscribe(reconcile), token);
    attach(c.subscribe(reconcile), token);
    if (!still(token)) { reconcile(); return Promise.resolve(); }
    snapshot = Object.freeze({ phase: 'active', profile: p, contact: c });
    const published = snapshot;
    // Install before callbacks; repeated/reentrant starts share this exact read.
    const read = Promise.resolve().then(async () => {
      if (!still(token) || profile !== p || contact !== c) return;
      const reads = [p.load()];
      if (still(token) && profile === p && contact === c) reads.push(c.load());
      await Promise.all(reads);
    });
    initialRead = read;
    emit(published);
    return read;
  }
  return Object.freeze({
    getSnapshot() { reconcile(); return snapshot; },
    subscribe(listener: () => void) {
      if (disposed) return () => {};
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    start,
    stop() { if (!disposed) retire(idle); },
    dispose() {
      if (disposed) return;
      disposed = true; retire(ended); listeners.clear();
    },
  });
}

/** Actual view-used callback custody. Local activation identity is not authority. */
function createDetailsActivation(entry: AccountEntry, expected?: { profile: Profile; contact: Contact }) {
  type Active = Snapshot & { profile: Profile; contact: Contact };
  type Capture = Readonly<{
    activation: object;
    scope: Active;
    profileDraft: ReturnType<Profile['getSnapshot']>['draft'];
    contactDraft: ReturnType<Contact['getSnapshot']>['draft'];
    contactReview: ReturnType<Contact['getSnapshot']>['review'];
  }>;
  const initial = entry.getSnapshot();
  const binding = initial.phase === 'active' && initial.profile && initial.contact &&
    (!expected || initial.profile === expected.profile && initial.contact === expected.contact)
    ? { profile: initial.profile, contact: initial.contact } : null;
  let activation: object | null = null, sequence = 0, disposed = false;
  const listeners = new Set<() => void>();
  function scope(): Active | null {
    if (disposed || !binding) return null;
    const state = entry.getSnapshot();
    return !disposed && state.phase === 'active' && state.profile === binding.profile && state.contact === binding.contact
      ? { ...state, profile: state.profile, contact: state.contact } : null;
  }
  function owns(expected: Active) {
    if (disposed || !binding || expected.profile !== binding.profile || expected.contact !== binding.contact) return false;
    const current = entry.getSnapshot();
    return !disposed && current.phase === 'active' && current.profile === expected.profile && current.contact === expected.contact;
  }
  function emit() {
    const expected = activation;
    for (const listener of [...listeners]) {
      if (activation !== expected) break;
      if (listeners.has(listener)) { try { listener(); } catch { /* Local observer only. */ } }
    }
  }
  return Object.freeze({
    getSnapshot: () => activation,
    subscribe(listener: () => void) { if (disposed) return () => {}; listeners.add(listener); return () => { listeners.delete(listener); }; },
    open() {
      const token = ++sequence;
      const current = scope();
      if (!current || sequence !== token) return;
      const beforeContact = current.contact.getSnapshot();
      if (sequence !== token || !owns(current)) return;
      const next = Object.freeze({});
      activation = next; emit();
      if (sequence !== token || activation !== next || !owns(current)) return;
      current.profile.editDisplayName();
      if (sequence !== token || activation !== next || !owns(current)) return;
      const afterContact = current.contact.getSnapshot();
      if (sequence !== token || activation !== next || !owns(current)) return;
      // Opening the other domain cannot rebase an existing unsent edit or erase
      // a review created by the profile callback. Each domain owns its intent.
      if (beforeContact.draft === null && beforeContact.review === null &&
          afterContact.draft === beforeContact.draft && afterContact.review === beforeContact.review) current.contact.editEmail();
      if (sequence !== token || activation !== next || !owns(current)) return;
    },
    capture(): Capture | null {
      const captured = activation, current = scope();
      if (!captured || !current) return null;
      const profileDraft = current.profile.getSnapshot().draft;
      if (activation !== captured || !owns(current)) return null;
      const contact = current.contact.getSnapshot();
      if (activation !== captured || !owns(current)) return null;
      return Object.freeze({ activation: captured, scope: current, profileDraft,
        contactDraft: contact.draft, contactReview: contact.review });
    },
    close(captured: Capture | null) {
      if (!captured || activation !== captured.activation || !owns(captured.scope)) return;
      const beforeProfile = captured.scope.profile.getSnapshot();
      const beforeContact = captured.scope.contact.getSnapshot();
      if (activation !== captured.activation || !owns(captured.scope) ||
          beforeProfile.draft !== captured.profileDraft || beforeContact.draft !== captured.contactDraft ||
          beforeContact.review !== captured.contactReview) return;
      const token = ++sequence;
      // Close/publish before callback-capable child discard. A reentrant open
      // changes the sequence and cannot be closed by the remaining old callback.
      activation = null; emit();
      const valid = () => sequence === token && activation === null && owns(captured.scope) && sequence === token;
      const p = captured.scope.profile, c = captured.scope.contact;
      if (valid() && captured.profileDraft !== null && p.getSnapshot().draft === captured.profileDraft && valid() &&
          p.getSnapshot().draft === captured.profileDraft) p.discardEdit();
      if (valid() && captured.contactDraft !== null && c.getSnapshot().draft === captured.contactDraft &&
          c.getSnapshot().review === captured.contactReview && valid() &&
          c.getSnapshot().draft === captured.contactDraft && c.getSnapshot().review === captured.contactReview) c.discardEdit();
    },
    dispose() { if (disposed) return; disposed = true; sequence++; activation = null; emit(); listeners.clear(); },
  });
}

type DetailsActivation = ReturnType<typeof createDetailsActivation>;
function AccountDetails({ entry, profile, contact }: { entry: AccountEntry; profile: Profile; contact: Contact }) {
  const [owner, setOwner] = useState<{ entry: AccountEntry; profile: Profile; contact: Contact; details: DetailsActivation } | null>(null);
  useLayoutEffect(() => {
    const details = createDetailsActivation(entry, { profile, contact });
    setOwner({ entry, profile, contact, details });
    return () => details.dispose();
  }, [entry, profile, contact]);
  const details = owner?.entry === entry && owner.profile === profile && owner.contact === contact ? owner.details : null;
  return <AccountDetailsContent details={details} profile={profile} contact={contact} />;
}
const noDetailsSubscription = () => () => {};
const noDetailsActivation = () => null;
function AccountDetailsContent({ details, profile, contact }: { details: DetailsActivation | null; profile: Profile; contact: Contact }) {
  const activation = useSyncExternalStore(details?.subscribe ?? noDetailsSubscription, details?.getSnapshot ?? noDetailsActivation, noDetailsActivation);
  const p = useSyncExternalStore(profile.subscribe, profile.getSnapshot, profile.getSnapshot);
  const c = useSyncExternalStore(contact.subscribe, contact.getSnapshot, contact.getSnapshot);
  const captured = activation && details ? details.capture() : null;
  return <>
    <Panel><div className="app-stack">
      <h2>profile &amp; contact</h2>
      <AccountProfile controller={profile} presentation="summary" />
      <AccountContact controller={contact} presentation="summary" />
      <dl><dt>contact preference</dt><dd>email updates · personal texts for questions</dd></dl>
      <div><Button variant="secondary" disabled={!details || !p.canEdit && !(c.phase === 'ready' && c.current && c.busy === null)}
        onClick={() => details?.open()}>edit details</Button></div>
    </div></Panel>
    <Dialog open={activation !== null && captured !== null} title="edit details"
      onOpenChange={open => { if (!open) details?.close(captured); }}>
      <div className="app-stack">
        <AccountProfile controller={profile} presentation="edit" />
        <AccountContact controller={contact} presentation="edit" />
      </div>
    </Dialog>
  </>;
}

export function AccountEntryView({ entry }: { entry: AccountEntry }) {
  const state = useSyncExternalStore(entry.subscribe, entry.getSnapshot, entry.getSnapshot);
  useEffect(() => { void entry.start(); return () => entry.stop(); }, [entry]);
  if (state.phase === 'inactive') return null;
  return <>
    <PageHeader title="account" />
    {state.profile && state.contact ? <AccountDetails entry={entry} profile={state.profile} contact={state.contact} />
      : <StatusNotice tone={state.phase === 'ended' ? 'denied' : 'loading'}
        title={state.phase === 'ended' ? 'your session has ended. sign in again.' : 'loading account'} />}
  </>;
}
