# W7 photo-head source review R3

Owner: Kanuj. Independent report-only review, 1 November 2026. Workspace: `/Users/kanuj/.t3/worktrees/shelv/t3-bad9115a`, branch `t3/photo-head-source-r3`. Frozen Parent: `ab19cda33449e3dea8f228911ed1983ef7289ba1`. Immutable author target: `2fe1dd44009a9e4852c9dbbcbdb380c7fd2a7278`.

**SPEC/completeness: scoped PASS for the allocated metadata SOURCE and finite synthetic HTTP contract.** PH1 is independently reproduced on the old shared runtime and addressed on the exact current input. The fixed own-client read, strict projection, current-session fences and metadata-specific success budget meet the inspected source contract. This is not full C05/C07, SourceReady, activation or full-goal completion.

**Correctness/quality: scoped PASS at SOURCE / closed finite HTTP level.** No current material finding was identified in this allocation. Full strong Worker compilation retains 44 existing diagnostics, with zero introduced diagnostics. SQL, ACL, catalog, concurrency, genuine Auth/Storage/persistence, browser/native and release acceptance remain unrun. The historical [R1 FAIL](W7_PHOTO_HEAD_SOURCE_R1.md) and failed R2 import attempt remain immutable; neither is relabelled PASS.

## exact new input allocation and custody

This is a fresh R3 review following R2's reviewer import-tooling failure, not a retry or rerouting of a provider-refused verification. R2's complete report was read at `/Users/kanuj/.t3/worktrees/shelv/t3-41dd0be8/docs/portal-rebuild/research/W7_PHOTO_HEAD_SOURCE_R2.md`, report commit `9ac1936cdfc4f05a92cd6cb4641c24f4f4a8098b`. Its invalid `fd1b58657d7c7cec77d223733cfe9c6b7c3e66d3` input and conflict markers were not imported, repaired or executed. It supplies no PH1 or product verdict.

Parent supplied a conflict-free `git diff --binary` from exact ab19 to exact author 2fe1, limited to 17 paths. Both files were copied into this review's ignored evidence and checked against their originals:

| Input | Bytes | SHA-256 |
| --- | ---: | --- |
| `photo-head-2fe1-frozen-target.patch` | 111152 | `7cc774c03a554b982279579a407c5b115ad4f59585c883afe4ad61f68b9a237b` |
| adjacent `photo-head-2fe1-frozen-target.json` | 5846 | `ed58331c3c9fa29468bc463dc8b74f1c7787e5041d90b90cf054d558c71fdd76` |

The complete patch was checked against Git's freshly generated exact binary diff. Its 17 paths equal the original attributed head-family path union, with no extra path. Old/new index identities, modes, additions and patches were inspected before mutation. Working tree and index were clean at ab19 immediately before application.

`git apply --check --index` exited 0. Only then did a separate checked `git apply --index` command run, also exit 0. There was no cherry-pick or conflict resolution. Every resulting whole-file SHA-256, byte count, Git blob and mode matches both immutable author 2fe1 and the manifest. All modes are `100644`. The staged binary diff has exactly the allocated patch hash, there are no unmerged entries or leftover conflict markers, and all other 1,994 original paths remain byte/mode exact.

The 17 paths are:

- `apps/portal/session-integration/runtime/server/{client-policy,client-upstream,gateway}.ts`;
- `apps/portal/site/auth/client-cookie-session.js`;
- `apps/portal/tests/rebuild-photo-head-{source,closed,strict,rpc-bound}.test.mjs`;
- `docs/portal-rebuild/research/W1_PHOTO_HEAD_SOURCE.md`;
- `supabase/functions/concierge-checkins/{commands,handler,index,projection,types}.ts`;
- `supabase/functions/concierge-operations/runtime.ts`;
- `supabase/migrations/20261101195359_portal_rebuild_photo_head_v1.sql`;
- `supabase/tests/portal_rebuild_photo_head_v1.sql`.

