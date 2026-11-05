# W0 foundation handoff

Owner: Kanuj. Role: W0. Date: 30 October 2026.

This is task 2 shared foundation for the connected rebuild. It implements no production client/advisor pages and establishes no final portal, hosted, database, payment, publication or email acceptance.

## workspace and runtime

- Workspace: `/Users/kanuj/.t3/worktrees/shelv/t3-128ab5a5`.
- Branch: `t3/portal-shared-foundation`.
- Starting commit: `9be041db5b7227637f0c3ba964d932c6bc6d0e06`.
- Design checkpoint: `4bac69e`.
- Navigation/transport checkpoint: `a1dcff3`.
- Shared UI implementation checkpoint: `0f89b37dba39c89071802ce9ad78345aa51392ab`. The subsequent handoff commit changes documentation/evidence only.
- No nested agents, pushes, PR creation, merges or deployments.

Both live T3 tools returned provider `codex`, model `gpt-6.1-sol`, `reasoningEffort=xhigh`, `serviceTier=default`, runtime `full-access` and interaction `default`. Exact complete structured returns are retained in [capabilities](../design/W0.orchestrator-capabilities.json) and [thread configuration](../design/W0.thread-configuration.json). The returned model selection was:

```json
{"instanceId":"codex","model":"gpt-6.1-sol","options":[{"id":"reasoningEffort","value":"xhigh"},{"id":"serviceTier","value":"default"}]}
```

All npm, Node, type and build commands used `PATH="/Users/kanuj/.nvm/versions/node/v22.23.0/bin:$PATH"`. Live executable verification returned `/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node v22.23.0`. No engine, system install or root package/lockfile changes were made.

## native design evidence

The approved file is `WGbMylNV4rPoMw3r0nceaw`, page `498:32`, session `fc266b30-cac3-4567-a1a7-9c3a689d0aad`. The coordinator's C01 context and PNG were reused, with asset URLs removed from the retained text. All other 25 screen contexts/PNGs, S01 recovery, 11 shared primitives, sidebar, topbar, a selected-node metadata response and C01 variables were acquired from native tools. Each context call requested its screenshot and used `skillNames=figma-design-to-code`; separate native screenshots were downloaded at full frame dimensions. None of these contexts was flagged sparse.

[Acquisition hashes](../design/ACQUISITION.json), [capture summary](../design/NATIVE_CAPTURE_SUMMARY.json), [selected-node response](../design/page-498-32.metadata.xml) and [token definitions](../design/C01.variables.json) identify the retained evidence. Despite its filename, the metadata response is only 57 bytes identifying selected D01, not an XML page tree or complete page metadata. The 26 individual frame acquisitions remain separate evidence. The native tools did not expose a file version, so no version number is invented. No original Figma writes occurred. No temporary asset URL is committed or used at runtime.

[Product assets](../design/ASSETS.json) preserve the actual native CeraVe PM and azelaic PNG bytes. Their SHA-1 identities exactly match the approved specification, respectively `ae5d3a6ba7a77e5849f9b1750ce6dc183a010539` and `f9b2e001ce48b89618aa2602b2a5794cf1539b3d`. These are future data-bound renderer inputs, not implemented product pages. Native screenshots are comparison baselines, never runtime UI assets.

## implementation choices

