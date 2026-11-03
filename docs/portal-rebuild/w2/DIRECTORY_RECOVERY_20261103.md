# Advisor directory read recovery: source candidate

Owner: Kanuj. Base: `8c5c6b2d72e75f620487f1b2b110655b03551b17`.
Branch: `kanuj/w2-directory-recovery-20261103`; worktree: `/Users/kanuj/.t3/worktrees/shelv/kanuj-w2-directory-recovery-20261103`.

This is an advisor-only read/recovery change under [eight-thread ownership](../EIGHT_THREAD_RULES.md). A08, shared routing/UI/auth/transport, canonical DTOs and backend are unchanged. Existing A07, quote and notification candidates stay frozen separately. No provider-held audit or stopped resource is reused.

## Behavior

Client and plan lists now distinguish idle/loading/ready/error/denied reads, expose their existing read methods as retry actions and stop claiming loading after an error. Confirmed current403 clears the relevant loaded private list; current401 uses the existing session retirement. Same-purpose generation fences prevent an obsolete return/finally from settling a newer read. A canceled read returns to idle and can be requested again; remount does not retain an orphan loading indicator.

List read feedback is separate from draft mutation busy/notice state, so a client-name read failure cannot strand autosave or replace a genuine draft conflict. Authorization/currentness remain the existing ports/controller checks. No role bit, read success facade, new endpoint or source grant is added.

Search/filters keep the existing local semantics and show an explicit no-match state with a clear action. Plan no-match text says "on this page"; it does not imply a complete server search. Successful-page cursor custody adds a return-to-first-page control without fabricating a snapshot. Actual row identities/states still come from strict v1 data. Names and source content keep their original case; authored labels are lowercase. Existing shared wrappers and CSS are reused.

## Task and UX evidence

| Priority | User task | Observed source issue | Correction | Regression and proof level |
| --- | --- | --- | --- | --- |
| P1 | retry a failed directory read | error notice coexists with indefinite loading and no retry | separate list read state and existing read action | model/actual component SSR |
| P1 | keep authoring during a name-list read failure | shared notice blocks autosave eligibility | keep list failure in its own read state | model, preserved manual content and save command |
| P1 | keep revoked private rows out of the directory | current403 retains rows | clear that list while preserving safe retry | model/SSR; not genuine Auth |
| P2 | return to the first plan page or clear nonmatches | only next-page action and blank filtered rows | first-page and clear-filter controls | source/SSR; actual DOM interaction pending |

Mappings: D02/D04-D07/D14-D16/D40/D46/D48; A00 `503:449`, A01 `500:299`, partial J01/V01/V11/V12. Figma context and screenshots were read in existing session `47e8dea8-2038-4e27-818a-b8bbd41c002d`. No full-frame match or a11y acceptance is claimed.

## Proof and boundaries

Explicit Node22.23.0; current peer configuration verified codex/gpt-6.1-sol/xhigh/default. No nested agent or new browser/native resource. `npm ci --ignore-scripts` used that Node; lockfiles unchanged.

Original eight new controls: 1 pass/7 assertion failures (`.local-artifacts/w2/directory-old-red.log`). After model state work, 5/8 passed; three actual SSR failures remained (`directory-model-current.log`). Current ten new model/SSR controls plus unchanged47 advisor controller/race cases pass57/57, no skips. Command: `PATH=/Users/kanuj/.nvm/versions/node/v22.23.0/bin:$PATH node --experimental-strip-types --test apps/portal/tests/w2-advisor-directory.test.mjs apps/portal/tests/rebuild-advisor-controller.test.mjs apps/portal/tests/rebuild-advisor-races.test.mjs`. Raw `directory-current.log`. Frontend `npm --prefix apps/portal run typecheck:rebuild` and `git diff --check` exit0; raw `directory-types.log`.

This does not prove browser filter clicks, actual Auth/persistence/permissions, full-frame comparison, independent source review or complete A00/A01. Root/full portal/exact-head CI and W7 verification remain required. Actual Add client is a separate canonical admission permission/operation, with an optional feature seam now approved by W0 but not implemented here. Strict PlanDirectory v1 lacks plan titles and authoritative review/approval/payment row facts; W1 confirmed a separate versioned metadata/template producer slice is needed. This UI never infers those facts from working state, fans out full drafts or creates an Auth identity from draft creation. All full advisor requirements and held-source/privacy/genuine gates remain open.
