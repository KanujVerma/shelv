# W0 first React application composition

30 October 2026. Implementation sub-agent, no nested agents. This is the first application slice using the actual retained cookie adapters, finite root contracts, W2 controller/workspace and W3 renderer. It is not full portal acceptance, genuine Auth/backend acceptance, release packaging or deployment. The parent owns integration and independent review.

## Identity and scope

- Workspace: `/Users/kanuj/.t3/worktrees/shelv/t3-078d2d0a`; branch `t3/compose-portal-react-app`.
- Clean requested base: `5fe41666747fe918eccee46c68f29d1968495562`. Fresh `git fetch origin` succeeded; `origin/main` remained `d39a7d4943209080df7c4cf97d85784f462758bf`, initially `HEAD...origin/main=57 0`.
- Both live capabilities and thread configuration were checked before implementation and again at delivery: `codex / gpt-6.1-sol / reasoningEffort=xhigh / serviceTier=default`, full-access/default modes. Task/thread suffix: `portal-rebuild-w0-app-composition-20261030-r1`. Complete final live returns are retained in the ignored `w0-app/runtime.json` artifact.
- All Node/npm commands used `/Users/kanuj/.nvm/versions/node/v22.23.0/bin` first in PATH; actual Node `v22.23.0`. Existing cached Prettier 3.6.2 formatted only owned new files. Portal `npm ci --ignore-scripts --no-audit --no-fund` installed the existing lockfile, 130 packages; no dependency/package/lockfile change.
- Applied Resume, executing-plans, TDD, repository task-first UX/design guidance, retained Figma baseline guidance, React and verification workflows. The existing T3 worktree provided isolation. No design choice was reopened. No nested agent, push, PR, merge, hosted access, real client action, message, funds or order occurred.

| Commit | Purpose and integration instruction |
| --- | --- |
| `45ae22b2b19dbb4f9adda9a471d78e1624c4ef79` | Only the explicitly authorized parent `381ba705beb8bbe7f07bd802cdb4b88c5885990f` history-index type fix. Parent already owns it. |
| `2938df18a93a17d11d5ebf2988d60c60539c75e4` | Early typed session/ports/source-basis seam, immediately reported. Parent integrated it as `9b2bbaa`; do not duplicate. |
| `9167e8e404868c460bc837b35499b9ae0b1b91a1` | Only parent `db27dead087f74f650738b98e4206a25bded57a1`, the three preview control IDs. Parent already owns it. |
| `ee78d27aabe70b0d1e513411e053d7089cacc51f` | Application composition and bounded seam hardening. |
| `7da30556cec4dac3b299c7580d3e551e4612fb76` | Separate candidate builder/template. |
| `07dafecba371d97de1fdf7d21daa7ef7787183ae` | Separate application tests. This is the verified implementation head. |

The report-containing commit is documentation only; its exact head is returned in the final handoff. New authored paths are exclusively `src/app/**`, minimal `src/main.tsx`, `scripts/build-portal-app.mjs`, allocated `rebuild-app*`/`rebuild/app-*` tests, and this report. The two parent cherry-picks are the only exceptions. The parent W2 F1-F3 fix `56bdb4d` was not silently imported; the parent must rerun the slice after composing its current feature head. No shared UI/routes/history/transport/auth/gateway/root-contract/migration/status/context file was authored here.

## Actual runtime wiring

