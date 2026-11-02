# W7 Source kernel independent SOURCE review R2

Owner: Kanuj. 2 November 2026 UTC. **Specification/completeness: FAIL for the complete Phase 1 candidate. Correctness/quality: FAIL.** Three independently supported findings remain: **SK2/P1**, another bare CASE operand in a PL/pgSQL IF condition; **SK3/P2**, mixed recording/admission clocks for known consent occurrence; and **SK4/P2**, an out-of-scope source existence/version distinction. None is corrected here. Final authority after waits/private return remains an explicit **UNACCEPTED integration gate** under the original interface requirement; Phase 1 deferral does not waive it.

This reviews the COMPLETE original Phase 1 through `b8a5dac9bb6b6cc69c0d6365d88f71b0b8117218`, not just its four added parentheses. The eight modules, three tests, full 708-line migration, full 188-line authored pgTAP, author/correction reports, four frozen Source models and relevant retained Account/authority dependencies were inspected. Feasible independent semantic inspection continued after SK2. No PostgreSQL parser, SQL, DB/Auth/Storage, native resource, browser, provider, physical cleanup, full build or release acceptance is claimed.

## Consolidated findings

### SK2 / P1: a third unparenthesized CASE still prevents migration source admission

Candidate `supabase/migrations/20261102033048_portal_rebuild_source_kernel_v1.sql:642`, inside `concierge.source_consistency_check()`:

```sql
if r->>'outcome'<>case j.action when 'begin_source_upload_v1' then 'reserved' when 'abort_source_upload_v1' then 'aborted' else 'recorded' end or r->'descriptor'<>'null'::jsonb or r->'deletion'<>'null'::jsonb or(j.action<>'begin_source_upload_v1' and r->'upload'<>'null'::jsonb) then perform concierge.fail('source_conflict');end if;
```

The complete CASE operand is at parenthesis depth zero in the IF expression, before its outer THEN. It repeats SK1's scanner form with `<>` rather than `>`. It is byte-identical in original `9fe9e5e4` and current `b8a5dac9`. The correction changed only lines348/350; R1's exact five-registration probe checks those two fixed conditions and cannot establish that the rest of the migration is free of this form.

The new bounded lexical control masks quoted data/comments, tracks parentheses, and stops at the first depth-zero THEN. Exact OLD Source contains unsafe operands at **348,350,642**; CURRENT contains **642**. Controls distinguish quoted CASE/THEN text, the legitimate CASE assignment, and parenthesized CASE expressions. The desired full-migration source assertion fails. The original exact SK1 probe independently reproduces OLD **3 pass/2 fail, exit1**, CURRENT **5/5, exit0**, without changing its predicates.

**Impact/proof type:** a P1 migration source blocker. Expected compilation failure is an inference from the same known PL/pgSQL scanner form, supported by exact source/static controls. It is NOT an observed failure of this Source migration. Parent `1982bc7e`'s retained PostgreSQL17.11 OLD3/CURRENT0 grammar result remains EXPORT-ONLY attribution, not Source execution or semantic proof. Parent was notified immediately; no dependent native execution was attempted.

**Action:** parenthesize this complete CASE operand while preserving its branches and every adjacent receipt predicate. Retain both original SK1 vectors and a complete-source control. A later exact resource grant must still parse/replay the corrected migration and run its actual deferred guards; this static check cannot replace that gate.

### SK3 / P2: a known occurrence can be admitted after the recording instant that is persisted

In the SAME candidate migration, `concierge.source_command()` captures `at_time:=clock_timestamp()` at **471**, then calls the potentially waiting `source_current_policy()` at **472**. That helper takes `FOR SHARE` locks at228-229. The manual-consent branch at **475** rejects future `occurredAt` against a NEW `clock_timestamp()`, but persists the EARLIER `at_time` as `source_consents.recorded_at` at **480**. The receipt also uses that captured instant. The complete function is unchanged by b8's parser-only correction.

