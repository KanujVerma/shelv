# b566 database CI: inventory fixture no-effect baseline

Owner: Kanuj. 2 November 2026. This is a bounded test-fixture repair, with no production function, migration, permission or caller input change. The full rebuild remains active and incomplete.

## Actual tested source and failure

Database/integration run41395166653, job125114805107 checked out merge `8e140138f591977efdb3cfa9bc5fb2b68c63c759`, parents8ac0826f andb566f67c. Its tree `44c0fc69d32e479ce625ee30f686fed4fc4074f5` equals published `b566f67c689574e6e5fc6fa77c2ad6210bbe2efd` exactly. This is executed-tree correspondence, not only a PR head label.

Startup and database reset now succeed with the corrected export CASE condition. The actual pgTAP run executes **44 files /1,106 tests**; its only reported failure is inventory test30, “Review head is unrelated and unchanged”: **have78, want77**. Export, notification and photo-head files report ok. The overall database job fails, and later integration steps remain skipped. This does not prove genuine client JWT/Storage/provider/full application acceptance.

Root cause is fixture ordering. The inventory test seeds `care_report_heads.revision=77`, then inserts its legacy report. The existing canonical `care_legacy_report_head` AFTER INSERT trigger invokes `concierge.care_legacy_head`, incrementing that head before the inventory calls. Direct amendment insertion is not the source of this increment. The production inventory RPC remains a guarded read; no evidence establishes that it changed Review head.

## Bounded correction

Capture the actual Review revision in a transaction-local temporary table **after all fixture setup writes and before the measured head/inventory reads**. The existing final assertion compares the actual head to that captured revision. This preserves the intended no-effect oracle: a later inventory mutation still causes a mismatch. It does not merely replace77 with78 or compare a value to itself at assertion time.

The complete original SQL file is restored byte-exact by reversing only the four-line documented snapshot insertion and the expected-value expression substitution. All other47 pgTAP assertions, fixtures, role/JWT transitions, limits, authorization negatives and production calls remain unchanged. The temporary table is test-private and rolled back with the existing transaction; no access grant or application API is added.

An additional Node source regression ensures snapshot placement is after report/amendment setup and before the measured reads, and requires the final assertion to reference the captured value. It fails0/1 on the old fixture and passes afterward. New regression plus existing producer source tests pass4/4; the actual Root test typegraph passes with unchanged flags. Corrected native pgTAP remains pending fresh exact-head CI.

## Evidence and scope

Evidence home: `.local-artifacts/portal-rebuild/ci-b566-parent-20261102/`. It contains the full database log/run metadata, executed-merge/source proof, original failure, source RED/GREEN, current type log and `fixture-fix-proof.json`. The original SQL SHA256 is9273da9b16a18a2fa0000c0ec7bc57ee757996b696426bf91682141012482d01; corrected SHA256 is10e62702536a6eb1287582e2d8039a80414e32c4689c82822ffdf213b7b0c4ab. No raw failure is overwritten or called green.

Actual checks use explicit Node22.23.0 and TypeScript6.0.3. The existing Source inventory module executes through its real source checks; no successful authority/currentness/operation port or changed response substitutes for the no-effect assertion. These source checks do not execute the corrected SQL. No local resource, Auth/DB/Storage/provider/browser, real client, money, publication or communication was used in this repair.

The actual restored T3 Parent owns peer-review orchestration and other code corrections. This persistent Goal continuation claims only this SQL fixture, its new source regression and this report during the bounded fix; it does not overwrite canonical status/TASKS or other owners' files. The full26-screen, independent review, genuine flow, browser/visual/accessibility and release gates remain open. No protected-main merge or deployment is authorized.
