# W6 canonical service-financials presentation

Owner: Kanuj. Source-only presentation plan. Base `9ab1b6d65d1027e0515e1b2fd0c6788a3d5842b9`; branch `kanuj/w6-account-financials-20261103`. No live adapter, new write, policy assignment, SQL or permission is implemented by this slice.

## Goal and inputs

Present the canonical V1 read in Account/service under D13/D24/D36/D38 and C08/C08R/J08. First service payment uses the separate W5 component and remains independently reachable before publication. This history panel never starts a service clock.

Consume exact W1 `4031d19be20cf170c5e58e45da063d2463d82b39` type symbols. The actual four DTO postimages and W1's separate semantic pin require independent review/admission. Canonical V1 `serviceCents` is US cents/USD by the explicit canonical quote/payment contract; a future legacy variant needs separately verified currency. Numeric2500 fixtures test representation only, never legacy receipt provenance.

## Bounded implementation

Files: `features/account/financials/{AccountServiceFinancials.tsx,index.ts}` and new `w6-account-financials-*` source tests. W0 owns actual session-bound read/parent lifetime; W5 owns actual financial truth and W1 the shared DTOs.

- [x] Preserve intended missing-feature RED for a real SSR/rendering test before adding the component.
- [x] Render only canonical V1 rows, exact recorded periods, explicit pending publication/unknown first publication and server as-of day. No sums, first-three reconstruction, eligibility, deadline or access computation.
- [x] Preserve unavailable guarantee and the agreed-business-terms distinction. Reject a reserved supported branch, unknown schema or legacy/unknown-period row instead of formatting it as canonical USD.
- [x] Emit only the captured server snapshot/cursor next-page intent. Rendering is inert; parent composition supplies current-session checking and a real fixed read. No actor/client/URL/RPC/requestId is invented.
- [x] Test USD numeric preservation, periods/unknowns, incomplete/empty pages, all unavailable codes, closed variants, private-field exclusion, inert states and exact next-page intent using actual shared wrappers.
- [ ] Freeze exact source and dependencies for W7 review; actual frontend may remain dependency-held until W1 DTO admission. Keep source/SSR/types separate from genuine Auth/SQL/browser/financial acceptance.

The supported guarantee and trusted legacy receipt milestones remain unfinished. Policy definition/application source planning is owner-only with actual current human/finance guards, explicit client scope and period applicability; this presentation adds no such operation. A08's Sami skincare approval setting is unrelated.

## API and observed evidence

`AccountServiceFinancials({read,onReadNextPage?})` accepts an explicit unloaded/loading/unavailable/denied/ended state or a typed loaded V1 view. It owns no async work, session or private cache. The optional callback receives a frozen `{snapshot,cursor}` intent captured by the original render. Parent must enforce its actual current session, page/basis coherence and stale-callback retirement. A snapshot is not authorization. Pending quote refs remain in the parent DTO for same-revision PaymentV2 resolution; this panel does not invent payment instructions from them.

The component reuses W5's existing `paymentMoney` function only for canonical V1 USD, plus W0's shared controls. No W5 controller/financial logic, transport or server code enters the browser build. No fetch, claim, refund, policy, publication, care or Source action is invoked. Rendering nonloaded states discards accidentally retained row props. Unknown/legacy/supported-policy variants are not silently accepted as this V1 contract.

Explicit Node 22.23.0 source evidence in this checkout's ignored `.local-artifacts/w6-account-financials/`:

- `presentation-RED.log`: nine intended missing-component assertions fail. This is new-feature absence, not an historical financial defect.
- `presentation-CURRENT.log`: 9/9 SSR/pure callback/browser-target build assertions pass, no skip/cancel. Actual shared React/wrappers and W5 formatter execute; data is synthetic. Numeric2500 is solely a lossless display fixture and does not prove a canonical/legacy receipt.
- `frontend-UNINTEGRATED.log`: actual configured frontend fails because `PortalServiceFinancials` is not yet in canonical ancestry; derived row typing also fails. No current integration green claim.
- `frontend-PROJECTED.log` and `TYPE-PROJECTION.json`: zero diagnostics under unchanged strict/noUnchecked configuration using exact author4031 DTO inputs without writing shared source. This proves only the conditional consumer type contract.

No browser, actual Auth/SQL/financial read, legacy receipt, policy assignment, live first-service payment or complete Account acceptance is proved. W1's DTO and separate USD semantic pin, W0's adapter/composition and W7's source/genuine/visual gates remain open.