After these proofs and staged `git diff --check` passed, the attributed **REVIEW-INPUT setup** was committed as `4706a470c693e1db32e7b50076efa1eceeba95ca`. Its message cites ab19, the Parent projection SHA and original `5d18f401b074348b4f986b32e65a8e0c3348e661`, `b42742a190fb55e1b2339c0017472dea03ea4e78`, `d226194115fd5917afa591f478e4c20836bc54a8`, `9595fd8a026abd80e245e9dd8b36b8dd54ff8fb3`, `6886f7f53e6fce07409cb2ee9f49e348326b4855` and `2fe1dd44009a9e4852c9dbbcbdb380c7fd2a7278`. That commit is input setup, not a reviewer-authored fix or delivery. **Deliver only this subsequent new report commit, excluding setup and its branch range.** Parent's separately reported successful apply-check is corroborating provenance, not counted as this review's execution.

The full author report including PH1 response, full R1 and failed R2 reports, original/raw failed results and responses were read and retained. A total of 146 top-level author/R1 input files and 54 R2 input files were copied with source/copy hashes; no foreign saved script was directly executed. The full original approved brief and appendices govern. All five retained approved-input byte counts/hashes match `INPUT_PROVENANCE.json`, including the 95,388-byte original SHA `c45701f9f54fd2b1dbb09bbd7aa2b9b437e9059aa6032b6f39411fe2e7f6efbd`. AGENTS, entry point, D01-D48, desktop specification, manifests, implementation contracts, workstreams/status and W4's original photo handoff were inspected. No W4 UI, RP1 implementation or RP1 probe was imported or run.

## PH1 independent unchanged OLD / CURRENT reproduction

Evidence home: `.local-artifacts/w7-photo-head-source-r3-20261101/`, relative to this worktree. The R1 original streamed probe was copied, hashed and rebound only to this checkout's module locations. Its probe body and assertion text remain byte-identical, SHA-256 `8f5b457128e16c6bb26c8be44ff7c586e603cb10de3cfa10199f967bfdefdcd0`. Global external fetch is denied. Its actual fault is the inner head RPC response, with no `overrideEdge` fault or successful OperationPort substitute.

The OLD experiment changes only the in-memory binding of `supabase/functions/concierge-operations/runtime.ts` to immutable d226. The own ignored `build-binding.mjs` reads that exact blob from Git during `write:false` bundling. Every other application input remains current. No tracked mutation, history rewrite or foreign runtime output is used. The same probe then runs on unmodified current 2fe1 input.

| Same original assertion | Actual result |
| --- | --- |
| OLD, d226 shared runtime only | **exit 1, 0/1**; 3,145,756 bytes consumed, 51 pulls, cancelled=false, safe final 503, no head acknowledgement |
| CURRENT, exact author 2fe1 | **exit 0, 1/1**; 65,562 bytes consumed, 2 pulls, cancelled=true, safe final 503, no head acknowledgement |

The 4096 limit applies to actual UTF8 success bytes before the shared reader retains an overflow chunk, allocates the final JSON buffer or decodes/parses it. The current original probe receives its first 64 KiB padding chunk after a 26-byte prefix; the crossing chunk is then rejected rather than retained. **This does not establish a 4096-byte network-delivery or total-heap maximum.** R1 established excessive consumption with safe rejection, not an authorization or clinical-data disclosure bypass. The original historical FAIL remains that historical result.

Only exact successful `concierge_checkin_head_v1` receives 4096. Other RPC successes retain `Number.MAX_SAFE_INTEGER`; Auth and error decoders retain their existing 2 MiB budget. AST normalization proves the shared-runtime executable difference from d226 is exactly that fixed-name success-budget conditional.

## source and finite-pipeline assessment

The action is exactly `{"action":"read_photo_head_v1"}` on existing client checkins. Root derives the verified owner and builds only `concierge_checkin_head_v1` with empty arguments. Extra request fields, owner/RPC/URL injection and advisor-channel use reject. The result is exactly one nonnegative safe-integer `revision`; null, missing, unsafe, clinical, private and additional fields reject. Root, ClientProvider and final positive gateway mapping use the same strict head mapper. There is no fallback to a lossy clinical read, inferred zero or Review head.