A finite source-order witness is:

| Fact | Instant |
| --- | --- |
| captured and later persisted recording time | `2026-11-02T08:00:00.000000Z` |
| supplied known occurrence | `2026-11-02T08:00:01.000000Z` |
| occurrence admission check after the policy wait | `2026-11-02T08:00:02.000000Z` |

The later comparison permits that occurrence. The inserted record nevertheless says that it was recorded one second BEFORE it occurred. The current deferred guard checks predecessor recording chronology, but does not reject this occurrence-versus-recording contradiction. This is a producer error, not a request to infer unknown occurrence or order causality by UUID/time.

The unchanged actual `src/contracts/PortalSourceAccountValidation.ts:208` rejects the corresponding safe Account record through `readSourceAccountRecords(...,'complete')`. Equal occurrence/recording and a genuinely earlier occurrence both pass. New controls pin the actual source capture/wait/comparison/persistence order; the desired source assertion binding admission to the persisted instant fails. The timestamps are a SOURCE-order counterexample and the validator executes actual frozen code. No SQL function, session, lock schedule or real consent was executed, and no clock/authority port was replaced.

**Impact/proof type:** P2 source-level temporal inconsistency. Under the stated wait/input ordering, a successful manual record can poison its own Account projection; a list containing it fails the unchanged mapper rather than providing review/withdrawal controls. This is a conditional semantic inference, NOT an observed committed row, actual client outage or withdrawal bypass. Native reproduction remains prevented by scope and SK2.

**Action:** validate known occurrence against the SAME authoritative instant persisted as recording time, or capture the final recording instant after the relevant waits and use it consistently. Preserve unknown occurrence and exact supplied wire text. Add a real blocked-policy/two-session chronology regression under a later grant, and verify the produced Account page through the unchanged validator/mapper. Do not weaken the Account chronology check.

### SK4 / P2: source version errors precede selected source lineage and reference permission

The same migration's `concierge.source_relation()` authorizes the REQUESTED scope at244, but then selects `plan_sources` globally by `id=sid` at245. It emits `not_found` for an absent ID at246 and `source_version_required` for an existing ID's missing/wrong version at250/252. The source's ACTUAL origin-versus-selected-scope/adoption relationship is established only at255-259, and the nonowner's source reference permission only at262-263. Access to selected scope A does not establish that an arbitrary source B belongs to A.

Conditional source example: an otherwise eligible human may select client scope A. Existing legacy source B belongs directly to client B, has version1, and has no adoption into A. With A as the requested scope, an unknown source ID yields404/not_found; B/version2 yields409/source_version_required; B/version1 reaches the missing-adoption branch and yields404/not_found. Neither B query establishes B's lawful selected relation or source permission before the version distinction. Managed reservations have the same earlier version-existence branch at250.

**Impact/proof type:** P2 source-inferred existence/version oracle for an otherwise authorized Source human. This is bounded metadata disclosure, not raw bytes, actual client exploitation or successful SQL execution. The interface requires current stored scope/lineage before revealing existence, and the shared error contract requires404 without cross-client disclosure. The new exact-source ordering control passes; the desired membership-before-version source assertion fails. A separate finite test through the ACTUAL closed handler confirms not_found404, source_version_required409 and forbidden403 are preserved. Those SYNTHETIC error Responses establish codec fidelity only; they do not manufacture SQL or positive authority proof.

**Action:** establish the target's lawful direct/adoption relation to the selected scope and applicable current source permission before returning version-specific distinctions. Keep unrelated or inaccessible IDs indistinguishable from safe absence. Preserve legitimate source_version_required behavior for an actually authorized source. Add real cross-client, missing-adoption and no-reference cases after a later SQL grant. SK2 still prevents native admission; no correction was made here.

## Original requirements and complete source assessment

