# W0 client inbox navigation source

Owner: Kanuj. Same approved portal rebuild, 2 November 2026. This bounded author delivery connects the ordinary client's notification control to the existing client-only inbox route. Independent review and Parent admission are separate gates.

## Custody and requirements

Author workspace: `/Users/kanuj/.t3/worktrees/shelv/t3-9a0fa488`, branch `t3/client-inbox-navigation`. Clean starting HEAD: `e18c375fbe70318a2d3465adcb80d8e063568e47`. Its two input-only admin dependency/registration commits follow the brief's earlier `e0af0498f9fc45f9e0e63823a676f2cac3ba162d`; this ancestry is **not Root-equivalent and must not be imported**.

Parent is the sole actual Root writer in `/Users/kanuj/.t3/worktrees/shelv/kanuj-portal-rebuild-integration-20261030`. Immutable integration context is `89bf7bfbeadd7d6fa31ebd76d7930715daec4462`, including client inbox code `3c284771`. The [independent client inbox composition review](W7_CLIENT_NOTIFICATIONS_ROOT_COMPOSITION_R1.md) accepts only its allocated source/SSR/finite composition, explicitly excluding bell navigation, advisor/A06 and genuine/browser/full D33/D34 acceptance. Earlier published `e10cf652` predates this inbox composition.

Parent separately supplied the exact literal task handle:

`node:delegated-task:command%3Amcp%3Aafb222dc-28b4-420b-9474-b05bc6eeba89%3Adelegate-task%3Acorrective-20261102-client-inbox-navigation`

Initial actual self and Parent `t3_thread_configure` READs omitted `modelSelection` and returned `codex/gpt-6.1-sol/reasoningEffort=xhigh/serviceTier=default`. Node is `/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node`, verified `v22.23.0`. No nested agent or model/configuration change occurred.

The full original approval, continuation, D01-D48, approved desktop specification, README, GOAL, implementation contracts, addenda and workstream history govern. Exact original inputs remain:

| Input | Bytes | SHA256 |
| --- | ---: | --- |
| `source/APPROVED_INPUT.txt` | 95388 | `c45701f9f54fd2b1dbb09bbd7aa2b9b437e9059aa6032b6f39411fe2e7f6efbd` |
| `source/CONTINUATION_INPUT_20261102.txt` | 100187 | `b428b318598df52f12ce3e6ea4ebd350ff9333ee05d9fd8f04a8e845d0c722bc` |

Applicable root/portal instructions, personal workflow, shared UI system and the repository's task-first UX skill were read. D01/D03-D06 preserve one navigation, shared wrappers and lowercase authored UI. D10 requires real navigation/Back. D33/D34 require notification behavior without invented delivery/read truth. D38 preserves read-only care versus unfinished administration. D42 preserves public/preview isolation. D46/D48 leave actual integrated acceptance mandatory.

## Task map and minimal API pin

| Priority | Persona and immediate goal | Exact source issue | Smallest correction | Regression and evidence level |
| --- | --- | --- | --- | --- |
| P1 | Ordinary client: open notifications from the current page | Root `ApplicationShell` has no notification control although its `/notifications` inbox branch exists before clinical plan loading | One shared `Button asChild` / `RouteLink` in the existing client status slot, with shared `Icon name="bell"` and visible `notifications` label | Actual Shell/PortalShell and Root Application SSR, captured real anchor callback, actual navigator and finite cookie/gateway/Vault/Root fixture; no browser claim |
| P2 | Client: identify the current inbox page | `PortalShell.activeSection` defaults notifications to plan | Return the notifications section without adding a top-level menu | Exactly one current-page link on the inbox, retaining the four client navigation items |

Before changing exported interfaces, Parent received and approved the exact pin: **no new API**. `ApplicationShell` retains `audience`, `children`, `onSignOut`, optional `readOnly` and optional `preview`. `PortalShellProps` retains its existing optional `status?: ReactNode`; no callback, privilege bit, session/currentness flag or unread-count prop is added. Parent separately transferred the narrow `ui/icons.tsx` claim for the shared Bell import/mapping only; all other icons remain unchanged.

The control's URL is serialized by the existing `RouteLink` from `{ name: 'notifications' }`. Its callback closes over that provider's navigator. Modified/nonprimary clicks, earlier cancellation, native target/download behavior and Back remain the existing shared navigation behavior. A disposed navigator cannot adopt a replacement owner. The route/link grants no server authority; actual session/cookie/gateway checks remain downstream. Care read-only presentation does not manufacture clinical EDIT authority or block VIEW bookkeeping.

