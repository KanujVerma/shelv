# W7 independent W0 foundation review, round 2

Date: 30 October 2026. Reviewer: W7. No subagents or nested review.

## Verdicts

**Specification compliance: PASS for the bounded W0 corrections.** R1-R3 now satisfy the interrupted-write and focus/history requirements exercised below. The metadata description is corrected. This verdict does not certify the full specification, final pages, backend, end-to-end portal, accessibility, human usability or release readiness.

**Code quality: PASS for this fix range, with the recorded R4 provenance limit.** No new blocking or important breakage attributable to the fix was found. All four original findings are addressed at their original scope. R4's omitted notices are present; an exact-version source/license association for one package remains unverified. This is no legal clearance claim.

| Original finding | Verdict | Independent result |
| --- | --- | --- |
| R1 P1: retained factory suspension becomes 401/session-ended | **ADDRESSED** | Both actual factories return 503/uncertain for HTTP 503 and network loss, retain unsent memory and decode no private result. Genuine replacement/expiry/logout and epoch/audience/role negatives still reject. |
| R2 P2: body/unusable opener blocks heading fallback | **ADDRESSED** | Actual shared Sheet under StrictMode restores the heading for initial/programmatic open and unusable/missing openers; viable replacements and explicit refs work. |
| R3 P2: native Forward loses product scroll/focus | **ADDRESSED** | Repeated actual navigator/React Back/Forward restores plan 600/650px and evening product 400/450px with distinct focus. Scope replacement and pending teardown checks pass. |
| R4 P2: emitted transitive notices absent | **ADDRESSED**, with residual provenance uncertainty | Fresh output includes the positive-byte closure: 47 packages, 47 legal files, direct notices, eight font outputs and both linked legal files. The declared-upstream exception is transparent and hash-checked, but is not an exact 2.3.8 source match. |

These are findings dispositions, not acceptance of the later integrated branch or authorization to distribute/deploy it. The coordinator owns final composition and acceptance.

## Reviewed identity and evidence boundaries

- Review workspace: `/Users/kanuj/.t3/worktrees/shelv/t3-5b29f4a6`.
- Branch: `t3/foundation-review-round2`; clean before review.
- Reviewed integrated source HEAD: `129635e88f91e9539973062a60779f717f2a935a`.
- Original foundation: `9be041db5b7227637f0c3ba964d932c6bc6d0e06..eceecf186415fa9c7e6008605263d3e56e23cb16`, previously reviewed as integrated `4dce8d845ad9898ea5e05b35f963a037db94fdd9`.
- Fix source: `ec231df2e10671428ef7d98bbe80b6efedc1aa60..f0f56e840cd0dc8e6480d57dfaa71a56208d9af0`; implementation `52a93fb20b13063b0243c85fd1684a433c9e1121`.
- Integrated fix commits: `0f4d6b769b4adcf8382375a430553f3f396aa135` and `e343fddfa6cf115107f40876c111fc4451a7fbdc`.
- Supplied patch: `/Users/kanuj/.t3/worktrees/shelv/kanuj-portal-rebuild-integration-20261030/.local-artifacts/portal-rebuild/W0-fix-review.patch`; 82,241 bytes, SHA-256 `0fbfa3cb9b6c0fc6538a26829d692a086f19940bbae80c17ca11dd0b93418dec`. It equals `git diff --unified=10 ec231df f0f56e8` byte for byte.
- Compared all 15 patch paths against this checkout. Fourteen are byte-identical to the fix head. The sole difference is the parent's declared addition of `|'plans'` to `CookieChannel`; no other transport/focus/history/notices change is hidden in integration.
- `git fetch origin` succeeded; `origin/main` is `d39a7d4943209080df7c4cf97d85784f462758bf`. The requested source was preserved, without rebase or checkout replacement.

Read the original [W7 review](W7_FOUNDATION_REVIEW.md) in full, [W0 foundation report](W0_FOUNDATION.md), [fix response](W0_FIXES.md), [fix receipt](../design/W0_FIX_VERIFICATION.json), root/portal AGENTS, rebuild entry point, D01-D48, full desktop specification, implementation contracts, ownership/status and acceptance inventory. Inspected the changed implementation/tests and actual retained client/advisor cookie classes. Applied review and verification workflows. The parent's gateway/plans implementation is context for these real factories, not an independent review of that feature or the intervening backend changes.

Fresh `orchestrator_capabilities({})` and `t3_thread_configuration({})` returned provider `codex`, model `gpt-6.1-sol`, options `reasoningEffort=xhigh`, `serviceTier=default`, runtime `full-access`, interaction `default`. Both identify the delegated round ending `portal-rebuild-w7-foundation-review-20261030-r2`. These are live tool results, not self-reported model inference.

