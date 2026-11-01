# W7 report photos: independent SOURCE R3

Owner: Kanuj. Reviewed 1 November 2026. New independent report-only review of author candidate `2742e93984503e6a2bbc577bf5be2b28769d6dea`, composed on frozen Parent `58c0669d0c5507c0eb7087fe0a0b0e0785743d5e`. Only this new report is an authored tracked change. No production or tracked test correction was made.

## Separate verdicts

**SPEC / completeness: FAIL for the reusable photo lifecycle slice because RP3 exposes the previous private snapshot to an abort callback after current access denial.** The exact RP1 and RP2 port races close in the independently rerun original probes. Full C05/C07 completeness remains held at the acknowledged legacy `client_read`/M59 goal-history 409 and Parent-owned application composition. The separately reviewed PhotoHeadR3 Root 58 source producer does not update this feature's legacy reader or mount its UI.

**Correctness / quality: FAIL, one new reproduced P2 finding, RP3.** Both original R1 probes and the exact R2 probe reproduce their old failures and pass unchanged on the successor. Current author denial tests pass 36/36 before the new finding. The independent actual-Vault controller probe then produces control 1 pass / denial 1 fail, true exit 1. Dependent acceptance stopped immediately. No subsequent broad test, compiler or acceptance replay was run. Parent explicitly acknowledged this stop and will separately allocate the correction after this report is pinned.

Original R1 `35189b919d47c915cfe3e27eb9084422f0a68b61` and R2 `55d3c45c9273e8042becb189d846392976fd5c69` remain immutable **FAIL** reports. Their bytes were read in place and verified to those exact commits, SHA-256 respectively `b5fedf370beec2d30db03eeab34116762a0f58aba82219f504dd930ef95a171a` and `e73659d44c49392fc3e48b653c9f1230b31c586dc77330a614555d14098ac139`.

## RP3 / P2: restriction aborts before retiring the public private-photo snapshot

Affected source: [`photos/controller.ts`](../../../apps/portal/src/features/history/photos/controller.ts), lines28-37 and46, reached from the current read403 catch at line59. Git blob `7ea0ca89a9500d510c505fb12b78a56283d55159`; SHA-256 `470fb36dfa907ddd6925da62fea34ff9f432cf46a60e6c8eebca17d220b39467`. This controller is unchanged by RP1/RP2 and remains part of the cumulative candidate.

`restrict()` retires its epoch/read basis and calls `hideMedia()` before clearing records, revoking queued preview URLs or publishing the restricted snapshot. `hideMedia()` only clears `viewing`/`readingPhoto`, retaining the previous `items`, `confirmed` and phase; it then synchronously calls `abort.abort()`. A listener on that real pending media request can therefore reenter `getSnapshot()` after the actual current 403 and observe the previous private state. The later restriction cleanup does run, but it occurs after the callback.

Independent closed reproduction, with no successful operation/current/authority substitute:

1. Restore the real `ApplicationSession` through the actual retained cookie, gateway, `SessionVault`, `CredentialEnvelope` and `ClientProvider`. Vault record persistence, context RPC, Root authentication/RPC and Storage responses are explicit synthetic in-memory transcripts. Every network dispatcher is closed.
2. Construct the real photo port/controller, load the actual V3/legacy check-in projections, select a synthetic 68-byte PNG, and send it through the actual raw upload, gateway, Vault, provider and Root reservation/completion/validation path. Use the parsed confirmed photo ID.
3. Queue a second, unsent left-photo selection and retain its actual local preview URL. Start the confirmed photo's private read and hold its already-authorized binary200 response after the actual Vault operation has returned. Attach an observation listener to that request's real fetch `AbortSignal`; it can deny nothing and grants no authority.
4. Return a canonical Root Review 403 for a new controller `load()`. Assert that the controller eventually becomes `denied`, the actual cookie stays `ready`, and the actual application boundary remains current.
5. During the synchronous abort triggered by `restrict()`, call the real `controller.getSnapshot()`. Actual observation is phase **`loading`**, the previous **confirmed 1** identity, and the queued left photo's **still-live preview URL**. A native local `blob:` fetch started in that callback returns the exact 68 synthetic bytes before revocation. Expected: restricted public state and no old preview/confirmed projection before abort observers execute.

The same-vector positive control calls ordinary `closePhoto()` with no access denial. It correctly retains the unrelated queued selection and returns its exact 68 bytes. The negative run uses 27 real provider context checks and 13 actual Vault executions; it observes the actual Root403 rather than installing a caller status or access bit. The original port races are separate and already pass.

