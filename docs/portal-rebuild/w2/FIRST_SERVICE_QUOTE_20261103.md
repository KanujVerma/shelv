# Advisor first-service quote: source candidate

Owner: Kanuj. Baseline: `8c5c6b2d72e75f620487f1b2b110655b03551b17`.
Branch: `kanuj/w2-service-quote-20261103`.
Worktree: `/Users/kanuj/.t3/worktrees/shelv/kanuj-w2-service-quote-20261103`.

This separate source candidate leaves the frozen A07 candidate/worktree unchanged. W2 has one active writer and no nested agents. [Eight-thread rules](../EIGHT_THREAD_RULES.md), all Guidance/private-return/M65/photo/A07 holds and accepted M01/M02 evidence are unchanged. It does not establish financial or complete advisor acceptance.

## Change

The advisor review/publish view can prepare a $100 service-only first quote through a separate confirmed action. It never verifies a claim, approves content, publishes, starts coverage or moves funds. Existing payable quotes retain their actual totals and identity. A known existing payable first-service quote or already verified first payment prevents another quote action. Missing transport or finance capability stays unavailable.

`AdvisorPorts.issueQuote?` is an optional feature seam using the same existing v2 payment operation. `IssueServiceQuoteCommand`, `AdvisorPaymentCommand` and `AdvisorPaymentReceipt` are exported from the advisor barrel. The exact command is schemaVersion2/action issue_quote, current selected client and payment revision, unique requestId, publicationVersion0, canonical `MONTHLY_SERVICE_CENTS` service/total, null service period/address, empty items and zero product/tax/shipping values. Those zeros describe an explicitly service-only quote; no product cost is inferred.

The existing advisor controller/session-memory recovery owns pending intent. An uncertain issue preserves its exact command/UUID; seeing a later quote cannot acknowledge this original write. Retry uses the original request and the canonical `buildPaymentCallV2`/`mapPaymentReceiptV2`. A payment revision conflict requires fresh financial context without invalidating clinical content, section reviews or exact approval. A recovered quote clears its own stale uncertain save indicator. Dialog intent binds its controller/actor/client/target/financial revision; replacement context cannot confirm an earlier dialog.

The backend remains authoritative. W5 verified the existing v2 strict handler, frozen recipient/version snapshots, payment claim/confirmation records and first-publication service join. No DTO, migration, auth or shared transport is changed here. W0 must supply `issueQuote.execute` in `createAdvisorPorts`, with actual current actor/session/selected-client guards, fixed payment dispatch and canonical v2 receipt mapping. An absent optional adapter does not become a successful port.

## Requirements and task flow

D14-D16, D21-D24, D28-D29, D34 and D48; A04/A04P/A05 secondary first-service quote flow; J02 partial. Existing six-section authoring and payment/approval independence are retained. Figma A04P `503:672` was read with the existing shared-wrapper baseline; first-quote issuance is a required secondary action using the existing dialog lifecycle, not a new product rule or design system. Full frame comparison remains unrun.

| Step | Goal | Action | Effect and recovery |
| --- | --- | --- | --- |
| 1 | prepare first payment | review selected client and $100 service amount | canonical context; products separate |
| 2 | issue deliberately | confirm the service-only quote | existing authenticated v2 command; no payment or publication |
| 3 | recover uncertainty | retry the original request | same UUID/payload; later read alone cannot settle it |
| 4 | handle conflict | refresh payment information | preserve clinical content/review, then deliberately issue anew |
| 5 | continue service | client claims, advisor verifies, then deliberate publication | separate W5/W1 operations, not automated by this component |

## Observed proof and limits

Explicit Node22.23.0. Live T3 configuration returned codex/`gpt-6.1-sol`, `reasoningEffort=xhigh`, `serviceTier=default`. Dependencies installed with that explicit Node and `npm ci --ignore-scripts`; no lockfile/dependency/config changes.

Commands from this worktree root:

- New controller cases on original source: 0/5; all fail on the missing `issueFirstServiceQuote` function. `.local-artifacts/w2/service-quote-old-red.log`.
- After controller implementation, two actual component SSR cases on original UI: 5/7, with both UI assertions failing. `.local-artifacts/w2/service-quote-ui-old-red.log`.
- Recovery assertion reproduced a stale `save=uncertain` after a known quote receipt: 6/7. `.local-artifacts/w2/service-quote-recovery-red.log`. Corrected at the acknowledged quote transition.
- `PATH=/Users/kanuj/.nvm/versions/node/v22.23.0/bin:$PATH node --experimental-strip-types --test apps/portal/tests/w2-advisor-service-quote.test.mjs apps/portal/tests/rebuild-advisor-controller.test.mjs apps/portal/tests/rebuild-advisor-races.test.mjs`: 54/54, 0 failures/skips. `.local-artifacts/w2/service-quote-focused.log`.
- `npm --prefix apps/portal run typecheck:rebuild`: exit0. `.local-artifacts/w2/service-quote-types.log`.
- `git diff --check`: exit0.

These are synthetic model/SSR/compiler controls, not actual funds, authenticated persistence, committed lost-ack recovery, browser interaction, complete-frame visual/a11y, W7 independent acceptance or exact-head hosted CI. No new browser/native resource was acquired. All remaining mandatory full advisor and root verification gates remain open. W0 integration of the optional adapter and W5 client slice is required before the genuine first-service journey can be proposed under a fresh W7 packet. Broad Commerce/M65 holds are not cleared by this bounded first-service source work.
