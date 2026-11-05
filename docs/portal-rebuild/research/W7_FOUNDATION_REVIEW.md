# W7 independent W0 foundation review

Date: 30 October 2026. Reviewer role: W7. No nested agents.

## Verdicts

**Specification compliance: changes required for the W0 foundation.** The shared controls, shell geometry, native evidence retention and preserved release boundary satisfy the inspected foundation requirements. R1 prevents the required uncertain-write recovery through the actual retained cookie factories. R2 and R3 leave gaps in the required focus/history recovery.

**Code quality: changes required.** R1 is important before connecting writes. R2/R3 need focused regressions, and R4 needs complete notices before distributing the new bundle. No P0 issue, production fix, auth weakening or root-package change was found in the reviewed W0 range. These verdicts cover the foundation only, not unimplemented page bodies, full portal E2E/accessibility, backend acceptance or release readiness.

| ID | Priority | Persona / goal | Observed defect | Smallest correction direction / regression |
| --- | --- | --- | --- | --- |
| R1 | P1 | Client/advisor recovering an interrupted save | Real cookie-factory 503 becomes `401 / session-ended` while the session is merely offline. | Distinguish session replacement/expiry from same-session suspension; test both retained factories with 503/network interruption and preserved edits. |
| R2 | P2 | Keyboard user closing a directly opened sheet | Without a focused opener, close leaves focus on `body` instead of the available page heading. | Reject unusable opener candidates and verify the heading fallback for initially open/no-trigger sheets. |
| R3 | P2 | Client returning through browser history | Forward restores a product view to 0px rather than its last 400px position. | Capture outgoing entry context for history traversal, not only `navigate`; test real Back/Forward scroll/focus. |
| R4 | P2 | Maintainer distributing the component bundle | Emitted MIT dependencies lack their copyright/permission notices. | Include notices for the actual emitted dependency closure and check the built artifact, including linked legal files. |

R1-R3 are directly reproduced runtime behavior. R4 is reproduced from the built artifact and installed package licenses. The correction directions are review recommendations, not implemented fixes.

## Reviewed identity and scope

- Workspace: `/Users/kanuj/.t3/worktrees/shelv/t3-8fc197ed`.
- Branch: `t3/review-w0-foundation`; clean before review.
- Original immutable range: `9be041db5b7227637f0c3ba964d932c6bc6d0e06` to `eceecf186415fa9c7e6008605263d3e56e23cb16`.
- Integrated reviewed HEAD: `4dce8d845ad9898ea5e05b35f963a037db94fdd9`.
- Supplied patch: `/Users/kanuj/.t3/worktrees/shelv/kanuj-portal-rebuild-integration-20261030/.local-artifacts/portal-rebuild/W0-foundation-review.patch`; SHA-256 `efa7c4a2aff823be7b68a169395e2c2a303bc1e7931cf1453be6640d5c028356`. It exactly equals `git diff --unified=10 9be041d eceecf1`, with 128 file sections.
- Compared every W0-changed path between the original W0 head and integrated HEAD: no differences. The integrated W0 commits are `5a5b26f`, `df28117`, `723b007`, `a1cdb3a`, followed by the parent's metadata normalization `4dce8d8`. Review therefore applies to the actual integrated foundation, not just the author report.
- W1 typed seam and coordinator fixture-path changes are context only. Unfinished SQL/Edge implementation, final pages, publication/payment/outbox behavior and fixture-path correctness are outside this review.

Read the supplied/root and portal AGENTS instructions, rebuild entry point, D01-D48, full desktop specification, implementation contracts, workstream/status/acceptance records, W0 report/receipt, native contexts and relevant retained cookie/release source. Applied the verification workflow and repository task-first UX review methods. Investigated the reproduced concerns at their source boundaries before recommending corrections.