The probe is `.local-artifacts/w7-report-photos-r3/controller-abort-observation.test.mjs`; its separately named `raw-vault.mjs` strengthens the retained raw helper by executing the actual Vault/envelope and session-view operations. `expectedRoot` is asserted against this checkout and the write:false bundle imports this checkout's actual runtime/Root source. The original R1/R2 files and assertions were not edited. Full stdout, command, true exit and source hashes are retained below.

This is a synchronous controller snapshot/object-URL custody defect. The current port's older private read remains fenced, and final controller state becomes denied. This evidence does **not** establish an ordinary rendered DOM leak, genuine Storage disclosure, a new request succeeding after backend revocation, or a backend authorization bypass. The queued preview is local synthetic data, not newly fetched server data. No browser or real client photo was involved.

Requested bounded correction for the owning author: capture old media/upload abort and URL cleanup targets, retire old public/private display ownership before any abort/subscriber callback, preserve same-session exact unknown-upload custody, and guard any later continuation against reentrant replacement/disposal. Ordinary close should continue to preserve unrelated queued selections. Keep both original port fixes and the positive control. No production fix was made here; new independent review is required afterward.

## Original port findings and adjacent inspection

- Both unchanged original R1 probes, retained HTTP and raw gateway/provider/Root, each produce old 1 pass / 1 fail on the `ea672828` input, observing the exact 68-byte private return after a newer same-port current `read()`403. On current candidate each passes 2/2 with its original predicates and positive bytes.
- The exact unchanged R2 same-photo raw probe/helper produces old 1 pass / 1 fail on `ed1ffc97`. After importing `2742e939`, it passes 2/2; newer same-photo descriptor403 retires older pending private bytes while the positive control still returns the exact PNG.
- The supplied new authorization-denial suite independently passes 36/36 with no skips/cancellations. It exercises descriptor/binary401/403; descriptor/stream/Blob/native-validator waits; active/read-only concurrent positives; unrelated IDs; late old A versus newer B and replacement parent reads; current global read phases; nonauthorization404/503; logout, role/expiry/disposal; throwing local relevance/Blob canaries; denial before caller relevance; unknown-upload exact replay; reentrant relevance; and cancelled/unacknowledged C.

Source inspection confirms the private per-photo record and monotonic `deniedThrough = Math.max(...)` cutoff bind basis, readable generation, exact ID and operation order. The authorization catch runs before external caller relevance, and later B/new basis/unrelated ID are outside an old A's cutoff. A merely begun/cancelled/unacknowledged C cannot hide B's actual denial. These scoped results close the reported RP1/RP2 vectors; they do not imply that the full feature is accepted.

The complete `upload()` method is byte-identical in `ea672828`, `ed1ffc97` and `2742e939`, SHA-256 `baf5c2d3de7f40b46f5020851518e90eb08114f626f9ecf4abe38c0bd130e774` for its full method text before the next method. Original reservation/completion UUIDs, exact bytes/body, original revision and unknown-status custody are preserved. No head substitution, new status/deletion API, all-media-disabled workaround or successful upload/native Storage claim is introduced.

The adjacent controller restriction/abort inspection exposed RP3. Broader restoration, throwing subscriber, UI/SSR/strict, retained and additional same-class acceptance work was stopped at that first new material finding, not declared passing.

## Frozen imports and protected paths

Own worktree `/Users/kanuj/.t3/worktrees/shelv/t3-aaf0001e`, branch `t3/aaf0001e`, started clean at frozen 58. Each exact manifest was inspected, then imported separately with ordinary `git cherry-pick -x`, with no conflict or manual resolution:

| Original input | Local attributed import |
| --- | --- |
| `39db1a7652d18b061bf557bdcd201d234744a780` | `42287984` |
| `ea6728287ac73f39af9d92c97267146efdd36e6a` | `57ddfb31` |
| `ed1ffc9738f1cc84573868ba22747860eb3eadc4` | `4439e69b` |
| `2742e93984503e6a2bbc577bf5be2b28769d6dea` | `d5247801b1fbd7d1a960be50b09e64ae420e4abe` |

All 19 candidate file blobs/modes match the author candidate. All 2,058 initial frozen tracked paths retain exact bytes/modes, including existing tests, auth/routes/shared transport/composition, configuration, roles, dependencies' package/locks and all SQL. No candidate import changes an existing frozen Parent file. The full cumulative 292-line W4 report, original R1/R2 reports, supplied original/prior briefs, responses/objections and historical evidence references were read. All five original normative documents match `INPUT_PROVENANCE.json`, including the 95,388-byte original input SHA-256 `c45701f9f54fd2b1dbb09bbd7aa2b9b437e9059aa6032b6f39411fe2e7f6efbd`; D01-D48 and all 26 approved frames remain the requirements.

