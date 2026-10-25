# Founder-managed admission

This local implementation adds a founder-created client record. It sends no email, creates no client login session, verifies no inbox ownership, and seeds no service period, plan, payment, order or report. No hosted installation or founder capability grant is implied by source availability.

POST JSON actions are `capabilities`, `add_client` with `requestId,email,displayName`, and `admission_status` with `requestId`. Unknown fields are rejected. The advisor-cookie gateway exposes only these actions on `/api/advisor/admission`; client cookies cannot use them. Successful admission returns `{requestId,status:'admitted'|'already_admitted',clientId,displayName,email,emailSent:false,portalUrl:'https://portal.goshelv.com/'}`. Status returns `{requestId,status:'pending'|'ready',client:null|receipt}`.

`can_admit_clients` is a separate server-owned advisor capability, false by default. Authenticated RPCs check the permanent actor, deletion fence, active advisor/view/admit permission and the owned current provider session before lookup or replay. Capability discovery may return false for an authorized advisor without admission permission. The service-only finalizer repeats those checks against the journal's verified actor/session before inserting enrollment and case atomically. Ordinary callers cannot read the journal, finalize admission, choose a target UUID or grant themselves permission.

Auth creation is a server-only fixed admin request with a previously reserved UUID and `email_confirm:false`. The existing built-in `SUPABASE_SERVICE_ROLE_KEY` stays in this Edge function. It is never added to the browser, gateway, logs or receipt. No password, role, callback or email-sending option is accepted from the caller. The client later requests the existing passwordless sign-in from their own browser; its verifier and callback remain in that existing lifecycle.

Exact retries keep the request UUID and canonical payload. A lost Auth response resumes the same reserved owner; an interrupted final reply reads the immutable completed receipt. A new intent for the same pending email also reserves the same UUID. Concurrent external Auth creation may yield a conflict or uncertain response; an explicit same-intent retry reconciles the durable identity. The handler never invents success, generates another target on uncertainty, or deletes an Auth account to simulate a cross-service rollback. Active duplicates return the existing name and case without resetting data. Cancelled, revoked, deleting, banned, anonymous, ambiguous and unexplained existing-case states require review. Completed target deletion removes its admission journal through an Auth deletion trigger.

Server configuration is the existing Supabase URL, public key, built-in service credential and exact concierge allowed origins. `verify_jwt=true` remains configured; the handler independently verifies the bearer and passes it unchanged to authenticated RPCs. This endpoint is the only new Auth-admin boundary. Existing operations, payment and check-in authority is unchanged.

## Reproducible verification

Portable unit/HTTP transport tests:

```sh
node --experimental-strip-types --test tests/concierge-admission.test.ts tests/concierge-admission-runtime.test.ts
```

Native acceptance has a versioned dedicated [portal Auth fixture](../../../apps/portal/test-fixtures/admission/README.md). From the repository root run `node apps/portal/scripts/local-admission.mjs run --browser`. It snapshots canonical migrations into ignored output, uses standard confirmation links and its own574xx ports, runs the test, then stops only that fixture with volumes retained. Root Expo's code-only mail template is intentionally different and must remain unchanged.

For an already prepared dedicated local Supabase stack with Auth, Kong and local Mailpit, standard confirmation-link templates, application migrations replayed, and root plus `apps/portal` dependencies installed, save `supabase status --output json` privately to a task-owned file, never print its keys. Set the exact Docker DB container and local status path:

The runner sets `SHELV_ADMISSION_LOCAL_CONFIG`, `SHELV_ADMISSION_DB_CONTAINER` and `SHELV_ADMISSION_CALLBACK_URL` from the current prepared owner. An advanced direct caller must use that generated project/container from `PREPARED.json`, not a guessed fixed project name, then invoke `tests/concierge-admission-bootstrap.mjs` followed by `tests/concierge-admission-native.mjs`.

Bootstrap refuses nonloopback API/DB endpoints, verifies the Docker CLI-project label, requires the admission migration and an empty Auth database before first marking, and never resets an existing fixture. Native tests then require that exact marker. They generate local synthetic identities and rows, capture confirmation mail locally, test real Auth/PostgREST/SQL, and end their issued provider sessions. No hosted credentials/data or real inbox is used. Existing fixture rows are retained rather than reset between runs.

`SHELV_ADMISSION_CALLBACK_URL` optionally selects a configured loopback callback; default is `http://127.0.0.1:3000/`. `SHELV_ADMISSION_REPORT` selects a JSON result file. `SHELV_ADMISSION_NATIVE_BROWSER=1` additionally exercises the actual founder UI through injected, owner-bound native handler ports and SQL; `SHELV_ADMISSION_UI_ARTIFACTS` optionally retains screenshots. This proves feature integration locally, not hosted cookie/Auth acceptance. The separate runtime suite covers actual gateway/Vault/CSRF and client-audience denial. `node --test apps/portal/tests/admission.test.mjs` covers desktop/mobile UI and same-intent recovery using isolated browser fixtures.

Hosted release still requires independent schema/grant/function/gateway/UI review, installation approval, and a specifically authorized fresh synthetic admission plus its own-browser email/callback test. Generic Dashboard invitation callbacks and automatic welcome mail are outside this change.
