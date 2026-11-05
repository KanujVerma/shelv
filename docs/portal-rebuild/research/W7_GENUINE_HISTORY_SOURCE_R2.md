# W7 genuine history Source R2

SPEC/source completeness: **PASS, scoped to the four observation assets**. Source correctness/quality: **PASS within that scope**. Complete independent review of candidate `2b50d7e83f58bf57723cf828d362c84e473a299f` against frozen actual Root `72edabab3afe2532580da4a4069dea1edbd1b952` found no new material finding. HG1 and HG2 close at the SOURCE/finite-control level. These gates were sent to Parent before this report was written. No reviewer correction or successor retest occurred.

Owner: Kanuj. Date: 3 November 2026. This is neither M05 acceptance nor whole C04, 26-screen, D01-D48, 10-journey, integration, CI or release acceptance. Aggregate connected/verified/journey counts were **not measured**. M01 actual independent acceptance is running, not assumed passed. Guidance/M65/provider-photo/private-photo holds remain held without fallback or rerouting.

## Exact identity and custody

Parent: `<t3-thread://v2/3b335212-744e-4ce9-befe-80a8e38dd448/9b085ada-435f-48d6-8886-957c1ce3e82d>`.

Literal actual taskId, separately forwarded by Parent and recorded without deriving it from thread/run metadata:

```text
node:delegated-task:command%3Amcp%3Aa56eb6fa-1435-4927-8890-15373d05f366%3Adelegate-task%3Amilestone-20261103-history-assets-review-r2
```

- Reviewer: `/Users/kanuj/.t3/worktrees/shelv/t3-963e154f`, initially clean HEAD `772c4fae7904e39a9e793627023adf56de811d8e`. Its prepared INPUT ancestry was never used as executable Root.
- Author: `/Users/kanuj/.t3/worktrees/shelv/t3-8b0c20b0`, verified clean at exact candidate, directly atop `a3bbafd3b076380f33d95c08af3f1de56c4ab75c`. Candidate input came from Git postimages, never execution of the foreign checkout.
- Self and Parent actual `t3_thread_configure` READs, with `modelSelection` omitted, returned `instanceId=codex`, `model=gpt-6.1-sol`, `reasoningEffort=xhigh`, `serviceTier=default`. Explicit `/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node --version` returned `v22.23.0`.
- Root HEAD and logical `git ls-files --stage -z` SHA-256 independently match the supplied pins: `72edabab3afe2532580da4a4069dea1edbd1b952` and `18d4bd23d544baa922f7d618d82ce66544bc549587dcdad2ea10bcf86b9562fa`. Initial Root status contains only old untracked `docs/handoffs/2026-11-02-portal-rebuild.md`; tracked/staged diffs are empty. Optional Git locks were disabled.
- Saved Coordinator `ROOT_72ED_SOURCE_TARGET.json` independently hashes to `ececb80b7f2087af270b98ba0e0d471ac6f351579ad3ca549ef2ce63cd1a0293`. Its 2,349-entry manifest retains filesystem pin `66a06a55b135b377823a9b82ab819007f630cba3a4593100ab31742f5bcdc6de`. Product-code `d4eb83de` and 68-migration ledger `77ccff3337064baa8b7c1c0140023068f76d6588d213b0892b444a8dd72a498a` remain supplied provenance. No fresh all-file/resource scan or ledger replay is claimed. Logical index evidence is separate from raw index metadata.

| Exact candidate postimage | Git blob | SHA-256 |
| --- | --- | --- |
| `apps/portal/tests/genuine/client-history.browser.mjs` | `f4553f16a8e7ed27cd27419d62ffa2d9a4975dbc` | `f1c9fd837d1388cf33525cf5fe4798dd0fa79de27cac1959285386689ffd5599` |
| `apps/portal/tests/genuine/client-history-oracle.test.mjs` | `ece85d74d5580486b9650cc8b71b4f63a69bf6aa` | `a0c9d09784740ffaa9c72b256386199055026e0a1ea8eb46d9c645997e35f00f` |
| `apps/portal/tests/genuine/client-history-observation.sql` | `6ade6e11c38eb4b8d0906871729d8a912d6c633a` | `467093bc482779cad587cc04437081acb7579238ff0439640e5632c2420bbfe8` |
| `docs/portal-rebuild/research/W4_GENUINE_HISTORY_MILESTONE.md` | `737cb583c7302b665202c8619f3fb8f0fd0bb429` | `99f16604091936ecfa344fbedb88ff31b32888528cd950a8b023c5e18ddaec0a` |

