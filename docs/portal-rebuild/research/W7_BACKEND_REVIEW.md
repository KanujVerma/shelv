# W7 independent plan backend and cookie/gateway review

Owner: Kanuj. Review date: 30 October 2026. This is the independently executed review of the first care-plan backend slice and coordinator gateway composition, not final portal, source/upload, orders, delivery, Auth or release acceptance.

## Verdicts

- **Specification compliance: FAIL.** F1-F5 are important reproducible gaps in live source permissions, post-service care access, exact section review, the single working-draft invariant and publication readiness. They block accepting this slice against the frozen contract.
- **Code quality/correctness: FAIL pending F1-F5.** The fixed channel, closed parser/response mapper, private tables and transactional publication design are substantial foundations. Passing existing cases does not cover the authorization and semantic omissions reproduced below. Q1-Q2 are additional bounded defects.
- No critical/high severity or blanket security certification is asserted. F1-F5 are priority P2, important for this acceptance gate. Q1 is a follow-up correctness defect in the implemented source-metadata seam; Q2 is low priority P3. Source upload, real delivery, final pages and broader service/order functionality remain explicit unfinished scope, not accepted mocks.

## Exact source and runtime

| Item | Independently verified value |
| --- | --- |
| Workspace | `/Users/kanuj/.t3/worktrees/shelv/t3-632797e3` |
| Branch | `t3/review-plan-backend-slice` |
| Reviewed starting HEAD | `129635e88f91e9539973062a60779f717f2a935a` |
| Original backend range | `a7f4f36591a7965bcaa1ca3899c82f9b84fabe0c..d6840ac8eae9be314ab7f1466e5f4373c308391b`, including `3c226a8`, `26a4e88`, `a9f073a` and report `d6840ac` |
| Integrated backend commits | `7abaabc008a3cfdeeeafa8f9e231737ccffabb09`, `e3fd12c0323a1966734c2a8197d6701a29466891`, `8134a11000e560da341347c7bafb33fade221e2d`, `5e258527f62e895d09553ccb638b25a3a1151a7d` |
| Coordinator composition | `129635e88f91e9539973062a60779f717f2a935a` |
| Scoped patch | `/Users/kanuj/.t3/worktrees/shelv/kanuj-portal-rebuild-integration-20261030/.local-artifacts/portal-rebuild/W1-backend-gateway-review.patch` |
| Patch SHA-256 | `636b8004bf426a1d76df22b22aeb3129256309a27e9b13c8e4be1e540157c89c` |
| Live model selection | T3 `orchestrator_capabilities({})` and `t3_thread_configuration({})` both returned provider `codex`, model `gpt-6.1-sol`, `reasoningEffort=xhigh`, `serviceTier=default`, full-access/default modes |
| Task identity | `portal-rebuild-w7-backend-review-20261030-r1`, as the final component of the tools' delegated-thread ID |
| Node | `/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node`, `v22.23.0` |
| PostgreSQL | `/opt/homebrew/opt/postgresql@15/bin/`, PostgreSQL `15.19 (Homebrew)` |
| Freshness | Initial checkout clean; `git fetch origin` succeeded; `origin/main=d39a7d4943209080df7c4cf97d85784f462758bf`; `HEAD...origin/main` was `26 0` |

`git apply --reverse --check` succeeded against the scoped patch. Independently resolved every patch's new blob with `git rev-parse HEAD:<path>`: **all 24 changed-file blob IDs match**. The application source reviewed remains the starting HEAD; this task adds only this report. The report commit is returned in the handoff rather than embedded self-referentially here.

Read the applicable root/portal instructions, rebuild entry point/status/workstreams, approved desktop specification, [PLAN_API_V1](../PLAN_API_V1.md), [implementation contracts](../IMPLEMENTATION_CONTRACTS.md), [approved decisions](../APPROVED_DECISIONS.md), [W1 reconnaissance](W1_BACKEND.md) and [implementation report](W1_IMPLEMENTATION.md). D14-D40 and D46-D47 govern the findings. Inspected the complete affected source files and necessary production parser, Auth transport, vault, original SQL guards and service/history readers. The generated SQL JSON content/action shapes were parsed and compared with the actual TypeScript exports: content and **all 22 action schemas match**.

