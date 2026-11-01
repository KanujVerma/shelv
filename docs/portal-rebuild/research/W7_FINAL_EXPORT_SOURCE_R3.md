# W7 final-export SOURCE R3

Owner: Kanuj. Date: 1 November 2026. Fresh independent report-only review on frozen Parent `d4a3314ecd81e4c3b544a8919834429e90c05d06`, with only the four allocated final-export inputs through `944229a829f4043764c23a9bad5b526f2e1676c7`.

**Specification/completeness: FAIL. Correctness/quality: FAIL. New FE3/P2 is reproduced.** FE1 and FE2 pass their unchanged original probes. A different public relationship still disappears: which product/routine scope an applicable instruction supersedes. The complete validated units and hashes distinguish the records, while both human-readable serializers produce identical artifacts and both streams commit. Review stops at this first new material finding. No full-scope SOURCE, Account-download or release acceptance is issued.

## FE3/P2: an applicable instruction loses its exact public product/scope binding

Location: [serializer.ts](../../../supabase/functions/concierge-final-export/serializer.ts), `instructionLabel`, line 57; its streaming use in the HTML sink and direct use in `serializeFinalExport`. The product branch returns only name, variant and size. It omits brand and the product-listing position introduced by FE2, and does not identify the applicable routine/decision scope. Both serializers consume this same lossy label. This is an inherited helper defect, not a regression attributed to the `richPlan` correction.

The independent probe uses actual retained `readPlanContent`, actual `projectClientPlan`, actual final-record validator, actual collector and actual HTML sink/direct serializer. No copied validator, successful-port substitute, current-care override or private data is involved:

1. Start from the retained V3 final-export fixture. Define two public products named `Daily Lotion`, with the same `lotion` variant and `89 ml` size, but distinguishable public brands `Alpha Brand` and `Beta Brand`. Give them their actual separate content IDs and two valid routine slots. Both product definitions and both routine entries appear in the identical public plan in A and B.
2. Give both products identical not-reported use with unknown dates. Keep instruction identity/version, effective/publication dates, reason, complete directions, cautions, schedule and original Start identical.
3. A's one separately published applicable instruction targets `slot-1 / product-1`; B's targets `slot-2 / product-2`. Only that instruction binding differs. Both scopes exist in the same plan and are accepted by the real validators. This does not require every routine scope to have a separate instruction revision: the remaining scope retains its published baseline directions.
4. The actual collector verifies each complete synthetic wire, including distinct folded roots and final manifest equality. Each HTML sink commits once and aborts zero times. Both streamed text/HTML outputs are byte-identical between A and B. Both direct text/HTML outputs are likewise byte-identical.
5. Both brands already appear in each plan listing. The instruction nevertheless says `applies to: Daily Lotion · lotion · 89 ml` in both artifacts. Changing the public instruction reason reaches the actual direct output, so the sensitivity control passes before the failing relationship assertion.

Raw result, with both full records, manifests and four output pairs preserved in own `FE3-raw.json`:

```json
{"actualReadPlanContent":true,"actualProjectClientPlan":true,"actualFinalValidator":true,"aScope":{"slotId":"slot-1","productId":"product-1","brand":"Alpha Brand"},"bScope":{"slotId":"slot-2","productId":"product-2","brand":"Beta Brand"},"aRoot":"4e3ba08a4d9a0957d7df7d6b20acdd7f9e48b67831dca478c61da9f074e5d22e","bRoot":"294375630bb1de50ebb8dbdb453021ed4df11bd769141d0962706bccd75eb1f3","aCommits":1,"bCommits":1,"aAborts":0,"bAborts":0,"streamTextEqual":true,"streamHtmlEqual":true,"directTextEqual":true,"directHtmlEqual":true}
```

The new independent test is **0 pass / 1 fail, actual Node exit 1**, with `completed instruction output loses the exact product/routine scope while committing both artifacts`. It was strongly typechecked before execution; the runtime fixture/validation/sensitivity checks pass before this assertion. No subsequent product probe or dependent acceptance check was run.

