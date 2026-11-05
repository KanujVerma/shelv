# W7 report photos: independent SOURCE R4

Owner: Kanuj. Reviewed 1 November 2026 local, 2 November UTC. New independent report-only review of `da0d3ae093d67b651adb8481da6fe8be16a52cc9` on frozen Parent `1bdb248dd5480ae5375a655cd024aa3f44d8fedb`, with the separately authorized annotation-only type prerequisite recorded below. Only this new report is an authored tracked change. No reviewer-authored production or tracked test fix was made.

## Separate verdicts

**SPEC / completeness: scoped PASS for the RP1-RP3 reusable photo lifecycle requirements; full feature completeness remains INCOMPLETE.** The exact old failures reproduce on their old inputs and pass on the successor. The acknowledged M59 legacy `client_read` goal-history 409 and the compatible feature-head update/C05/C07/App composition remain separate integration debt. The independently reviewed PhotoHeadR3 Root 58 producer is already present in the frozen Parent; this feature still calls its legacy reader. No port/head/shared/App change is included here.

**Correctness / quality: scoped SOURCE / functional PASS, with the separately approved inherited type dependency verified.** No new material candidate finding was established. Prior probes pass 8/8, the new 24 plus prior 26+36 pass 86/86, and six independent adjacent actual-Vault cases pass 6/6. On frozen 1bdb, raw original tests remain **35/36, exit 1**, and frontend exit 2 from two inherited TS7016 diagnostics. After the exact one-file Parent dependency `4e07119b41876b66d2cf5fb42a705ebd669574db`, only the original strong type probe (1/1, strict exit 0) and configured frontend (exit 0) were rerun, with identical flags/declarations. The earlier session 0/UI 0/History 105 results remain separate. No full 36 replay or broader final-head suite is claimed. This is bounded source verification, not application or release admission.

Original R1 `35189b919d47c915cfe3e27eb9084422f0a68b61`, R2 `55d3c45c9273e8042becb189d846392976fd5c69` and R3 `1aab7fc3c11a67ec30ae9b1642dfca48abecb057` remain immutable **FAIL** reports. Their full reports, the complete 396-line cumulative W4 report, the original/prior briefs, responses, objections and executed R3/author raw evidence were read in place. Their exact report hashes and source commits are retained in `original-reports.json`.

## Original reproductions and RP3 correction

Both byte-identical original R1 probes, retained HTTP and raw gateway/provider/Root, each produce control 1/fail 1 on the `ea672828` input. Each observes the already-authorized 68-byte PNG returning after a newer same-port actual current read 403. The exact original R2 same-photo probe/helper produces control 1/fail 1 on `ed1ffc97`, after a newer same-photo descriptor 403. All three pass 2/2 each on the final candidate, without changed predicates or fixture setup.

The original R3 `controller-abort-observation.test.mjs` remains byte-identical, SHA-256 `ae1e04b43bf277719ebb1670902ddc4e7107195af1231630ca206d7eeb1f7a6a`. Its original helper has the exact reviewer-root literal `'/Users/kanuj/.t3/worktrees/shelv/t3-aaf0001e/'`. Under the explicit allocation, the separate ignored working helper changes **only that one literal** to `'/Users/kanuj/.t3/worktrees/shelv/t3-cd119a47/'`. The original is preserved as `raw-vault.original.mjs`, SHA-256 `e16ab40698115ded2dca2017c0d705b5ca950dddb57ed99b61e6a2666db8c85a`. Byte reversal of the single substitution equals the original. The probe, assertions, original helper/archive and original raw failure remain unchanged. No foreign checkout was executed. Own results are labeled **RELOCATION-ONLY**.

On old `2742e939`, the relocated R3 probe produces control 1/fail 1, true exit 1. During the real pending media request's abort callback after actual Root 403, `getSnapshot()` returns `loading`, confirmed 1 and a queued live URL whose local fetch returns 68 bytes. On `da0d3ae`, the same probe passes 2/2, true exit 0: the denial callback sees `denied`, items 0, confirmed 0 and no discoverable preview. Cookie stays `ready`, the actual application boundary stays current, and the actual Vault/context counts remain13/27. Ordinary close remains a positive control: `ready`, confirmed 1, unrelated queued preview preserved, exact 68-byte read, Vault/context 12/26.

