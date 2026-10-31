# W7 commerce Phase 1 independent review R1

31 October 2026. **Specification/completeness: FAIL. Correctness/quality: FAIL.** Three reproduced source findings remain: CF1 and CF2 prevent the proposed contract from representing approved service-refund behavior; CF3 accepts internally contradictory canonical period facts. These verdicts concern the six-file proposal only. No coordinator pin, backend acceptance, enabled commerce, monetary effect or full-goal completion is issued.

## Identity, runtime and custody

| Item | Independently observed value |
| --- | --- |
| Workspace / branch | `/Users/kanuj/.t3/worktrees/shelv/t3-78a5b6f0` / `t3/w7-commerce-spec-review` |
| Clean starting parent | `ed8fc7cdafcb4e84180f4bbdc4fff128ab6f3806` |
| Only imported author commit | `89c4668e4a34a0830e172020b0f2bf10b13e8011`, from the shared Git object store and author checkout `t3-7a7cac7e` |
| Reviewed imported head | `1d0f503af3347bef7ba7215ffc27de9b55713aed` |
| Parent thread / project | `d632030a-18f7-4dec-a2c9-f5c0418c3fd5` / `ac0af19d-d404-4f53-a870-02bfd76c2a80` |
| Child thread | `thread:delegated-task:command%3Amcp%3A80ff67d2-459c-49fa-93e3-1b40a1f4cbcd%3Adelegate-task%3Aportal-rebuild-w7-commerce-contracts-review-20261031-r1` |
| Actual run | `run:thread:thread%3Adelegated-task%3Acommand%253Amcp%253A80ff67d2-459c-49fa-93e3-1b40a1f4cbcd%253Adelegate-task%253Aportal-rebuild-w7-commerce-contracts-review-20261031-r1:ordinal:1` |
| Actual taskId | `node:delegated-task:command%3Amcp%3A80ff67d2-459c-49fa-93e3-1b40a1f4cbcd%3Adelegate-task%3Aportal-rebuild-w7-commerce-contracts-review-20261031-r1` |
| Run start | `2026-10-31T17:55:42.676Z`, ordinal 1 |
| Both live runtime checks | `orchestrator_capabilities({})` and `t3_thread_configuration({})`: provider `codex`, model `gpt-6.1-sol`, `reasoningEffort=xhigh`, `serviceTier=default`, `full-access/default` |
| Live model descriptors | Effort supports `low/medium/high/xhigh/max/ultra`; service tier supports `default/priority`, default `default` |
| Persisted project / roles | Project model/effort and default-subagent model/effort match Sol/xhigh; all eight named role TOMLs match Sol/xhigh, verified with `tomllib` |
| Node | Explicit `/Users/kanuj/.nvm/versions/node/v22.23.0/bin` PATH on every Node command; runtime reports `v22.23.0` |

Task handle was recovered from the parent thread's actual task_status tool result, activity position 7208, which also confirms the same model/options and child run. No nested work, runtime/resource polling, SQL allocation, PG, Docker, Auth, credentials, fixture, browser, DOM, preview, native service, funds, retailer API or external communication resource was acquired. Only authorized T3 messages notified the parent of findings and requested its task handle. No install, production/test correction, push, PR, merge or deployment. Local `origin/main=d39a7d4943209080df7c4cf97d85784f462758bf` was inspected without a remote fetch. This review uses the explicitly assigned parent, rather than treating cached main as current integration.

The author report's frozen 61-migration inventory is historical evidence from its own base. This review starts over parent M62 and reviewed transport. All **62 parent migration files** remain byte-exact to `ed8fc7cd`; no R9/reset/pgTAP claim was rerun or adopted.

## Exact imported blobs and preserved originals

`git cherry-pick 89c4668e4a34a0830e172020b0f2bf10b13e8011` added exactly the following six new files. `git hash-object` on every working file equals the author commit's blob. No other author commit was imported.

