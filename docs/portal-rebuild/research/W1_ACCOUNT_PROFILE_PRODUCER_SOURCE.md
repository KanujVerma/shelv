# Account profile producer: bounded SOURCE implementation

Owner: Kanuj. Author task: W1 Account profile producer, 2 November 2026.

**Status:** author SOURCE closure for the exact read/name producer. New independent review, strict compilation, SQL/pgTAP, native concurrency, actual Auth/persistence, gateway/Account composition and browser acceptance remain open. This is not admission or genuine persistence proof. The full approved portal goal, complete Profile/contact/Account, all D01-D48 and required secondary flows remain unchanged.

## identity, custody and exact result

- Task ID: `node:delegated-task:command%3Amcp%3Aafb222dc-28b4-420b-9474-b05bc6eeba89%3Adelegate-task%3Acontinuation-20261102-account-profile-producer` (literal separately forwarded by coordinator).
- Actual self thread from configure READ: `thread:delegated-task:command%3Amcp%3Aafb222dc-28b4-420b-9474-b05bc6eeba89%3Adelegate-task%3Acontinuation-20261102-account-profile-producer`.
- Parent T3 thread: `9b085ada-435f-48d6-8886-957c1ce3e82d`. Self and parent independently read with `t3_thread_configure` and no `modelSelection`: instance `codex`, model `gpt-6.1-sol`, reasoning `xhigh`, service tier `default`, interaction mode `default`. No model/config changes.
- Own T3-managed checkout: `/Users/kanuj/.t3/worktrees/shelv/t3-d0e5d8b2`; branch `t3/account-profile-producer`.
- Exact clean base: `482f1d5e6277dc3365e3d92156eaa3ca862537ae`.
- Source/test commit: `9e5ee407ddfed7a56fb120e527d19ec35862e779`, exactly twelve new files. This report is a separate direct-child commit, identified in final handback.
- Explicit executable: `/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node`, observed `v22.23.0`.
- Before staging and before source commit: all **2,180** baseline tracked blobs and modes exactly match the base Git tree; zero old-path changes. Initial worktree was clean. No foreign execution/write, nested agents, Root edits, remote/PR/watch, resource acquisition, install or generated runtime.
- Coordinator-provided Root/PR211/PR210/CI facts are context, not newly verified by this child. No remote calls were made.

Original approved input remains 95,388 bytes, SHA256 `c45701f9f54fd2b1dbb09bbd7aa2b9b437e9059aa6032b6f39411fe2e7f6efbd`. Supplied continuation at `/Users/kanuj/.t3/worktrees/shelv/kanuj-portal-rebuild-integration-20261030/docs/portal-rebuild/source/CONTINUATION_INPUT_20261102.txt` remains exactly 100,187 bytes, SHA256 `b428b318598df52f12ce3e6ea4ebd350ff9333ee05d9fd8f04a8e845d0c722bc`. They are distinct files, not byte-equal prefixes. Neither was edited. Requirements used include D13/D29/D31/D38-D40/D43-D48, full C08 specification, contracts, addenda, safety/privacy and actual canonical source.

## exact API and exports

The coordinator confirmed these signatures before implementation:

```ts
buildAccountProfileRpc(value: unknown): AccountProfileRpcCall
mapAccountProfileResult(value: unknown, command: AccountProfileCommand): AccountProfileResult
handleAccountProfileRequest(request: Request, ports: AccountProfilePorts): Promise<Response>
createAccountProfilePorts(config: ConciergeTransportConfiguration): AccountProfilePorts
```

Schema 1 accepts only `{schemaVersion:1, action:'read_account_profile_v1'}` or `{schemaVersion:1, action:'set_account_display_name_v1', requestId:UUID, expectedRevision:safeInteger, displayName:string}`. The only RPC is `concierge_account_profile_command_v1({p_command})`. No actor/client/session/URL/RPC selector or permission flag is accepted.

Owned type exports are `AccountProfileCommand`, `AccountProfileView`, `AccountProfileReceipt`, `AccountProfileResult`, `AccountProfileRpcCall`, `AccountProfileIdentity`, `AccountProfilePorts`. Values/validation exports are confined to the four owned contract modules. Body support exports provide typed safe failures, a one-time signal/deadline registry, bounded waits/JSON parsing and received-denial retention. No shared export, Auth DTO, gateway, route, entry/index or deployment configuration changed.

