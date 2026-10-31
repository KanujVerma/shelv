# W2 advisor R3 bounded follow-up

31 October 2026 UTC. Implementation response to [W7 advisor round 3](W7_ADVISOR_R3.md), preserving [the original review](W7_ADVISOR_REVIEW.md), [first fixes](W2_FIXES.md) and [original delivery](W2_VERTICAL_ADVISOR.md). **Both bounded corrections pass the stated controller and intercepted-browser checks. Fresh independent review remains required.** This is not full portal, connected or release acceptance.

## identity and ownership

- Workspace `/Users/kanuj/.t3/worktrees/shelv/t3-307f6cc3`, branch `t3/advisor-followup-r3-fixes`, clean starting base `284c04e94060543106e3a686d4aa7cd61c7bebfb`. The integrated R3 report is `58b77b0`.
- Both fresh `orchestrator_capabilities({search:'gpt-6.1-sol'})` and `t3_thread_configuration({})` returned provider `codex`, model `gpt-6.1-sol`, `reasoningEffort=xhigh`, `serviceTier=default`, full-access/default modes. Thread readback confirms the workspace/branch and parent `d632030a-18f7-4dec-a2c9-f5c0418c3fd5`. No fallback or nested agent.
- Early controller seam: `f53d9ac`. The final delivery commit containing this report is returned in the handoff; the complete tested source bytes are inventoried below.
- Task `portal-rebuild-w2-followup-fixes-20261030-r1`. All Node/npm commands explicitly prepend `/Users/kanuj/.nvm/versions/node/v22.23.0/bin` to PATH. Existing-lockfile `npm ci --ignore-scripts --no-audit --no-fund` installed 130 packages. Ephemeral pinned `prettier@3.6.2` formats only owned files; no package/config changes.
- Local `origin/main=d39a7d4943209080df7c4cf97d85784f462758bf`, initial `HEAD...origin/main=72 0`. No new fetch/remote freshness claim. No other worktree changes.
- Read full original/R3 reviews, fix and original-delivery reports, the complete retained source-phase R2 draft at `/Users/kanuj/.t3/worktrees/shelv/t3-695ed988/docs/portal-rebuild/research/W7_ADVISOR_R2.md`, root/portal AGENTS, approved decisions/desktop spec, contracts and ownership/status. Applied Resume, receiving review, systematic debugging, TDD, repository UX/design, React and verification guidance. No new product/design/permission rule.

Only advisor feature paths, corresponding advisor tests and this report are owned. Shared app/main/UI/navigation/session/callback/contracts, SQL, packages, status and `CONTEXT_SYNC.md` remain parent/W0-owned. Existing named exports, callback signatures and preview opener IDs are preserved. No DB/Docker/Auth/credentials/hosted/parent fixture access.

## R3-1 response

Verified root cause: validation, preview, comparison, directory and client-directory catches could call generic `fail` against a newer state. Success paths also lacked consistent purpose/view/manual/operation applicability. F1/F2's existing context/execution/recovery generations remain intact.

An internal read lease captures session epoch, purpose generation, exact view/target, local-content object, pending-command object, operation generation and supplied capabilities. All related success/error paths check applicability; obsolete results are rejected before strict response decoding. Current directory/client read failures preserve a write's busy state. Draft open owns only its own busy cleanup. Existing 401 invalidation and real 409 comparison behavior remain for applicable failures. Context/status retain their existing generations and add the common applicability fence. No public export or command shape changed.

| Priority / advisor goal | Before | Correction / regression |
| --- | --- | --- |
| P2: continue saving B/C after a delayed read | Old 503 released B busy/replaced notice; old 409 after B acknowledgement blocked C | Five read families tested with success/malformed/401/403/409/503 before/after B acknowledgement, exact lost-ack retries, both purpose completion orders and draft/manual/role/session/review changes |
| P2: trust current failures | Ignoring every error would hide real session/conflict failures | Current 401 clears private state; 403/409/503 remain visible; current directory/client failures during B preserve its entire command and busy state |

