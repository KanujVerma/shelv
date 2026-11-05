# Combined notification transport NT3 and NT4 correction

Owner: Kanuj. 2 November 2026. Complete frozen input: `bc5651e6b27cd433851a779e57fc02e8f6a433d2`. Independent R4 report: `9a0a37a28e0e13391df4a255bcc62adfaab32f62`. This is coordinator author evidence, not independent acceptance or Root admission.

## Corrections and failing-old/passing-new proof

NT3: the notification facade returned after its own await with only identity/capability checks. The unchanged independent real ApplicationSession/cookie/native Response/Root-codec probe reproduced OLD6/12, exit1. The facade now captures the actual caller signal and local relevance predicate once, checks READY at decode/private return, and repeats actual relevance and caller/lifetime abort checks after the transport await. The same original12 pass12/12. Known end/capability controls remain401/403; local relevance, cancellation and suspension remain503. WRITE uncertainty retains the actual original command.

NT4: the notification bounded body reader could await a stalled body after caller cancellation. The unchanged original notification/inventory probe reproduced OLD1/2, exit1. The notification reader now observes its actual operation signal, requests reader cancellation at most once, and checks cancellation/relevance around body reads and before decode. Listener removal and reader release are finalized separately. The original2 pass2/2. Three additional real native-stream cases cover pending, rejected and throwing underlying cancellation: expanded OLD1/5, exit1, CURRENT5/5, exit0. Prompt refusal and observed cancellation requests do not prove underlying cleanup completed.

The two durable new regression files preserve every original predicate and input; only their three relative imports follow relocation into `tests/`. The additional three stream cases are appended. Deliberate cleanup instrumentation establishes bounded source robustness, not naturally occurring mounted-browser reachability or genuine private disclosure.

## Executed current checks

All commands selected explicit Node22.23.0. Counts overlap and are not a unique full-suite total. Passing groups have zero skips/cancellations.

| Scope | Observed result |
| --- | --- |
| Original NT3 / original NT4 |12/12 and2/2, exit0; original OLD6/12 and1/2 remain failures |
| Named actual physical regression files |17/17, exit0 |
| Unchanged inventory transport |33/33, exit0, including the actual12-second provider case |
| Selected unchanged first-lease, denial, NT2, decoder and notification controls |58/58, exit0 |
| Original SD1 / original NT2 |5/5 and4/4, exit0 |
| Original AAS5 current |4/4, exit0 after materializing its exact three pinned verification-consumer files; initial missing-module setup failure preserved |
| Original NT1 current |3/3, exit0, actual12-second deadline. Initial original-owner cwd setup failure remains; the replay changes only that one expected cwd literal. |
| Actual physical application/test/frontend/session typechecks |all exit0, with actual installed TypeScript6.0.3/declarations and no source overlays |
| Existing strong compiler controls |2/2. Adapter graph is clean; the separate Workers graph control asserts unchanged baseline diagnostics/no introduced errors, not a clean combined standalone Workers graph. |
| Actual browser-target main/public compiler, write:false |main2246 inputs/15 outputs before and after, only application.js differs; public2177 inputs/3 outputs, every output exact. No live factory/endpoint/fetch appears in public emitted code. |

These own-coordinator graph counts are not the later Root composition or full-product build. No executable bundle or browser was run for this correction.

The original inventory-only source witness is not changed or waived. Its earlier bc result was13/14; this combined correction is12/14: the pre-existing generic-byte assertion and the newly changed notification portion of advisor-cookie-session no longer satisfy an inventory-only erasure premise. Both exact failures/raws remain. An independently approved compatible successor or explicit current-scope disposition is required; neither result is called green.

## Custody and delivery

`9e8d39b7bbb235ffb510c0e85272e7245f3d0d14` is attributed materialization of the42 named input targets, with35 changed paths because seven were already exact in the8af-derived coordinator. It is not authored production and must not be blindly imported. Only the two production corrections, two new tests and this report are authored. Original SMTP input/correction ancestors are also separate from this delivery.

Own executed fixtures contain116 immutable candidate source inputs, exact original probes, and only the three pinned AAS5 verification-consumer inputs when needed. Original raw files are hashed in place; no foreign artifact or recursively copied evidence archive is executed. The loader changes only its own dependency-root literal. Both same-lock APFS dependency trees passed complete43213/9071 byte/mode/literal-link parity before probing; packages, four physical root/portal locks and the separate runtime lock were checked. All91 tracked runtime files match their respective immutable Root/prepared-candidate inputs; six declared transport inputs differ, not generated runtime. No install, shim, declaration/flag reduction, global configuration change or foreign runtime was used.

The four formerly overlaid compiler prerequisites are already byte-exact physical source in this coordinator and current Root. Physical typecheck success above uses those real files, not a getSourceFile overlay. The first dependency preflight stopped before any copy because an absent directory was checked without its required slash; directory-qualified ignore checks passed unchanged ignore rules. That setup failure remains recorded.

Raw commands, exits, source hashes, original/copied/probe correspondence, dependency inventories and compiler proofs are under `.local-artifacts/portal-rebuild/continuation-20261102/nt34-correction/` in the authorized integration checkout, with the actual main/public proof in the coordinator's ignored `.local-artifacts/nt34-correction-20261102/`.

NEW complete independent shared transport/inventory/notification R5 must examine the entire combined postimage and all SD1/NT1/AAS5/NT2/decoder/NT3/NT4 requirements, including raw/current compatibility distinctions and actual physical graphs. Photo consumer-v1/v2, notification entry, Account, Root mounting, genuine Auth/SQL/Storage/delivery, full browser/visual/a11y/human/CI and release gates remain separate. No resource fixture, SQL, provider, client communication, funds, permission change or deployment occurred.