Every Node/npm check used `PATH="/Users/kanuj/.nvm/versions/node/v22.23.0/bin:$PATH"`; `command -v node` and `node --version` returned that executable and `v22.23.0`. Fresh browser launch reported Chrome `156.0.8078.79`.

## R1 reproduction and fence review

Changed source: `apps/portal/src/transport/session.ts:65-97`. Relevant retained behavior remains in `apps/portal/site/auth/advisor-cookie-session.js` (`isCurrent`, `suspend`, `createCookieRequest`) and the client subclass/factory.

The exception applies only to a thrown status 503 while the retained session is offline. It requires the same audience, identity role, owner, generation, finite local epoch and unexpired captured idle/absolute deadlines. A successful response still must pass `isCurrent` before decoding. A port lacking epoch/deadline evidence cannot use the suspended-lease exception. No gateway policy, CSRF behavior or factory is replaced by this patch.

Ran the committed actual-factory regressions, then a separate Node strip-types diagnostic using the actual session classes and factories. Each diagnostic supplied only a synthetic fetcher and lock callback, restored a ready session, wired `onState` to `transport.sessionChanged`, stored a synthetic note, and executed `decide` or `save_draft_v2` through `operations`.

| Actual factory | Injected interruption | Error | Session / local edit / decoder |
| --- | --- | --- | --- |
| `createClientCookieRequest` | HTTP 503 | 503 / uncertain | offline / retained / 0 calls |
| `createClientCookieRequest` | thrown network TypeError | 503 / uncertain | offline / retained / 0 calls |
| `createCookieRequest` | HTTP 503 | 503 / uncertain | offline / retained / 0 calls |
| `createCookieRequest` | thrown network TypeError | 503 / uncertain | offline / retained / 0 calls |

Observed URLs are `/api/{client,advisor}/session` followed by `/api/{client,advisor}/operations`. Operation options retain synthetic CSRF, `credentials: same-origin`, `cache: no-store`, `redirect: error`. No real fetch or account is involved. The committed allowlist negative rejects an invented action before another request.

Fresh tests also reject late successes and errors after owner replacement, same-owner re-login, expiry, logout, audience change and epoch change for both actual factories. Synchronous suspension observers that alter epoch, role or deadline cannot use the exception. The explicit offline-success test decodes nothing and returns 401. These tests preserve the original successful-result fence; they do not establish business idempotency or outcome reconciliation against persistence.

The wrapper deliberately reads retained `_epoch`, `now` and deadline fields. This is a bounded coupling to the existing implementation, documented in the interface and author response. A future retained-session refactor must adapt this seam and rerun these tests.

## R2 reproduction

Changed source: `apps/portal/src/ui/overlay.tsx:11-18,51-54`. Candidates are tried in order: explicit restore ref, original opener, same-ID replacement, available page heading. The loop skips body/html, disconnected, disabled, hidden/inert/aria-hidden, zero-rectangle and hidden/collapsed candidates, then verifies that focus actually moved before stopping.

Fresh intercepted Chrome rendered the actual `OverlayProvider`/`Sheet` under StrictMode. The 11 recorded modes produced:

- Initial open, programmatic open, removed opener, disabled/hidden opener, disabled/hidden replacement: `heading`.
- Viable same-ID replacement: `opener`.
- Disabled/hidden explicit ref with viable opener: `opener`.
- Viable explicit restore ref: `restore`.

The initial/programmatic cases begin without a focused trigger, reproducing the original body-opener scenario. Tab remains within the open sheet; Escape closes it. Existing ordinary-trigger, guarded Escape and single-overlay checks also pass. The additional html/inert/aria-hidden branches were inspected in source; they are not separately claimed as browser cases. Passing contexts assert zero page/console errors and zero unexpected requests.

## R3 reproduction

Changed source: `apps/portal/src/navigation/history.ts:23-87`. Scroll/focus capture saves the outgoing safe context; native popstate keeps outgoing DOM context in scope-bound memory after browser state has moved. Only the active navigator restores the viewport; subscription teardown cancels pending restoration and returns the previous browser scroll-restoration mode.

Fresh intercepted Chrome used the actual navigator and `NavigationProvider` under StrictMode, with a 4000px synthetic view. Recorded results:

