import type {AppReplaySurface} from './policy.ts';

/** Native adapters must check isCurrent before frames AND network admission,
 * close admission synchronously in revoke, and never resume a stored grant.
 * The customer singleton stays off; the separate local adapter validates generated content only.
 */
export interface AppReplayDriver {
 start(lease: number, isCurrent: () => boolean): Promise<boolean>;
 revoke(): void;
}
export type AppReplayReason = 'activation_not_approved' | 'native_build_unverified'
 | 'masking_unverified' | 'native_adapter_unavailable' | 'sensitive_surface'
 | 'background' | 'consent_required' | 'disposed' | 'recorder_failed' | 'recorder_stop_failed';
export interface AppReplaySnapshot {
 readonly consent: boolean;
 readonly recording: boolean;
 readonly status: 'off' | 'starting' | 'recording' | 'unavailable';
 readonly canStart: boolean;
 readonly reason: AppReplayReason | null;
}
export function createAppReplayController(options: {
 activationApproved: boolean; nativeBuildVerified: boolean; maskingVerified: boolean;
 driver: AppReplayDriver | null;
}) {
 const activationApproved = options.activationApproved === true;
 const nativeBuildVerified = options.nativeBuildVerified === true;
 const maskingVerified = options.maskingVerified === true;
 const driver = options.driver;
 let consent = false, foreground = false, surface: AppReplaySurface = 'excluded';
 let generation = 0, pending = false, recording = false, disposed = false, stopFailed = false;
 let pendingLease: number | null = null;
 let owner: string | null = null, failure: AppReplayReason | null = null;
 const listeners = new Set<() => void>();
 function blocked(): AppReplayReason | null {
  if (disposed) return 'disposed';
  if (stopFailed) return 'recorder_stop_failed';
  if (!activationApproved) return 'activation_not_approved';
  if (!nativeBuildVerified) return 'native_build_unverified';
  if (!maskingVerified) return 'masking_unverified';
  if (!driver) return 'native_adapter_unavailable';
  if (surface !== 'synthetic_fixture') return 'sensitive_surface';
  if (!foreground) return 'background';
  if (!consent) return 'consent_required';
  return null;
 }
 function snapshot(): AppReplaySnapshot {
  const reason = blocked() ?? failure;
  return Object.freeze({consent, recording,
   status: recording ? 'recording' : pending && pendingLease === generation ? 'starting' : reason && reason !== 'consent_required' ? 'unavailable' : 'off',
   canStart: !blocked() && !pending && !recording, reason});
 }
 let state = snapshot();
 function publish() {
  const next = snapshot();
  if (Object.keys(next).every(key => next[key as keyof AppReplaySnapshot] === state[key as keyof AppReplaySnapshot])) return;
  state = next;
  for (const listener of listeners) { try { listener(); } catch {} }
 }
 function revoke() {
  // Permission closes before invoking native code, even if native stop throws.
  generation++; recording = false;
  try { driver?.revoke(); } catch { stopFailed = true; consent = false; }
 }
 function stop() { revoke(); failure = null; publish(); }
 function setContext(next: {surface: AppReplaySurface; foreground: boolean}) {
  if (disposed) return;
  const nextSurface = next.surface === 'synthetic_fixture' ? 'synthetic_fixture' : 'excluded';
  const nextForeground = next.foreground === true;
  if (surface === nextSurface && foreground === nextForeground) return;
  surface = nextSurface; foreground = nextForeground;
  revoke(); failure = null; publish();
 }
 function setOwner(next: string | null) {
  if (disposed || owner === next) return;
  owner = typeof next === 'string' ? next : null;
  consent = false; revoke(); failure = null; publish();
 }
 function setConsent(value: boolean) {
  if (disposed || typeof value !== 'boolean') return;
  if (!value) revoke();
  consent = value && !stopFailed; failure = null; publish();
 }
 async function start(): Promise<boolean> {
  if (blocked() || pending || recording) return false;
  const lease = ++generation;
  const isCurrent = () => generation === lease && !blocked();
  pending = true; pendingLease = lease; failure = null; publish();
  let started = false;
  try { if (isCurrent()) started = (await driver!.start(lease, isCurrent)) === true; } catch {}
  // A stale completion cannot retain a grant. No second Start can overlap pending.
  if (!isCurrent() || !started) {
   revoke(); pending = false; pendingLease = null;
   if (!disposed && !stopFailed) failure = started ? null : 'recorder_failed';
   publish(); return false;
  }
  pending = false; pendingLease = null; recording = true; publish();
  return isCurrent() && recording;
 }
 return {
  getSnapshot: () => state,
  subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
  setContext, setOwner, setConsent, start, stop,
  dispose() { if (disposed) return; disposed = true; consent = false; owner = null; revoke(); publish(); listeners.clear(); },
 };
}
export type AppReplayController = ReturnType<typeof createAppReplayController>;