The SQL and milestone report are byte-identical to a3bb. The original 58-test file is an exact 16,521-byte prefix of CURRENT. The only additional executable product source materialized is the expressly allowed pure `apps/portal/site/auth/portal-routes.js` from Root72ed, blob `530a54caa08a46e75a2fc5bfd2f5fa3644387422`, SHA-256 `2b9faceb7ccc5e700f68b6f6fffc79b5928004050273b88cd5b04dde884645c3`. Its bytes match author candidate and actual Root's tracked file. It imports no runtime/SDK. The test's `../../site/auth` import resolves to that owned copy.

The complete [R1 report](/Users/kanuj/.t3/worktrees/shelv/t3-32fe1180/docs/portal-rebuild/research/W7_GENUINE_HISTORY_SOURCE_R1.md) was read from its explicitly supplied foreign path and verified SHA-256 `2f8d14ec27c15260e67fe6cd061cf6ebbf7abe52c1b7ead191c85d36d4d4b177`.

## R1 finding closure

**HG1:** browser lines 191-193 require exact `page unavailable` only for the fixed numeric `-1`. Positive absent candidates, zero, decimal and unsafe literal still require exact `plan version unavailable`. Root grammar rejects `-1`; `bootstrap.ts:33` selects no authenticated audience for that null route and `Application.tsx:77-84` renders the public unavailable title. Valid history-version route shapes reach `ClientHistory.tsx:30-45`, whose numeric-invalid branch renders plan-version unavailable. Genuine positive absence still requires SQL absence and a selected-version 403/404 at browser lines 110-112. Every negative retains `privatePlanCount===0`. There is no broad either-title allowance or route relaxation.

**HG2:** browser line 150 selects initial `scenario.current.version`, or actual `newPublication.version` in the later phase. Lines 175-186 create exact older/current opener locators and load pages while either is missing, with the retained 100-page bound, actual read wait, click and enabled-control wait. The helper precedes all three initial/Back/nativeBack list checkpoints at lines 186, 188 and 190. Equal initial older/current references remain valid. Root History requests `limit:40`; canonical SQL orders `at,id,kind` ascending. A later-page current publication now keeps the predicate true. The comparator still requires both versions and canonical current-head binding.

The three appended tests execute the actual pure shared grammar, the extracted pagination Boolean using visibility data, and source checks at all three capture boundaries. They create no successful Page/API/authority transcript. Independent reviewer controls additionally cover current-versus-new selection, both visibility asymmetries, equal initial versions, exact original-test prefix, unchanged guards, exports/imports and SQL byte expressions.

## Complete four-asset review

All four candidate files were read in full, including the unmodified milestone's original/scaffold/null/scan-stop raw results. The approved [decisions](../APPROVED_DECISIONS.md), [desktop specification](../APPROVED_DESKTOP_SPEC.md), [contracts](../IMPLEMENTATION_CONTRACTS.md), workstream registry and status were consulted. D10/D14/D32/D38/D40/D46/D48 and C04's historical-version secondary flow govern this slice. Historical Root004c references inside the unchanged author report describe that author's earlier source inspection, not a current execution packet.

- ABI remains exactly `validateHistoryInputs`, `observeClientHistory`, `compareHistoryObservations`; results remain `OBSERVATIONS_ONLY`. Public descriptor v1 is unchanged. Validation creates no Auth, custody, source-currentness or approval authority. M04 version/receipt/event/marker inputs still require actual provenance; initial older/current may coincide, while a later receipt must be newer. Unknown B remains explicitly pending.
- The SQL is a repeatable-read READ ONLY transaction plus rollback over only canonical A/B cases, requested publications, documents and receipts. Absence returns null-content rows. Document receipt joins use receipt ID plus owner/version, matching Root's actual publication schema and generated result. UTC PostgreSQL JSONB text is hashed as raw UTF-8; browser wire hashes remain separate. JavaScript sorting compares semantic document content only. No SQL syntax/engine result is inferred from text assertions.
- Comparison requires owner/version/receipt/event, canonical heads, raw snapshot/document hashes, immutable before/after bytes, matching selected V3 content and actual own-public-list reads. Invalid positive versions require both canonical absence and genuine denials. It excludes private timeline kinds. Current reported use/instruction heads are not falsely frozen with publication content.
- Actual Root composition selects V3 Review and History through the existing retained cookie channel. Historical rendering uses shared ClientPlan with the actual opener, historical label and Back control. Root source relationships were inspected as public tracked text, never imported or instantiated. Relevant grammar, bootstrap, Application, client-state, Review request, History controller and publication/review SQL match author source. V3 failures stay errors; the observer supplies no fallback around Guidance/readGuidance/M65/provider-photo refusal.
- Network observation stays on the same-origin fixed `/api/client/reviews` path. Closed read commands reject unknown operations/selectors; actual command/body exceptions, status and wire hash remain recorded. Missing real helper functions refuse before attachment/navigation. Exact `{observations,errors}` envelopes, nonempty observations, exactly one canonical SQL object, and privateScan-first short-circuit remain intact. Deadlines report unjoined caller operations; they do not establish real handle cleanup. Source/owner/session provenance must still be established outside these shapes.

