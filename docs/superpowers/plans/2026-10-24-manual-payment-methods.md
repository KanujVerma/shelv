# Manual payment methods implementation plan

> Execute inline using the executing-plans workflow. No subagents, commits or hosted writes.

**Goal:** Add configured manual Zelle/Cash App/Apple Cash options without weakening historical payment authority or retries.

**Architecture:** Versioned SQL/Edge/browser adapters around unchanged legacy financial cores, with private recipient registry, immutable quote options, method-bound evidence/claims and a full V2 intent ledger.

**Tech stack:** PostgreSQL, TypeScript Edge functions, buildless browser modules, Node 22, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-24-manual-payment-methods-design.md`.

## Constraints

- Cash App `$KanujVerma` and Apple Cash 9257191334 are explicit user-selected destinations. Both components remain configurable; new methods start disabled until exact release configuration approval, with all three shown in local fixtures. Provider eligibility is not claimed.
- Preserve original V1 request fingerprints/receipts; reject old clients on method-bearing data.
- Founder actual receiving-account verification remains explicit and separately authorized.
- No Apple Pay/refund ledger/automated refund, approved first-three-months service-fee refund copy only; no source plan changes, live settings, funds, credentials or deploy.

## Task 1: Method authority and transactional persistence

- [x] Add failing pure/handler and actual native-SQL tests for V2 recipients, eligibility, snapshots, legacy replay, option/evidence/claim mismatch, owner/capability/revocation and concurrent funding.
- [x] Create forward migration via CLI after `20261024230829`; preserve legacy cores privately, add guarded V1/V2 adapters and immutable sidecars/full V2 intent ledger.
- [x] Add V2 Edge contracts/projections/evidence paths and exact RPC registry entries. Keep original V1 contracts unchanged.
- [x] Run new contracts/native tests and old payment suite; correct only evidenced failures.

## Task 2: Shared portal/gateway/browser integration

- [x] Add failing desktop/mobile browser tests for method tiles/recipient/Copy, component eligibility, founder checks, wrong-option acknowledgements, per-option uploads and uncertain/reload locks.
- [x] Implement V2 shared payment model/renderer/fixtures and local neutral brand assets; alias Maya payment fixture at mount.
- [x] Update payment-status/read-only preview envelopes, matching provider audience schemas and RPC names while preserving admission/reply/session authority.
- [x] Run browser/legacy/client parity/runtime suites; verify no external asset/network requests and no unrelated plan content changes.

## Task 3: Verification and review

- [x] Run root/runtime typechecks, affected suites, portable build and diff checks; preserve exact limits of native versus hosted/provider proof.
- [x] Update owned READMEs, inspect screenshots and write `.local-artifacts/payment-methods/REPORT.md` with source paths, red/green evidence and pending activation gates.
- [x] Request parent review of method authority, replay wrappers and release compatibility. Do not commit or deploy.