All tested write attempts retain full serialized command bytes and manual content. Only a valid acknowledgement clears pending and marks saved. The original F2 harness's final expectation of pending B after a valid awaited B retry remains wrong; this implementation does not satisfy it.

## source/pure red before green

Evidence directory: `/Users/kanuj/.t3/worktrees/shelv/t3-307f6cc3/.local-artifacts/portal-rebuild/w2-followup/`. Mandatory R3 scripts were read/copied byte for byte before adaptation; original worktrees are read-only.

| Command / scope | Result |
| --- | --- |
| Root `node --experimental-strip-types --test --test-concurrency=1 .local-artifacts/portal-rebuild/w2-followup/independent.mjs`, before production changes | **62 pass / 5 fail / 0 skip**, exactly the four old503 plus old validation409 intended failures |
| Root same serial command on `apps/portal/tests/rebuild-advisor-followup.test.mjs`, before production changes | **57 pass / 107 fail / 0 skip / 0 cancelled**, 164 original matrix cases; actual state assertions fail for obsolete reads |
| Exact base controller bundled with esbuild from `git show 284c04e:apps/portal/src/features/advisor/controller.ts`; full final 170-case matrix imports only that ignored bundle | **57 pass / 113 fail / 0 skip / 0 cancelled**. Confirms six supplementary current-failure/busy cases against base, without rewriting current production files |
| Root serial command on retained controller/races plus new follow-up pure file | **217 pass / 0 fail / 0 skip**, 47 retained plus170 new cases |
| Root copied R3 `independent.mjs` after correction | **67 pass / 0 fail / 0 skip**; original F1/F2 and all five R3 read assertions |
| Portal `npm run typecheck:rebuild` | Exit0, original strict/noUncheckedIndexedAccess flags |
| Portal `npm run build:rebuild` | Exit0, semantic guard and isolated foundation build. Actual advisor is separately bundled by the prepared browser harness; this build does not accept final app composition |

Node emits the existing root typeless-package warning. An initial new open/create test was cancelled because create is correctly refused while open is busy; replaced that unreachable sequence with real overlapping draft opens before accepting the zero-cancellation red result. No passing result is claimed for that setup attempt.

## R3-2 response and task-first verification

After the parent's explicit sole serial Chrome grant following W7 client R4 release, called `preview_status` first. Opened one owned blank preview, then closed it before the specifically authorized repository browser harness. No browser/DOM was inspected before that grant.

Before changing fields, ran the six durable keyboard intended-behavior cases: **0 pass / 6 fail / 0 skip**. Every real 511-character first reason was disabled/unfocusable, stayed at scrollTop 0 and failed last-line reading at 1440/390/320 in both modes, reproducing R3's 114px client heights and 206/321/390px scroll heights.

`TextField` now composes the same shared Input/Textarea as a native read-only, focusable field when mutation is unavailable. Its change handler also refuses edits in that mode. Selects, checkbox/schedule/add/remove mutations and the controller's authority checks are unchanged. No new source read, permission, CSS/token system, copy, truncation or transformed source content was introduced.

| Step / immediate advisor goal | Existing action and resulting state | Verified feedback / recovery |
| --- | --- | --- |
| Select a free editor section | Existing checklist opens client context, decisions, routine or sources | Same plan, exact content and proper metadata retained |
| Read supporting details | Tab/Shift+Tab/Enter opens each authorized disclosure | Disclosure remains in keyboard order; mutation actions stay unavailable |
| Read the last retained line | Native focusable read-only text field; keyboard Meta+ArrowDown/PageDown scrolls its viewport | Last-line geometry and screenshots verified; no programmatic scrollTop or value replacement |
| Continue or leave | Existing section and Back controls | R3-1 Back/B acknowledgement/C autosave saves revision3 without false comparison |

The full-text cases retain the actual 511-character source-derived reason and 823-character azelaic directions. Explicitly synthetic product/routine/source strings have 20 retained lines and distinct final-line sentinels. At each of1440/390/320, both view-only and published modes reach each last line through actual keyboard actions. Tests compare the complete values, attempt real DOM typing/Backspace, invoke edit/save/assign/review/approve/publish/payment on the real controller, require zero writes and identical full local content, assert disabled real mutation buttons/selects and preserve the supplied source ID/version/page locator. No server source-ACL acceptance is inferred from the authorized fixture projection.