`AccountProfileView` has only `schemaVersion`, `profileRevision`, exact canonical `displayName`, and `currentEmail:{state:'known',address,verified}|{state:'unknown'}`. No caller-observed clock is included. Write receipt has only schema version, exact original request/action, previous/revision, accepted name and authoritative recorded time. It is an immutable historical acknowledgement, never an optimistic current profile view.

## canonical name, revision and authorization

The actual legacy constraint is `length(concierge.trim_text(display_name)) between 1 and 200`, not a 100-character field. Existing `trim_text` matches ECMAScript trim characters. New codecs preserve exact case and boundary whitespace and count Unicode code points after trimming only for validation. NUL/unpaired UTF16 is rejected because PostgreSQL UTF8 cannot represent it. No name is reconstructed from plan/client content.

The write changes only `concierge.enrollments.display_name`. A dedicated private head and a new AFTER UPDATE OF display_name trigger observe any existing writer; exact same stored value creates no fake revision. Initial lazy read head is zero; a real legacy update before the first read creates revision one. No care/content/payment/approval revision is reused. Auth/enrollment creation, email changes/messages, pictures, source/privacy/storage/cancellation and financial writes are absent from the producer.

The SQL wrapper captures original `auth.uid()`, provider session UUID and JWT expiry before waits. Its new private authorizer checks role/context, actual `plan_session`, permanent `auth.users.is_anonymous IS FALSE`, deletion/ban, `profiles.deletion_started_at`, actual own `auth.sessions` and expiry, rejecting every plan-principal row and active advisor. Enrollment/case existence is reached only after own identity/persona checks. No selected-client path exists. Cancelled/ended own clients retain profile administration without gaining care/support/source rights.

`final_export_authorize_v1` and `plan_target_client` were inspected but deliberately not called before CAS: their enrollment SHARE lock followed by UPDATE upgrade can deadlock same-actor requests. The coordinator explicitly approved this refinement. Canonical enrollment FOR UPDATE precedes head/CAS; actual authorization is repeated after row/head waits and before return. A name-trigger reentrant session expiry rolls back both edit and journal in authored pgTAP. SQL expiry validates safe integral finite range and uses server clock; token session/expiry decoded in runtime are correlation only, never authority instead of Auth and trusted SQL.

Current email is selected only from actual own `auth.users.email` and `email_confirmed_at`; missing/empty is unknown. Pending/secondary email and JWT/Auth-response guesses are never projected. `verified` is only the stored confirmation fact, not a claim that this feature sent or performed verification.

## coordinator-approved collision-helper exception

The original claim prohibited existing-object changes beyond the name trigger. Source inspection found global actor/request UUID collision enforcement in `concierge.review_request_collision()`. Before editing, the child proposed the exact claim; the coordinator approved it with both lineage and non-waiting-lock qualifications.

Supported exact `prosrc` preimages:

| Lineage | UTF8 bytes | SHA256 | Required actual catalog |
| --- | ---: | --- | --- |
| Notifications six | 596 | `26afa4244895b19a260c379b57a0c2a4292cd18983fa90241b805b8d102cc7dc` | all six fixed journals; neither Source journal |
| Source eight | 640 | `d5aa3b2a59c9f2cdf6cd10f67fa3d4f4bb8642d4cec56013255e1f029c418180` | all six fixed journals and both Source journals |

The eight-table bytes were read from immutable `b8a5dac9bb6b6cc69c0d6365d88f71b0b8117218:supabase/migrations/20261102033048_portal_rebuild_source_kernel_v1.sql` lines 143-169. That file was not imported or executed. The new migration's private invoker `account_profile_collision_successor_v1(body text)` checks exact body hash, all required ordinary tables and both/none Source consistency. It returns only the matching complete body plus the profile journal. Missing, partial, unexpected or newer predecessors fail safely. No caller supplies table names or authority flags.

The migration snapshots the full existing `pg_proc` row excluding only body, and full existing trigger rows; after CREATE OR REPLACE it verifies unchanged OID/owner/ACL/default attributes and bindings. Only a trigger on the new profile journal is added. This is source design, not native metadata compatibility proof. It does not accept Source kernel SK2/SK3/SK4 or alter the held review/ordering.