Fresh `orchestrator_capabilities({})` and `t3_thread_configuration({})` both returned `codex`, `gpt-6.1-sol`, `reasoningEffort=xhigh`, `serviceTier=default`, `full-access`, interaction `default`. The current delegated thread ends in `portal-rebuild-w7-foundation-review-20261030-r1`. This is live tool evidence, not an inferred model claim. All Node/npm checks used `PATH="/Users/kanuj/.nvm/versions/node/v22.23.0/bin:$PATH"`; executable and version were verified as that path and `v22.23.0`. Browser runtime was local Chrome `156.0.8078.79`.

## Findings and reproductions

### R1: same-session offline errors are misclassified as session termination

Location: `apps/portal/src/transport/session.ts:62-64`. Relevant retained behavior: `apps/portal/site/auth/advisor-cookie-session.js:251-258` and `isCurrent`/suspension at lines 178-185.

The retained request factory catches a 503 while the lease is current, calls `session.suspend()` and rethrows the 503. Suspension preserves the owner/generation but makes `isCurrent(lease)` false because status is `offline`. The new wrapper's catch treats that false result as session termination before reaching `safeError(error, kind)`. The client factory uses the same JSON factory and reproduces the same defect.

Executed with each real factory, an injected synthetic fetcher, and `session.onState = () => transport.sessionChanged()`:

```text
createClientCookieRequest: requests /api/client/session, /api/client/operations
sessionStatus=offline, status=401, outcome=session-ended
message="your session has ended. sign in again."
unsent note remains in transport memory

createCookieRequest: requests /api/advisor/session, /api/advisor/operations
sessionStatus=offline, status=401, outcome=session-ended
message="your session has ended. sign in again."
unsent note remains in transport memory
```

Reproduction from `apps/portal`, using Node 22 strip-types:

1. Instantiate `CookieClientSession` or `CookieAdvisorSession` with a synthetic `locks.request` callback and injected `fetcher`.
2. Return a valid ready session projection for `/session`: synthetic owner/CSRF, `capabilities.view=true`, generation 1 and future lease deadlines. Return HTTP 503 `{code:'unavailable'}` for `/operations`.
3. Restore the session, create the transport, wire `onState`, and store an unsent note in `transport.memory`.
4. Bind the actual `createClientCookieRequest` or `createCookieRequest` on `operations`, kind `write`, with a decoder. Execute allowlisted `decide` or `save_draft_v2` respectively.
5. Inspect the caught `TransportError` and session. It is 401/session-ended, not the required 503/uncertain result, although owner/generation have not changed.

This violates D16 and the implementation contract's interrupted-write semantics. A write may have committed before the outage; prompting sign-in instead of uncertainty/status reconciliation is misleading. No actual data loss or duplicate business write was exercised here. Keep the successful-result lease fence and genuine logout/owner/epoch rejection; distinguish offline suspension in the error path. The existing transport test at `tests/rebuild-foundation-transport.test.mjs:33` throws 503 from a stub without the real factory's suspension, which explains why it passes.

### R2: a connected but unusable opener prevents heading fallback

Location: `apps/portal/src/ui/overlay.tsx:29` and `:42-46`.

The opener captures any active `HTMLElement`, including `document.body`. On close, `body.isConnected` selects it ahead of the heading fallback; calling its `focus()` does not focus the parent heading. The wrapper also prevents Radix's default close autofocus.

Two local intercepted browser reproductions agreed:

1. In the actual component harness, blur the active element, run `document.querySelector('#preview-sheet-trigger').click()`, wait for the sheet, press Escape, then inspect `document.activeElement`.
2. Independently bundle the actual `OverlayProvider`/`Sheet` into an in-memory test entry. Render under StrictMode with an available `<h1 data-page-heading tabIndex={-1}>`, `open` initially true and no trigger or restore ref. Close with Escape.

Both returned `activeTag=BODY`, empty active ID and `headingFocused=false`. The second context reported zero page errors and zero unexpected requests. The ordinary focused-trigger restoration case passes the existing suite.

