# Account profile late-body retirement correction

Owner: Kanuj. 2 November 2026. Coordinator author verification only; fresh complete independent review and Root admission remain required. Frozen producer code/tests: `9e5ee407ddfed7a56fb120e527d19ec35862e779`, author report: `d0971a2b343410b476a4d30ca70da31cc9d4a1fc`, independent R1: `4c9f0a960671e7dc5c3886e50b870231820e612f`.

AP1/P2 reproduced through the unchanged independent actual codec/handler/runtime/native Response probe:9/10 pass, exit1. A wall-clock advance beyond the registered absolute10-second deadline precedes the timer callback. The handler returns safe503, but exchange previously cancelled the received body only when the signal was already aborted. The wait refuses before decode; handler finalization clears the timer, leaving cancellation uninitiated. No private200 or genuine resource leak was demonstrated.

The correction retains the received non-denial response until `accountProfileWait` completes. If that same wait refuses, exchange requests best-effort cancellation and rethrows the original failure. A response received after real signal abort still takes the existing late-response cancellation branch. Received401/403 still records its denial and cleans up before any other result handling, preventing duplicate cancellation in that path. No timeout is renewed, no cleanup acknowledgement is awaited, and no new permission/context callback, endpoint or authority fact is added.

## Failing-old and passing-current evidence

| Actual executed scope | OLD | CURRENT |
| --- | --- | --- |
| Exact unchanged independent10 |9/10, exit1, AP1 cancellation0 instead1 |10/10, exit0; same503, signal remains un-aborted, cancellation1 |
| New named regression15 |10/15, exit1 |15/15 within physical47, exit0 |
| Original frozen family32 |32/32, exit0 |32/32 within physical47, exit0 |

The durable new test preserves all ten independent registrations, inputs and predicates with only four relative-import relocation bindings. It appends five registrations: all five Auth/RPC positions for both read/write; pending, rejected and throwing cancellation; and401/403 precedence through clock expiry at every position. These are finite closed HTTP/native Request/Response/stream executions with the actual codec/handler/runtime. Mock Date/timers model the specified ordering; no real network, successful authority port, database or browser is substituted as genuine proof. All passing groups have zero skips/cancellations. Counts overlap and are not added into a full-suite result.

The initial test-relocation scaffold expected five imports, but the exact probe has four; it stopped before creating a test or changing production. Correcting that preparation count changed no behavioral predicate. Raw setup and all OLD/current results remain separate. The original absent-feature0/2 startup failure and author historical fixture corrections stay as R1-attributed history; they are not relabeled behavioral green.

## Exact custody and remaining gates

Own coordinator input-only commit `a236321446a11edf36ae7c3afb0f6de359611c27` materializes exactly the13 frozen producer/report additions atop the separate shared transport correction. It is attributed input, not this authored fix. Only profile `runtime.ts`, the new late-body test and this report are authored. The four contracts, handler/body, sole new migration, pgTAP and original three tests retain their exact frozen bytes/modes. Do not import this entire branch or its unrelated shared/entry/SMTP/input ancestry.

The complete R1 report was read. Its SQL/lock/CAS/journal/collision-helper source assessment does not constitute SQL acceptance. The guarded six/eight collision predecessor, canonical enrollment trigger, per-actor try-lock order, received-denial precedence, original single operation budget, safe statuses and own-client authority model remain unchanged. Profile/contact/Account, full D01-D48/26screens and secondary flows remain required.

Explicit Node22.23.0 executes owned byte-exact extracted inputs and physical source. Unexpected global fetch is denied. No foreign artifact is executed, and no dependency is installed or acquired. These probes use builtin Node execution; strict TypeScript is UNRUN for this profile successor while the complete shared R6 owns the central heavy-check slot. Existing dependency trees are not proof of a completed profile typecheck. No source/declaration/flag/config/compiler weakening occurred.

Raw argv/cwd/true exits/SHA256, exact copied probe, frozen input manifest and final candidate/preservation receipts are in the authorized integration checkout's ignored `.local-artifacts/portal-rebuild/continuation-20261102/profile-ap1-correction/`; own execution fixture is coordinator `.local-artifacts/profile-ap1-correction/`. Final commit/hash is recorded separately to avoid self-reference.

NEW complete independent profile R2 must review the entire producer and original requirements/history plus AP1 correction. Root import, strict configured/focused compiler graphs, both SQL collision lineages, pgTAP/catalog/RLS/ACL/session/CAS/concurrency/persistence/deletion/rollback, gateway/Vault/Account mount, genuine Auth/Storage, complete contact journeys, browser/visual/human/full suites/exact-head CI and release remain UNRUN or unaccepted. No resource/SQL/native/server/browser/provider/client message, money/order/permission/deployment action occurred. Source kernel SK2/SK3/SK4 and Guidance/M65 holds remain untouched.

## Type-only compiler follow-up after R2

Complete independent R2 `37903bbbd097369fba0049181cbef1efe2b0650e` reports scoped SOURCE/finite PASS, AP1 closed with no additional material finding. Its strict check remained UNRUN. The coordinator's later actual configured test graph exposed TS2345 in the new copied regression: a local read-command literal widened to strings before being passed to the actual typed mapper. The new test now uses a type-only `AccountProfileCommand` import and `satisfies` on that literal. Input values and all predicates are unchanged; actual TypeScript6.0.3 transpilation before/after is byte-identical. The configured coordinator test graph goes from that single error to zero. This neither changes producer behavior nor edits any of the original three frozen test files.

Actual configured coordinator app/frontend/session graphs also pass, without source overlays or compiler-flag/declaration reduction. Coordinator compilation includes separately attributed exact frozen Source type/validator INPUT5; it is not a physical integrated Root or native/profile SQL proof. The original3016 four-import correspondence remains historical; this later type-only addition is separately qualified. Root admission, genuine/SQL/contact/mount/browser/full-product gates above remain open.
