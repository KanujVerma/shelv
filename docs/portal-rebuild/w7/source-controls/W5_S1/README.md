# Original W7-W5-S1 controls

Owner: Kanuj. These two original independent programs are preserved byte-exact, with [byte/hash pins](MANIFEST.json). They are inert review archives, not application modules or a runtime/resource grant.

They originally ran from apps/portal/tests inside W7's immutable4a9 source export. Their relative imports deliberately remain unchanged. Each program failed both cases on4a9. W7 copied the exact same bytes into a reviewed7c5 export and reran them: both cases in each program passed. No assertion was weakened; raw OLD/CURRENT pins are in the review reports.

To reproduce, first prepare an independently reviewed immutable source/dependency projection. Copy these exact files into its apps/portal/tests, beside the original fixed w5-orders-service-payments-helper.mjs. Use explicit Node22.23.0 with --experimental-strip-types --test. The behavioral program writes its own SSR bundle into the projected Portal ignored artifact directory. Do not execute these archives in place, import them into product code, bind a successful live authority facade or treat synthetic HTTP/SSR as genuine Auth/SQL/funds evidence.
