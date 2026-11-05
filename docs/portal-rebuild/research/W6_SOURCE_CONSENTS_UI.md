# W6 Account Source consent UI source slice

Owner: Kanuj. **Feature completion: INCOMPLETE.** This is an unmounted presentation slice over the independently reviewed Root Account model. It has no trusted Source producer, authenticated reader, controller, request factory, RPC, original-command journal, persistence or successful withdrawal. Parent must commission a NEW independent review before composition. No independent specification/completeness or quality verdict is supplied by this author report. The full approved portal goal remains active.

## Exact allocation and live gates

- Frozen starting Parent: `3bd152a259b7b9b9971caa1546e65f69de12aab9`, with code58+4e and later coordination documentation distinguished. No later Parent implementation is imported.
- T3-owned workspace `/Users/kanuj/.t3/worktrees/shelv/t3-6b348f32`, branch `t3/source-consents-ui-slice`, initially clean.
- Actual separately forwarded taskId: `node:delegated-task:command%3Amcp%3Add730894-0fab-4a94-873d-743422eae122%3Adelegate-task%3Aportal-rebuild-w6-source-consents-ui-source-20261101-r1`.
- Distinct actual childThreadId: `thread:delegated-task:command%3Amcp%3Add730894-0fab-4a94-873d-743422eae122%3Adelegate-task%3Aportal-rebuild-w6-source-consents-ui-source-20261101-r1`.
- Distinct childRunId: `run:thread:thread%3Adelegated-task%3Acommand%253Amcp%253Add730894-0fab-4a94-873d-743422eae122%253Adelegate-task%253Aportal-rebuild-w6-source-consents-ui-source-20261101-r1:ordinal:1`, requested2026-11-02T01:38:59.119Z, started01:39:35.778Z. Own live thread metadata independently confirms the workspace, run and actual Parent `d632030a-18f7-4dec-a2c9-f5c0418c3fd5`. The catalog field named parentThreadId instead identifies the delegated backing thread; it is not used to infer Root Parent or taskId.
- Before implementation, actual self AND actual Parent configuration plus live catalog establish `codex/gpt-6.1-sol/reasoningEffort=xhigh/serviceTier=default`, full-access/default interaction. Supported efforts include xhigh and tiers include default. Catalog default effortlow differs from selectedxhigh.
- Registered project `ac0af19d-d404-4f53-a870-02bfd76c2a80`, root `/Users/kanuj/Documents/projects/shelv`, fresh saved `defaultModelSelection:null`. Null is distinct from explicit runtime selection.
- Own AND Parent `.codex/config.toml` and all8 named role TOMLs are read and hash-equal: project SHA256 `927e3dd532c0daabbb975f6879866aa99cbc12d3f20d080b0568867e37ee66ff`; each role `a1f57cf26da8626380cbaa101ca04dc39a92e4bd6aa6acb6cd9f5f24a05d9feb`. Sol/xhigh/default-subagent/max8 stay unchanged. No nesting or model/configuration change.
- Explicit executable `/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node` returns `v22.23.0`; every behavioral/compiler process uses it. No resource grant follows these control-plane reads.

Initial gate and API proposals were sent to Parent before source/export implementation. Actual returned taskId was supplied separately, without inference. The latest explicit allocation authorizes this independent UI while actual producer pins remain open; the settled workflow is not reopened.

## Required context and unchanged Root model

Read root/portal AGENTS, rebuild README/D01-D48/full desktop specification/implementation contracts/workstreams/current status/current [decision addenda](../DECISION_ADDENDA.md), the FULL95388-byte [original input](../source/APPROVED_INPUT.txt), full [W6 Account contract response](W6_SOURCE_ACCOUNT_CONTRACTS.md), and FULL [Account R1](W7_SOURCE_ACCOUNT_CONTRACTS_R1.md), [R2](W7_SOURCE_ACCOUNT_CONTRACTS_R2.md), [R3](W7_SOURCE_ACCOUNT_CONTRACTS_R3.md), [R4](W7_SOURCE_ACCOUNT_CONTRACTS_R4.md), [R5](W7_SOURCE_ACCOUNT_CONTRACTS_R5.md). Bounded reads recovered the ranges omitted by truncated displays.

