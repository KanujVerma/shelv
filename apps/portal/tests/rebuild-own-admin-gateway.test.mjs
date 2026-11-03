// The seventeen original runtime cases are preserved from the Root test.
// Worker-only server code is bundled like rebuild-notifications-gateway; native
// ApplicationSession/cookie/transport imports retain one Node module identity.
// This JS host executes assertions; configured tsc checks production separately.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath,pathToFileURL} from 'node:url';
import path from 'node:path';
import {build} from '../node_modules/esbuild/lib/main.js';
import {createApplicationSession} from '../src/app/session.ts';
import {clientCookieRequest} from '../src/app/retained.ts';
import {mapAccountProfileResult,buildAccountProfileRpc} from '../../../src/contracts/PortalAccountProfileMapping.ts';
import {mapAccountContactResult} from '../../../src/contracts/PortalAccountContactMapping.ts';
import {mapClientOrdersReadResult} from '../../../src/contracts/PortalClientOrdersMapping.ts';

const repo=fileURLToPath(new URL('../../../',import.meta.url));
const evidence=path.join(repo,'.local-artifacts/rebuild-own-admin-gateway');
await mkdir(evidence,{recursive:true});
const bundle=await build({absWorkingDir:repo,entryPoints:['apps/portal/tests/fixtures/rebuild-own-admin-gateway-server.ts'],bundle:true,platform:'node',format:'esm',write:false,tsconfig:'apps/portal/tsconfig.frontend.json'});
const file=path.join(evidence,`server-${crypto.randomUUID()}.mjs`);
await writeFile(file,bundle.outputFiles[0].contents,{flag:'wx'});
const {gateway,PORTAL_ORIGIN,SUPABASE_ORIGIN,createOwnAdminProvider,ClientProvider,SessionVault,CredentialEnvelope,setAccountProfileDeadline}=await import(pathToFileURL(file).href);

