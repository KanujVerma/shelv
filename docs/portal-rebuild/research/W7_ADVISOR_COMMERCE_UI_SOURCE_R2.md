# W7 advisor Commerce UI independent SOURCE review R2

1 November 2026. Owner: Kanuj. **Allocated source SPEC/completeness: FAIL. Source correctness/quality: FAIL.** The unchanged AC1 probe now passes, but independent adjacent case **AC2/P2** finds that a matching committed status silently changes the external-store snapshot after a newer refresh. The original intent is resolved internally while subscribers still observe it as unresolved. Dependent acceptance stopped at this first new material finding. No production or tracked test fix was made.

These are bounded source verdicts. Full Commerce and approved portal acceptance remain OPEN. Historical R1 FAIL at `eb04bcf3c204144898cf7ecd1f617a2f5be15f9c` remains immutable. This report does not accept financial backend behavior, mounted App, SSR, browser, genuine Auth, SQL, CI or release.

## AC2 / P2: committed status changes recovery state without notifying the workspace

Location: [controller.ts:317](../../../apps/portal/src/features/advisor/commerce/controller.ts#L317), within `checkStatus()`. `pending(null)` clears the actual boundary-memory intent and replaces `state`. When `view !== token`, the following `set(...)` is skipped and nothing calls `emit()`. The returned snapshot has changed without notifying subscribers.

The actual [workspace](../../../apps/portal/src/features/advisor/commerce/AdvisorCommerceWorkspace.tsx#L12) consumes `controller.subscribe` and `controller.getSnapshot` through `useSyncExternalStore`. Its unresolved notice/status button and available actions depend on `s.pending`. A subscribed consumer therefore can keep the old unresolved display until another event or render reads the new snapshot. The missing subscription notification is independently observed; the React display consequence is source inference, not a mounted React/DOM/browser result.

Independent reproduction uses only an incomplete, nonpayable quote draft through actual ApplicationSession, retained advisor cookie, creation-bound raw request and Root parser/hash/positive mapper:

1. Read the actual synthetic advisor session and draft. Deliberately dispatch its save; the closed synthetic HTTP503 leaves the exact UUID/body/hash/wire unresolved.
2. Restore the same actual session through its ordinary session response and refresh current records. No readiness/current/owner override is supplied.
3. Start `checkStatus()` for that original intent and hold a valid, exact committed draft receipt. Root validates the actor/request/hash/action/client/entity/CAS bindings; no financial acknowledgement is used.
4. Complete a newer B refresh while status A is held. Subscribe to the now-ready B snapshot, then release the status response.
5. Internal `pending` becomes null, B records remain ready, cookie and boundary remain current, but the subscription fires zero times and its last observed snapshot still contains the original pending request.

```text
same-view control: notifications=1, observedPending=null, actualPending=null
newer B case:      notifications=0, observedPending=original UUID, actualPending=null
                   phase=ready, sameProjection=true, cookie=ready, boundary=true
```

The two-test independent execution is **1 pass / 1 intended failure**, exit1, zero skips/cancellations. This is not a malformed receipt, setup failure, loss of pending custody, authority bypass or financial-effect claim. The matching receipt legitimately resolves A. The defect is failure to publish that resolution to the subscribed workspace. The current author test named `matching original committed status after B loads settles A without rewriting B` checks internal pending/projection state, but does not assert subscriber notification.

Required correction: notify recovery-state observers when the original intent settles across views, while preserving B's projection/notice/authority and all current denial/session cleanup. The correction must not restore an obsolete receipt as B's current record, clear a different pending intent, or reapply/retry automatically. No implementation is independently verified here.

Evidence: [independent probe](../../../.local-artifacts/w7-advisor-commerce-source-r2/status-observer.test.mjs), [raw failure](../../../.local-artifacts/w7-advisor-commerce-source-r2/independent-status-observer-1793565165641.log), [exact command/exit receipt](../../../.local-artifacts/w7-advisor-commerce-source-r2/independent-status-observer-1793565165641.json). Probe SHA256 is `503b74beed68688b5b052cbca109fec1f25587b02b5a5fac3efacaf09fdf9cb2`; raw failure SHA256 is `1ddeefda372894885adc460c77e25c6f07f5c6a9fdc06f1217c1cda7b8ec92bc`.

## AC1 disposition and unchanged reproduction

The original terminal R1 two-test probe was copied into this worktree's own ignored namespace at the same relative depth. Its bytes and assertions remain unchanged, SHA256 `a1ecf1d25eb5a8e10e72c38da8b019f5901ba857241d2ef4fb0a3e62813d2df1`. No foreign saved script was executed directly.

Before importing the fifth correction, own head `38679c49446bf1ac501d06483cd4a790a15e0db0` has the exact old controller blob `411cb9ceab0781d1f55d3d35dc2bd1da6644fd7f`. The unchanged probe gives **1 pass / 1 substantive AC1 failure**, exit1: `ready/1 -> denied/0`, with exact pending wire, ready cookie and current original boundary. After importing `322eb864`, own tested head `40373a53ecb87260169718b54e9e82adb2ffb1c3` gives **2/2**, exit0: `ready/1 -> ready/1`, preserving exact uncertainty. Both runs have zero skips/cancellations.

The nine added controller lines separate original write recovery from the captured view's permission to clear/relabel current projections. **AC1 is addressed on the unchanged independent vector.** That bounded result does not self-verify all author22 lifecycle cases or close AC2. The original same-view failure control still retains its dispatched draft. The original probe's terminal internal resource assertion reports only two Node pipe handles; it is not an OS process/resource inventory.

[Original probe copy](../../../.local-artifacts/w7-advisor-commerce-source-r2/late-write.test.mjs), [old raw failure](../../../.local-artifacts/w7-advisor-commerce-source-r2/unchanged-r1-old-1793565095397.log), [successor raw result](../../../.local-artifacts/w7-advisor-commerce-source-r2/unchanged-r1-successor-1793565151064.log). No assertion, cap, timeout, production file or compiler flag was changed.

## Actual identity, live gates and frozen Parent

| Item | Observed evidence |
| --- | --- |
| Own T3 worktree / branch | `/Users/kanuj/.t3/worktrees/shelv/t3-67216ca1` / `t3/advisor-commerce-source-r2` |
| Exact clean allocated base | `d4a3314ecd81e4c3b544a8919834429e90c05d06` |
| Exact tested successor | `40373a53ecb87260169718b54e9e82adb2ffb1c3` |
| Actual Parent thread | `d632030a-18f7-4dec-a2c9-f5c0418c3fd5` |
| Actual Parent worktree | `/Users/kanuj/.t3/worktrees/shelv/kanuj-portal-rebuild-integration-20261030` |
| Project | `ac0af19d-d404-4f53-a870-02bfd76c2a80` |
| Initial AND final live catalog/self/actual Parent configuration | `codex / gpt-6.1-sol / reasoningEffort=xhigh / serviceTier=default`, full-access/default interaction |
| Live Sol descriptors | Effort low/medium/high/xhigh/max/ultra; tier default/priority, default=default |
| Project selection | T3 `defaultModelSelection=null`, distinct from explicit thread selections |
| Persisted pins | Both actual worktrees' project/default-subagent and all eight role files assert Sol/xhigh; no settings changed |
| Actual Node initially/finally | `/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node`, `v22.23.0`, matching bin first in every execution PATH |
| Installed configuration gate | codex-cli0.164.0; `codex app-server --strict-config --print-startup-config` exits0 in both worktrees |

The shell's initial default Node was v20.11.0. Explicit Node22.23.0 was selected and verified before source review or probes; no probe used the default Node. Initial self and Parent configuration calls each had a transport-send failure, retained in the timeline/receipts; corrected bounded reads succeeded before the gate. No model fallback or configuration mutation occurred.

Authoritative actual delegate return taskId, supplied separately by Parent after the initial gate:

`node:delegated-task:command%3Amcp%3Add730894-0fab-4a94-873d-743422eae122%3Adelegate-task%3Aportal-rebuild-w7-advisor-commerce-ui-source-review-20261101-r2`

Separately observed childThreadId:

`thread:delegated-task:command%3Amcp%3Add730894-0fab-4a94-873d-743422eae122%3Adelegate-task%3Aportal-rebuild-w7-advisor-commerce-ui-source-review-20261101-r2`

Separately observed actual run, ordinal1, requested20:27:33.402Z / started20:27:46.765Z:

`run:thread:thread%3Adelegated-task%3Acommand%253Amcp%253Add730894-0fab-4a94-873d-743422eae122%253Adelegate-task%253Aportal-rebuild-w7-advisor-commerce-ui-source-review-20261101-r2:ordinal:1`

The taskId was not inferred from either encoded identifier. The catalog field named parentThreadId identifies this caller in this harness; durable metadata supplies the actual Parent. Initial gate and AC2 were forwarded to Parent. No nested agent was created.

Physical Parent was independently observed clean at `a06fd0564ec189e8b9c8f2475d1742eb07834418`. Parent explicitly reconciled its intentional advance through f1d8e75b/eef72117/a06fd056: reviewed owner-policy App code, tests and docs across five paths plus a new report. **Physical Parent is not same-base and that advance is not docs-only.** All import/protected-file comparisons use frozen Git d4, not evolving Parent HEAD. No rebase, extra ancestor import or Parent edit occurred. Existing d4 type-only prerequisite was already present and was not replayed.

[Initial runtime](../../../.local-artifacts/w7-advisor-commerce-source-r2/initial-runtime.json), [final live runtime](../../../.local-artifacts/w7-advisor-commerce-source-r2/final-runtime.json), [pins](../../../.local-artifacts/w7-advisor-commerce-source-r2/model-pins.json) and [complete dispatch/steering record](../../../.local-artifacts/w7-advisor-commerce-source-r2/dispatch-and-steering.json) retain source observations. The complete current task message was recovered in three text segments without truncation, separately from the historical author brief. Historical max8 files were preserved, not treated as authority to nest or change settings.

## Exact ordered imports and preservation

Each commit's exact raw changed paths/modes was inspected before any import. All22 final candidate paths were absent from frozen d4. Exactly these inputs were cherry-picked with `-x`, in order, with no conflict or manual resolution:

| Original candidate | Own attributed import |
| --- | --- |
| `0f48053d48965212e6afbe7b66470b8619fec087` | `1192a72209728cb2fdd748f1924f63362f0294c2` |
| `51b9b3d4c2ad06a2e11ce932057c1a727ca31e38` | `33d52c8938002c5ca90b88315355a8e5c8bf03ee` |
| `fc9fa767267f100cf714842a0b6ad3fb7d000eaa` | `e189f60475487f7fdcf0304022489bf27c9a95d6` |
| `7e19a1886f2a9b3f7dff02bd671b985ce33cbb26` | `38679c49446bf1ac501d06483cd4a790a15e0db0` |
| `322eb8645b9795f3ad7d52f4b38ef5fd986d4549` | `40373a53ecb87260169718b54e9e82adb2ffb1c3` |

All22 final paths/modes/blobs/SHA256 values equal exact322eb864: five dependency files, ten advisor-commerce source files, six matching test/fixture files and the author report. No unrelated ancestor, existing App/navigation, SDK neighbor, financial handler or SQL input was imported. The five dependency blobs remain exactly their frozen upstream inputs:

| Path | Upstream | Git blob |
| --- | --- | --- |
| `src/contracts/PortalCommerce.ts` | `60332e7ffdebfff81bc020dbfb8346bce11467ef` | `9f07f7eec973f58a5962de87750b0e51b6129b24` |
| `src/contracts/PortalCommerceValues.ts` | same | `a7ffa8950399e99fab2fd3497ef656238497c4dd` |
| `src/contracts/PortalCommerceValidation.ts` | same | `d7c956b34856d23c6e25a368beadbd53bddac1f5` |
| `src/contracts/PortalCommerceMapping.ts` | same | `40ac544c3afba07ca3c84ed06336b76be78fcc18` |
| `apps/portal/src/app/commerce-request.ts` | `055065f5f1d95e7df2a68b74bff2bc8ba1cea138` | `e549793199f8ea240ccc34e3c4124e07ff5e302f` |

Finding-bearing current controller blob is `8a0c16870c4318be3deadc79730a2960512bd328`, SHA256 `e82a04b66b1b2eaf0530fcad4fd8255c3461c823065e72cb51a3713c76eabe78`. [Candidate manifest](../../../.local-artifacts/w7-advisor-commerce-source-r2/candidate-manifest.json) lists every exact final blob, size, mode100644 and hash.

All **1,991 frozen d4 tracked files** retain exact working bytes and executable modes, including **62 canonical migrations /113 SQL files**, old tests, configuration/roles, packages/locks, Auth/Payment, Application/navigation and all nonallocated paths. SQL preservation is hash-only; no financial backend/SQL semantic probe or execution was performed. [Initial tree](../../../.local-artifacts/w7-advisor-commerce-source-r2/initial-tree.txt) and [terminal preservation](../../../.local-artifacts/w7-advisor-commerce-source-r2/terminal-preservation.json) bind these checks to frozen d4.

Root lock remains `5c57c9aec9e4585066e032e234d610a77cbffd9a51f82700c158fc37fe01b5c2`; portal lock remains `bc914f3a9c9f24e44f02e3cff2804651147385ea5abda58a064531329ef23203`. Own root and portal node_modules were absent and remain absent. AC2 stopped dependent acceptance before any dependency preparation: no clone/install/shim/declaration copy, dependency change, relaxed flag or compiler run occurred. Normal Git hook path was inspected and contains no active nonsample hook; no bypass was used. No external fetch or remote-freshness/CI claim is made.

## Requirements, original evidence and attribution

The complete supplied current brief, historical original author brief, approved input/A/B/C/D01-D48,26-screen specification/manifest, applicable root/portal instructions, rebuild entry/contracts/workstreams/status/addenda and retained review contexts govern. The five supplied originals match INPUT_PROVENANCE exactly. The full decision register, full desktop specification and full manifest are also verified verbatim embedded in the approved input. Declared unavailable preapproval originals remain unavailable.

Approved input is **95,388 bytes /SHA256 `c45701f9f54fd2b1dbb09bbd7aa2b9b437e9059aa6032b6f39411fe2e7f6efbd`**. The full actual historical author task is **100,864 bytes /SHA256 `8f40e08c0d70cafd9ebf47bddfbd75ba5d90b9738e0835da7315e9353d38f97d`**. These are distinct from the current R2 dispatch. [Requirements audit](../../../.local-artifacts/w7-advisor-commerce-source-r2/requirements-audit.json) retains sections, identities and26-screen inventory.

Originals were copied/hash-audited read-only into own ignored evidence: all79 original author artifacts/1,594,084bytes; all289 AC1 namespace files/5,526,867bytes including its252 prior-review copies; and all252 R1 reviewer artifacts/4,926,744bytes. These are bounded evidence namespaces, not foreign workspaces or dependencies. All635 original/context copies including15 current requirement files total12,369,864bytes. Their byte parity is asserted; no foreign saved script was directly executed. Original logs, setup failures, author response and R1 report are retained unchanged. [Copy manifest](../../../.local-artifacts/w7-advisor-commerce-source-r2/originals-manifest.json), [raw text audit](../../../.local-artifacts/w7-advisor-commerce-source-r2/raw-audit.json) and [archival counts](../../../.local-artifacts/w7-advisor-commerce-source-r2/archival-counts.json) preserve provenance.

Immutable contract R4c4099c26, transport R10ed0d91f, client UI R32d21b1d6 and complete W5 CU1-CU4 response1a08cb09 copies match their exact Git objects and hashes. The complete current advisor author report matches322eb864; the original R1 report matcheseb04bcf3. Actual controller, port, raw request, ApplicationSession, retained-cookie/transport boundary, Root status/receipt binding and staged UI/shared-wrapper source were inspected. No successful authority/operation port, owner bit, finance bit, isCurrent result, crypto implementation or connected provider was substituted by the independent probes.

| Retained evidence | Actual attributed result / qualification |
| --- | --- |
| Author unchanged R1 probe before/after correction | 1pass/1AC1fail ->2/2; independently repeated here above |
| Author new ownership matrix | Initial18=10pass/8fail includes one invalid VIEW:false signed-in DTO setup; valid RED18=11pass/7 substantive fail; corrected18/18, then22/22 |
| Author original40 +new22 | 62/62, exit0, zero skip/cancel; NOT independently replayed after AC2 |
| Author retained20 +reviewer2 | 22/22, with20 and2 distinct; NOT independently replayed here |
| Author frontend/session/transitive strong graphs | Three exit0/empty diagnostic logs, TS6.0.3 and original strict/noUnchecked/verbatim/skipLibCheck:false; attributed, not independent compiler proof |
| Author source SSR/maximum/write:false | Attributed40/62 includes actual shared wrappers, all50 lines/101 options/seven pages/full terms hash, final seller/truncation negatives; not independent SSR/maximum acceptance here |
| Original source RED/setup history | Two meaningful pre-adapter HTTP egress REDs; initial missing-controller1/11 and incomplete-routing5/9; invalid unknown-terms setup; source-valid incomplete ready-line RED/GREEN; SSR filename/SIGABRT and escaped-ampersand setup; missing CSS declaration TS2882 remain distinct |
| Prior client raw/adapted/current | Original36 fe0=36/36, a3=29/7, raw current=13/23, minimally fixture-adapted current=36/36; old13 raw/current and USD-only11/2 are not interchangeable green results |
| Prior CU4 | Original unchanged six old2/4 ->then-current6/6; historical source readiness result, not this advisor acceptance |

The author's initial18 failure retains its unreleased held-reply15-second cleanup delay and corrected signed-out DTO control. Neither is silently counted as an additional AC1 defect. This review's AC2 probe has no setup correction or assertion adaptation. Existing typeless-package warnings remain. No historical failure is relabeled as a current pass.

## Allocated behavior and full completeness debt

| Requirement | This review's bounded disposition |
| --- | --- |
| Original/current async owners and exact recovery | Unchanged AC1 vector passes; AC2 subscriber publication fails. Broader status/receipt/denial/day/generation/reentrant matrix remains author-only/held after AC2 |
| Advisor action closure and permissions | Source uses closed advisor lists, actual VIEW/EDIT/confirmPayments and creation-bound cookie; no inferred owner. Exhaustive client accept/claim/receive/return/refund/details and role/finance matrices are held, not independently accepted |
| Complete quote/claim/issue basis | Source uses actual mapped USD/cents/address/target/CAS and complete component hash; ready header alone is insufficient. Independent50-line/101-option/final-option mutation and all money/claim cases remain held |
| Task UI and private facts | Structured shared wrappers and manual-evidence limits are source-inspected. No JSON editor, fake uploader, invented founder display name or automatic money/retailer action is accepted as a feature. SSR, actual form interaction and mounted App remain unrun |
| Operational events | Purchase, fulfillment, return, retailer funds, client repayment and service request remain distinct source actions. No eligibility, actual funds or retailer/provider outcome is established |
| Missing creation authority | Trusted referral/reconciliation creation CAS heads remain UNAVAILABLE FULL COMMERCE DEBT. No zero, serviceRevision, entity head, DTO-only field or owner inference supplies them |
| Private-evidence producer/owner projection | Reader/uploader and actual owner-status/producer seams remain unavailable. No fabricated proof or new port/right is supplied; these full-goal requirements are not waived |

Contract/transport scoped PASS does not establish Root financial admission. No M63-M65 source/probe/backend replay, financial success acknowledgement, provider-blocked Guidance/private-return retry/rephrase/reroute, SQL execution or Supabase allocation occurred. All later genuine/financial decisions remain with Parent under separate authority.

## Executed commands, held gates and terminal disposition

All three probe executions use the absolute Node22 executable and matching first PATH. The copied bounded runner prints the actual child exit/signal before writing unique immutable raw log/JSON receipts. Synthetic HTTP is confined to the fixture's fixed `/api/advisor/session` and `/api/advisor/commerce` paths; global external fetch is denied and restored. Positive receipts concern only incomplete nonpayable drafts.

```sh
PATH=/Users/kanuj/.nvm/versions/node/v22.23.0/bin:$PATH \
/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node \
  .local-artifacts/w7-advisor-commerce-source-r2/run.mjs unchanged-r1-old \
  --experimental-strip-types --test --test-concurrency=1 \
  .local-artifacts/w7-advisor-commerce-source-r2/late-write.test.mjs
```

The exact successor command changes only the output label to `unchanged-r1-successor`, after the fifth attributed import. The independent command changes the label to `independent-status-observer` and test path to `.local-artifacts/w7-advisor-commerce-source-r2/status-observer.test.mjs`. Receipts retain complete argv and actual statuses: old exit1/1pass1fail; successor exit0/2pass; independent exit1/1pass1fail, all zero skip/cancel. These overlapping finite tests are not summed into coverage or genuine acceptance.

Protected-file/candidate/original-byte/configuration checks pass. Report validation checks local links, sole authored tracked scope and `git diff --check` before ordinary local commit. The report-only commit SHA is returned separately; five source imports are review inputs, excluded from the delivery commit.

Not run after the mandatory AC2 stop: independent author62/retained20+review2; remaining lifecycle/private-role/max-option/canary controls; strict/frontend/session/test-type compilation; SSR/UI/write:false builds; Root whole npm/tests/Expo/native; mounted Application/forms/routes/Back/focus; browser/preview/DOM/pixel/mobile/keyboard/zoom/accessibility/human comprehension; genuine Auth/persistence/Vault/provider/Storage/Bank/financial/retailer outcomes; migrations/RLS/concurrency/SQL; hosted/exact-head CI/cutover/rollback/release. None is a pass or waived requirement. No dependency preparation was necessary.

No browser/preview/launcher/OS-process inventory/native/DB/Auth/Storage/provider/credential/network-service/fixture resource, SQL execution, Supabase allocation, server/listener or nested work was acquired. No Parent edit, production/test fix, real client/publication/message/funds/order/fulfillment/permission action, push/PR/merge/deploy, resource request or polling/grant wait loop occurred. Own ignored evidence remains at `.local-artifacts/w7-advisor-commerce-source-r2/`; it is not carried by the report commit. No resource is held or awaited.

**SPEC/completeness FAIL:** original uncertainty can settle without publishing its recovery result to the workspace; declared creation/evidence/App/full-goal debt remains open. **Correctness/quality FAIL:** AC2/P2 reproduces through actual source/session/Root composition despite the exact AC1 vector passing. Parent owns any correction, new independent review and canonical status/CONTEXT_SYNC reconciliation. Full approved-goal acceptance remains OPEN.
