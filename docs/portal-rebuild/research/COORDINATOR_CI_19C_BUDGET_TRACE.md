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

## Finite mounted result and independent review input

Author64f8b61b records exactlyone untouchedoriginalpass andone controlledpass. OriginalMacpass is non-sensitive toLinux19cfailure. With actualterminal26held, the originalzeroloadingpredicate is true while the SAMEactiveprovider's manifest remainsnull and accepted-statepredicatefalse, with0details. Afterrelease, actualRootcollect accepts2550 on the capturedowner before originalopen/5000msnotice/51unique/>=26/<100/50 assertions pass. Page and Node clockorigins remain separate; no generalizedlatencycauseclaim.

Chromeexplicitlyreturned07:51:23UTC. Parent's saved-only copies retain returnSHA5d2d160f122119b1153535488b3c8568e15dc82de60ebf01d9f678d989767ef2, finalinventorye569f6eedacf62ddad3d626ce152c8a7def005e0de6124b9ca79983b236742f2 and observations2112ca0dd40cb078c83ba9b583616403a40188e33776a3be50c1c504d61f78ad. Source/bundlecorrespondence and readonlytransformedprovenance stayqualified. No furtherbrowser/process/resourcecall.

Parent-created reviewcandidate9b2ba20999809440be62d0de85c121a1b8850bb5 uses only11test/reportpaths atactualRoot e7cbeaf4. It retains existingParenthelpergrantmetadata at the sole importconflict; it does not import/downgrade any of the childruntime/type dependencies. Temporaryindex/sourcepin/patch checks leave realRootsource/index untouched. A NEW independent source/test/evidenceR1 begins from e7cbeaf4 and imports onlythatcandidate. The earlier allocation incorrectly limited current-versus-CI differences to session and client-state. Independent E1 disproves that claim; the complete five-input correction is recorded below. The review cannot claim newCIgreen or independentlivebrowserproof from author evidence. Publication/admission waitsitsverdict and an actualexactheadCIrun.

## E1 correction: complete current and historical compiler projections

Independent R1 a2c75dc5 gives scoped source/test PASS and evidence CHANGES REQUIRED E1/P2. I incorrectly inferred complete correspondence after checking only two changed App files. The actual complete graph contains five differing inputs. All five already belong to the pre-patch Parent base; none was introduced by the eleven-path test candidate. The failed expected-two assertion and its unexecuted historical tail remain preserved. This correction changes provenance, without a production/test edit or claim that any extra input caused the Linux timeout.

| Input under apps/portal/src/ | Current blob | Published19c blob | Inspected distinction |
| --- | --- | --- | --- |
| app/client-state.ts | e4cb15994736a7698c2bdcdee532b2dc26fe0968 | 89ffa0791e4acaf2478d58a22058d2b3f5bed50e | Actual accepted-view/callback/read retirement and selected-version work |
| app/retained.ts | 9fa4e4a16d9b8bd1a305297d2ed2432fd7202d7e | bdc585fc4f783e2a04800384c509b48402d4665c | Erased generation type member; independent emitted-JS equality below |
| app/session.ts | 405c90830b37f66fa2a2f2843c49c731e7e5565f | d7375af2e08bdcc01b4f0d7000ee4d1ade859450 | Actual server-generation boundary fence |
| navigation/history.ts | 7a034c8bcaf4ac74e453423f46fc70fbe753e229 | d591343dac34c773bf9b2b505a8f38fd49040e9f | Canonical restoration/readiness and entry custody work |
| navigation/react.tsx | 75ddd6f2f9c82387affd21ddcd65605473fab663 | 5263e73aefe02508c7f646b3d33bde798f079e66 | Core-only typed consumer and optional complete-navigator helper |

Parent's fresh source-only compilation at clean7093a6a0 independently reproduces current2200 inputs,2195 matching savedCI/five differing, and9/10 matching outputs. Current inputHash20f1d83f1b4aad838968d78bb9370287bc60073caece3830b7d4c61703f5fe75 and preparedHash6cc1679179c24a714e212ac40a98dfe516bfabaa197275853ecd658a76c9c9d0 exactly match the reviewer's measured current graph. Root's code candidate remains unimported.

The coordinator separately executed one explicitly complete historical compile-only overlay of those FIVE whole files from19c. Every overlay has current/compiled bytes, SHA256 and Git blob provenance; no tracked file was changed. All2200 historical compiled input hashes and all10 outputs then match the actual savedCI graph: inputHasha40df8bb05893d7ec284098de141f67b59d70ad1f298dc636f66047c5ecf0047 and preparedHash30bae7806eac01af299638488b22c8889109a119d40d1d46d8b13967ba4b760b. Four excluded diagnostic input records were separately checked byte-identical to19c. This historical variant is not current Root code or a current positive browser/CI run.

Actual TS6.0.3 transpilation of current versus19c retained.ts produces identical JavaScript SHA256502c49ba694f171b29d4183a2608f60263b1665e109ce655ea94b15d8cee3338. The other four files contain inspected runtime-source changes; this record does not infer execution, causality or a new fault from their presence in the graph. Both actual bundles stayed in memory; no browser/application entry was executed.

Full raw reviewer/current/historical records, all five diffs, actual own reconcile.mjs and RECONCILIATION.json reside in .local-artifacts/portal-rebuild/ci19c-e1-provenance-correction/. Source/test candidate9b2ba209 is unchanged. E1 is coordinator-addressed by this complete projection and exact historical proof, pending a NEW bounded independent evidence R2. R1 remains frozen CHANGES REQUIRED and actual current Linux CI remains UNVERIFIED.

## Admission and Parent verification

Independent evidenceR2 f3bbfa75 gives scopedSPEC/qualityPASS and closes E1; R1 source/testPASS remainsat unchanged9b2, and R1's historicalevidencefinding staysimmutable. Root imported onlyR2report as51f498b4, then reviewedtest/reportcandidate as7d864736. All production UI, Rootcontracts, functions, canonical62migrations and gateway/Vault runtime trees match the pre-import Parent exactly. Allthreechilddependencydowngrades and returnedgrantmetadata remain excluded. A07sourcecandidate remains unimported.

Fresh Parent checks at clean7d864736: focused36/36, source74/74, residual25/25, frontend/session/extendedobserverstrict0, UIguard0; Rootnpm1256pass/0fail with18existingoptinskips, Rootapp/testtypes0 and Expo webexport0. Cleanactualmainwrite:false has2232inputs/15outputs, sourceDirtyfalse and everyinput/outputhashequal to the prior independentlyreviewed App e6b candidate. Unique receiptSHA256d550966d8b870d0ae98283d62f2fbe5883f1e3b061f6a49c75cfab62a5a87fb4. Full command/exits/loghashes/import/treechecks are in .local-artifacts/portal-rebuild/ci19c-parent-admission/. No new localbrowser/native/resource grant was used.

This admits a reviewed TEST readiness correction. It consciously stages the already reviewed V3/History App source alongside that correction for the next draftPR CI run; the controlledhistoricalfailure/completefivegraphprojection remain explicit. FullAppB3/B4/frame-C/genuine/visual/release gates stayopen. Exact-head LinuxCI is stillpending; no timeout/budget/assertion orproductionbehavior was changed to hide the failed19c case.
