export interface LocalAppReplayNativePort {
 actualAppAvailability(): string;
 actualAppPrepare(): Promise<string>;
 actualAppStart(nonce: string): Promise<boolean>;
 actualAppRevoke(): void;
 actualAppFlush(): void;
}
export function createLocalAppReplayDriver(native: LocalAppReplayNativePort | null) {
 try {
  if (!native || native.actualAppAvailability() !== 'local_only_v1'
   || ['actualAppPrepare','actualAppStart','actualAppRevoke','actualAppFlush'].some(key => typeof native[key as keyof LocalAppReplayNativePort] !== 'function')) return null;
 } catch { return null; }
 const port = native;
 let current: (() => boolean) | null = null;
 let activeNonce: string | null = null;
 function revoke() { current = null; activeNonce = null; port.actualAppRevoke(); }
 return {
  async start(_lease: number, isCurrent: () => boolean): Promise<boolean> {
   if (!isCurrent()) return false;
   try {
    const nonce = await port.actualAppPrepare();
    if (!isCurrent() || typeof nonce !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(nonce)) { revoke(); return false; }
    activeNonce = nonce; current = isCurrent;
    const started = await port.actualAppStart(nonce);
    if (!isCurrent() || started !== true) { revoke(); return false; }
    current = isCurrent; return true;
   } catch { revoke(); return false; }
  },
  revoke,
  isCurrentNativeRun(value:unknown) { return typeof value === 'string' && value === activeNonce && current?.() === true; },
  flush() { if (current?.()) port.actualAppFlush(); },
 };
}