| Traversal | URL | Scroll | Focus |
| --- | --- | --- | --- |
| First Back | `/plan?routine=evening` | 600 | `plan-focus` |
| First native Forward | `/plan/products/card%3Aone?routine=evening` | 400 | `product-focus` |
| Second native Back | `/plan?routine=evening` | 650 | `plan-focus` |
| Second native Forward | `/plan/products/card%3Aone?routine=evening` | 450 | `product-focus` |
| Back into old scope after replacement | same identified evening product | 0 | `product-heading` |

Manual restoration is active while subscribed. Navigating and immediately unmounting leaves a subsequent 333px position intact after two animation frames; the browser mode returns to `auto`. Local/session storage remain empty. The existing harness also retains synthetic unsent text across in-app Back/Forward and checks product/routine direct entry and refresh. Passing contexts assert zero unexpected requests/errors.

This disposes of the original native Forward defect. It does not certify every future page's asynchronous height/focus lifecycle. An additional in-memory comparison of nonzero product scroll across reload returned 0px with both the pre-fix and reviewed history sources. That observation is not a new fix regression and is not counted as proof of nonzero reload restoration or full D10 acceptance.

## R4 output and independent provenance assessment

Changed source: `apps/portal/scripts/emitted-notices.mjs`, its build invocation, retained-license registry/file and notices. The generator selects `outputs[*].inputs[*].bytesInOutput > 0`, resolves the installed package descriptor, copies its legal files verbatim and records package/version/input/bytes/hash. A newly emitted package without originals fails unless explicitly covered by the package/version registry. Retained bytes must match the pinned hash.

Fresh notice tests build the actual output, compare every selected package/version and file, verify both direct notices, match emitted fonts, resolve linked legal files, exclude parsed-only/zero-byte inputs and refuse a synthetic emitted package lacking a legal file. A separate Python walk of positive-byte inputs independently matched all 47 package/version byte totals and all 47 copied legal-file hashes/bytes. This includes the originally missing Floating UI and remove-scroll-related notices. Eight emitted font files and two linked `.LEGAL.txt` files are present. The emitted inventory SHA-256 is `24a16874de2237bb865bf38eb8d54a3dfb0111722e135c0e78b132dec601c7d9`.

The exception cannot be described as an exact package-version original:

1. Independently fetched the public npm 2.3.8 descriptor and its tarball. The tarball SHA-512 matches registry integrity; its archive contains no license/notice/copying/copyright file. The descriptor declares MIT and the `theKashey/react-remove-scroll-bar` repository, with gitHead `b3b1287aad81def2e2ae707274b74531b61ddbaf`.
2. That reported head's LICENSE and package descriptor both return HTTP 404 from the declared upstream repository.
3. The immutable [retained upstream LICENSE](https://raw.githubusercontent.com/theKashey/react-remove-scroll-bar/8ca9ba5ea52de03308fe8ced94f7b159a44d28ff/LICENSE) is byte-identical to the committed and distributed 1093-byte file, SHA-256 `a79aae0c0f21990d9d963bb3c5a79cdcea9a46f8523ba55c58d7fe776b6ebc84`. Its [package descriptor](https://raw.githubusercontent.com/theKashey/react-remove-scroll-bar/8ca9ba5ea52de03308fe8ced94f7b159a44d28ff/package.json) says **2.3.7**, declares MIT and identifies the same project/author.
4. The emitted 2.3.8 record contributes 3,776 bytes and includes `source: retained-upstream` plus the acquisition-limit text. It does not claim that npm's gitHead was acquired or that the retained commit matches 2.3.8 source. The author report explicitly records the 2.3.7 descriptor.

**Assessment:** the original missing-attribution defect is addressed: the output now carries the declared project's verbatim copyright/permission notice, alongside all available installed-package originals. An unavailable exact-version source association is a different evidentiary limit from a notice being absent. The shared repository/author and consistent MIT declarations support this bounded disposition; they do not prove that every 2.3.8 byte corresponds to that upstream commit. Preserve this exception in future release evidence and revisit it if exact-version licensing provenance is required or contrary evidence appears. No legal clearance, package/source equivalence or resolution of the 404 is asserted.

## Metadata correction

The W0 report and acquisition entry now call `page-498-32.metadata.xml` a selected-D01 response. Independently read its 57 bytes and verified SHA-256 `be3e13dcf4cb3524dcaeb431228e6629f3193eb30df811c63a578af6899b8ceb`. All 99 acquisition byte counts/hashes match; prior record fields are unchanged apart from the new scope annotation. The fix does not replace original frame/context bytes or invent a Figma version. No new Figma acquisition or full-page tree is claimed.

## Executed checks and limits

All commands ran in `apps/portal` with the explicit Node PATH above, unless noted. Sanitized generated artifacts are ignored under this review checkout's `.local-artifacts/portal-rebuild/w7-r2/`; browser regression records are under `.local-artifacts/portal-rebuild/w0-fixes/browser/`.

| Check | Fresh independent result |
| --- | --- |
| `npm ci --ignore-scripts` | Pass; 130 packages added, 132 audited; two moderate/one high advisory reported. No upgrade/audit fix or advisory-identity assessment. |
| `node --experimental-strip-types --test --test-concurrency=1 tests/rebuild-foundation*.test.mjs` | **41/41 pass**, zero failures/skips; includes actual factories, intercepted browser, missing-notice refusal and build. |
| `npm run typecheck:rebuild` | Pass, zero errors. |
| `npm run typecheck:session` | Pass, zero errors. |
| `npm run check:ui` | Pass for 11 retained stylesheets; focused build also applies the new-source semantic-color guard. |
| `node --test --test-concurrency=1 tests/*.test.mjs` | **389/389 pass**, zero failures/skips; 184.94 seconds. Flag placed before the file list. |
| `npm run test:session`, sequential after portal | **157/157 pass**, zero failures/skips; 36.97 seconds. Includes the parent's nine plan-channel cases, beyond the author's 148-case fix receipt. |
| `npm run build` | Pass; 134 assets, existing `/api/client/*`, `/api/advisor/*`, `/api/walkthroughs/*` route families. Three missing `expo/tsconfig.base` warnings from absent root dependencies. This packages the reviewed parent with its plans files, rather than reproducing the author's earlier 132-asset source. |
| Actual-factory diagnostic, emitted-closure and acquisition checks | Results reproduced above; no mismatch. |
| `git diff --check`, report link/scope/staged checks | Pass; only this report is staged, local links resolve, no em dash or unfinished result placeholders. |

Fresh packaging ZIP SHA-256: `80da94340bab72d21683eef6443df4ad917cf3c8cb8d2e6e35905d0e7134ae32`; vault SHA-256: `8eee97a0179d63768a05b9b50565eed9d6a3b381d955ddc91a6f5b5e0b553da2`. They identify this integrated parent, not the original W0 artifact.

Preserved log SHA-256 values, relative to `.local-artifacts/portal-rebuild/w7-r2/`:

- `focused.log`: `54226376f63d97d59812375763927330e966c0cde9e65bd5db81aa50027191d6`.
- `portal-sequential.log`: `eb9446b91cd436b8f2b02dd7879904557b59c11586177c639bdbd93a689feb33`.
- `session-sequential.log`: `769fd89d5817f221128e37a9e7a71c1988d56f7c4844a14d5f38632898d3f72a`.
- `build.log`: `f45f66a27e1729611b375d8c0e2d5659ae08beffb62b4918e158941767b98c0d`.

T3 preview was considered first: status had no tab; `preview_open({open:false})` created an owned blank tab, which was closed. The explicitly requested repository interception workflow was used for the browser cases. Focused and targeted probes use deny-by-default interception, blocked service workers/background networking and synthetic documents only.

Verification correction: an initial broader attempt launched the portal and retained-session suites together. The portal npm script puts appended arguments after the file list, so `npm test -- --test-concurrency=1` did not serialize those files. The session suite also launches Chrome cases. This violated the one-stack execution constraint for that attempt. Stopped the exact two review-owned runner trees and descendants; preserved the incomplete logs as `portal-aborted.log` and `session-aborted.log`. Neither run is counted as passing or product-failure evidence. The corrected portal command places the flag before the glob, and the session suite is run afterward. This procedural error is not hidden by the later results.

Two read-only probe mistakes were corrected: a source-comparison helper initially used repository-relative paths from the portal directory; an acquisition helper initially requested `files` instead of `records`. Corrected runs produced the identity and 99-record results above. Neither changed product files or establishes a product finding.

No Docker/Colima/Supabase/Auth lifecycle, private credential, real recipient, hosted account, email, purchase or money operation was used. Retained session tests use synthetic local runtime/provider fixtures; those are not real Auth/PostgREST acceptance. Did not run root Expo tests/types/exports, database reset/SQL/RLS/Storage/outbox/email journeys, physical-device checks, full integrated branch review, exact-head CI, complete accessibility/zoom/screen-reader or human comprehension review. Author receipts remain attributed historical evidence rather than substitutes for these fresh checks.

Only this report is authorized for the review commit. No production fix, push, PR, merge, deployment or CI watcher. The coordinator owns status/CONTEXT_SYNC updates and any later full-branch review.
