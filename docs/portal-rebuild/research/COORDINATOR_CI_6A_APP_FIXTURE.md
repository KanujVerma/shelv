# CI6a: current App fixture and clean output-hook diagnosis

Owner: Kanuj. 1 November 2026 UTC. The published draft PR211 head is6a10f5be9412db75cc815f2b35e25ba7e737ecf9. Portal run41291591668/job124803784660 failed the package step:2497 registrations,2484 pass,13 fail,0 skip/cancel. Later Portal steps were skipped. This is not whole-job or release acceptance.

The previously failing first2550-scope case now passes in Linux,6980.7578ms total. Its original5000ms post-click notice wait is unchanged. The safe artifact records the same active commit3/instance5 accepting2550 entries with0 details before the actual click. Node observation times2981.418848ms then3043.498234ms, and Page1940.4ms then2000.3ms, are separate origins. Terminal loading0/paused51/dialog1/notice1 has no capture/root/page errors. The51st paused element is the opened overlay duplicate of50 canonical facts.

## Exact failed groups

Twelve failures are in apps/portal/tests/rebuild-app-browser.test.mjs. Each rejects an unexpected POST /api/client/reviews read_client_plan_v3. The fixture serves only legacyPlan1 and Care2, while the staged actual Application now selectsV3. The client decision/read case also still asserts legacy action-version identifiers. The current fixture must model the real typed V3 route and coherent DTOs; this observation does not justify changing production back toCare2, deleting assertions, or broadly accepting unknown routes.

The affected tasks are public/unknown plus authenticated PKCE callback, client read/decision/navigation, direct preview/responsive denied views, late read/logout, actual stop/reload, read-only actual-use, and six first-read403/409/503 product-use/report-use recovery cases. In the public-entry test, the unexpected authenticated read occurs in its later callback portion; the title alone is not evidence of a pre-authentication privacy leak.

One additional failure is the after-hook in rebuild-app-v3-history-ch6.test.mjs. All20 assertions execute, then writeFile fails because .local-artifacts/portal-rebuild/w0-ch6 does not exist in a clean checkout. Prior local/reviewer runs explicitly created their own output directory and therefore did not establish a hermetic hook. The CI failure is retained rather than being relabeled a clinical/transport failure.

## Hook correction and meaningful regression

Coordinator owns only the CH6 hook correction; the new isolated fixture worker owns the separate App-browser model. An own Node loader changes only the existing hook output URL into an absent own directory, preserving production imports, data and all74 assertion-call texts. Before the edit, the unchanged file gives20 pass plus one ENOENT hook failure. After importing mkdir and creating that exact output parent before writeFile, the same command gives20/20,0 fail/skip/cancel. No assertion, timeout, ordering requirement or application behavior changes. Existing historical observations are not deleted or overwritten.

The fixture worker is source-only initially. It must preserve the original cases and security/recovery predicates, adapt only explicitly obsolete wire-version expectations, validate synthetic current DTOs through actual Root parsers/mappers, and produce a clean source checkpoint and finite plan before a new browser grant. No production, permissions, auth/session, navigation, Source or backend change is allocated. Parent will assess any actual current product finding separately.

## Preserved CI and artifact provenance

- Complete failed log:2310473 bytes/SHA2566767bece3bab3369d74d7ca8f9c12e3947ca02483ad79cb5e87a7186d70133a4.
- Artifact13078390002, ZIP293411 bytes/SHA256724100bab818fb0cfa5dee271f1d6691076fd90100eb7c5b53f2de4043e24b32. Exactly four regular bounded members under one budget2550-EXOyvl directory: state.json,trace.json,source.json,page.png; traversal/symlink/size/CRC checks passed.
- Actual executed merge b38e022518b0063a2578f65b1273d702bfe80d12 and published6a share Git tree9bf92a8023f77b78c3c2c423d793b699b7bb0c90, verified through the GitHub API.
- Actual instrumented2202-input/10-output artifact has inputHash24a2db4a1135b5d83385d2673dfd255c592bd51dc72563671f3e424f32ec037d and preparedHash63b487a47646c4640eabcaab8bf19ebec6b3dc6e216c3cd8455e05eef1db7d38, exactly the independently reviewed current-observed graph.463 trace events/0 drops preserve acceptance/click/detail ordering.

Private ignored evidence is under .local-artifacts/portal-rebuild/ci-6a10f5be/: original log/archive, FAILURES.json, ARTIFACT-INSPECTION.json, TRACE-READINESS.json, hook before/after source hashes/logs and HOOK-REGRESSION.json. The first CLI request used an unsupported artifacts JSON field and produced no log; corrected CLI/API reads preserved the actual files. The first extractor expected a synthetic/ prefix unconditionally and rejected a legitimate two-component member before extracting anything. The same unchanged ZIP was then validated with the exact one-case/four-member allowlist. These are setup qualifications, not product RED or malformed artifact evidence.

No current full CI pass, ordinary App acceptance, Source activation, genuine/financial/backend proof or release is claimed. No local browser, preview, process inventory, native/Auth/DB/Storage/provider/R9 resource or live action was acquired for this diagnosis and source hook check. PR watching is stopped during correction; a new exact-head CI run follows the reviewed fixture correction.