The original106048-byte W6 feature allocation is read in place at `t3-5bfd5242/.local-artifacts/portal-rebuild/w6-source-account-contracts/sac1/original-allocation.txt`, SHA256 `ea5c4cc828b2a38b013d1804db4cde22cb1b6ab92b7d876cb7a30d338475751c`. It contains the entire95388-byte approved input exactly once, SHA256 `c45701f9f54fd2b1dbb09bbd7aa2b9b437e9059aa6032b6f39411fe2e7f6efbd`. Its remaining10660 bytes are separately displayed after the already-read approved appendix is omitted only from that repeated display.

Historical R1-R4 FAILs, SAC1-SAC4, raw old-schema23=6/17 and R1five4/1, raw partial-fixture52/53 and48/53, ignored/adapted/current distinctions and the R5 scoped MODEL PASS remain attributed historical evidence. None is relabeled UI, Source authority or genuine proof. The complete prior R5 evidence home is hashed **in place**,4530 files/75876716 bytes. No nested recursive archive copy or foreign runner execution occurs. `prior-r5-archive-in-place.json` binds every original path/mode/hash.

All four Root modules stay unchanged, mode100644:

| Root file | Frozen Git blob | SHA256 |
| --- | --- | --- |
| PortalSourceAccount.ts |7c7c94be4e71a0c30dd784168f0daaf3b2a0549c|56e796ac7112d48c13d20aaa4cde90e1ab4e60f6f9b54e39bdfa480bd23d2863|
| PortalSourceAccountValues.ts |72920cb97ad0a23fad92876e7fe43517eb6319c2|0004bd22d76a5c68e8acad9eca7529bd9e5c6bfa38f209cda384b92cfa09eecf|
| PortalSourceAccountValidation.ts |cadef494ce15a9cd84c94a225b6a22d428946a9b|7747c0d558f96371884eae7de319cbe3c2088726c7f8e04e7c28ca2d4d1d9f66|
| PortalSourceAccountMapping.ts |a83e89939542fcf3320230658e5bfed348ddc203|4ddf7ad02f6efcaea624d49e95b6d99ac83f06134c736c4c7038a8f773b78427|

Source15 task0/no raw client access remains unchanged. No Root DTO/action/right, auth/session, shared transport, App/account shell/sidebar, package/config/lock or SQL edit is authorized or made.

## Owned API and behavior

New [types](../../../apps/portal/src/features/account/source-consents/types.ts), [model](../../../apps/portal/src/features/account/source-consents/model.ts), [section/form](../../../apps/portal/src/features/account/source-consents/SourceConsents.tsx), [barrel](../../../apps/portal/src/features/account/source-consents/index.ts) and [CSS](../../../apps/portal/src/features/account/source-consents/source-consents.css) form the entire production claim.

`createSourceConsentsModel(input)` owns synchronous, session-memory presentation only. Its model API and detached snapshots are frozen. `getSnapshot` is stable until an explicit local change; `subscribe`, `replace`, `reviewWithdrawal`, `cancelReview`, `confirmWithdrawal`, `checkOriginalResult`, `retryOriginal`, `refresh` and `dispose` make no autonomous calls. Default presentation is backend-unavailable/read-only. A callback supplies no Source authority: its absence only denies that local affordance, with a visible plain reason. Present callbacks are local UX seams for a future independently authorized controller.

Read input is explicitly unknown, unavailable, or a supplied exact Root page/unavailable DTO. Actual Root `readSourceAccountPage` detaches and validates loaded data; rejected/private-field supersets become unavailable. A complete actual supplied empty page remains distinct from unread/unavailable. Partial pages retain their numeric offset/total and show that other records are outside the page. No full query, collector completion or missing-history inference is fabricated. This slice does not independently authenticate or bind a page to a live session; that missing trusted producer is a composition gate.