Review model: browser/external-agent inputs and returned upstream JSON are untrusted; stored server-owned policy/principals/grants and actual Auth/session/enrollment/payment rows determine authority. A task agent is not a global advisor. A delivery service is a distinct trusted actor with only four fixed RPCs. Private authoring/source-derived facts, exact approvals, immutable publications and money/use history are separate protected assets. Fixture-owner seeding below is test preparation, not a proposed attacker capability.

## F1: revoked human source access is bypassed by stored receipt reads

**P2, important authorization defect.** Locations in `supabase/migrations/20261030223603_portal_rebuild_plan_v1.sql`: `96-102` (human authorization returns without source checks), `312-317` (status), `353-360` (exact retry), compared with `135-141` (live source permission check).

A normal non-owner human can save/read source-linked private authoring content when `plan_source_permissions` allows it. After that permission is removed, `read_draft_v1` correctly denies. `request_status_v1` returns the saved private `DraftView`, and an exact retry of the original save also returns it before reaching `plan_content_check`. The general principal/session/client checks do not reauthorize the receipt's source-derived content.

Independent reproduction `source_revoked_receipts`:

1. Use the unchanged native helper's `setUp()` and `saved()`; enroll one synthetic client-scoped source and grant human S its source permission.
2. Through the **actual plan Edge handler/parser/result mapper and persisted SQL**, save a private fact containing `REVIEW_PRIVATE_SOURCE_CANARY`, linked to that source. Retain the exact save command/request UUID.
3. Remove only S's source permission as fixture owner.
4. Fresh draft read: **403 `forbidden`**. Exact save replay: **200, private canary present**. `request_status_v1` for that save: **200, private canary present**.

This is same-principal post-revocation disclosure, not a demonstrated cross-client or raw-recording download. Previous permission does not authorize another server disclosure after revocation. Reauthorize the actual stored response's private/source scope before returning it, including immutable receipts whose source references no longer match the current draft. Add coverage for source permission removal/deactivation and both replay/status paths; retain idempotency without re-executing effects.

## F2: an existing public administrative read still exposes expired care history

**P2, important access-boundary defect.** New migration `591-615`, especially the finite reader list at `593`, omits `concierge_service_client_view`. Supporting existing source: `supabase/migrations/20261025221028_concierge_service_workflows.sql:66-79`; retained browser channel: `apps/portal/session-integration/runtime/server/client-policy.ts:6`.

The new plan read enforces the exclusive support-end-plus-30-calendar-day boundary. The still-public service read uses `concierge.access` and returns `service_projection_data(...,false)`, including public reviews and entitled instruction history with purchases/returns/cancellation. It does not apply the new care window. Its retained `service_client_read` browser command and authenticated public RPC remain reachable. Keeping unfinished administration available therefore also keeps care history available.

Independent reproduction `expired_care_via_admin_projection`:

1. While policy is explicitly dormant, create a **valid historical review via the real public service write**, with summary `REVIEW_EXPIRED_CARE_HISTORY`; reactivate the candidate.
2. Publish a new V3 plan through normal review/approval/verified-payment commands.
3. Persist the synthetic boundary state `supportEndsOn=Chicago today-30` without changing server time. This models an already-ended service at the exclusive cutoff; it is fixture setup, not a claim that the ordinary cancellation command permits arbitrary backdating.
4. New `read_client_plan_v1`: **403 `forbidden`**. Authenticated `public.concierge_service_client_view()`: **exit 0, expired review canary returned**.

Split or filter care versus administrative projection under a common current access guard. Preserve access to unfinished orders/refunds without returning expired reviews/instructions. Check the parallel check-in/history/media readers for the same required boundary; this reproduction establishes the service-read instance, not an exhaustive runtime claim about every older endpoint.

## F3: some published fields never invalidate a section review

**P2, important specification/correctness defect.** New migration `170-171` (`plan_section_hash`), `204-205` (review readiness), `181` (published fields).

`preparation`, `consultationSections` and top-level `routineGuides` are in the saved and published content but absent from **every** section hash. A content revision changes and whole-publication approval correctly becomes stale, but the section-review checklist still says all sections were reviewed even after new client context or practical instructions are added.

Independent reproduction `omitted_section_dependencies`:

1. Save, assign and review all five sections using the unchanged native helper's `reviewed()`.
2. Save new consultation text, a new routine guide/step and changed preparation attribution.
3. All five section hash/review records are **unchanged**, all remain `reviewed:true`, and readiness issues are **`[]`**.
4. With a new exact human approval and verified payment, publication succeeds **200** and the new unreviewed guidance appears in the client read.

This does **not** bypass exact whole-publication human approval. It falsifies the independent required-section review state. Map every published authoring field to its review dependency, including guide/source/consultation fields; verify a field edit invalidates its affected reviews while payment-only bookkeeping does not.

## F4: the activated candidate permits two independently editable working drafts

**P2, important lifecycle defect.** New migration `11-12` (new-table-only uniqueness), `379-384` (assignment), `583` (legacy save fence depends on an existing V3 publication).

The new partial unique index enforces one `plan_drafts` working row per client. It does not account for an existing `concierge.drafts` row. Before the client's first V3 publication, the activated candidate also accepts old `save_draft`/`save_draft_v2` operations. Assigning a new working draft neither adopts the old draft nor freezes its legacy editing surface.

Independent reproduction `two_working_draft_surfaces`, with policy **activated throughout**:

1. Use authenticated legacy public operations to save a real synthetic intake and working R1 draft.
2. Create a new empty unassigned plan draft and assign it to that same existing client.
3. Save another change through the legacy public draft command and another through `save_draft_v1`.
4. Both saves succeed; database counts are **one legacy draft plus one new working draft** for the client.

No legacy publication bypass is claimed: old publication still rejects. The issue is two mutable sources of next-version advice, contrary to D14 and the explicit legacy-adoption contract. Adoption/conflict handling must preserve existing unpublished work and establish one writable authoring surface before assignment succeeds. Do not solve it by deleting the older draft.

## F5: whitespace-only proposed-product directions pass publication readiness

**P2, important semantic-readiness defect.** New migration `197-198`, contrasted with the explicit nonblank routine checks at `200-201`.

For `addition`, `replace`, `finish_then_replace` and `optional_alternative`, decision readiness checks only that `directions` has a nonzero array length. Safe incomplete storage intentionally allows blank text. Readiness therefore treats `directions:['   ']` as complete guidance.

Independent reproduction `blank_decision_directions`: create a named, client-confirmed synthetic product and an addition decision with a valid goal, reason and evening schedule but whitespace-only directions; review all sections. Issues are **`[]`**, exact approval succeeds and publication succeeds **200**. No actual-use activation occurs.

Keep incomplete saves valid, but require meaningful instructions where the decision kind needs them before approval/publication. Test empty-string and whitespace entries through both SQL and the actual handler. This finding asserts missing practical guidance, not clinical validation of the sample product.

## Q1: a published draft-bound source prevents restoration

**P2 follow-up correctness defect in the current metadata seam.** New migration `487-495`, especially `493`; source-scope predicate at `135`.

`restore_publication_v1` retrieves the original private authoring body and calls `plan_content_check(body,null,c)` before allocating the new draft. A lawful source enrolled against the original unassigned draft has `client_id=NULL,draft_id=<original>`. Save, assignment, review and publication accept it using the original draft ID. Restore supplies NULL, so neither the client nor draft branch of the scope predicate matches.

`restore_draft_bound_sources` created precisely that source reference, saved and assigned the draft, reviewed/approved/funded/published it, then restored version 1. Restore returns **409 `source_conflict`** despite unchanged active source metadata and owner authority. Source-free V3 and rich legacy restores pass the existing suite; the source-linked case above is additional.

Define an explicit lawful source-reference adoption/projection for the new working draft. Do not weaken source ACLs, silently transfer another client's source, or drop provenance to make restore pass. Actual file upload/retention remains disabled and was not accepted by this metadata test.

## Q2: NULL bypasses the delivery claim batch bound

**P3, low-priority service-only input defect.** New migration `619-622`, exposed only by `public.concierge_plan_delivery_claim_v1(integer)` at `669`.

`IF p_limit NOT BETWEEN 1 AND 50` does not reject SQL NULL. PostgreSQL `LIMIT NULL` means no limit. In `null_delivery_limit`, 56 explicitly synthetic queued email jobs were present; `SET ROLE service_role; SELECT public.concierge_plan_delivery_claim_v1(NULL)` claimed **all 56**, exceeding the advertised maximum 50.

