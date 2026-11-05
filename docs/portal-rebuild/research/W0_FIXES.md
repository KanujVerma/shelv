# W0 bounded foundation fixes

Owner: Kanuj. Role: W0 implementation sub-agent. Date: 30 October 2026.

R1-R4 from [the independent foundation review](W7_FOUNDATION_REVIEW.md) are implemented and locally tested. **The foundation is not accepted.** The coordinator must commission a new independent review with the original findings and these responses. This is no claim about completed product pages, real isolated backend acceptance or release readiness.

## Identity and scope

- Workspace: `/Users/kanuj/.t3/worktrees/shelv/t3-fab317bf`.
- Initial branch was `t3/fab317bf`; live branch at commit is `t3/fix-rebuild-foundation`. This worker did not rename it.
- Clean starting/parent commit: `ec231df2e10671428ef7d98bbe80b6efedc1aa60`.
- Implementation commit: `52a93fb20b13063b0243c85fd1684a433c9e1121`. The subsequent commit adds only this report and [the machine receipt](../design/W0_FIX_VERIFICATION.json), which hashes all 13 implementation paths.
- Fresh `git fetch origin` succeeded; `origin/main` remained `d39a7d4943209080df7c4cf97d85784f462758bf`. The requested parent commit was preserved without rebasing or replacing source.
- Both live `orchestrator_capabilities({})` and `t3_thread_configuration({})` returned `codex`, `gpt-6.1-sol`, `reasoningEffort=xhigh`, `serviceTier=default`, full-access/default modes before implementation. The receipt retains the exact configuration and hashes the complete ignored tool returns.
- All Node/npm commands used `PATH="/Users/kanuj/.nvm/versions/node/v22.23.0/bin:$PATH"`; the executable/version were verified as that installation and `v22.23.0`. Chrome was `156.0.8078.79`.
- No nested agents. No dependency, lockfile, backend/migration, `site/auth`, gateway, route parsing, shared contract/status/ownership or root application edits. No push, PR, merge, deployment, hosted lifecycle, real-client data/messages or financial operation.

## Findings, changes and regressions

| Finding | Response and smallest owned change | Executed evidence |
| --- | --- | --- |
| R1 P1: client/advisor interrupted write incorrectly ends the session | The catch path distinguishes a retained factory's 503 suspension from session termination. Only the same audience, role, owner, generation, local epoch and unexpired lease may retain 503/uncertain. Read-only optional epoch/clock/deadline fields describe the existing retained objects within the wrapper; auth source is untouched. Successful private results still require `isCurrent`; no offline success is decoded. | Both actual `createCookieRequest` and `createClientCookieRequest`, with their actual session classes and synthetic injected fetchers: HTTP 503 and network loss preserve unsent memory and return 503/uncertain. Real ready-session replacement, same-owner re-login, expiry and logout reject late successes/errors. Audience/epoch negatives and changes during the synchronous suspension observer also reject; none decode private results. Existing CSRF, same-origin/no-store/redirect and action-allowlist checks pass. |
| R2 P2: body or unusable opener prevents recovery | Close autofocus tries the explicit ref, original opener, same-ID replacement and available page heading in order. Body/html, disconnected, disabled, hidden/inert/aria-hidden candidates are skipped, and a candidate must actually receive focus before fallback stops. | Actual shared Sheet under StrictMode, no trigger: initially open and programmatic open return to the heading. Removed opener, disabled/hidden opener and disabled/hidden same-ID replacement return to the heading. Viable replacement and explicit restore ref receive focus; unusable refs fall through to the viable opener. Existing focus trap, guarded Escape, single overlay and ordinary opener tests remain green. |
| R3 P2: native Forward loses the outgoing product context | Capture on scroll/focus and before programmatic or native traversal, including the outgoing DOM at popstate. Scope-bound memory handles the outgoing entry after browser state has moved; only safe navigation context is written to history. The active navigator owns `scrollRestoration=manual`, restores the prior mode on cleanup, cancels pending work and resets foreign-session entries. No React source change was necessary. | Actual navigator + NavigationProvider under StrictMode in intercepted Chrome: Back restores plan 600px/plan-focus; native Forward restores the exact evening product at 400px/product-focus. A second native Back/Forward round restores 650px and 450px with distinct focus. Scope replacement rejects old context and restores heading/0px. Pending teardown cannot overwrite a subsequent 333px position; mode returns to auto. No local/session storage is used. |
| R4 P2: transitive emitted code lacks original notices | Builder selects packages only from `outputs[*].inputs[*].bytesInOutput > 0`, resolves their installed descriptors, retains original legal files verbatim and emits a package/version/input/byte/hash inventory. Missing originals fail the build unless the exact package/version has a hash-checked retained upstream file. Existing direct/shadcn/clsx notices and linked legal comments remain distributed. | Built output has 47 selected packages and 47 original legal files, including all four Floating UI packages, remove-scroll dependencies, aria-hidden, use-callback-ref, use-sidecar, singleton, nonce, React/Radix and both font families. Byte comparisons cover every legal file, both direct notice files, eight emitted font files and both linked `.LEGAL.txt` files. A separate fixture excludes parsed-only/zero-byte inputs and rejects a newly emitted package with missing legal files. |

The task-first UX method was applied to recovery: inspect product context, close/Back action, resulting focus/scroll and unsent work. No new page, copy, control system, UI exploration or business rule was introduced. Keyboard assertions exercise real controls; these are synthetic component/navigation regressions, not human usability evidence.

