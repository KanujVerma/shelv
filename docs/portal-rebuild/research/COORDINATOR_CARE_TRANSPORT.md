# coordinator care transport composition

Owner: Kanuj. 31 October2026. **Finite channel/typed port implementation; care SQL and connected-use acceptance remain pending.** No current application switch to v2, deployment, new provider authority or live action.

## source and contract

Composes W1 early408ccab/4565e46/5c612b2/d338ab1 as7c9e2ef/b2cb2e7/98673f8/ebd0b3a. CARE_API_V1 governs13 closed care actions, client/advisor audiences, read versus uncertain-write handling, compact current state and400000/1800000-byte page/response budgets. Existing24 plan actions are preserved; two dependency commands extend the fixed plan surface to26 without extending14 TaskActions. New canonical SQL is only W1's allocated20261031043655 and is not integrated/applied here.

Adds fixed cookie route/channel `care` to the existing client/advisor gateway, factories and captured transport. Reuses `readCareCommand`/`mapCareResult`, safe errors, actor-derived client ownership, pre-egress human capability checks, CSRF/no-store/credential/private-field and post-await lease fences. Care JSON alone permits500000 bytes; old unrelated channels retain100000. All requests still route only to `concierge-care`, with the RPC fixed by the canonical Edge implementation. No upload, caller URL/RPC, task enrollment or source grant is added.

Browser-only protocol metadata in care-actions.js is checked against the root action arrays/size constant. Declaration files describe the actual exports without relaxing compiler flags. Plan dependency metadata is advisor-only and requires edit before egress, matching its private working-draft scope.

New application exports in `src/app/care-ports.ts`:

- `ClientCareCommand` and `AdvisorCareCommand` derive from canonical action tuples.
- `createClientCarePort(runtime)` and `createAdvisorCarePort(runtime)` return `OperationPort<... ,CareResult>`, use the actual retained cookie factory and strict decoder, and capture the creation boundary.
- Invalid action/authority rejects before egress. Read errors remain rejected; unknown/malformed write acknowledgements remain uncertain. Status is a read. Owner/CSRF/logout/session replacement prevents old ports from returning or initiating new commands.

These exports are not yet passed into the current application. A feature worker can consume the pinned port/DTO contract; activation follows actual care persistence and independent review. Public/demo/unpublished modes receive no live care port.

## red and green evidence

All commands explicitly use Node22.23.0. Ignored logs are under `.local-artifacts/portal-rebuild/`.

| Check | Result and scope |
| --- | --- |
| New care channel before implementation, bundled with existing esbuild runner pattern |7 expected failures: missing parse/channel/factory/route/capability behavior; `care-channel-red.log` |
| Fixed channel plus metadata equality and retained plan channel |19/19 pass:8 new+11 retained; `care-plan-channel-green.log` |
| New application ports before implementation | Module absent, expected import failure; `care-ports-red.log` |
| Actual application/cookie/transport care ports |7/7 pass: strict v2/receipt, audience/injection, safe advisor history, uncertainty, owner/CSRF replacement and held logout; `care-ports-green.log` |
| New root care contracts/handler plus application ports |21/21 pass; `care-seam-ports-green.log` |
| Full retained session suite after channel addition |171/171,0 skip/fail; `care-full-session.log` |
| Full automatic portal suite after gateway/metadata addition, before the unused new care-port module |907/907,0 skip/fail,317.94s; `care-current-portal.log` |
| Root full suite at b2cb2e7 early seam |1206 pass/18 existing opt-in skips/0 failures across162 TAP groups; `root-care-seam-test.log` |
| Root application/test types and portal frontend/session strict types | All exit0 at the applicable seam/composition checkpoint; no flags relaxed |
| Combined package build | Exit0,138 assets; `care-combined-build.log`. No deployment. Final clean-head application candidate is checked after commit. |

The first direct Node test attempt did not use the retained extensionless-import bundling runner and failed module resolution; it is not defect sensitivity. The corrected esbuild run produced the seven actual intended failures. One test then used a client-only command for the advisor oversized-payload assertion and correctly received403; it now uses the allowed audience command before testing413. Missing JS declaration diagnostics were corrected with an actual care-actions.d.ts; no type exemption. No production behavior was changed for either test setup issue.

The native local-test exact policy hash advances from c31adceba6e4457183af460d5ebfa3ead1549a772ba7004757885c20607175fc to e091552ab66fb26a907c14d6942553a90b9cbbd415cba0177d817b40658976d7 because the closed care policy/metadata is added. The guard still demands the exact entire source hash and changes exactly two origin literals in memory;6/6 pure guards pass. Production origin/issuer predicates are unchanged. Prior genuine/native reports retain their original hashes/scope; they are not rewritten as current care acceptance.

## remaining gates and resources

Full portal/session tests are local finite/intercepted regression evidence, not new actual care Auth/SQL/Storage/browser evidence. Existing protected R4 remains the historical55-migration snapshot with no writes/reset/helper adoption here. A fresh canonical snapshot/handler copy is required after the new care migration is integrated. Cross-publication use carry, immutable event/cursor/after-wait enforcement, actual source grants/storage, guidance/notifications and complete product flows remain assigned/pending.

Parent's serial regression Chrome is released after both suites: process inventory has no automation Chrome, preview no tab, all test handles terminal. No R4 credentials, provider sessions, DB/container lifecycle or external communication was used. Independent review of the care backend/transport/consumer composition remains required; first-slice AR1 review PASS applies to its exact recorded earlier source. Exact-head CI at12d5b88 is green for Root, Database and Portal, not for these newer care changes.