After canonical enrollment FOR UPDATE, the command uses `pg_try_advisory_xact_lock` on the original actor/request UUID. Busy means `concierge_unavailable`/503. It never waits while holding the enrollment row and never calls contention a stored conflict. Actual authorization follows the try-lock. The existing trigger's identical advisory lock is reentrant after success. Same-profile operations serialize at the canonical row. Existing global family orders were not claimed to form a stronger total order.

The minimal private journal stores only actor/request UUID, SHA256 of the accepted full original command, previous/revision and server time. It stores no secondary command/name/email copy. Exact replay verifies the original hash, reauthorizes now and reconstructs the historical accepted name from the same verified payload. A changed payload under the same UUID conflicts. The journal has an immutable-update trigger and the existing global collision trigger.

## runtime, limits and return fences

Native transport is closed to fixed `/auth/v1/user` and the one RPC on a validated server-configured HTTPS origin; bearer/public key, origins and fetch are captured at construction. `credentials:'omit'`, `redirect:'error'`, `cache:'no-store'`, safe fixed errors and private/no-store responses are enforced. The existing transport configuration type is reused; its runtime implementation is not called because its per-call timeout would renew the operation budget.

| Budget | Bound | Reason and limit of claim |
| --- | ---: | --- |
| Incoming command | 8,192 bytes | two fixed actions, one UUID, one safe revision and one legacy name; full exact whitespace remains data, never silently truncated |
| Auth response | 8,192 bytes | only verified id/permanent flag are consumed; oversized optional provider metadata fails unavailable |
| RPC view/receipt | 16,384 bytes | small fixed projection/receipt, one canonical name and one stored email; no arbitrary domain-length limit |
| Bearer token | 8,192 bytes | finite header parsing; not a signature or session grant |
| Whole operation | 10,000 ms | one deadline from before first await, shared by request body/Auth/RPC/parse/cancellation/final Auth/context read |

A legacy stored name with extreme raw boundary whitespace may exceed the finite view budget despite passing its trimmed legacy constraint. Such data remains unchanged and unavailable through this bounded profile; it is not narrowed, trimmed or truncated into a false successful profile. SQL uses its bounded JSONB command representation; HTTP caps actual incoming bytes. No universal email/domain maximum is invented.

Every wait uses the same registered operation signal and absolute deadline; unregistered signals fail closed, registration cannot renew, and wall-clock checks also catch reentrant overrun before a timer callback. Local abort/deadline is 503. Status is inspected at receipt before any body/statusText/headers/cleanup getter; genuine observed 401/403 is retained even if cleanup aborts, throws or never settles. Stream cancellation is physically initiated and its completion is bounded; uncooperative cleanup is not certified complete. Late transport values are retired/cancelled best effort, without claiming actual provider cancellation.

The handler authenticates actual id/permanent identity, freezes original context/command, executes the fixed command, reauthenticates, repeats the same fixed own-profile read, and reauthenticates again. For a read, the mapped stable view must match (no observedAt field exists). For a write, the follow-up view is only a current-authorization fence; an old exact receipt remains historical even when another writer changed the name. No successful operation/Vault/currentness stub supplies genuine proof.

## executed evidence and failures preserved

All commands below used only the explicit Node executable and own source. No package dependency was installed, borrowed or cloned.

| Run | Actual result | Evidence meaning |
| --- | --- | --- |
| Original absent-feature RED, contract/runtime files | exit 1; both modules missing, 0/2 test files pass | producer absent at actual clean base; this is not 32 failing behavioral assertions |
| First implementation run | exit 1; 19/20 pass | actual token/Auth identity mismatch was classified 401 while test required403; corrected in runtime |
| Corrected first suite | exit 0; 20/20 pass | bounded codecs/handler/native Response runtime, synthetic HTTP only |
| Expanded runtime intermediate | exit 1; 18/19 pass | SETUP error: transcript asserted old bearer for deliberately missing-session token; fixed only expected-token fixture input |
| Current contract/runtime | exit 0; 29/29 pass | six contract and23 handler/runtime behaviors |
| Current migration-source predicates | exit 0; 3/3 pass | exact-source/lineage/try-lock predicates only, no SQL parsing/execution |
| Final combined command | exit 0; 32/32 pass; zero fail/cancel/skip/todo | source and synthetic proof only |
| `git diff --check`, staged check, exact allowed-path/base-blob audit | exit 0 | twelve new allowed source/test files; all2180 old blobs/modes exact |

Final test argv:

```sh
/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node --experimental-strip-types --test tests/portal-account-profile-contract.test.ts tests/portal-account-profile-runtime.test.ts tests/portal-account-profile-migration-source.test.ts
```

Node emitted three existing package-module-mode warnings and one experimental MockTimers warning. No flags/config/package declarations were changed to suppress them. Test transport is an in-memory finite HTTP transcript using actual native Request, Response, AbortSignal and streams plus the real new codec/handler/runtime, never an actual Auth/DB/socket/server/browser/provider call. MockTimers advances only test time; no wall-clock sleep.

**UNRUN:** strict/root/test/frontend TypeScript, full `npm test`, Expo builds, SQL syntax/replay, pgTAP, native migration metadata preservation, actual concurrent waits, Auth/session persistence, Storage/deletion/retention, mounted gateway/Account/browser, external provider and exact-head CI. Both `node_modules` and `apps/portal/node_modules` are absent. No compiler was executed and no strict pass is claimed. The conditional APFS clone grant was not exercised; its four physical lock/runtime91/device/symlink/full-parity custody prerequisites were not asserted satisfied.

Authored pgTAP covers actual-role guards, safe keys/bounds, canonical name/revision/no-op, legacy other-writer changes, same-actor stale CAS, exact historical replay/conflict, current stored email, deletion/ban/expiry/task/advisor, reentrant actual session expiry, bidirectional global UUID collision, per-actor UUID independence, both exact collision lineages versus actual catalog, unknown predecessor rejection and nonempty frozen quote/order/payment/approval sentinels. Multi-session native schedules specify same-actor CAS/retries, waiting expiry, legacy writer ordering and busy request-lock503. Those schedules and all pgTAP are UNRUN; comments are not an executable concurrent test pass.

## privacy, deletion and rollback source plan

New relations cascade through the existing enrollment -> Auth user chain. The inspected actual account-deletion endpoint commits its profile fence, inventories/deletes/verifies private Storage, then deletes Auth last. No cleanup/deletion call, new clearance, obligation decision, job or retention exception was added. The restricted command hash is still potentially identifying metadata, not anonymization; no secondary name/email copy or new indefinite PII policy is introduced. Unknown obligations remain unknown.

Rollback is SOURCE only and unrun: retire any later consumer/entry, revoke/drop only the new public RPC; remove the name revision trigger; restore the collision helper only from its exact unchanged profile-appended body to its matching six/eight predecessor while preserving attributes/bindings; remove only new journal/head/helpers/triggers. If the helper has since changed, stop for a new rollback plan. Never remove Source journals or undo genuine accepted `enrollments.display_name` edits. No existing care/payment/publication/instruction/approval/service/coverage/guarantee data is restored or rewritten by this plan.

## exact allowed postimages

All twelve source/test paths below are NEW mode100644. The only additional allowed file is this separately committed report, `docs/portal-rebuild/research/W1_ACCOUNT_PROFILE_PRODUCER_SOURCE.md`. Its self-hash/commit is reported externally to avoid a self-reference cycle.

| Path | Bytes | SHA256 |
| --- | ---: | --- |
| `src/contracts/PortalAccountProfile.ts` | 1425 | `83ecdebe43b3e7e4f22f8e18aa2f87f333b49d8511bbf953ef5b341d4ec88529` |
| `src/contracts/PortalAccountProfileMapping.ts` | 741 | `356b42a2ea8f08db390a2bbed2c088e0a1287aebb1bbb1a289ab58321b22de49` |
| `src/contracts/PortalAccountProfileValidation.ts` | 3806 | `597de8113b9dbb9e0a6dbe947c7d8cd67c69ff587fe3ed3d245c21d0a3c64497` |
| `src/contracts/PortalAccountProfileValues.ts` | 431 | `26aca8407483a3f9ae9b3dedaa487864c1a69f717e8979eea65c655b373df6e3` |
| `supabase/functions/concierge-account-profile/body.ts` | 2758 | `29ed478b1359c1633f6e1dd6cee75f9c6c25919ccfa164780337c54c4e532ca3` |
| `supabase/functions/concierge-account-profile/handler.ts` | 5139 | `4f0263a34fb0c23de70934a252e3b085af510bb0d04143333b79a722c75d044f` |
| `supabase/functions/concierge-account-profile/runtime.ts` | 4623 | `1375ba754036ccb49be874300290dbfcfa72fa7588f822acbc7c644bab86985c` |
| `supabase/migrations/20261102110000_portal_rebuild_account_profile_v1.sql` | 14756 | `7dcde23039959d60dc1a964b50f22012991139e3d68d5889282ab4524c82b23b` |
| `supabase/tests/portal_account_profile_v1.sql` | 26410 | `847ff5166cb5e4d1a618d5f015487ddb65dd223bc894ede2607e0f3d12791957` |
| `tests/portal-account-profile-contract.test.ts` | 4019 | `3939deeb4f0d39641d0c0724edceb656ffbc0ff78a524e4764a7901cb1e59d1b` |
| `tests/portal-account-profile-migration-source.test.ts` | 2994 | `897f1ad3658cfecd6d662fdad46ee8753b727c0074fa70b416b304091a10c306` |
| `tests/portal-account-profile-runtime.test.ts` | 12953 | `dcbc076ae05bb8e7fd8674855b6c960ad06f77fd46d787be2c804cb275c5e8aa` |

