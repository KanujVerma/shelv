# Check-in replies implementation plan

> For agentic workers: execute inline using the executing-plans workflow. No subagents or commits are authorized in this task.

**Goal:** Let an authorized advisor append a plain-text client-visible reply to a submitted check-in, without exposing private notes.

**Architecture:** Extend the existing check-in command, guarded SQL write, projection and shared feature module. Preserve revision/idempotency and owner/capability fences. Use one separate append-only reply table and no messaging subsystem.

**Tech stack:** TypeScript Edge handler, PostgreSQL, buildless browser modules, Node test runner and Playwright.

**Spec:** `docs/superpowers/specs/2026-10-24-checkin-replies-design.md`

## Global constraints

- `send_advisor_reply` accepts exactly action/clientId/checkinId/reply/requestId/expectedRevision; reply maximum 4,000 Unicode code points.
- Active can_edit suffices; clients cannot write; private notes never become public replies.
- Reply records have server author/time; exact retries are idempotent; changed/stale/concurrent writes fail closed.
- No routine activation, notifications, chat, hosted writes, commits or unrelated styling.
- Single-writer gateway/transport files belong to founder operations.

## Task 1: Guarded persistence and wire projection

Files: root `supabase/functions/concierge-checkins/{types,commands,validation,projection}.ts`; one CLI-created forward migration after `20261024230528`; new `tests/concierge-checkin-replies.test.ts` and a native SQL/handler test.

- [x] Add failing command tests for the exact new body and rejected extra author/time/note fields; add projection tests for explicit reply output and stripping private extras.
- [x] Run `node --experimental-strip-types tests/concierge-checkin-replies.test.ts` and verify intended failures.
- [x] Add reusable reply validation, action mapping and allowlisted report replies.
- [x] Create migration with `supabase migration new concierge_checkin_replies`; define private reply table, replace projection and extend existing write body without changing other action branches.
- [x] Replay concierge migrations in a task-owned native cluster with synthetic auth/storage schemas. Run actual handleCheckinsRequest against local SQL RPCs; assert literal client/private canaries, one row on retry and one successful concurrent head update.
- [x] Run related check-in tests and root typechecks. Record unavailable checks accurately.

## Task 2: Shared UI and synthetic adapters

Files: `apps/portal/site/features/checkins/{model,index,fixtures,checkins.css,README}`; new `apps/portal/tests/checkin-replies.test.mjs`.

- [x] Add failing browser cases for advisor composer/public handoff, empty/legacy reports, client write refusal, literal HTML text, uncertain retry and failed reload lock.
- [x] Run `node --test apps/portal/tests/checkin-replies.test.mjs` with only intercepted disk-backed loopback resources.
- [x] Add replyCommand/client projection, append-only fixture reply writes, public reply display and separate advisor composer. Keep private note draft distinct and preserve current intent/reload locks.
- [x] Run browser suite at 1440/390 pixels; verify zero external requests and private canaries absent from client response/DOM.
- [x] Run existing client-parity tests to retain Alex/Maya ingredients, photos and receipt/Start behavior.

## Task 3: Integration and review evidence

- [x] Send founder operations exact action/contract for its advisor-only allowlist composition.
- [x] Update owned READMEs and write `.local-artifacts/checkin-replies/REPORT.md` with fresh commands, counts, screenshots, limitations and exact changed paths.
- [x] Inspect final delta and run `git diff --check`; preserve historical/canonical dirty sources and do not commit/deploy.
