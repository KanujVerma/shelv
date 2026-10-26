# Portal UX delivery, 26 October 2026

Owner: Kanuj. Candidate: [PR 209](https://github.com/KanujVerma/shelv/pull/209), `codex/shelv-ux-skill-pilot-20261026`.

**Local UX candidate:** final application source is `2539d0729bffcb32318add72575a1e28168a1a9d`. All six independent findings are closed with specification/quality PASS for the correction waves. Exact verification scopes and the two environment-blocked optional checks are recorded below. The latest hosted release remains the separately recorded [release result](PORTAL_RELEASE_RESULT.md). No merge or deployment is part of this delivery.

## 1. Navigation architecture

Selected a task-first **Your plan** with **Recommendations** and **Daily routine**, rather than adding a Home that repeats those destinations. Fresh entry uses actual plan state: decisions and received-but-unstarted products lead to recommendations; an active routine with no outstanding decision leads to daily steps. Optional and next-bottle suggestions do not block routine entry. An explicit URL or browser-history choice takes precedence.

**About this plan** is contextual to the plan. Version history and download are secondary plan actions. Check-ins retain a dedicated destination; payment and check-in attention link to their existing workflows. The account disclosure contains Payments, service/history, Help, optional tour replay and sign out. It does not introduce an empty Settings screen. Account identity comes from the client's own enrollment projection, never a plan title; missing identity says **Your account**.

For advisors, the structure is **Clients → client workspace → task → details**. Client/task URLs support direct entry and Back/Forward. Saved, published, private and client-visible content remain separately identified. The directory does not invent a payment/check-in urgency queue that its current data cannot support.

## 2. Client and advisor journeys

- Routine products open navigable practical guides. Product identity and actual use precede optional rationale, background and ingredient detail. Focused ingredient dialogs preserve the parent product context. Active directions retain their source publication and instruction revision.
- Recommendations retain supported reasoning and cautions, with decisions before collapsed technical comparisons. Daily routine shows active steps, stop/pause advice and a compact link to pending changes, instead of repeating the proposed routine.
- Current and final-service downloads are correctly labelled HTML documents, with semantic headings/lists, safe source links and a print/save-PDF action. Historical exports explicitly preserve their historical scope rather than reconstructing an old active routine.
- Alex and Maya use the same controls while retaining distinct fictional content. Maya's seven-stage guide is optional, allows exploration and can be replayed through the account controls.
- Advisors have published-plan history, named approved-product quote choices and a read-only saved publication version. Save → preview → deliberate publish retains the saved/published distinction and opens confirmed history.
- Selected-client memory retains unfinished check-in replies, private notes, schedule dates, quote inputs and service forms across task changes. Exact uncertain commands keep their original request identity. Instruction/return/cancellation drafts bind to their authoring basis and require an explicit fresh draft if that basis changes. Client departure/session teardown clears memory with applicable guards.
- Repeated product Back/Forward retains the original scroll/focus. Client Payments and Service retain exact uncertain commands and private upload intent across task changes; in-flight departure is blocked, sign out warns before abandonment, and owner/session teardown clears state and rejects late acknowledgements.

Approval, payment, receipt and explicit Start remain separate. Publication, private notes and client-visible replies retain their existing authority and visibility boundaries. Operating terms remain canonical in [founder operations](CONCIERGE_FOUNDER_OPERATIONS.md).

## 3. Shared UI system

[Portal UI system](PORTAL_UI_SYSTEM.md) is the contributor default for shared components, copy and interaction rules. The vanilla JavaScript/HTML/CSS architecture remains in place.

| Standardized area | Implementation |
| --- | --- |
| Tokens | `site/ui/system.css`: semantic brand/surface/text/status/focus colors; type, space, radius, border, elevation, layout and reduced-motion roles |
| Actions and fields | Existing `.solid`, `.quiet`, `.text-button` plus meaningful destructive variants; payment/check-in aliases share geometry; principal controls target 44px and inputs use 16px text |
| Dialog behavior | `createPortalDialog`: accessible name, initial focus, Tab boundaries, Escape/Close, scroll lock, unsaved dismissal guard, owner-scoped opener/replacement fallback and teardown; blocked focus does not leave attributes on another portal |
| Navigation and detail | Shared account disclosure, plan actions/history, practical product layout and advisor task patterns |
| Copy | Small shared `site/ui/copy.js` vocabulary; required purpose review for each added explanatory sentence |
| Enforcement | `npm run check:ui` scans all 11 stylesheets, rejecting new literal colors outside the canonical root and growth in recorded legacy allowances |

Literal color occurrences fell from **220 to 100**, comprising **20 canonical token definitions and 80 legacy occurrences**. These are occurrences, not unique colors or a claim that all styling is tokenized. The guard does not replace rendered contrast, reuse or copy review. Advisor forms intentionally remain denser than client guidance. No framework or animation dependency was added; motion is restrained and respects reduced motion.

## 4. Copy removed or consolidated

Removed repeated concierge subtitles, directory introductions, duplicate workspace eyebrows/statuses, the meeting-preparation tutorial panel and repeated draft-save messages. The client header no longer gives preparation metadata, global reference-price qualifications and document export equal weight with the current task. Plan metadata remains in About/history; financial qualifications remain at relevant product/quote decisions.

Retained visible field labels, supported product rationale/cautions, medical uncertainty, fictional disclosures, private/client-visible labels, actual payment verification, receipt/Start distinctions, unsaved-work consequences and exact-retry recovery. The changed-surface review classified copy by identification, instruction, status, decision support, safety/finance/privacy/uncertainty and useful secondary explanation. It does not claim an exhaustive audit of every possible authored record string.

## 5. Before/after synthetic screenshots

The selected pairs are unmodified local synthetic captures; no image editing or real/private client material is used. Both captures in each pair use the same fixture, product/task and viewport. Images are full-page captures, so output heights may differ. The two client after-images were refreshed and visually inspected against client-continuity checkpoint `163754e`.

| Journey | Before | After | Observable change |
| --- | --- | --- | --- |
| Alex sunscreen guide, 320×1000 viewport | [Before](assets/portal-ux/alex-product-320-before.png) | [After](assets/portal-ux/alex-product-320-after.png) | Same Beauty of Joseon Relief Sun: long modal becomes a page with Back and practical use before supporting detail |
| Alex active routine, 1440×1000 viewport | [Before](assets/portal-ux/alex-routine-1440-before.png) | [After](assets/portal-ux/alex-routine-1440-after.png) | Same active water-rinse/sunscreen/cleanser and stop advice; proposed list becomes a pending-change action |
| Fictional advisor directory, 1440×1000 viewport | [Before](assets/portal-ux/advisor-directory-1440-before.png) | [After](assets/portal-ux/advisor-directory-1440-after.png) | Same synthetic records; less generic copy, clearer publication/draft status and secondary Examples |

Before source: reconciled `de69880`, `.local-artifacts/ux-baseline/before-latest/{alex-product-320,alex-routine-1440,advisor-1440}.png`. Client after source: frozen `163754e`, `.local-artifacts/ux-qa/final-targeted/{active-product-320,returning-routine-1440}.png`; both use `preview=1&state=unapproved`, matching the baseline. The advisor after is frozen `d79e680`, `.local-artifacts/ux-qa/final/advisor-directory-1440.png`, with the same default-ready fixture and no business-state write. The later `2539d07` correction changes shared focus restoration and tests, with no appearance/CSS change to these captures; they are not relabelled as recaptured at that commit. The original target screenshots and transient Loading captures are not used as after evidence.

| Copied file | SHA-256 |
| --- | --- |
| `alex-product-320-before.png` | `8e654fd71e77d51d37dd5728eae4f3c4febf40350c0be0eb12155f852d109097` |
| `alex-product-320-after.png` | `d56d3a6b7f89688566032bd6ed583774c914b52171bcbbae4709cd86df8ae10a` |
| `alex-routine-1440-before.png` | `7e36b054163da205f930eb42652153bb31793a845695343b3779a5892ffc8f15` |
| `alex-routine-1440-after.png` | `9fa28a23f96f94df4bd29160d8b086e76f05ce9268c1942d1aca2cb99eae15b5` |
| `advisor-directory-1440-before.png` | `435bf7aa801be3ff8a7e01a243e4d7b9528278f235aa2cf90ea42f6e797a9fc1` |
| `advisor-directory-1440-after.png` | `743e7f8a1d8c473eac7dfd7abcfc5044cadb2e8cd89b291f642efa02719270c9` |

## 6. Research and design methods actually used

The project-native [UX review](../.claude/skills/shelv-ux-review/SKILL.md) established task maps, novice walkthrough questions and state boundaries before [design polish](../.claude/skills/shelv-design-polish/SKILL.md). Independent reviews used actual source, synthetic browser interactions and settled screenshots. Findings led to shared dialog behavior, clearer hierarchy/copy, earlier decision controls, semantic export, destructive hover correction, account-menu containment and the subsequent continuity/draft-basis fixes.

The bounded 26 October research read current primary documentation. The design choices are Shelv inferences from those sources, not measured client preferences:

- [Apple sidebars](https://developer.apple.com/design/human-interface-guidelines/sidebars), [modality](https://developer.apple.com/design/human-interface-guidelines/modality), [menus](https://developer.apple.com/design/human-interface-guidelines/menus) and [writing](https://developer.apple.com/design/human-interface-guidelines/writing): shallow predictable destinations, grouped contextual actions and necessary task copy.
- [NN/g recognition rather than recall](https://www.nngroup.com/articles/recognition-and-recall/), [progressive disclosure](https://www.nngroup.com/articles/progressive-disclosure/) and [scannable writing](https://www.nngroup.com/articles/concise-scannable-and-objective-how-to-write-for-the-web/): practical information first, supporting depth on request and removal of duplicate explanation. Historical study results are not Shelv outcomes.
- [W3C disclosure navigation](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation/), [modal dialogs](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/), [reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html) and [target size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html): native links/buttons, named dialogs, focus behavior, 320px reflow and useful control targets. The 44px product target is not presented as WCAG AA's 24px minimum.
- [Notion navigation](https://www.notion.com/help/navigate-with-the-sidebar) and [history](https://www.notion.com/help/duplicate-delete-and-restore-content), [Linear preferences](https://linear.app/docs/account-preferences), [Shopify admin](https://help.shopify.com/en/manual/shopify-admin/shopify-admin-overview) and [object timeline](https://help.shopify.com/en/manual/shopify-admin/productivity-tools/timeline): familiar account access, explicit entry preferences and history beside its object. No visual identity was copied.

| External project and reviewed revision | Actual use and limit |
| --- | --- |
| [Impeccable](https://github.com/pbakaus/impeccable/tree/989c484c091d26f10fa102767eefc0da2e62ec67), `989c484`, 4.7.1 | Manual selected Operate/Read, critique/clarify/distill/harden/audit/onboard prompt methods. Launcher/hooks reviewed; no installer, executable hooks, binary or formal detector run. Detector **UNRUN**. |
| [Playwright CLI](https://github.com/microsoft/playwright-cli/tree/b1a5903c5b633b8c9f843ad7b629c2a78437040c), `b1a5903` | Reviewed upstream skill; actually used the official interactive `playwright cli` subcommand in existing local Playwright **1.64.1**. No alpha/global CLI install was needed. |
| [Taste Skill](https://github.com/Leonxlnx/taste-skill/tree/12af471f627f866411b4bd785b19646d3672784c), `12af471` | Independent manual app-screen hierarchy, shared edges, type, density, forms and restraint review. No installer, inspector/lint/draw run, score or brand redraw. |
| [designlang](https://github.com/Manavarya09/design-extract/tree/d2c28da8aae3098a7f7dc02fb4355f3f803edb6c), `d2c28da`, 13.3.2 | Research-only source/installer review; no extraction or generated rules imported. |
| [Transitions.dev](https://github.com/Jakubantalik/transitions.dev/tree/6a7d68260d624eb66661cc3af17e0989476f48ae), `6a7d682` | Research-only CSS/reduced-motion reference; no hooks, automation or library installation. |
| [React Bits](https://github.com/DavidHDev/react-bits/tree/e12c22192ac7b4b452c5e2feb9b586d74765d696), `e12c221` | Deferred: vanilla portal has no demonstrated React requirement. Reviewed MIT plus Commons Clause, not unqualified MIT. |
| [GSAP Skills](https://github.com/greensock/gsap-skills/tree/aed9cfd3277740755f6bfc1155c7aa645403b760), `aed9cfd` | Deferred: ordinary navigation/dialog states do not require a timeline engine. |

The original [skill pilot](PORTAL_UX_SKILL_PILOT.md) remains the historical evaluation/experiment plan. It is not an installation receipt.

## 7. Browser interactions tested

Actual interactive CLI exploration used `apps/portal/node_modules/.bin/playwright cli`: `open`, snapshots/refs, click/type, keyboard, resize, Back/Forward, reload and download inspection in a dedicated isolated Chrome session. Context was offline with service workers blocked and deny-by-default local GET interception installed before navigation. All mutations affected synthetic in-memory fixtures.

Inspected at 320, 390 and 1440px, with flow-specific width coverage rather than every state at every width: new/returning/awaiting-publication clients; recommendation choice; payment uncertainty/exact retry; receipt versus explicit Start; current routine/product/ingredient; account/menu; About/history; check-in draft/discard; optional Maya start/exit/replay/exploration; advisor search/no matches/keyboard entry; unsaved consultation; draft/preview/publish confirmation; reply/private-note retention; payment/history; next-date retention; refused history traversal; stale instruction basis; semantic HTML download/print. Generic private-viewer behavior used public Maya data and simulated authorization/invalidation only.

Independent capture matrix: **57 settled captures**, **0 horizontal overflow**, **0 JS page errors**, **0 transient Loading/Opening headings**, across frozen `e4baacd`/`d79e680`. Captures support inspection; they are not 57 measured user journeys or 57 reruns at `163754e`. The initial QA-only generic fixture produced 33 local missing images because of a wrong base path; the corrected fixture loaded all images. No unexpected external request escaped interception.

Final targeted CLI recheck at **`163754e`: PASS**. Three product Back/Forward cycles preserved exact focus and nonzero originating scroll at all three widths. Payment upload/claim and service-return retries retained exact intent through navigation; in-flight departure stayed blocked; cancelled sign out retained retry; confirmed sign out cleared private intent. Owner teardown and a late old acknowledgement at 390px left the new owner clear, without storage leakage. Refreshed product/routine images have settled content; the product has one practical-use heading with safety directions intact. Actual downloaded HTML rendered with **12 headings, 35 safe links, 16px body, 0 overflow**, and console **0 errors/0 warnings**. The isolated CLI session closed. Evidence: `ux-qa/final-targeted/summary.json`, `refreshed-images.json`, `export-render.json` and `final-console.txt`.

## 8. Automated verification

The scopes below overlap and must not be added together. Root/backend/types/Expo and the separate enabled native opt-in checks ran at `163754e`; the later UI-only focus correction is `2539d07`, covered by its focused review and final portal/session/package/build checks. Raw results are retained in `.local-artifacts/ux-20261026/final-verification-results.json` and the named logs. Earlier component/database evidence is identified separately. Node 22.23.0 and repository lockfiles were used.

| Command/check | Exact result and scope |
| --- | --- |
| Root `npm test` | **1,194 total: 1,176 pass, 18 explicit native-SQL opt-in skips, 0 fail**. `final-root-tests.log`. The skipped cases are not counted as executed. |
| Separate enabled native PostgreSQL opt-ins, exact command below | **18 total: 16 pass, 2 fail, 0 skip; exit 1**. Three reply, six confirmed-none and seven manual-method cases passed. The two historical HTTP/SQL cases were environment-blocked before their intended write/SQL assertions. `final-native-optins.log`. |
| Root `npx tsc --noEmit`; `npm run typecheck:tests` | Both pass with 0 errors. `final-root-types.log`, `final-root-test-types.log`. |
| Root `EXPO_NO_TELEMETRY=1 npx expo export -p web` | Pass. `final-expo-export.log`. |
| Root `npm --prefix apps/portal run test:session` | **148/148 pass**, 0 fail/skip, at `2539d07`, including native runtime, owner/session isolation, process restart and return-route cases. `final-session-tests-after-dialog.log`. |
| Root `npm --prefix apps/portal run typecheck:session`; `npm --prefix apps/portal run verify:session-package` | Types pass at `163754e`, 0 errors; **4 artifacts verified** again at `2539d07`. `final-session-types.log`, `final-package-after-dialog.log`. |
| Client delivery regression | **70/70 pass**, plus semantic export **2/2 pass** and actual rendered download/print inspection. `client-delivery-regression.log`, `export-semantic-final.log`, `rendered-export.log`. This predates the final two client corrections. |
| `node --test apps/portal/tests/client-continuity.test.mjs apps/portal/tests/client-ux.test.mjs apps/portal/tests/client-parity.test.mjs apps/portal/tests/payment-methods.test.mjs apps/portal/tests/service-browser.test.mjs` | Final client fix **52/52 pass**, 0 fail/skip. Strengthened late-acknowledgement case **1/1 pass**; independent adapted original reproductions **2/2 pass**. `client-fixwave-final-focused.log`, `client-fixwave-late-ack-final.log`, `client-fixed-rerepro.log`. |
| Advisor correction regression | **86/86 pass**, 0 fail/skip. Exact seven-file fix reviewed at `d79e680`; independent original reproduction plus programmatic-submit bypass attempt pass. `advisor-review-fixes-regression.log`, `advisor-fixed-rerepro.log`. |
| `node --test apps/portal/tests/ui-foundations.test.mjs apps/portal/tests/maya-tour-content.test.mjs apps/portal/tests/walkthrough-authorization-modal.test.mjs` | Latest **17/17 pass**, 0 fail/skip, including fresh unrelated-portal focus-isolation and sidebar-owner assertions. Independent original two-case reproduction passes at frozen `2539d07`; specification/quality PASS. `dialog-isolation-focused-final.log`, `modal-isolation-fixed-repro.log`. Earlier hover/menu red/green evidence is retained. |
| Own-name projection | Mapper/handler **2/2 pass**; native account SQL **4/4 pass**, covering owner isolation, anonymous/revoked/deleting denial and retained function ACL. |
| Fresh local canonical database | **53 migrations replayed**; exact **31 pgTAP files, 701/701 assertions pass**, streamed into the owned PostgreSQL container. `full-pgtap-result.json`, `full-pgtap-streamed.log`. Supabase CLI `test db` attempts reported **NOTESTS** due restricted guest mounts; those attempts are not a pass. |
| Native Auth/PostgREST/SQL/Chrome fixture | **15/15 pass** against the exact 53-migration local fixture. `canonical-native-retest.log`. No hosted requests/emails. Fixture stopped with volumes retained; original Colima stopped state and default Docker context preserved. |
| Root `npm --prefix apps/portal run test:backend` | **40/40 pass**, 0 fail/skip. `final-backend.log`. |
| Root `npm --prefix apps/portal run check:ui` | Pass at `2539d07`, **11 stylesheets**. `final-ui-check-after-dialog.log`. |
| Root `npm --prefix apps/portal run build` | Pass at `2539d07`, **132 packaged assets**, client/advisor/walkthrough routes; `productionDeploymentChanged:false`. `final-build-after-dialog.log`. Package identities are in [source provenance](PORTAL_SOURCE_PROVENANCE.md). |
| Root `npm --prefix apps/portal test` | **344/344 pass**, 0 fail/skip, at `2539d07`. `final-portal-tests-after-dialog.log`. |
| `git diff --check`, source scope and PR CI | Clean at `2539d07`; independent correction reviews pass, document links resolve and all six copied PNG hashes match. [PR checks](https://github.com/KanujVerma/shelv/pull/209/checks) show current remote status. |

The 18 default-root skips are explicit native PostgreSQL gates, unset for this command:

| Source | Gate | Skipped cases |
| --- | --- | ---: |
| [Reply SQL cases](../tests/concierge-checkin-replies-native.test.ts) | `CONCIERGE_REPLIES_NATIVE_SQL=1` | 3 |
| [Check-in HTTP/SQL case](../tests/concierge-checkins-sql.test.ts) | `CONCIERGE_CHECKINS_NATIVE_SQL=1` | 1 |
| [Confirmed-none and later-plan SQL cases](../tests/concierge-no-current-products-native.test.ts) | `CONCIERGE_NONE_NATIVE_SQL=1` | 6 |
| [Manual-method SQL cases](../tests/concierge-payment-methods-native.test.ts) | `CONCIERGE_METHODS_NATIVE_SQL=1` | 7 |
| [Payment HTTP/SQL case](../tests/concierge-payments-sql.test.ts) | `CONCIERGE_PAYMENTS_NATIVE_SQL=1` | 1 |

Exact case names are retained in `final-root-skips.md` and the results JSON. The separate enabled run used:

```sh
CONCIERGE_REPLIES_NATIVE_SQL=1 CONCIERGE_CHECKINS_NATIVE_SQL=1 CONCIERGE_NONE_NATIVE_SQL=1 CONCIERGE_METHODS_NATIVE_SQL=1 CONCIERGE_PAYMENTS_NATIVE_SQL=1 CONCIERGE_TEST_PG_BIN=/opt/homebrew/opt/postgresql@15/bin node --experimental-strip-types --test --test-concurrency=1 tests/concierge-checkin-replies-native.test.ts tests/concierge-checkins-sql.test.ts tests/concierge-no-current-products-native.test.ts tests/concierge-payment-methods-native.test.ts tests/concierge-payments-sql.test.ts
```

`tests/concierge-checkins-sql.test.ts` and `tests/concierge-payments-sql.test.ts` require the absent legacy socket `/tmp/derive-storage-20261015-01/.s.PGSQL.52819`; their connection prerequisites failed. Those two intended verification paths remain unverified. No historical infrastructure was started or reset. The passing 53-migration/701-assertion/15-native-fixture evidence is separate and does not claim to execute these two cases. The default root command still has 18 skips; the separate 16 passes do not rewrite its result.

## 9. Limitations and remaining decisions

All six independent findings are closed: advisor instruction-authoring basis (P1), refused-history integrity and unsaved schedule date (P2s) at `d79e680`; repeated client product history restoration and uncertain feature intent (P2s) at `163754e`; and shared-dialog restoration affecting an unrelated portal (P2) at `2539d07`. All scoped correction waves have specification/quality PASS. The last fix retains the fresh exact unrelated-markup assertion, scopes restoration to the owning portal, handles blocked native focus without leaving a new tabindex, and preserves sidebar/ownerless fallbacks. No assertion warm-up or normalization hides the effect.

Two full-suite expectation updates follow the new product-page path and Maya's company-voice editorial rationale. Product identity, directions, safety, sources, authorship, source immutability and private-viewer isolation assertions remain. The initial complete portal run exposed these outdated expectations and the real focus side effect; they were corrected before the final rerun.

Missing authored product amounts are not invented. Private walkthrough snapshots without independent account identity retain a truthful fallback; no private snapshot migration was performed. The directory has no global payment/check-in urgency projection. Some long policy sections and compact attention-row spacing may be refined later while preserving meaningful content.

The own-name migration and authentication return-route extension are **local only**. Hosted SQL/application, email callback/allowlist acceptance and a real authenticated private capability journey were not run. No real customer data, provider transaction, purchase, funds, message, permission change, merge or deployment occurred. Generic viewer inspection does not demonstrate actual private-grant access. Human usability outcomes, screen-reader certification, physical/native-device acceptance and exhaustive all-state/all-width coverage are not claimed.

Two optional historical HTTP/SQL cases remain environment-blocked as detailed above. The separate native opt-in command exited 1.

## 10. Commits and PR

Source integration preserves original SHA trailers for the six newer PR 208 commits; [source provenance](PORTAL_SOURCE_PROVENANCE.md) records the mapping. The primary dirty checkout remains untouched.

| Commit | Change |
| --- | --- |
| [e867eba](https://github.com/KanujVerma/shelv/commit/e867eba) | Task-first design/implementation plan and frozen service-browser clock |
| [45b539b](https://github.com/KanujVerma/shelv/commit/45b539b) | Shared UI foundations, dialog lifecycle, tokens, copy and enforcement |
| [457a243](https://github.com/KanujVerma/shelv/commit/457a243) | Destructive hover tone |
| [038f82e](https://github.com/KanujVerma/shelv/commit/038f82e) | Advisor task navigation/history and unfinished-work preservation |
| [fc43ffe](https://github.com/KanujVerma/shelv/commit/fc43ffe) | Desktop account-menu containment |
| [e4baacd](https://github.com/KanujVerma/shelv/commit/e4baacd) | Client navigation, practical guides, exports, own-name projection and auth continuation |
| [d79e680](https://github.com/KanujVerma/shelv/commit/d79e680) | Advisor authoring-basis, refused-history and schedule-draft corrections |
| [163754e](https://github.com/KanujVerma/shelv/commit/163754e03977380f73301cdbeea201650abbf5c1) | Repeated client history restoration, retained feature intent, teardown/late-response fences and practical-use heading refinement |
| [2539d07](https://github.com/KanujVerma/shelv/commit/2539d0729bffcb32318add72575a1e28168a1a9d) | Owner-scoped dialog focus restoration, strict isolation regression and two current UI-contract test expectations |

Application freeze: `2539d0729bffcb32318add72575a1e28168a1a9d`. Documentation records that source; later documentation commits do not change the application package. Target remains [PR 209](https://github.com/KanujVerma/shelv/pull/209), with current CI visible in [PR checks](https://github.com/KanujVerma/shelv/pull/209/checks). No merge or deployment is part of delivery.