const owner = '11111111-1111-4111-8111-111111111111', sessionId = '22222222-2222-4222-8222-222222222222';
const requestId = '33333333-3333-4333-8333-333333333333';
const profileRead = {
    schemaVersion: 1,
    action: 'read_account_profile_v1'
};
const contactRead = {
    schemaVersion: 1,
    action: 'read_account_contact_v1'
};
const ordersRead = {
    schemaVersion: 1,
    action: 'read_client_orders_v1'
};
const currentProfile = {
    schemaVersion: 1,
    profileRevision: 4,
    displayName: '  Client Name  ',
    currentEmail: {
        state: 'known',
        address: 'Client@Example.test',
        verified: true
    }
};
const currentOrders = {
    schemaVersion: 1,
    revision: 9,
    purchases: [],
    returns: []
};
function credentials() {
    const expiry = Math.floor(Date.now() / 1000) + 3600;
    const token = [
        Buffer.from('{}').toString('base64url'),
        Buffer.from(JSON.stringify({
            sub: owner,
            session_id: sessionId,
            role: 'authenticated',
            exp: expiry
        })).toString('base64url'),
        'synthetic'
    ].join('.');
    return {
        access_token: token,
        refresh_token: 'SYNTHETIC-refresh',
        expires_at: expiry,
        user: {
            id: owner
        },
        providerSessionId: sessionId
    };
}
function direct() {
    const calls = [], c = credentials();
    const state = {
        auth: ()=>Response.json({
                id: owner,
                is_anonymous: false
            }),
        profile: ()=>Response.json(currentProfile),
        orders: ()=>Response.json(currentOrders),
        context: ()=>Response.json({
                ownerId: owner,
                providerSessionId: sessionId,
                role: 'client',
                sessionNotAfter: null,
                capabilities: {
                    view: true,
                    edit: false,
                    publish: false,
                    confirmPayments: false
                }
            })
    };
    const fetcher = async (input, init)=>{
        const url = new URL(String(input));
        assert.equal(url.origin, SUPABASE_ORIGIN);
        assert.equal(new Headers(init?.headers).get('authorization'), `Bearer ${c.access_token}`);
        if (url.pathname === '/rest/v1/rpc/concierge_client_session_context' && init?.redirect === 'manual') assert.equal(init?.credentials, undefined);
        else {
            assert.equal(init?.credentials, 'omit');
            assert.equal(init?.redirect, 'error');
        }
        assert.equal(init?.cache, 'no-store');
        const body = init?.body === undefined ? null : JSON.parse(String(init.body));
        calls.push({
            path: url.pathname,
            body
        });
        if (url.pathname === '/auth/v1/user') return state.auth();
        if (url.pathname === '/rest/v1/rpc/concierge_account_profile_command_v1') {
            assert.deepEqual(Object.keys(body), [
                'p_command'
            ]);
            return state.profile(body.p_command);
        }
        if (url.pathname === '/rest/v1/rpc/concierge_client_orders_read_v1') {
            assert.deepEqual(body, {
                p_command: ordersRead
            });
            return state.orders();
        }
        if (url.pathname === '/rest/v1/rpc/concierge_client_session_context') {
            assert.deepEqual(body, {});
            return state.context(init);
        }
        throw new Error(`unexpected fixed path ${url.pathname}`);
    };
    const api = createOwnAdminProvider({
        supabaseUrl: SUPABASE_ORIGIN,
        publicKey: 'sb_publishable_synthetic',
        allowedOrigins: [
            PORTAL_ORIGIN
        ],
        fetch: fetcher
    });
    const controller = new AbortController();
    setAccountProfileDeadline(controller.signal, Date.now() + 10000);
    return {
        api,
        c,
        calls,
        state,
        controller,
        fetcher
    };
}
const noDispatchEnv = {
    PORTAL_ORIGIN,
    CLIENT_SHARED_SESSIONS: 'true',
    ADVISOR_SESSIONS: {
        getByName () {
            throw new Error('unexpected Vault dispatch');
        }
    },
    ASSETS: {
        fetch () {
            throw new Error('unexpected asset request');
        }
    }
};
for (const [channel, action] of [
    [
        'account-profile',
        'read_account_profile_v1'
    ],
    [
        'account-contact',
        'read_account_contact_v1'
    ],
    [
        'client-orders',
        'read_client_orders_v1'
    ]
])test(`registered ${channel} requires an actual client cookie`, async ()=>{
    const response = await gateway.fetch(new Request(`${PORTAL_ORIGIN}/api/client/${channel}`, {
        method: 'POST',
        headers: {
            origin: PORTAL_ORIGIN,
            'content-type': 'application/json',
            'x-shelv-csrf': 'SYNTHETIC-csrf'
        },
        body: JSON.stringify({
            schemaVersion: 1,
            action
        })
    }), noDispatchEnv);
    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), {
        code: 'session_ended'
    });
});
test('private construction is inert and fixed native profile/orders handlers use actual Root codecs', async ()=>{
    const f = direct();
    assert.equal(f.calls.length, 0);
    assert.deepEqual(await f.api.perform(f.c, 'account-profile', profileRead, f.controller.signal), {
        status: 200,
        body: currentProfile
    });
    assert.deepEqual(f.calls.map((c)=>c.path), [
        '/auth/v1/user',
        '/rest/v1/rpc/concierge_account_profile_command_v1',
        '/auth/v1/user',
        '/rest/v1/rpc/concierge_account_profile_command_v1',
        '/auth/v1/user'
    ]);
    f.calls.length = 0;
    assert.deepEqual(await f.api.perform(f.c, 'client-orders', ordersRead, f.controller.signal), {
        status: 200,
        body: currentOrders
    });
    assert.equal(f.calls.filter((c)=>c.path.endsWith('/concierge_client_orders_read_v1')).length, 2);
});
test('contact canonical read keeps pending unknown; unavailable mutation/status performs zero provider HTTP', async ()=>{
    const f = direct();
    const result = await f.api.perform(f.c, 'account-contact', contactRead, f.controller.signal);
    assert.equal(result.status, 200);
    const body = result.body;
    assert.deepEqual(body.currentEmail, currentProfile.currentEmail);
    assert.deepEqual(body.pendingEmail, {
        state: 'unknown'
    });
    assert.match(body.contactBasis, /^[0-9a-f]{64}$/);
    f.calls.length = 0;
    for (const command of [
        {
            schemaVersion: 1,
            action: 'request_account_email_change_v1',
            requestId,
            expectedContactBasis: body.contactBasis,
            email: 'New@Example.test'
        },
        {
            schemaVersion: 1,
            action: 'read_account_email_change_request_v1',
            requestId
        }
    ]){
        await assert.rejects(f.api.perform(f.c, 'account-contact', command, f.controller.signal), (e)=>e.status === 503);
        assert.equal(f.calls.length, 0);
    }
});
test('profile historical ACK remains distinct from a newer current profile', async ()=>{
    const f = direct(), command = {
        schemaVersion: 1,
        action: 'set_account_display_name_v1',
        requestId,
        expectedRevision: 3,
        displayName: 'Original name'
    };
    const ack = {
        schemaVersion: 1,
        action: command.action,
        requestId,
        previousRevision: 3,
        revision: 4,
        displayName: command.displayName,
        recordedAt: '2026-11-02T12:00:00Z'
    };
    f.state.profile = (input)=>Response.json(input.action === command.action ? ack : {
            ...currentProfile,
            profileRevision: 5,
            displayName: 'Later name'
        });
    assert.deepEqual(await f.api.perform(f.c, 'account-profile', command, f.controller.signal), {
        status: 200,
        body: ack
    });
});
test('wrong Auth owner, current fact drift and private result keys refuse', async ()=>{
    for (const kind of [
        'owner',
        'drift',
        'private'
    ]){
        const f = direct();
        let reads = 0;
        if (kind === 'owner') f.state.auth = ()=>Response.json({
                id: requestId,
                is_anonymous: false
            });
        else f.state.profile = ()=>Response.json(kind === 'private' ? {
                ...currentProfile,
                privateNotes: 'PRIVATE'
            } : {
                ...currentProfile,
                displayName: ++reads === 1 ? 'first' : 'second'
            });
        await assert.rejects(f.api.perform(f.c, 'account-profile', profileRead, f.controller.signal), (e)=>e.status === (kind === 'owner' ? 403 : kind === 'drift' ? 409 : 503));
    }
});
test('received context and producer 401/403 survive throwing body cleanup', async ()=>{
    for (const status of [
        401,
        403
    ])for (const where of [
        'context',
        'producer'
    ]){
        const f = direct();
        const denied = ()=>{
            const r = new Response(null, {
                status
            });
            Object.defineProperty(r, 'body', {
                get () {
                    throw Error('PRIVATE cleanup');
                }
            });
            return r;
        };
        if (where === 'context') f.state.context = denied;
        else f.state.auth = denied;
        await assert.rejects(where === 'context' ? f.api.readContext(f.c, f.controller.signal) : f.api.perform(f.c, 'account-profile', profileRead, f.controller.signal), (e)=>e.status === status);
    }
});
test('aborted or expired original budget refuses before any provider HTTP', async ()=>{
    const f = direct();
    f.controller.abort();
    await assert.rejects(f.api.perform(f.c, 'account-profile', profileRead, f.controller.signal));
    assert.equal(f.calls.length, 0);
    const expired = new AbortController();
    setAccountProfileDeadline(expired.signal, Date.now() - 1);
    await assert.rejects(f.api.perform(f.c, 'account-profile', profileRead, expired.signal));
    assert.equal(f.calls.length, 0);
});
async function withLock(_name, options, callback) {
    const run = typeof options === 'function' ? options : callback;
    assert.ok(run);
    if (typeof options !== 'function' && options.signal?.aborted) throw new DOMException('aborted', 'AbortError');
    return await run(null);
}
async function connected() {
    const f = direct(), provider = new ClientProvider('sb_publishable_synthetic', f.fetcher, 12000, true);
    let record = null;
    const vault = new SessionVault({
        read: ()=>record,
        write: (value)=>{
            record = value;
        }
    }, new CredentialEnvelope(JSON.stringify({
        active: 'synthetic',
        keys: {
            synthetic: Buffer.alloc(32, 17).toString('base64url')
        }
    }), 'own-admin-synthetic'), provider, {
        now: ()=>Date.now(),
        idleMs: 3600000,
        absoluteMs: 28800000,
        recheckContext: true,
        policyAudience: 'client'
    });
    await vault.initialize(f.c, 'synthetic');
    const commands = [];
    const env = {
        PORTAL_ORIGIN,
        CLIENT_SHARED_SESSIONS: 'true',
        ASSETS: {
            fetch () {
                throw Error('unexpected assets');
            }
        },
        ADVISOR_SESSIONS: {
            getByName: ()=>({
                    invoke: async (command)=>{
                        commands.push(command);
                        try {
                            if (command.type === 'session.view') return {
                                ok: true,
                                value: await vault.view()
                            };
                            if (command.type === 'session.execute') return {
                                ok: true,
                                value: await vault.execute(command.csrf, (c, k)=>provider.perform(c, k, command.operation))
                            };
                            if (command.type === 'session.logout-context') return {
                                ok: true,
                                value: vault.logoutContext()
                            };
                            if (command.type === 'session.logout') return {
                                ok: true,
                                value: await vault.logout(command.csrf)
                            };
                            throw Error('unexpected Vault command');
                        } catch (error) {
                            const e = error;
                            return {
                                ok: false,
                                error: {
                                    status: e.status ?? 503,
                                    code: e.code ?? 'unavailable'
                                }
                            };
                        }
                    }
                })
        }
    };
    const request = (channel, command, headers = {}, method = 'POST')=>gateway.fetch(new Request(`${PORTAL_ORIGIN}/api/client/${channel}`, {
            method,
            headers: {
                origin: PORTAL_ORIGIN,
                'sec-fetch-site': 'same-origin',
                'content-type': 'application/json',
                cookie: `__Host-shelv_client=${'a'.repeat(43)}`,
                'x-shelv-csrf': record?.csrf ?? '',
                ...headers
            },
            ...method === 'GET' ? {} : {
                body: typeof command === 'string' ? command : JSON.stringify(command)
            }
        }), env);
    const originalBroadcast = Object.getOwnPropertyDescriptor(globalThis, 'BroadcastChannel');
    Object.defineProperty(globalThis, 'BroadcastChannel', {
        configurable: true,
        writable: true,
        value: undefined
    });
    let runtime;
    try {
        runtime = createApplicationSession({
            audience: 'client',
            locks: {
                request: withLock
            },
            fetcher: async (input, init)=>{
                const h = new Headers(init?.headers);
                h.set('origin', PORTAL_ORIGIN);
                h.set('sec-fetch-site', 'same-origin');
                h.set('cookie', `__Host-shelv_client=${'a'.repeat(43)}`);
                return gateway.fetch(new Request(new URL(String(input), PORTAL_ORIGIN), {
                    ...init,
                    headers: h
                }), env);
            }
        });
    } finally{
        if (originalBroadcast) Object.defineProperty(globalThis, 'BroadcastChannel', originalBroadcast);
        else Reflect.deleteProperty(globalThis, 'BroadcastChannel');
    }
    await runtime.restore();
    f.calls.length = 0;
    commands.length = 0;
    return {
        ...f,
        provider,
        vault,
        runtime,
        request,
        commands,
        env,
        record: ()=>record
    };
}
test('closed actual cookie/gateway/serialized Vault/ClientProvider reaches fixed own producers', async ()=>{
    const f = await connected();
    try {
        const profile = f.runtime.transport.bindCookieChannel(clientCookieRequest, 'account-profile', 'read', (v)=>mapAccountProfileResult(v, profileRead));
        const contact = f.runtime.transport.bindCookieChannel(clientCookieRequest, 'account-contact', 'read', (v)=>mapAccountContactResult(v, contactRead));
        const orders = f.runtime.transport.bindCookieChannel(clientCookieRequest, 'client-orders', 'read', (v)=>mapClientOrdersReadResult(v, ordersRead));
        assert.deepEqual(await profile.execute(profileRead), currentProfile);
        const contactValue = await contact.execute(contactRead);
        assert.ok('currentEmail' in contactValue);
        assert.deepEqual(contactValue.currentEmail, currentProfile.currentEmail);
        assert.deepEqual(await orders.execute(ordersRead), currentOrders);
        assert.equal(f.commands.filter((c)=>c.type === 'session.execute').length, 3);
        assert.ok(f.calls.some((c)=>c.path === '/rest/v1/rpc/concierge_client_session_context'));
        assert.ok(f.calls.some((c)=>c.path === '/rest/v1/rpc/concierge_account_profile_command_v1'));
        assert.ok(f.calls.some((c)=>c.path === '/rest/v1/rpc/concierge_client_orders_read_v1'));
        assert.ok(f.calls.every((c)=>!c.path.startsWith('/functions/')), 'no invented deployed Edge endpoint');
    } finally{
        f.runtime.dispose();
    }
});
test('fixed routes preserve method/origin/CSRF/body/schema and advisor denial guards', async ()=>{
    const f = await connected();
    try {
        const cases = [
            [
                profileRead,
                {},
                'GET',
                405
            ],
            [
                profileRead,
                {
                    origin: 'https://wrong.invalid'
                },
                'POST',
                403
            ],
            [
                profileRead,
                {
                    'x-shelv-csrf': 'wrong'
                },
                'POST',
                403
            ],
            [
                {
                    ...profileRead,
                    clientId: owner
                },
                {},
                'POST',
                400
            ],
            [
                {
                    ...profileRead,
                    rpc: 'other'
                },
                {},
                'POST',
                400
            ],
            [
                {
                    ...profileRead,
                    action: 'publish_v1'
                },
                {},
                'POST',
                403
            ],
            [
                ' '.repeat(8193),
                {},
                'POST',
                413
            ]
        ];
        for (const [command, headers, method, status] of cases){
            const before = f.calls.filter((c)=>c.path === '/auth/v1/user').length;
            assert.equal((await f.request('account-profile', command, headers, method)).status, status);
            assert.equal(f.calls.filter((c)=>c.path === '/auth/v1/user').length, before);
        }
        const advisor = await gateway.fetch(new Request(`${PORTAL_ORIGIN}/api/advisor/account-profile`, {
            method: 'POST'
        }), f.env);
        assert.equal(advisor.status, 404);
    } finally{
        f.runtime.dispose();
    }
});
test('actual Vault rejects wrong current owner or capabilities without producer Auth/RPC', async ()=>{
    for (const kind of [
        'owner',
        'capabilities'
    ]){
        const f = await connected();
        try {
            f.state.context = ()=>Response.json({
                    ownerId: kind === 'owner' ? requestId : owner,
                    providerSessionId: sessionId,
                    role: 'client',
                    sessionNotAfter: null,
                    capabilities: {
                        view: true,
                        edit: kind === 'capabilities',
                        publish: false,
                        confirmPayments: false
                    }
                });
            assert.equal((await f.request('account-profile', profileRead)).status, 403);
            assert.equal(f.calls.filter((c)=>c.path === '/auth/v1/user').length, 0);
            assert.equal(f.record()?.status, 'revoked');
        } finally{
            f.runtime.dispose();
        }
    }
});
test('own-admin post-context denial prevents private return after a completed historical write', async ()=>{
    const f = await connected();
    try {
        const command = buildAccountProfileRpc({
            schemaVersion: 1,
            action: 'set_account_display_name_v1',
            requestId,
            expectedRevision: 3,
            displayName: 'Original name'
        }).args.p_command;
        let writes = 0, reads = 0;
        f.state.profile = (input)=>{
            if (input.action === command.action) {
                writes++;
                return Response.json({
                    schemaVersion: 1,
                    action: command.action,
                    requestId,
                    previousRevision: 3,
                    revision: 4,
                    displayName: 'Original name',
                    recordedAt: '2026-11-02T12:00:00Z'
                });
            }
            if (++reads === 1) f.state.context = ()=>new Response(null, {
                    status: 403
                });
            return Response.json(currentProfile);
        };
        const response = await f.request('account-profile', command);
        assert.equal(response.status, 403);
        assert.deepEqual(await response.json(), {
            code: 'forbidden'
        });
        assert.equal(writes, 1);
    } finally{
        f.runtime.dispose();
    }
});
test('one whole producer budget includes both actual context reads', async (t)=>{
    t.mock.timers.enable({
        apis: [
            'Date',
            'setTimeout'
        ],
        now: Date.parse('2026-11-02T12:00:00Z')
    });
    const f = await connected();
    try {
        let ownContexts = 0;
        f.state.context = (init)=>{
            if (init?.redirect === 'error') t.mock.timers.tick(++ownContexts === 1 ? 6000 : 4000);
            return Response.json({
                ownerId: owner,
                providerSessionId: sessionId,
                role: 'client',
                sessionNotAfter: null,
                capabilities: {
                    view: true,
                    edit: false,
                    publish: false,
                    confirmPayments: false
                }
            });
        };
        const response = await f.request('client-orders', ordersRead);
        assert.equal(response.status, 503);
        assert.deepEqual(await response.json(), {
            code: 'unavailable'
        });
        assert.equal(ownContexts, 2);
        assert.equal(f.calls.filter((c)=>c.path.endsWith('/concierge_client_orders_read_v1')).length, 2);
    } finally{
        f.runtime.dispose();
        t.mock.timers.reset();
    }
});
test('actual captured Vault logout fences a held private return', async ()=>{
    const f = await connected();
    let release, entered;
    const hold = new Promise((r)=>{
        release = r;
    }), started = new Promise((r)=>{
        entered = r;
    });
    try {
        f.state.orders = async ()=>{
            entered();
            await hold;
            return Response.json(currentOrders);
        };
        const pending = f.request('client-orders', ordersRead);
        await started;
        const csrf = f.record()?.csrf;
        assert.ok(csrf);
        await f.vault.logout(csrf);
        release();
        const response = await pending;
        assert.equal(response.status, 401);
        assert.equal(f.record()?.status, 'revoked');
    } finally{
        release?.();
        f.runtime.dispose();
    }
});
test('browser abort refuses local success while server has its independent bounded lifetime', async ()=>{
    const f = await connected();
    let release, entered;
    const hold = new Promise((r)=>{
        release = r;
    }), started = new Promise((r)=>{
        entered = r;
    });
    try {
        f.state.orders = async ()=>{
            entered();
            await hold;
            return Response.json(currentOrders);
        };
        const port = f.runtime.transport.bindCookieChannel(clientCookieRequest, 'client-orders', 'read', (v)=>mapClientOrdersReadResult(v, ordersRead));
        const caller = new AbortController(), pending = port.execute(ordersRead, {
            signal: caller.signal
        });
        await started;
        caller.abort();
        release();
        await assert.rejects(pending, (e)=>e.status === 503);
        assert.equal(f.record()?.status, 'active');
        assert.equal(f.calls.filter((c)=>c.path.endsWith('/concierge_client_orders_read_v1')).length, 2);
    } finally{
        release?.();
        f.runtime.dispose();
    }
});
test('private result and Auth byte bounds reject without truncated success', async ()=>{
    for (const kind of [
        'auth',
        'profile',
        'orders'
    ]){
        const f = direct();
        if (kind === 'auth') f.state.auth = ()=>new Response(' '.repeat(8193));
        if (kind === 'profile') f.state.profile = ()=>new Response(' '.repeat(16385));
        if (kind === 'orders') f.state.orders = ()=>new Response(' '.repeat(2000001));
        await assert.rejects(f.api.perform(f.c, kind === 'orders' ? 'client-orders' : 'account-profile', kind === 'orders' ? ordersRead : profileRead, f.controller.signal), (e)=>e.status === 503);
    }
});