Rows are grouped only by exact safe consent group alias, with separate storage and service-review purpose headings. Displayed group numbers are local presentation ordinals, not source/draft names, lineage, persistent labels or ordering evidence. UUID pagination is not causal order. Recorded confirmation/withdrawal, effective superseded/withdrawn/not-withdrawn and later portal withdrawal are neutral **recorded status**, never permission or operational readiness. Recorder/client/consent/group UUID fields and disclosure hashes are not rendered. Raw-source/draft/evidence/credential/URL fields are unsupported and rejected rather than hidden. Producing a genuinely safe disclosure, including excluding private content embedded in its text, remains the trusted producer's responsibility; this renderer cannot certify plaintext by its syntax.

Disclosure text/version come directly from the parsed DTO, including BOM/CRLF/decomposition. React escapes text; it is not HTML, normalized copy or invented legal wording. All supplied fixtures say SYNTHETIC and that they are not approved disclosure. Known occurrence and recorded times remain separate, with explicit unknown occurrence and clearly labeled Chicago display time. No date is inferred from the browser clock or another event.

A review captures the exact loaded consent id/group/purpose/disclosure ref, exact disclosure text and snapshot revision/hash. Confirmation consumes that exact frozen review before observer notification and rechecks its owner afterward. Replacement, cancellation, read-only presentation, disposal and reentrant notification retire stale selections. A second submission cannot emit the same local intent again. Callback exceptions are finite/unavailable and disclose no thrown content. The emitted `SourceConsentWithdrawalIntent` has no request UUID, command hash, client selector, receipt or successful outcome. It does not change the displayed effective consent. The future controller must create/retain the exact original command in the actual journal before dispatch.

Recovery accepts a future retained original Root withdrawal/hash and only noncommitted Root status variants. Actual Root mapping checks original UUID/client binding and parses the hash; these declarations are not actual journal/authority proof. Unknown, absent, unavailable and purged remain distinct. Check/retry callbacks emit only the retained original identifier/command; retry is locally unavailable unless a supplied matching status is absent and presentation allows review. Purged/unavailable never become absence or a fresh UUID. No committed receipt/success input or withdrawal-success view exists in this slice. The actual journal and all wire effects remain absent.

## C08 and task-first UX

The retained [C08 context](../design/C08-498-399.context.txt) and [1440x960 baseline](../design/C08-498-399.png) are read/visually inspected. The source-material panel uses its744px/24px/12px geometry and existing semantic typography/spacing/color tokens. It composes the actual shared Button/Badge/StatusNotice/Dialog, the real OverlayProvider lifecycle and the existing native form/submit pattern. No parallel controls, icons, field system or dialog lifecycle is created. The separately exported production `SourceConsentReviewForm` is the actual shared Dialog body, and renders nothing for a stale review.

| Step | Immediate task | State/action | Feedback/recovery |
| --- | --- | --- | --- |
| Read | Find recorded purposes | Unknown/unavailable/loaded page | Honest state; disabled refresh and reason when no adapter |
| Review | Understand exact confirmation | Separate purposes, versioned text, occurrence/recorded time | Neutral recorded status; no raw-source access |
| Select | Review one current recorded allow | Review withdrawal | Exact tuple/text/snapshot captured; withdrawn/superseded/read-only/unavailable controls denied |
| Confirm/cancel | Deliberate local intent | Native form submit or cancel in shared Dialog | Consumed CAS owner; no claimed withdrawal, receipt or deletion |
| Recover | Resolve an original request | Check original result/retry original | Unknown/absent/unavailable/purged distinct; absent callbacks denied with plain reason |