- One Shelv-owned source layer adapts the official shadcn Radix button, field, textarea, select, tab, badge, dialog and sheet patterns to ordinary CSS and native tokens. There is no Tailwind, Vite or second control library. `components.json` records component ownership/aliases; it is not a claim that an unreviewed CLI regeneration would preserve the CSS adaptation.
- Inter 400/500/600 and Instrument Serif 400 are bundled locally. Native desktop values include 224px sidebar, 80px topbar, 40px content inset, 48px actions/fields, 44px tab targets, 8/12px radii, and a 536px contextual sheet beginning at y=72 with 28px inset. The sheet uses the native Back row, with product-specific identity/body left to the renderer owner.
- Interface icons come from `lucide-react`, with shared 18/20/24px outline sizing and 2px stroke. Actions keep visible labels. Source/asset identities and proper names are preserved; no global lowercase transformation is used.
- The existing release builder, site, gateway, auth, vault and backend remain unchanged. `build:rebuild` writes an explicitly isolated component preview under ignored `.local-artifacts/portal-rebuild/foundation`. Its CSP prohibits connections and form submission. It does not start an authenticated or pretend production dashboard.
- TypeScript is pinned to 6.0.3, matching the existing release source-closure parser. An initial 7.0.2 addition caused 24 existing release-tooling test failures; the source's explicit parser pin identified the cause. Correcting only the owned dependency/lockfile restored the 63/63 release-tooling tests. No release safeguard was changed.
- No backend operation names are guessed. Typed ports wrap the retained cookie factories and use caller-supplied W1 response decoders. Server command/schema work remains with W1/coordinator.

Direct dependencies are pinned: React/React DOM 19.3.1, radix-ui 1.8.1, lucide-react 1.65.0, class-variance-authority 0.7.1, clsx 2.1.1, both font packages 5.3.0. React type packages are 19.3.0. Existing esbuild/Playwright versions are retained. Required notices live in `src/ui/THIRD_PARTY_NOTICES.md`, `src/ui/clsx.LICENSE`, and the isolated build's `licenses/`.

