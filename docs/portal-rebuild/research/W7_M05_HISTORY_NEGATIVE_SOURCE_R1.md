# M05 negative schedules: first independent source review of author R2

**Scoped SPEC/completeness: HOLD, incomplete after first material finding. Quality: FAIL. ACTUAL: UNACCEPTED.**

Owner: Kanuj. Date: 3 November 2026. Source-only review. This is review R1 of author R2, not an admission or independent review of held author R1. Parent remains the sole Root/shared/Auth/runtime/migration/resource/integration writer. No successor is reviewed by this report.

## HN1: selected native JSON rejection bypasses the consumer gate

Frozen candidate `source/page-observer.mjs`, lines 48-52:

```js
return track(Promise.resolve(read).then(async value=>{
  report({type:'native-json-fulfilled',localFlightLabel,localJsonLabel,requestSha256,status:response.status});
  if(target&&ownReceiver&&arg.mode==='consumer'&&!retired){hold=true;report({type:'consumer-held',localFlightLabel,localJsonLabel,requestSha256,status:response.status});await gate;}
  report({type:ownReceiver?'json-value-returned':'foreign-json-value-returned',localFlightLabel,localJsonLabel,requestSha256,status:response.status});return value;
},error=>{report({type:'native-json-rejected',localFlightLabel,localJsonLabel,requestSha256,name:error.name});throw error;}));
```

The fulfilled branch holds the selected actual native value. The rejection branch immediately records and rethrows the actual native error. It never checks the selected target/receiver/consumer conditions or awaits the gate. Therefore a rejection from the selected actual `Response.json()` escapes before UI retirement/release. The explicit contract requires holding the actual native value **or error**, then returning the identical value or rethrowing the identical error.

This also prevents the intended rejection schedule from reaching retirement: `source/negative-schedules.mjs:192` waits for `holding === true`, and line 216 requires the exact selected `consumer-held` occurrence. Neither is produced by the rejection branch. This is a material schedule/completeness defect, not a demonstrated false acceptance or product data disclosure. The helper can time out/refuse honestly and still fail this required schedule contract.

**Owner/correction:** Parent alone fixes the candidate. Apply the same selected consumer gate to native JSON rejection, preserve the identical rejection object after release, and ensure metadata observer errors cannot replace the native result/error. Preserve all original OLD/setup/current results. A NEW task must review a newly frozen successor. No candidate or Root correction was made here.

Evidence is direct source control flow; no successful Page/HTTP/Response/Auth/DB facade or native-response execution was used. At the first confirmed material issue, the complete scoped HOLD/FAIL/unaccepted gate, exact source evidence, owner and correction were sent to Parent before report prose. Dependent probes stopped.

## Identity and freeze verification

- Review workspace: `/Users/kanuj/.t3/worktrees/shelv/t3-e5646e71`; initial `git status --short --branch` was clean on `t3/review-history-negative-source`.
- Self and Parent `t3_thread_configure` READs omitted `modelSelection`. Both returned instance `codex`, model `gpt-6.1-sol`, `reasoningEffort=xhigh`, `serviceTier=default`; no setting was changed.
- Explicit executable argv: `["/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node", "--version"]`, cwd the review workspace, exit 0, stdout `v22.23.0`. No SDK/compiler/browser invocation occurred.
- The literal task ID below was read from public `C/M05-NEGATIVE-SOURCE-REVIEW-DISPATCH.json` after configuration verification. It was not inferred from a thread/run identifier.

```text
node:delegated-task:command%3Amcp%3Aa56eb6fa-1435-4927-8890-15373d05f366%3Adelegate-task%3Amilestone-20261103-m05-negative-schedules-source-r1
```

Here `C` is `/Users/kanuj/.t3/worktrees/shelv/kanuj-portal-rebuild-co-4bb412d8e34c7ca1/.local-artifacts/portal-rebuild/acceptance-first`. Candidate is `/Users/kanuj/.t3/worktrees/shelv/t3-8b0c20b0/.local-artifacts/m05-history-negative-schedules`.