This is not a browser/agent privilege bypass or an external send. The service-only ACL is correct. Reject NULL explicitly and audit the remaining fixed delivery parameters for SQL three-valued-logic gaps, especially expected revision checks. No unexecuted variant is asserted as a confirmed finding here.

## Independently reproduced positive evidence

| Boundary | Actual evidence and limits |
| --- | --- |
| Incomplete, unassigned, restore and assignment | Native cases 1/5/17/21/23/24/29 pass: no fake Auth/case creation; incomplete save/reload, CAS, import/checkpoint, legacy restore, actual handler agent create/save/assign and ambiguous-create denial. New-table uniqueness exists; F4 identifies its missing legacy coordination. Q1 identifies the restore source case. |
| Human/owner/agent authority | Native 5/11/12/16/19/22/27/29 pass: registered permanent principals, finite one-client OR existing-draft session grants, cross-client denial, human-only review, owner-controlled Sami policy, exact owner-authorized agent publication, revoked grant/session/receipt denial, scoped sources and ambiguity refusal. F1 is the separate human source-receipt gap. No name, role payload, user metadata or model field grants authority. |
| Approval/payment/publication | Native 2/3/4/9/13/14/18/19 pass: payment-independent exact target, deny missing payment/stale approval, one identical concurrent receipt, one winner for competing requests, rollback on outbox failure, later publication preserves clocks, decision response creates no Start/payment/order. First payment uses canonical quote/claim/manual confirmation rows, not an invented receipt. Synthetic ledger verification is not real money. |
| Legacy guidance barriers | Native 7/10 pass: old public R1/R2 publish, instruction publish, public review/reply, low-level insert and bare V3 linkage reject. Private helpers remain non-executable. Case 25 explicitly proves a dormant historical receipt and activated authorized retry without repeating effects; it is not publication-before-payment candidate acceptance. No caller opt-out/GUC bypass was found in inspected new barriers. |
| History/privacy/access | Native 6/12/14/18/23/28 pass: prepublication preparation, private-fact/source/reference exclusion, source-version target invalidation, current/historical legacy/V3 reads, no implicit Start, current-use selection preserving immutable history, read-only care-write denial. F2 is the remaining old administrative reader. |
| Transactional outbox | Native 9/20 pass: durable publication/event/email/portal/receipt linkage and rollback; concurrent claim uniqueness, result/retry retain publication/event/delivery identity. No external send occurred. Provider reconciliation/webhook/seen behavior remains later work. |
| Actual production gateway/parser/provider | All 9 `plan-channel.test.ts` cases pass, using production `parseCommand`, `parseClientCommand`, `SupabaseProvider`, `ClientProvider`, gateway and cookie factories. Tests cover unknown authority/RPC/URL fields, audience/role capability negatives before egress, malformed/private results, safe conflicts, fixed `concierge-plans` egress, cookie/CSRF/no-store transport, missing-session denial and plan-only 500,000 versus legacy 100,000 byte bounds. Browser service-delivery actions are absent from the closed action metadata. These are synthetic boundary tests, not actual cookie/Auth acceptance. |
| ACL/RLS/search paths | Independent catalog query: zero plan tables with RLS disabled; zero raw plan table privileges for anon/authenticated/service_role; zero private plan helper EXECUTE grants for those roles; zero unpinned plan search paths. Public plan RPC is `f/t/f`; each of four public delivery RPCs is `f/f/t` for anon/authenticated/service_role. Native shells do not model every hosted role setting; raw ACL denial is still directly observed. |

The canonical migration adds no owner/principal/task/source grant seed. Rehearsal independently compared exact before/after historical publication/R2/intake/payment/period/entitlement/receipt/Start JSON, excluding only the added discriminator, and passed. No fake intake, product price, notification backfill or replacement Start was required. Private walkthrough namespaces are outside the new barriers and remain unchanged in inspected source; this rehearsal did not seed a full private-walkthrough history.

## Commands, results and fixture custody

All Node commands used `PATH="/Users/kanuj/.nvm/versions/node/v22.23.0/bin:$PATH"`; PostgreSQL commands selected `/opt/homebrew/opt/postgresql@15/bin` explicitly. Dependency setup used the unchanged lockfiles and `npm ci --ignore-scripts --no-audit --no-fund`. An initial install from the runtime directory selected the portal workspace; the explicit `--prefix apps/portal/session-integration/runtime` install then supplied the runtime dependencies. No package/lockfile changed.

