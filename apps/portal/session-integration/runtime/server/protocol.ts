import type { Credentials, SessionView, SessionPolicy } from './types';
import type { LegacyPair } from './auth-flow';
import type { Operation } from './policy';
export type VaultCommand = ({
    type: 'walkthrough.view';
    digest: string;
} | {
    type: 'limit';
    scope: 'bootstrap' | 'otp' | 'auth' | 'walkthrough';
} | {
    type: 'flow.bootstrap';
} | {
    type: 'flow.logout-context';
} | {
    type: 'flow.restart';
    preserveSessionId?: string;
} | {
    type: 'flow.request';
    csrf: string;
    email: string;
} | {
    type: 'flow.complete';
    csrf: string;
    code: string;
    existingId?: string;
} | {
    type: 'flow.upgrade';
    csrf: string;
    pair: LegacyPair;
    existingId?: string;
} | {
    type: 'flow.cancel';
    csrf: string;
} | {
    type: 'flow.retire';
    preserveSessionId?: string;
} | {
    type: 'session.initialize';
    credentials: Credentials;
    grant: string;
    policy?: SessionPolicy;
} | {
    type: 'session.view';
} | {
    type: 'session.logout-context';
} | {
    type: 'session.retire';
} | {
    type: 'session.logout';
    csrf: string;
} | {
    type: 'session.execute';
    csrf?: string;
    operation: Operation;
}) & { audience?: 'advisor' | 'client'; remember?: boolean };
export type WireResponse = {
    status: number;
    body?: unknown;
    bytes?: Uint8Array;
    contentType?: string;
};
export type VaultResult<T> = {
    ok: true;
    value: T;
} | {
    ok: false;
    error: {
        status: number;
        code: string;
    };
};
export type Completed = {
    sessionId: string;
    session: SessionView;
};