The actual path is ApplicationSession -> retained client cookie/lease/CSRF -> gateway -> SessionVault/CredentialEnvelope -> ClientProvider -> canonical Root Review/check-in handlers. Vault store, authentication, context/RPC and Storage responses are closed synthetic in-memory transcripts. The real media request's AbortSignal supplies the observation point. No operation-port/current/access success substitute or arbitrary live-port guard is installed. All helper imports and write:false bundle inputs bind this review checkout.

Source inspection of [`photos/controller.ts`](../../../apps/portal/src/features/history/photos/controller.ts) confirms retirement now captures old URL/abort/port/memory targets, retires epoch/read/media ownership, clears the public snapshot, then performs captured cleanup. URL revocations precede abort observers. Restriction privately preserves only exact unknown-upload intents. Full context retirement clears old record references, swaps maps and uses a distinct binding memory key; late old cleanup cannot delete new B's same-session map. Disposal/context latches precede external effects. Emission checks context/epoch/state, exceptions are isolated per observer/effect, and stale URL creation cleans its newly created URL instead of installing it.

## Adjacent lifecycle and port audit

The independent ignored `adjacent-lifecycle.test.mjs` executes the same actual-Vault composition and adds six checks:

- Actual descriptor 403 and binary 403 clear queued/confirmed state before URL-revoke observation, while the actual cookie/boundary remain current.
- A media URL created during actual replacement B is revoked; B's new right-photo preview and state remain intact.
- Cancel of an already-committed but held upload publishes unknown/no-preview before the real abort callback, then deliberately replays the exact original bytes, both UUIDs, revision, MIME and angle.
- Actual read-only restriction hides an uncertain upload and cannot retry it; successful active restoration permits the original exact replay.
- Disposal latches before a revoke observer tries load/select/rebind, and a throwing notification does not restore state or cause HTTP dispatch.

Its first run was5/6: the new test incorrectly selected `confirmed[0]`, which correctly remained the preexisting front 901, when checking left 902 after ordinary cancel. This was a reviewer harness indexing error, not a product finding. The initial source and raw failure are preserved. The separately corrected ignored test selects the confirmed **left** identity and passes6/6; all exact-byte/header/callback predicates remain. No original R1/R2/R3 probe was adapted for this correction.

The unchanged supplied 24 cover denial/read-only/expiry/logout/disposal/route retreat, fresh snapshot and cached URL reads at abort, ordinary close, throwing/reentrant subscribers and revoke observers, replacement B, record-map/key cleanup, selection/removal/confirmation and unknown-upload recovery. The prior 62 retain descriptor/binary 401/403, waits through stream/Blob/native validation, current parent-read replacement, active/read-only positives, unrelated IDs, late A versus admitted B, reentrant relevance, bare cancelled/unacknowledged C and exact upload uncertainty. All 86 pass independently with no skips/cancellations.

The complete [`photos/port.ts`](../../../apps/portal/src/features/history/photos/port.ts) is byte-identical to `2742e939`, SHA-256 `1cb62528f36fabcfb66513df5a70ba45db3449ee7eb857869495a6a329940a29`. Its captured basis/generation/ID/order and monotonic `deniedThrough` fence retain RP1/RP2's scoped behavior. True current descriptor/binary authorization 401/403 retires matching older operations before caller continuation; old A cannot erase later B, replacement basis or unrelated ID. Bare C does not suppress a true denial. Local relevance/Blob failures do not manufacture authorization denial.

The entire upload method is byte-identical to `ea672828` and RP2. Full-port equality is stronger than the historical protection-span digest. Own explicitly delimited upload span, from `  async upload(` up to `  async readPhoto(`, hashes `91b3f8a16aabc90d7ab876f0f649af114d1082924d35137cb49b9fea831e54d2`. The earlier author measurement mismatch and original R3 digest remain preserved, without rewriting them to this differently delimited measurement. No upload UUID/body/revision/status custody changes, status/deletion API or all-media-disabled workaround is introduced.