| Frozen input | SHA-256 independently matched |
| --- | --- |
| `receipts/FREEZE-R2.json` | `7a59d6c1c1b8ffef27bb132a5f541b8f20f2c1d7930536f5df7b38333b217f47` |
| `source/negative-schedules.mjs` | `55e88ec5182cbf85a4dfa9b595ac3bbc113c475b3eebb40285113894f64a338f` |
| `source/page-observer.mjs` | `a277b4130903077bd489ff3abf6ff539701e4b37af1ea42938d300b5e83d141c` |
| `source/native-lifetime.mjs` | `a735d6c56c92925a3f4814600a99ac895a9ae0e9f9b49e7d9e59aac1d5089a15` |
| `source/negative-observation.sql` | `c9d0711fde01418563231ca6a910cd7476a413165b1918ee069b4b60b3002339` |
| Public `ROOT_359C_SOURCE_TARGET.json` | `be2e06bcbd45665e2f2e191dafb5d6d284f0a2591987ad236a6efce02e21eb1e` |

All eight R2 freeze entries matched both bytes and SHA-256. All ten `source/PINS.json` entries matched the full actual Root files, including the original four M05 assets, Source R2 review and public UI/route/cookie/gateway inputs. No ancestor copy was imported.

Actual Root `/Users/kanuj/.t3/worktrees/shelv/kanuj-portal-rebuild-integration-20261030` HEAD was `359c6bf0c759357df648ca441e9e3d1c3d29398c`; status contained only `?? docs/handoffs/2026-11-02-portal-rebuild.md`. Prepared ancestry is not actual Root. The full 2,376-file inventory, logical-stage digest and 68-file ledger were not independently recomputed in this stopped review.

## Completeness and evidence limits

| Required review area | Evidence completed here / remaining limit |
| --- | --- |
| Four public exports and input/checkpoint contracts | Complete active source, PINS and handoff read; remaining adversarial/completeness verification stopped. No source PASS. |
| Native consumer result/error gate | HN1 source-proven failure above. |
| Exact request/flight/json attribution and R1 regression | Attribution source read; precise R1 reproduction and current independent attribution controls UNRUN after stop. |
| Native ownership, acquisition joins, inverses, raw-success file handles | Active lifetime and schedule source read; independent controls and complete quality review UNRUN. |
| SQL/wire/Root UI/session/private-row relationships | SQL and schedule source read; ten actual Root blob pins matched. Full relationship/schema review incomplete. No SQL parser, engine or resource execution. |
| Units, schema, receipts and approved desktop context | Freeze hashes checked, complete PINS/handoff read. Unit/receipt content review incomplete. Combined approved-document output was truncated and is not counted as a complete read. |
| Resource/genuine/whole-screen/whole-journey acceptance | No invocation or admission. Actual IDs/Auth links/read-only SQL remain Parent dependencies. |

The candidate's handoff reports attribution RED 33/34, then 33/35, and R2 CURRENT 36/36 with zero skips. Those are author-reported results, not independently reproduced results in this review. Original `FREEZE-R1`, `R1-*`, setup, OLD, RED and CURRENT receipts were not modified or relabeled. No new offline test result exists: all requested independent controls are explicitly UNRUN because the first-material-issue rule stopped dependent work. No application test, compiler, SQL/Auth, SDK, browser, network/socket/engine, stopped-fixture query/reuse/reset or Root runtime was invoked.

Scope remains D01-D48 / 26 screens / 10 journeys, with no additional acceptance measured here. The supplied M01 Account Name status remains one bounded ACTUAL acceptance, zero full screens and zero journeys; this review did not reverify it. M05/C04/genuine/whole-journey acceptance and Guidance/private-return/M65/provider-photo/A07 holds remain unaccepted or held. No resource grant follows from source hashes, shapes or this report.

Only this new uncommitted report was written. No nested agents, Root/foreign writes, commit, PR, push, merge or deploy occurred.