The original implementation brief, allocation receipt, early UI handoff and [full interface pin](COORDINATOR_SOURCE_KERNEL_INTERFACE_PIN.md) govern this candidate. [D01-D48](../APPROVED_DECISIONS.md), [desktop specification](../APPROVED_DESKTOP_SPEC.md), [implementation contracts](../IMPLEMENTATION_CONTRACTS.md), [founder addenda](../DECISION_ADDENDA.md), the readiness/next-slice source research and original continuation custody were reconciled. Current explicit allocation restrictions supersede historical broader grants or roster labels.

| Original requirement | Complete candidate assessment and remaining evidence |
| --- | --- |
| Fixed SourceScope; Source15 8 READ/7 WRITE/task0; separate own-client Account3 | Four d0f model blobs remain EXACT. Two closed command RPCs remain `concierge_source_command_v1({p_command})` and `concierge_source_account_command_v1({p_command})`. No caller actor/client authority override or additional user action. SQL denies Source task/client principals; Account derives its own actual actor. Source inspection plus focused synthetic tests only. |
| Two fixed context RPCs accept only `p_request_id` | Type/builders and SQL wrappers select actor-owned journals and infer stored scope. Source missing/private-purged context is unavailable. Account retains actual safe withdrawal/hash in its noncascading tombstone; null is not certified absence/purge. The unchanged Root mapper is retained. Positive SQL authority remains UNRUN. |
| Initial manager is actual activated policy owner, active owner principal, live permanent owned session, unfenced profile, advisor VIEW+EDIT | Inspected `source_actor`, `source_scope` and retained `plan_session`, target, capability and live-human helpers. No finance/display-name/caller-role authority. Policy/principal/user/profile/session/scope locks and repeated checks are authored; actual Auth, natural expiry and every-wait enforcement are not established by Node. |
| Management/reference permission is separate from raw rights | Exact-version grants join current consent/disclosure, purpose/right, actual human, origin/adoption, expiry/revocation and reference relation. Owner needs explicit review/read grant. Legacy metadata never becomes trusted content. Detail completion remains unavailable; no bytes/ready handle are produced. Real byte authority remains a gate. |
| One canonical source identity and immutable origin/adoption; guarded pending pointer | Only approved retained-object changes are the `plan_sources.version` nullable pending support and existing collision helper body extension. New inactive/null identities require managed reservation/origin and no completed version. Positive/active managed versions and all `source_versions` insertion remain disabled. Old source/reference/review helpers were inspected for pending/inactive denial. Actual old-row/OID preservation requires native proof. |
| Exact UTF8 disclosures and immutable policy publication/current selection | Text draft hash uses exact UTF8; BOM/CRLF/scalars stay intact, with4000-scalar display bound. Separate immutable drafts/publications, purpose/version/hash references, policy/config hash domains and explicit current selection are authored. No migration seed, real final words, publish API, principal provisioning or activation. Node verifies pure draft capture/hash, not selected SQL policy. |
| Shared manual consent head and safe client projection | One scope group captures lawful subject; explicit sequence/immediate predecessor defines root-to-current causality. Manual allow/withdraw stays distinct from client_portal withdrawal. Safe Account projection omits raw source/draft IDs, names, evidence and grant internals. UUID order is pagination only. Deferred causal/link guards were inspected, but SK3 remains and no actual SQL query/chain was exercised. Assignment alone does not transfer consent; complete adoption/reassignment recovery remains an integration dependency. |
| Scope CAS and coordinated Account CAS | `source_lock_scope`/`source_advance` and Account head operations serialize by actual subject, recheck after locks, and advance affected heads on manual change/portal withdrawal. Scope snapshots mirror one revision into registry/authority/retention. Source and Account expected+1 receipt bindings are retained. Concurrent commit/rollback, stale CAS and actual temporal expiry remain UNRUN. |
| Actor/UUID collision locks across both new and six existing families, both directions | New journals join the same `concierge:request:` lock namespace. Existing trigger function is guarded/replaced in place with OID/owner/ACL/attributes/bindings comparison. Source translates only known shared request_conflict to source_conflict; Account retains request_conflict. All56 directed raw-family pairs are authored in pgTAP, NOT executed. Tombstones survive private-result purge; Source private command/result is separately purgeable. |
| Replay and status authorize current stored scope before disclosure/effect | Source/account authority helpers, exact original command/hash/revision/actor binding, family-scoped fixed lookups and missing-context denial were inspected. Replays do not execute fresh effects from purged private state. Historical receipt is not current byte permission. SK4 remains in target source_relation ordering. Actual concurrent revocation/status/private-return schedules remain UNRUN; see final-authority gate below. |
| Closed HTTP uses actual Root parsers/mappers and finite budgets | Both handlers inspected completely: origin/method/content type, bearer Auth-user proof before same-token subject/session decoding, input500000/100000, response1800000/page400000/Auth8192, bounded stream decode, abort checks, no-store and prompt known401/403 despite unreadable/pending denial bodies. Original17 pass only over CLOSED SYNTHETIC Response ports, not actual Auth/network/SQL/Vault. |
| No fabricated storage/inspection/cleanup success or narrowed full goal | No entrypoint/credential factory/real source transport, object/part upload, storage/inspection proof, enabled format, raw proxy or cleanup service is implemented. UTF8 reservation metadata is not an uploaded object, including zero bytes. Unknown lifecycle/obligation/retention/cleanup returns unavailable; there is no physical-absence claim. Audio/PDF/image support stays required full-goal work, not permanently narrowed to UTF8. |
| D39/D40 lifecycle and deletion | Never-started material requires authorized manual deletion without a timer. Started material uses actual confirmed END+12 calendar months, separate from payment, product Start,30-day access, publication/finance history and legal obligations. Trusted lifecycle/end/correction/renewal/obligation producers, full versions/parts/derivatives/legacy/adoption inventory and source-aware account/draft cascade remain missing. No actual deletion/cleanup was attempted. |