This is a D10/shared-dialog fallback gap for route-driven/direct-entry overlays. Use only a viable opener/replacement, then fall back to the heading when no opener can receive focus. Test initial-open, removed opener and disabled/hidden replacement cases without weakening the focus trap. This finding does not certify how a future page will coordinate its own navigation focus.

### R3: history traversal does not retain the view being left

Location: `apps/portal/src/navigation/history.ts:34-36`, `:40-47`, `:51-54`.

Only `navigate()` saves outgoing scroll/focus into the current marker. Neither `back()` nor native traversal records subsequent changes to that entry. `pop()` then overwrites the browser's own restored scroll with the stale marker, initially `{scrollY:0, focusKey:null}`.

Reproduced in a local intercepted Chrome document with a 4000px body, a focusable heading/opener and the actual navigator bundled in memory:

```text
Initial URL: /plan?routine=evening
scroll to 600; focus #opener with preventScroll
navigate({name:'product', productId:'card:one', routine:'evening'})
scroll product view to 400
before Back: scrollY=400, marker.restore.scrollY=0
navigator.back(): /plan?routine=evening, scrollY=600
browser Forward: identified evening product URL, scrollY=0
```

Expected Forward position is 400. The run reported zero unexpected requests and zero page errors. This isolates the W0 history implementation; it does not depend on any unfinished product body. The existing browser test checks URL/product/routine and unsent text but never checks a nonzero Forward scroll position.

Preserve outgoing context on native and programmatic traversal, with deliberate ownership of browser scroll restoration. A regression should scroll and focus both entries, use Back/Forward more than once, and verify routine/product, scroll, focus and session scope together. D10 and the navigation implementation contract require this recovery behavior.

### R4: notices cover direct dependencies but omit emitted MIT transitive code

Location: `apps/portal/scripts/build-rebuild.mjs:28-33`; notice inventory in `apps/portal/src/ui/THIRD_PARTY_NOTICES.md`.

The build copies only `THIRD_PARTY_NOTICES.md` and `clsx.LICENSE`. The direct dependency notices, including both font licenses, are retained. However, the output also contains dependency code with MIT copyright/permission notices absent from both those files and all emitted JS/linked `.LEGAL.txt` files.

Reproduction after the clean build:

1. Read `.local-artifacts/portal-rebuild/foundation/build-metadata.json`.
2. Select `outputs[*].inputs` with `bytesInOutput > 0`, rather than counting merely parsed/tree-shaken inputs.
3. Compare those packages' installed licenses against the two copied files and the generated JavaScript/`.LEGAL.txt` files.

Examples actually emitted: `@floating-ui/core` 23,113 bytes, `@floating-ui/dom` 20,001 bytes, `@floating-ui/react-dom` 8,111 bytes, `@floating-ui/utils` 8,883 bytes, `react-remove-scroll` 13,053 bytes, plus `aria-hidden`, `use-callback-ref`, `use-sidecar`, `react-style-singleton` and `get-nonce`. The complete Floating UI contributor and Anton Korzunov notices, including their copyright identities, are not in the distribution. Their installed MIT licenses explicitly require retention with copies/substantial portions. `legalComments:'linked'` retains source comments, not missing package-level license files.

Generate or maintain notices for the emitted dependency closure and inspect the resulting package. This is an attribution omission, not evidence that the selected library licenses are mutually incompatible. No legal conclusion about an existing public release is asserted: this new output is an isolated local harness.

## Foundation compliance and preserved boundaries