Actual ApplicationSession, retained client cookie, gateway, SessionVault, ClientProvider, canonical Root handler/index and shared RPC ingress are exercised together. Auth/context/RPC responses and durable-object storage/dispatch are closed synthetic transcripts; the real session/authority/fencing code runs. Unexpected URLs and Storage calls reject. No caller-supplied current/role/access flag or successful operation/session port supplies authority.

Positive and negative controls cover independent revision values including zero and MAX_SAFE_INTEGER, empty RPC arguments, extra/prototype-looking JSON fields, post-wait null/anonymous/replaced identity, revoked context, actual Vault absolute expiry, sign-out, current failed-read acknowledgement, relevance predicates that must return literal true, caller abort, CSRF/origin denial and no write/media side effect. The independent final-Auth decoding-wait probe also rejects owner replacement. Synthetic denial responses are not SQL authorization proof.

The combined author 11 new and 21 original controls exercise inclusive 4096/rejected 4097 bytes, missing and lying-small/lying-large Content-Length, multichunk and multibyte UTF8 input, overflow cancellation, stream errors and rejecting cancel, retained 401/403 semantics and non-head/near-match RPC names. Additional independent one-byte streams verify exact 4096 acceptance and 4097 cancellation with exact-length headers; malformed UTF8 fails closed; error-stream failure/2 MiB overflow preserves known 401/403; Auth success above 4096 remains valid under its unchanged separate budget.

Legacy positives remain distinct: the full session pipeline consumes a greater-than-3-MiB legacy RPC body and returns its unchanged projected view; actual Root/index/shared runtime returns all 850 clinical reports in a complete greater-than-2-MiB response; retained runtime tests preserve all 600 publication versions above 2 MiB. The existing ClientProvider outer response limit is unchanged. These results do not claim arbitrary-size clinical history crosses that outer boundary. The M59 clinical-history 409 fence, legacy writer AST, photo upload/media formats, limits and existing SQL remain unchanged.

SQL-source inspection follows the actual canonical helpers and writer, without executing SQL. The new guard checks permanent owner, deletion/banned state, owned live provider session, enrollment, actual case, active-advisor denial and all plan-principal denial. Existing premeeting versus ongoing/started-service care-read eligibility remains; no payment or care-write authority is fabricated. Guards precede and follow the canonical client advisory wait and precede return. The explicit actual-case share lock follows the advisory wait, preserving writer order. Under that lock, missing stored head yields the canonical writer's initial zero only for the verified existing enrolled case; no head is inserted and no Review revision is substituted.

The candidate contains 63 migration source files. All 62 old migrations and all 113 old SQL files are exact. New migration SHA remains `b1f1a2ac93bfca7206f968d02e32e0451034364961caed87c8c7f4663f402632`; authored pgTAP SHA remains `6c5935c8cc7b5ab87877ddc0925a4fe291ae7bb91b131c3b83f7523754070d00`. Both remain **UNRUN**. Source guards, lock statements and synthetic RPC failures do not establish effective ACL/RLS/catalog, real session/care-window behavior or concurrent revocation/race proof.

## independent command receipts and compiler qualifications

All source executions use explicit `/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node`, version `v22.23.0`, with external fetch denied. `commands-ledger.jsonl` records exact argv, actual exit, unique raw filename and SHA-256. The own wrapper prints the actual child exit before exclusively writing each raw record; failed attempts remain separate.