The artifact explicitly says applicable instructions supersede corresponding published directions. Losing which distinguishable product receives that revision makes the remaining static care record ambiguous. A flat listing of both brands, an instruction UUID without its public mapping, or a correct integrity hash cannot recover the association. This violates complete public identity/instruction fidelity and D11/D17/D18/D32/D38. It is a serializer correctness/completeness finding, not a demonstrated SQL/Auth/ACL defect.

Required owner correction: preserve the instruction's exact public product and routine/decision scope through a human-readable binding, including when labels are identical. Reuse meaningful public identities/document positions where appropriate; do not dump raw domain IDs, invent identities/advice/Start, or expose private fields. Add differential coverage through both real serialization paths and request a NEW independent round with this unchanged probe and all prior evidence. Production and tracked test fixes are outside this review's allocation.

## FE1 and FE2 disposition, with original failures preserved

Both prior reports were read in full, copied and matched to their exact report commits:

- [R1](https://github.com/KanujVerma/shelv/blob/e9e98e53626c0c15fed76c28782b48f39305e6fe/docs/portal-rebuild/research/W7_FINAL_EXPORT_SOURCE_R1.md): 18,509 bytes, SHA-256 `1dbeeae360e5cc6d88d828a3b06e9b9bebb7c45049c96ab53b220e7e046d8d0b`.
- [R2](https://github.com/KanujVerma/shelv/blob/0dbf4a38d272f37721ff05e0f37c8dfcafcc96e2/docs/portal-rebuild/research/W7_FINAL_EXPORT_SOURCE_R2.md): 23,129 bytes, SHA-256 `4e215a6fe890a995e32c553d7b8fab67f93f30d4c7eb8f232d3c895ae63cbb2a`.
- Complete current [author report](W1_FINAL_EXPORT_SOURCE.md): 52,691 bytes, SHA-256 `ea745d38759b7e4aadb9a56e103ccfdadffe064c0b8a8f14d01af4778ef4bab6`, exact `944229a8` blob. Its e03/FE1 prefixes and later FE2 response/qualifications remain preserved.

Original FE1 probe SHA-256 remains `e7d65a111cfd41c85b1f904e648de9332dfe8630117499a832b4b04b155df2bf`; original FE2 probe remains `f8ca531129aa52facdbae7335cded2f834bc46e99e0d96ea7350afdaebf46e8e`. Both were copied unchanged into the same relative-depth own ignored evidence directory. No foreign script was executed. Old controls are explicitly labeled own ignored projections of the current actual source closure, substituting only the exact historical serializer Git blob; current tracked source was never substituted.

- Exact e03 FE1 source and separately executed emitted controls: **1 pass / 1 semantic fail, exit 1**. Unicode/multisegment and segment/kind/leaf/root refusal controls pass; replacement use is missing after commit 1 / abort 0. New FE1 nine on e03 source: **2 pass / 7 omission failures, exit 1**.
- Exact 86b5 FE2 source and separately executed emitted controls: **0 pass / 1 semantic fail, exit 1**. The original membership-only records remain accepted, their roots differ, and all four old outputs are identical. New seventeen on 86b5 emitted code: **1 pass / 16 missing-relationship failures, exit 1**.
- Current original FE1/FE2 probes pass inside the actual bounded **54/54 source** and **54/54 emitted** suites, each exit 0 with zero fail/skip/cancel. Original old FAIL reports/results remain immutable; these are new bounded correction results, not rewritten old verdicts.
- All eight positive FE1 records, complete manifests, direct text/HTML and streamed text/HTML were captured in own files and are **byte-exact across 86b5/current**. Roots, byte/part totals and every recorded metric also match the retained FE1 author proof. The ignored capture copies add output recording only; original tests/probes remain exact and their assertions are unchanged. The local `legacyPresentation` helper is unchanged by FE2.

The FE2 correction changes only production `richPlan`. Actual TypeScript AST/declaration comparison and complete emission confirm **45/46 emitted files byte-exact**, with only serializer.js differing. Numbered product/goal/context items are local document positions; full public context facts print once. Current seventeen exercise recorded/empty/unknown/none membership and basis, goal/product/decision fact links, decision-goal links, routine/decision/guide product links, distinct and identical labels, Unicode/escaping, actual private projection and invalid-reference refusal without commit. The complete relationship control retains **15,000 fact associations and 2,500 goal links**; its 631,018 unit bytes / 21 parts and full-fact-once assertions pass, with streamed text 1,342,894 / HTML 1,343,497 bytes. These bounded positives do not cover FE3's separate instruction-label path or certify a full public-field audit.

The explicitly reported public-model gaps remain distinct: actual Root permits dangling `Guide.productId`, which is labeled unavailable; `ingredientGuideKey` points to a separate app registry, and `guidance.group` is an opaque UI key. `ClientFact` omits private source locations/contradiction links. These gaps do not excuse FE3: its public products and instruction scopes are present, valid and correctly hashed. They authorize neither private projection, invented domain content nor omission of defined public facts.

## Exact runtime, base, imports and dependency custody

Worktree `/Users/kanuj/.t3/worktrees/shelv/t3-ea2cc1e9`, branch `t3/review-final-export-source-r3`, started clean at exact frozen Parent `d4a3314ecd81e4c3b544a8919834429e90c05d06`. Ordered `git cherry-pick -x` imports completed without conflicts:

1. `62ade9161fbc43d264e776acd26c15d9e9b88680` -> `3a3e9c4be1cb85953f583b9477cc63de95cb3a33`.
2. `e03a7e43260ea11e796a023048f571a85df16a6b` -> `3588fc82b6e759b11ea2ddcca4c4ef7710e97fc3`.
3. `86b5c3df4e09d4ca5b3a5ff18ba85dc6916e6a78` -> `f2477fbcccc1dd0a55c9b297928ff8f124691e65`.
4. `944229a829f4043764c23a9bad5b526f2e1676c7` -> `06fbe586ee9db9e2f44ba14d2a7ddb0bd316bee5`.

These four are review inputs, not deliverables. `ce658672a94c58fa0b65c90df26468b3a396f6cf` was skipped only after exact frozen Parent/b43f6a08/ce658 two-blob equality: `ConciergePresentationMapping.ts` = `e2b22cc076b948c396119e52489e3860402aa4a0`; retained Operations handler = `d6e4de498b02d03f3e24913dc37cee2b1c9c9ee3`. A first `b43` abbreviation did not resolve; the full exact commit proof succeeded. No additional ancestor/dependency/foreign SQL stack was imported or handmerged.

All **1,991 frozen Parent tracked paths**, working bytes and modes remain exact, including **113 SQL files / 62 old migrations**. All **18 final-export input paths** match exact current candidate blobs/modes. The sole added candidate migration is `20261101173223_portal_rebuild_final_export_v1.sql`, SHA-256 `4991cce01a59e82aea46a2d4d37db95defe32e473854cd9e494c5a749a7d7166`; source count 63 is not executed canonical63. SQL, Root codecs, runtime, collector, protocol, permissions and old tests remain frozen across both serializer corrections. No Source15/M63-M65, package/config/lock, shared App/gateway or other owner's change was imported or authored.

Parent separately advanced to physical `a06fd0564ec189e8b9c8f2475d1742eb07834418` through its reviewed owner-policy App work. Its final live HEAD matches that steer. The physical Parent is not at this review base. All review/protection comparisons use **frozen Git d4**, with no rebase or advance import.

Authoritative actual taskId, forwarded separately by Parent after the initial gate:
`node:delegated-task:command%3Amcp%3Add730894-0fab-4a94-873d-743422eae122%3Adelegate-task%3Aportal-rebuild-w7-final-export-source-review-20261101-r3`.

Distinct backing childThreadId:
`thread:delegated-task:command%3Amcp%3Add730894-0fab-4a94-873d-743422eae122%3Adelegate-task%3Aportal-rebuild-w7-final-export-source-review-20261101-r3`.

Distinct actual runId:
`run:thread:thread%3Adelegated-task%3Acommand%253Amcp%253Add730894-0fab-4a94-873d-743422eae122%253Adelegate-task%253Aportal-rebuild-w7-final-export-source-review-20261101-r3:ordinal:1`; ordinal **1**. Parent thread is `d632030a-18f7-4dec-a2c9-f5c0418c3fd5`, active run ordinal70, separately queued latest ordinal78. Neither was substituted for this task.

Initial and final LIVE catalog/descriptors, self/Parent configurations and thread reads establish **codex / gpt-6.1-sol / reasoningEffort=xhigh / serviceTier=default**, default interaction, full-access runtime. Actual Sol descriptors include both selected values. Project saved default is null; explicit thread selections, project defaults and all eight role pins independently establish Sol/xhigh/max8. Initial active inventory was eight including Parent; this review spawned no nested agent. Explicit `/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node` is **v22.23.0** initially and finally.

The exact-lock APFS dependency projection was performed only after the precise allocation:

- Both own dependency directories were absent and ignored. Four physical root/portal lockfiles matched. Source/destination roots and ancestors were nonsymlinks, same device; literal links were inspected before clone.
- Initial strict dependency-subtree containment rejected the known portal workspace link before any copy. Parent explicitly allocated `shelv-advisor-session-candidate -> ../session-integration/runtime`: outside node_modules, inside the same checkout. Its literal link is identical, own resolved target is nonsymlink and inside this checkout, and corresponding tracked runtime source/package bytes/modes match frozen d4 and current Parent. It never points into a foreign worktree.
- Parent-generated `.test-build`/`dist` outputs are absent here and were not imported/executed. A broader runtime-directory comparison stopped on those extra generated outputs; the allocated check correctly binds corresponding source/package files rather than claiming generated-directory parity.
- Full physical dependency manifests, file hashes/modes and literal link targets match after `/bin/cp -cR`: **43,212 root entries and 9,070 portal entries**. All other links resolve within the same checkout. No install, fallback compiler, shim, Auth copy, package write or flag lowering occurred.

## Source observations and acceptance held at FE3

The full supplied original goal, D01-D48 and desktop specification govern. All five approved provenance files match recorded bytes/hashes, including the original **95,388-byte** input SHA-256 `c45701f9f54fd2b1dbb09bbd7aa2b9b437e9059aa6032b6f39411fe2e7f6efbd`. Root/portal instructions, rebuild contracts/status/ownership and the all26 audit provide context, not screen acceptance. The [post30 static-export decision](../DECISION_ADDENDA.md#static-final-export-after-the-read-only-window-1-november-2026) remains own-client authenticated static last-entitled care; it does not extend support or expose private sources.

Current full candidate SQL/codecs/collector/serializer and finite handler/runtime composition were inspected before the new finding. Bounded observations, not a completed audit:

- Exactly two READ actions under fixed `concierge_final_export_command_v1`, with no client/actor/role/current/clock/RPC/URL selector. Pair `partIndex`, selection basis/hash profile and folded root are frozen. Unit0 is public plan/careBasis/use; subsequent complete instructions are UUID ordered. Segments use 32,768 Unicode scalars and 400,000 predecode bytes.
- SQL source selects an actual exclusive Chicago support end and last entitled pre-end publication, applicable completed pre-end instructions and effective pre-end use/amendments/activations. Unknown/missing bases remain unavailable. Requested part construction is per unit rather than complete-bundle reconstruction. Full ordered metadata relations participate in selection, not only maximum heads.
- The own-client wrapper invokes retained current session/target checks before/after its client advisory wait and at final return, with final selection equality. Fourteen private invoker helpers have empty search paths and explicit revokes; the one fixed authenticated definer wrapper has explicit PUBLIC/anon/service_role revokes. These are text observations, not executed SQL/ACL/concurrency proof.
- Actual collector detaches and positively validates units, freezes models, verifies exact ordering/counts/leaves/folded root, then re-reads current manifest before sink commit. Tests exercise mutation, captured sink methods, reentrancy, failures and abort/discard. Actual HTTP runtime cancels the 400,001-byte successful RPC control before retained decoding, under global external-fetch denial. This is finite synthetic source composition, not genuine Auth or persistence.

Exact current UTF-8 framing, H = SHA-256, LF = U+000A, canonical decimal integers, lowercase hashes, zero-based ordinal:

```text
leaf = H("shelv.final-export.segment.v1\n" + unitIndex + "\n" + kind + "\n"
         + segmentIndex + "\n" + segmentCount + "\n" + UTF8(text).length + "\n" + text)
state0 = H("shelv.final-export.root.v1\n" + selectionHash + "\n"
           + unitCount + "\n" + instructionCount + "\n")
stateNext = H("shelv.final-export.fold.v1\n" + state + "\n" + ordinal + "\n" + leaf + "\n")
root = H("shelv.final-export.complete.v1\n" + state + "\n" + partCount + "\n"
         + totalBytes + "\n" + unitCount + "\n" + instructionCount + "\n")
```

Selection starts with H(`shelv.final-export.selection.v1\n` + UTF8 byte length of care JSONB text + LF + that text); each metadata step is H(`shelv.final-export.selection.fold.v1\n` + previous + LF + domain + LF + UTF8 byte length of item JSONB text + LF + that text). Ordered domains are plan identity/hash, instruction descriptors by UUID, pre-end care references by revision/ID, amendments/predecessors by revision/ID and applicable legacy activations by integer ID. PostgreSQL JSONB arrays/lowercase UUIDs/UTC6 instants define source formatting. No unshown trailing newline is implied. Integrity is consistency, not public-output completeness or permission.

Source bounds remain 14,772,736 plan-unit bytes and 865,536 instruction-unit bytes, including wrappers/use. Their derivation and repeated SQL descriptor/history scans, TOAST/detoast, I/O, latency, timeouts and legal-maximum practicality remain unaccepted. Original author lazy rich proof is **preserved author evidence only, not rerun**: 2,551 units / 10,233 parts / 308,950,390 unit bytes / 310,669,457 staged HTML bytes; unit0 2,862,500 bytes. Heap samples including 202,734,632 are samples at write boundaries, not maxima, Edge/PG/browser observations or backing-store/download proof.

The original62ade scalar-index/full-bundle/whole-record-hash profile remains superseded and preserved. R1 public final-record support remains a separate completion gap: actual baselines have immutable-update/writer set-equality guards; private `plan_legacy_adoptions` is a working-draft/intake snapshot, not this profile's final public publication. `legacy_snapshot_missing` is honest unavailable. No claim of total raw R1 fact loss, private-adoption export or fabricated V3 identity is adopted.

**Uncompleted source requirements are not waived:** full retained service/end/entitlement/publication/instruction/use reconciliation; complete current guard/lock/ACL audit; all public-field/card-kind/scope relationships; full sink ownership/error matrix; legal maximum bounds and practical SQL/runtime costs. FE3 prevents full-scope admission despite the passing bounded checks. Canonical pgTAP is authored **UNRUN**.

## Commands, evidence and setup qualifications

Own ignored evidence is `.local-artifacts/portal-rebuild/w7-final-export-source-r3/`. Each actual test/compiler invocation has a full log and `.command.json` with exact argv/cwd/exit/hash. Representative commands, using explicit Node22.23.0 throughout:

```sh
python3 .local-artifacts/portal-rebuild/w7-final-export-source-r3/run.py current-source /Users/kanuj/.nvm/versions/node/v22.23.0/bin/node --require ./.local-artifacts/portal-rebuild/w7-final-export-source-r3/deny-fetch.cjs --experimental-strip-types --test --test-concurrency=1 tests/portal-final-export.test.ts tests/portal-final-export-http.test.ts tests/portal-final-export-bounds.test.ts tests/portal-final-export-r2-use.test.ts tests/portal-final-export-context-membership.test.ts .local-artifacts/portal-rebuild/w7-final-export-source-r3/independent-controls.test.ts .local-artifacts/portal-rebuild/w7-final-export-source-r3/independent-public-context.test.ts
python3 .local-artifacts/portal-rebuild/w7-final-export-source-r3/run.py compile /Users/kanuj/.nvm/versions/node/v22.23.0/bin/node .local-artifacts/portal-rebuild/w7-final-export-source-r3/compile-proof.cjs
python3 .local-artifacts/portal-rebuild/w7-final-export-source-r3/run.py independent-instruction-binding /Users/kanuj/.nvm/versions/node/v22.23.0/bin/node --require ./.local-artifacts/portal-rebuild/w7-final-export-source-r3/deny-fetch.cjs --experimental-strip-types --test .local-artifacts/portal-rebuild/w7-final-export-source-r3/independent-instruction-binding.test.ts
git diff --check
```

Current source54/emitted54/retained13 and all current strict checks exit0; original semantic RED controls and FE3 exit1 as specified above. Real TS **6.0.3**, Node declarations **22.20.3**, undici-types **6.21.0**, `strict`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`, `skipLibCheck:false` produce zero diagnostics across the actual **210-file** original probe/candidate closure. `listFilesOnly` matches that program exactly. e03/86b5/current serializer programs compile without diagnostics. An additional noEmit configuration including the new FE3 probe also exits0 before execution. No emitted FE3 runtime result is inferred: FE3 is source-executed. Neither the giant rich-stream case nor full npm/Root/Expo/App/CI was run.

Full original-author/FE1/FE2 evidence was copied and hash-checked: **188 / 128 / 495 files**, respectively, including original briefs/report responses, raw RED/GREEN controls, terminal receipts, compiler/closure proofs, byte deltas and preserved faults. The original and FE1 terminal manifests' **186 / 125 listed artifacts** and the FE1/FE2 command-log hashes were independently checked. These copied historical results are attributed, distinct from this review's executed results.

Own setup qualifications are preserved and confer no product finding: an absent-directory `git check-ignore` invocation was corrected to check an ignored child; initial dependency-subtree containment stopped before any clone and received the exact workspace-link allocation; an ignored script indentation error prevented execution; a broader runtime parity check found only generated outputs. Output capture first used long TAP JSON lines, which were unsuitable for direct JSON parsing; the original logs/copies remain, and separate file captures establish exact eight-case bytes. That analysis interruption prevented creation of a new-probe config, so one `TS5058` absent-config invocation failed before typechecking; its receipt is preserved separately and the actual created-config check subsequently exits0. The copied e03 compile receipt initially retained a hardcoded `richPlan` label; its original receipt remains and the corrected replay records both changed functions `richPlan`/`legacyPresentation`. A tool-orchestration syntax error executed no shell command. No failed attempt was erased or counted as a successful product check. All earlier author/reviewer setup faults, original six-diagnostic type-erasure proof and R2 reserved-zsh-status qualification remain preserved, not rerun or relabeled.

No browser/preview/native/process inventory, PG/DB/SQL execution, Supabase/resource/provider CLI, live Auth/Storage/provider/credentials, network service, real-client download/send/funds/notification or other resource action occurred. Pure Node/compiler and finite in-process HTTP are the only executed product checks. Blocked Guidance private-return/M65 work was not retried, rephrased or rerouted. No source/test fix, Root/shared activation, push, PR, merge or deployment occurred.

## Terminal handoff

Deliver **only this report commit**, not its four review-input ancestors. The sole authored tracked path is this new report; protected files and input blobs remain exact. Final path/link/scope/whitespace and report-only commit checks are recorded in own terminal evidence. The local commit hash is returned separately to avoid a self-reference.

FE1/FE2 are closed only for the reproduced bounded vectors. **FE3 blocks R3 admission.** Owner correction and a new independent round must preserve all three reviews/raws and finish the remaining source audit. Separately granted owned-PG/canonical preservation/ACL/race/performance, R1 public final producer, shared transport admission, actual Account private staging/Blob/post30 download, genuine Auth/persistence/browser/visual/accessibility/comprehension, exact-head CI and release approval remain open. No full Account, final-export feature, all26-screen or full approved rebuild completion is claimed.