- `main.tsx` preserves `mountPortal` and the foundation-gallery sentinel/export and adds only the application sentinel. `app/start.tsx` calls the retained synchronous `consumeCallback` before route, navigation, session or React creation. The shared parser selects client/advisor before creating the matching actual cookie adapter. Unsupported callbacks are scrubbed and rejected; PKCE uses actual `complete(code)`, once outside StrictMode. Only a short-lived closure holds the code. An immediate catch prevents a rejected startup promise escaping before React's passive recovery effect attaches.
- Public `/maya` and unknown/malformed routes create no live session and send no auth request. Maya explicitly says this candidate does not include the five-stage tour. The retained public site/demo is preserved separately.
- `app/retained.ts` is a local structural facade over the actual exports from `site/auth/advisor-cookie-session.js` and `client-cookie-session.js`. It does not implement auth. Existing same-origin cookies, CSRF, no-store, redirect rejection, private vault, coordinated sign-in, pending-logout flags, audience and server authorization remain authoritative. No browser Supabase client, provider credential storage, arbitrary fetch/RPC host or auth token in history was added. The retained localStorage uses remain logout-intent flags, not new credential storage.
- `createApplicationSession` wires the actual adapter's synchronous `onState` to `transport.sessionChanged` before publishing any React snapshot. Each `PlanSessionBoundary` captures actual owner, audience, role, local epoch, generation, CSRF-bound lease and deadlines. Its public key is a random opaque identifier, never a credential. Same-owner login replaces the key; invalidation clears private state/intent before React can apply late results. Client and advisor expiry use the actual retained ending path. Offline 503 with an unexpired original lease preserves uncertain work; expired offline leases end and invalidate. No offline successful response is decoded.
- `createClientPorts` supplies only owner-derived `read_client_plan_v1` and `record_decision_v1`. Each command has a strict root parser, a per-request decoder closure through unchanged `createSessionTransport`, the actual cookie factory and the fixed plans channel. Response mapping occurs after its session fence. Ports also pin their creation boundary, so a stale port cannot start a new command after relogin.
- `createAdvisorPorts` supplies only the actual W2 finite commands, strict `advisor_list`, v2 payment read and existing v1/v2 manual confirmation. Payment commands use the matching root call builder/receipt mapper. The view-only gate selects exactly `{clientId,approval,publication,coverage}` for W2, using an explicit human publisher bound to the actual cookie actor. Assigned permissions come from the target-bound gate. Unassigned human bootstrap uses only the actual cookie tuple: edit may supply assign/review; approval stays false. Publication still needs the actual context/approval/payment gates. No name-based or remembered-receipt authority exists.
- The advisor publication read uses the canonical envelope and explicit client/version. A small audit view displays its real version/time/care-access state. An ended client window remains `ended`; it is never converted to a fabricated entitled/read-only `ClientPlanView`. Full history/restore remains unavailable.
- Selection-start ordering prevents late draft response A from changing selected target or permissions after B starts. Gate reads have their own generation and exact target/actor binding. A failed/uncertain save retains the existing manual-edit permission instead of disabling recoverable edits. Every backend command still requires current server authorization. Task agents use the actual authenticated backend/grant API; this human-cookie UI is not an agent capability.

## Client, advisor and preview composition

The client mounts real initial read/loading/preparation/denied/read-only handling and `ClientPlan` with its actual decision/read ports and authoritative refresh callback. Routine/product/evidence share the canonical navigator. Use/self-purchase/export/report callbacks are omitted because their persisted ports are unfinished. Other top-level routes show explicit unavailable/recovery state without success placeholders or fake business events. Contact opens an honest unavailable-contact recovery, not a fabricated SMS destination.

The advisor uses the real directory, drafts, incomplete saves, structured import, assignment, section review, exact approval, manual first receipt and deliberate publication through W2's controller/workspace. It preserves server-projected content/source access and separates view from mutation. Existing current feature limitations are not declared fixed by this composition.

`onPreview(preview, DraftView)` stores only strictly parsed client-safe preview plus explicit source `{draftId,contentRevision,assignmentRevision,target}` and session key. It uses the actual nested `draft` fields, never fake publication/version/time/use/entitlement/revision data. Refresh/direct entry reads the actual draft, requests its captured preview and rereads the same draft basis; mismatch/staleness rejects, including unassigned/null targets.

The enclosing preview cursor delegates browser markers to the same canonical navigator and keeps internal product/evidence routes only in session memory, indexed by opaque navigation-entry IDs. The visible URL stays `/advisor/plans/:draft/preview`; no draft/private preview content enters browser history. Back/Forward, repeated preview entry, direct refresh and exit to the exact original editor section are exercised. `backDestination` is supplied read-only. The parent's three stable preview IDs enable actual opener focus restoration; the sidebar opener's exact focus was tested after the full product/evidence round trip.

The shared shell classes/tokens, shared controls and Lucide remain in use. The advisor menu adds Escape/outside dismissal with focus restoration. No alternate color/control library, questionnaire, new page-specific visual system, analytics, replay or executable plan content was added.

## Meaningful red/green evidence

