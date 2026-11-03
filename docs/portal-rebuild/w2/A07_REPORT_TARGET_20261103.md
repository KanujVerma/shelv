# A07 report target: source candidate

Owner: Kanuj. Baseline: `8c5c6b2d72e75f620487f1b2b110655b03551b17`.
Branch: `kanuj/w2-advisor-workspace-20261103`.
Worktree: `/Users/kanuj/.t3/worktrees/shelv/kanuj-w2-advisor-workspace-20261103`.

This is a permitted presentation change, not A07 activation or full advisor acceptance. The [eight-thread rules](../EIGHT_THREAD_RULES.md) and all Guidance private-return, M65, photo and A07 holds remain intact. No refused audit is retried, rephrased or rerouted. No nested agent or local independent Sol approval is claimed. W7 and hosted exact-head review remain required.

## Behavior and scope

`AdvisorGuidanceWorkspaceProps` is exported from `features/advisor/guidance/index.ts`. Its additive optional `reportRef?: ReportRef` displays an exact canonical loaded check-in and its original/corrections before public drafting. The ref supplies no owner resolution, source access, authority, missing report or currentness. Existing callers without this prop retain the generic workspace.

The targeted view waits for complete authorized history. A missing or denied report has recovery without a response editor. A different report kind with the same UUID does not match. An unrelated open guidance draft is preserved and cannot be replaced by preparing another response. Targeted preparation calls existing `newReviewBody`/`newReplyBody` and the same controller; review, approval, publication, uncertainty and evidence predicates are unchanged.

The private-note form binds its separate existing `append_private_review_note_v1` subject to the selected report. Its component identity follows client/report, so creating a public draft does not discard a private working note. Private note contents never enter the public body. Existing controller authorization remains authoritative. No photo/source feature is activated.

D12, D16, D20, D32-D34, D40 and D48; frame A07 `500:846`; journey J05 / V08 and V11-V12 are partial mappings, not completed journeys. The approved Figma context/screenshot was read in session `47e8dea8-2038-4e27-818a-b8bbd41c002d`; existing wrappers, tokens and Lucide remain in use. No full-frame visual comparison or accessibility signoff is claimed.

## External producer and integration requests

W4 verified `read_advisor_care_history_v1(clientId,version,cursor,limit)`, canonical report/amendment records and separate public/client versus advisor projections. W1 verified there is no report-to-client resolver in baseline `ReviewCommand`. W0 approved a narrow SOURCE-only engineering proposal for `read_advisor_report_context_v1`; exact DTO/producer/migration/review remain W1/W0 work. A URL/report UUID cannot grant access. W0 alone owns direct/refresh route resolution, session/entry binding, canonical mount and transport. The existing Root route remains unmounted in this candidate.

Held private-return review clearance, new permitted independent verification and a W0-admitted W7 resource packet remain indispensable to genuine activation. This candidate supplies none of them.

## Observed verification

Node: explicit `/Users/kanuj/.nvm/versions/node/v22.23.0/bin`; runtime transcript confirms `gpt-6.1-sol`/`xhigh`, global configuration `service_tier="default"`; no fallback. The initial `npm ci --ignore-scripts` used shell-selected Node20 and printed engine warnings; it completed, and subsequent checks use explicit Node22. No dependency/lockfile changed.

From the worktree root:

- `W2_A07_ORIGINAL=1 PATH=/Users/kanuj/.nvm/versions/node/v22.23.0/bin:$PATH node --experimental-strip-types --test apps/portal/tests/w2-advisor-a07.test.mjs`: exact frozen original component with unchanged baseline dependencies; 2 pass, 6 assertion failures, 0 skip. The explicit test switch loads that one original Git blob through esbuild, not a runtime authority substitute. Raw `.local-artifacts/w2/a07-original-final-tests.log`.
- Same tests with the current component: 8/8 pass. Together with the unchanged `rebuild-advisor-guidance-ssr.test.mjs`: 12/12 pass, 0 skip. Raw `.local-artifacts/w2/a07-focused.log`.
- `npm --prefix apps/portal run typecheck:rebuild`: exit 0. Raw `.local-artifacts/w2/a07-types.log`.
- `git diff --check`: exit 0.

Original setup outcomes are retained separately: the first log `a07-old-red.log` has 0/5, but its fifth view-only premise was not a genuine 403 and is not claimed as a valid denied-access reproduction. The corrected final OLD control above supplies the actual 403 case. A pagination setup with an invalid empty nonfinal page failed and was corrected to a real nonempty page; no product validation was weakened.

The initially launched whole portal `npm test` continued while the A07 file was edited. Its raw `baseline-test.log` is retained as a moving-source attempt. It is neither a frozen baseline receipt nor exact-head acceptance, whatever its final count. The tracked launcher must be joined. Fresh full-suite, four graphs, application build, authenticated persistence, browser interaction, negative authority, recovery, complete visual/a11y, W7 independent acceptance and exact-head hosted CI remain separate pending gates.

## Hosted review correction, 3 November

PR217 findings [stale pagination](https://github.com/KanujVerma/shelv/pull/217#discussion_r4459864698) and [saved private notes](https://github.com/KanujVerma/shelv/pull/217#discussion_r4459864703) were reproduced against frozen `6aa586e08d91afd18877d0c84a0a52d1d0026229`: 8/10 pass, two meaningful assertion failures. Targeted mode now always offers a separate first-page refresh while retaining load-more. Matching saved private notes render in their own private section, including when care writes are unavailable; unrelated note subjects remain excluded. New-note mutation permission is unchanged.

An intermediate placement of saved notes inside the writable form failed the explicit read-only case (10/11); moving the read projection outside the form guard corrects that case. The initial correction test launched before npm installation finished and its missing-dependency setup failure is retained separately as `a07-hosted-setup.log`. No application assertion was weakened.

Current new11 plus unchangedSSR4 pass15/15 with no skips. Frontend strict and diff checks pass. Raw `a07-hosted-{red,current,types}.log` and `a07-read-only-note-red.log` live under `.local-artifacts/w2/` in `/Users/kanuj/.t3/worktrees/shelv/kanuj-w2-a07-review-r2-20261103`. The original reviewed worktree remains unchanged. A new exact-head hosted/W7 source review is required; mount/genuine/visual and all held audits remain open.

## Denied-read recovery correction, 3 November

PR217's new [denied retry finding](https://github.com/KanujVerma/shelv/pull/217#discussion_r4460024319) is valid on `37eb2cd1115bf1439789b00d79b47f8e4c3b097d`. The selected-report denied view omitted its refresh action even after access returned. A same-session finite/SSR regression reproduces 11/12 before the correction. The first-page refresh remains available while history is incomplete, including after a current403. Private data stays cleared; actual read authorization and currentness remain the existing controller/transport checks.

Current12 plus unchangedSSR4 pass16/16, frontend strict and diff checks pass. Raw `a07-denied-retry-{red,current,types}.log` live under `.local-artifacts/w2/` in `/Users/kanuj/.t3/worktrees/shelv/kanuj-w2-a07-review-r3-20261103`. The R2 checkout remains frozen unchanged. New exact-head hosted/W7 review is required; no mount/genuine/held-scope clearance follows.