**Final-authority integration gate, UNACCEPTED:** both kernel handlers revalidate Auth before the final command RPC, then await the returned body and map/return with only request abort checks. This phase has no separately implemented post-body actual SQL scope/purpose/grant/consent finalizer or shared cookie/Vault egress composition. The author explicitly defers it; the original interface still requires current applicable authority after waits and before private return/errors/replay. Parent's clarification retains this requirement as an unaccepted gate. No new runtime finding or successful authority stub is manufactured here. Original17, source checks, mapper/hash checks and SQL text cannot approve that boundary. It must be implemented and independently verified through real composition before private endpoint admission.

## Prior findings and original evidence remain distinct

Original kernel R1 report-only `94cae923dae74bd927e29bdfa2ccbfbe38fb64ee` remains FAIL. Its first-finding stop left broad semantics unreviewed. SK1's two targeted operands are addressed by exact b8 source; the historical verdict and original raw log are unchanged. SK2 is adjacent remaining source, not a failed reproduction of the b8 four-byte change. SK3 predates that change.

Source S1-S10 were reconciled against complete current frozen models and original reports/findings: complete inventory versus count-only proof; immutable descriptor/binding/origin; strict calendar syntax; inhabitable policy type; purpose/right sets across reads/writes; part binding; captured returned digest snapshot; intrinsic detail semantics; derived retention mode/day versus hash; and incompatible text selectors. The independent R5 model PASS stays scoped/attributed. It does not accept this kernel or its missing producers.

Account SAC1-SAC4 were reconciled against unchanged Account4 and the SQL producer: connected nonforking group/purpose chains, exact causal cardinality, named off-page position, and legal canonical UUID capacity. Old complete-chain failures and later repairs remain historical; their pure model cannot certify an actual query, source lineage or current authority. SK3 is a producer contradiction rejected by that retained model, not a request to reopen or weaken it. The reviewed UTF8 inspector remains exact and unactivated as a profile.