Frozen58 has **64 canonical migrations /117 total tracked SQL files**. All old 62 canonical migrations and 113 old SQL files from the feature's frozen `d4125cca` parent remain blob/mode exact. The four additional frozen SQL paths are the Notifications migration/test (`20261101191527_portal_rebuild_notifications_v1.sql`, `portal_rebuild_notifications_v1.test.sql`, latest frozen attribution `cdc196199a4fc620c4119a20b9183a13c9c54899`) and photo-head migration/test (`20261101195359_portal_rebuild_photo_head_v1.sql`, `portal_rebuild_photo_head_v1.sql`, attribution `c0f97e6b9da85ad96fe1b20709ce3a955018bbd4`). These are preexisting Parent inputs, not W4 candidate additions, and no SQL was executed. `source-protection.json` records exact path attribution.

Parent's later dirty documentation and bounded test/type work were not imported, repaired or executed. In particular own `retained.ts` remains frozen 58 despite Parent's current physical edit. This review does not change the W4 port to use the independently accepted metadata action. The real M59 `client_read` content-version409 remains missing compatible feature integration. No C05/C07/App mount, ordinary media UI or browser/native admission follows.

## Live runtime and dependency custody

Initial and final LIVE capabilities/catalog, actual self and actual Parent `d632030a-18f7-4dec-a2c9-f5c0418c3fd5` configurations verify `codex/gpt-6.1-sol/reasoningEffort=xhigh/serviceTier=default`. The selected model advertises both exact options. Project `ac0af19d-d404-4f53-a870-02bfd76c2a80` has `defaultModelSelection:null`, separately recorded. All 18 own/Parent project/eight-role configuration files retain identical Sol/xhigh pins and modes; global selected model/effort were separately read. No config change or delegation occurred.

Authoritative actual returned task ID, separately forwarded by Parent after the initial gate:

`node:delegated-task:command%3Amcp%3Add730894-0fab-4a94-873d-743422eae122%3Adelegate-task%3Aportal-rebuild-w7-report-photos-source-review-20261101-r3`

Separate live backing thread is `thread:delegated-task:command%3Amcp%3Add730894-0fab-4a94-873d-743422eae122%3Adelegate-task%3Aportal-rebuild-w7-report-photos-source-review-20261101-r3`; separate backing run is `run:thread:thread%3Adelegated-task%3Acommand%253Amcp%253Add730894-0fab-4a94-873d-743422eae122%253Adelegate-task%253Aportal-rebuild-w7-report-photos-source-review-20261101-r3:ordinal:1`. Neither was used to infer the task handle.

Explicit initial/final Node is `/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node`, `v22.23.0`; PATH was pinned for child processes and ordinary Git hooks. Dependencies were initially absent. All four own/Parent root+portal lock checks match root `5c57c9aec9e4585066e032e234d610a77cbffd9a51f82700c158fc37fe01b5c2` / portal `bc914f3a9c9f24e44f02e3cff2804651147385ea5abda58a064531329ef23203` before projection and finally.

Authorized APFS `cp -cR` projections used absent ignored own root/portal targets only after nonsymlink roots/ancestor, same-device, filesystem and full source byte/mode/literal-link inventory checks. Saved pre-copy, post-copy and final parity covers 43,213 root / 9,071 portal entries including roots. The sole outside-node_modules literal workspace link `shelv-advisor-session-candidate -> ../session-integration/runtime` resolves only to this checkout's frozen tracked runtime. That source was compared to frozen Git, not Parent generated outputs or physical transport drift. Root React 19.2.3 and portal React 19.3.1 remain distinct and unchanged. No install, upgrade, foreign executable/runtime link, copied declaration, shim or relaxed closure/flag was used. Normal hooks were inspected; none was active and none bypassed.

## Executed evidence and explicit skips

From own repository root, `N=/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node`, `E=.local-artifacts/w7-report-photos-r3`. Every test command inherits `NODE_OPTIONS=--import=/absolute/own/E/deny-external.mjs`, including child Node processes. Global external fetch is denied; only native local `blob:` reads are allowed. All service-shaped traffic uses injected closed synthetic dispatchers. The actual Vault/envelope executes against memory, not a native Vault/SQL/Auth/Storage/provider service.

The wrapper `python3 E/run.py <label> <command...>` prints the true process exit before exclusively writing a unique immutable JSON with exact command/cwd/full stdout/stderr.