The wrapper's offline exception deliberately depends on the retained `_epoch`, `now`, `idleExpiresAt` and `absoluteExpiresAt` fields. A port without this evidence fails closed when `isCurrent` is false. A future retained-session refactor must preserve or deliberately adapt this seam; checking only owner/generation would weaken the epoch/expiry fence. The coordinator's reserved CookieChannel additions are unchanged.

## Retained license provenance limit

The installed `react-remove-scroll-bar@2.3.8` tarball declares MIT but omits a legal file. Its npm-reported gitHead `b3b1287aad81def2e2ae707274b74531b61ddbaf` returned 404 from the declared repository. The verbatim [upstream license](https://raw.githubusercontent.com/theKashey/react-remove-scroll-bar/8ca9ba5ea52de03308fe8ced94f7b159a44d28ff/LICENSE) was retained at immutable repository commit `8ca9ba5ea52de03308fe8ced94f7b159a44d28ff`, SHA-256 `a79aae0c0f21990d9d963bb3c5a79cdcea9a46f8523ba55c58d7fe776b6ebc84`. That commit's package descriptor says 2.3.7. The registry and emitted inventory label this as the original license from the declared upstream repository, not an acquired package-version-specific license or a verified source match. No copyright wording was invented and no legal opinion is asserted. Review this recorded limit independently.

## Evidence correction

[The W0 report](W0_FOUNDATION.md) and [acquisition entry](../design/ACQUISITION.json) now identify `page-498-32.metadata.xml` as the exact 57-byte selected-D01 response, not an XML page tree or complete page metadata. Its original bytes/hash and all 26 separate frame acquisitions are preserved. All 99 acquisition record byte counts and SHA-256 values were rechecked successfully. No Figma version was invented; no native acquisition was duplicated.

## Commands and results

Commands below ran from `apps/portal` with the explicit Node PATH above. Ignored sanitized artifacts remain under `.local-artifacts/portal-rebuild/w0-fixes/` in this retained worktree; the receipt hashes the logs. Foundation output is separately under `.local-artifacts/portal-rebuild/foundation/`.

| Command/check | Actual result |
| --- | --- |
| `npm ci --ignore-scripts` | Pass; 130 packages added/132 audited. Three npm advisories: two moderate, one high. No upgrade/audit fix; identities not compared with earlier advisories. |
| `node --experimental-strip-types --test tests/rebuild-foundation-transport.test.mjs` before R1 | Expected red: 18 pass/4 fail; both real factories misclassified both outage types. Then 22/22 green; final added suspension-observer/late-success negatives are included below. |
| Focused browser command before R2/R3 (exact `--test-name-pattern` expression in receipt) | Expected red: 0 pass/2 fail. After R2: 1 pass/1 fail, with retained R3 diagnostic showing evening product at 0px/product-heading. After R3: the history case passed. |
| `node --experimental-strip-types --test tests/rebuild-foundation-notices.test.mjs` | Expected red: missing closure inventory in built output. Final 2/2 pass, including actual output inspection and missing-original refusal. |
| `npm test -- --test-concurrency=1` | **389/389 pass**, zero failures/skips. This includes retained release tests and the new foundation cases. |
| `node --experimental-strip-types --test --test-concurrency=1 tests/rebuild-foundation*.test.mjs` | **41/41 pass**, zero failures/skips. Final run strengthens the already-passing full suite with disabled/hidden replacement and pending-teardown subcases; production source is unchanged. |
| `npm run test:session` | **148/148 pass**, zero failures/skips. Local retained runtime tests, no real Auth stack. |
| `npm run typecheck:rebuild`; `npm run typecheck:session` | Both pass, zero errors. |
| `npm run build:rebuild`; `npm run check:ui` | Pass; generated closure notices and semantic-color guard. Retained UI guard passes all 11 stylesheets. |
| `npm run build` | Pass, 132 assets and the existing three API route families. Same three missing `expo/tsconfig.base` warnings due to absent root Expo dependencies. ZIP `307472c8b6836ae5858d625cd6b0e36748cf8f8b32054967af38b862b2062875`; vault `12ccdf38776e434a5e53233cf3806d755e8cf50a1cd028e8989fe5dd73b99126`, matching prior retained build evidence. |
| Acquisition byte/hash check; final diff/ownership checks | 99/99 valid; no unrelated tracked edits; `git diff --check` and staged whitespace checks pass. |

Browser execution used one sequential local repository Chrome stack with deny-by-default interception and blocked service workers/background networking. Passing contexts report zero unexpected requests/page errors. T3 preview status/open were tried first and the blank owned tab was closed; the explicitly authorized repository interception workflow was then used. No second Auth/database/container stack was started.

Two test-authoring mistakes are excluded from product findings: an early probe supplied a Uint8Array instead of a string HTTP body, and the first font assertion matched only woff2 rather than both emitted woff formats. Both were corrected before final verification. The upstream npm gitHead 404 is a retained provenance limit, not a successful acquisition.

Not run: root Expo application/tests/types/exports, native checks, DB reset/SQL/RLS, real Auth/Storage/outbox/email/hosted acceptance, final pages, complete screen-reader/zoom/human review or exact-head CI. These are outside this bounded worker and remain coordinator/release gates. The parent owns shared status/CONTEXT_SYNC updates and the new independent review task. No self-certification of acceptance.