## Independent finite evidence and retained history

Owned controls and raw stdout/stderr/command records are under ignored `.local-artifacts/w7-genuine-history-source-r2/`. Nothing ran from Root or author checkout. Test cwd below is relative to that evidence directory; the explicit Node executable above was used throughout.

| Run | Cwd | Result |
| --- | --- | --- |
| Original a3bb browser and original tests | `original58` | 58/58, exit 0 |
| Unchanged CURRENT tests against exact a3bb browser | `old` | 58 PASS / 3 meaningful assertion FAIL, exit 1 |
| Exact CURRENT browser/tests | `source` | 61/61, exit 0 |
| Same CURRENT from Portal cwd | `source/apps/portal` | 61/61, exit 0 |
| Additional reviewer source/data controls | evidence directory | 8/8, exit 0 |
| Browser and test `--check` | `source` | both exit 0 |

Every test run has zero cancelled/skipped/todo. Worktree argv is `--test --test-reporter=spec apps/portal/tests/genuine/client-history-oracle.test.mjs`; Portal argv uses `tests/genuine/client-history-oracle.test.mjs`. Raw filenames are `original58`, `old61`, `current61`, `portal-current61`, `reviewer` plus `.stdout.txt`, `.stderr.txt`, `.command.json`. Inner process exits are authoritative; the evidence-writing wrapper exit does not relabel OLD red. OLD failures are exactly the -1 title mismatch, missing-current pagination Boolean, and absent load-before-list call. A harmless Node22 typeless-package ES-module warning is retained where emitted; no config change suppressed it.

Parent's separate `parent-history-hg` records were inspected without modification. Their original58 pass, initial RED61 (58 pass/3 fail, including one incorrect relative-import setup failure), initial purported GREEN61 (actually 60 pass/1 import-setup fail, exit 1), corrected OLD61 (three meaningful assertions), and later CURRENT61 passes remain distinct. VERIFIED-PRECOMMIT records the 2,323 unowned tracked bytes/kinds/modes and original-index preservation, exact prefix, untouched SQL/report and sole two-path staging. This is Parent evidence, not an independent replay of its historical filesystem audit. The unchanged milestone's earlier 0/4, 4/4, 37/37, 49/49, 54/54, 55/55, OLD55/57, corrected57/57, OLD57/58 and final58/58 retain their original proof levels.

Reviewer setup is separate: one source lookup used the wrong `features/history/ClientHistory.tsx` path and returned Git exit 128; the actual `src/app/ClientHistory.tsx` was then inspected. Initial memory search had no relevant hit. No reviewer test setup failure occurred. Original SQL was included in the owned OLD/original test directories before their first invocation.

## Conditional next phase

This SOURCE gate permits no resource action. Parent must first complete the applicable M01 independent acceptance and source integration verification, then provide a separately reviewed concrete integrated-code/resource packet. M04 must provide actual generated publicationVersion/publicationReceiptId/notificationEventId/public markers, followed by a distinct actual newer publication. Issued A/B Pages must be ordinarily UI-authenticated, with actual privateScan/capture/captureCanonical helpers, canonical selection inputs and resolved operation ownership. B requires its own actual publication observation or verified unavailable positive control; null B never becomes a passed isolation test.

Genuine SQL before/after, raw UTF-8 bytes/head binding, ordinary browser selection/refresh/direct URL/Back/nativeBack, positive-invalid denials, private-byte exclusions, owner/session-ended/leave/logout/delayed-byte schedules, handle joining, visual/accessibility, independent genuine/integration and exact-head CI remain pending. Any underlying selected/current V3/readGuidance dependency refusal keeps that phase held; do not substitute a producer, route or successful response facade.

No nested agent, SDK/dependency/compiler, browser, network, SQL parser/engine, DB/Auth/resource acquisition or fixture query ran. No actualBase/private/resource payload was read, no successful authority stub was supplied, and no PR/commit/push/watch/merge/deploy or foreign write occurred. Sole visible deliverable is this new uncommitted report. Final scope/index/diff checks are recorded in ignored `final-verification.json`; no product completion follows.