| File | Exact Git blob |
| --- | --- |
| `src/contracts/PortalCommerce.ts` | `fd1caee122fca743f65aaec0b64559c5278e858c` |
| `src/contracts/PortalCommerceValues.ts` | `a7ffa8950399e99fab2fd3497ef656238497c4dd` |
| `src/contracts/PortalCommerceValidation.ts` | `b0bcafc7a224e77b80c1ddf2e7a367d46b04ecdf` |
| `src/contracts/PortalCommerceMapping.ts` | `7f3f8241ac77b2794c2e8502edfba9caa825836a` |
| `tests/portal-commerce-contract.test.ts` | `352182b8f412367f999efd76916ad9b2a0aef927` |
| `research/W1_COMMERCE_CONTRACTS.md` | `13761c1870803da868cfb6b34cfd6c0352a4065f` |

All five supplied originals match [INPUT_PROVENANCE](../INPUT_PROVENANCE.json) in both length and SHA256 before and after review:

| Original | Bytes | SHA256 |
| --- | ---: | --- |
| `source/APPROVED_INPUT.txt` | 95388 | `c45701f9f54fd2b1dbb09bbd7aa2b9b437e9059aa6032b6f39411fe2e7f6efbd` |
| `APPROVED_DESKTOP_SPEC.md` | 36823 | `4ceafbaca13ab9324ea35e5e3cb94d09ba76178c9c5127a93da87c5b9c7e59a0` |
| `shelv_desktop_design_manifest.json` | 12642 | `64e9c782657dc6d927ddf255bc983e863c89974c13418287fa980e9f5ed35307` |
| `APPROVED_DECISIONS.md` | 24755 | `eefc74fcc1498cdbbe5ac21d4215cfb9c8936545a6dcc6437bf9e0dd98c21e60` |
| `SCREEN_MANIFEST.json` | 4300 | `55a375ede66a3c9c13139d90246fbc096b6bd1a11cb8c2ce49d30ee8bb44519b` |

## Review authority and source comparison

Read root/portal AGENTS, rebuild README, workstreams/status, implementation plan/contracts, Plan/Care/Advisor API documents, acceptance scope, the complete approved original including appendices A/B/C, D27-D37 and pertinent D13/D21-D26/D38-D41/D47-D48. Read [founder operations](../../CONCIERGE_FOUNDER_OPERATIONS.md), [W1 remaining API](W1_REMAINING_API.md), especially finance 337 onward and account administration, and the actual complete [W1 commerce report](W1_COMMERCE_CONTRACTS.md), four proposed modules and test file. The root approved plan governs intended behavior; the research reports are qualified hypotheses.

Canonical implementation references inspected were actual Root [payment types](../../../supabase/functions/concierge-payments/types.ts), [v1 validators/mappers](../../../supabase/functions/concierge-payments/contract.ts), [v2 methods](../../../supabase/functions/concierge-payments/methods.ts), handler, [service types/parser/mapper](../../../src/contracts/ConciergeService.ts), Plan/Review/Care shapes and [canonical payment workflows](../../../supabase/migrations/20261018234537_concierge_portal_workflows.sql), [manual-method migration](../../../supabase/migrations/20261024234059_concierge_manual_payment_methods.sql), [purchase/return/service migration](../../../supabase/migrations/20261025221028_concierge_service_workflows.sql), and pertinent M54 publication/access/decision source. Retained fixture SQL was not treated as canonical.

