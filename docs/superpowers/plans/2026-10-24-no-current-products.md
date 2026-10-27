# No Current Products Implementation Plan

> **For agentic workers:** Execute inline using superpowers:executing-plans. No further agents, commits, pushes or deployments are authorized.

**Goal:** Support explicitly confirmed no-product initial consultations through first product Start.

**Architecture:** Add an optional authored baseline status to R2 and extend only the initial-empty intake path with the existing transactional authorization and request ledger. Keep original baseline and activation provenance fixed. Existing Maya additions handle real products.

**Tech Stack:** TypeScript, browser JavaScript, PostgreSQL, Node test runner, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-24-no-current-products-design.md`

## Global Constraints

- Human-led consultation; no questionnaire or automatic analysis.
- No placeholder products or invented instructions.
- Approval, payment and receipt do not activate products.
- Primary dirty checkout and historical folders are read-only.
- Finance code and previous migrations are frozen.
- Use an owned Unix-socket-only PostgreSQL cluster and `CONCIERGE_TEST_PG_BIN`.

### Task 1: Contract and SQL

**Files:** `src/contracts/ConciergePresentation{,Validation}.ts`, `supabase/functions/concierge-operations/commands.ts`, new `supabase/migrations/20261025011331_concierge_no_current_products.sql`, `tests/concierge-no-current-products{,-native}.test.ts`.

**Interfaces:** Existing `save_intake_v2`, `save_draft_v2`, `publish_v2` and read/preview commands remain unchanged; optional `currentProductsStatus` is inside presentation snapshots.

- [x] Write contract tests for empty/missing, explicit none, unknown, contradictory product status, legacy nonempty and null-current comparisons. Run `node --experimental-strip-types --test tests/concierge-no-current-products.test.ts` and record expected failures.
- [x] Add optional status shape, validate zero product steps only with none, and permit empty baseline only for `save_intake_v2`. Keep legacy commands nonempty.
- [x] Write native tests invoking the actual operations and payment handlers against an owned cluster. Run with `CONCIERGE_NONE_NATIVE_SQL=1` and record the initial-empty SQL rejection.
- [x] Add forward SQL shape and validation wrappers plus a narrow empty-intake write path preserving access, request ledger, locks, revision, append-only intake snapshots and baseline conflict.
- [x] Run contracts/native tests; inspect shape parity and role grants. Preserve existing standard nonempty paths.

### Task 2: Founder authoring and client empty state

**Files:** `apps/portal/site/advisor/{presentation-model,presentation-editor,authoring,workspace}.js`, `apps/portal/site/client/presentation-renderer.js`, `apps/portal/tests/no-current-products.test.mjs`.

**Interfaces:** `validatePresentation`, `mountPresentationEditor`, `intakeAuthoringValue`, `planAuthoringValue`, `presentationRoutineMarkup` retain their signatures.

- [x] Write browser/model tests for unknown empty validation and explicit founder selection, save/reopen propagation, locked established baselines, clear empty routine and disappearance after Start. Record missing-status failures.
- [x] Mirror the contract, expose a deliberate consultation status selection without clearing steps, copy its authored value into plan snapshots, remove the unconditional current-product requirement, and render the empty state using actual active steps.
- [x] Run browser tests with denied external networking and capture 320/390/1440 screenshots. Run historical Alex/Maya client parity.

### Task 3: Repeatable follow-up plans

**Files:** the same owned forward migration, R2 type/validation and browser authoring/model files, operations error mapping, and focused native/browser tests.

**Interfaces:** optional `Presentation.routineBasis.products` holds slot/product/source tuples derived from the existing advisor view's actual active routine; no new RPC/action names.

- [x] Write a failing actual SQL two-cycle test: none to A Start, then replace actual A with B, with approval/funding/receipt preserving A and explicit Start changing only the intended slot to B.
- [x] Write a failing stale-basis publication test where the client starts A after a draft was saved; require 409 even with a freshly read case revision.
- [x] Validate the saved snapshot against current projection under existing locks at save and publish; use that basis for current-product bindings while preserving initial baseline rows and all published history.
- [x] Initialize a new founder plan from actual active metadata/usage/source and retain its saved basis across reopen. Lock baseline product identity in the editor and keep active directions tied to their original Start publication.
- [x] Verify historical nonempty readers, no active-step duplication, forged context rejection, immutable history, exact retry and stale publish behavior.

### Task 4: Integration evidence

- [x] Reconcile root contract/function files deliberately into retained `apps/portal/backend/source` fixtures where needed, without modifying historical migration files.
- [x] Run focused tests, affected portal suite, portal package build, root/app/test types and diff whitespace checks. Parent owns the later full native Auth/all-migration replay.
- [x] Write `.local-artifacts/no-current-products/REPORT.md` with exact commands, pass/failure evidence, file hashes, screenshots, migration freeze hash and proven follow-up authoring boundary.

## Execution notes

The Supabase CLI allocated `20261025011331_concierge_no_current_products.sql`; the earlier reserved, uninstalled filename was replaced. No older installed migration changed. New fields are mirrored into the four retained contract/operations files; retained historical SQL fixtures keep their original migration lane. The focused native SQL fixture applies the root Maya, finance and new migrations in order.

A deterministic browser case reproduces Chicago 20:30 after UTC midnight and verifies local default/max plus unchanged chosen past date. The existing client parity test uses the actual visible maximum rather than filling UTC tomorrow.

The parent repaired the pre-existing missing synthetic-requests module by restoring one canonical module under `site/preview/`; the final backend suite passes. The initial missing-module failure remains in the evidence logs, and no test was excluded. Parent owns full all-migration/native Auth acceptance and final integration review. No commit or deployment was performed.

Self-review also verified mixed-case custom-slot ordering with a failing browser regression before changing both basis sorts to deterministic ASCII/C ordering. A stale saved draft now has a deliberate Use current routine recovery, covered through actual founder editor save: public plan content is reset for fresh authored decisions, private notes remain, and no client routine is changed.