| Command after the wrapper | Result in this review |
| --- | --- |
| `N --experimental-strip-types --test E/private-media-denial.test.mjs` on ea input | old 1 pass / 1 fail, exit 1 |
| Same with `E/private-media-raw.test.mjs` on ea input | old 1 pass / 1 fail, exit 1 |
| Same with `E/same-photo-denial.test.mjs` on ed1 input | old 1 pass / 1 fail, exit 1 |
| All three unchanged probes on current candidate | 6/6, exit 0 |
| `N --experimental-strip-types --test apps/portal/tests/rebuild-report-photo-authorization-denial.test.mjs` | current 36/36, exit 0 |
| `N --experimental-strip-types --test E/controller-abort-observation.test.mjs` | actual-Vault control 1 pass / RP3 denial 1 fail, exit 1 |

All executed groups have zero skips/cancellations. Current author-reported prior 26/original 36/retained 105 and frontend/session/strict/SSR/UI 0 remain **attributed author evidence**, not independent R3 passes. They were not rerun here after RP3. The independently run new 36 is separate from original 36. No old fixture/assertion was adapted for the old/current probe results. `raw-vault.mjs` is a separately named strengthened composition used only for the new same-vector positive/negative reproduction.

Historical missing-feature/module REDs, controller/CSS setup errors, ESM dynamic-require failure, denied-basis/uncertainty/relevance regressions, dependency/setup failures and intermediate RP1/RP2 failures remain recorded in the original archives. They are neither erased nor relabeled current results. The own historical index references 36 report/raw/manifest files in place; no massive or nested review archive was copied. Own setup observations preserve the corrected skill/report/script lookups, one transient T3 list transport failure and a source-inventory helper variable error. None was classified as a product finding or resolved by changing source or test predicates.

## Evidence receipts and handoff

All following paths are relative to own `E` above:

- `r1-original-old-private-media-denial-20261101T233052-fb53a4f6-a771-4426-aea4-37bfa1966e23.json`: exit 1, SHA-256 `7e08e3c390f2f93da94c4f2d684bbd6750d76f09470868e94279d8be0c4d34c4`.
- `r1-original-old-private-media-raw-20261101T233053-73083b77-4862-4fc1-8ccb-3f3d81cbdb75.json`: exit 1, SHA-256 `73d70a9281d3cb6a92f1c73ffd87a54d2b0c8b91faf41da524fc6617ceb921f8`.
- `r2-original-old-20261101T233103-9bda294b-59cf-4e92-86e7-42a616dbdf84.json`: exit 1, SHA-256 `71a3b6e07cd9a04ed67094a20e624f8f46832dd369a95b9d11418eb8b0219e9a`.
- `current-original-probes-20261101T233114-5c14ed68-ee9f-4154-871d-1a388da19217.json`: exit 0, SHA-256 `953b64a5ae58f22b73280bd73e99757e816e93b0de28dfd582af8180b681ca08`.
- `current-new36-20261101T233115-2447980a-f530-4ab0-9990-da4df3735df1.json`: exit 0, SHA-256 `c18239e06cf1b0e29206d81f728aa8186a6174156ed8036fa2da99f484bede04`.
- `controller-abort-observation-20261101T233311-603126f8-024d-44e5-a6bd-d698641e351d.json`: exit 1, SHA-256 `6c57e6c9c7e3a694e6ed65f0691efe9ee99049c545e55e8a75ad6f3d5445ef91`.
- `dependency-clone-20261101T233041-d6934233-62e2-4077-b5d6-942b5d910bda.json`: exit 0, SHA-256 `29a218c2b1ab2d00cb6a94cbd55ac69662c6b2dc4ff432f16c5193f065d3935b`.
- `dependency-final-20261101T233507-07d85f65-0185-4802-aa61-1a3db3220662.json`: exit 0, SHA-256 `67f1285b076139f7d618b65872a14657dcb8afc0277fc1e0da2cff1bdf534c36`.

`candidate-blobs.json`, `source-protection.json`, `initial-own.json`, `initial-parent.json`, `configuration-file-protection.json`, `approved-provenance.json`, the full dependency inventories, initial/final live configuration/catalog receipts, `historical-evidence-index.json`, `setup-observations.json` and `evidence-receipts.json` retain the remaining provenance. `terminal-receipt.json` records the exact new report-only commit and clean terminal state separately from all four input ancestors. Parent imports **only that report commit**. Report links/scope and `git diff --check` are checked before commit.

No browser/preview/DOM/camera, server/listener, Docker/PG/SQL/SQLite, native fixture, actual Auth/Storage/provider service, process inventory, credentials, blocked Guidance/M65 retry/reroute, nested delegation, push/PR/merge/deploy, real-client publication/communication, money/order/fulfillment or production-permission action occurred. No hardware key, program enrollment or new human approval requirement was introduced. Actual upload/storage/deletion, genuine persistence, visual/accessibility, ordinary UI, hosted/CI/release and full D01-D48/26-screen acceptance remain unrun and ungranted.
