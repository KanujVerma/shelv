# W7 notification UI source R1

Owner: Kanuj. Review date: 1 November 2026. Independent, report-only SOURCE/PURE/SSR/closed finite-HTTP review.

**SPEC: scoped FAIL, NUI1/P2. Allocated review completeness: INCOMPLETE after the required first-material-finding stop. Correctness/quality: scoped FAIL, NUI1/P2.** The unchanged author aggregate passes 59/59 here; the new focused reproduction passes its EDIT-positive control and fails its VIEW-only recovery expectation. The feature remains unmounted. No SourceReady, App, full notification, genuine provider, browser or release acceptance is supplied.

## NUI1/P2: unresolved email recovery offers two silently inert actions after EDIT is removed

The actual [recovery renderer](../../../apps/portal/src/features/notifications/Notifications.tsx#L32) shows `check original status` and `retry exact action` whenever a pending mutation is uncertain, unknown or conflicted. Their availability only considers busy state. The actual [controller guard](../../../apps/portal/src/features/notifications/controller.ts#L187) correctly requires current human EDIT for both recovery operations when the original is `retry_failed_email_v1`; without EDIT it returns silently. The state has no corresponding original-recovery capability or explanation for the renderer.

Reproduced sequence through the actual creation-bound ApplicationSession, retained cookie, pinned61bb request adapter, Root codecs and Root handler/runtime:

1. Human advisor has VIEW and EDIT, loads their inbox, opens its loaded event, and confirms a failed-email retry.
2. The enumerated synthetic RPC returns503. The session becomes offline and retains the exact dispatched original.
3. The actual session HTTP restore returns the same boundary with VIEW=true and EDIT=false. Refreshing the own inbox produces a ready state containing that pending original.
4. The actual NotificationsView/shared-wrapper SSR renders both recovery buttons **enabled**. Invoking both controller methods dispatches **zero** additional commands, leaves the message null, and retains the exact pending command, including request UUID, action, target and CAS.

The adjacent EDIT=true control renders the same available controls, successfully checks the original as unknown, then deliberately retries its exact UUID/body and refreshes current rows. Its three commands are status, exact email retry and inbox read. The original resolves. It invokes no publication command.

This is an own-feature permission/recovery presentation defect, separate from the shared SD1/W6 transport holds. Authorization remains enforced: the VIEW-only negative does not send email or dispatch an EDIT-required RPC. The user nevertheless receives two enabled actions that cannot work and no explanation, contrary to the approved denied/read-only/recovery and no-dead-control requirements. Custody retention alone does not make that recovery state complete.

Correction belongs to the feature owner: expose truthful availability for the **pending original's** status/exact retry, render unavailable actions and a useful current-access explanation, and preserve the original. Keep status-original-retry and retry EDIT-protected; do not broaden authority, infer absence, discard custody or generate a new UUID. Recheck both this EDIT-loss sequence and VIEW-only mark-seen recovery after correction. No fix was authored in this review.

## Exact input and import provenance

Own worktree: `/Users/kanuj/.t3/worktrees/shelv/t3-933e5ede`, branch `t3/notifications-ui-source-r1`. Clean frozen Parent/base: **`58805cf1e3c09496633273ee4e8bc877793d8c6f`**. Parent's later dirty documentation and bounded test/type work is excluded. The clean author worktree `/Users/kanuj/.t3/worktrees/shelv/t3-f115f1fa` was independently read back at exact **`5e49b82460e7631601d0707e820d13ab1a86ffbd`**.

Each approved commit was imported separately with ordinary `git cherry-pick -x`. Every touched preimage first matched the candidate parent's exact Git mode/blob, every imported postimage matched its exact candidate, and every command exited0 without conflict or manual resolution:

| Approved input | Own attributed import |
| --- | --- |
| `14fc72890b9a4ca19105c13bd63791c15c53ac7f` | `8a2bd9a1f8aebc8f2fc2c9f011eb6a433638c269` |
| `96f8ee9b3b1e2b8f25a01bbcc2cb23fd343d664c` | `48d174cea159a9e51c525fc9c92d98df83e99585` |
| `e3394bae8eec8a6541187ab2aa90a58a86725901` | `74058de84f66909e8b484ae5811de5ef0aef3c95` |
| `766b9f455c4d625ff8e306db3105c81e3c6b6a10` | `722d4232f0f66103331bcd809405ce000ddbbdf3` |
| `6bc35b7205436a40eb66292c9c40583f2e816317` | `3bde25309d88ae9de3743d3bd5462fb7e3b45cb2` |
| `854ceca9d80a7f2abc5859b6cfc5edec258de0c7` | `3526451829a63e3e8bb7dabeeca13be11bf11290` |
| `107e87819a644db038eb071fc62b12109fa221c2` | `f9a4104aa1d7886800802c2936e69f88c4390efe` |
| `d720521315e7a2ee9f43bc4ffcca15e8c7174ae0` | `cc1f4a8e04409019d4db14d9d81e7978452d4f91` |
| `cb30c55c471d59fece0ab38bdd2b754e86e49b17` | `42f695d4a4325bc71fa1596e2dcb8b1c509823c9` |
| `61bb706f900fca01ab905388a8be439042b98055` | `7f719ef8391e9229bf3deff5d60d5c66ce8ddc23` |
| `5b04174f6247c2608feda3f9a83f6c8716de365d` | `cbbdf3a50cfe619717f4f0c435e4700221e17b8b` |
| `2ce65b2f890f7379874dfe5cba9c677ebfde981b` | `e93cc43be5c5cad0ea872dc4150c4a9bae09ff34` |
| `5e49b82460e7631601d0707e820d13ab1a86ffbd` | `2dcd38913127633bddc7502ba91380902f79bf96` |

The complete 35-path manifest, separate patches/hashes/import exits, base tree and exact final target proof are retained under `.local-artifacts/w7-notifications-ui-r1/`. Final seven feature files and matching tests/report match5e49; dependency paths match61bb. Request adapter SHA-256 remains **`902bd9a1d42450df9ef7b667f3ec065596b9aa709bba1502287d15b395e8a445`**. W0 report368979 was read as immutable context, not imported.

Full [W2 report](W2_NOTIFICATIONS_UI.md), [kernel R3](W7_NOTIFICATIONS_SOURCE_R3.md), the pinned W0 transport report, applicable instructions, approved input/specification/D01-D48/26-screen contracts and addenda informed this review. The full task message was recovered through continuation offsets into ignored evidence, with a terminal newline added by capture. The approved original remains95,388 bytes, SHA-256 `c45701f9f54fd2b1dbb09bbd7aa2b9b437e9059aa6032b6f39411fe2e7f6efbd`. W2 report SHA-256 is `c827b9231316fe81c81291e142a925d694996c1e565b3edf7a80a42c5cc9ba3c`.

## Executed evidence and limits

Evidence home: **`/Users/kanuj/.t3/worktrees/shelv/t3-933e5ede/.local-artifacts/w7-notifications-ui-r1/`**. The copied, inspected exclusive runner records command, expanded argv, cwd, stdout, stderr and true exit, printing TRUE_EXIT before writing its uniquely named raw JSON.

| Execution | Actual result | Evidence level |
| --- | --- | --- |
| Exact six author notification MJS files, own current source | **59 pass /0 fail /0 skip /0 cancel**, exit0 | unchanged43 plus separate direct9 plus actual serialized gateway7 |
| New pending-original EDIT control and EDIT-loss reproduction | **1 pass /1 fail**, exit1; negative observes2 enabled controls versus expected0 | direct actual Session/cookie/Root finite synthetic HTTP plus actual shared-wrapper SSR |
| Full physical source and target preservation | exit0;2,049 protected base paths exact; all35 candidate paths match their pinned targets | Git blob, physical byte hash and mode verification |
| Dependency preflight and parity | exit0;43,213 root /9,071 portal entries including roots | exact-lock contained APFS copies, no install |

Exact executable commands, run from this own root, with `NODE=/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node` denoting that literal binary:

```sh
$NODE .local-artifacts/w7-notifications-ui-r1/run.mjs owned59 $NODE --experimental-strip-types --import ./tests/portal-review-no-network.mjs --test --test-concurrency=1 apps/portal/tests/rebuild-notifications-model.test.mjs apps/portal/tests/rebuild-notifications-recovery.test.mjs apps/portal/tests/rebuild-notifications-ssr.test.mjs apps/portal/tests/rebuild-notifications-controller.test.mjs apps/portal/tests/rebuild-notifications-lifetime.test.mjs apps/portal/tests/rebuild-notifications-gateway.test.mjs
$NODE .local-artifacts/w7-notifications-ui-r1/run.mjs pending-edit $NODE --experimental-strip-types --import ./tests/portal-review-no-network.mjs --test --test-concurrency=1 .local-artifacts/w7-notifications-ui-r1/pending-edit.test.mjs
python3 .local-artifacts/w7-notifications-ui-r1/dependencies.py
python3 .local-artifacts/w7-notifications-ui-r1/preservation.py
```

`owned59.json` retains complete output. The original43 comprises pure/recovery/SSR12 and direct controller31. Those direct cases deliberately bypass gateway/Vault. The separate gateway7 uses the actual serialized SessionVault, CredentialEnvelope, gateway, providers, Root runtime/handler and controller. It queues B behind held A and releases A before B dispatch; it does not manufacture impossible same-Vault concurrency. The nine added direct controls remain separate from the original43.

`pending-edit.test.mjs`, `pending-edit.json`, `pending-edit-observations.json` and `pending-edit-provenance.json` bind the new reproduction. Its copied fixture prefix changes only relative import bindings to **this** candidate; its new assertions exercise actual session HTTP capability updates. SSR imports the actual owned renderer and shared controls with one portal React graph, write:false. The captured input graph binds own source/dependencies. No supplied positive operation/current/authority implementation replaces an application path. The fail is the expected product assertion, not a setup error. The negative's deep-equality assertions confirm exact pending UUID/body retention and zero egress; its null message and enabled button attributes are recorded. The positive confirms unknown-status custody and exact-original retry resolution. No provider acceptance, real email or database transaction is implied.

Global external fetch is denied by the retained preload. Only enumerated in-process synthetic session/Auth/notification HTTP replies execute. These are consumer/transport observations, not genuine enrollment, current database permission, persistence or email-delivery evidence. The module-typeless Node warning remains with package bytes unchanged.

Historical author evidence stays distinct: initial43 was41/43 on early14fc and current43/43 on61bb; copied31 was a controller subset. Extra old9/9 was non-sensitive for V3, while the separate old generic5 was4/5 and current5/5. Author kernel39, retained256, new post-abort12, strong290/0, Workers44 baseline/44 current/0 introduced and bundle2152/2 are **attributed author results, not independently rerun gates here**. All prior raw/adapted/current failures and the kernel R1/R2 FAILs remain unchanged. `author-evidence-references.json` hashes132 top-level files in place, including20 nonzero raw exits, without recursively duplicating historical archives. No prior archive is counted as new tests.

The first new material finding was sent to Parent immediately. Parent acknowledged it and reserved the correction for the feature owner. Per the explicit stop rule, **no further broad tests, compiler, bundle gate or dependent acceptance probe ran after NUI1**. Strict/controller-adjacent expansion, kernel/transport replay, original generic sensitivity replay and whole-App verification are therefore unrun in this review, not green or waived.

## Preservation and runtime

`preservation.json` binds all2,084 pre-report tracked files to actual Git blobs, SHA-256 and physical modes. Of2,060 frozen-base files,2,049 outside the explicitly approved candidate set remain exact. All117 SQL source files and64 migrations remain exact; all62 historical migrations additionally match kernel R3's frozen base `a4c72858b0fe8b0fb4da4b21a2ccaf9cf6ecbec9`. This review introduces no SQL path and executes no SQL. The two already-present Parent extras are:

| Existing Parent migration | SHA-256 |
| --- | --- |
| `20261101191527_portal_rebuild_notifications_v1.sql` | `408b860074abb18a1c1452bd6d08af8009db7fb48e0d01476abd608932d2b684` |
| `20261101195359_portal_rebuild_photo_head_v1.sql` | `b1f1a2ac93bfca7206f968d02e32e0451034364961caed87c8c7f4663f402632` |

App/routes/sidebar/shared UI, Root notification kernel, configuration/eight role pins, packages/locks and unrelated source remain frozen except the exact allocated transport/test postimages. The sole authored tracked path is this new report; old reports and production/tests were not fixed. Parent imports **only the report commit**, excluding all13 input ancestors.

Before either dependency copy, all four own/Parent root/portal lock hashes matched: root `5c57c9aec9e4585066e032e234d610a77cbffd9a51f82700c158fc37fe01b5c2`, portal `bc914f3a9c9f24e44f02e3cff2804651147385ea5abda58a064531329ef23203`. Both ignored destinations were absent, roots/ancestors were nonsymlinks, devices matched and full source byte/mode/kind/literal-link manifests were saved. `/bin/cp -cR` copies passed full source-unchanged and destination parity. The declared literal `../session-integration/runtime` link resolves only to the own existing tracked runtime, whose Git bytes/modes were verified, including the exact admitted suffix. Parent runtime generated outputs or ongoing transport drift were not copied or compared as frozen source. Root and portal React versions remain unchanged. No installation, upgrade, shim, flag/closure relaxation or foreign executable was used.

Initial and final LIVE self configuration, actual Parent configuration and current model catalog/descriptors return **codex / gpt-6.1-sol / reasoningEffort=xhigh / serviceTier=default**. Catalog efforts are low/medium/high/xhigh/max/ultra; service tiers default/priority. Project defaultModelSelection is null and is not the actual thread selection. All eight role files retain Sol/xhigh, match physical Parent bytes/modes, and remain unchanged. Explicit Node initially/finally reports **v22.23.0**.

Authoritative taskId, separately forwarded after the initial gate: `node:delegated-task:command%3Amcp%3Add730894-0fab-4a94-873d-743422eae122%3Adelegate-task%3Aportal-rebuild-w7-notifications-ui-source-review-20261101-r1`.

Backing threadId: `thread:delegated-task:command%3Amcp%3Add730894-0fab-4a94-873d-743422eae122%3Adelegate-task%3Aportal-rebuild-w7-notifications-ui-source-review-20261101-r1`.

Observed runId: `run:thread:thread%3Adelegated-task%3Acommand%253Amcp%253Add730894-0fab-4a94-873d-743422eae122%253Adelegate-task%253Aportal-rebuild-w7-notifications-ui-source-review-20261101-r1:ordinal:1`. Actual Parent metadata identifies `d632030a-18f7-4dec-a2c9-f5c0418c3fd5`; no task identity was inferred from a thread/run/request suffix.

Ordinary hooks/config were inspected, with only sample hooks present and no bypass. One initial ignored-evidence serialization attempt exited1 because JSON booleans were embedded as Python literals; the corrected literal JSON write succeeded before imports. The probe-generation Python warning about a regular-expression escape did not alter the saved JS or its actual source assertion. Both are setup qualifications, not product verdicts. Final diff/link/scope checks and the exact report commit/hash are retained in terminal ignored evidence.

## Held gates

NUI1 must be corrected and independently re-reviewed before this feature's source acceptance. Generic photo/multipart SD1 and W6 post-invoke offline races remain separate shared admission holds; they were not rerun or promoted to new notification findings. Future V4 requires an exact composed recheck before Root admission. No overall SourceReady or App acceptance follows current61bb source counts.

App mounting, bell/sidebar/A06 integration, Back/focus and authenticated destination recovery remain incomplete. A06's loaded publication reference and content/assignment revision binding are exercised only within the bounded source cases; there is no global event directory or guessed Care/Review A07 route. Genuine SQL/Auth/RLS/catalog/concurrency/journal truth, provider selection/reconciliation/authenticated webhooks/delivered/bounced truth, browser/visual/accessibility, full npm/type/export suites, CI, human comprehension and release remain open.

No nested delegation, browser/preview/DOM, server/listener, process inventory, Docker/PG/native/SQL/Auth/Storage/provider resource, credentials lookup, blocked Guidance/M65 rerun, hardware prerequisite, live client/publication/communication/funds/order/permission action, push/PR/merge or deployment occurred. The complete approved rebuild and full notification scope remain open. Parent owns canonical status and CONTEXT_SYNC updates.