Before starting: `pg_ctl -D /tmp/shelv-w1-plan-pg/data status` returned **no server running**. Verified directory identity, `PG_VERSION=15` and saved `postmaster.opts` for this exact cluster. Started only that server:

```sh
/opt/homebrew/opt/postgresql@15/bin/pg_ctl \
  -D /tmp/shelv-w1-plan-pg/data \
  -l /Users/kanuj/.t3/worktrees/shelv/t3-632797e3/.local-artifacts/portal-rebuild/w7-backend-review/server.log \
  -o "-k /tmp/shelv-w1-plan-pg/socket -h '' -p 55439 -c max_connections=12 -c shared_buffers=16MB" start
```

Before `--prepare`, queried the running server over **only** `/tmp/shelv-w1-plan-pg/socket:55439`. It returned PostgreSQL 15.19, exact data directory `/tmp/shelv-w1-plan-pg/data`, `listen_addresses=''`, exact socket directory and database `shelv_w1_plan_v1_synthetic` with comment **`W1 plan v1 synthetic Unix socket fixture 20261030`**. No unexpected server was adopted. Connections cleared ambient PG variables and used the harness's no-password-file and `/dev/null` service file.

| Command/check | Actual result |
| --- | --- |
| `python3 tests/portal-rebuild-native.py --prepare` | Exit 0; 15 canonical concierge prerequisites plus the new migration; historical byte/date/identity preservation and zero principal/owner seeds passed. This is not all 54 canonical migrations. |
| `python3 tests/portal-rebuild-native.py` | Exit 0; **29 passed, zero failures/skips**, 14.264 seconds. 28 activated cases plus one explicitly dormant historical-receipt case. |
| `node --experimental-strip-types tests/portal-rebuild-domain.test.ts` | Exit 0; **7 passed**, zero skips/failures. |
| `node --experimental-strip-types tests/portal-rebuild-handler.test.ts` | Exit 0; **3 passed**, zero skips/failures. |
| Bundle actual `runtime/tests/plan-channel.test.ts` with the checked-in runtime esbuild, then `node --test <review-artifacts>/plan-channel.test.mjs` | Exit 0; **9 passed**, zero skips/failures. No test or production code was modified. |
| `npx tsc --noEmit` | Exit 0; zero errors. |
| `npm run typecheck:tests` | Exit 0; zero errors. |
| `npm --prefix apps/portal/session-integration/runtime run typecheck` | Exit 0; zero errors. |
| Actual `buildCandidate({outdir:<review-artifacts>/candidate})` | Exit 0; client gateway, advisor gateway and vault bundles built. |
| Parse SQL schema JSON; compare to imported `planContentShape`/`planCommandFields` | Exit 0; content plus all 22 commands match exactly. |
| Review `acl.sql`, explicit fixture-only `psql -X -w ... -v ON_ERROR_STOP=1 -f <review-artifacts>/acl.sql` | Exit 0; RLS/raw ACL/private helper/search-path query clean; exact public role matrix above. |
| `PYTHONDONTWRITEBYTECODE=1 python3 <review-artifacts>/reproduce.py` | Exit 0; all **seven targeted defect observations** reproduced, as recorded above. This script intentionally demonstrates bad outcomes, not seven acceptance passes. |
| Patch reverse check and all 24 HEAD blob comparisons | Passed. |
| `git diff --check`, report path/link/scope validation | Passed before report commit; only this Markdown report is staged. |

Initial gateway bundle/build attempts warned that root `expo/tsconfig.base` was absent before root dependency setup. The corrected final build after root `npm ci` exits 0 without that warning. Root Node tests emit the pre-existing typeless-package module warning. These environment/setup outputs are retained; neither is claimed as a product defect.

After completing all database reproductions, reconfirmed exact cluster/database marker/settings, then:

```sh
/opt/homebrew/opt/postgresql@15/bin/pg_ctl -D /tmp/shelv-w1-plan-pg/data -m fast stop
/opt/homebrew/opt/postgresql@15/bin/pg_ctl -D /tmp/shelv-w1-plan-pg/data status
```