No unread number is shown. The actual `features/notifications/model.ts` explicitly describes a live page observation with no total/unread badge. The link renders only for the ordinary client audience with preview off. Public Maya, advisor/preview and other shared-shell presentations receive no private notification link from this composition. The advisor has no enabled bell here; its `/notifications` route still fails the existing advisor route guard. Advisor/A06 is outside this claim and remains unaccepted.

The only new visible copy is `notifications`, which names the destination. No menu, dialog, CSS, clinical read, notification fetch, email or business command is added by rendering the control.

## Verification and evidence

The complete actual Root source closure is individually materialized from immutable Git into this author's ignored `.local-artifacts/client-inbox-navigation/fixture/`. `root-source-manifest.json` records each path, blob, SHA256, mode and size. Root Application/current Maya dependencies are used there; the physical base's older/unadmitted Maya and later unadmitted MayaChrome work are not substituted. No foreign generated artifact is executed.

The NEW test uses real React SSR under the actual NavigationProvider and OverlayProvider. A test-only JSX observer records real native anchor props while forwarding every element to the real React JSX runtime; no hook, component, navigator, session, authority, OperationPort or Vault method is replaced. Invoking the captured callback on the existing plain Window fixture is **Node callback/navigation evidence, not browser interaction**. Serial fixture cases retain actual ApplicationSession/cookies, gateway, encrypted SessionVault/CredentialEnvelope, provider/context parser and Root handler/codecs. Auth/context/RPC native Responses and Vault storage are finite synthetic fixtures, not genuine Auth/SQL/persistence or delivery.

Parent subsequently granted one exclusive central execution phase for actual Root89 plus the three owned postimages and the NEW ten-case test. Source changes were prepared within the initial source-only grant; the unchanged dynamic OLD/current comparison ran after the execution grant. The old source inputs were preserved from immutable Git, not reconstructed from the correction.

The eight labelled test/compiler receipts use the literal Node executable above, with cwd:

`/Users/kanuj/.t3/worktrees/shelv/t3-9a0fa488/.local-artifacts/client-inbox-navigation/fixture`

`commands-index.json` and individual `*.json`, `*.stdout`, `*.stderr` retain exact argv, cwd, start/end, status, signals and hashes. The runner is `../run.mjs <fresh-label> <Node arguments...>`; it refuses to overwrite existing receipts. Runtime tests use `--experimental-strip-types --import ./deny-network.mjs --test --test-concurrency=1` and the complete named files, without filtering/skipping. The preload rejects network/socket/server acquisition; enumerated native Response fixtures are in-process only.

The earlier `node --check apps/portal/tests/rebuild-client-inbox-navigation.test.mjs`, built-in `--experimental-strip-types --test apps/portal/tests/rebuild-foundation-navigation.test.mjs`, and Git/source checks used the author's checkout cwd, `/Users/kanuj/.t3/worktrees/shelv/t3-9a0fa488`. Both the initial syntax check and original nine navigation cases exited0. The fixture's later17-case receipt preserves the actual Root navigation/model/recovery baseline separately.

| Receipt / complete target | True result | Evidence scope |
| --- | --- | --- |
| Initial physical-base `node --check` on the NEW test; existing `rebuild-foundation-navigation.test.mjs` | exit0; 9/9, exit0 | Syntax and existing built-in navigation, before production edits |
| `builtin-current`: `rebuild-foundation-navigation`, `rebuild-notifications-model`, `rebuild-notifications-recovery` | **17/17, exit0** | Exact Root source; navigation and pure notification contracts |
| `builtin-controller-lifetime`: unchanged `rebuild-notifications-controller` and `rebuild-notifications-lifetime` | **40/40, exit0** | Direct actual session/cookie/handler finite HTTP; distinct from serial Vault cases |
| `old-shell-original`: unchanged NEW `rebuild-client-inbox-navigation.test.mjs`, exact Root89 preimages of all three files | **2 pass /8 fail, exit1** | Semantic missing-control failures, no setup/startup failure; native target/download and isolated presentations already pass |
| `current-shell`: identical NEW test, only approved three-file postimages | **10/10, exit0** | Actual Application/Shell/PortalShell SSR, real captured anchor callback, canonical navigator/Back/Forward and serial cookie/gateway/Vault/Root finite cases |
| `frontend-types`: actual `apps/portal/node_modules/typescript/bin/tsc -p apps/portal/tsconfig.frontend.json` | **exit2** | Owned-closure setup failure: existing adjacent `site/auth/portal-routes.d.ts` omitted, plus its downstream implicit-any diagnostic |
| `strong-types`: initial owned focused probe | **3 diagnostics, exit1** | Same omitted declaration and missing config-origin `react-dom` resolution; original probe/script/raw retained |
| `frontend-types-complete`: identical configured compiler command after copying the exact existing Root declaration | **exit0** | Actual unchanged frontend configuration; no added/changed declaration, shim, flag or assertion |
| `strong-types-complete`: configured frontend plus focused Shell/PortalShell/Bell positive and negative type probes | **263 inputs /0 diagnostics, exit0** | Correct original config filename and portal-local probe location; strict, noUncheckedIndexedAccess, noEmit, verbatimModuleSyntax and skipLibCheck:false unchanged |

