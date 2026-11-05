# Coordinator: V3 package entry selection and working directory

The first ordinary portal package run after local V3 integration completed with 1,726 passes, 15 failures and no skips. Eleven failures used a context-specific harness without its externally supplied entry selector; one source helper resolved its tsconfig relative to the caller's working directory. Three additional wait timeouts were preserved without assigning an unproved cause.

The W3 owner supplied only the five helper/test postimages in `fed90f029b2849426f52263c74c589b1e86643d9`, followed by report `65363815e9444fc070721bc2efb79240f13b0690`. Parent imports are `f57760cc` and `9d857346`. Context and retry files now explicitly select their own bounded context entry. The source compiler anchors paths to its module location. Historical input selectors and the default entry remain available. No production plan code, Auth, Root contract, SQL, timeout or domain assertion changed.

Parent independently verified all five imported blobs and byte equality of the complete semantic assertion bodies in the context-browser, residual-browser and residual-source files. The new packaging controls pass 5/5 in Parent. The package command now runs files serially, matching the documented serial browser workflow; every existing test file remains included.

With explicit Node 22.23.0, the full configured `npm --prefix apps/portal test` completes **1,770/1,770**, zero failures, skips or cancellations, in 644.080 seconds. This includes the unchanged budget and initial-mode wait assertions that previously timed out. A serial passing run does not establish the cause of the earlier parallel timeouts. The additional reported tests are the five packaging controls plus the 25 source cases that previously failed at file compilation rather than running.

The preceding Root `npm test` reports 1,256 TAP passes and 18 existing opt-in skips, exit 0. Both tracked portal compiler configurations passed at the same unchanged production source. Logs remain in `.local-artifacts/portal-rebuild/ci-153d/` and `.local-artifacts/portal-rebuild/v3-package-replay/`.

This is ordinary package/source and finite synthetic browser evidence for the V3 module. Default Parent App remains Care2; the separate composed App/history candidate and advisor-guidance candidate still have their independent review gates. No R9/Auth/database fixture was accessed, no source storage or financial API was admitted, and no hosted/release/full-goal acceptance follows. Exact-head CI must verify the published integration head.