Stop succeeded; final status is **no server running**. Original data directory and original `server.log`, `root-tests.log`, `advisors.log` were retained. Only the explicitly disposable marked database was prepared/mutated. No Docker/Colima/parent Auth snapshot, TCP database, hosted credential or hosted resource was used.

## Retained independent artifacts and reproduction

Review artifact directory, ignored by Git: `/Users/kanuj/.t3/worktrees/shelv/t3-632797e3/.local-artifacts/portal-rebuild/w7-backend-review/`. The parent can inspect it in the shared filesystem. It contains the complete independent `reproduce.py`, `acl.sql`, targeted JSON observations, baseline logs and final fixture stop/identity evidence. The production/native test files remain unchanged.

To reproduce, obtain exclusive fixture custody again, follow the status/identity/marker checks above, run the **unchanged** native prepare/test commands, then run `reproduce.py` from this artifact directory with the same explicit Node/PG PATH and `PYTHONDONTWRITEBYTECODE=1`. The script imports the checked-in native helper using `importlib`, resets only its marked disposable synthetic records between cases and invokes the actual handler via `tests/portal-rebuild-native-edge.mjs`. It never supplies a fake SQL success. Source metadata, source permission revocation, historical records and boundary dates are explicitly seeded synthetic state. The handler's Auth port is synthetic; genuine JWT verification is not exercised by this bridge.

| Retained file | SHA-256 |
| --- | --- |
| `native-prepare.log` | `5888b666d6f88bd62103be98bb12dcbf5deece408a50c59d3b5751a2f4f9e348` |
| `native-tests.log` | `aacee699c2b69c550c79d274680071651da82cf2b4f325139013ade411ea1ce9` |
| `reproduce.py` | `a50d40dfbb23eb3dd172fc5b7e0228a6aaa81dc9fad2c41f6d826ed3857781d5` |
| `reproduce.log` | `7374f16d0caccb6196b8d7a17302e0ffa67cb3d587294c4e267ea47b0cc59e20` |
| `acl.log` | `d64d19a298ddd3011c4332e5356863400843ff3d788b2ce457798dc1ee45cd0c` |
| `plan-channel.log` | `6f6b50b6c52559220d5ca482a1d1cb2c5967e25bd0655d8e9f8fb892c9221683` |
| `fixture-identity.log` | `057e62bee264b4c0a24f2990d46b53ba1e050b9acb230f2b96baa5b3fa62a46e` |
| `fixture-stop.log` | `ca19178a35ab4153b75b494963b66ce8243e1b94c173107c87b44d09db23652d` |

## Coverage and remaining uncertainty

All 24 affected files were inspected: gateway `client-policy`, `client-upstream`, `gateway`, `plan-policy`, `policy`, `upstream`; `plan-channel.test`; both retained cookie-session factories and `plan-actions.js/.d.ts`; four `PortalRebuild*.ts` files; all three `concierge-plans` files; the one new canonical migration; its pgTAP file; both root domain/handler tests and the native Python/Edge bridge. Supporting unchanged production transport/vault and legacy SQL call chains were followed where required. No deleted file is present in the supplied inventory.

This is a manual independent specification/security/correctness review, not a completed Codex Security scan/SARIF artifact or a claim of exhaustive repository certification. The read-only security preflight returned ready with the requested no-delegation fallback. No subagents or persistent agent configuration changes were used.

The complete root `npm test` result of 1,186 passes/18 pre-existing skips and W1's security-advisor `[]` are **author evidence, not reviewer reruns**. Reviewer independently ran the new focused cases, types, bundles, catalog checks and persisted reproduction above. Full canonical `supabase db reset`, pgTAP, genuine Auth/PostgREST/browser/cookie lane, all portal/session suites, Expo web/iOS export, private-walkthrough migration rehearsal, final frontend/source/upload/orders/delivery flows and exact-head CI remain coordinator-owned/unverified by this review. The Deno serving entrypoint was inspected but not executed. The canonical source contains 54 migrations, with only `20261030223603_portal_rebuild_plan_v1.sql` newly allocated for this slice. The native harness's 15 prerequisite migrations and minimal Auth/profile/Storage shells do not replace that canonical lane.

No source fix, migration edit, push, PR, merge, deployment, client-data access, money movement, retailer action, email, CI watcher or second full stack was performed. The coordinator owns shared status/CONTEXT_SYNC updates and any fix allocation. This report is the sole owned durable change.