| Area | Inspected result |
| --- | --- |
| Shared React/control ownership | One exported Shelv layer; shadcn-derived/CVA patterns with Radix Select/Tabs/Dialog/Slot, native field/textarea controls, one overlay coordinator, Lucide mapping. No competing page control library. `components.json` is ownership/configuration, not proof that automatic CLI regeneration is safe. |
| Navigation/contact | Exactly four client links and one visible contact action at each tested width. Selected routine/product are URL-bound, aliases explicit, IDs/query keys allowlisted. Safe returns are audience-bound. No new auth entitlement inferred from a route or presentation mode. |
| Overlay behavior | Ordinary trigger focus, focus containment, guarded Escape, second-overlay rejection, labels/errors and keyboard controls pass. Controlled close and route/unmount guards remain consumer responsibilities. R2 is the missing-opener exception. |
| Transient/session state | New source stores unsent work in memory, not local/session storage or history. Existing cookie/session factories retain their own nonsensitive logout markers. Owner/generation/audience replacement and logout tests pass; caller must wire `onState`, clear mounted private views on invalidation and replace navigator scope/transport at session boundaries. |
| Transport/decoders | No new fetch URL/token path. The retained factory still enforces channel/action, CSRF, same-origin credentials, no-store and redirect rejection in the fresh test. `decode` is required and executes after lease checks. Actual W1 command/strict-decoder and safe actionable field/conflict detail composition is still a coordinator seam, not proven by the permissive test decoder. R1 affects genuine offline errors. |
| Package/root boundary | W0 changes no root package/lock/tsconfig, root backend, `site/`, session runtime, auth or vault source. Every old lockfile package entry is unchanged except the root portal package descriptor. Portal React versions satisfy the installed React DOM/Radix/Lucide peers; portal/session TypeScript both resolve 6.0.3. |
| Release safeguards | Retained source-closure parser still explicitly requires TypeScript 6.0.3. No release check was relaxed. All 63 focused release tests pass, including source closure, JWT, hash/approval and private-vault exposure refusals. |
| Harness isolation | Explicit preview sentinel/dynamic import, separate ignored output, no API composition. CSP has `connect-src 'none'`, `form-action 'none'`, local fonts. Browser interceptors deny unexpected network and block service workers. No baseline screenshot is used as a runtime UI asset. |

## Acquisition, content and rendered comparison

Validated all **99** acquisition record byte counts/SHA-256 values and all **49** recorded PNG dimensions against live retained files: no mismatch. The inventory includes all **26** approved frame PNG/context pairs, S01 recovery PNG/context, **11** primitive specimens, sidebar/topbar, variables, four assets and separately labeled runtime/render evidence. All W0 paths are byte-identical between the original final W0 tree and this integrated context.

All four asset SHA-1/SHA-256 hashes match `ASSETS.json`. In particular, CeraVe PM remains `ae5d3a6ba7a77e5849f9b1750ce6dc183a010539` and azelaic remains `f9b2e001ce48b89618aa2602b2a5794cf1539b3d`, matching the approved specification. Context preserves the source identities/copy and uses explicit temporary-URL removal markers. Targeted text inspection found no temporary asset URLs, private-key blocks or token-shaped credentials in the retained design contexts, and no runtime dependency on temporary Figma URLs. This is a scoped inspection, not a repository-wide secret audit or independent re-acquisition from Figma.

One nonblocking evidence correction: W0 report line 27 calls `design/page-498-32.metadata.xml` complete page metadata. Its actual 57 bytes are only `Currently selected nodes:` followed by D01's identity, not an XML page tree. Its hash is correct, and the 26 individual contexts/screenshots remain retained; do not cite this file as full structural metadata. No Figma file version is available in the retained receipt.

Fresh rendered images were visually inspected alongside native C01/C03, plus the narrow/mobile images. Geometry assertions independently passed at 1440x960: sidebar `(0,0,224,960)`, topbar `(224,0,1216,80)`, title origin `(264,104)`, nav rows at y=102/162/222/282 with 48px height, contact y=740 and identity y=910. Shared button/input heights are 48px. Actual sheet bounds are `(904,72,536,888)`, matching C03's shell; local Inter/Instrument Serif, cream/forest roles and Lucide outlines are present. Product PNG identities are retained inputs, not yet rendered product content in this harness.

At 1280, 390 and 320 CSS px, fresh tests report no horizontal overflow and one visible contact action. Mobile menu Escape, sheet fit/dismissal and reduced-motion spinner behavior pass. Visual inspection confirms readable single-column controls at 320/390 and usable actions. These checks compare shell/control geometry and reflow only. They do not compare final page density/cautions/product binding, establish bit-identical pixels or replace zoom/long-content/screen-reader/human comprehension review.