Historical Source raw17=16/17, raw40=39/40, raw11=9/11, scheduling-only10/11 and returned-model adaptation11/11 remain distinct ATTRIBUTED results. The discarded early catch observes the same original promise. R5's185 and separate16 overlap. Account old-schema23=6/17 and R1five=4/1 remain separate from fact-bound replays; old d3 raw57=56/57 and combined72=71/72, post0096 raw53=48/53 and raw72=67/72 remain failures. The approved input-only fixture successor and current74/overlapping101 do not rewrite those originals. These histories were not rerun, summed into new totals or assertion-filtered in R2.

The kernel author's early RED0/4->4/4, HTTP0/9->9/9, combined131/131 including unchanged Account74/UTF840, and strict89 files/23 contracts with zero diagnostics remain AUTHOR ATTRIBUTION. R2 independently reruns only the exact17 kernel registrations, bounded new6 and separate SK4three. No full131 or strict compiler result is claimed here.

## Exact custody, base, candidate and owned diff

- T3-managed isolated workspace `/Users/kanuj/.t3/worktrees/shelv/t3-91479428`, branch `t3/review-source-kernel-r2`, initially clean at **`8af746d197b976972d4b16924155afa8c3b32d44`**.
- Separately supplied authoritative taskId: `node:delegated-task:command%3Amcp%3Aafb222dc-28b4-420b-9474-b05bc6eeba89%3Adelegate-task%3Acontinuation-20261102-source-kernel-r2`.
- Distinct backing thread: `thread:delegated-task:command%3Amcp%3Aafb222dc-28b4-420b-9474-b05bc6eeba89%3Adelegate-task%3Acontinuation-20261102-source-kernel-r2`; actual run ordinal1, requested07:54:33.727Z/started07:54:36.806Z. Live metadata matches this workspace/branch and parent `9b085ada-435f-48d6-8886-957c1ce3e82d`.
- Self AND parent actual `t3_thread_configure` with modelSelection OMITTED confirm **codex/gpt-6.1-sol/reasoningEffort=xhigh/serviceTier=default**, initially and again before report delivery. Explicit `/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node` reports **v22.23.0** and executes every Node check. No fallback, configuration change or nested task.
- Immutable candidate chain: `3bd152a259b7b9b9971caa1546e65f69de12aab9 -> dd13a37e21a53a42b2e90caefa887519f8321d62 -> 05e5d968166a6b35acd8ec7b30ceae04ac484719 -> 9fe9e5e499443356e71d6123bc7b3da8ff499f43 -> b8a5dac9bb6b6cc69c0d6365d88f71b0b8117218`.
- No candidate/input commit was cherry-picked or authored in this checkout. Exact needed Git sources were materialized ONLY under own ignored fixture. All19 changed paths are absent in own8af base. Four Source model files are attributed INPUT from dd13/d0f, never reviewer production. Original Account4/UTF8, all2128 base tracked paths, all66 old migrations/all121 old SQL files remain protected. No source activation follows adding ignored fixtures.
- b8 changes only the never-applied migration and new correction report. Migration is98,637 bytes, SHA256 `17fbb843c376425f52b5645f9fe8102ff6ce4fa4ef619b68237b9d85c6dbfcf2`; old98,633 bytes SHA256 `993bc15e7ee4f8726a8806927b4d709437627d96fe8e7e1085d5ee9207b29785`. Exact removal of its four added parenthesis bytes recovers original. pgTAP is28,779 bytes SHA256 `c81df61e1ee5fb4c44518e7810c0a8483cb56898ee3f7784d6f7f8ec23efca52`.

Complete19-path candidate manifest below. All modes are100644; preimages in own8af are ABSENT. Full byte lengths/SHA256 are retained in `candidate-manifest.json`, SHA256 **`a12687e238eed92728c92c2e951174d4a53608d8a0c4fa1e0811ee1a9d64508c`**. Paths are relative to repository root.