| Boundary | Observed red and resulting green |
| --- | --- |
| Missing composition | Initial session/bootstrap and strict operation/source-basis tests failed before their implementation, then passed using actual cookie adapters/factories. |
| Reverse draft reads | Direct actual ports without a caller abort reproduced late A changing B's edit permission/selected target. The actual W2 controller plus the same ports already passed because its abort reached the retained transport fence. Selection-start ordering fixes the lower-level port case; both tests pass. The report does not mislabel the controller's protected case as a reproduced defect. |
| Uncertain manual work | Resetting permissions when a request started disabled later manual edits after a real-factory 503. The regression failed, then passed when only successful applicable selection changes permissions. Exact pending command identity remains intact. |
| Old-login ports | A port retained across same-owner relogin incorrectly initiated a fresh operation. The red test observed no rejection. Creation-boundary guards now reject before network, while a new port works. |
| Expired offline lease | Private work cleared but cookie status stayed offline. The regression failed; actual retained `_end` now supplies synchronous transport invalidation and signed-out recovery at the known deadline. Unexpired 503 is still preserved. |
| Preview navigation | Actual browser Back initially exited the preview instead of returning to its internal product. The canonical-marker cursor fixed it. A separate re-entry test reproduced stale cursor depth preventing exit; fresh outer entries now reset the cursor basis. |
| Exact opener focus | Actual full preview round trip returned to `/routine` but failed the exact sidebar opener-ID assertion before the parent seam. The identical test passed after only `db27dea` was cherry-picked. `preview-focus-red.log` and `preview-focus-green.log` preserve both runs. |
| Recovery/keyboard | Invalid callback startup initially emitted an unhandled rejection before React attached; immediate promise handling fixed it. Advisor mobile-menu Escape initially left navigation visible; the test failed then passed with the shared lifecycle behavior. |

Early harness errors were corrected without feature changes: two locators used the wrong product spelling/payment-button label; the assignment confirmation locator also differed from actual source; an initial W2 reverse-read test lacked a valid payment-read response. These are test-authoring errors, not reported product findings. Formatting once moved a JavaScript import suppression away from its module diagnostic; namespace imports restored normal strict checking without compiler-flag changes.

## Verification

All commands used Node 22.23.0. Fresh structured command/exit receipts are in ignored `.local-artifacts/portal-rebuild/w0-app/validation.json`, bound to implementation `07dafec`.

| Command / scope | Actual result |
| --- | --- |
| Focused source/SSR/build group: five `tests/rebuild-app-{ports,session,state,render,build}.test.mjs`, existing foundation transport/navigation/notices, existing advisor controller, `node --experimental-strip-types --test --test-concurrency=1` | **79/79 pass**, 0 fail/skip. The application subset is 26; these counts overlap and must not be added to old author totals. |
| Actual app `tests/rebuild-app-browser.test.mjs`, same Node flags/concurrency | **9/9 pass**, 0 fail/skip, 11.67s. One serial installed headless Chrome; strict finite intercepted origin/static assets/API, denied unexpected requests, blocked service workers/background networking. All contexts/processes close in teardown. |
| `npm run typecheck:rebuild`, portal | Exit 0, normal strict/noUncheckedIndexedAccess/noEmit configuration, no relaxed flags. |
| `npm run typecheck:session`, portal | Exit 0, unchanged retained runtime flags. |
| `npm run check:ui`, portal | Exit 0, 11 retained stylesheets. New source styles are also guarded by the application builder. |
| `node scripts/build-portal-app.mjs`, portal | Exit 0. Real app entry, local fonts, 17 public/approved assets, 2,196 hashed input files and original legal files/inventory for all 47 packages with bytes in emitted output. |
| Root `npm test` | Exit 1: missing root `zustand` dependency from `authStore.ts`. No root-suite success. |
| Root pinned portal compiler `node apps/portal/node_modules/typescript/bin/tsc --noEmit` | Exit 2: root Expo/native dependencies/base config absent. No root type success. |
| Root `npm run typecheck:tests` with the existing pinned portal compiler in PATH | Exit 2: missing Node/react-native types and `expo/tsconfig.base`. Flags unchanged. |
| Root `EXPO_NO_TELEMETRY=1 npm_config_offline=true npx --no-install expo export -p web` | Exit 1: Expo absent; npx refuses to download it. No export success or root dependency change. |
| Final diff/whitespace/scope/secret-pattern inspection | Pass; `git diff --check` and staged equivalents passed. |

Nine browser groups cover: public/unknown no-auth and synchronous PKCE scrub; real client read/decision/reread and product/evidence/routine return; exact draft preview/internal native Back/Forward/re-entry/real opener focus; approval/payment/deliberate publication separation; direct preview reload and 320/390 preparation/denial/menu recovery; unassigned create/edit/import/review/assignment; canonical ended-access audit; logout with a delayed private read and malicious callback; signed-out advisor link request with the exact same-origin destination and remembered preference. API effects are synthetic fetch-boundary responses, not database transactions or real email/receipt proof.