| Approved/source behavior | Actual proposal disposition |
| --- | --- |
| D27, actual decision stores choice only | Report explicitly restricts issuance to actual approved primary or exact legacy proposed product. Alternatives stay `selection_unproven` pending separately pinned finite proof. No caller-approved flag or new choice ledger. Resolver enforcement remains Phase 2. |
| D28-D29, actual 50 quote lines / quantity 100 | Bounds match source. Header plus per-line preparation uses aggregate CAS target. Full line and option pages have complete counts, cursor chain and hash, with no fixed three-option or lifetime 100-option cap. |
| C06 incomplete preparation / no fake zero | Known/unknown leaves retain partial return terms; readiness checks identity, seller, checked price and policy. Checked zero tax/shipping and genuine final-sale/not-applicable return cost are distinct. Pure readiness grants no payment authority. |
| Existing v1/v2 claims and gross receipt | Actual V2 parser/receipt mapper is reused as a validator. Fee/net/receivedAt/private verification data are proposed sidecars, not invented canonical columns. Claim remains unverified; confirmation is bookkeeping. |
| D29/D31 frozen quote, address, options and terms | Full immutable digest includes line identity/content, publication/selection, recipient version, address, money and terms. Availability/acceptance/status are intentionally excluded from the digest. No frozen order is recomputed from mutable profile or plan. Actual issuance/bypass protection is deferred SQL work. |
| Actual record_purchase | Full quoted line quantity and one purchase per quoted recommendation remain the stated contract. No invented split purchase. Proportional return ceiling helper matches source remainder-cent arithmetic; cumulative locks/caps are deferred. |
| D30 / C06D | Ordered, shipped, delivery-confirmed and client receipt are separate. Relative return policy resolves from actual purchase/delivery without changing its disclosed terms. No Start field/effect; self-purchase continues through Care without fake finance. |
| D37 returns / founder fault | Existing finite status, retailer receipt versus client repayment, and explicit founder-fault/reconciliation records are represented. Actual initiation events are proposed sidecars; legacy client_repaid is not fabricated initiation-time evidence. |
| Actual recipient validators | Zelle requires both email and phone. Cash App and Apple Cash preserve actual variants. Private destination is deliberate; no receiving-handle default. |
| D36 first-three-period guarantee | Actual paid amounts are summed separately from product money and net receipt. Unknown old $25/broader-promise evidence remains typed unavailable. **CF1/CF2/CF3 remain below.** |
| D37 referral | Private relation/payee and earned first-$100 trigger, 48 elapsed hours and no clawback are modeled. Actual new-referral proof, uniqueness and accounting constraints remain deferred; no analytics or transfer execution is added. |
| D38 ended-care administration | Report explicitly requires separate unfinished-admin authority with live owner/audience/session/deletion/private-right checks. No care-window bypass or privilege is granted by these pure DTOs. |
| Existing families / agents | Commerce30 is 10 READ / 20 WRITE, fixed `concierge_commerce_command_v1`. New `commerceTaskActions=[]`. Existing Task14/Plan26/Care13/Review15/Guidance9 source is unchanged. |
| Exact write/status intent | Positive mapper binds actor/client/action/request/hash/entity/subject/quote/payment basis; actual V2 receipt checks remain. Malformed write maps to uncertain; status is READ/unavailable. Relational truth and journal concurrency are not proved by a matching digest. |

## Findings

### CF1, important: a known guarantee deadline requires the third payment to exist