The ten current cases cover one labeled shared bell/native URL/current-page state with no invented count; inert actual-App SSR; provider navigation and predecessor context marker/Back/Forward; modified/nonprimary/cancelled and native target/download behavior; care-read-only VIEW without clinical EDIT; advisor/preview/public/demo/historical isolation; disposed navigator versus replacement owner; serial inbox loading with no clinical read; finite unavailable-channel recovery; and actual cookie-session end refusing inbox authority. Node callbacks/plain Window objects do not establish mounted DOM, native browser focus/scroll, keyboard or genuine permissions.

The omitted declaration is exact Root blob `77036a2d0fb98ea5ff21ac47b9171cb32d62cbff`, SHA256 `8e8143d4f5edf81a3e93e4804d08af78f5eefeaa12129d8750418971efb490aa`. Its unchanged typed client navigation removes the two configured diagnostics. The focused compiler's initial config-origin setup was corrected by supplying the real config filename to TypeScript's parser and locating its probe under the actual portal; no type/flag was weakened. The two failed attempts remain nonzero. Existing Node typeless-package warnings from original built-in fixtures remain in raw output.

Only after the execution grant, actual APFS `/dev/disk3s1` and `lstat.dev=16777230`, nonsymlink ancestors/destination absence, all package/lock custody and Root runtime source were verified. Root has **91** tracked runtime files; this input-only base has **94**, with own-only `account-contact-provider.ts`, `credentials.ts`, `own-admin-provider.ts`, and five differing shared files (`client-policy.ts`, `client-upstream.ts`, `gateway.ts`, `policy.ts`, `types.ts`). Exact Root91 bytes/modes matched immutable Root89 and were individually materialized. None of the own unadmitted registry/Auth modules was substituted.

The conditional APFS copies preserve **43213 root and9071 portal entries**, including dependency roots. Full original/preprobe/terminal inventories compare bytes, modes, kinds, literal link strings and normalized resolved targets. Six package/lock inputs match Root/own/fixture; four separate physical lock copies match, with runtime lock metadata retained separately. Workspace links resolve to the owned materialized Root91 runtime. No install, borrowed compiler, foreign generated runtime, dependency/configuration change or shim occurred.

All granted commands and full dependency parity were terminal before the explicit **HEAVY RETURN** to Parent. Only source/manifest/report/Git work followed. Initial and terminal actual self/Parent configuration READs both confirm Sol/xhigh/default. No resource custody remains.

## Frozen manifest and remaining gates

Source/test commit: **`92b8fc56db6db71907418d02ca8876095bb6f498`**, direct parent **`e18c375fbe70318a2d3465adcb80d8e063568e47`**. It changes exactly the four paths below. Import only this owned commit, excluding input-only ancestry. This report is a separate report-only commit; its identity is recorded in ignored `FINAL-HANDOFF.json` after commit to avoid self-reference.

All modes remain `100644`. The three preimages are identical in own starting Git and immutable Root89:

| Path | Root/own preimage blob | Preimage SHA256 |
| --- | --- | --- |
| `apps/portal/src/app/Shell.tsx` | `767bd1309aa503560870f8b7aa930188ae92a6e2` | `2d2cd759e5d2bf8bb1bd3c524f7cea3d5e051f09dc97f62d7f33a8976c6bd591` |
| `apps/portal/src/shell/PortalShell.tsx` | `b88608f7b6c6bb657bdb73b7c8fe0711fd6dc239` | `5476f3f78efbf76b4d8b1ae2b80b8fb83ab9de010fce2eb5c16d5640785662ff` |
| `apps/portal/src/ui/icons.tsx` | `26390b14a3730d14205280accee6e3b7ba60c714` | `62675d34fdec97ae00eb2f92fd87777cc57a4d128c68b645da3b84c2928eb9b4` |