| Candidate path | Exact b8 Git blob |
| --- | --- |
| apps/portal/tests/rebuild-source-kernel-contract.test.mjs | `2815e50b8b10c2055eea149a19fb3e5b3d646779` |
| apps/portal/tests/rebuild-source-kernel-http.test.mjs | `814207cdf58ff2b6df9e9e24fb4072079cb4075d` |
| apps/portal/tests/rebuild-source-kernel-root.test.mjs | `98be4bbc4b37c1c19bada17628d14ee7285dbcdd` |
| docs/portal-rebuild/research/COORDINATOR_SOURCE_KERNEL_SK1_CORRECTION.md | `2c5cb3178195a449b29bc942cc5a2a6b7adea028` |
| docs/portal-rebuild/research/W1_SOURCE_KERNEL_SOURCE.md | `5b15eef22825bc50341295a59974412698bc4cf9` |
| src/contracts/PortalSource.ts | `6144c2449ffe06b1139f233b781964e220b9902b` |
| src/contracts/PortalSourceMapping.ts | `bc3007e792efe8ff225e14889aa450cef43ce5e5` |
| src/contracts/PortalSourceValidation.ts | `d9be4e75018916ee7cee76db797509df3ba698cb` |
| src/contracts/PortalSourceValues.ts | `771c891355f340f597aaaf10f0a3493cd1aa8660` |
| supabase/functions/concierge-source-account/kernel-http.ts | `0dbfbf228e5fd28b8d1657c895e091e4937fb513` |
| supabase/functions/concierge-source-account/kernel-rpc.ts | `f09e923dd477f28f434e0f9ff91ff24c5d65d977` |
| supabase/functions/concierge-source-account/kernel-types.ts | `2e64e410f3a27d88ff26270d9577957a3508f416` |
| supabase/functions/concierge-source-account/kernel-validation.ts | `442665a06cd449f76d927510439fab1d4a767b89` |
| supabase/functions/concierge-sources/kernel-http.ts | `a1db078f96e37e144fb540528af5487354e68cbf` |
| supabase/functions/concierge-sources/kernel-rpc.ts | `4e7b302a5044fb0ee3733cecae90cc764790ddf5` |
| supabase/functions/concierge-sources/kernel-types.ts | `eebe4e90633e424866d5c55e92abbc328373c319` |
| supabase/functions/concierge-sources/kernel-validation.ts | `d31fe85a92ac8c918bcb205dcb2b3ecf3a274f97` |
| supabase/migrations/20261102033048_portal_rebuild_source_kernel_v1.sql | `8f72ed9f889c012813398d4682b89b540f3703b0` |
| supabase/tests/portal_source_kernel_v1.test.sql | `563e36fc4d0af8c0e2e881f457d7d25264714e6e` |

The original approved input remains95,388 bytes SHA256 `c45701f9f54fd2b1dbb09bbd7aa2b9b437e9059aa6032b6f39411fe2e7f6efbd`. The separately supplied continuation/custody file is100,187 bytes SHA256 `b428b318598df52f12ce3e6ea4ebd350ff9333ee05d9fd8f04a8e845d0c722bc`, not that original approved byte stream. The interface pin is11,040 bytes SHA256 `f9ca6fc8dd71187137e4ace340c3cf2e230015039cccf4d1a83c264dffa430b7`. Original brief4352 bytes SHA256 `b762e710838849d698ed4f4bea609851106c2368918a66a4e4d400aa07cd104f`; allocation receipt and early handoff were hashed in place. Foreign originals/archives were not recursively copied or executed. Only the exact R1 static probe needed for execution was copied byte-identically to own ignored home.

## Dependency fingerprint and focused commands

