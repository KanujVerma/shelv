# W7 independent W5 commerce UI source review R1

31 October 2026. **Specification/completeness: FAIL. Correctness/quality: FAIL.** Three reproduced findings, CU1-CU3, remain in the frozen W5 product quote/order source. These verdicts cover this bounded source candidate against the original `89c4668e` target. They do not assess an enabled Commerce backend, real funds, mounted application, visual acceptance or the complete portal goal. No production or original test correction was made.

## Reproduced findings

### CU1, high: current denied reads erase the exact uncertain write

Locations: [controller.ts:27](../../../apps/portal/src/features/orders/controller.ts#L27), [controller.ts:34](../../../apps/portal/src/features/orders/controller.ts#L34), [controller.ts:104](../../../apps/portal/src/features/orders/controller.ts#L104).

`clear()` removes both readable projections and `pending`, then deletes `orders-intent:${ownerId}` from the actual ApplicationSession memory. Current 401/403 errors from `checkStatus()` and current projection reads call that same function. A failed status READ supplies no committed/absent result for the original write. It must remove private readable data while retaining the exact unresolved UUID/body in the still-current owning session. Real session invalidation can separately clear the session memory.

Independent reproduction uses the actual `createApplicationSession`, its real boundary/memory, `createCommercePort`, Root parser/positive mapper and controller. Only session/Commerce wire replies are synthetic; no admitted cookie Commerce channel exists. Load a complete accepted quote, deliberately review, submit its exact 267-cent claim, and return a dispatched uncertain 503. The controller correctly retains the original claim. Next return current 401 or 403 from `request_status_v1`. Index/selection correctly disappear, but a replacement controller on the same still-current boundary recovers **no intent**. The expected exact original command is lost. A separate current index-read 403 reproduces the same loss for an uncertain quote acceptance.

Actual requirement failures: probe cases 2-4, three failures. The 401/403 responses here do not invalidate or replace the actual ApplicationSession; this isolates the feature's own clear path from legitimate logout clearing. Existing stale-403 protection, ordinary status503 retention and wrong-kind committed-receipt rejection pass independently. Preserve those protections while separating projection retirement from unresolved-intent custody. No claim is made that an actual money transfer occurred.

### CU2, important: changing the view during hashing does not cancel the unsent write

Locations: [controller.ts:68](../../../apps/portal/src/features/orders/controller.ts#L68), [controller.ts:114](../../../apps/portal/src/features/orders/controller.ts#L114), [OrdersPage.tsx:65](../../../apps/portal/src/features/orders/OrdersPage.tsx#L65).

`send()` captures `viewToken=readToken`, then awaits the actual asynchronous SHA-256 command hash. Its continuation checks only session/liveness and `writeToken`; it does not recheck the captured view/selection/head before `port.execute(parsed)`. Both `close()` and `refresh()` invalidate the read/view token and review state without invalidating that unsent continuation. The page's cleanup calls `controller.close()`.

Independent reproduction, with no delayed hash replacement or patched source:

```js
controller.reviewQuote();
const pending = controller.acceptQuote();
controller.close(); // or start controller.refresh()
await pending;
// Actual finite request receives one accept_product_quote_v1. Expected: zero.
```

Cases 5-6 each observe one dispatch after the view changed. The raw future request rejects the write as uncertain, so this probe invents no successful business result. Explicit `dispose()` before the same hashing continuation correctly prevents dispatch and clears readable state. This is a source/controller boundary failure, not a claim to have mounted the React cleanup or reproduced browser routing. Recheck the applicable captured view/basis after hashing and before a new dispatch, while retaining an already-dispatched exact uncertain request for recovery. Do not rebase its payload or silently mint another UUID.

### CU3, important: missing currency is disclosed but does not block an exact-payment claim

Locations: [controller.ts:110](../../../apps/portal/src/features/orders/controller.ts#L110), [controller.ts:111](../../../apps/portal/src/features/orders/controller.ts#L111), [OrderSheets.tsx:19](../../../apps/portal/src/features/orders/OrderSheets.tsx#L19), [OrderSheets.tsx:22](../../../apps/portal/src/features/orders/OrderSheets.tsx#L22).

The frozen new `CommerceQuoteHeader`, terms digest and manual payment basis have no currency field. Actual legacy [PaymentQuote](../../../supabase/functions/concierge-payments/types.ts#L6) explicitly has `currency:'USD'`. That legacy field does not establish a currency for a different new DTO, and W5 appropriately does not infer USD. The source nevertheless treats a complete/hash-matched new quote as reviewable and dispatches `submit_payment_claim_v1` after review, using its numeric basis as an exact sent-payment assertion.

Independent case 7 loads a source-valid accepted quote with no currency, renders the actual payment sheet through React SSR and observes its explicit `currency is not supplied` warning, then calls `claimPayment()` after deliberate review. The actual parser accepts and the finite future raw request receives **one** `submit_payment_claim_v1` carrying total267, address version7, payment revision17 and exact quote/version/hash/option. The requirement assertion expects no consequential dispatch while this material fact is unavailable. The probe's write rejects503; neither verified receipt nor accepted real funds is asserted.

The author already records the contract-owner request. A report-level future-admission caveat does not enforce it in the source seam supplied with an available future request. Keep consequential acceptance/claim explicitly unavailable until a reviewed authoritative currency basis is supplied, or return a bounded contract correction request. Do not guess a currency or edit the imported target. The missing field is cross-owner; the W5 gate and exactness claim are observable consumer behavior. This is distinct from CF1-CF3.

## Exact identity, settings and import custody

| Item | Actual value |
| --- | --- |
| Workspace / branch | `/Users/kanuj/.t3/worktrees/shelv/t3-0831617c` / `t3/commerce-ui-source-review` |
| Clean starting parent | `b69f0160e8288ff57ff3775951cc96162e3e33f7` |
| Frozen author checkout / head | `/Users/kanuj/.t3/worktrees/shelv/t3-b6ea9c3d` / `fe0e8cfa718870c739c66ee9f1d98398ffbc7db2`, read-only |
| Reviewed imported head | `24b7822c4ea9b7a4ce416658d9272bbf5cc3243c` |
| Parent thread / project | `d632030a-18f7-4dec-a2c9-f5c0418c3fd5` / `ac0af19d-d404-4f53-a870-02bfd76c2a80` |
| Actual taskId | `node:delegated-task:command%3Amcp%3A80ff67d2-459c-49fa-93e3-1b40a1f4cbcd%3Adelegate-task%3Aportal-rebuild-w7-commerce-ui-source-review-20261031-r1` |
| Actual child thread | `thread:delegated-task:command%3Amcp%3A80ff67d2-459c-49fa-93e3-1b40a1f4cbcd%3Adelegate-task%3Aportal-rebuild-w7-commerce-ui-source-review-20261031-r1` |
| Actual run | `run:thread:thread%3Adelegated-task%3Acommand%253Amcp%253A80ff67d2-459c-49fa-93e3-1b40a1f4cbcd%253Adelegate-task%253Aportal-rebuild-w7-commerce-ui-source-review-20261031-r1:ordinal:1` |
| Run start | `2026-10-31T18:42:45.951Z`, ordinal1 |
| Both live settings APIs | `codex/gpt-6.1-sol`, `reasoningEffort=xhigh`, `serviceTier=default`, full-access/default |
| Live supported descriptors | Effort `low/medium/high/xhigh/max/ultra`; service `default/priority`, default `default` |
| Persisted pins | Project/default-subagent model+effort and all eight `.codex/agents/*.toml` verified Sol/xhigh with `tomllib` |
| Node | Explicit `/Users/kanuj/.nvm/versions/node/v22.23.0/bin` PATH for every Node/npm command; observed `v22.23.0` |

The task handle comes from the actual parent `delegate_task` output at activity position7469, read without truncation and retained as `task-evidence.json`; it was not invented from an encoded thread name. Initial and later live configuration checks agree. No nested agents were started.

Resolved `e32d31c6` to its full SHA through the actual author's Git history. The ordered linear author inventory matched the brief, so import proceeded. Exact attributed command:

```sh
git cherry-pick -x e32d31c67762cbdbb3144fa8a58494838b018370 \
  2dfb7af337060236dc948ffc5bdc244f18ab09f9 \
  15adce311af62bc4d4ddcf31e97d9ce116b6702b \
  7b785246ffd2565f5e83d2547090acf45b691d2e \
  fe0e8cfa718870c739c66ee9f1d98398ffbc7db2
```

| Author commit | Own attributed import |
| --- | --- |
| `e32d31c67762cbdbb3144fa8a58494838b018370` | `65e1f2770d05e418da7dacff6e93f66dd9626bfd` |
| `2dfb7af337060236dc948ffc5bdc244f18ab09f9` | `6334beaa305d5166566fcbc1678fe4f8e52d68f5` |
| `15adce311af62bc4d4ddcf31e97d9ce116b6702b` | `a5c5a0c5187ced227f3a8e88e522e642526f3591` |
| `7b785246ffd2565f5e83d2547090acf45b691d2e` | `340cfb809d0c988e419033e4549b75ff3b9938da` |
| `fe0e8cfa718870c739c66ee9f1d98398ffbc7db2` | `24b7822c4ea9b7a4ce416658d9272bbf5cc3243c` |

Exactly21 candidate paths are new relative to parent: ten feature files, six test/fixture files, the W5 report and four target modules. Every byte matches author `fe0e8cfa`. The four targets additionally match original `89c4668e4a34a0830e172020b0f2bf10b13e8011`:

| Root target | Exact Git blob |
| --- | --- |
| `PortalCommerce.ts` | `fd1caee122fca743f65aaec0b64559c5278e858c` |
| `PortalCommerceMapping.ts` | `7f3f8241ac77b2794c2e8502edfba9caa825836a` |
| `PortalCommerceValidation.ts` | `b0bcafc7a224e77b80c1ddf2e7a367d46b04ecdf` |
| `PortalCommerceValues.ts` | `a7ffa8950399e99fab2fd3497ef656238497c4dd` |

No W1 report/test, earlier W1 stack or `613845e2` correction was imported. The intentionally newer parent Select files `ui/primitives.tsx` and `ui/foundation.css` remain exact `b69f0160` bytes. Parent's Select regression/report are already baseline, not candidate imports. All62 migration files and all361 parent test files remain byte-exact; packages/locks/configuration and all other parent source are unchanged. The report-only review commit adds only this document after the five authorized imports.

All five approved originals match [INPUT_PROVENANCE](../INPUT_PROVENANCE.json) in bytes and SHA256, including the complete95388-byte input `c45701f9f54fd2b1dbb09bbd7aa2b9b437e9059aa6032b6f39411fe2e7f6efbd`. Full21-path blob/SHA256 inventory, five individual input hashes, migration/test counts and pins are retained in own ignored `inventory.json`, generated by `verify.py`. Local Git/source checks used the assigned parent; no remote fetch or freshness claim was made.

## Review coverage and passing source boundaries

Read applicable root/portal AGENTS, rebuild entry point, full95388 original A/B/C, D01-D48, exact desktop/secondary requirements and full design manifest, contracts, workstreams/status, UI tokens/primitives/shared modal lifecycle, actual ApplicationSession creation boundary, complete W5 report and full original task brief. Read all ten owned source files, six test/fixture files and all four frozen Root target modules, including their actual parser/positive-mapper imports. Canonical comparison inspected actual payment types/manual methods and `ConciergeService`/canonical service workflow revision, quantity/cap, return and administration guards.

Read full W1 original89 proposal report, original independent R1 [CF1-CF3 report](W7_COMMERCE_CONTRACTS_REVIEW.md), and complete appended author response at `613845e28248e7afa288c0438e742c775870b4f1`. They remain unresolved pin context for this review. The separate parent R2 owns their disposition. W5 excludes guarantee/service-refund/private repayment/referral editors and clocks. This review neither reopens those same findings nor adopts their proposed correction.

Native Figma DESIGN API session `0ea43c3b-0476-4051-b213-a50f4b297493`, after reading the required Figma design-to-code skill, returned context and screenshots for C06 `499:446` and C06D `503:808`. Source comparison confirms the two-column hierarchy, shared typography/tokens, neutral imagery fallback, separate product/payment/delivery steps and delivery-versus-use distinction. C06 safe preparation DTO supplies summary/count/missing terms, not the sample's exact product identity. W5 does not inject the staged product/photo/approval to imitate that frame. C06D uses actual supplied delivery/actor IDs; it does not invent Sami/Kanuj names or a `not started` fact. No pixel, responsive, keyboard, zoom, focus, mounted-sheet or browser acceptance is claimed from native frames or SSR.

Independently exercised source boundaries:

- Actual ApplicationSession-bound future raw request, finite Root parsing/mapping and missing-request unavailable behavior; no Plan/Care/Review fallback, arbitrary fetch, URL or RPC surface.
- Complete snapshot-bound component loading/hash verification and actual React/shared-component SSR. Own large vector uses50 Unicode-heavy lines, quantity100 each and101 valid Zelle options. All line/option pages are consumed, without three-option or lifetime100 caps. Own vector:1,047,871 line-array UTF8 bytes, four line pages and two option pages; largest page346,625 bytes, below400000. The final immutable hash is `cfed4ebef431b3c3f789310c7fec39a9bf49a2435ded19512b1cf386d793b93b`. This is a distinct finite source vector, not a claim to duplicate the author's1,215,071-byte maximum specimen or prove SQL pagination.
- Source-valid checked zero tax, exact nonzero shipping, original seller/variant/strength/size/quantity and relative saved return terms. Complete50-line SSR produces1,098,389 bytes. The supplied author tests additionally cover final-sale terms, truncated/repeated/mismatched/unknown-material components,101-entry index/history continuation and original quote/version/hash reads.
- Malicious programmatic owner selector/private payee/clinical source/role extras reject in actual command/detail parsing. Script-tag source text is rejected before hashing; allowed ampersands remain escaped in actual SSR. These are parser/projection checks, not live authorization/RLS proof.
- Ordinary status503 and matching-hash wrong-kind committed status retain the original uncertain command; stale403 does not retire a newer read; dispose cancels an unsent write and clears private projections; latest409 requires complete current refresh then separate deliberate review, with no automatic rebase/new UUID.
- Purchase/receipt/return commands remain separate from Care Start and retailer/bank execution. Ended-care administrative modes and historical write refusal are present in source and author tests. No self-purchase callback creates a fake order. The shared product/Care adapters require exact `ProductSelection`, without fabricated PlanContent/publication/actual-use state.

## Independent commands, results and RED qualifications

Own evidence root is `.local-artifacts/w7-commerce-ui-review/`. Every Node/npm line below used `PATH=/Users/kanuj/.nvm/versions/node/v22.23.0/bin:$PATH` explicitly. Portal-only locked offline install `npm ci --offline --ignore-scripts --no-audit --no-fund` added130 packages, exit0, unchanged lockfiles. No Root install or compiler relaxation.

| Command | Actual result |
| --- | --- |
| `node --experimental-strip-types --test apps/portal/tests/rebuild-orders*.test.mjs` | exit0;36 pass/0 fail/0 skip, including9 source SSR cases and write:false browser-target bundle |
| `node --experimental-strip-types --test apps/portal/tests/rebuild-app-session.test.mjs apps/portal/tests/rebuild-app-ports.test.mjs` | exit0;20 pass/0 fail/0 skip |
| `npm --prefix apps/portal run typecheck:rebuild` | exit0, zero diagnostics; unchanged full frontend strict config includes owned type assertions and Root imports |
| `npm --prefix apps/portal run check:ui` | exit0;11 stylesheets |
| Explicit strict Root-four command below | exit0;zero diagnostics |
| `node --experimental-strip-types --test .local-artifacts/w7-commerce-ui-review/probes.test.mjs` | exit1;13 tests:7 pass/6 requirement failures, grouped CU1 three/CU2 two/CU3 one;0 skips |
| `python3 .local-artifacts/w7-commerce-ui-review/verify.py` | exit0;21 exact new blobs/five original hashes/eight pins/62 migrations/361 original tests verified |
| `git diff --check` | exit0 |

```sh
node apps/portal/node_modules/typescript/bin/tsc --ignoreConfig --noEmit \
  --strict --noUncheckedIndexedAccess --verbatimModuleSyntax --skipLibCheck false \
  --allowImportingTsExtensions --target es2022 --module esnext \
  --moduleResolution bundler --lib ES2022,DOM,DOM.Iterable --jsx react-jsx \
  --types react,react-dom --typeRoots apps/portal/node_modules/@types \
  src/contracts/PortalCommerce.ts src/contracts/PortalCommerceValues.ts \
  src/contracts/PortalCommerceValidation.ts src/contracts/PortalCommerceMapping.ts
```

The first own probe run was **2 pass/11 setup failures**, because the ordinary synthetic product name intentionally contained a script tag that the actual plain-text validator rejects. That fixture was corrected to allowed text; malicious text rejection remains a separate control. Raw `probes-setup-invalid-text.log` is preserved and is **not** CU1-CU3 evidence. Final `probes.log` fails at the substantive requirement assertions above. No frozen source/parser/flags were changed. Existing typeless-package warnings remain.

Read/hash-audited every retained author log into `author-log-audit.json`. `seam-red`4, `model-red`4, `controller-red`6 and `render-red`7 all fail because exports are absent (including one not-a-function error), rather than independently exercising21 implemented behavior failures. `original-red` likewise fails the missing `openOriginalQuote` method. These are useful test-first seam records, with that limitation. `recovery-red` contains real409 current-selection and service-intent status-surface failures. `domain-red` exercises the missing pre-dispatch entity refusal. `legacy-red` and `legacy-quote-red` fail omitted actual money/policy/quoted-line rendering assertions. Their current corresponding cases pass.

The reported intermediate strip-only parameter-property, invalid-policy-URL, SSR configuration and icon problems are setup/source-authoring qualifications, not financial/controller regressions. The retained REDs with catch-to-empty imports cannot themselves establish those distinct underlying runner errors. Additionally, the author's legacy-purchase SSR test passes `shippingCents:null`/`returnCostCents:null`, although the actual canonical type and frozen Root legacy mapper require numeric fields. That isolated renderer case demonstrates defensive unknown rendering, not a source-valid end-to-end legacy projection. No such fixture is counted as canonical acceptance here.

| Own artifact | SHA256 |
| --- | --- |
| `probes.test.mjs` | `8056fe651aabb3169e8610883f31be1e4e0d53ca04aa958f6c97c8bed7186bcb` |
| `probes.log` | `eb43501444a2047abc044c96c333242eab357f41ed367dcf74ec77ee2a0de491` |
| `owned-tests.log` | `bcdbda4bc6ffe4907e54dcb316ad07e18b2707a81577661aa4bc3bad1ff95ba9` |
| `retained-tests.log` | `cf743fa40ca7eb6edeee340dd69da6afb6ee2de2c62ccd21135855044f1bcf5b` |
| `strict.log` | `5e0ce0235c171270fc3458ee5d6ff81aebb122ba9541a84288ff4c00fc92abf4` |
| `root-four-strict.log` | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` (empty successful compiler output) |
| `ui.log` | `1580eaf5e9a7a7ff5b1da8a38588855a5f59dd477629e3fde20fa0be2403f003` |
| `runtime.json` | `ea5699c102c2c4b1d4b78e233e83f800c92b6f2f1df70d97cffedaeeb036abfa` |

## Unresolved cross-owner seams and skipped acceptance

1. **Fixed request/backend admission:** default `createCommercePort(runtime)` truthfully reports unavailable and dispatches nothing. Proposed Commerce30,10READ/20WRITE remains unpinned/unactivated; W5 admits only five client reads/four writes. A coordinator-supplied future request still needs actual cookie/raw-response/CSRF/lease bounds and authenticated server/SQL before activation. Pure finite replies here are explicitly synthetic. No successful production port stub or real endpoint was substituted.
2. **Currency:** actual missing new target field and consequential consumer behavior are CU3. An authoritative mapping/correction must precede financial acceptance; legacy USD is not a permitted guessed default.
3. **Return revision:** actual [canonical service writer](../../../supabase/migrations/20261025221028_concierge_service_workflows.sql#L93) compares the client-wide `service_heads.revision`, and canonical ServicePurchase has no revision field. New proposal has purchase `revision`, separate `fulfillmentRevision` and command `expectedReturnRevision`, without an explicit safe return-head field or implemented resolver. Independent observation case8 uses source-valid purchase revision9/snapshot serviceRevision23 and observes W5 sending `expectedReturnRevision:9`. This is an actual assumption, not proof that canonical revision23 can map to9. The future contract owner must define/confirm the linkage or provide a finite safe basis before return-write admission. No backend exists here to reproduce a wrong-CAS response, so this is recorded as an unresolved admission request rather than an invented additional canonical defect. Do not substitute23 or another guessed clock in W5.
4. **Actors/corrections/product/use:** safe Commerce history supplies actual UUIDs, occurrence/recording/channel, but lacks safe actor names and explicit amendment links. Preserve actual IDs and request a finite projection; never label a UUID Sami/Kanuj or invent correction linkage. Product/current-use/self-purchase adapters and source images are coordinator/W3 dependencies. Current frozen metadata is preserved; no plan renderer receives fabricated fields merely to reuse it.
5. **Application/UI composition:** shared shell, OverlayProvider, route/deep-link/Back/refresh/focus/scroll recovery, controller disposal on context replacement and genuine current authority remain parent composition work. Inline source comments and report document these seams; a concise public integration example would improve Source DX for missing-request behavior, tokens and modal custody. Prepared source code is not a mounted harness or grant to start one.
6. **Uploads/legacy administration:** no completed uploader exists; evidence remains null and photo unavailability is explicit. Legacy quotes remain cannot-pay; legacy purchases keep actual provided fields plus separate order-help dependency. Returns remain requests for review, without fake photos, Start, automatic eligibility, retailer timing or transfer execution.

Not run in this review: Root `npm test`, Root application/test tsconfigs, Expo/native export, full portal suite/package, session runtime integration, SQL/reset/pgTAP/RLS/ACL/concurrency/after-wait execution, actual Auth/Vault/Edge/PostgREST/Storage, browser/DOM/preview/process inventory, pixel/keyboard/zoom/responsive/Back/mounted-App, genuine financial/retailer/return effects, hosted/CI/release or representative-human review. Author-reported Root dependency failures remain attributed historical results in the unchanged W5 report; they were not rerun or relabeled as this review's passes. Full source/backend acceptance does not follow from56 passing baseline tests.

No Chrome, DOM, preview, process/DB/Docker/Auth/credential/fixture/provider inventory or real business resource was acquired. Parent R9 and sole W7 V3 browser resources were untouched. Only permitted read-only native Figma DESIGN calls, T3 metadata reads, local source/install/compiler/SSR and own ignored probes were used. No push, PR, merge, deployment, real publication, source/rights change, communication, funds or retailer action occurred. Author checkout and all frozen inputs/target blobs remain unchanged.

**Disposition:** source specification/completeness FAIL for CU1-CU3; source correctness/quality FAIL for CU1-CU2 and CU3's missing material gate. Coordinator owns author corrections, a fresh independent review, contract pin and later browser/genuine App/SQL/financial acceptance. CF1-CF3 remain with the separate parent R2. Report-only final commit SHA and clean-checkout result are returned separately to avoid a self-referential report hash.
