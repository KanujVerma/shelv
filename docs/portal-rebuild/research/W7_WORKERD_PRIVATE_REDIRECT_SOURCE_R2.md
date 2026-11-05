# W7 workerd private redirect: independent R2

**SPEC/readiness: PASS. Correctness/quality: PASS**, scoped to the complete seven postimages at `772c4fae7904e39a9e793627023adf56de811d8e` against frozen Root `004c7a3a145f472f79c2bb6860ebf917798527b8`. WDPR1/P2 is addressed. No new material finding. Parent accepted this gate for M01; admission still requires its exact old-Root preimage check. This is source/finite HTTP evidence, not genuine Account acceptance.

## Identity and scope

- Reviewer checkout: `/Users/kanuj/.t3/worktrees/shelv/t3-8b09324b`, branch `t3/workerd-redirect-review`, initially clean at the candidate SHA. Only this NEW report and ignored controls were written; no commit/push/PR/runtime change.
- Separate literal taskId supplied by Parent: `node:delegated-task:command%3Amcp%3Aa56eb6fa-1435-4927-8890-15373d05f366%3Adelegate-task%3Aacceptance-20261103-workerd-private-redirect-review-r2`.
- Actual self and Parent `t3_thread_configure` READs, with `modelSelection` omitted, both returned `codex / gpt-6.1-sol / xhigh / default`. Parent: <t3-thread://v2/3b335212-744e-4ce9-befe-80a8e38dd448/9b085ada-435f-48d6-8886-957c1ce3e82d>.
- Explicit executable `/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node` returned `v22.23.0`. Execution used its built-in `--experimental-transform-types --test`; no external compiler, bundler, SDK, dependency installation, network, browser, Auth/DB resources or nested agents.
- Parent Root and Coordinator were read-only inputs. Root's seven live files matched frozen Root blobs; Coordinator's seven files and this checkout matched candidate blobs. Each Root preimage also equals `93513303`. Prepared candidate ancestry is **not** Root-equivalent and is not admitted wholesale.
- Reviewer source closures contain 55 modules each: actual Root dependencies, with only the three reviewed production files overlaid from OLDc39 or CURRENT772, plus the three unchanged-in-generation candidate primary test files. Extensionless imports received only mechanical `.ts` resolution in ignored copies. No successful authority/currentness, OperationPort or Vault replacements were introduced.

## Complete seven-file review

| Postimage | Root SHA-256 | Candidate SHA-256 |
| --- | --- | --- |
| `apps/portal/session-integration/runtime/server/own-admin-provider.ts` | `973a330066c9f03d57da46dadd558171ec31c8b70ff0f4c7188fc21bb09cca0d` | `4dd33c72d5c5a1974046b9f9e813eada5fee38944ee5b6d30d5c31666d4f9b56` |
| `apps/portal/tests/rebuild-own-admin-gateway.test.mjs` | `a6986c01c0258a145ecb308302bf768fa2d7da3c7360969f3c65bf3bdfda6f14` | `fe495d73550e4e09b9b01e97112356b95fd86ae74e7452fc506f87dae7b48098` |
| `supabase/functions/concierge-account-profile/runtime.ts` | `c7d0e306f282bf69407a2040ac17f5f411f7223c0d8b5ead3351441c1c9d6755` | `fc0d6758842be93e1333fe89de85a24f75b81b2b53922a3abf366ef68d9a288c` |
| `supabase/functions/concierge-client-orders/runtime.ts` | `cc79266646123cb09b4be73bf6e6594c69404bc3a256c9aefa9a3c53ac1c3df4` | `469af71a9ac045d825396896e8037da8ec80fc209e410a0815c0bd9541eaa08e` |
| `tests/portal-account-contact-provider.test.ts` | `84bd147c4568146ac5d408d9c29dce569bf550c453b624e76543b0251b116a91` | `e5f317416b09c519eaa1d1dbc78d5a4525de0d66fded12a76baddc74b93e5eb9` |
| `tests/portal-account-profile-runtime.test.ts` | `dcbc076ae05bb8e7fd8674855b6c960ad06f77fd46d787be2c804cb275c5e8aa` | `6dc5e81c73b02729deb886872341596b1f952d1cd573ce7e22f1a97de4747d89` |
| `tests/portal-client-orders-runtime.test.ts` | `e24b68b7eee75e6c397409124177187034b6e1324e5c7be7c68cc4759698c844` | `2d26e72b0e8ed2e8888b04aa1ec2bf2599514990b9b2e71805d097e7a37f6389` |

All seven were reviewed against Root004c, beyond the last two-file fix:

- Own context transport now requests `redirect:'manual'`, retaining the fixed origin/path, token/public-key headers, `credentials:'omit'`, no-store and original signal. Its existing non-200 guard retires redirects and returns safe503 without headers, Location or body decoding.
- Profile and Orders transports use the same manual mode and explicitly retire every received300–399 before decoding, returning503/unavailable. Received401/403 is recorded **first**, before cleanup accessors can abort, reenter or throw. Auth/RPC selectors, wire bounds, handlers and public contracts are unchanged.
- Own `response()` assigns the received response, checks the **same registered** `accountProfileWait` lifetime at arrival, and shares a local once-only retirement guard across inner/outer catches. This closes the late-arrival hole after the original outer wait has already rejected. No deadline renewal, new public API or context stub was added.
- Three primary test files change the finite redirect-option expectation; Profile/Orders also add five redirect statuses at both Auth/RPC stages. Gateway tests preserve both real context paths, distinguish own `credentials:'omit'` from the retained superclass path's undefined option, and count only own contexts in the existing whole-budget test. Both actual-context count2 and503 assertions remain. New redirect/late-arrival assertions do not relax earlier predicates.

## Reviewer evidence and retained failures

Evidence: `.local-artifacts/portal-rebuild/w7-workerd-private-redirect-r2/`; exact inputs/hashes are in `MANIFEST.json`, commands/counts in `RESULTS.json`, configuration in `IDENTITY.json`.

| Run | Pass / fail | Meaning |
| --- | --- | --- |
| `ROOT-PRIMARY.raw` | 9 / 78 | Root production with current-generation87 assertions; retained RED includes manual-option mismatch, not78 distinct defects |
| `CURRENT-PRIMARY.raw` | 87 / 0 | Exact candidate primary tests through actual Root dependency composition |
| `OLD-INDEPENDENT.raw` | 88 / 8 | Initial controls: three WDPR1 failures plus five invalid native304-with-body fixture errors |
| `CURRENT-INDEPENDENT.raw` | 91 / 5 | Same initial controls; only the five304 setup errors remain |
| `ROOT-INDEPENDENT.raw` | 19 / 77 | Initial baseline sensitivity run, including option mismatch and invalid304 setup; not a count of product defects |
| `OLD-NATIVE-VALID.raw` | 93 / 3 | Correct native bodyless304 input; OLDc39 independently fails late200/302/503 retirement |
| `CURRENT-NATIVE-VALID.raw` | 96 / 0 | Same valid controls against CURRENT772; no skips/cancellations |

The initial control file and every raw failure remain unchanged. The separate valid-native control uses native bodyless304 responses; the other redirect and WDPR1 assertions remain. An initial graph-preparation attempt rejected gateway's transitive `@supabase/auth-js` import **before execution**; `SETUP.json` records why that entry remained source-only. No SDK stub replaced it.

Own finite controls cover all five request surfaces (context, Profile Auth/RPC, Orders Auth/RPC), preabort/unregistered/expired refusal without dispatch,300/301/302/303/304/307/308/399 no-follow denial, pending/throwing cancellation, throwing body getters, status-getter abort reentry, and denial recording before cleanup. Actual Profile/Orders handlers preserve401/403 after cleanup abort/throw. Own absolute-deadline equality refuses before its timer fires, keeps the original signal, and refuses deadline re-registration.

WDPR1 reproduction resolves the original outer wait through abort before releasing a real native Response. OLDc39 then records cancellation0 instead of1 for200/302/503; CURRENT records exactly1, no decoder reads and one fixed request. Denial received after a caller has already observed503 is not claimed to retroactively change that returned outcome. The unchanged Root producer reads recorded denial before its final lifetime/error resolution.

## Attributed evidence and remaining gates

Parent's `transport-manual-fix/RESULTS.json`, OLD preimages, RED/GREEN and WDPR1 logs were read as data. Parent's gateway24/24 is **Parent-attributed**, not reviewer SDK execution; the original gateway runner requires esbuild and an Auth SDK and was not run here. Parent's WDPR1 reproduction remains23/1 before772 and24/0 after; its primary87/0 agrees with the independent current primary run.

Parent's actual-workerd proof remains separately attributed: the original `redirect:'error'` API exception precedes egress; final `WORKERD3-RESULTS.json` shows five fixed requests receiving synthetic302, all503/unavailable, no Location dispatch. `WORKERD3-CLOSED.json` records joined workers. Earlier wrong-guessed-origin and Node bridge Request-redirect-clone assertion failures remain separate diagnostics. Those artifacts were not executed by this reviewer and prove no successful Auth/RPC/authority or live-fixture acceptance.

This gate directly unblocks Parent's reviewed **seven-postimage** admission for the same Account persistence milestone. It does not admit other candidate ancestry. The subsequent versioned SAME LIVE code rollforward must preserve actual SQLite/keyring/DB under Parent's existing grant. Root integration, live rollforward, genuine browser/API/Auth/SQL persistence, full suites/types/build/CI and product/release acceptance were not performed or certified here. No frontend, SQL or runtime phase was entered. Final validation checks only this report's write scope and whitespace.
