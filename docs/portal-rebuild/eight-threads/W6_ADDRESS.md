# W6 shipping-address consumer

Owner: Kanuj. Source-only candidate. Branch `kanuj/w6-account-address-20261103`, base `df230eca6017f8dd330cceb83eb11b18193937e5`. This source branch copies only W6's existing uncommitted address work; the primary thirteen WIP hashes and accepted M01 production remain unchanged.

## Goal and API

D13/D31/D38/D48, C08/C08R/J06/J08. `AccountAddress({controller})` is one shared-form fragment with no Account heading, service/cancellation placeholders, profile replacement or autoload effect. W0 owns the actual Account card, route/session lifetime and initial read. `createAccountAddressController(runtime,{isApplicable?})` consumes the creation-bound W0 request with `isCurrent`, canonical PaymentV2 `readPayments` and legacy `confirm_shipping_address` confirmation. It creates no address store or alternative financial data.

The model/controller start from c06c20f0 source. The address-only successor removes the unrelated legacy service/care read and its private service projection. An otherwise authorized address read must not fail because a care projection denies. The actual payment operation still supplies its own server permission and received401/403 retirement. Cancellation/coverage/support/read-only/export remain in their own authoritative modules.

New intents retain the existing cancelled-service denial; that local denial never revokes the session or grants any administrative right. An already-dispatched uncertain original keeps its exact UUID/body/revision and explicit retry. Confirmed paid quotes/orders keep their original address snapshots; unpaid quotes may require explicit reconciliation. No claim/payment/order/care/publication/guarantee clock or actual funds action is inferred from an address.

## Source construction and proof

The current Root lacks the actual W0 `account-address-request.ts`. A single inert public c06 source input is committed under `tests/w6-account-address-inputs/`, SHA-256 `0a718365fd86adb37501c940011474e3b979b9ff405d1c498f9a95cd1e5ef7d6`. The finite compiler fixture supplies only that missing module in an isolated namespace; it prefers actual admitted source when present. It records all physical/projected source hashes. No shared working product file, constructor, successful authority/currentness method or production namespace is replaced.

All HTTP in these cases is closed synthetic response data. Actual current ApplicationSession/cookie, strict payment codecs, controller, shared React/wrappers and renderer execute. Unexpected global fetch denies. Source rendering is not actual Auth, backend persistence or a browser interaction.

Observed explicit Node22.23.0 evidence:

- Original source diagnostic in the preserved primary checkout: `authority-OLD.log` has0/3 on the combined c06 controller. The positive payment read is retired by the unrelated service403; the two payment-denial controls also acquire unnecessary care. This remains that original source/dependency attribution, not a fresh df23 execution.
- Current `source-CURRENT.log`: 6/6 finite/SSR cases, zero failure/skip/cancel. Own-payment200 remains ready without any operations/care call; actual own-payment401/403 clears state. Real controller editing uses shared fields/consequence copy; actual denial and session disposal hide old address/form content. Rendering acquires no extra read.
- The prior primary missing-fragment assertion failed0/1, then its rendering probe passed1/1. Those earlier fake-snapshot SSR observations remain historical; this successor's current SSR uses the actual session/controller and canonical decoder.
- Actual configured frontend remains blocked on the missing shared request and resulting unknown payment typing. The separate exact-request compiler projection has zero diagnostics under unchanged strict/noUnchecked settings; it is not current Root integration green. Raw logs and `TYPE-PROJECTION.json` remain in this checkout's ignored evidence directory.

## Required next gates

W7 must review the complete owned delta, exact pending dependency and original OLD/current scope. W0 must independently admit the real minimal request and compose the controller/card under actual current session/route ownership. No new Source/financial permission, migration or backend write is granted here.

Fresh separately admitted genuine proof must cover canonical address versions, exact original retry/CAS, refresh/logout/owner denial, paid-order address immutability, cancelled/expired care versus separate administration, legacy compatibility and desktop/narrow/keyboard/focus/accessibility. Existing V2/legacy amount limitations remain honest unavailable cases, not relabeled amounts or a completed legacy flow. All Auth/SQL/browser/financial/source-held/resource/release gates remain separate. No complete Account screen or journey is accepted by these tests.
