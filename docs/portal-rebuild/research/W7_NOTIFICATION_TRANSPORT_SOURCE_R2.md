# W7 combined shared and notification transport: SOURCE R2

Owner: Kanuj. Review date: 1 November 2026, Chicago. Independent, report-only review. **First new material finding NT1/P2: a notification provider deadline can become a session-ending denial and revoke the owning Vault. Dependent acceptance stopped.** No production or test correction was authored. This is source and finite synthetic HTTP evidence, not genuine Auth, SQL, browser, provider delivery or release acceptance.

## Separate verdicts

| Subject | Specification / completeness | Correctness / quality |
| --- | --- | --- |
| SD1 retained photo/multipart correction | **Scoped PASS** for the unchanged five-case reproduction and executed retained-wrapper cases. Exact OLD61 gives3/5; CURRENT gives5/5. | **Scoped PASS** within executed cases. Known current401 retires;403 remains denied; old generation cannot retire B. Retained non-retirement and the candidate's added503 regression remain distinguished. |
| Generic post-invoke offline classification | **Scoped source PASS:** the exact native Response.json program reproduces OLD4 local401/42 in both source and original compiled forms, then CURRENT source0/42. | **Scoped PASS for the current source observations and strict no-decode controls.** A fresh current compiled race and the complete generic acceptance matrix are held after NT1. |
| Full generic V4 dependency review | **INCOMPLETE / not admitted.** The executed51-case source set passes, but remaining raw/compatibility replays, consumers and compiler/build gates are held. | No unqualified generic-quality or integration PASS. The separately observed annotation setup failure remains unresolved in this frozen candidate. |
| Authenticated notification transport | **FAIL / NT1.** A provider-local timeout is treated as a current authority denial after the abort. The complete allocated matrix is unaccepted. | **CHANGES REQUIRED / P2 at the supplied finite-fetch seam.** Positive adapter15/15 and actual closed composition12/12 do not cover the failing provider deadline. |
| Account, notification feature/App and complete rebuild | **Not accepted or activated.** | No native/browser/SQL/financial/provider/CI/release or full-goal acceptance. |

The original SD1 R1 FAIL, cookie R1/R2 dispositions, W6 AAS4 and W2 consumer findings remain historical. This successor does not rewrite any earlier verdict or count an author result as a fresh W7 execution.

## NT1/P2: provider-local deadline revokes the actual session

