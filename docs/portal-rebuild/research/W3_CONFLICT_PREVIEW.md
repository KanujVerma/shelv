# W3 conflict follow-up and unpublished preview

30 October 2026. Bounded implementation, independent review required. No nested agents.

## Verified starting state and execution plan

Workspace `/Users/kanuj/.t3/worktrees/shelv/t3-79857c61`, branch `t3/fix-review-conflict-preview`, clean source base `fb853a31e39adcdea738db327a30b1e03c5f79d2`. Its parent is `610e6b9`; the W7 R2 report bytes match `71c18a57d35839ed59f160c43a55419cd8a18f6e`, whose other ancestry is different. First live capabilities and thread configuration both returned `codex / gpt-6.1-sol / reasoningEffort=xhigh / serviceTier=default`. No nested agents. Fresh fetch: `origin/main=d39a7d4943209080df7c4cf97d85784f462758bf`.

Approved parent read-only Back seam `07f63c937c78ee35ef17687e239b2de17d0b2082` alone was cherry-picked as `429383d`. No unrelated parent work was copied. Source/test/report write scope remains the assigned plan feature and tests plus this report.

- [x] Persist intended-behavior browser regressions and observe both navigation failures before fixes.
- [x] Bind every conflict acknowledgement to successful current authoritative read plus deliberate review of the same publication, decision revision, view, mode and session. Preserve rejected choice and exact uncertain retry. Verify and commit F5 separately.
- [ ] Consume read-only Back destination for Q2 without shared history writes.
- [ ] Add finite unpublished adapter and a discriminated shared renderer model, with no fake publication/use/service fields. Verify unassigned/assigned/invalid and session/operation boundaries.
- [ ] Run serial Chrome regressions, strict types, UI/build and available required checks; inspect diff, record limits and commit.

## Preview composition seam (specified before implementation)

```ts
export interface PlanPreviewSource {
  draftId: DraftView['draft']['id'];
  contentRevision: DraftView['draft']['contentRevision'];
  assignmentRevision: DraftView['draft']['assignmentRevision'];
  target: DraftView['target'];
}
export interface UnpublishedPlanPreviewProps {
  preview: PlanPreview;
  source: PlanPreviewSource;
  session: PlanSessionBoundary;
  navigation: PlanNavigationPort;
}
```

`PlanPreview` is imported from root `PortalRebuildMapping.ts`. W2 invokes `onPreview(preview, draftView)`; the coordinator derives these four source metadata fields from `draftView.draft` and `draftView.target`. The adapter never receives or renders `draftView.draft.content`. Null target remains null. The enclosing navigation port owns the advisor preview URL, product/evidence/routine selection and Back. No live ports or business callbacks are accepted.

## Task and necessary-copy review

| Priority | Persona / goal | Observed issue | Consequence | Bounded correction / regression | Evidence |
| --- | --- | --- | --- | --- | --- |
| P2 F5 | client recovering a rejected choice | plan acknowledgement directly idles conflict without successful refresh | old/unseen content can unlock fresh stale-version intent | successful fetched basis plus same-basis deliberate review on every route; failed/pending/navigation/unmount/revision cases | W7 R2 and reproduced persisted tests below |
| P3 Q2 | client returning from evidence | label always says product while predecessor may be recommendation | label mispredicts actual destination | read-only shared Back destination; generic back only when enclosing destination is unknown | inspected shared navigator and R2 |
| approved slice | advisor inspecting unpublished content | only published DTO renderer exists | inventing version/date/use would misstate draft lifecycle | explicit unpublished discriminant using identical content modules, no live actions | approved D14/D24/D42 and root PlanPreview |

F5 recovery labels distinguish read failure, retry and deliberate review. Preview copy identifies not published, clocks not started and unavailable actual-use/date/choice state. Source names and authored guidance remain unchanged. No redesign or claim of measured human comprehension.

## F5 implementation and early commit receipt

The old ledger retained rejection but no fetched basis. Plan-level acknowledgement directly set idle, while recommendation review compared only version. The corrected session-memory intent retains an optional review basis: exact fetched view reference, publication version, decision revision, presentation mode, session boundary and renderer scope/epoch. A root boundary persists across feature routes and increments on every enclosing view/mode change. Even leaving and returning to the exact original object cannot restore a spent epoch. Full renderer remount needs a new read.

Every route uses the same basis checks. An automatic 409 read can supply reviewable content but never clears the conflict. Deliberate review rechecks current authority with a read and clears only if the displayed fetched version/revision remains current; a different version or decision revision is displayed and requires another deliberate review. Failed/pending/unmounted reads cannot supply a basis. Plan recovery offers **retry latest plan**; acknowledgement is disabled until the successful fetched basis is displayed. Read failures say **latest plan unavailable**. Attempted choice survives navigation/removal; rejected commands are discarded, never replayed. Uncertain commands still retry every original byte.

Persisted regressions: `apps/portal/tests/rebuild-plan-conflict.test.mjs`, using real rendered events and the existing strict intercepted synthetic harness. The first seven new groups ran **0 pass / 7 fail** before implementation (`red.log`), including both actual independent navigation assertions (`false !== true`). Intermediate `f5-green-1.log` was **37/39**, with one purposeful removed-decision wording mismatch and one incorrect test wait for a preview notice absent on routine pages. Corrected production wording qualifies displayed versus successfully fetched latest plan; the test waits for actual shell mode. `f5-green-2.log` then passed **39/39** including all original32. Two extra protective cases cover recommendation same-version changed revision and old uncertain exact retry after publication replacement; `f5-final.log` passed **9/9** new groups. Combined coverage is41 distinct cases, not48 added counts.

Before this separate F5 commit, normal strict `npm run typecheck:rebuild`, `npm run build:rebuild` and `git diff --check` passed. Every Node/npm command used `PATH=/Users/kanuj/.nvm/versions/node/v22.23.0/bin:$PATH`. No SQL/Auth/network service was used. F1-F4/F6-F8/Q1 source behavior and all32 original regressions remain passing. This is a UI recovery fix, not server authorization or full-portal acceptance. Final independent review is still required.
