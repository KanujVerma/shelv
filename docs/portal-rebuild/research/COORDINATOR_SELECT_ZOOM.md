# shared Select CSS zoom positioning

Owner: Kanuj. 31 October 2026. Coordinator correction after W3's measured cross-owner finding. This changes shared Select positioning, not guidance, routes, authority, data or packages.

## cause and correction

W3 recorded a320px viewport at CSS zoom2: the trigger was192 physical pixels wide, while the fixed popper was384 wide and below the viewport. The coordinator reproduced the same doubled geometry using the actual shared Select alone, without importing W3's plan feature or changing its report.

Installed Floating UI DOM/core1.8.0 and Radix Popper1.4.0 use a Window offset-parent path for fixed positioning. Under CSS zoom, viewport measurements and CSS offsets then differ. This matches the mechanism described in the primary [Floating UI zoom change](https://github.com/floating-ui/floating-ui/pull/3492). The published versions checked in the public registry remain1.8.0. No package update or upstream patch is copied.

The shared Portal now has a fixed1px identity-transform container. It establishes an element containing block, so the installed positioning code's existing scale-aware element path handles the cumulative zoom. The container receives no pointer events; the real Select content remains interactive. Existing fonts, control sizes, Radix focus/selection/dismissal and semantic tokens remain unchanged. No custom coordinate parsing, pixel repositioning, forced click, browser API patch or content clipping is introduced.

Only `src/ui/primitives.tsx` and `src/ui/foundation.css` change in production. The new `rebuild-select-zoom.test.mjs` serves actual React/Radix/CSS/fonts through finite static interception; there are no API, Auth, fixture or private-data calls.

## meaningful red and green

With the two exact retained shared files supplied as esbuild inputs from the verified pre-fix Git object, all13 tests execute: **5 normal-scale controls pass;8 scaled cases fail**. Failures include option bounds and width mismatch at0.8,1.5,2, body zoom, accumulated html/body zoom, scrolled page and nested Sheet. This is an input-only sensitivity test, not a rewrite of Git or production files.

Current shared files pass **13/13**, then an unchanged existing foundation browser file passes **6/6**. Checks include pointer selection, real changed value, keyboard selection, Escape and focus return, exact trigger/popover width, viewport containment and no document overflow. At320/zoom2 the corrected popper is192 physical pixels wide atx64; its stopped option is inside the viewport atx74/y566/172x94. The source case's retained popper was384 wide atx128/y1556. No viewport predicate was weakened.

Explicit Node22 commands from the integration root:

```sh
PATH=/Users/kanuj/.nvm/versions/node/v22.23.0/bin:$PATH SHELV_SELECT_ZOOM_PHASE=final node --test apps/portal/tests/rebuild-select-zoom.test.mjs
PATH=/Users/kanuj/.nvm/versions/node/v22.23.0/bin:$PATH node --experimental-strip-types --test apps/portal/tests/rebuild-foundation-browser.test.mjs
```

The sensitivity command additionally sets `SHELV_SELECT_RETAINED_REF` to the actual full SHA returned by `git rev-parse 1b507a09`, and a unique artifact phase. It overrides only the two retained UI inputs. Original test/helper/source files are unchanged. The prior67-file foundation candidate was archived with per-file hashes before any rebuild.

Actual tracked frontend/session strict types, UI guard and12 retained overlay/navigation/notice source tests pass. Package/lock, legal notices, Root contracts/migrations, shared auth/runtime and all clinical/financial feature code remain unchanged. Mechanical local screenshot inspection confirms containment; extreme narrow layouts can wrap labels. This is not native browser zoom, every engine, screen-reader/WCAG or representative-human comprehension acceptance.

## preserved setup faults and resource return

An initial new harness passed Uint8Array output directly to the response body and timed out during page load. Buffer conversion fixed only test delivery. A normal-scale keyboard control initially pressed Enter before Radix applied Home's focus change; it now waits for the actual intended option focus before Enter. A sensitivity attempt had an invalid copied reference and failed in esbuild before the browser test. All three setup outcomes remain separately retained and are not product REDs. The final sensitivity5/8 and current13/0 use the same corrected harness/expected assertions.

Evidence is under `.local-artifacts/portal-rebuild/shared-select-zoom/`, with unique retained/final JSON/PNGs and raw TAP. Normal per-case context cleanup and suite browser closure completed. **Root sole Chrome grant `coordinator-shared-select-zoom-1b507a09-20261031` was returned at2026-10-31T18:31:18.591Z**. Exact installed headless remote-pipe Chrome/owned Node tests/workerd inventories are empty; final collaborative preview has no tab. Platform CUA was excluded from the process predicate. No later browser/preview/process call was made under that returned grant.

Independent current shared-control and W3 composition review remains required. W3's frozen source/browser117 result and historical broader201 result remain separately attributed; they are not retroactively relabeled by this shared correction. No full portal, genuine, CI, release, merge or deployment claim is made.