| Execution from this checkout | Actual result |
| --- | --- |
| unchanged R1 probe, `R3_HISTORICAL_RPC_RUNTIME=d226`, Node `--import` denial preloader / `--experimental-strip-types --test --test-name-pattern='W7 RPC streaming bound'` | OLD 0/1, exit 1, expected PH1 reproduction |
| same unchanged probe without old-runtime projection | CURRENT 1/1, exit 0 |
| own module-bound copies of `rebuild-photo-head-{source,closed,strict,rpc-bound}.test.mjs` | corrected run **32/32**, exit 0, no skips/cancellations; original 21 plus new 11 |
| own rebound prior `independent-adjacent.test.mjs`, only `W7 independent` selection | **6/6**, exit 0 |
| new own `independent-ingress.test.mjs` | **6/6**, exit 0 |
| unchanged own eight retained `concierge-checkins*` / `concierge-checkin-replies` test files | **39/39**, exit 0 |
| unchanged own `rebuild-cookie-cancellation.test.mjs` and `rebuild-review-guidance-request.test.mjs` | **140/140**, exit 0; retained finite transport only, no blocked private-return/M65 verification |
| unchanged own `concierge-runtime.test.ts` and `concierge-payments-runtime.test.ts` | **8/8**, exit 0 |
| actual portal TS6 compiler `-p apps/portal/tsconfig.frontend.json` | exit 0, checked-in flags unchanged |
| actual portal TS6 compiler `-p apps/portal/session-integration/runtime/tsconfig.json` | exit 0, checked-in flags unchanged |
| exact patch, full protection/dependency parity and diff checks | exit 0; preserved receipts and final report-only staged diff |

The first own combined run was **31/32, exit 1**: the relocation tool had changed two imports inside the virtual TypeScript ABI input to `file://` URLs. TypeScript correctly reported missing modules and unused expectation comments. This was an own harness error, not a candidate defect. The failed raw and attempted copy are preserved. Correcting only the ignored module binding restores the embedded virtual TS source byte-for-byte to the original, then the same predicates pass 32/32. No production, tracked test, compiler flag, declaration or assertion was changed. Existing Node module-type warnings remain.

Full strong experiments use actual TS6.0.3 with `strict:true`, `noUncheckedIndexedAccess:true`, `verbatimModuleSyntax:true`, `skipLibCheck:false` and actual declarations. Own Root/App closure is **112 files: baseline 6/current 0/introduced 0**. Own Worker closure is **141 files: baseline 50/current 44/introduced 0**. **The whole strong Worker graph is not zero-error.** All raw diagnostics are retained.

Author closures are 108/137. Independent reconciliation confirms only four additional real root dependency declarations: `node_modules/@types/react/{global,index,jsx-runtime}.d.ts` and `node_modules/csstype/index.d.ts`. Every common source/declaration hash matches; no author file is missing; effective options, entries and raw diagnostics match after checkout-prefix normalization. These files became reachable because both authorized dependency trees were cloned. There is no declaration shim or reduced flag.

The actual before/current Root program contains 24 non-declaration TypeScript files, with zero diagnostics in both PH1 inputs. Exactly `concierge-operations/runtime.ts` changes emitted JavaScript. Its output SHA changes from `1a1c09e2faa20394268d98e15fca19f3481009a83c6d386b4e1c8a7d45198f80` to `094136562d4ff24730032e908a703ec6d2db6a1f48db595973ac5a0026ff050a`. This deliberately changed runtime is distinct from the separately checked six-annotation erasure proof. The latter retains all 67 actual closed-graph inputs and byte-identical whole-bundle JavaScript across those annotations.

Key immutable raw hashes:

| Raw receipt | SHA-256 |
| --- | --- |
| `original-ph1-old-aef5562d-d750-4395-8c86-713663ae1d58.json` | `5557841cf1bdd78e201771cba7f4185762a48677d6d271b98e3bde7629a9a650` |
| `original-ph1-current-ef3920fb-07d1-4b91-94b2-9c2ab26a7c54.json` | `f5a6196266f8af47a2e28c77cdcefa4614cd32f0f06bdab98773b3cb00c4694d` |
| failed own `current-head32-fd0deb71-2789-4f69-93cb-5c6af22fd61a.json` | `3e57cd33714ae1d20714574b2df2df1f9d443fc1596dfd43d029ed631e0fec84` |
| corrected `current-head32-corrected-2fe4779c-19ee-49cd-a226-88687119bc82.json` | `6b6157c24789cf71d1d37c68329389eed429a3be1037087870884ea14a5cf25b` |
| `independent-ingress6-747d9a19-81cf-4313-87c6-0be2f3b81362.json` | `949a1ff5e6742684ae438e03cc31a448ea1a24a139aff4b1729dc1ad45700d09` |
| `final-preservation-2d062840-90c7-4f74-8acd-99845ccc3e46.json` | `069d4c62070d28a2dcb72afe2d07979d63da3e3d1625ee6c774714ae2b6ca614` |