These are synchronous controller snapshot/object-URL and reusable-port custody proofs. They do not establish an ordinary rendered DOM leak or its browser remediation, genuine Storage disclosure, a new read succeeding after backend revocation, or backend authorization bypass. Synthetic raw reservation/completion is not successful actual upload/native Storage acceptance.

## Exact inputs and protected source

Own worktree `/Users/kanuj/.t3/worktrees/shelv/t3-cd119a47`, T3-bound branch `t3/review-report-photos-r3` with this new R4 allocation, started clean at frozen Parent 1bdb. Actual Parent HEAD was resolved at that full SHA before import. Its later advance to the exact one-file type prerequisite is separately recorded; Parent dirty documentation was neither imported nor repaired. Every commit's exact approved path/status manifest and its modified input blobs were checked before its separate ordinary `git cherry-pick -x`. No conflict/manual resolution or reviewer report ancestor was imported.

| Exact original input | Local attributed import |
| --- | --- |
| `39db1a7652d18b061bf557bdcd201d234744a780` | `7bad4d09be5bcafd26ca6c029ebc7b2026fda115` |
| `ea6728287ac73f39af9d92c97267146efdd36e6a` | `4815a2334204645390a8286e5533fb616dd41908` |
| `ed1ffc9738f1cc84573868ba22747860eb3eadc4` | `598dbc1d2ddc5d1e6f00b65bd612432424218cf5` |
| `2742e93984503e6a2bbc577bf5be2b28769d6dea` | `32477b25718c8824016a77cc8d7678b09ac403b2` |
| `da0d3ae093d67b651adb8481da6fe8be16a52cc9` | `3ab93a26f9316433a8eeb7eda02a71bb4923db8a` |

All 20 final candidate blobs/modes equal the author. Before the separately authorized type prerequisite, all 2,064 frozen Parent paths retained exact physical bytes/modes. Finally 2,063 remain exact, with only the explicitly approved `retained.ts` blob/mode exception below. Existing tests, packages/locks/configs, roles, auth/routes/shared runtime and composition remain exact. All five normative original documents match `INPUT_PROVENANCE.json`, including the 95,388-byte original input SHA-256 `c45701f9f54fd2b1dbb09bbd7aa2b9b437e9059aa6032b6f39411fe2e7f6efbd`; D01-D48 and all 26 exact screen references remain normative. Root/portal AGENTS, entry point, full supplied specification/brief, contracts, ownership, current status and acceptance matrix govern.

Frozen Parent has 64 canonical migrations/117 tracked SQL files. All old 62 canonical migrations and 113 tracked SQL paths from `d4125cca52cb21d0c0a79a5733662f782a0dea76` remain blob/mode exact. The four extra preexisting Parent paths are the Notifications migration/test (`20261101191527_portal_rebuild_notifications_v1.sql`, `portal_rebuild_notifications_v1.test.sql`, frozen attribution `cdc196199a4fc620c4119a20b9183a13c9c54899`) and photo-head migration/test (`20261101195359_portal_rebuild_photo_head_v1.sql`, `portal_rebuild_photo_head_v1.sql`, attribution `c0f97e6b9da85ad96fe1b20709ce3a955018bbd4`). None is a W4 candidate addition; no SQL was executed. Exact paths/attribution are in `source-protection.json`.

## Inherited type failure and exact bounded recheck

The raw original strong closure preserves `strict:true`, `noUncheckedIndexedAccess:true`, `verbatimModuleSyntax:true`, `skipLibCheck:false`, actual React/CSS declarations and negative ABI checks. Its two diagnostics are:

```text
src/app/retained.ts(8,26): error TS7016: Could not find a declaration file for module '../../site/auth/advisor-cookie-session.js'.
src/app/retained.ts(9,25): error TS7016: Could not find a declaration file for module '../../site/auth/client-cookie-session.js'.
```

Frozen Parent `482557b47c4e8e61ea6032c8e3b9dc2452b60d38` removed the two per-import `@ts-expect-error` annotations; `retained.ts` otherwise has no runtime change relative to 58. This inherited file is outside the candidate 20. The original 35 functional/build/SSR/CSS checks pass, but the 36th strict test fails, exit 2 internally. Configured frontend fails identically. Parent confirmed that Root's inferred-JavaScript graph passes while standalone portal declarations are absent, and retained sole correction ownership. Both raw failures remain immutable.