Fresh screenshots/geometry are in this worktree's ignored `.local-artifacts/portal-rebuild/w0/browser/`; committed author captures remain under `docs/portal-rebuild/design/rendered/`. They are not newly committed review artifacts.

## Executed checks and limitations

All commands below ran locally against integrated HEAD with the explicit Node 22 PATH. No production source was modified.

| Check | Actual result |
| --- | --- |
| `npm ci --ignore-scripts` in `apps/portal` | Pass; 130 packages added, 132 audited. Three npm audit advisories reported: two moderate, one high. No audit fix or hosted application call. |
| `npm run test:rebuild` | **18/18 pass**, zero failures/skips, including the four intercepted rendered groups. Its setup builds the isolated harness successfully. |
| `npm run typecheck:rebuild` | Pass, zero errors. |
| `npm run typecheck:session` | Pass, zero errors. |
| `node --test tests/production-release.test.mjs` | **63/63 pass**, zero failures/skips. |
| `npm run check:ui` | Pass for the retained 11 stylesheets; rebuild setup separately applies the same guard to new CSS. |
| `npm run build` | Pass; 132 assets, existing three gateway route families. Same three missing `expo/tsconfig.base` warnings from the absent root Expo install. |
| Retained build digests | ZIP `307472c8b6836ae5858d625cd6b0e36748cf8f8b32054967af38b862b2062875`; vault `12ccdf38776e434a5e53233cf3806d755e8cf50a1cd028e8989fe5dd73b99126`. Both match W0's receipt. |
| Targeted actual-factory probes | Both client/advisor 503 probes reproduce R1; synthetic fetchers only. |
| Targeted intercepted browser probes | No-opener and initially-open sheet reproduce R2; valid semantic-route Back/Forward scroll probe reproduces R3. Completed probes report zero unexpected requests/page errors. |
| Acquisition/assets/output notices | Hash/dimension checks pass; emitted MIT notice comparison reproduces R4. |
| `npm ls --depth=0` in portal | Exit 0; requested direct versions/peers present. Two optional packages reported extraneous. |
| `git diff --check` | Pass before report; report-only diff is checked before committing. |

T3 preview was considered first: status reported no tab; an initial `about:blank` argument was rejected as an invalid preview URL, then corrected `preview_open` succeeded. That blank owned tab was closed without browsing. Used the expressly allowed repository Playwright workflow because it supplies the required deny-by-default interception. Chrome stacks were sequential, never concurrent, and closed normally. No Docker/Colima/Auth stack, credentials, hosted session, email, client message, purchase or money operation was used.

Two exploratory check mistakes are excluded from product findings: the first scroll probe used unsupported `/nav/start` and timed out waiting for that route after Back; it was rerun with valid `/plan?routine=evening`. An accidental root `npm ls` exited 1 for the intentionally uninstalled Expo dependencies; rerunning in `apps/portal` exited 0. Neither changed tracked files or prompted a root install.

Did not rerun the unrelated 344-case retained baseline, full 362-case portal suite, 148-case session suite, real Auth 15-case journey, root Expo suites/exports, SQL/RLS/Storage/outbox/email, physical device, final pages/tour, hosted acceptance or exact-head CI. The author's 362-case receipt and parent's baseline/Auth evidence remain separately attributed; they are not fresh independent W0 acceptance. Did not independently reproduce all prior red/green transitions, compare advisory identities, or certify zoom, assistive technology, complete accessibility or human usability.

Coordinator follow-up remains bounded: fix/review R1-R4; compose semantic routes with retained sign-in/callback/server fallback; connect strict W1 contracts and session invalidation; then test actual pages and real isolated authority/persistence. The generic safe-return parser does not modify the old gateway's auth-return allowlist, and presentation/demo helpers alone do not establish a completed authorized application.

Only this report is authorized for the review commit. No push, PR, merge or deployment.