## runtime identity and final preservation

Initial and final LIVE catalog/model descriptors plus actual self and Parent configurations verify provider `codex`, model `gpt-6.1-sol`, `reasoningEffort=xhigh`, `serviceTier=default`, default interaction mode. Own and Parent project config and all eight role files retain their exact initial hashes, 18 files total. No setting changed, fallback occurred or child agent was spawned.

Parent separately forwarded this round's authoritative actual taskId after the initial gate:

```text
taskId: node:delegated-task:command%3Amcp%3Add730894-0fab-4a94-873d-743422eae122%3Adelegate-task%3Aportal-rebuild-w7-photo-head-source-review-20261101-r3
backing thread: thread:delegated-task:command%3Amcp%3Add730894-0fab-4a94-873d-743422eae122%3Adelegate-task%3Aportal-rebuild-w7-photo-head-source-review-20261101-r3
run: run:thread:thread%3Adelegated-task%3Acommand%253Amcp%253Add730894-0fab-4a94-873d-743422eae122%253Adelegate-task%253Aportal-rebuild-w7-photo-head-source-review-20261101-r3:ordinal:1
ordinal: 1
Parent thread: d632030a-18f7-4dec-a2c9-f5c0418c3fd5
```

Task, backing thread, run and ordinal are distinct; none was inferred from another or reused from R1/R2. Initial/final live records and the separate forwarded identity are saved in ignored evidence.

Both own dependency destinations were absent and ignored before acquisition. All four actual root/portal lock hashes matched the allocated `5c57c9aec9e4585066e032e234d610a77cbffd9a51f82700c158fc37fe01b5c2` and `bc914f3a9c9f24e44f02e3cff2804651147385ea5abda58a064531329ef23203`. Nonsymlink ancestors, same device, literal local-link containment and absent ignored destinations were checked before `/bin/cp -cR`. The known `../session-integration/runtime` link stays in each own checkout. Full before/after and final byte/mode/literal-link parity passes for **52,284 entries**, including unchanged Parent dependencies. No install, foreign generated runtime output, shim or flags waiver was used.

Final protection retains all 2,004 original paths/modes; exactly the ten allocated existing originals differ, and the other 1,994 remain exact. All 17 targets still match 2fe1. All old tests, old 62 migrations/113 SQL files, approved originals, packages/locks and pins are preserved. There are no conflict markers. Physical Parent HEAD remains ab19; its three already-present documentation edits in `docs/handoffs/2026-11-01-portal-rebuild.md`, `docs/portal-rebuild/CURRENT_STATUS.md` and `docs/portal-rebuild/TASKS.json` remain unchanged from this review's initial physical inventory. No Parent file was written by this reviewer.

The only reviewer-authored tracked deliverable is this new report. Its local R1 link resolves and the report-only staged diff passes `git diff --check`. Evidence remains ignored. This delivery excludes the attributed review-input setup commit.

## held gates

This scoped result permits no activation or resource acquisition. Parent source admission/composition is a separate deliberate step. W4 port adoption, actual C05/C07 App integration and uploads, canonical migration rehearsal/pgTAP, actual SQL/RLS/ACL/catalog/session/care-window/lock/revocation races, genuine Auth/Storage/persistence, native/browser/camera/DOM, visual/accessibility/human comprehension, full application suites/Expo/package, exact-head CI, hosted and release acceptance remain unrun or outside this allocation. The complete D01-D48 goal stays open.

No browser/preview/DOM/process inventory, listener/service, native/DB/Auth/Storage/provider request, SQL execution, Supabase/other resource CLI, credentials, Docker/SQLite, nested delegation, blocked Guidance/M65 retry/rephrase/reroute, R2 failed-worktree write, Parent write, push, PR, merge, deployment, real-client communication/publication, funds/order/fulfillment or permission change occurred. Hardware keys and Daybreak were neither requested nor treated as prerequisites.