| Priority | Persona/task | Inspected issue or limit | Smallest correction | Regression/evidence |
| --- | --- | --- | --- | --- |
| P1 | Client reading consent | Missing producer could be mistaken for no consent | Default unavailable, complete-empty only from actual Root-shaped page | source/SSR tests; no live query claim |
| P1 | Client recovery | NUI1 lesson: available-looking inert controls | Disabled controls plus explicit reason when callback unavailable | SSR disabled/native declarations and local callbacks only |
| P1 | Client confirming | Replacement/reentry could act on stale disclosure | Frozen exact review identity; consume before callback; recheck after notification | pure model and real form callback cases |
| Held | Client comprehension/keyboard | No browser, human or integrated Account run is granted | Preserve declarative controls and actual shared lifecycle | Browser focus/Tab/Enter/Escape/Back/zoom/320/390/1440 and visual comparison remain unrun |

Copy serves task/status/recovery only: purpose labels identify the decision; date labels preserve provenance; local status distinguishes uncertainty; disabled reasons explain unavailable actions. No new retention, recall, raw-copy, deletion, training, legal or service promise is displayed. Exact final disclosure wording is still unapproved.

## Test-first and actual evidence

Ignored home: `.local-artifacts/portal-rebuild/w6-source-consents-ui/`. Raw logs have unique names, actual exits and SHA256 receipts. No original predicate or Root test is modified.

| Executed stage | Actual result |
| --- | --- |
| Untouched Root baseline, BEFORE new implementation |74/74,0 fail/skip/cancel, exit0 |
| Initial source load and wrong-relative-import scaffold attempt |Exit1 setup failures, kept separately; not behavioral RED |
| Corrected executable presentation scaffold, original new13 |2 pass/11 fail, exit1; missing review/immutability/recovery/retirement behavior |
| Same new13 after implementation |13/13, exit0 |
| Executable shared-wrapper SSR scaffold |2 pass/6 assertion failures, exit1; all8 load and execute |
| Same SSR8 after implementation |8/8, exit0 |
| Adjacent source19 before freezing model API |18 pass/1 meaningful immutability failure, exit1 |
| Same source19 after model freeze |19/19,0 fail/skip/cancel, exit0 |
| Expanded SSR10 first run |9/10, exit1; one NEW assertion mistakenly rejected Lucide SVG's standard http namespace |
| Expanded SSR10 after NEW test-only namespace qualification |10/10,0 fail/skip/cancel, exit0; actual private-URL canary remains rejected |
| Actual TypeScript6.0.3 strict source closure |146 files/19 Root contracts,0 diagnostics, exit0 |
| Actual strict typed API + SSR entry closure |151 files/19 Root contracts,0 diagnostics, exit0 |
| Configured frontend/session and UI guard |All exit0; existing configurations unchanged |

The13 are a subset of19; SSR8 is a subset of10. Current new verification is19 source +10 SSR registrations, with Root74 separate. These are not independent Source permission tests. Positive and negative fixtures are actual Root-validator accepted/rejected pure data. Local callback counters prove UX ownership only, not withdrawal persistence, live identity or wire authorization.

SSR covers exact escaped plaintext,4000-scalar long disclosure, unknown dates, safe identifiers excluded, group/purpose/supersession/manual/portal records, actual-page versus complete-empty, stale forms and read-only presentation. The actual native form submit handler is invoked without pretending a DOM journey. Global fetch/storage/randomUUID/render intent traps observe0 calls during construction/repeated shared-wrapper rendering. Browser-target and SSR esbuild builds use actual shared UI/Root codecs with `write:false`; no transport/Auth/Source15 implementation enters that feature closure.