| Path | Frozen postimage blob | Postimage SHA256 |
| --- | --- | --- |
| `apps/portal/src/app/Shell.tsx` | `6175f0e4ac0ada0f7c7236e8a5a081e751d25899` | `6d1bc4cd66d36594c3990c1dd32d619735168eb8832c4ad0dc27549026d522b5` |
| `apps/portal/src/shell/PortalShell.tsx` | `5c834e9829ad679365af23be815be5295b6cf47d` | `0502572585f62068bb041f51203a7ecfe3f3c37a5b8078574344ff75f7e0bc8d` |
| `apps/portal/src/ui/icons.tsx` | `f4d5ad1c5f48f5b94189b0ceb9be6a683fe1f001` | `3f105dd9e5093041018b55bcce853cc6a095325fb797d7cda673f5cf2c5f2d63` |
| `apps/portal/tests/rebuild-client-inbox-navigation.test.mjs` (NEW) | `e84da7e3875bf1fa9516ac1c1c4b64c184988f9f` | `423d2a766a025d37727b90b531a5f45f0ad45a61c0c23fe0c9278550a6db916a` |

Initial protected custody records every starting tracked path's bytes/mode/blob: **2259 files**. Final parity preserves the other **2256/2256** exactly, with no outside change; only the three declared existing postimages differ. Existing tests are untouched. The NEW test's bytes are identical in OLD and CURRENT runs. Root's latest observed HEAD advanced to `3c7197f1571614ee1007c57d67b5988fa095123c` during Parent work; the three claimed Root physical preimages still match the table exactly. This is not a claim of testing that newer whole Root head.

The executed source projection has **285 individually pinned Root source/data/config/test inputs**, with only the three declared postimages changed. `candidate-source-manifest.json` pins the four delivered paths; `root-source-manifest.json` pins the full Root closure; `runtime-source-preflight.json` preserves runtime differences; `requirements-manifest.json` pins original inputs/history; `commands-index.json` retains complete commands/raw exits. All are under the author's ignored `.local-artifacts/client-inbox-navigation/`, with `evidence-manifest.json` hashing the compact custody files and probes.

| Evidence file | SHA256 |
| --- | --- |
| `root-source-manifest.json` | `6e16379fe7699d5f31d474db74bd7f71d488f48642c217903805d5aedb77a668` |
| `candidate-source-manifest.json` | `53d2b94e9a6d94a0086591cabc9eca3f5939673ac027436653af2fba5405f535` |
| `requirements-manifest.json` | `c02cfc77fd6f2d6eeb0adf117a150888fc4990bdf464c2ecb01a8115f9101f40` |
| `commands-index.json` | `992eb71ec13572e7b7a60539b94578212a16a2447eec211e7fa8a069de1ccff2` |
| `runtime-source-preflight.json` | `8d6dafda66ceb8479e8c1cd161e01d25c6452ad1b34e862bac37e07012df9355` |
| `dependency-terminal.json` | `d43910c3cf8a88fe08c960ca87802196d45bf751e707d81d52bd3033d8bf4afa` |
| `terminal-source-custody.json` | `72bc099a1a67ff2e2d63ce13d831b06d3083ef92624208472bd848524a1abf9f` |
| `fixture/strong-types-complete-inputs.json` | `78bab7a25256e1ec198bd122aee746b8670c85a4f57e23baed6cde8d86d04380` |

At source freeze, Parent received the exact source commit and explicit **release of both Shell claims and the narrow shared Icon claim**. This author performs no further source/test edits. Parent owns integration and small subsequent findings; a fresh independent review is required before admission. API signatures are unchanged. The separate report commit and final clean status are verified after this report is frozen.

Still UNRUN / OPEN: fresh independent review; Parent integration and exact-head CI; ordinary mounted browser effects, keyboard/focus/scroll/native tab history and responsive/visual/a11y/human acceptance; genuine fixture/Auth/SQL/permissions/persistence and notification delivery; advisor/A06/sign-in destination recovery; full D33/D34, all26 screens/D01-D48 and release acceptance. Original Guidance private-return, M65 and failed-photo-review provider holds remain HELD without rephrase/retry/reroute. No real client, funds/order, provider delivery, production or deployment action is authorized or performed.