Own ignored evidence home is `.local-artifacts/portal-rebuild/w7-source-kernel-r2/`. The executed immutable source closure has **33 actual files**, each from b8 Git, with complete path/byte/SHA256 receipt `closure.json`, SHA256 **`9c467666162ccce15dee4f87fb234ce61a3067fa73383084e4bd35a78bac04ad`**. It includes the actual unchanged Root parsers/mappers, not declaration/authority facades. The three original tests are byte-identical current Git input; the new probe alters no production or original test.

All THREE tracked locks are unchanged, mode0644 and nonsymlink: Root SHA256 `5c57c9aec9e4585066e032e234d610a77cbffd9a51f82700c158fc37fe01b5c2`; portal `bc914f3a9c9f24e44f02e3cff2804651147385ea5abda58a064531329ef23203`; session runtime `4024b48fb339605a438a3bfe68f6e547dade8c86660c6f06b41c278aa2289ba0`. The FOUR physical own/Parent Root+portal lock inputs and package files were hash/mode/link/device inspected and match. This is distinct from three tracked locks. All91 tracked runtime paths remain base-exact; no runtime file was executed.

Own Root, portal and session node_modules are absent. Node22.23.0 runs these erasable-TypeScript inputs directly with its existing default behavior, using no compiler/package dependency or added flag. No install, APFS clone, link, foreign compiler/runtime, ambient declaration, shim, package/lock/config/flag change occurred. The conditional clone admission procedure was NOT entered. Focused strict TypeScript capability is missing in own checkout and was not acquired; author strict0 stays attributed. Builtin type stripping is not typechecking.

| Independent R2 check | Actual result |
| --- | --- |
| Exact copied R1 static probe, own OLD migration |5 registrations;3 pass/2 fail; exit1; no skip/cancel |
| SAME probe, own CURRENT migration |5/5; exit0; no skip/cancel |
| Exact three original kernel Node files, own CURRENT source |17/17; exit0; no skip/cancel |
| New complete-source/temporal probe |6 registrations;4 controls pass/2 desired source-gate failures; exit1; no skip/cancel |
| Separate SK4 source ordering/finite error-transport probe |3 registrations;2 controls pass/1 desired source-gate failure; exit1; no skip/cancel |

The original17 ran once interactively and then once with retained raw capture; these are the SAME17 predicates, not34 independent behaviors. HTTP tests use closed SYNTHETIC Auth/RPC Responses and actual Root codecs; they do not authenticate synthetic tokens against a real service. No successful current-authority/Vault/operation stub is treated as genuine proof. New lexical/chronology controls execute source text and actual pure validation only. There is no minimally adapted kernel replay or corrected SK2/SK3/SK4 successor run; no assertion was waived, filtered or rewritten after failure.

Exact entrypoints, with all argv/cwd/exits/raw hashes in `sk1-receipts.json` and `focused-receipts.json`:

```sh
# Run each from its own OLD or CURRENT fixture cwd containing the exact migration.
/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node --test /Users/kanuj/.t3/worktrees/shelv/t3-91479428/.local-artifacts/portal-rebuild/w7-source-kernel-r2/sk1-static.test.mjs

# From this checkout; captures exact original17 and new6 separately.
python3 .local-artifacts/portal-rebuild/w7-source-kernel-r2/run-focused.py

# Direct new6 entrypoint; expected exit1 preserves both unresolved findings.
/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node --test .local-artifacts/portal-rebuild/w7-source-kernel-r2/semantic.test.mjs

# Separate SK4 source and synthetic-error fidelity; expected exit1.
/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node --test .local-artifacts/portal-rebuild/w7-source-kernel-r2/relation-order.test.mjs
```