Location: [PortalCommerceValidation.ts:81](../../../src/contracts/PortalCommerceValidation.ts#L81), [ServiceRefundBasis](../../../src/contracts/PortalCommerce.ts#L75). Specification/completeness finding, reproduced safe refusal of supported composition.

[D35-D36](../APPROVED_DECISIONS.md#L95) requires monthly service without mandatory three-month payment, refunds of fees actually paid, early requests, and the request window through 30 calendar days after period three. Founder operations explicitly says to give the actual deadline in the welcome handoff. The calendar guarantee and paid-allocation sum are different facts.

Counterexample: first publication `2026-01-01`; only one genuinely paid service period, `[2026-01-01,2026-02-01)`, $100. With the retained monthly rule, period three ends `2026-04-01`, deadline `2026-05-01`. These dates avoid any anniversary/month-end ambiguity. A dissatisfied early/cancelled client is owed the actual $100 paid, not three fabricated payments.

The proposed helper accepts this basis only with unknown third end/deadline. Supplying the known calendar end/deadline fails `invalid_input`, because it looks for ordinal 3 in `periods`, whose members require actual claimId, quoteId and serviceCents=10000. A caller cannot honestly add that row. This is a contract-level unsupported composition, not an authorization refusal or a missing dependency. It does not demonstrate that the request endpoint already denies refunds; no endpoint exists.

Reproduced by actual exported functions:

```ts
// base: supported assessment with one actual paid ordinal-1 row,
// firstPublicationOn known('2026-01-01'), refundableCents:10000.
let third = '2026-01-01';
for (let i=0;i<3;i++) third=commerceCalendarMonthEnd(third)!;
// third === '2026-04-01'; commerceAddCalendarDays(third,30) === '2026-05-01'
checkServiceRefundAssessment({...base,basis:{...base.basis,
  periodThreeEndsOn:known(third),
  requestDeadline:known('2026-05-01')}}); // throws invalid_input
```

Required resolution before pin: represent the versioned calendar guarantee basis independently of actual paid allocations and validate their relationship. Preserve unknown prepublication anchors and genuinely unavailable imported terms; do not require payment of an unowed third month or manufacture claim rows. This calls for a bounded contract correction, not a change to the approved refund policy.

### CF2, high: delayed manual entry of repayment details extends the promised clock

Location: [manual details payload](../../../src/contracts/PortalCommerce.ts#L64), [obligation clock](../../../src/contracts/PortalCommerce.ts#L77), [mapper:67](../../../src/contracts/PortalCommerceMapping.ts#L67). Specification and correctness finding, reproduced accepted incorrect deadline.

D36 starts 48 elapsed hours after the actual request and necessary privately confirmed repayment details. Manual text/call requests are supported and already carry their actual occurredAt. The details command records confirmation/reference but has no actual occurrence timestamp. Its clock instead uses `detailsRecordedAt` and the mapper requires `max(requestedAt,detailsRecordedAt)`.

Counterexample: client requests repayment and supplies/privately confirms the complete Cash App destination on `2026-04-01T12:00:00Z`; founder enters it on April 3. Actual initiation deadline is April 3 at noon. The actual parser accepts `record_repayment_details_v1`, rejects an added `occurredAt` field, and the actual mapper accepts a service obligation with:

```ts
clock: {kind:'service_request_and_details', requestId,
  requestedAt:'2026-04-01T12:00:00Z', detailsId,
  detailsRecordedAt:'2026-04-03T12:00:00Z'},
triggerAt:known('2026-04-03T12:00:00Z'),
initiateBy:known('2026-04-05T12:00:00Z')
```

The private details projection also has only recordedAt. Encoding the occurrence in free-text confirmationReference cannot drive a typed authoritative clock. Backdating server recording time would corrupt provenance. This is not a DST calculation error: exact 48-hour arithmetic works, but it uses the wrong event time for a supported manual workflow.

Required resolution before pin: separately represent actual confirmed receipt of necessary details and server recording time, with attribution/evidence and known/unknown handling; calculate from actual request/details facts. Unknown historic occurrence must not silently become recording time. Keep the payment destination private and preserve current scope/session checks.

### CF3, important: supported refund basis accepts periods impossible under retained canonical rules

Location: [PortalCommerceValidation.ts:78](../../../src/contracts/PortalCommerceValidation.ts#L78), [mapper refund validation](../../../src/contracts/PortalCommerceMapping.ts#L62). Correctness/quality finding, reproduced malformed success accepted by the positive mapper.

The canonical [activate_service](../../../supabase/migrations/20261018234537_concierge_portal_workflows.sql#L155) anchors the initial paid period to first publication. [service_anchor/invoice_period](../../../supabase/migrations/20261018234537_concierge_portal_workflows.sql#L148), quote validation and confirmation use the preceding maximum end for each subsequent period. There is no new future calendar branch in this six-file proposal.

Counterexample passed through `mapCommerceResult(read_commerce_detail_v1, refundRequestEnvelope, ownerContext)`:

```ts
firstPublicationOn:known('2026-01-02'),
periods:[
  {ordinal:1, claimId:A,quoteId:A,serviceCents:10000,verifiedAt,
    period:{startOn:'2026-01-01',endOn:'2026-02-01'}},
  {ordinal:2, claimId:B,quoteId:B,serviceCents:10000,verifiedAt,
    period:{startOn:'2026-03-01',endOn:'2026-04-01'}}
],
periodThreeEndsOn:unknown, requestDeadline:unknown,
broaderPromiseRef:null
// refundableCents:20000, eligibility:'eligible': accepted as supported.
```

All identities and individual month lengths are valid. Nevertheless the first period predates its stated publication and period two skips February. The checker never binds firstPublicationOn to period one and checks the next start with `>=`, allowing gaps. It can label internally impossible data supported despite having all facts needed to reject it.

Required resolution before pin: check the finite relationships of this declared retained calendar policy, including initial publication anchoring, consecutive period basis and pending/publication consistency. A separately approved future policy must be an explicit versioned branch. SQL must still verify actual ledger references; this finding requests no claim that a pure mapper can authenticate database facts.

## Independent execution evidence

All Node invocations used the explicit Node22 PATH. Existing typeless-package warnings are retained, with no package edit. No setup/import failure is counted as a finding.

| Check | Actual result |
| --- | --- |
| New commerce28 plus retained payment/method/service24 | **52 passed, 0 failed/skipped**, runner 360.29075 ms |
| Four proposed modules, full transitive actual imports, strict compiler | Exit 0, zero diagnostics, 1.472 s |
| Actual proposed test file, same strict flags | Exit 0, zero diagnostics, 1.679 s |
| Independent actual-import source probe file, same strict flags | Exit 0, zero diagnostics, 1.338 s |
| Seven independently authored source probes | **4 passed / 3 failed / 0 skipped**, exit 1, 159.347292 ms. CF1 unwanted invalid_input, CF2 April5 versus April3, CF3 missing expected rejection. These are requirements assertions against unchanged proposal bytes. |
| Exact import, original provenance, project/eight-role settings and parent migration preservation | All checked successfully |

The maximum-vector test was independently executed: 50 source-valid maximal Unicode lines, **1,215,071 UTF8 bytes**, four complete line pages, largest complete page **389,411 bytes**; 101 actual-source-valid options in two pages; largest line preparation command **24,942 bytes**. The actual legacy V2 parser accepts the 50-line issue vector and its mapper accepts all 101 options. Missing last line, duplicate pages and mismatched component requests reject. This is evidence of bounded complete pure composition, not real SQL paging.

The independent passing probes exercised the actual mapper/parser with another owner, a synthetic private canary, clinical Start/role/receiving-default extras, actual command-derived hash, wrong write UUID and wrong committed-status UUID. These checks are source safety refusals, not live authorization/RLS evidence. CF1 is instead a supported composition refused by the helper; CF2/CF3 are incorrect accepted finite projections.

Exact executable commands, working directory as above:

```sh
env PATH=/Users/kanuj/.nvm/versions/node/v22.23.0/bin:$PATH node --version
env PATH=/Users/kanuj/.nvm/versions/node/v22.23.0/bin:$PATH node --experimental-strip-types --test tests/portal-commerce-contract.test.ts tests/concierge-payments.test.ts tests/concierge-payment-methods.test.ts tests/concierge-service.test.ts
env PATH=/Users/kanuj/.nvm/versions/node/v22.23.0/bin:$PATH node /Users/kanuj/.t3/worktrees/shelv/kanuj-portal-rebuild-integration-20261030/apps/portal/node_modules/typescript/bin/tsc --ignoreConfig --noEmit --strict --noUncheckedIndexedAccess --verbatimModuleSyntax --skipLibCheck false --allowImportingTsExtensions --target es2022 --module esnext --moduleResolution bundler --lib ES2022,DOM,DOM.Iterable --jsx react-jsx --types react,react-dom --typeRoots /Users/kanuj/.t3/worktrees/shelv/kanuj-portal-rebuild-integration-20261030/apps/portal/node_modules/@types src/contracts/PortalCommerce.ts src/contracts/PortalCommerceValues.ts src/contracts/PortalCommerceValidation.ts src/contracts/PortalCommerceMapping.ts
env PATH=/Users/kanuj/.nvm/versions/node/v22.23.0/bin:$PATH node /Users/kanuj/.t3/worktrees/shelv/kanuj-portal-rebuild-integration-20261030/apps/portal/node_modules/typescript/bin/tsc --ignoreConfig --noEmit --strict --noUncheckedIndexedAccess --verbatimModuleSyntax --skipLibCheck false --allowImportingTsExtensions --target es2022 --module esnext --moduleResolution bundler --types node --typeRoots /Users/kanuj/.t3/worktrees/shelv/kanuj-portal-rebuild-integration-20261030/node_modules/@types tests/portal-commerce-contract.test.ts
env PATH=/Users/kanuj/.nvm/versions/node/v22.23.0/bin:$PATH node /Users/kanuj/.t3/worktrees/shelv/kanuj-portal-rebuild-integration-20261030/apps/portal/node_modules/typescript/bin/tsc --ignoreConfig --noEmit --strict --noUncheckedIndexedAccess --verbatimModuleSyntax --skipLibCheck false --allowImportingTsExtensions --target es2022 --module esnext --moduleResolution bundler --types node --typeRoots /Users/kanuj/.t3/worktrees/shelv/kanuj-portal-rebuild-integration-20261030/node_modules/@types .local-artifacts/w7-commerce-review/source-probes.test.ts
env PATH=/Users/kanuj/.nvm/versions/node/v22.23.0/bin:$PATH node --experimental-strip-types --test .local-artifacts/w7-commerce-review/source-probes.test.ts
git diff --check
```

Own ignored evidence is retained under `.local-artifacts/w7-commerce-review/`: `runtime.json`, `task-status-source.txt`, `blobs.json`, `provenance.json`, `pure-tests.log`, `source-probes.test.ts`, `source-probes.log`. Probe source is deliberately uncommitted under the assigned report-only write boundary. Counterexamples above contain enough finite facts to recreate the substantive failures; IDs in the probe are synthetic.

## Deferred semantics, skipped checks and disposition

The [MIGRATIONPLAN](W1_COMMERCE_CONTRACTS.md#L87) identifies retained canonical tables, typed sidecars, head CAS, format/old-writer gates, atomic linkage/rollback, private RLS/ACL, shared request/client locks and admin-after-care guards. These are implementation requirements, not enabled or source-tested database behavior. Missing actual legacy $25 or broader-promise proof appropriately returns unavailable; no fake money/terms are requested to close this review. Unsupported alternative selection remains explicitly unavailable. Those deferrals are not counted as bugs in this pure phase.

Not executed: Root npm test/full app/test tsconfigs/Expo/native export/full portal build, dependency install, SQL reset/pgTAP/RLS/ACL execution, concurrent journal/CAS/caps or after-wait revocation, actual Auth/Edge/PostgREST/Storage/cookie/Vault, browser/visual/UI, genuine paging/money/fulfillment/return/referral effects, canonical62/R9, hosted, CI or release checks. Root dependencies are absent in this worktree; only read-only parent compiler/type packages were used, with no resolver stub, copied production source, tsconfig or flag weakening. No backend/runtime acceptance follows from 52 pure passes or strict compilation.

**Specification/completeness FAIL:** CF1 and CF2 leave supported approved refund behavior unrepresentable or incorrectly timed before coordinator pin. **Correctness/quality FAIL:** CF2 and CF3 require finite contract/mapper corrections despite the passing baseline suite. No other material finding is asserted from this bounded review. The reviewer made no fixes. The coordinator owns the next author correction task, independent re-review, pin and any later Phase 2 allocation.

This review's own commit changes only this report. The six imported author blobs and all five originals remain unchanged. The final report-only commit SHA is returned separately to avoid a self-referential document hash.
