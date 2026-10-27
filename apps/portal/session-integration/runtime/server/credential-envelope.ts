import { decode, encode, demand, SessionError, type Envelope } from './types';
export class CredentialEnvelope {
    readonly activeKey: string;
    private keys: Record<string, Uint8Array> = Object.create(null);
    constructor(raw: string, private objectId: string) {
        try {
            const ring = JSON.parse(raw);
            demand(ring && typeof ring.active === 'string' && ring.keys && typeof ring.keys === 'object');
            demand(Object.keys(ring.keys).length >= 1 && Object.keys(ring.keys).length <= 5);
            for (const [id, value] of Object.entries(ring.keys)) {
                demand(/^[a-zA-Z0-9_-]{1,32}$/.test(id) && typeof value === 'string');
                const key = decode(value);
                demand(key.length === 32);
                this.keys[id] = key;
            }
            demand(Object.hasOwn(this.keys, ring.active));
            this.activeKey = ring.active;
        }
        catch {
            throw new SessionError(503, 'configuration_missing');
        }
    }
    private aad(owner: string) { return new TextEncoder().encode(JSON.stringify({ schema: 1, object: this.objectId, owner })); }
    private async key(id: string, usage: ('encrypt' | 'decrypt')[]) { demand(Object.hasOwn(this.keys, id), 503, 'configuration_missing'); return crypto.subtle.importKey('raw', this.keys[id], { name: 'AES-GCM' }, false, usage); }
    async seal(value: unknown, owner: string): Promise<Envelope> {
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const key = await this.key(this.activeKey, ['encrypt']);
        const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: this.aad(owner) }, key, new TextEncoder().encode(JSON.stringify(value)));
        return { version: 1, keyId: this.activeKey, iv: encode(iv), ciphertext: encode(new Uint8Array(encrypted)) };
    }
    async open<T>(envelope: Envelope, owner: string): Promise<T> {
        demand(envelope.version === 1 && envelope.ciphertext.length <= 60000, 401, 'session_ended');
        const iv = decode(envelope.iv);
        demand(iv.length === 12, 401, 'session_ended');
        const key = await this.key(envelope.keyId, ['decrypt']);
        const raw = await crypto.subtle.decrypt({ name: 'AES-GCM', iv, additionalData: this.aad(owner) }, key, decode(envelope.ciphertext));
        return JSON.parse(new TextDecoder().decode(raw)) as T;
    }
}
