# W7 Source credential adapter independent source review R1

Owner: Kanuj. 2 November 2026 UTC. **Specification/completeness: FAIL for the bounded credential-adapter pin. Correctness/quality: FAIL.** Two residual findings remain: **CA2/P2**, received denial lost to an unrelated response getter, and **CA3/P2**, unguarded final listener cleanup can override refusal or return success after actual caller abort. The author’s CA1 body-getter correction reproduces independently. No production or original test is changed here.

This is a complete source review of the three-file implementation `435c6d13cd16b3081ced5d6fbe76d730090152dc` and sole author report `97b6bba2b65557d89564a709a831644699f880a9`. It includes actual factories, unchanged validators, fixed kernel types and finite native Response tests. It does not accept the unintegrated Source kernel, actual Auth/RPC permissions, private egress, Root mount, native/browser or release behavior. Overall integration remains **HELD independently of CA2/CA3**.

## Consolidated actionable findings

### CA2 / P2: reading statusText before the denial branch replaces an observed 401/403 with 503

Exact Source `credential-runtime.ts:115` reads both properties before checking the status:

```ts
const status = response.status, statusText = response.statusText;
if (status === 401 || status === 403) {
```

The actual status has already been observed. If the native Response instance’s unrelated `statusText` getter throws, control skips the denial branch and reaches the local503 catch. Both Source and Account factories share this implementation. The same result occurs through `authUser` and a dispatched WRITE `rpc`; the latter incorrectly substitutes `concierge_uncertain` for the known denial.

Independent desired-denial registrations use real native Responses with status401/403 and deliberately throwing getters, through the actual factory/configured-fetch boundary. Each registration checks all four factory/method combinations. CURRENT returns `[503,503,503,503]` instead of the known status. Normal native denials and the original throwing-body-getter cases are separate passing controls. These are finite synthetic getter witnesses, not evidence that ordinary provider fetch naturally constructs such getters or that a mounted session failed to retire.

**Impact/proof:** P2 raw-port denial-fidelity defect against the explicit getter/cleanup requirement. An unrelated property failure turns a known authentication/permission refusal into local unavailability/uncertainty. No unauthorized RPC result or private-source permission is demonstrated.

**Action:** branch on the captured status before accessing nonessential properties. Preserve the empty-body401/403 response independently of status text, headers and disposal. Retain original CA1 and new statusText regressions for both families and both methods. Do not convert other local failures to401 or reinterpret a genuinely late response as a previously received denial.

### CA3 / P2: final signal cleanup is outside exception isolation and the final abort check

The SAME implementation at `credential-runtime.ts:144-152` returns the race result, then executes:

```ts
finally {
  retired = true;
  clearTimeout(timer);
  signal.removeEventListener('abort', retire);
  try { reader?.releaseLock(); } catch { /* ... */ }
}
```

The `removeEventListener` call is unguarded. There is no caller-abort recheck after it. Two deliberate callback witnesses use an actual native AbortController/AbortSignal, wrapping only that signal’s removal method and retaining the actual remove operation:

1. Removal calls the real `controller.abort()`. All four Source/Account auth/WRITE combinations return HTTP200 with the synthetic `PRIVATE-success` bytes although the original native signal is now aborted. Earlier fetch/read/partial-body abort controls refuse promptly; this final callback ordering is the uncovered gap.
2. Removal throws. The raw exception overrides the completed return outside the catch, so `authUser` rejects with the synthetic private exception instead of resolving a safe local response. Separate received401/403 controls also reject with that exception instead of preserving the denial.

A control in which final removal aborts an already received401/403 continues to return the empty original denial. That fidelity must survive the correction. The new probe’s raw output retains the failures; no assertion, callback or result is rewritten to obtain green.

**Impact/proof:** P2 factory-level lifecycle/contract defect under deliberately throwing/reentrant cleanup. This is NOT naturally occurring mounted-browser reachability, SQL authority loss, or an actual private disclosure. The inspected frozen b8 handlers additionally check the original request signal after the port/body awaits; no claim is made that these raw bytes bypass that caller check. Their separate final scope/purpose/grant/consent authority gate remains unaccepted. No successful authority/currentness/Vault stub is supplied.

**Action:** isolate listener cleanup exceptions and retain an explicit outcome until cleanup is complete. Recheck actual caller abort before returning a non-denial success; dispatched WRITE refusal remains503/uncertain and a pre-dispatch refusal remains503/unavailable. Preserve a received401/403 through cleanup abort/throw. Use the original real signal and captured call; do not add a permission callback, context RPC or invented authority result.

