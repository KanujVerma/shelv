# Coordinator: complete migration-ledger capture in CI

PR211 head 153d11e95b5f2d35f2df4c4a858cdad35b5d9e9f passed the previously failing package/RPC-loader step, then failed run 41255892150/job 124698852990 at “Verify founder admission with local Auth, SQL and Chrome.” Its public log names `lineage-regression.log`; that private child log was not uploaded, so its exact remote exception is unavailable.

The [actual lineage probe](../../../apps/portal/tests/admission-lineage-native.mjs) used `execFileSync` without an explicit output limit. Node 22.23.0 defaults to 1,048,576 bytes. Serializing the current 62 source migrations as the requested complete JSON ledger produces 1,127,411 UTF8 bytes, before PostgreSQL's additional JSON whitespace. The surrounding lifecycle runner already allows 16 MiB; the separate child probe did not inherit that option.

A new [subprocess regression](../../../apps/portal/tests/admission-lineage-output.test.mjs) executes the unchanged probe against its own prepared source fixture and a synthetic CLI that admits only the exact two retained read queries. It uses complete source-derived statements plus explicit synthetic padding. No Docker socket, Auth, database or native fixture is used by this regression. The original probe fails with `spawnSync docker ENOBUFS`; changed-ledger verification is also prevented by that limit. This reproduces a concrete failure at the CI step, without claiming access to its unavailable private log.

The coordinator's already-retained `canonical-plan-v1-r9/bootstrap-buffer-control.json` independently records an earlier 62-ledger read failing with ENOBUFS after 1,081,344 captured bytes, before Auth mutation. Only that saved receipt was read for corroboration; no current fixture or database query was performed.

The correction sets the probe's capture limit to the lifecycle runner's existing 16 MiB. It does not truncate statements, omit migrations, change SQL, bypass attestation, alter lineage predicates or raise any public request/response budget.

Explicit Node 22.23.0 verification:

- Original probe: the complete-output assertion and changed-tail assertion fail with ENOBUFS; the finite upper-bound control passes. TAP reports 1 pass/3 fail including the failed parent test.
- Corrected probe plus unchanged lineage, fixture and selected-path suites: 18/18 pass, 0 fail/skip. Complete output is verified, a changed statement at the ledger's end is rejected, and output exceeding 16 MiB still fails closed.
- Frontend and session strict configurations: exit 0.
- Root `npm test`: exit 0, 1,256 reported TAP passes and 18 existing opt-in skips.

The coordinator's newer, unpushed V3 integration was also checked with the ordinary portal package command: 1,726 pass/15 fail/0 skips. Eleven failures use a context-specific browser harness without the external entry selector required by its original serial command; one source helper resolves its tsconfig relative to the caller's working directory. The remaining three failures are timeout assertions whose cause is not yet established. The V3 owner has a separate source-only correction for explicit entry selection and working-directory-independent compilation. Timeout causes remain unproved. No assertion or timeout was changed here. The isolated CI correction is pushed above153d11e without those newer V3 imports; they remain preserved locally and gated on package verification.

Raw CI, RED and GREEN logs are retained in `.local-artifacts/portal-rebuild/ci-153d/`. Local verification does not replace a new exact-head native CI run. No shared R9 resource call, live query or mutation was performed for this investigation. Existing V3 source integration remains a separate scoped checkpoint; default App activation and full-goal/release acceptance remain open.