All 60 existing cases remain; two existing F3 cases now recognize native read-only text as immutable while still requiring disabled non-text mutations. The new browser cases supply actual typing/unchanged-value assertions, rather than treating focusability as edit authority. No test was removed or skipped.

A first green attempt sampled scrollTop before Chrome's keyboard scroll animation painted. An isolated real-key diagnostic plus its screenshot showed Meta+ArrowDown reaching the bottom while readonly selection/caret stayed at0. The final harness waits for the observable bottom condition and does not demand an editable caret. Another extended harness check initially included the read-only validation button in its mutation query and shared a synthetic guide-step object between two fixture modules. Its scope was corrected to actual mutation fields and each synthetic guide independently cloned before accepting the final green run. These setup/timing failures remain in the logs; they are not production passes or additional product defects.

Inspected fresh 320px azelaic/source and 390px product screenshots: complete final caution/sentinel lines are visible. This is bounded full-text rendering evidence, not an entire-frame Figma match, screen-reader or human-comprehension sign-off. Shared wrappers, semantic styles, labels and all three parent preview IDs are unchanged.

## final executed verification

All commands select the explicit Node22 PATH above. Browser files run serially with `--test-concurrency=1`; Chrome 156.0.8078.79. Counts overlap across reruns and are not additive acceptance totals.

| Command / scope | Actual result |
| --- | --- |
| Root `node --test --test-concurrency=1 --test-name-pattern='R3-2' apps/portal/tests/rebuild-advisor-followup-browser.test.mjs` before field changes | **0 pass / 6 fail / 0 skip**, expected complete-text keyboard failures |
| Root `node --experimental-strip-types --test --test-concurrency=1 apps/portal/tests/rebuild-advisor-controller.test.mjs apps/portal/tests/rebuild-advisor-races.test.mjs apps/portal/tests/rebuild-advisor-browser.test.mjs apps/portal/tests/rebuild-advisor-followup.test.mjs apps/portal/tests/rebuild-advisor-followup-browser.test.mjs` | **241 pass / 0 fail / 0 skip / 0 cancelled**: retained 60, new 170 pure and 11 browser. All four actual stale503 controls and actual Back/B-ack/C autosave pass; exact command bytes/manual content remain unchanged |
| Root `node --test --test-concurrency=1 .local-artifacts/portal-rebuild/w2-followup/browser-current.mjs` | **15 pass / 0 fail / 0 skip**, R3 browser probes with current immutable-text semantics and completed-read timing adapter |
| Same serial command on `supplemental-current.mjs` | **11 pass / 0 fail / 0 skip**, five R3-1 UI assertions plus six actual last-line probes |
| Same serial command on unchanged `browser-positives.mjs` | **6 pass / 0 fail / 0 skip**, reverse restrictive F1 gates and actual A03 import/apply/source/private preview positive |
| Portal `npm run typecheck:rebuild`, `npm run build:rebuild` | Both exit0; strict/noUncheckedIndexedAccess unchanged, semantic color guard passed. Foundation build is not the final app; browser bundles actual advisor components |
| Portal `npm run build` | Exit0, 136 assets; retained client/advisor/walkthrough gateway routes. ZIP SHA-256 `04b03a3711f858d48cce10d6a89ce1219f10b3fdfd3d5f4565678b9ba86d8a2f`, vault `a4cad1c429cee06b257b66c4b42e902467928b3669d5ccdccf8483f4f8b3c9ed`. Three existing missing `expo/tsconfig.base` warnings; no deployment change |
| Portal `npm run check:ui` | Exit0, 11 retained stylesheets. No CSS changed |
| Final diff, report links/scope, source preservation and `git diff --check` | Checked before commit; only the six owned paths listed below. No source change after final focused run |