## Complete applicable adapter matrix

| Requirement | Assessment and proof boundary |
| --- | --- |
| Exact constructors and closed native Response ports | Both pinned signatures match the frozen kernel types. Sole helper accepts only `source` or `account` and selects that family’s two RPCs. Constructor/module import has no I/O. Source plus exact original19. Strict compiler remains UNRUN. |
| Fixed Source15/Account3 and scope model | Original15 Source actions and3 Account actions pass the actual command readers and fixed envelope tests. SourceScope remains exact client/draft union, eight reads/seven writes/task0; Account adds no client selector. Types/Values/Validation are attributed dependencies, unchanged by this candidate. This is command construction, not action authorization. |
| No caller authority, endpoint, RPC or context selector | Literal family RPC union; command args only `p_command`; context args only `p_request_id`. Extra actor/client/scope/authority fields, foreign family, path injection, invalid UUID, cycles/class objects/accessors/toJSON fail before send in tested inputs. Additional independent selector/context controls pass. |
| Strict parse, detachment and fixed serialization | Plain-JSON inspection precedes detachment; real unchanged family reader reconstructs command fields, canonicalizes UUIDs, and validates original semantics. Captured body/URL/bearer remain isolated across waits/concurrent calls. BOM, CRLF and non-ASCII source text retain exact bytes. This transport serializes the parsed envelope; the kernel’s canonical request-hash domain remains separate. |
| Configured Auth endpoint and captured configuration | Actual configured HTTPS origin, `/auth/v1/user`, public key, copied/frozen origins and configured-or-global fetch captured before waits. Original custom host is retained. Invalid config/getters throw safe `Error('unavailable')`. Global fallback capture control passes. No caller-selected URL or service role is added. |
| Request limits | Actual serialized envelopes capped at Source500000/Account100000 UTF8 bytes. Oversized/unknown-field inputs are refused before fetch. No lawful exact500000-byte positive command is claimed from small valid schemas. |
| Response/page/Auth byte limits | Actual chunks checked against remaining fixed-buffer capacity before copying: Auth8192, Source/Account page400000, other response/context1800000. Exact-cap/over-cap, fragmented streams, mutated consumed chunks, non-ASCII and misleading Content-Length controls pass. No pre-bound JSON decode; upstream `json()` is unused. |
| Raw Auth/result semantics | Valid/malformed/different-user/anonymous/task-role/expired JSON stays bounded raw input. Native401/403/429/503 and other safe raw status/body controls preserve their ordinary semantics. No identity/role/session/SQL result is fabricated or accepted as permission by this adapter. |
| Single absolute ten-second deadline | One timer plus monotonic expiry per request covers fetch and all body reads; no per-await renewal. Original shared6000+4000ms test and independent pending-read/late-WRITE controls pass. Timer mocking is finite scheduling evidence, not actual network timing or physical cancellation proof. Final callback exception/abort defect is CA3. |
| Prompt overflow/abort/refusal cancellation | Retirement precedes controller abort/disposal; cancel rejection is observed without awaiting pending acknowledgement. Native stalled/rejecting/throwing/locked/body-getter and reentrant cancellation cases pass within original19, with fragmented/rejected-cancel controls independently added. Late fetch responses are discarded. No physical cancellation claim. |
| Received401/403 through all ancillary failures | CA1 body-getter correction reproduced OLD17/19 to CURRENT19/19. CA2 statusText getter and CA3 throwing listener cleanup remain FAIL. Late-after-timeout401 remains local503 because it was not received before retirement. |
| Local safe unavailable/uncertain, final callback safety | Normal pre-dispatch abort/refusal is503/unavailable; dispatched write transport loss is503/uncertain. No fake global401. CA3’s deliberate final callback can still return success after abort or reject with its exception. |
| No activation or broader authority | No index/server entry, App/routes, cookies/Vault, SQL, Storage, upload success, cleanup, source rights, disclosure or policy activation added. No actual Source result success is inferred from `Response.json(null)` or HTTP200. |

The review continued through all feasible source/finite transport checks after findings. No material source finding outside CA2/CA3 was established in the remaining adapter paths. This statement is bounded by the probe matrix and does not certify arbitrary JavaScript hooks or missing native/integrated behavior.

## Custody, exact candidate and source closure