All strict source/type calls use the OWN cloned real TypeScript6.0.3 and unchanged `--strict --noUncheckedIndexedAccess --verbatimModuleSyntax --skipLibCheck false --allowImportingTsExtensions --target es2022 --module esnext --moduleResolution bundler --lib ES2022,DOM,DOM.Iterable --jsx react-jsx`, actual React declarations and the existing CSS declaration. No install, foreign executable, shim, copied Auth/type declaration, dedupe or flag relaxation occurs. Configured-session success uses its retained configuration; it is not a zero-diagnostic claim for the separate all-Worker strong graph. The existing44 Worker errors are not claimed fixed or reclassified.

Own commands/argv/cwd/true exits/full log hashes are recorded by `run.mjs` and `checks.mjs`. Behavioral commands use explicit Node22.23.0 and an own `--import` global-fetch-denial guard BEFORE imports. The SSR harness writes no generated bundle; per-run executed-input byte/mode hashes and output digests are preserved with `write:false` build metadata. Early build metadata used rolling latest filenames; original RED logs/actual exits remain immutable, but no historical RED build-manifest preservation claim is made. Current named per-run manifests use exclusive creation.

Setup qualifications remain explicit. The first new escaping fixture used complete HTML tags which the actual Root plaintext codec rejects; ONLY that new input changes to accepted literal less-than/quotes/ampersand, with BOM/CRLF/decomposition retained. The corrected scaffold still produces13=2/11, including the intended deep-freeze failure. Its original source and raw log remain preserved. The later NEW raw-field HTML check initially matched Lucide's xmlns URL; only its new URL predicate narrows to the actual private fixture host. No production code or old test changes for that qualification. Initial optional absent account/tsconfig/test paths, truncated read displays and one `t3_worktree_status` transport failure stay in the original tool transcript; none is a product result. Existing MODULE_TYPELESS_PACKAGE_JSON warnings remain unsuppressed.

## Dependency and protected-file custody

Before either clone, both own dependency destinations are absent/ignored, actual own/Parent root+portal physical lock hashes match, the runtime lock also matches, all roots/ancestors are nonsymlinks/same-device, and full source bytes/modes/literal-link inventories are captured. Only `/bin/cp -cRp` APFS clones Parent's installed root/portal dependencies into own physical ignored directories. Full source-before/source-after/own parity completes BEFORE probes/compilers:43213 root entries/42 links and9071 portal entries/11 links, including directory roots. The literal `shelv-advisor-session-candidate -> ../session-integration/runtime` resolves only to own frozen runtime, without Parent/generated output adoption. No foreign dependency executable runs.

`base-ledger.json` preserves all2068 starting tracked paths/modes, including64 canonical migrations/all117 SQL, every approved original, Root DTOs, old tests, configuration, packages, locks, auth/session/runtime/App/shared UI and counterpart work. Final preservation/links/whitespace and exact owned-file checks precede commits. Delivery is ordinary owned source/test/report commits only, with no input ancestor import. Parent owns CURRENT_STATUS/CONTEXT_SYNC and any later composition.

## Explicit remaining gates

Actual authenticated own-client Source/Account producer and trusted aliases/meaningful labels/lineage/query/snapshot, final approved versioned disclosure/hash/text, server recorder/time, current-rights and deletion/lease checks, original cross-family journal/CAS/status, durable withdrawal plus affected operations/grants/handles/pending-private-return retirement, physical cleanup/retention/obligations and actual Account integration remain unimplemented. A possible Root page or correct local intent supplies none of them. No model flag can replace them.

The settled assisted-confirmation workflow and D39 remain unchanged: never-started material uses authorized manual deletion with no abandonment timer; started material uses actual confirmedEND+12 calendar months and proven obligations. Withdrawal is neither recall nor an immediate purge/raw-export/account-deletion/training/transcription/model-transmission right. Static final public plan export is a separate lane. No new Source15 task/client action or raw access is introduced.

Unrun/prohibited: native/SQL/DB/Auth/Storage/credentials/provider/browser/preview/OS/process/fixture resources; live consent/source/withdrawal/deletion/communication/funds actions; blocked Guidance/M65 resubmission; full Root/application npm/test-tsconfig/Expo/mobile/hosted/genuine/human/CI/release acceptance; nesting, push/PR/merge/deploy. No hardware key or program-enrollment prerequisite is introduced. All source/SSR claims above remain distinct from genuine and release evidence. This report does not complete C08, Account or the approved rebuild.

