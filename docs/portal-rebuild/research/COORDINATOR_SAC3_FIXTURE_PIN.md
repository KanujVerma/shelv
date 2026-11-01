# SAC3 fixture reconciliation

Owner: Kanuj. Coordinator engineering pin, 1 November 2026. This authorizes a bounded test-input change in the unactivated Account consent proposal. It is not an API, authority, backend or release acceptance.

The SAC3 source correction rejects named predecessor IDs that cannot fit before or after a contiguous UUID-sorted page. Several old causal-only positives had omitted an ID inside their visible window, or represented a sparse selection as one offset page. Keeping those inputs as passing page examples would contradict the corrected rule.

The coordinator read the complete proposed diff, actual row/page/check/oracle helpers and AST audit before authorizing the exact change:

| Artifact | SHA256 |
| --- | --- |
| Proposed input-only diff | `a6bcdc0fe62b77538be493fdf8fab4928b0a9eace4f2ed19842eddebe8c77fba` |
| Resulting `tests/portal-source-account-partial-bounds.test.ts` | `72eb228de21f5ec778b7920a778de019709d40a9d2dcba62f77594a6b196fdae` |

Direct examples move named unseen predecessors outside the visible window. The smaller 201-record selection becomes a contiguous 51-record prefix; the existing complete 100/100/1 composition stays. For the original causal-only 708-case oracle, an explicit synthetic input rekeyer assigns observed IDs first and distinct named unseen IDs afterward. It preserves the consent graph, group, purpose, current status and predecessor relations. The original oracle, cases and expected booleans stay unchanged. The new 2,712-case full-chain/sort/slice reference separately covers actual page positions; neither finite reference proves a trusted query producer or arbitrary graph sizes.

The explicit AST exception permits only two `accepts(...)` input-expression changes and the new input rekeyer with its lexical page fixture. All 14 actual `assert.*` texts and all 11 existing named helpers, including the original page/check/oracle, remain identical; 46 of 48 selected assertion/helper-call texts remain identical. No negative expectation or production predicate is weakened.

The source correction is `0096d6313368c671f4d8166b0dcbfa80e7fab45d`. The separately attributed fixture/report-only commit is `45fdf915e38bfef5159c28e49efd36896d26f3ed`. The author reports current tracked 64/64 and overlapping aggregate 87/87, strict 77/186-file closures with zero diagnostics, and the unchanged R3 four improving from one pass/three failures to 4/4. These are author results pending independent R4. Pre-edit 53/53 and 72/72, post-source raw 48/53 and 67/72, ignored proposal results, old-schema failures and metadata-audit/commit chronology remain separately retained.

The exact pin was delivered to W6's active ordinal5 task through Parent message `root-sac3-exact-input-diff-pin-20261101-v1`. Account R1-R3 remain historical FAIL. A new independent R4 receives the full original brief, prior findings, responses, exact pins and raw qualifications before any model pin or Root import. Source15, public signatures, caps, Types/Values/Mapping, SQL, consumers and resources are unchanged and unactivated.
