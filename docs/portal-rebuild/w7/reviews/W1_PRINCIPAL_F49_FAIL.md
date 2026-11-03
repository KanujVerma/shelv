# W1 principal successor f49: independent source finding

Owner: Kanuj. **FAIL; setup eligibility WITHHELD** for exact head `f49a15a2aab8d13877a26bf98e969c8950f1d014`, complete delta from DTO-only parent `efd533bcabe8537a134206d71e8bd04b4929acab`. This is separate from original PRINCIPAL-R1-01 and the passing DTO pin. No genuine execution occurred.

**PRINCIPAL-S2-01: descriptor cloning bypasses the native-signal gate and loses real abort linkage.** `principal-signal.mjs:31` validates a copyable prototype/property/symbol surface. In pinned Node 22.23.0, this object is accepted:

```js
const controller = new AbortController();
const fake = Object.create(
  AbortSignal.prototype,
  Object.getOwnPropertyDescriptors(controller.signal),
);
```

Passing fake to the exact successor executor with grantFile `/MUST-NOT-BE-READ` reaches `E_PRINCIPAL_GRANT_PATH`, instead of refusing `E_PRINCIPAL_SIGNAL`. No private path is opened. Separately, capturePrincipalSignal(fake) returns an accepted view; aborting the actual controller leaves that view's aborted false. Native symbol identities and SafeSet/SafeWeakRef prototypes do not establish object identity or a working cancellation lifetime.

Two independent controls fail 0/2, exit 1. The author's 15 new signal controls independently pass 15/15, and all original 47 refusal/slot/schema controls pass 47/47 after URL-only relocation. All 19 source-manifest entries match. These passing checks do not defeat the reproduced finding. Exact controls and raw logs remain under W7 `.local-artifacts/w7/reviews/principal/{cloned-symbols.test.mjs,cloned-symbols.log,retained15.log,retained47.log}`.

Read the complete executor, complete SQL template, called JoinedCommands body, original R1 report, signal implementation, new and retained controls, source pins and their field/role/custody boundaries. The executor preserves old Root359/parent/task pins, which cannot authorize current execution. No SQL parser, migration replay, Auth, HTTP, child command or native fixture was invoked. Actual schema/trigger execution and current source/resource projection remain separate unrun gates; no positive setup or complete absence-of-defects claim follows this failed source review.

W1 owns the correction. The finding and exact reproduction were sent to W1/W0 before this report. W1 agreed, retained f49 as failed, and proposed a versioned opaque module-owned lifetime API. That successor requires its own complete independent review. This report does not approve it. Original bd17, f49, setup/OLD/intermediate/current failures and all provider-refused holds stay preserved.