## unchanged dependency inputs

These are own-checkout source inputs, not borrowed execution/runtime dependencies. Four package/lock source files are recorded below; this is not the separate APFS custody proof.

| Path | SHA256 |
| --- | --- |
| `package.json` | `7da6e48aa5e39a185f10ac117007ee15beb279c4125e1f30f99c92451ff6d968` |
| `package-lock.json` | `5c57c9aec9e4585066e032e234d610a77cbffd9a51f82700c158fc37fe01b5c2` |
| `apps/portal/package.json` | `294dbd426b9840bd1d524e443edff4ff3c5026b39e9137c9bf897d156715bb02` |
| `apps/portal/package-lock.json` | `bc914f3a9c9f24e44f02e3cff2804651147385ea5abda58a064531329ef23203` |
| `src/contracts/ConciergePortal.ts` | `3fbf69f328c73cd10926dd446df4e266393f69e9fc37943888eabc46271c6dcd` |
| `src/contracts/ConciergePortalValidation.ts` | `c4928de0fea6095bdb6f7566ecd1dbfb7a09f3f027eba83598a80ed4a92b5697` |
| `supabase/functions/concierge-operations/runtime.ts` | `abc245a3902366f56ad156813d50edb2b3137989f09133b4e2389150b5898ff6` |
| `supabase/migrations/20261017190016_concierge_persistence_r1.sql` | `0a681863f11747a047c7c820128c410db88d37512a3cbae9be195304725ba557` |
| `supabase/migrations/20261018234537_concierge_portal_workflows.sql` | `aaf13096407d1568b0a2d858827e3e4a7511e60012e489c96914c15f1b73a325` |
| `supabase/migrations/20261024230528_concierge_founder_admission.sql` | `4f45572f8e6f7d04e1bb1c4316fd950ef517e78a282b0584ec1f8d239fd97197` |
| `supabase/migrations/20261026185922_concierge_client_account_display_name.sql` | `ebfc7b5782bb95b0b9ad6c37044f53ce14e3f7973d2893809a3447f60dae5edd` |
| `supabase/migrations/20261030223603_portal_rebuild_plan_v1.sql` | `497d85ef3bd81b7085d112be8c751bbeac8925ce5472ad94bdbc520174aa768c` |
| `supabase/migrations/20261101191527_portal_rebuild_notifications_v1.sql` | `408b860074abb18a1c1452bd6d08af8009db7fb48e0d01476abd608932d2b684` |
| `supabase/functions/delete-customer-account/index.ts` | `a88f4365cde235a6621194fa5fe3e67eadce0fd6138e54aa118254ef93b6044d` |

## next admission and full-goal boundaries

Fresh independent review must inspect the complete exact source/test commit, the original bounded brief, later lock/collision approvals, original/continuation requirements, this evidence distinction and both supported helper lineages before any Root/profile gateway/Account mount. Strict compiler dependencies and a separate exact native grant are still required for their respective checks. No reviewer was spawned by this child.

This producer can later enable C08 name editing and current-contact read. Email verification CHANGE, remaining Profile/address/billing/consent/export/service controls, actual notification effects, mounted Account and the complete connected/genuine portal goal are separate unfinished gates. Source kernel and financial/Guidance provider holds were neither retried nor rerouted. The sole migration-writer reservation is returned with the final committed handback, not with a claim of SQL or release acceptance.
