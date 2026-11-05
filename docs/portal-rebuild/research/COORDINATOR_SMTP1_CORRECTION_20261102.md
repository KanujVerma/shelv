# SMTP1 coordinator source correction

Owner: Kanuj. 2 November 2026. Original candidate: `107a0678c58add60a3b47655ada49d3bb47f243d`. Independent R1: `374539c27e4064cca13fd70f7cdab93d3882fd31`, `W7_NOTIFICATION_MAILPIT_ADAPTER_SOURCE_R1.md`.

The coordinator reproduced SMTP1 in this session using the unchanged independent five-case boundary probe. Deadline expiry at either final pre-write guard returned `uncertain` despite zero body socket writes. OLD: 3/5, exit1.

The correction marks dispatch inside the private write helper, immediately after its final guard and immediately before the actual body socket-write invocation. Ordinary protocol commands never set it. Synchronous throws and failures after a body attempt remain uncertain. The absolute deadline, revalidation calls, parser, cleanup, neutral codec and worker interface are unchanged.

The original five-case probe is retained byte-for-byte as `tests/portal-notification-mailpit-dispatch-boundary.test.ts`. It exercises the actual adapter through the original finite VM transcript harness, including both zero-body-write expiry cases, live acceptance, earlier expiry and post-body uncertainty. CURRENT: 5/5, exit0. The unchanged author suite passes29/29; the unchanged six retained notification files pass39/39. Focused TypeScript6.0.3 checks with strict, noUncheckedIndexedAccess, verbatimModuleSyntax, skipLibCheck=false and actual declarations return zero diagnostics.

All execution used explicit Node22.23.0 and an own ignored fixture under the authorized integration checkout. Its18 immutable source inputs were materialized from Git and checked against the R1 manifest. Only the exact executed independent probe was copied; no foreign artifact was executed and no dependency was installed or cloned. Raw OLD/current logs, argv, exits, source hashes and input custody are preserved in `.local-artifacts/portal-rebuild/continuation-20261102/smtp-fix/` in the integration checkout.

The coordinator checkout's `09cf6dad2e7d6a3ff24e20e75c743401bb7b4706` is attributed INPUT materialization of the original three files, not authored production or Root admission. Deliver the correction suffix and its exact complete postimage for a new full independent R2. The original R1 failure remains unchanged. No self-acceptance or actual socket/delivery claim follows these checks.

Open: complete independent adapter review including held regressions/types, trusted worker fixed-context/deadline and adapter-union integration, local URL/configuration custody, reviewed native executor and exact execution authority, actual Mailpit queue acknowledgment/no-relay proof, authenticated notification/App flows, browser/full-product/CI and release acceptance. No resources, SQL, client communication, provider, deployment or money actions occurred.
