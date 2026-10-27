export type Capabilities = {
    view: boolean;
    edit: boolean;
    publish: boolean;
    confirmPayments: boolean;
};
export type SessionPolicy = {idleMs: number; absoluteMs: number; policyId: string; remembered: boolean};
export type SessionView = {
    ownerId: string;
    generation: number;
    capabilities: Capabilities;
    idleExpiresAt: string;
    absoluteExpiresAt: string;
    csrf: string;
    remembered?: boolean;
};
export type Credentials = {
    access_token: string;
    refresh_token: string;
    expires_at: number;
    user: {
        id: string;
    };
    providerSessionId: string;
};
export type AdvisorContext = {
    sessionNotAfter?: number | null;
    ownerId: string;
    providerSessionId: string;
    capabilities: Capabilities;
};
export interface AuthProvider {
    refresh(credentials: Credentials): Promise<Credentials>;
    context(credentials: Credentials): Promise<AdvisorContext>;
    logout(credentials: Credentials): Promise<void>;
}
export type Envelope = {
    version: 1;
    keyId: string;
    iv: string;
    ciphertext: string;
};
export type SessionRecord = {
    kind: 'session';
    audience?: 'advisor' | 'client';
    remembered?: boolean;
    idleMs?: number;
    policyId?: string;
    status: 'active' | 'refreshing' | 'revoked';
    ownerId: string;
    providerSessionId: string;
    epoch: number;
    generation: number;
    createdAt: number;
    lastActive: number;
    absoluteAt: number;
    grant: string;
    credentials: Envelope | null;
    csrf: string;
};
export interface RecordStore<T> {
    read(): T | null;
    write(value: T): void;
}
export class SessionError extends Error {
    constructor(public status: number, public code: string) { super(code); }
}
export function demand(condition: unknown, status = 400, code = 'invalid_request'): asserts condition { if (!condition)
    throw new SessionError(status, code); }
export function randomId() { const bytes = crypto.getRandomValues(new Uint8Array(32)); return encode(bytes); }
export function encode(bytes: Uint8Array) { return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
export function decode(value: string) { demand(/^[A-Za-z0-9_-]+$/.test(value)); return Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)); }
export async function digest(value: string) { return encode(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))); }
// Compare equal-length random nonces without a content-dependent early return.
export function equalNonce(a: string, b: string) {
    if (a.length !== b.length)
        return false;
    if (typeof crypto.subtle.timingSafeEqual === 'function')
        return crypto.subtle.timingSafeEqual(new TextEncoder().encode(a), new TextEncoder().encode(b));
    let diff = 0;
    for (let i = 0; i < a.length; i++)
        diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return diff === 0;
}