- Own T3-managed workspace `/Users/kanuj/.t3/worktrees/shelv/t3-8dcbe62e`, branch `t3/review-source-credential-adapter`, initially clean at **`19b5946e860871deddf3eae762c02bc06fd245e7`**. Author base is **`8af746d197b976972d4b16924155afa8c3b32d44`**. Own newer base has exactly five inherited SMTP code/test/report additions; they remain protected and are neither reviewed nor executed here. No Root/Maya or foreign write occurs.
- Authoritative literal taskId, separately forwarded by Parent: `node:delegated-task:command%3Amcp%3Aafb222dc-28b4-420b-9474-b05bc6eeba89%3Adelegate-task%3Acontinuation-20261102-source-credential-review-r1`. Distinct backing thread starts `thread:delegated-task:` with that same separately verified suffix; live metadata binds the own workspace/branch and actual parent. Run ordinal1 requested08:45:49.514Z/started08:45:50.451Z. Task identity is not inferred from that run.
- Actual self AND parent `t3_thread_configure`, with `modelSelection` omitted, initially and again before delivery: **codex/gpt-6.1-sol/reasoningEffort=xhigh/serviceTier=default**, full-access/default interaction. Explicit `/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node --version` returns **v22.23.0**; that executable runs every Node check. No model/config change, fallback or nested agent.
- Applicable AGENTS/WORKFLOW, approved rebuild docs, complete author brief/report, full interface pin and relevant complete continuation/custody sections were read. Original kernel R1/R2 and frozen Source/Account finding histories were reconciled. Provider-refused Guidance/M65 work was not retried, renamed or rerouted.

All three code/test preimages are ABSENT at author base and own base; modes are100644. Exact code commit changes only these paths:

| Path | Bytes | Git blob | SHA256 |
| --- | ---: | --- | --- |
| `supabase/functions/concierge-sources/credential-runtime.ts` | 9974 | `1938ed2c3d363b7633eeb230eb04510569e8baa3` | `9df3163e39923135b537b8ca01588506eead78f71aa6e0c24a529e6dcc9d6db2` |
| `supabase/functions/concierge-source-account/credential-runtime.ts` | 530 | `77c507868d45e682e02ae3e1fb8747057b2384fc` | `a7859748938fbba459112702613cf605ee222340c2801c2345610d6339296909` |
| `tests/portal-source-credential-runtime.test.ts` | 23824 | `e6c74b4925658da7f90bbe247f1cd1a216787230` | `ca9f07bd65cbb6ee14e77c1642a4e19b38d526031323f57d1df9ed1c28dba03a` |

Full author report at97b6 is18448 bytes, blob `5eab751e0fac09607bdaa3fa1080774c3c01edff`, SHA256 `415c7c5288b360a7bdb7d478b333b368c46acbadee88c5ba644d2969f7d2bf5f`. Candidate manifest was hash-verified in place: **`98ad028623fca3e8f4f2728b78fb301621d32e51b0d246724ed93ce2924abe69`**. No candidate or input-only commit was cherry-picked/authored in this review checkout; deliver only the new report commit.

Only needed exact Git inputs enter own ignored `.local-artifacts/portal-rebuild/w7-source-credential-r1/current/`. The author’s full41-file type/source fixture manifest (`69a3ca5c0e51b4584889e68cd4d21aace87fee5f3945bad19785157599f5b4ba`) was reconciled with immutable Git, and all41 foreign original fixture files were read/hashed **in place** and byte/mode checked without executing them. Own complete41-row `closure.json` includes path/ref/blob/bytes/mode/SHA256, SHA256 **`3bf4f071eb1f8b78b288fc5cb5fcc7509c8e7f3a8af4b99fe5da0180d33c820c`**; separate original-physical receipt SHA256 `d7456ca42ece30a3c6e8dcc3766dba0b6f595884ce8060bcbf4a62ff9c3b5526`. These41 inputs are not41 executed modules or a clean physical Root graph.

Five closure inputs come from frozen b8 Git: the two type-only `kernel-types.ts` blobs `eebe4e90633e424866d5c55e92abbc328373c319` / `2e64e410f3a27d88ff26270d9577957a3508f416`, and Source type/validator/values `6144c2449ffe06b1139f233b781964e220b9902b` / `d9be4e75018916ee7cee76db797509df3ba698cb` / `771c891355f340f597aaaf10f0a3493cd1aa8660`. Other36 are exact435c Git inputs, including actual candidate/tests and retained Root dependency/type files. Runtime validation uses the real Source/Account/Review/Plan/Care/Concierge readers, not substitute authority declarations. Kernel HTTP/RPC implementations are inspected context, not executed by these probes.