Parent then expressly authorized separate input `4e07119b41876b66d2cf5fb42a705ebd669574db`: **only** `apps/portal/src/app/retained.ts`, mode 100644, Git blob `9267598f1acf848668196e20e373cb7403bed1a0`, SHA-256 `146d949005acc395692eca804824c2a67fb0c9bfbe5b0be98d4018f8a265b5a1`. Its exact manifest, predecessor blob and final hash/mode were checked. Erasing precisely the two new import-scoped `@ts-ignore` comment lines yields the frozen file byte-for-byte. Existing runtime imports and the typed structural facade are unchanged. The annotations handle missing standalone JavaScript declarations without unused-expect-error failures in Root's different graph; no copied Auth source, declaration shim, flag, permission or callable behavior changes.

The owned untracked draft report was temporarily preserved under ignored evidence so ordinary `git cherry-pick -x` began and finished with a clean tracked worktree. No conflict occurred. Local attributed prerequisite is `5b50422ac363632c9c09344b3ce2ac3e3c417fb8`; the report was then restored. It is an input ancestor, excluded from delivery. `approved-type-dependency.json` records its exact provenance. All 20 author blobs, whole port/upload, old 62/113 SQL and every other frozen path remain exact; `source-protection-after-type-dependency.json` records the sole exception.

Only the expressly allocated checks were rerun: the unchanged original `rebuild-report-photo-types.test.mjs` passes 1/1 with actual strong closure/negative ABI/compiler exit 0, and unchanged configured frontend exits 0. Strict/noUnchecked/verbatim/skipLibCheck:false and actual declarations are identical. The raw original 35/36 and frontend 2 are **not relabeled green**; no other product test, broad suite, bundle or resource replay followed the dependency import. Their earlier functional source results remain justified by exact annotation erasure, not a claimed fresh final-head execution.

Parent's in-place `dual-graph-types/{commands.json,PROOF.json,main-closure.json}` was read/hashed into `parent-type-proof-index.json`. Its Root/frontend/test type exits 0 and all 15 actual-main output hashes across 2,246 inputs are **Parent-attributed** proof, not an independently rebuilt App here. Parent's separate TypeScript 6 `transpileModule` equality explicitly uses `removeComments:true`; no default-comment-emission equality is claimed. Own independent proof is exact two-comment source erasure plus the two actual bounded type reruns.

## Live runtime and dependency custody

Initial/final live actual self and actual Parent `d632030a-18f7-4dec-a2c9-f5c0418c3fd5` configurations verify `codex/gpt-6.1-sol/reasoningEffort=xhigh/serviceTier=default`. The live selected model descriptor explicitly supports `xhigh` and `default` (catalog defaults low/default). Parent separately forwarded its own initial/final returned configuration/catalog; project saved `defaultModelSelection:null` is recorded separately from actual explicit thread options. All 18 own/Parent project/eight-role configuration files retain identical Sol/xhigh pins and modes. Global model/effort were separately read. Nothing was configured or delegated.

Actual returned task ID, separately forwarded by Parent after the initial gate:

`node:delegated-task:command%3Amcp%3Add730894-0fab-4a94-873d-743422eae122%3Adelegate-task%3Aportal-rebuild-w7-report-photos-source-review-20261101-r4`

Distinct backing thread is `thread:delegated-task:command%3Amcp%3Add730894-0fab-4a94-873d-743422eae122%3Adelegate-task%3Aportal-rebuild-w7-report-photos-source-review-20261101-r4`; backing run is `run:thread:thread%3Adelegated-task%3Acommand%253Amcp%253Add730894-0fab-4a94-873d-743422eae122%253Adelegate-task%253Aportal-rebuild-w7-report-photos-source-review-20261101-r4:ordinal:1`. Neither backing identity nor request suffix was used to infer the task handle. The live durable hierarchy resolved the actual Parent rather than the capability response's caller-labeled parent field.