Actual local screenshots were inspected, including the client recommendation at 1440, source-length advisor editor and 390 preview; the retained C02 native baseline was inspected alongside the actual client render. Shared shell/panel geometry is reused. Actual source content, post-choice status and unavailable unfinished actions differ from staged native content. No pixel-perfect/full-screen/whole-portal, complete accessibility, clinical or representative-human acceptance is claimed. The parent owns feature visual re-review and remaining screen inventory. The app browser journey asserts real opener focus and exact route, while nonzero scroll restoration has pure canonical navigator coverage here and remains an explicit integrated browser check.

## Candidate, provenance and resources

The builder writes only the candidate under ignored `.local-artifacts/portal-rebuild/application`. It packages no gateway and changes no release source/configuration. Its HTML has same-origin `connect-src`, self-hosted fonts/scripts/assets, no analytics/replay and no external Figma asset URLs. It copies original public product images, corrected shelf artwork and approved native asset bytes after hash checks; baseline screenshots are never runtime assets. It reuses `writeEmittedNotices` and fails if an emitted dependency has no original notice. Existing retained notice-provenance limitations remain; this is not legal clearance.

`application-provenance.json` records clean source head, all parsed input/template hashes and asset hashes; `build-metadata.json` and `licenses/emitted-packages.json` bind emitted inputs and original notices. The verified clean implementation build was `07dafec` with `sourceDirty:false`. Source product image identities/URLs remain canonical; no arbitrary remote image proxy or guessed product mapping was added. Same-origin deployment/image delivery still needs the parent's actual gateway/browser check; CSP-blocked or missing imagery uses W3's neutral fallback.

Evidence below is relative to ignored `.local-artifacts/portal-rebuild/w0-app/`:

| Artifact | SHA-256 |
| --- | --- |
| `app-browser-final.log` | `bad4cf94e61bcc3ace22a5e92852b31ab11295bb54cda8adc950062d9207a8b0` |
| `focused-source-final.log` | `0bebb2dc0649ce1087090c26eb8ec4e5cd51681813ddb07ea70498c9d9d61926` |
| `preview-focus-red.log` | `ad37576dacf61ecf6ddb7f4e8f926dec6574a15e263aac1e2f98312cfe19ce4a` |
| `preview-focus-green.log` | `48168c3e0c7ffdc50549d07004e1a33c4f87bf9e2cc3af6befa96b1ca742d750` |
| `validation.json` | `26ec93a53eb07242dc036fe3b27e4d128a497ab85d83467f966c7f8d482323ce` |
| `runtime.json` | `4fc411b3ced06dee97f916bf8f3d82854eca5caf68376d10022b92021a5f8bad` |
| `process-readback.json` | `eb785f4444da7c16482c6ac256a1e636d40b631b7fa406004e069e56224b12f6` |

The parent explicitly allocated Chrome after W2/W7 released it. `preview_status` was consulted first and returned unavailable/no tab; the explicitly authorized repository Chrome interception workflow was used. At handoff it again reports no tab; OS process readback has `automationChromePids:[]`. Chrome allocation was explicitly returned to the parent. No HTTP server, PostgreSQL/Docker/Auth fixture or hosted session was started. npm install handle 7105, source-check handle 7103, final validation handle 42198 and all browser launcher handles are terminal; no ongoing process handle is handed off.

## Parent continuation and limits

Request only this parent package script: `"build:application": "node scripts/build-portal-app.mjs"`. The direct Node command already works. No package/lockfile was edited here. Compose the three new implementation/build/test commits and this report atop the parent's current W2/W3 fixes; the equivalent history-index, early seam and preview-ID commits are already parent-owned.

The parent reports canonical 55-migration reset/33 pgTAP groups/746 assertions, backend R3 and genuine native Edge/Auth/PostgREST evidence. This worker did not access, reproduce or extend those fixtures/credentials. They are separate evidence, not converted into app-cookie-browser acceptance. The parent's W3 R3 retry/busy finding remains separately owned; this worker did not edit DecisionControls or claim to fix it.

Not performed: full portal suite without a separate grant, root dependency installation, native runtime/export, database reset/pgTAP/RLS/Storage, actual cookie/vault plus genuine Auth/Edge/backend browser journey, notification delivery, five-stage Maya/private walkthrough completion, remaining full pages, full asset delivery/cutover, independent app review, representative-human testing, exact-head CI, PR/push/merge/deployment. The parent owns canonical status/CONTEXT_SYNC, current feature integration, genuine connected verification and subsequent review. No full connected/full portal acceptance is claimed.
