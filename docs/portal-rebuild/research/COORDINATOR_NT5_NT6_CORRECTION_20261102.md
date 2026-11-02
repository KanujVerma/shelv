# Shared session retirement and gateway overflow correction

Owner: Kanuj. 2 November 2026. Author verification only; no Root admission or independent acceptance. Complete preceding candidate: `24d343c367b867dd798c6ad140180e638a780393`. Independent full R5: `0f822783febfc02019ba85fba0fb331c05ea3397`.

## Corrections

**NT5/P2:** the unchanged R5 actual ApplicationSession/cookie probe reproduced1/4, exit1: throwing retirement observers interrupted canonical logout or disposal, and transport callbacks could observe the old current App boundary/private memory. The transport now clears its memory and captures pending work before a denial-only App retirement callback. App retirement drops the captured boundary/snapshot and clears boundary memory before captured invalidation callbacks; each observer failure is isolated. Captured requests are then aborted and transport observers notified independently. Disposal fences the App first, and sign-out still reaches the retained canonical logout. Existing one-argument transport construction retains its default behavior. No callback grants authority or changes the wire.

The unchanged original4 pass4/4. The durable new test preserves those four predicates and adds actual combined boundary/transport/App observer failures and a held actual notification request whose abort observes both private stores retired. Expanded OLD1/6, exit1; CURRENT6/6, exit0. A reentrant snapshot emission stops notifying the obsolete publication when a callback replaces it. Captured cleanup collections prevent a callback's new registrations from being cleared as old work.

**NT6/P2:** the unchanged R5 actual gateway/native Request probe reproduced1/4, exit1. Gateway overflow now requests cancellation without awaiting its completion, observes rejection, and preserves413/`too_large` even when cancellation rejects or throws. Limits, actual route validation, JSON validation and Vault authority remain unchanged. The original4 pass4/4. Added exact8192-byte command, exact8192 UTF8 non-command and8193-byte rejected-cancellation controls give expanded OLD3/7, exit1; CURRENT7/7, exit0. The only Vault dispatch is the explicit negative exact-limit command control; oversized cases dispatch zero times. A cancellation request is not proof of physical cleanup completion.

These are bounded source/finite synthetic HTTP/native stream and deliberate observer proofs. Naturally mounted throwing callbacks, ordinary-network reachability, genuine private disclosure and native cleanup are unproved.

## Current verification

Explicit Node22.23.0, actual installed TypeScript6.0.3/declarations, no source overlays. Counts overlap and are not a full-suite total. Passing test groups have zero skips/cancellations.

| Scope | Observed result |
| --- | --- |
| Unchanged NT5 / NT6 originals | OLD1/4 each, exit1; CURRENT4/4 each, exit0 |
| Expanded named NT5 / NT6 | OLD1/6 and3/7, exit1; CURRENT6/6 and7/7, exit0 |
| Physical new NT3-NT6 files |30/30, exit0 |
| Physical App/session/state/ports/render/start/callback/care/continuation/preview/foundation/cookie regressions |184/184, exit0 |
| Physical notification entry original19 plus NEI1 successor4 |23/23, exit0; entry-local R2 acceptance remains separate |
| Selected retained shared regressions |70/70, exit0 |
| Actual physical closed notification/Auth/Vault/provider/session group |52/52, exit0, including the real12-second deadline |
| Unchanged inventory group |33/33, exit0 |
| Original SD1 / NT2 / AAS5 / NT1 current |5/5,4/4,4/4,3/3, all exit0; NT1 retains actual12 seconds |
| Actual physical Root app/test/frontend/session typechecks |all exit0 |
| Strong controls |2/2; adapter graph clean, separate Workers differential44 baseline/44 current/0 introduced, not a clean standalone Workers graph |
| Browser-target main/public compiler, write:false |main2246 inputs/15 outputs, only application.js changes; public2177 inputs/3 outputs, all outputs exact, no live factory/endpoint/fetch |

An initial closed-notification replay used the earlier116-source fixture. Although its argv named four tests, that fixture contained only the two JavaScript files; Node reported39/39. It is preserved as partial fixture evidence. The subsequent physical four-file invocation above verifies52/52, with all four real files. The first expanded NT6 OLD/current attempt had a misplaced stdin source import and failed setup0/1 on both; only that source-root binding was corrected, preserving every assertion. An initial SD1 repeat passed its five cases but its exclusive evidence hook hit EEXIST; raw failure is preserved. Fresh exact SD1/NT2 homes and an NT1 output-directory-only relocation avoided collisions. Original NT1 cwd binding, provider deadline and all predicates remain unchanged. No raw failure is called green.

The unchanged inventory-only witness remains12/14 under this combined source. R5 explicitly dispositions its stale preservation premises; no witness assertion was changed, waived or relabeled PASS. All earlier SD1/NT1/AAS5/NT2/decoder/NT3/NT4 OLD/current distinctions remain required inputs to fresh review.

## Custody and delivery

Exactly three production paths, two new regression tests and this report are authored. The own coordinator base is `482f1d5e6277dc3365e3d92156eaa3ca862537ae`; it also contains separately attributed notification entry input/correction and SMTP/shared transport input ancestors. Do not import the whole branch. The complete shared successor is the preceding45-path target union plus these paths, including the actual App session source; notification entry is a separately reviewed dependency.

Dependency custody uses the existing lawfully acquired own APFS clones: complete43213 root/9071 portal entry byte/mode/literal-link inventories, packages, four physical root/portal locks and separate runtime lock. All91 tracked runtime files retain their respective immutable preimages except this explicitly authored gateway policy change. Correction to the preceding author report's prose: its own full runtime manifest contains **five**, not six, historical differing runtime rows (client-policy, client-upstream, gateway, policy, upstream). The full manifest was correct; six authorized Root projection postimages was a separate count. R5 independently verified the five-row qualification. No install or foreign generated runtime was used.

Own execution and raw receipts are in the authorized integration checkout's ignored `.local-artifacts/portal-rebuild/continuation-20261102/nt56-correction/`; compiler proof is in the coordinator's ignored `.local-artifacts/nt56-correction-20261102/`. Terminal complete own/Root dependency parity passes43213/9071, packages/locks and runtime91 match their declared preimages, and all2180 baseline tracked files except the three allocated production changes retain exact bytes/modes. The first terminal comparison scaffold omitted the file byte-count field and stopped; the complete-record comparison above passes without changing any dependency. Exact final candidate and custody are recorded separately to avoid self-reference.

NEW complete independent shared R6 must review the complete combined source and original requirements/history, not only these two findings. No Root admission before that review and actual Root preimage/current composition checks. Entry, photo consumer-v2/current collection, Account producers/consumers, final private egress, genuine Auth/SQL/RLS/Storage/provider/delivery, full npm/Expo/portal packaging, browser/visual/a11y/human/all26/D01-D48, exact-head CI and release gates remain open. No resource, SQL, browser, listener/server, provider/client message, funds/order/permission change, deployment or production action occurred.