## Final source handoff verification

Fresh final commands use the same explicit Node and preserved Root/compiler settings:

```sh
/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node .local-artifacts/portal-rebuild/w6-source-consents-ui/run.mjs final-source source
/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node .local-artifacts/portal-rebuild/w6-source-consents-ui/run.mjs final-ssr ssr
/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node .local-artifacts/portal-rebuild/w6-source-consents-ui/checks.mjs final
/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node .local-artifacts/portal-rebuild/w6-source-consents-ui/final-preserve.mjs
/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node .local-artifacts/portal-rebuild/w6-source-consents-ui/audit.mjs final
git diff --check
git diff --cached --check
```

Final source19/19,132.200417ms, exit0, log SHA256 `fb0e3d672c93982f3deeecabf7a4b7646e0c5709b4b06f32a6c6161db1620e29`. Final SSR10/10,867.29475ms, exit0, log SHA256 `91e0f95e503334e0b9004b290dee9de41da391f7e7762d296a9c247fb44f8c76`. Both have0 failures/skips/cancels. Actual strong source146/type151 closures have19 Root contracts and0 diagnostics; configured frontend/session/UI checks also exit0 under their unchanged configurations. `final-ssr-ssr-metafile.json` and `final-ssr-feature-metafile.json` bind the executed build inputs/modes and output digests. No emitted output is adopted as source.

Final full dependency parity again covers43213/9071 entries; all locks match. The own literal runtime workspace link resolves only to91 exact frozen tracked runtime files, with no generated/foreign output. All4530 prior R5 archived files remain byte/mode exact in place, and every actual source/type closure hash is rechecked. Fresh actual self AND actual Parent configurations/catalog remain codex/Sol/xhigh/default; saved project default remains null. Final project metadata supplies repository identity where the initial read returned null; actual Git/workspace/source pins remain independent and no setting is forced. All18 own/Parent configuration/role readbacks retain their original hashes. Runtime/pin/preservation receipts are in the ignored home.

Final production inputs, all mode100644:

| File under source-consents/ | Bytes | Git blob | SHA256 |
| --- | --- | --- | --- |
| types.ts |3463|a5dba85b9086c4b75017b5c62956bfc97d3dc05b|a7da806090374595e1d765e49457bd973058b9617e059773063e4c995e7c7b90|
| model.ts |8742|9e5041b31713d5e206583f8a255e272b2faf2fba|20979b695bb36363f6db49cd34d4925b08d9a3ce17b40be5fa9bc33d3b40b8c5|
| SourceConsents.tsx |7039|65f468e733612de54c4bcf02724d7712ec6bcb94|5fcaff7c4f487a9e16e3477c9d0b9e3875a6442a9ac2c1e3c4badf97350629a4|
| index.ts |396|9ec51fe933285c4c478603bd1e1d47a83440870f|75d7965080844d75fdcfd1a4657022c6f43bc59a7d9585c8596bebd358e28c67|
| source-consents.css |1878|30f6e499c29e2bb382a451a0f013b9c2d31503f0|c1b45e2749a050d453abf999eee2222129c10dca18d6d238f4db33d5f90212df|

`final-source-inputs.json` additionally binds all5 new test/fixture inputs by complete path/bytes/mode/blob/SHA256. All2068 protected originals,64 migrations/117 SQL and actual Root DTOs stay exact. There are exactly11 allocated additions. Report links, no-em-dash, source/build-input correspondence and ordinary/staged whitespace checks precede the ordinary owned commit. The containing commit/report hash/clean-tree receipt are returned separately to avoid self-reference. No input ancestors, composition, independent acceptance or resource continuation is included in delivery.