Official primary references read: [shadcn button](https://ui.shadcn.com/docs/components/radix/button), [dialog](https://ui.shadcn.com/docs/components/radix/dialog), [tabs](https://ui.shadcn.com/docs/components/radix/tabs), [upstream Radix source](https://github.com/shadcn-ui/ui/tree/main/apps/v4/registry/new-york-v4/ui), [Lucide React](https://lucide.dev/guide/react), [React createRoot](https://react.dev/reference/react-dom/client/createRoot).

## consumer exports

All paths below are relative to `apps/portal/src/`.

| Module | Exports and contract |
| --- | --- |
| `ui/index.ts` | `Button`, `Input`, `Textarea`, `Field`, controlled `Select`, controlled `Tabs`, `Badge`, `StatusNotice`, `SaveStatus`, `ToastRegion`, `buttonVariants`; associated `ButtonProps`, `SelectProps`, `SelectOption`, `TabItem`, `NoticeTone`, `SaveState`. |
| `ui/index.ts` | `OverlayProvider`, controlled `Dialog` and `Sheet`, `OverlayProps`, `CloseReason`. Mount one provider. Only one overlay can open. `canClose(reason)` guards Escape/outside/Back/Close. `initialFocusRef` and `restoreFocusRef` supplement opener/replacement/heading fallback. Sheet accepts `backLabel`, default `back to plan`. Do not nest overlays. |
| `ui/index.ts` | `Icon`, `IconName`, `IconProps`; icons are decorative by default and actions retain visible text. |
| `shell/PortalShell.tsx` | `PortalShell`, `PortalShellProps`, `ContactPort`, `PageHeader`, `Panel`. Client navigation is exactly your plan, check-ins & history, orders, account. Consumer supplies identity/contact action. `availability=administration` removes the skincare response promise after service. `mode` is presentation, never authorization. |
| `navigation/routes.ts` | `PortalRoute`, `RoutinePeriod`, `EditorSection`, `AdvisorClientTask`, `PresentationMode`, `CLIENT_NAVIGATION`, `buildRoute`, `parseRoute`, `parentRoute`, `safeReturnPath`. Identity/routine are URL-bound. Reject external URLs, credentials/unknown query keys, duplicate keys, malformed/encoded slash identities, dot traversal and invalid sections. |
| `navigation/history.ts` | `createPortalNavigator`, `PortalNavigator`, `NavigationRestore`, `restoreNavigationContext`. Supply a stable opaque UUID `scopeKey` for the current owner/session, replace it when that boundary changes, and dispose the old navigator. History contains only scoped navigation markers, predecessor, scroll/focus keys. No answers or drafts. |
| `navigation/react.tsx` | `NavigationProvider`, `usePortalNavigation`, `RouteLink`, `BackButton`. Modified/middle clicks retain native link behavior. Back uses a valid same-scope predecessor or semantic parent; evidence/use return to the same product/routine. |
| `transport/session.ts` | `CookieSessionPort`, `CookieLease`, `CookieChannel`, `CookieRequestFactory`, `OperationKind`, `OperationPort<Input,Output>`, `TransportError`, `createSessionTransport`, `createDemoPort`. |
| `main.tsx` | `mountPortal(element, content)` returns unmount. It provides StrictMode and the shared overlay provider; it selects no identity/auth/API. The internal preview mounts only on the explicitly generated preview sentinel. |

`createSessionTransport(cookieSession)` exposes `bind({kind, invoke, decode})`, `bindCookieChannel(factory, channel, kind, decode)`, `sessionChanged`, `subscribeInvalidation`, `memory.get/set/delete`, `signOut`, `dispose`. Pass the retained `createClientCookieRequest` or `createCookieRequest` and the actual retained session, not a replacement fetch implementation. Wire the existing session's `onState` to `sessionChanged`; use invalidation to clear mounted private views. Dispose/recreate the transport on session replacement. Draft state stays in this memory, not history, localStorage or sessionStorage. A conflict/unavailable write retains edits and an unavailable write reports `uncertain`; it never returns a fabricated saved result.

`bindCookieChannel` uses the existing fixed channel names only. Caller-supplied strict command types/response decoders come from W1. Actual retained-factory tests prove owner/audience/generation checks, CSRF header, same-origin credentials, `no-store`, redirect rejection and operation allowlists still apply. The transport contains no caller-selected URLs, provider tokens or new auth flow. Demo composition supplies memory-only reducers, never real cookie ports; the internal harness also denies network.

Semantic routes cover the exact planned plan/recommendation/product/evidence/use, history/new/event/version, orders/detail, account/service/cancel, notifications, advisor clients/client/plans/editor/preview/review/permissions and `/maya` stages. Explicit retained `/?workspace=...` aliases preserve selected product/client and advisor task; new advisor client URLs use an allowlisted optional `task` query for these retained task identities. They do not invent a draft ID from a client ID.

`safeReturnPath` validates the new semantic routes; it does not change the existing gateway's login-return allowlist. The coordinator must deliberately connect semantic URLs to retained sign-in/callback recovery and server routing. Do not pass a new path into the old login validator and assume it is already accepted.

## task and UX verification

| Persona/task | Available foundation behavior | Recovery |
| --- | --- | --- |
| Client locating work | Exact four client links, active location and persistent contact action. | Browser links, Back/Forward, direct parent fallback; mobile menu Escape/outside dismissal. |
| Client inspecting one product | One contextual sheet; selected product/routine remains identified in routes. | Guarded close, focus trap, opener/heading restoration, in-memory unsent work. |
| Advisor/client awaiting a write | Shared saving/error/uncertain feedback and session-fenced port. | Retain unsent edit on conflict/uncertainty; clear on logout/owner/session replacement. |

| Priority | Observed issue | Correction and evidence |
| --- | --- | --- |
| P1 | Wrapped history label initially expanded its nav row to 64px and displaced orders/account. | Rendered native geometry test failed, then passed with the approved 48px rows. |
| P1 | Mobile menu did not dismiss with Escape while its toggle retained focus. | Global scoped key/outside handlers; rendered keyboard regression passed at 390/320px. |
| P1 | Initial history subscription teardown could lose popstate after StrictMode effect replay. | Subscription activation/cleanup test failed, then passed; rendered Back/Forward passed. |
| P1 | Adding TypeScript 7 changed the parser resolved by existing release tooling. | Retained parser pin restored within owned dependencies; affected 63-case release tests passed. |

New preview explanations identify synthetic scope, memory limits, guards and recovery. They are internal harness text, not proposed client copy. Future real pages consume these controls; no new product guidance, payment promise or approval/publication rule was authored here.

## verification and limits

Final clean-install portal suite: **362/362 passed**, zero failures/skips, with `npm test -- --test-concurrency=1` under the explicit Node 22 PATH. This includes the 344 retained cases and 18 new foundation cases. [Machine receipt](../design/W0_VERIFICATION.json) binds these results to the implementation commit. The final source diff is confined to the owned paths and `git diff --check` passed.

- Initial retained portal baseline: 344/344 passed under Node 22.23.0.
- Focused new foundation cases: 18/18 passed after meaningful red/green navigation/session/overlay tests and rendered keyboard/geometry corrections.
- `npm ci` after the final dependency pin: passed. npm reported three audit advisories (two moderate, one high) both before and after the additions; advisory identities were not compared. No audit-fix or unrelated upgrade was performed.
- `npm run typecheck:rebuild`: zero errors, TypeScript 6.0.3.
- `npm run typecheck:session`: zero errors, retained runtime unchanged.
- `npm run build:rebuild`: passed with semantic color guard over new CSS and no warnings; locally bundled fonts/notices, no API composition.
- `npm run check:ui`: passed, 11 retained stylesheets; new source CSS is separately guarded by `build:rebuild` rather than hidden from validation.
- Existing `npm run build`: passed, 132 assets, same three gateway route families. It emitted missing `expo/tsconfig.base` warnings because this worker did not install/change the root Expo workspace. No release source or gateway was rewritten.

Rendered tests use one repository Playwright browser with synthetic in-memory assets, a deny-by-default request interceptor, and blocked background network/service workers. Viewports are 1440×960, 1280×960, 390×960 and 320×960. Tests cover native shell positions, no horizontal overflow, one accessible contact action, labels/errors, ArrowRight tabs, keyboard select, single-modal ownership, guarded Escape, Tab/Shift+Tab containment, opener focus, product/routine Back/Forward/direct entry, refresh and reduced motion. Sensitive preview text survives in-app navigation and is intentionally not persisted across reload. No unexpected requests or browser errors occurred in the passing focused run.

T3 preview was tried first. Snapshot failed twice with `Preview automation snapshot timed out after 15000ms.` The T3 tab was closed before switching to the existing repository browser workflow.

Actual images and measured JSON are retained in [rendered evidence](../design/rendered/). Manual comparison used native C01 and C03 alongside the actual harness. Native and rendered desktop sidebar/topbar/contact/identity/nav positions agree; the sheet is x=904, y=72, width=536, height=888. C01 shell-only pixel comparison is not bit-identical: sidebar mean absolute RGB difference 0.6993/255, 1.204% of pixels differ by more than 24 in any channel; topbar mean 0.1196/255, 0.195%. This scopes comparison to the shared shell and does not claim a match for unimplemented page bodies. The 320/390 images were visually inspected for actual reflow and usable actions, not merely generated.

Not performed here: root Expo app/test type suite and exports; mobile/native runtime checks; DB replay/pgTAP/real Auth/Storage/outbox/email journeys; five-stage tour or any final page; hosted verification; human comprehension or accessibility sign-off; exact-head CI or independent review. The coordinator owns the isolated real Auth fixture and integrated acceptance. No second database stack was started.

## integration requests outside this write-set

1. W1/coordinator pins versioned commands, responses and safe actionable validation/conflict details before real module wiring. Supply strict decoders to the ports; do not loosen retained channel allowlists from a page.
2. Coordinator connects semantic routes and approved return paths to existing sign-in/callback, web fallback routing and release composition, with least-privilege tests. Keep the original site/release source until that compatible slice is verified.
3. W2/W3 and later owners consume the exported layer and exact native metadata/assets, implementing actual pages/renderer. The harness is not that deliverable.
4. Coordinator records these committed slices and actual verification in CURRENT_STATUS, WORKSTREAMS, acceptance evidence and CONTEXT_SYNC. Those files were expressly outside W0's write-set.