`run-focused.py` exits0 ONLY after verifying subcommand exits `[0,1]`; it does not claim the semantic command passed. R1 probe SHA256 `b5287e2256d6b9b0898df9194168fa245f532f87bc9e1fe76d0dd903f99b2b50`; new probe `737afb929c778a0dbaf967786e36342c6a401062edb4b5098df51862b75175e8`. Own OLD/CURRENT static raw hashes are `d323fe232b28795bd1351a39162d4d1ee033b9ecffe4dd50bec1df93f603eff0` / `53e237fb8ee05ba9d6c5244d3b1bd212cae5c0a3ff490895eca491d10952c7fb`; captured original17 raw `b8a626ab32a39ca6f7b26a068c471ac5e3ee9e36063ff467ed8a711d856fb655`; new6 raw `dc4d61b7372cba6500978bbfbcaf374cf5d334adda75b1b147e7cb2b3c88ef7a`. The historical R1 raw remains separately hashed in place, `bef2b6968ff5a17c69ad17b7bbebb4299f36016d1cad217ad64d146da2784f1d`.

Separate SK4 probe SHA256 `99765c4fa4b25ac55c3d417264621a41cca56ba63987d0691949a8da44b72cc3`, raw SHA256 `0fb4143cdb1eb81d26e5dcb774124dd42e738aa1be66011da9fe333a00286c82`, exact argv/exit in `relation-order-receipt.json`. Its surrounding Python capture exits0 only after confirming the actual Node exit1.

Setup/read qualifications: several combined context displays truncated; bounded subsequent reads covered candidate code/findings. No truncated display is claimed as full closure. Existing MODULE_TYPELESS_PACKAGE_JSON warnings remain. The first parent progress message gave approximate temporal lines; exact reviewed positions are471/472/475/480 above. No setup issue is counted as product RED. No SQL execution failed, because none was authorized or attempted.

## Prevented checks, remaining gates and report delivery

**Prevented:** SQL/pgTAP/actual Auth/RLS/native/storage/browser/provider/server/listener/process-adoption/reset/cleanup execution is excluded by this allocation. SK2 independently blocks migration admission even if a later execution grant were offered. Thus no native chronology schedule, family collision order, CAS/replay, old row/OID/ACL preservation, current consent/private-return/cascade or physical absence result exists here.

**Unrun or unavailable:** own strict/compiler capability is absent; no conditional dependency acquisition was used. Full npm/Expo/mobile/build/application suites and CI were centrally reserved and not run. Historical131/strict0, Source/Account pure passes, export PG grammar and earlier genuine fixtures are not substitutes. No old stopped fixture was inspected, adopted, queried or restarted.

**Integration gate:** keep Source candidate unimported pending SK2/SK3/SK4 correction and a fresh independent full-source check. Then separately authorize exact corrected SQL recipe/source/resources, preserve original native/behavior regressions, and verify migration/pgTAP plus genuine least-privilege/concurrent Auth/consent/replay/deletion behavior. Parent reports Maya17 admitted at b2a5f4f3; that independent progress does not retarget this frozen Source candidate or accept it.

Also UNACCEPTED: final authority after waits/private return and actual authenticated cookie/Vault/Root transport; complete immutable payload/format/inspection/private byte proxy; source-aware account/draft deletion; trusted lifecycle/obligation/inventory/cleanup and truthful physical proof; approved final disclosures and deliberate policy selection; actual Account/A03/A08/scoped-agent wiring; mounted browser, accessibility/visual/human, hosted/CI and release. No final policy seed/publish/activation, raw/source/storage/cleanup action or source-role expansion was performed or authorized. No provider-refused Guidance/M65 work was reviewed, retried or rerouted.

Only NEW `docs/portal-rebuild/research/W7_SOURCE_KERNEL_SOURCE_R2.md` is authored tracked work. Ignored evidence retains custody, manifests, raw probes/results and final preservation. Report links/scope, unchanged protected bytes/modes, exact candidate postimages and ordinary/staged `git diff --check` are verified before commit. Delivery is ONLY this report's containing commit, returned separately with its exact SHA and clean-tree receipt. There are no input/import commits to deliver, no production/original-test correction, foreign write, nested task, push, PR/comment/watch/merge, deployment or live client/permission/message/funds action. This report does not accept itself or authorize SourceReady, Root import, native or full-goal completion.