Original approved input:95388 bytes/SHA256 `c45701f9f54fd2b1dbb09bbd7aa2b9b437e9059aa6032b6f39411fe2e7f6efbd`. Distinct continuation input:100187 bytes/SHA256 `b428b318598df52f12ce3e6ea4ebd350ff9333ee05d9fd8f04a8e845d0c722bc`. Interface pin:11040 bytes/SHA256 `f9ca6fc8dd71187137e4ace340c3cf2e230015039cccf4d1a83c264dffa430b7`. Original raw files and immediate historical receipts were read/hashed in place; no recursive archive copying or foreign execution. Only the exact OLD runtime and two exact old test inputs needed for replay were copied.

## Dependency fingerprint and independent commands

Own Root, portal and session-runtime `node_modules` are absent. No install, clone, link, shim, foreign compiler or dependency acquisition occurred. Native Node type stripping executes the finite tests; it does not typecheck. The conditional same-lock APFS procedure was **NOT ENTERED**, and no dependency-tree parity is claimed.

Four physical own/Parent Root+portal lockfiles and four corresponding packages match byte/mode/device and are nonsymlink regular0644 on device16777230. Root package SHA256 `7da6e48aa5e39a185f10ac117007ee15beb279c4125e1f30f99c92451ff6d968`; portal package `294dbd426b9840bd1d524e443edff4ff3c5026b39e9137c9bf897d156715bb02`. Three tracked locks remain Root `5c57c9aec9e4585066e032e234d610a77cbffd9a51f82700c158fc37fe01b5c2`, portal `bc914f3a9c9f24e44f02e3cff2804651147385ea5abda58a064531329ef23203`, session `4024b48fb339605a438a3bfe68f6e547dade8c86660c6f06b41c278aa2289ba0`. Four physical comparisons and three tracked locks are distinct counts. All91 tracked session-runtime paths and all2133 own-base paths retain their bytes/modes/link identities; none of the runtime was executed. No package/config/compiler flags were changed.

Own evidence home is `.local-artifacts/portal-rebuild/w7-source-credential-r1/`. A new own guard rejects unexpected global fetch before imports. Injected fetches return only finite synthetic native Responses. Exact argv/cwd/exits/raw hashes are in `run-receipts.json` and `independent-receipt.json`.

```sh
python3 .local-artifacts/portal-rebuild/w7-source-credential-r1/prepare.py
python3 .local-artifacts/portal-rebuild/w7-source-credential-r1/run.py

/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node \
  --import ./.local-artifacts/portal-rebuild/w7-source-credential-r1/deny-fetch.mjs \
  --experimental-strip-types --test \
  .local-artifacts/portal-rebuild/w7-source-credential-r1/independent.test.ts
```

The run wrapper records each actual Node exit and restores only its own ignored fixture after OLD input runs. Its shell exit0 is orchestration completion, not a passing OLD assertion. The independent raw capture likewise records actual Node exit1; it does not rewrite that exit as green.

| Independent execution | Actual outcome | Node exit | Raw SHA256 |
| --- | --- | ---: | --- |
| CURRENT exact original19 | 19 pass,0 fail | 0 | `815e05801bf33b1e46db0f75e2fdfa94968dffa520f199500318c592a778f698` |
| Retained pre-CA1 source, SAME final19 | 17 pass,2 fail, both body-getter denials | 1 | `7fe960d4374b46563bc18883afe727ceb859db8c29d4b6247f40ab3ce8354f0f` |
| Unchanged five Account files | 74 pass,0 fail | 0 | `e8809c18cc32648ee6dce4eac6f7d54b217edee2192f7d759607f6b9427a5ac2` |
| Exact old prefetch15 on CURRENT | 14 pass,1 fail, B versus A | 1 | `8637df8fc99dc30b2f03459709b13dcd9dffdc76f420463f34c5946d117c038c` |
| Exact old unparsed-envelope19 on CURRENT | 18 pass,1 fail, exact byte order | 1 | `32859d684f96fd3a18a01eeb70b369c29c1928f66adaac8dc4fead162c05bdea` |
| New independent11 | 6 controls pass,5 assertions fail supporting CA2/CA3 | 1 | `45565326c41afc88ad5b87eecf233024d640ce17f7b4c65aefa63b1830d9b194` |

Every batch has zero skip/cancel. Counts overlap and are not added into acceptance totals. New probe SHA256 `f6f4c50bfb6dfd5c1e2cf8750d360e55aad9f2a2db222e4b9fc13b7b0ac8389d`. Initial nine-registration interactive probe had5 pass/4 fail; adding the denial-abort control and throwing-denial cleanup case gives the retained11 above without changing earlier assertions. No corrected candidate, assertion-filtered run or minimally adapted kernel replay was executed.

## Prior evidence and held integration

