# Shared transport retirement reentrance correction

Owner: Kanuj. 2 November 2026. Author evidence only; complete independent R7 and Root composition remain required. Full R6 `d7e4124d2a1d554ead16d236323ebb69d30b7fe8` reviews preceding shared candidate `a90b9ef5290953acfc24a159b78ab6758bb109e7` and reports inherited NT7/P2.

## Cause and correction

`sessionChanged()` previously invalidated on every read while signedout or missing identity, even after recording the changed owner/generation. An ordinary invalidation observer reading already-cleared `transport.memory` therefore notified itself recursively. R6 demonstrated stack exhaustion/one interrupted observer continuation while canonical logout still reached the endpoint; no private/authority gain or naturally mounted consumer was proved.

The transport now records the observed owner/generation/role/audience and signedout transition before invalidating. Repeated reads of the same retired binding do not restart notification. Synchronous nested invalidation is also fenced for the duration of captured cleanup/notification, with the fence released in `finally`. A genuinely later binding change still retires memory and requests. These cached fields trigger retirement only: operation access, actual cookie/lease/READY/capability/signal/relevance/private-return checks remain authoritative and unchanged. Offline continuity is preserved. No generic framework, permission callback, wire, RPC, timeout or UUID/CAS change is added.

## Executed evidence

Explicit Node22.23.0. Passing groups have zero skips/cancellations; counts overlap.

| Scope | OLD | CURRENT |
| --- | --- | --- |
| Exact guarded, unguarded and stack-observation probes |0/3, exit1 |3/3, exit0; no reentry/errors, cleared memory/null boundary and canonical logout |
| New named regression5 |0/5, exit1 |5/5, exit0 |
| R6 four actual App supersession/disposal/held READ+WRITE replacement controls |R6 PASS attributed |4/4, exit0 |
| Physical NT3-NT7 regression group |Earlier scopes remain separate |35/35, exit0 |
| Selected retained first-lease/denial/abort/transport/final-return/decoder group |Earlier OLD matrices remain separate |70/70, exit0 |
| Physical App/session/state/ports/render/start/callback/care/continuation/preview/foundation/cookie group |R6 PASS attributed |184/184, exit0 |
| Physical notification entry group |Separate R2 scoped PASS |23/23, exit0 |
| Actual closed notification/provider/authority/session group |Earlier source matrices remain separate |52/52, exit0, actual12-second provider deadline |
| Inventory transport |Earlier OLDs remain distinct |33/33, exit0, actual provider deadline |
| Actual configured coordinator app/test/frontend/session types |See type-only qualification below |all four exit0, actual TypeScript6.0.3/declarations, no source overlays |
| Strong controls |44 Workers baseline diagnostics remain |2/2, exit0; adapter clean, Workers44 baseline/44 current/0 introduced, not a clean standalone Workers graph |
| Main/public browser-target compiler, write:false |Exact a90 generic-source preimage comparison |main2246 inputs/15 outputs, only application.js changes; public2177/3 all outputs exact, no live factory/endpoint/fetch |

The durable new file retains the three original registrations and identical shared helper, with one relative-import binding. Two appended registrations require no new notification on repeated signedout reads and proper retirement of a later actual cookie binding B. A guard-only fix would still fail the repeated-read predicate; globally suppressing later retirement would fail the B predicate. Real ApplicationSession/cookies/native Responses and actual signal/ports execute; successful authority/currentness substitutes are not used.

The configured test graph initially found one unrelated type error in the new profile regression: its local read literal widened to strings. The separate type-only follow-up `762bdb39` supplies the actual command type using `satisfies`; TypeScript emits byte-identical JavaScript, all inputs/predicates are unchanged and the test graph then passes. Original profile tests/producer behavior are untouched. This failed compiler receipt is preserved, not called green. The coordinator also contains separately attributed exact INPUT5 `5115a729`: two type-only kernel files and three frozen b8 Source contract/values/validator files. They are genuine immutable dependencies, not substitute declarations. No held Source kernel implementation, SQL migration, index, route or Root Source activation was imported. These are physical coordinator checks, not physical integrated Root acceptance.

R6's original SD1/NT1/AAS5/NT2/decoder/NT3-NT6 OLD/current matrices remain required full-review inputs. Their raw failures, NT1 EEXIST/output-only replay, partial39-versus-physical52, and inventory-only witness12/14 are not relabeled green or waived. This correction changes no historical assertion/pin. The fresh R7 must inspect the complete combined source and all prior history, not only NT7 or selected groups.

## Custody and remaining gates

Only generic `transport/session.ts`, the new regression file and this report are authored. Complete shared target union is51 paths (prior49 plus test/report); unrelated profile/credential/Source-type/entry/SMTP input ancestors are not shared delivery. Individually copied original probes are hash-recorded before execution; no foreign artifact, whole archive or generated runtime is executed/copied. Existing same-lock APFS dependencies and all protected tracked files are verified separately; final manifests/commit are kept outside this report to avoid self-reference.

Terminal full own/Root dependency parity passes43213/9071. Packages/locks/runtime91 are exact. All2210 starting coordinator files except the allocated transport change preserve bytes/modes; all2166 pre-projection Root files except the allocated journal witness remain exact, including all66 old migrations/121 SQL. Original handoff bytes match the archived source. Own execution is coordinator `.local-artifacts/nt7-correction-20261102/`; raw argv/cwd/true exits/SHA, complete target/probe correspondence and custody are in authorized integration `.local-artifacts/portal-rebuild/continuation-20261102/nt7-correction/`. The old-source compiler plugin selects only the exact Git preimage for comparison; the current graph reads actual source, write:false. No declaration/flag/config weakening or dependency acquisition occurs.

No shared Root admission, endpoint/channel/Account/notification mount, genuine Auth/SQL/RLS/Storage/provider/delivery, browser/visual/a11y/human, full-product/CI/release acceptance follows. Profile and credential work are separate candidates; their checks cannot accept the shared current composition or Source final authority. Source SK2/SK3/SK4, native NE5/NE6-S1, photo current-consumer/collection/private-byte and Account/export/departure/financial gates remain. Guidance/M65 refusals stay held without reroute. No stopped fixture is queried/reused/reset. This NT7 verification uses no server, DB/Auth/Storage/provider fixture or browser; the separate Root profile full unit run may exercise its existing owned closed synthetic loopback HTTP test, without genuine services.
