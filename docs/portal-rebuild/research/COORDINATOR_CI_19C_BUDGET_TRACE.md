# CI19c budget-case investigation

Owner: Kanuj. 1 November 2026 UTC. Status: concrete Linux evidence collected; readiness-precondition hypothesis under investigation, no fix or CI pass claimed.

PR211 head19c3ea1f106f0e123982d29fe2137f137312fdef failed Portal run41275595455/job124757021089 at the package step. Of2285 tests,2284 passed and one failed, with zero skips/cancellations. The failure is the unchanged first2550-scope test in rebuild-plan-guidance-budget-browser.test.mjs: the exact review notice did not become visible within5000ms. Other passing tests are not evidence that this case passed.

The actual executed PR merge58aae097fd1da905bc1f29ed92aee34153fa2b43 has the same Git tree as19c3ea1f:3b3ad3ea3f64e260c2254000b385c24b57f1b2ba, verified through GitHub's API. The newer local App candidatee6b0bd7e is separate from the failing published source.

Complete failed log:2074151 bytes/SHA2567fd53f2403a4c4729ea9768d6fb1da2b7b2a73614d0fae761615dfe36de35703. Safe artifact13071815235 contains exactly state.json, trace.json, source.json and page.png. ZIP290835 bytes/SHA256e05cf5e33320361d75f72075c05b4053db45b8f1addbdb12b5f38c308ea9ac49. Paths, symlinks, member names and2MB member bounds were checked before extraction. Source receipt records Linux/x64, Node22.23.0, Chrome156.0.8078.79,2200 hashed inputs/10 outputs/6 served resources. CaptureErrors are empty. These are finite synthetic diagnostics, not backend authority.

| Recorded relative time | Observation |
| --- | --- |
|2087.143807ms | First manifest request |
|4140.021067ms | All26 manifest responses finished |
|4337.147511ms | First instruction detail request |
|8045.507974ms | Notice timeout captured;43 of51 details had finished |
|8521.997029ms | All51 detail responses finished |

Terminal DOM has one loading state, one dialog, no review notice and51 paused markers, including the dialog duplicate. This is not evidence that a main plan fact was lost. Directions remain in their checking-current state. The approximate notice-wait start obtained by subtracting5000ms is an inference, not an observed click timestamp; this collector did not record that click.

The test waits for50 paused facts, a detail button and zero `[data-tone="loading"]`, then asserts no eager detail requests and opens the scope. Its five-second notice window may therefore include remaining background manifest work. Hypothesis: that zero-loading proxy can pass before the same-view/snapshot manifest is actually complete. An actual terminal-manifest readiness precondition could align the test with its complete-pagination requirement without increasing the notice timeout. Root cause and the precise accepted readiness boundary still require source tracing and a meaningful controlled old/new reproduction.

W3 owns the new test-only source-first follow-up. No production875 change, longer timeout, fixture-size reduction, assertion removal, retry-for-green, forced-ready/current/permission flag or new public production API is authorized. Exact37f dependency inputs must match the failed CI source before browser reproduction; the newer local App must not hide the failure. Any later Chrome phase requires a separate finite grant. Original125/723 outcomes and unproved earlier timeout causes remain preserved.

Raw files and metadata are under ignored `.local-artifacts/portal-rebuild/ci-19c3ea1f/`. A first task-send used a nonexistent backing-thread suffix and returned thread_not_found before creating work; the correct TASKS binding was used afterward. This orchestration setup fault is separate from the CI failure. No R9/native/Auth/DB/Storage/provider/financial resource was used, and the M65 provider block was not rerouted. Current App/genuine/CI/release/full-goal acceptance remains open.

## Exact observer graph and erased companion decision

W3 source checkpoint3b2c9d0d/report e220165b matches all2200 uninstrumented inputs and10 outputs from the failed published19c build. The test-build-only descendant reads the existing active Guidance provider's store, without changing production bytes. Its instrumented2202-input graph has explicit transformed-input provenance. Bridge6/6 and source-build audits4/4 pass; mounted behavior and CI correction remain unverified.

The actual frontend gate reports seven errors because published19c ports.ts expects dependency-command variants and two optional advisor ports missing from the old advisor type file. Parent pinned one complete child-only4893-byte erased type companion, SHA256356eec8a94115ca9d461aef42590c867cdf84061ed0c511f116e6eebd603df01. It adds only the existing Care command/result aliases, dependency command union and optional ports. It introduces no required advisor state or runtime implementation. This file must not replace Root's newer advisor types.

Parent's actual TypeScript6.0.3 input-only CompilerHost check preserves strict/noUncheckedIndexedAccess/verbatimModuleSyntax/skipLibCheck:false and reproduces seven diagnostics before the companion, zero after. Both erased JavaScript outputs hash8e609bb71c20b858c77f0e9f90bb1319db8477b13f9f965f1a1e18524bf50881. An initial ignored verifier used Root cwd and added a react-dom lookup fault; its output is retained, and the corrected actual portal cwd check removes that setup fault. No source file was edited by the overlay. Evidence and the full pinned diff are in .local-artifacts/portal-rebuild/w3-ci19c-type-companion/.

A separately attributed W3 follow-up applies the exact companion and reruns actual configured checks before any new sole Chrome grant. Source proof does not establish mounted lifecycle/effect timing, the Linux timeout's full cause or an exact-head CI pass. PR211 remains failed at published19c and unmerged; no browser/native grant is active.

## Source-ready and bounded mounted verification

W3 clean report3e8132eb confirms the exact companion dependency d8d51f8c clears actual configuredfrontend, session and observer/helper strict checks, each exit0. All source controls and complete2200/10 uninstrumented CI correspondence remain intact. Parent reviewed the finite plan and allocated one fresh exclusive synthetic Chrome grant to the same workspace/head, for the original case and one actual terminal-page hold comparison only. The observer variant remains separately instrumented. All original assertion texts and five-second notice window stay fixed; no retry-for-green. Results, current mounted lifecycle proof and CI correction remain pending. TASKS records exact grant/task/run/boundaries.