**CA1 is addressed for its original body-getter example.** Exact OLD SHA256 `00d857ef7d43b3a1da6aa5ad04d1326b5cacbb40bf916209c81ba0af69f846f7` fails both received-denial cases. CURRENT passes those same19. The OLD-to-CURRENT source also includes the fixed buffer improvement; it is not described as a one-line-only witness. CA2 is a remaining adjacent property-order failure, not a failed reproduction of CA1.

The author’s original absent-constructor0/1 and malformed first scaffold are retained attributed setup/RED history, not independently rerun behavior. The initial0/1 raw hash is `d8c8f120bbdae22b5ecf12845630e64f85b8380a09c1251a4b7fba029c20554c`; the scaffold raw is `22fb99282c74d5e77e68b108055f8bea28d22475d91f68010b75ea5c6c85023b`. The two fact-bound test-input corrections remain separate: disabling prefetch makes mutation occur after actual observation, and `buildSourceRpc` supplies the real parser’s field order. Their old inputs still fail unchanged in this review. No original predicate is relaxed and no old tracked test is changed. Author final19/Account74 and author OLD17 remain attributed beside the fresh results above.

The complete immutable kernel R2 report at `2598e508b86c146518c6c063d8748f03c1f5d6ba`, SHA256 `4385d6dd6b0f7babeed62be2157900771ea07ba9fbb0dfe4b493e455e323e19e`, still reports **SK2/P1**, **SK3/P2**, **SK4/P2**. R1’s SK1/static failure and b8’s targeted correction remain historical. R2 original17/static/temporal/relation raw logs were hashed/read in place, not rerun or turned into this adapter’s proof. Required actions remain the complete CASE source correction, consistent persisted/admitted recording instant, and lawful source lineage/reference permission before version distinctions. No Source SQL was executed here.

Source S1-S10 and Account SAC1-SAC4 histories retain their original scopes and raw/minimally fact-bound/approved/current distinctions. Source raw17=16/17, raw40=39/40, raw11=9/11, scheduling-only10/11, returned-model11/11 and overlapping R5 model results are not summed into this review. Account old-schema failures, d3/raw57 and raw72, post0096/raw53 and raw72, approved fixture successor/current74 remain distinct. The unchanged Account74 rerun validates retained pure contracts; it does not validate SQL producers or consent effects.

**Final private authority remains UNACCEPTED.** Raw credential transports cannot supply post-body current scope/purpose/grant/consent authorization or real cookie/Vault egress. Do not invent a context lookup or boolean callback to pass it. Correct/review CA2/CA3 and kernel SK2/SK3/SK4, establish the exact strict source/test graph, and obtain actual current-authenticated/least-privilege/concurrent persistence evidence before any private endpoint activation. This report grants no SourceReady or import/mount approval.

**Prevented by scope:** DB/SQL/pgTAP/Auth/Storage/native resource/socket/listener/server/browser/provider/deploy/reset/process adoption, physical cancellation/deletion, remote writes and full centrally scheduled npm/Expo/application suites. The known kernel source failure independently prevents dependent native admission. No stopped fixture is inspected, queried, adopted or restarted.

**Unavailable/UNRUN:** focused strict TypeScript source/tests because own compiler dependencies are absent; physical integrated Root/App/runtime graph and mounts; actual Auth/RPC permissions; CI; full current browser/visual/accessibility/human acceptance. No type-stripped or synthetic pass is called compiler or genuine proof. No package/dependency change is made to manufacture that capability.

Full source-format upload/bytes/Storage/inspection/inventory, authenticated private proxy, complete source-aware account/draft deletion, trusted confirmed-end/renewal/correction/obligation producers, authorized manual never-started deletion and END+12-calendar-month physical cleanup remain separate gates. Final approved disclosure/current-policy selection, Account/A03/A08/scoped-agent wiring, actual Root cookie/Vault mounts, full26-screen/secondary/mobile journeys, independent integrated acceptance, exact-head CI, hosted and explicit release authorization remain open. No provider-refused work is rerouted and no client contact, permission, funds or live-source action occurs.

## Sole-report delivery

Only NEW `docs/portal-rebuild/research/W7_SOURCE_CREDENTIAL_ADAPTER_SOURCE_R1.md` is authored tracked work. Candidate/input/protected-byte receipts, original hashes, own fixture parity, local links and ordinary/staged `git diff --check` are verified before the report-only commit. No production/original-test fix, Root/foreign write, nested task, push/PR/comment/watch/merge or additional review round occurs. The containing report commit and clean-tree evidence are returned separately to avoid self-reference. Deliver that sole commit; there are no input-import commits to deliver.
