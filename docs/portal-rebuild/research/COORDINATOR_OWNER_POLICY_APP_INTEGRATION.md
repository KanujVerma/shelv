# Owner-policy App source integration

Owner: Kanuj. 1 November 2026. This accepts the independently reviewed source composition of the publishing-policy section on `/advisor/permissions`. Full A08, ordinary browser behavior and genuine policy persistence remain open.

## Exact inputs

Clean starting Parent was `d4a3314ecd81e4c3b544a8919834429e90c05d06`. Ordered `git cherry-pick -x` imports all applied without conflict:

| Author delivery | Parent import | Scope |
| --- | --- | --- |
| `b33b2bcc4909fdaa924b46d7ca3da8afeb8cc7fc` | `f1d8e75b` | App composition, matching tests and report |
| `4a790a98d17d345c7fe08cb6d6f402dca7b0b7ac` | `eef72117` | terminal tests/report |
| `4baf2c522682b11441ff71a61c17d355667f3aea` | `a06fd056` | independent report only |

No reviewer input ancestors were imported. The [author report](W0_OWNER_POLICY_COMPOSITION.md) and [independent review](W7_OWNER_POLICY_COMPOSITION_R1.md) were read in full. Independent specification and quality verdicts are scoped SOURCE PASS. The OP2 test-only directory correction was separately present in Parent at `d4125cca`; it changes no feature behavior.

Five author paths match the final author candidate: Application, OwnerPolicyApplication, the App source test, its forbidden-input type probe and the author report. The independent report is the sixth changed path. Existing Root contracts, session/cookie transport, feature controller, navigation, packages, configuration and all 62 migrations remain unchanged by these imports.

The actual shell now mounts the reviewed controller/component on the permissions route. Entry and controller lifetime bind to actual session boundary, advisor role/view, canonical route and entry. Existing read-backed owner/publish authority, separate confirmation, explicit reapply and exact uncertain-original recovery remain feature-owned. This does not add task/agent/source permission administration or new rights.

## Fresh Parent verification

Executed against code head `a06fd0564ec189e8b9c8f2475d1742eb07834418`, using explicit Node v22.23.0. Evidence is `.local-artifacts/portal-rebuild/owner-policy-app-parent-admission/`.

| Check | Result |
| --- | --- |
| actual App source/finite HTTP/shared SSR | 38/38 |
| exact tracked policy and refresh suites | 78/78 |
| configured frontend and session TypeScript | each exit 0 |
| UI guard | exit 0 |
| actual main `write:false` build | 2,238 inputs / 15 outputs |
| complete author/main correspondence | every input and output SHA256 equal |
| root `npm test` | 1,370 pass, 0 fail, 18 existing opt-in skips; 1,388 total |
| `npx --no-install tsc --noEmit` | exit 0 |
| `npm run typecheck:tests` | exit 0 |
| `EXPO_NO_TELEMETRY=1 npx --no-install expo export -p web` | exit 0, own ignored output |

Behavioral checks load `tests/portal-review-no-network.mjs`. Main compilation uses the real `src/main.tsx`, normal frontend configuration and no alternate UI entry. Counts overlap; source/SSR and Expo compilation do not establish browser or native acceptance. The strong private-input probe is separately recorded in the terminal proof.

`commands.json`, `broad-current-commands.json`, `main-closure.json` and `PROOF.json` retain true exits, exact argv, raw logs and hashes. The first own build helper resolved esbuild one directory too high and failed before building; its script/log/receipt remain intact. Only that ignored import binding changed for the fresh successful build. An initial summary parser expected a Unicode reporter instead of TAP; corrected counting reads the unchanged raw `#` totals. Neither is a product defect or a passing attempt.

The earlier owner-policy evidence-index collision remains disclosed in the independent report. Its older raw 1,296-test log is distinct from the new 1,370-pass run. Missing historical command timestamps were not recreated. The early author's hook override remains historical; Parent imports used ordinary Git configuration.

## Held acceptance

No new browser, DB/Auth/SQL/Storage/provider or policy operation was performed by Parent. Ordinary React effects, actual owner-policy browser journeys, genuine owner/nonowner persistence, approved-frame desktop/mobile/accessibility/human checks, full A08, exact-head CI and release remain open. The six new reviews retain frozen base `d4a3314e`; this separate App advance does not rebase their candidates.
