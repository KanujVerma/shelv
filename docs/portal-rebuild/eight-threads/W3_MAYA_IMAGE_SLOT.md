# W3 Maya images and client-shell placement

Owner: Kanuj. Source candidate only, 3 November 2026. Base: `96bfe2428d32eacdef5f4c9e184af7b5ef39a95e`. Obtain the successor SHA from the commit containing this report. PR216 and its five frozen paths remain unchanged while W7 verifies that earlier candidate.

## Problem and result

The Maya fixture replaced every available product image with an unavailable placeholder. The public application also lacks the approved client shell; W0 owns that composition. This candidate restores exact packaged recognition images through the existing canonical image format and provides an optional placement slot for W0's actual shared shell. It implements neither a separate demo shell nor live operations.

`MayaWalkthrough({controller, renderClient?})` accepts `renderClient?:(children:ReactNode)=>ReactNode`. Only the children of `maya-client-canvas` enter that slot. The guide rail remains a sibling outside it. Omitting the slot preserves existing callers. W0 supplies a stable scope-bound renderer from `MayaApplication`, with identity, navigation and contact behavior. No contact state or new authority is introduced here. The old a8f/MSC3 contact candidate remains unadmitted.

`images.ts` exports the readonly `mayaImageFiles` list. For each exact basename, W0's packaging dependency copies `apps/portal/site/maya/assets/<file>` to `assets/maya-<file>` without changing bytes:

```text
moisturizer.jpg  sunscreen.webp  makeup.jpg  remover.jpg
cleanser.jpg    azelaic.png     hydro.jpg   aveeno.jpg
balm.jpg        ha.png          niacinamide.png  glycolic.png
```

Only exact original public references and these known local references map to canonical `assets/maya-<file>` values. Unknown, credential-bearing, query-bearing, external, encoded and unexpected references retain the shared neutral fallback. The shared renderer resolves the existing canonical format to same-origin `/assets/...`; no validator or backend contract changes. Product names, identities, all seven decisions, complete guidance, evidence, conditions and fictional story details remain preserved.

## Ownership and scope

W0 explicitly allocated this report and exactly three existing test files: `rebuild-maya-five-stage-content.test.mjs`, `rebuild-maya-five-stage-boundary.test.mjs`, and `rebuild-maya-interactions-boundary.test.mjs`. Other changes are confined to W3's Maya feature and new W3 tests/helpers. No other existing tests, shared shell/router/gateway, backend, contracts, packages, lockfiles or migrations change.

Maps D02/D04/D06/D07/D11/D41/D42/D46/D48; D01 guide and shared product imagery across C01/C01E/C02/C03/C07/C07C. This is a partial J10 prerequisite, not accepted screens or a complete journey.

## Observed proof

All commands use `/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node`. Raw paths below are relative to this worktree's `.local-artifacts/w3/`. No browser, server, DB, Auth, Storage or stopped fixture was started or queried.

| Evidence | Outcome | Raw record |
| --- | --- | --- |
| Original unchanged content test | 3/3 pass under its historical expected-null premise | `maya-content-ORIGINAL.log`; original bytes `rebuild-maya-five-stage-content.ORIGINAL.mjs` |
| Source-asset regression against the original fixture | 0/1 meaningful failure: available images were null | `maya-images-OLD.log` |
| Strengthened content successor against original fixture | 2 pass / 2 fail | `maya-content-successor-OLD.log` |
| Initial image-only implementation using `/maya/assets/...` | 29/29 image cases pass; this did not prove canonical compatibility | `maya-images-CURRENT.log` |
| Canonical read regression for that initial format | 25 pass / 1 fail, `invalid_input` | `maya-image-decoder-OLD.log` |
| Original unchanged boundary tests against that implementation | 12 pass / 9 fail, including real decoder failures, old no-image predicates and old source fingerprint | `maya-original-boundaries-CURRENT.log`; both original test files retained as `*.ORIGINAL.mjs` |
| Corrected existing canonical `assets/<basename>` format | 30/30 image/content/strict read cases pass | `maya-image-decoder-CURRENT.log` |
| Shell-slot regression before implementation | 1 pass / 5 fail; exact custom placement tag strengthens the original probe | `maya-shell-slot-OLD.log`, `maya-shell-slot-OLD-2.log` |
| Combined image and slot source checks | 57/57 pass | `maya-image-slot-CURRENT.log` |
| All existing and new Maya source/model/SSR tests | 162/162 pass, zero failed/cancelled/skipped; no browser imports or launch | `maya-full-source-CURRENT.log` |
| Frontend type graph | exit 0 | `maya-image-slot-types.log` |

Full Maya command: explicit Node binary `--test --test-concurrency=1 apps/portal/tests/rebuild-maya*.test.mjs apps/portal/tests/w3-maya*.test.mjs`. Frontend types: explicit Node binary `apps/portal/node_modules/typescript/bin/tsc -p apps/portal/tsconfig.frontend.json --noEmit`. `git diff --check` passes.

The new static-image assertions inspect actual SSR: every image and image preload must use an exact allowed packaged path and match its selected product's original source identity. Negative controls alter actual SSR to an external asset or another allowed product image and verify refusal. Existing fetch/cookie/storage/UUID traps and emitted no-live-operation checks remain. The old no-image fixture hash is preserved in the test comment; the successor pins exact fixture and image-module hashes. Original failures are not relabeled as passed.

## Remaining gates

Independent review of this exact successor is OPEN. W0's actual packaging copies and shared-shell/navigation/contact composition are dependencies, not implemented by this candidate. Full current browser behavior, actual asset delivery and geometry, desktop Figma comparison, narrow/390/320, focus/keyboard/zoom/reduced-motion/accessibility and full J10 remain unaccepted. Existing source passes do not establish visual or genuine acceptance.

Candidate1's source/SSR pass belongs only to its unchanged `96bfe242` target; its browser and genuine gates remain separate. No Guidance/M65/photo/A07 provider hold is retried, rerouted or claimed passed. M01/M02 accepted capabilities, private walkthrough boundaries and all original evidence remain unchanged. Only W0 integrates; no main merge, production action, real message, payment, order, upload or source permission follows this work.