Explicit Node is `/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node`, v22.23.0, including child commands and ordinary hooks. Actual portal compiler is TypeScript 6.0.3. Dependencies were initially absent. All four own/Parent lock checks matched root `5c57c9aec9e4585066e032e234d610a77cbffd9a51f82700c158fc37fe01b5c2` / portal `bc914f3a9c9f24e44f02e3cff2804651147385ea5abda58a064531329ef23203` before and after.

Authorized APFS `cp -cR` projections used absent ignored own root/portal node_modules only after nonsymlink root/ancestor, same-device, filesystem, and full source-entry bytes/modes/literal-link inventories. Before/after/final parity covers 43,213 root / 9,071 portal entries including roots. The sole outside-node_modules literal workspace link `shelv-advisor-session-candidate -> ../session-integration/runtime` resolves only to this own checkout's frozen tracked runtime, compared to frozen Git rather than Parent generated output/physical drift. Root React 19.2.3 and portal React 19.3.1 remain unchanged. No install/upgrade/foreign executable/shim/closure or flag relaxation. Normal Git hooks were inspected, no active hook, no bypass.

## Commands, raw outcomes and receipts

From own root, `N=/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node`, `E=.local-artifacts/w7-report-photos-r4`. Every test command inherits `NODE_OPTIONS=--import=/absolute/own/E/deny-external.mjs`, including all child Node processes. Global external fetch is denied; only native local blob URL reads are allowed. HTTP dispatchers are closed synthetic functions. `python3 E/run.py <label> <command...>` prints true exit before exclusively writing each unique JSON with exact command/cwd/full stdout/stderr.

| Command after wrapper | Actual independent outcome |
| --- | --- |
| `N --experimental-strip-types --test E/private-media-denial.test.mjs E/private-media-raw.test.mjs` on ea | each control 1/fail 1; total2/4, exit 1 |
| Same runner with `E/same-photo-denial.test.mjs` on ed1 | control 1/fail 1, exit 1 |
| Same runner with `E/controller-abort-observation.test.mjs` on2742 | RELOCATION-ONLY control 1/fail 1, exit 1 |
| All four above probes on final candidate | prior 6/6 plus RP3 relocation-only 2/2, exit 0 |
| Same runner with `E/adjacent-lifecycle.test.mjs` | initial indexing harness5/6 exit 1; corrected6/6 exit 0 |
| Same runner with the new retirement and prior readable-basis/authorization-denial files | new 24 + prior 26+36 = 86/86, exit 0 |
| Same runner with original five files explicitly |35/36, exit 1; strict internal 2, other checks pass |
| `N apps/portal/tests/rebuild-report-photo-verify.mjs frontend session ui retained` | frontend 2; session 0; UI 0; History 105/105; ledger exit 1 |
| After exact type prerequisite: `N --experimental-strip-types --test apps/portal/tests/rebuild-report-photo-types.test.mjs` | 1/1; strict compiler 0; exit0 |
| After exact type prerequisite: `N apps/portal/tests/rebuild-report-photo-verify.mjs frontend` | frontend0; ledger exit0 |

All executed test groups have zero skips/cancellations. The original five are `rebuild-report-photo.test.mjs`, `rebuild-report-photo-controller.test.mjs`, `rebuild-report-photo-root.test.mjs`, `rebuild-report-photo-types.test.mjs` and `rebuild-report-photo-ui.test.mjs`. Source `write:false` builds and Node shared-control SSR pass inside the raw 35; they are not DOM/browser/native feature acceptance. Historical failed setup/RED/intermediate cutoff/protection-measurement attempts remain distinct. A top-level in-place index hashes 233 prior JSON records/58,283,162 bytes; no massive or nested review archive was copied. Only executed probes/helpers and task-specific raw records are copied or authored here.

Key immutable own receipts, relative to E:

- `r1-old-retained-20261102T001121-aad5faff-2855-40f3-94cb-016d92d6e1b1.json`, exit 1, SHA-256 `964ab222c6a35813dd1d76025ee1d09c98c0b8b41d48056bb89b1e001709e5d4`.
- `r2-old-same-photo-20261102T001126-d53056ef-d1df-459a-ba59-36741dea7755.json`, exit 1, SHA-256 `0bcf57181b255654b9bc6a80335d91eeb0cf2b409c690cc9a01d10a3efb29d8c`.
- `r3-relocation-only-old-20261102T001130-9ead2b4b-a82b-4f2b-a73a-b11e21eaec71.json`, exit 1, SHA-256 `0eca1de35614476d464df5c482fe552efe790ede46a9fea8684df8b86bf115d5`.
- `prior-probes-current-20261102T001135-c55d98f5-fa86-4cf3-b23e-ad7a6ca55ff7.json`, exit 0, SHA-256 `adf982eb97c5a78453af16c6ce2c75d6da68cefd1c30357a2b04d8ece8145401`.
- `independent-adjacent-corrected-20261102T001332-7f9c1867-b7ba-43f5-a866-3b0288f069f2.json`, exit 0, SHA-256 `d61bc2871eb4171941ce7f1afeccf09559aeff4dc6510892961cc2246d9fcebd`.
- `author-new24-prior62-20261102T001333-88ae564e-3c4a-452c-9244-45b46fe32cf4.json`, exit 0, SHA-256 `1d55f2f257011e28881ee41fe4ff836b9b76740516b43b5738f7380011488812`.
- `original36-20261102T001342-5ad63499-12cb-4eb4-b55e-83cf10bde997.json`, exit 1, SHA-256 `fff2822cfbe9d455d7c89cd25acfdae88baa9ad254256795a721b8e1b3f7a8b4`.
- `configured-controls-20261102T001406-c4609b92-1079-4fdb-96f7-2e828e9b6d19.json`, exit 1, SHA-256 `5f66747f246bc87743c88a2bccfffb2a9f3bb0341ca5f9a67735aec095de4b57`.
- `dependency-final-20261102T001515-cdf28725-20f3-426a-ad89-e6fd2460a3ae.json`, exit 0, SHA-256 `d5c04ea0eb550e47a89df784225e910ab12f2ad5095bda80939a1a341fecfa46`.

- `approved-dependency-strong-only-20261102T002053-90a27073-eadc-4ceb-9d02-4015e7af956e.json`, exit 0, SHA-256 `e520968f9125b2b04e31e94f55d35a3d8b6092f38e72321c05dac848f6a9b8ba`.
- `approved-dependency-frontend-only-20261102T002101-2c4b6e9d-01d6-46af-88cf-04db5d58020c.json`, exit 0, SHA-256 `ba62a302c152480c51cd0db870764af549fe1471485aa5fcbacc7f024076e216`.

The exact import logs, `initial-gate.json`, `final-live.json`, `final-after-dependency-live.json`, `original-reports.json`, `original-executed-source-hashes.json`, `relocation-only-proof.json`, dependency manifests, `candidate-blobs.json`, `source-protection.json`, `approved-provenance.json`, `configuration-file-protection.json`, `approved-type-dependency.json`, `source-protection-after-type-dependency.json`, `parent-type-proof-index.json`, `parent-forwarded-gates.json`, `parent-approved-type-allocation.json`, `historical-evidence-index.json` and `results-index.json` retain the other provenance. Supplied runners also write own ignored `.local-artifacts/portal-rebuild/w4-report-photos/` strict/frontend/session/UI/retained logs. Report links, sole authored tracked path and `git diff --check` are checked before commit. The terminal receipt records the full report-only commit separately from all five candidate input ancestors and the one type prerequisite. Parent imports **only the new report commit**.

No C05/C07/App mount, compatible feature-head update, ordinary UI/browser/camera/DOM/visual/accessibility, actual upload/deletion, genuine Auth/Vault/Storage/SQL/persistence, hosted/CI/release or full D01-D48/26-screen acceptance is given. No browser/preview/server/listener/process inventory, Docker/PG/SQL/SQLite/native fixture, actual Auth/Storage/provider service, credentials, blocked Guidance/M65 retry/rephrase/reroute, nested delegation, hardware/program prerequisite, push/PR/merge/deploy, real-client publication/communication, money/order/fulfillment or production-permission action occurred.
