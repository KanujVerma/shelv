# WorkerD private redirect R1: complete seven-path source review

**Gate: CHANGES REQUIRED. Specification/completeness: CHANGES REQUIRED. Correctness/quality: CHANGES REQUIRED, WDPR1/P2.** Gate and reproduction were delivered before this report. Parent accepted the finding; no successor was read or tested.

Reviewed frozen actual Root `004c7a3a145f472f79c2bb6860ebf917798527b8` plus exactly seven postimages from `c39e3a3667ab9c056cdfd7ae58925d3ab57aae6f`, whose delta over `93513303` is seven paths. Prepared ancestry was not treated as Root. The independently Git-materialized closure contains 58 files: seven candidate inputs and 51 frozen-Root inputs.

The complete review covers `own-admin-provider.ts`, both profile/orders `runtime.ts` files, `rebuild-own-admin-gateway.test.mjs`, and all three profile/orders/contact-provider test programs. The production delta uses manual redirects, rejects 3xx before decoding, and retains denial-first handling. The four test diffs update transport expectations and add 25 bounded redirect cases. The gateway budget still identifies two own-context calls using `credentials: omit`; the ordinary context remains distinct.

## WDPR1/P2: late own-context response escapes retirement

At [own-admin-provider.ts](../../../apps/portal/session-integration/runtime/server/own-admin-provider.ts), lines 34–37, `accountProfileWait` can reject after abort while `held` is still undefined. A signal-ignoring fetch that subsequently resolves only assigns `held` inside its continuation. The catch already finished, so nobody cancels that response body.

Independent reproduction: start actual `createOwnAdminProvider().readContext`, abort its registered original signal, observe safe `503/unavailable`, then release an actual native 302 Response with a cancellable stream. After two event-loop turns, cancellation count is **0, expected 1**; HTTP count is one and decoder count is zero. No successful context, authority, OperationPort or Vault stub is involved. The same failure exists in frozen Root, so this is a retained lifecycle defect, not an assertion that c39 introduced it or that a browser leak occurred.

Parent must retire responses arriving after the original operation has ended, preserving received 401/403 priority and bounded cleanup. Add delayed-arrival abort and absolute-deadline controls, then obtain a new independent review. No reviewer fix was made.

## Evidence

| Independently executed input | Pass | Fail | True exit |
| --- | ---: | ---: | ---: |
| Frozen Root, original three programs | 67 | 0 | 0 |
| Root production, unchanged candidate programs | 9 | 78 | 1 |
| Root plus candidate, unchanged three programs | 87 | 0 | 0 |
| Independent controls, current | 3 | 1 | 1 |
| Independent controls, Root | 3 | 1 | 1 |

Independent passing controls cover zero-dispatch preabort, manual 3xx refusal without headers/decoding plus reentrant never-finishing cancellation, and recorded denial priority across abort/throwing cleanup. The RED run includes changed option assertions; it is not itself a reproduction of workerd's API limitation.

All raw outputs, setup failures, exact argv/cwd/exits, blob hashes and identity reads are retained under reviewer `.local-artifacts/portal-rebuild/w7-workerd-private-redirect-r1/`: `manifest.json`, `RUNS.json`, `INDEPENDENT-RUNS.json`, `IDENTITY.json` and their referenced raw files. Setup-only failures required builtin transformation and relative-import resolution; original programs and production blobs remained unchanged.

Coordination's retained `transport-manual-fix/RESULTS.json`, `OLD.json`, RED excerpt and gateway summary, plus `workerd-api-probe-c9a9281e-c5e2-4413-9164-50d2fcbd11be/RESULTS.json`/`CLOSED.json`, were inspected as data. They retain the actual `redirect:error` TypeError and guarded manual dispatch. Gateway **22/22 remains Parent evidence**: its runner imports esbuild/SDK dependencies, outside this grant, and was not executed. No fallback or dependency was loaded.

## Identity and limits

Self and [Parent](<t3-thread://v2/3b335212-744e-4ce9-befe-80a8e38dd448/9b085ada-435f-48d6-8886-957c1ce3e82d>) configure READs, with `modelSelection` omitted, both returned `gpt-6.1-sol`, `xhigh`, service tier `default`. Explicit Node `/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node` returned `v22.23.0`.

Separately returned literal taskId: `node:delegated-task:command%3Amcp%3Aa56eb6fa-1435-4927-8890-15373d05f366%3Adelegate-task%3Aacceptance-20261103-workerd-private-redirect-review-r1`.

This is source plus finite builtin Node evidence only. Parent's ordinary OTP/PKCE success followed by first profile-read 503, zero own Auth/profile RPC, unchanged initial names and NULL revision remain attributed observations, not successful acceptedName evidence. No browser, Auth, DB, Vault resource, fixture query, network, SDK, dependency, external compiler, live upgrade, CI or release verification occurred here. Root, migrations and its dirty handoff were untouched. Root admission and actual acceptedName capability remain held.
