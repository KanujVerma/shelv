# care application composition checkpoint

Owner: Kanuj. 31 October 2026. Source seam only; actual Application still defaults to v1. Care activation and genuine browser acceptance remain pending.

The app factories now accept explicit `{care:true}` and create the existing audience-bound `createClientCarePort` or `createAdvisorCarePort`. Legacy callers retain their default v1 composition. No second transport/parser, fallback or new action was added. The controller can select v2 on its first read with the already-pinned `readVersion:2` option. It preserves the confirmed v2 view on 409/503 and never falls back to a Start-only read. Advisor ports retain their finite advisor-only action set.

Meaningful pre-production RED: new four-case actual session/cookie/factory/controller test had1 pass/3 intended failures because the explicit care ports were absent. After the bounded factory change: all4 new plus12 retained care-port/controller tests pass (16/16), strict frontend typecheck exits0. Synthetic finite HTTP supplies DTOs; actual cookie factories, transport, Root mappers and client controller execute. No browser, Auth, SQL or actual application-first-load claim follows. Logs: ignored `app-care-composition-{red,green}.log`.

Next composition owns Application.tsx/PublicationAudit.tsx only as needed: explicitly select v2 client first read, support report-use/product-use routes, preserve shared renderer/actual access/readonly and exact fetched-basis recovery; canonical advisor publication read must use v2 after care events and must never fabricate ClientPlanView entitlement. Add real application browser regressions after the current independent CU3 reviewer releases Chrome, then genuine care acceptance with a new explicit R7 grant. Do not treat component harnesses or the factory seam as that result.

Backend CN1 is independently addressed by M57. Parent fresh R7 reset57 and canonical35files/796assertions pass; official advisor SQL securityWARN/ERROR0. Source snapshots, credentials and resource custody remain separately recorded. No production activation, deployment, merge or live action.