Mandatory reviewer scripts remain byte-identical copies in ignored evidence. Executable `*-current.mjs` copies preserve their intended assertions while replacing waits for obsolete bug notices with completed-read observation, treating readOnly text as immutable and waiting for native keyboard scroll completion. The old supplemental C test's post-autosave disabled-button assertion is replaced with stronger saved/revision3/two-save assertions: a clean saved C correctly disables save again. The original F2 final pending-after-valid-ack assertion is still not satisfied or used. Original sources and their hashes are unchanged.

Every browser context blocks service workers and denies unexpected traffic. Only finite in-memory bundled assets at `.invalid` origins are served. Real feature/controller/mappers run against the checked-in in-memory reducer; transport faults only delay genuine fixture responses or return safe status/malformed acknowledgements. All passing contexts have zero unexpected traffic, page or console errors. No real API request or raw-source retrieval occurs.

## immutable source and artifact identity

| Original R3 reproduction | Preserved SHA-256 |
| --- | --- |
| `independent.mjs` | `009a7fdbc936384dd76e98ebe4681e1ff7f4e3b2371162cc48adbab87d51604b` |
| `browser.mjs` | `ba281a80e114435451e2cda0b7204f7a586728a3a11d166054c527803ed3ca6e` |
| `supplemental.mjs` | `d4358695399ef3ec22acaca069de59ac813e64c08da6aad3d10e6c33d9314984` |
| `browser-positives.mjs` | `c74398322c83f94f782b49affab2b9ebfc12cc74f38844492b70006a9a07d77c` |

| Tested source/data | SHA-256 |
| --- | --- |
| Final `controller.ts` | `d300fb29b4298051f7e6bef85fb3b533ce7978c13807fbc733b8164ce2cb2d79` |
| Final `fields.tsx` | `34f25b4157b03f42aa3861cead16c1f52d5abec5605fa664b0734b8745118b73` |
| Unchanged `AdvisorWorkspace.tsx` with three parent preview IDs | `70928067e5c70af56347a7021fae25474b6d7bf2bdebb93124efabf4e1032e85` |
| Unchanged `advisor-fixture.mjs` | `63475f1a03e7ddd8f8d75f13421086b34ed6b88be170a79f16a40d26b77a6954` |
| Unchanged `maya-sample.js` | `0958bc22bd2b94fa88e2a19f5aaca4527de3c2f43c48a6b2866f86f33d507aab` |

Evidence includes original/copied/adapted scripts, red and green logs, historical input-only bundle, keyboard diagnostic, screenshot final lines and `release.json`. `evidence-manifest.json` inventories their byte counts/SHA-256 and the tested source files; it is ignored local evidence, not a published artifact. Source-derived products/decisions/routines and metadata are never shortened to satisfy the tests.

The six owned paths across the delivery range are:

```text
apps/portal/src/features/advisor/controller.ts
apps/portal/src/features/advisor/fields.tsx
apps/portal/tests/rebuild-advisor-browser.test.mjs
apps/portal/tests/rebuild-advisor-followup.test.mjs
apps/portal/tests/rebuild-advisor-followup-browser.test.mjs
docs/portal-rebuild/research/W2_FOLLOWUP_FIXES.md
```

## resource release and remaining acceptance

All contexts/browsers/test sessions closed. Fresh `preview_status` has no tab; process inventory has no Chrome/Chromium process. `release.json` records explicit release at `2026-10-31T02:20:38.091864+00:00`; the parent received an explicit allocation-release message before final types/builds/report work. No browser handles are retained or returned. W0 may use the next allocation; no further Chrome inspection or launch is performed here.

Not run/accepted: connected cookie/Auth/Edge/PostgREST journey, DB reset/pgTAP/RLS, full portal/session/root suites, root app/test types, Expo web/native, actual app/callback composition, raw-source ACL/lifecycle, notification delivery, hosted deployment, exact-head CI, exhaustive accessibility/zoom/reduced-motion/screen-reader or human comprehension. No push/PR/merge/deployment, real client/source/permission change, external communication, money or order action. Parent/W0 composition and callback work remain separate. A fresh independent review must verify both R3 corrections before accepting the advisor slice; no full-portal claim.
