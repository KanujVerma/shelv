# W4 status, 3 November 2026

Owner: Kanuj. Starting baseline: `8c5c6b2d72e75f620487f1b2b110655b03551b17`. Worktree: `/Users/kanuj/.t3/worktrees/shelv/kanuj-w4-checkins-history-20261103`, branch `kanuj/w4-checkins-history-20261103`. Verified runtime: codex, gpt-6.1-sol, xhigh, default tier; Node v22.23.0. No nested agents or test resources acquired.

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
- CURRENT `history-covering.tap`: `node --test tests/rebuild-history*.test.mjs tests/w4-history-use-linkage.test.mjs`,169/169,0fail/cancel/skip, exit0. Includes retained SSR, denial, session, status and restoration controls.
- `npm run typecheck:rebuild`: exit0, unchanged strict frontend configuration.
- Full Portal development sweep started before this correction and overlaps source edits. Its result is not an exact-baseline or exact-head gate; a final pinned run remains required.

Controller/SSR evidence is not actual Auth, SQL, Storage, browser, visual, hosted CI or independent review. None of those gates is claimed from these tests.

## Open holds and dependencies

- HN1 original source HOLD and Parent's archived correction remain unmodified/unreviewed. W7 has the exact public archive/hash and unchanged ten-file PINS comparison against8c5 for independent source review. No invocation/admission is implied.
- W1 confirms no approved completed-private-storage producer for new C05 photos. Source scope/alias/disclosure lineage, journal/CAS/private-return and SK2/SK3/SK4/provider-photo holds remain. New photoIds remain empty; no legacy upload/source identifier is substituted. Future photo work needs the proper independently reviewed W1 producer and W0 transport integration.
- W2 owns A07/reply/review/private-note UI. Existing Review contract already separates immutable report refs and amendments, client-visible Guidance reply/review, and `append_private_review_note_v1` with no client notification. Guidance/M65/A07 holds remain.
- W7 owns fresh serialized Auth/SQL/Storage/browser execution; stopped fixtures are not queried/reused/restarted. Nonphoto genuine submit/amend/new ordinary login/advisor-read milestone is requested, not executed.

## Next

Freeze this small correction with exact base/head/diff and file hashes for independent W7 source review. Then deliver a focused integration-targeted PR with exact-head hosted review/CI. Continue all owned requirements with real persistence/recovery/privacy/320/390/desktop proof; do not label this correction as full W4 completion.