Affected new source: [provider response classification](../../../apps/portal/session-integration/runtime/server/upstream.ts#L157), especially the unconditional received401/403 branch at161-162. Relevant unchanged consumers are [Root abort denial](../../../supabase/functions/concierge-notifications/handler.ts#L24), [positive notification mapper](../../../apps/portal/session-integration/runtime/server/policy.ts#L179) and [Vault operation-error retirement](../../../apps/portal/session-integration/runtime/server/session-vault.ts#L121).

The provider creates its own AbortController and actual12,000ms deadline. Successful response bodies are checked against that abort, but401/403 headers are accepted without checking whether the deadline already fired. The canonical Root handler correctly refuses an aborted request with401/session_ended. The new provider then treats that request-lifetime refusal as a current session denial even though its final context HTTP response still identifies the same permitted synthetic session. `mapNotificationResponse` throws401; actual `SessionVault.execute` revokes the captured record; the gateway and retained cookie propagate401 and sign out.

Independent minimal sequence, with no reduced timer or rewritten response:

1. Restore the actual synthetic client through ApplicationSession, cookie, gateway, encrypted SessionVault and ClientProvider.
2. Submit the original mark-seen UUID/delivery/CAS through the actual canonical notification index/runtime/handler and fixed RPC path.
3. The finite RPC fixture holds its native receipt and deliberately ignores its signal. Release it only when the provider's actual12-second AbortSignal fires. The Root runtime's existing10-second signal also remains unchanged; the fixture ignores that signal too.
4. The actual aborted Root handler returns401. The provider receives it after its own abort, performs its actual context HTTP recheck, and classifies it as session-ended.

| Own independent observation | Result |
| --- | --- |
| Ordinary canonical mark receipt | PASS; exact receipt, current boundary, active Vault. |
| Current received Root401 before provider deadline | PASS; rejected401, signed-out cookie, revoked Vault. This control preserves legitimate current-denial retirement. |
| Provider deadline, followed by actual aborted Root return | **FAIL:** actual provider abort observed; elapsed12,005ms; error401/session-ended; cookie signedout; original boundary absent/invalid; Vault revoked. Expected existing503/uncertain without timeout-derived session revocation. |

The program is **2/3, exit1**, with zero skips/cancellations. It fails at `401 !== 503`. The observation is recorded before assertions, so cookie/boundary/Vault effects remain available even though later predicates do not execute. Only one deadline attempt was run. No broader test or compiler was run afterward.

Impact is wrong uncertainty and session lifetime at a supported injected-fetch seam: a dispatched write whose outcome is unknown is presented as session-ended, with actual local session retirement. No SQL commit, persisted notification change, unauthorized result, private-data disclosure or production incident is established. No B-before-held-A schedule is forced into the serial Vault. This example uses one actual Vault and one in-flight operation, then observes its retirement.

**Reachability qualification:** the finite HTTP fixture deliberately completes after abort. Ordinary signal-honoring network fetch would normally reject instead; that genuine network/browser/Workers behavior was not acquired or demonstrated. The finding is a concrete source-contract counterexample, not proof that a live deployment loses sessions on every timeout. The positive current401 control is intentionally separate from this post-abort case.

W0 should reconcile provider header/abort provenance before relying on the new transport's shared denial guarantee. Preserve actual pre-abort received401/403, bounded disposal, final current-context checks, strict private-result rejection and exact-original uncertain-write semantics. Do not solve this by ignoring every401, forcing a session current, changing Root authority rules or generating another UUID. This reviewer made no fix. A fresh independent round is required after the owner's correction.

Parent received NT1 immediately with the exact source/raw paths. Afterward work was limited to reading saved evidence, preservation/runtime checks and this new report. Remaining dependent acceptance was stopped under the original brief and the [source-only workflow](/Users/kanuj/.codex/memories/skills/shelv-source-only-independent-review/SKILL.md).

## Exact frozen input and attributed imports

Own T3 workspace: `/Users/kanuj/.t3/worktrees/shelv/t3-06e00b15`, branch `t3/notification-transport-source-review`. Initially clean at **9fecd878bade2cfcfd84cd571cfc664a309d9bc0**. This includes Parent's4e dual-graph retained.ts prerequisite and published-checkpoint documentation. It is not replaced by the author's older58c base or by later physical Parent edits.

Every ordered input's complete path list, preimage/postimage blobs and Git modes was checked against the explicit24-path candidate manifest before ordinary separate `git cherry-pick -x`. A complete virtual preflight preceded mutation. All14 imports were conflict-free, with exact physical postimage readback. No manual merge, reset, downgrade, ancestor replacement, config change or physical Parent drift was imported.

| Ordered author input | Own attributed setup commit |
| --- | --- |
| `14fc72890b9a4ca19105c13bd63791c15c53ac7f` | `56589e08f91bf1e4216262620bc3ccf9b724a766` |
| `96f8ee9b3b1e2b8f25a01bbcc2cb23fd343d664c` | `4b85a102c8869b048f5df5e04ce02871346b9d79` |
| `e3394bae8eec8a6541187ab2aa90a58a86725901` | `d1387e914792c94a05d700b6845a25ae4bc00145` |
| `766b9f455c4d625ff8e306db3105c81e3c6b6a10` | `d1a3839eab9efc2fe217430a12d4bd3b963533e9` |
| `6bc35b7205436a40eb66292c9c40583f2e816317` | `5de5fc3e95745df4b5769bfb75079292bf1021c0` |
| `854ceca9d80a7f2abc5859b6cfc5edec258de0c7` | `536da56716604f9dcc4f3ff785c5171161c8b3e9` |
| `107e87819a644db038eb071fc62b12109fa221c2` | `948fb45af2442ffa1ab8440d5cbf1004f6b5ed93` |
| `d720521315e7a2ee9f43bc4ffcca15e8c7174ae0` | `0c92a729647edc722fe170c7e83463896f2f61b9` |
| `cb30c55c471d59fece0ab38bdd2b754e86e49b17` | `d40273635bd90e2f63504afe7191a6e4db4721d8` |
| `61bb706f900fca01ab905388a8be439042b98055` | `a7fdf47a1b5319bce7b8c9857214b494e5f34ee7` |
| `368979d76256334ad2b0fabc2f4e3656979d29ef` | `67b8897553848bb25f9d0c29e3e3ca535e8c7558` |
| `3f4cb6716fed9123e2d47949a28144b9a7b55485` | `ee9704ff8d63ad8fd8aad743a856cb60174851d2` |
| `e937db61dea49b74cae971633b52f488f63d28c2` | `9bd22a32a6d6cabd445ab32ef79fdfcd2e8fef59` |
| `0597cbafbaef98414829c98ebd3c1d046d5b1718` | `4946f7cdee9ecb6e08a465b71634bbeefec1283d` |

The final imported review setup head is **4946f7cdee9ecb6e08a465b71634bbeefec1283d**. All24 candidate paths match the exact0597 final Git objects; production is the supplied3f4 successor plus its unchanged earlier transport inputs. These14 input commits are **not deliverables**. Parent should import only this new report's terminal commit.

The initial manifest binds2,065 tracked files. Of those, **2,053 remain byte/mode-exact**; only12 explicitly candidate-owned existing paths differ: eight production transport paths and four explicitly allocated old test paths. Twelve candidate additions are separately attributed. Parent retained.ts4e, all unrelated tests, App/features/routes, Root contracts/SDK/kernel/worker/sink, packages/locks/config and all eight role files remain exact. This review authors only the new report and ignored evidence.

All **64 migrations /117 SQL files** remain frozen, with no SQL execution. Relative to the old62/113 baseline9c783, the only four additional SQL paths are the already frozen notification migration `20261101191527_portal_rebuild_notifications_v1.sql`, photo-head migration `20261101195359_portal_rebuild_photo_head_v1.sql` and their two canonical SQL tests. `protected-final-before-report.json` records all four exact blobs/modes/SHA-256 values. Notification migration remains408b8600; its pgTAP remainsf66cf297. No candidate-specific migration is added by W0 or this reviewer.

## Prior defects, executed checks and proof levels

Read the full cumulative W0 transport report through0597, exact independent SD1 report3207, original cookie R1/R2, actual W6 AAS4 reportbf393 and W2 held2ce report plus5e49 response, alongside applicable AGENTS, rebuild entry/decisions/specification/contracts/workstreams/status/addenda and the full supplied original task. The actual original95388-byte approval remains separately preserved. These facts do not imply that the entire notification or Account feature is accepted.

| Fresh W7 execution before NT1 | Exact result |
| --- | --- |
| Byte-identical original SD1 five-case program, OLD61 runtime inputs |3/5, exit1; both photo and multipart known401 become503. |
| Same program, own CURRENT candidate |5/5, exit0; all original assertions unchanged. |
| Exact copied W6 native Response.json race, original source |4 local401/42 timings, exit1. |
| Exact copied original compiled race |4 local401/42 timings, exit1. |
| Same exact race program, imports bound to own current runtime and exact copied Account facade |0 local401/42 timings, exit0. Only source/import location binding changes; native responses,0..20 microtasks, payloads and predicates remain exact. |
| Current provenance5 + retained-wrapper30 + offline-return4 + post-abort12 |51/51, exit0; zero skip/cancel. Includes no offline decoder/private canary return, true ended/replaced/expired401 and same-owner/CSRF server-generation B controls. |
| Actual notification adapter |15/15, exit0; zero skip/cancel. |
| Actual cookie/gateway/encrypted Vault/provider/canonical index/Root finite HTTP |12/12 groups, exit0; zero skip/cancel. Nested body/status observations are not additional tests or SQL transactions. |
| Independent provider deadline and two controls |2/3, exit1; NT1. |
| Actual Root application typegraph |Exit0. |
| Actual Root test typegraph |Exit2; three annotation diagnostics below. |

The old exact58 non-retirement result remains distinct from the added OLD61 uncertain503 classification. The unchanged SD1 program compares OLD61 with CURRENT; it does not rerun or rename the historical exact58 diagnosis. Generic current success/decoder fences remain strict in source: the3f4 change removes only the obsolete invocation-phase condition/assignment around failure classification, not the post-invoke currentness, actual abort, applicability or decoder guards. The executed offline-return controls corroborate that distinction.

Actual notification composition retains the creation-bound API, Root command/positive result mapping, fixed public-key edge entry, VIEW list/own seen/original-seen-status/human delivery reads, EDIT retry/original-retry-status, and CSRF for seen bookkeeping. Examined finite tests reject caller selectors, private extras, unknown namespaces, agent/wrong-audience provider contexts, malformed/oversized responses, lost EDIT and stale/disposed returns. No successful operation, Auth, owner, currentness or Vault implementation is substituted. Enumerated Auth/context/RPC HTTP fixtures are synthetic observations, not genuine authorization or storage proof.

The prior W2 same-Vault impossibility is respected. `SessionVault.execute` serializes its complete operation await. Direct Root/controller tests, serial gateway pipeline evidence and mounted App admission remain separate. This review does not import current physical W2 NUI1 files or treat them as unchanged59. Exact Git5e49 is the historical consumer input. W6's actual49/50/69 and current V4 author evidence remain attributed source/controller results, not Account completeness or App acceptance.

## Compatibility exceptions and held checks

The two approved test exceptions were inspected as exact commits and remain separately attributed inputs:

- **854 timing only:** exactly the existing late401/late403 fixtures over three families now wait for the existing `bodyRead.entered` before caller abort. The exact pre/post hashes are208f127e and22fc4707. Own balanced-call text inventory independently verifies all57 identical assertion calls; the preserved original AST audit separately binds57 calls, two fixture changes and six expanded timings. Titles, predicates and budgets are unchanged in the inspected diff. This is not unchanged timing input; the separate new post-abort12 passed in this review. No fresh compiler/AST execution followed NT1.
- **e937 single expected status:** only the offline-private-return predicate changes401 to503. The same invocation, private canary, decoder `assert.fail`, test title and other bytes remain. The preserved36-assertion inventory records exactly that one predicate difference. It does not grant offline data or relax a success fence.

Historical raw **280/287**, supplied raw **250/256**, and unchanged-test/current-source **24/25** remain distinct from the approved compatibility **287/287,256/256,25/25**. Own in-place raw-reference verification confirms the280/287 and24/25 failures and their separate successor receipts. No287,256 or25 suite was freshly rerun here after NT1; the supplied250/256 result remains attributed prior evidence, not a new W7 run. Original39/raw37 kernel admission qualifications also remain historical.

The exact generic-only V4 manifest was verified read-only in place: **16 runtime inputs,13 exact58 files plus three explicit generic postimages**; manifest SHA-25632bd38065789df6166fdd3f0465ae8a250513938e7e148e090f3d3a653e88036; patch SHA-256a09d1218fe39edad0c34e8a9a002101a7903482952f1ac59285ec38dc164276d. The18/20-input composed proof manifests and their hashes were verified as retained author evidence, not freshly compiled. Generic-only postimages intentionally exclude notification additions and are not claimed equal to the full candidate's three files. The own actual candidate remains the target of current probes.

**Held after NT1:** fresh current emitted race, complete W6 source/compiled44+19 and Account controller acceptance, W2 frozen59/original43 replays, broader generic/reentrant/deadline matrix, raw/adapted/current287/256/25 replays, kernel39, source erasure/strong222 and Workers44 differential, configured frontend/session compilers, UI guard, and actual2246-input/15-output write:false build. Author results remain at their own heads. No full strong0, zero introduced Workers diagnostic, bundle parity or feature acceptance is claimed by this review.

## Separate compiler setup gate

Before NT1, actual explicit-Node `node_modules/typescript/bin/tsc -p tsconfig.tests.json --noEmit` produced exit2:

```text
apps/portal/src/transport/session.ts(1,1): error TS2578: Unused '@ts-expect-error' directive.
tests/portal-cookie-denial-provenance.test.ts(23,1): error TS2578: Unused '@ts-expect-error' directive.
tests/portal-notification-transport.test.ts(3,1): error TS2578: Unused '@ts-expect-error' directive.
```

The anticipated shared-transport annotation mismatch was sent to Parent with a request for the exact one-file production prerequisite and separately pinned bounded test prerequisites. No annotation, declaration, compiler flag or configuration was changed here, and later physical Parent fixes were not adopted. The Root application graph separately passes0; it does not cover or erase this test-graph failure. Compiler completion remains held after NT1 rather than probing around it. This setup gate is not presented as a second transport behavior finding.

## Evidence, runtime and terminal custody

Ignored evidence home: `.local-artifacts/w7-notification-transport-r2/`. Own runner preserves expanded executable/argv/cwd/PATH/stdout/stderr/elapsed time and true exit, printing `TRUE_EXIT` before exclusive unique0444 JSON creation. Original five-case probe and exact20-file W6 source/compiled input copy are hash-bound; only executed inputs were copied. Prior raw reports/manifests remain in place with references. No recursive duplication of historical review archives occurred.

Key independent artifacts:

| Artifact | SHA-256 |
| --- | --- |
| `provider-deadline.mjs` | 628097e74a347cdd4db3d560cd77663d9a2ae3ba3650cd8d0d0ecbd18822758f |
| `independent/provider-deadline-observation.json` | 5876bfc508c93cb53d0d97a98e38d29392011ba8830b5604d69f2096417ac40d |
| `independent-provider-deadline-da94c892-dc38-45a3-ab4a-cae5ee50b2b4.json` | f1bd818e0ed48a47e9ffe4bbdeeed190ed45092875c2d1793f80222bd9de2328 |
| `photo-denial.mjs` | bed862d3d65e6eab752d388548fee315364deb049adafaea20c62b241ce1652a |

The independent fixture is a bounded extraction of the inspected actual-composition harness, with its own evidence path, exact own esbuild import and explicit own-root assertion. Its only additional transport hook forwards the original input/init into canonicalEntry and observes the real provider signal. No status, authority, body, timeout, capability or expected success was changed. Source bundling uses write:false; only the own evidence module is written. No current compiled-race claim follows from that separate fixture bundle.

Dependency roots were initially absent and ignored. All four locks matched before either APFS copy: root5c57c9aec9e4585066e032e234d610a77cbffd9a51f82700c158fc37fe01b5c2; portalbc914f3a9c9f24e44f02e3cff2804651147385ea5abda58a064531329ef23203. Full nonsymlink ancestry/root, same-device and source byte/mode/kind/literal-link manifests preceded cloning. Full parity is43,213 root /9,071 portal entries, including roots. Literal workspace link `../session-integration/runtime` resolves only to own runtime;91 own tracked runtime entries match frozen9fecd plus the exact attributed candidate runtime postimages. Parent generated outputs/ongoing transport drift were never copied. Root React19.2.3 and portal React19.3.1 remain distinct. No install, upgrade, shim, alias, outside link, generated foreign declaration or flag relaxation occurred.

Authoritative taskId was separately forwarded by Parent after the initial live gate:

`node:delegated-task:command%3Amcp%3Add730894-0fab-4a94-873d-743422eae122%3Adelegate-task%3Aportal-rebuild-w7-notification-transport-source-review-20261101-r2`

Backing threadId is separately `thread:delegated-task:command%3Amcp%3Add730894-0fab-4a94-873d-743422eae122%3Adelegate-task%3Aportal-rebuild-w7-notification-transport-source-review-20261101-r2`; actual childRunId is `run:thread:thread%3Adelegated-task%3Acommand%253Amcp%253Add730894-0fab-4a94-873d-743422eae122%253Adelegate-task%253Aportal-rebuild-w7-notification-transport-source-review-20261101-r2:ordinal:1`. No task identity was inferred from another handle or suffix. Imports/probes waited for that forwarded taskId.

Initial/final LIVE self and actual Parentd632030a-18f7-4dec-a2c9-f5c0418c3fd5 configurations plus catalog/descriptors return **codex /gpt-6.1-sol /reasoningEffort=xhigh /serviceTier=default**. Descriptors support those values. Actual thread lineage supplies Parent; capabilities' caller-context parentThreadId is not genealogy. Project defaultModelSelection is separately null. Project/default-subagent/all eight role pins and historical max8 remain unchanged. Explicit initial/final `/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node` returns **v22.23.0**; no ambient Node20 or nested delegation.

Read/setup qualifications remain separate: initial role inventory named absent global agent directory; an optional metadata read guessed the wrong metafile suffix; the first raw-reference metadata loop assumed an object where the immutable file was a list. Correcting only ignored/read-only setup retained all originals. None is counted as a product RED, accepted compiler result or test pass.

Ordinary hooks were inspected; no active hook or hooksPath override/bypass. All launched finite commands are terminal. Final report links/scope/whitespace and preservation checks precede the normal report-only commit; the excluded FINAL-HANDOFF.json records its actual full SHA and clean-state readback without self-reference.

No browser/preview/DOM/process inventory, server/listener, Docker/PG/SQL execution, Auth/Storage/provider service, credentials/native/CLI resource, blocked Guidance/M65 retry/rephrase/reroute, hardware/program prerequisite, counterpart write/revert, push/PR/merge/deployment, real client/publication/communication/permission/funds/order/fulfillment action occurred. Test HTTP, crypto and owned evidence files are the only runtime boundaries.

NT1 owner correction and a new independent source round are required. Genuine SQL/Auth/current rights/RLS/ACL/catalog/concurrency, notification App/inbox/sidebar/A06/destination recovery, Account/W2 admission, provider reconciliation/authenticated webhooks/delivery, ordinary browser/visual/accessibility, full suites/Expo/native, exact-head CI, human/business and release gates remain open. **Parent imports only this new report's terminal commit; the complete approved goal remains unchanged.**
