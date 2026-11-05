# W4 status, 3 November 2026

Owner: Kanuj. Starting baseline: `8c5c6b2d72e75f620487f1b2b110655b03551b17`. Worktree: `/Users/kanuj/.t3/worktrees/shelv/kanuj-w4-checkins-history-20261103`, branch `kanuj/w4-checkins-history-20261103`. Verified runtime: codex, gpt-6.1-sol, xhigh, default tier; Node v22.23.0. No nested agents or genuine Auth/SQL/Storage resources acquired. Author synthetic browser execution and its scheduling error are recorded below.

No C04/C05/J05/J07 capability is newly accepted here. The complete W4 objective is unfinished. Canonical integration status belongs to W0; canonical acceptance evidence belongs to W7.

## First bounded correction: initial actual-use linkage

C05's optional actual-use picker and controller previously collected only `kind:use` history entries. Canonical history also contains an initial `unreviewed_added` use inside `reported_product.event.initialUse`. SQL `review_goal_check` accepts the immutable reported-product event ID as an actual-use reference. The omission hid a valid report and prevented its submission.

The feature-local collector now includes direct use events and non-null initialUse. It preserves the initial event ID, product reference and original occurrence; it does not substitute the later amendment, infer Start or turn a descriptor correction with no initialUse into a use report. Existing canonical Review/Care mappers enforce nested event/product/initial-kind consistency. Client ownership remains session-derived and SQL-authoritative.

Exact consuming tuple: positively mapped `ClientCareHistoryPage`, `reported_product.event.eventId === initialUse.eventId`, same `ReportedProductRef`, `previousVersion:null`, `initialUse.change.kind:unreviewed_added`, no original activation ID. `ReportForm` renders the initial event as an optional choice; controller `sourceIds` admits that same original ID to `GoalReportBody.actualUseEventIds`. No source/private-photo authority follows from the reference.

| Priority | Client task | Observed issue | Smallest correction | Regression | Evidence |
| --- | --- | --- | --- | --- | --- |
| P1 | Link an already reported unreviewed product while sending a check-in | Picker omits the nested initial event; controller refuses it | One collector used by picker and command validation | Actual command/receipt, SSR choice, original date, absent/unknown event refusals | Source/controller/SSR only |

Task trace: history -> send an update -> select an existing actual-use report -> send update -> immutable acknowledged report, or retained unsent answers/status recovery. The correction adds the omitted choice without changing navigation or acknowledgement semantics.

## Observed proof

Evidence directory (ignored): `.local-artifacts/w4/20261103/`.

- OLD `use-linkage-old.tap`: four focused consumer tests, two expected failures (no command confirmation and no selectable initial event), two passing controls. Unchanged production source was still baseline8c5. The original command wrapper ended with `tail`, so its shell exit was0; the raw TAP independently records fail2. This is not a green run.
- CURRENT `use-linkage-current.tap`: same four tests, pass4/fail0/skip0; Node test exit0.
- FINAL `use-linkage-final.tap`: four tests, pass4/fail0/skip0, exit0, after making the descriptor-correction fixture's product version match its previous version.
- CURRENT `history-covering.tap`: `node --test tests/rebuild-history*.test.mjs tests/w4-history-use-linkage.test.mjs`,169/169,0fail/cancel/skip, exit0. This glob includes author synthetic/intercepted module browser execution alongside source/SSR, denial, session, status and restoration controls. It is not SOURCE-only or independent acceptance.
- `npm run typecheck:rebuild`: exit0, unchanged strict frontend configuration.
- At frozen `ee0fddda8b3ad961cf5d3139f887137b328b013b`, root `npm test`, root `npx tsc --noEmit`, root `npm run typecheck:tests`, Portal `npm run typecheck:session`, `EXPO_NO_TELEMETRY=1 npx expo export -p web`, Portal `npm run build` and `npm run build:application` all completed with exit0. Raw artifacts and hashes are in ignored `validation-receipt.json`.
- Full Portal development sweep started before this correction and overlapped source edits. It was interrupted with exit1; it is partial/moving-source, not an exact-baseline or exact-head full pass. A final pinned run remains required.

The author failed to inspect the npm/glob browser composition before launching it. On recognizing the serialized-browser requirement, the full sweep was interrupted through its exact owned npm/runner processes. All three captured PIDs were subsequently absent, and the own-worktree browser process scan was empty. W0 and W7 received the original results and closure qualification. No further author browser run is granted: W7 schedules one admitted browser interval with W0, even for synthetic tests. Pure/model/SSR/compiler/finite HTTP may continue separately.

These local checks do not establish genuine Auth/SQL/Storage, full-frame visual, independent or release acceptance. Hosted exact-head checks are tracked on [PR214](https://github.com/KanujVerma/shelv/pull/214); old-head green/review state does not accept a successor.

## Independent bounded review

W7 independently inspected the exact six-file delta at `ee0fddda8b3ad961cf5d3139f887137b328b013b`: scoped source/SSR PASS, no material finding. Exact Git projections with the identical four successor controls reproduced OLD2pass/2fail/exit1 and CURRENT4pass/0fail/exit0 under Node22.23.0. The first incomplete W7 projection lacked a retained Maya sample import and failed before controls; that setup failure remains separate.

The W7-owned report `docs/portal-rebuild/w7/reviews/W4_LINKAGE_EE0.md` has SHA-256 `ae841cb7c4ae6cce0cdfa742278507a2fe0baadb887970243bdaeefcbc5d2938`; `W4_LINKAGE_RESULT.json` has SHA-256 `ee9d336f16150b9b6b67adac052bc35bf8b04a8669def104d58ed7d29d3c5f50`. Both were read in W7's worktree and remain in its custody pending W0 integration. This lane does not copy or edit the independent report.

The review awards no complete C05/J05/J07, genuine submit/amend/re-login/advisor loop, photo bytes, notification delivery or immutable SQL-effect acceptance. HN1, photo, Guidance, M65 and A07 holds remain. This documentation correction leaves the three production files and regression test byte-identical to the reviewed candidate.

## Open holds and dependencies

- HN1 original source HOLD and Parent's archived correction remain unmodified/unreviewed. W7 has the exact public archive/hash and unchanged ten-file PINS comparison against8c5 for independent source review. No invocation/admission is implied.
- W1 confirms no approved completed-private-storage producer for new C05 photos. Source scope/alias/disclosure lineage, journal/CAS/private-return and SK2/SK3/SK4/provider-photo holds remain. New photoIds remain empty; no legacy upload/source identifier is substituted. Future photo work needs the proper independently reviewed W1 producer and W0 transport integration.
- W2 owns A07/reply/review/private-note UI. Existing Review contract already separates immutable report refs and amendments, client-visible Guidance reply/review, and `append_private_review_note_v1` with no client notification. Guidance/M65/A07 holds remain.
- W7 owns fresh serialized Auth/SQL/Storage/browser execution; stopped fixtures are not queried/reused/restarted. Nonphoto genuine submit/amend/new ordinary login/advisor-read milestone is requested, not executed.

## Next

Complete current-head hosted review/CI for focused PR214 and obtain W0 admission of the independently reviewed production postimages. Await the explicit W4 browser interval and fresh genuine packet. Continue all owned requirements with real persistence/recovery/privacy/320/390/desktop proof; this correction is not full W4 completion.
